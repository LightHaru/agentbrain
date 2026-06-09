"use strict";
/**
 * Vector Memory — Embedding-based semantic memory recall
 *
 * Replaces keyword-based recall with vector similarity search.
 * Uses OpenClaw's embedding cache (SQLite + embeddinggemma-300m)
 * and maintains its own vector index for AgentBrain memories.
 *
 * Architecture:
 * - Stores memory embeddings in AgentBrain's own SQLite DB
 * - Computes cosine similarity for recall
 * - Falls back to keyword matching when embeddings unavailable
 * - Batch embeds new memories during heartbeat/idle
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorMemory = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const embedding_engine_js_1 = require("./embedding-engine.js");
const entity_matcher_js_1 = require("./entity-matcher.js");
// ============================================================================
// Simple TF-IDF Embedder (fallback when no cached embedding available)
// ============================================================================
class SimpleEmbedder {
    vocabulary = new Map();
    idf = new Map();
    dims;
    constructor(dims = 768) {
        this.dims = dims;
    }
    /**
     * Build vocabulary from corpus of texts
     */
    buildVocabulary(texts) {
        const docFreq = new Map();
        const allTerms = new Set();
        for (const text of texts) {
            const terms = this.tokenize(text);
            const uniqueTerms = new Set(terms);
            for (const term of uniqueTerms) {
                allTerms.add(term);
                docFreq.set(term, (docFreq.get(term) || 0) + 1);
            }
        }
        // Assign indices to top terms (limited to dims)
        const sortedTerms = [...allTerms]
            .sort((a, b) => (docFreq.get(b) || 0) - (docFreq.get(a) || 0))
            .slice(0, this.dims);
        this.vocabulary.clear();
        this.idf.clear();
        for (let i = 0; i < sortedTerms.length; i++) {
            const term = sortedTerms[i];
            this.vocabulary.set(term, i);
            this.idf.set(term, Math.log(texts.length / (docFreq.get(term) || 1)));
        }
    }
    /**
     * Compute TF-IDF vector for text
     */
    embed(text) {
        const vec = new Float32Array(this.dims);
        const terms = this.tokenize(text);
        const termFreq = new Map();
        for (const term of terms) {
            termFreq.set(term, (termFreq.get(term) || 0) + 1);
        }
        for (const [term, freq] of termFreq) {
            const idx = this.vocabulary.get(term);
            if (idx !== undefined) {
                const tf = freq / terms.length;
                const idf = this.idf.get(term) || 0;
                vec[idx] = tf * idf;
            }
        }
        // L2 normalize
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < vec.length; i++) {
                vec[i] /= norm;
            }
        }
        return vec;
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }
    hasVocabulary() {
        return this.vocabulary.size > 0;
    }
}
// ============================================================================
// Vector Memory Store
// ============================================================================
class VectorMemory {
    config;
    db = null;
    openclawDb = null;
    embedder;
    memoryEmbeddings = new Map();
    embeddingEngine = (0, embedding_engine_js_1.getEmbeddingEngine)();
    entityMatcher = new entity_matcher_js_1.EntityMatcher();
    entityCache = new Map();
    brainDb = null;
    constructor(config = {}, brainDb) {
        this.config = {
            dbPath: config.dbPath || './brain/vector.db',
            openclawDbPath: config.openclawDbPath || (0, node_path_1.join)(process.env.HOME || '~', '.openclaw/memory/main.sqlite'),
            dims: config.dims || 768,
            maxResults: config.maxResults || 10,
            minSimilarity: config.minSimilarity || 0.5,
        };
        this.embedder = new SimpleEmbedder(this.config.dims);
        this.brainDb = brainDb || null;
    }
    /**
     * Initialize: open DBs, load existing embeddings
     */
    async initialize() {
        // Ensure directory exists
        const dir = (0, node_path_1.dirname)(this.config.dbPath);
        if (!(0, node_fs_1.existsSync)(dir)) {
            (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        }
        // Open AgentBrain's vector DB
        this.db = new better_sqlite3_1.default(this.config.dbPath);
        this.db.pragma('journal_mode = WAL');
        // Create tables
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_vectors (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        embedding BLOB,
        embedding_source TEXT DEFAULT 'tfidf',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_mv_type ON memory_vectors(type);
    `);
        // Try to open OpenClaw's embedding cache (read-only)
        if ((0, node_fs_1.existsSync)(this.config.openclawDbPath)) {
            try {
                this.openclawDb = new better_sqlite3_1.default(this.config.openclawDbPath, { readonly: true });
                console.log('[VectorMemory] Connected to OpenClaw embedding cache');
            }
            catch (e) {
                console.log('[VectorMemory] Could not open OpenClaw DB, using TF-IDF only');
            }
        }
        // Load existing embeddings into memory
        await this.loadEmbeddings();
        console.log(`[VectorMemory] Initialized — ${this.memoryEmbeddings.size} vectors loaded`);
    }
    /**
     * Multi-signal recall: combines embedding similarity, BM25, and entity matching
     * Score = 0.5 * embedding_similarity + 0.3 * bm25_score + 0.2 * entity_match_score
     */
    async recall(query, memories, topic) {
        // Extract entities from query
        const queryEntities = this.getEntities(query);
        // Get BM25 scores if brainDb is available
        const bm25Results = this.brainDb ? this.brainDb.bm25Search(query, memories.length) : [];
        const bm25Map = new Map(bm25Results.map(r => [r.id, Math.abs(r.bm25_score)]));
        const maxBm25 = Math.max(...Array.from(bm25Map.values()), 1);
        // Tier 1: Try EmbeddingEngine (Transformers.js)
        let queryVec = await this.embeddingEngine.embed(query);
        let method = 'vector';
        if (!queryVec) {
            // Tier 2: Try OpenClaw cache
            queryVec = this.getOpenClawEmbedding(query);
        }
        if (!queryVec) {
            // Tier 3: Fallback to TF-IDF
            if (!this.embedder.hasVocabulary()) {
                // Build vocabulary from all memories
                this.embedder.buildVocabulary(memories.map(m => m.content));
            }
            queryVec = this.embedder.embed(query);
            method = 'hybrid'; // TF-IDF is less accurate
        }
        // Score all memories with multi-signal approach
        const results = [];
        for (const memory of memories) {
            // Signal 1: Embedding similarity
            let memVec = this.memoryEmbeddings.get(memory.id);
            if (!memVec) {
                // Tier 1: Try EmbeddingEngine
                memVec = await this.embeddingEngine.embed(memory.content) || undefined;
                if (!memVec) {
                    // Tier 2: Try OpenClaw cache
                    memVec = this.getOpenClawEmbedding(memory.content) || undefined;
                }
                if (!memVec) {
                    // Tier 3: TF-IDF fallback
                    memVec = this.embedder.embed(memory.content);
                    method = 'hybrid';
                }
                // Cache it
                if (memVec) {
                    this.memoryEmbeddings.set(memory.id, memVec);
                }
            }
            let embeddingSimilarity = 0;
            if (memVec && queryVec) {
                embeddingSimilarity = this.cosineSimilarity(queryVec, memVec);
            }
            // Signal 2: BM25 score (normalized to 0-1)
            const bm25Raw = bm25Map.get(memory.id) || 0;
            const bm25Normalized = maxBm25 > 0 ? bm25Raw / maxBm25 : 0;
            // Signal 3: Entity matching
            const memoryEntities = this.getEntities(memory.content);
            const entityScore = this.entityMatcher.matchScore(queryEntities, memoryEntities);
            // Combine signals: 0.5 * embedding + 0.3 * bm25 + 0.2 * entity
            const combinedScore = (0.5 * embeddingSimilarity +
                0.3 * bm25Normalized +
                0.2 * entityScore);
            // Additional boosts
            const recencyBoost = Math.max(0, 0.05 - this.daysSince(memory.lastAccessed) * 0.005);
            const confidenceBoost = memory.confidence * 0.1;
            const topicBoost = (topic && memory.tags.includes(topic)) ? 0.15 : 0;
            const finalScore = combinedScore + recencyBoost + confidenceBoost + topicBoost;
            if (finalScore >= this.config.minSimilarity) {
                results.push({ memory, similarity: finalScore, method });
            }
        }
        // Sort by similarity, return top N
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, this.config.maxResults);
    }
    /**
     * Index a new memory (compute and store embedding)
     * 3-tier fallback: EmbeddingEngine → OpenClaw cache → TF-IDF
     */
    async indexMemory(memory) {
        // Tier 1: Try EmbeddingEngine
        let vec = await this.embeddingEngine.embed(memory.content);
        let source = 'transformers';
        if (!vec) {
            // Tier 2: Try OpenClaw cache
            vec = this.getOpenClawEmbedding(memory.content);
            source = 'openclaw';
        }
        if (!vec) {
            // Tier 3: TF-IDF fallback
            if (this.embedder.hasVocabulary()) {
                vec = this.embedder.embed(memory.content);
                source = 'tfidf';
            }
        }
        if (vec) {
            this.memoryEmbeddings.set(memory.id, vec);
            // Persist to DB
            if (this.db) {
                const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO memory_vectors (id, content, type, embedding, embedding_source, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
                stmt.run(memory.id, memory.content, memory.type, Buffer.from(vec.buffer), source, memory.timestamp, new Date().toISOString());
            }
        }
    }
    /**
     * Batch index all memories (call during heartbeat)
     */
    async indexAll(memories) {
        // Rebuild TF-IDF vocabulary for fallback
        this.embedder.buildVocabulary(memories.map(m => m.content));
        // Filter memories that need indexing
        const toIndex = memories.filter(m => !this.memoryEmbeddings.has(m.id));
        if (toIndex.length === 0)
            return 0;
        // Try batch embedding with EmbeddingEngine first
        const embeddings = await this.embeddingEngine.embedBatch(toIndex.map(m => m.content));
        let indexed = 0;
        for (let i = 0; i < toIndex.length; i++) {
            const memory = toIndex[i];
            let vec = embeddings[i];
            let source = 'transformers';
            if (!vec) {
                // Tier 2: Try OpenClaw cache
                vec = this.getOpenClawEmbedding(memory.content);
                source = 'openclaw';
            }
            if (!vec) {
                // Tier 3: TF-IDF fallback
                vec = this.embedder.embed(memory.content);
                source = 'tfidf';
            }
            if (vec) {
                this.memoryEmbeddings.set(memory.id, vec);
                // Persist to DB
                if (this.db) {
                    const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO memory_vectors (id, content, type, embedding, embedding_source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
                    stmt.run(memory.id, memory.content, memory.type, Buffer.from(vec.buffer), source, memory.timestamp, new Date().toISOString());
                }
                indexed++;
            }
        }
        return indexed;
    }
    /**
     * Remove a memory from the index
     */
    removeMemory(memoryId) {
        this.memoryEmbeddings.delete(memoryId);
        if (this.db) {
            this.db.prepare('DELETE FROM memory_vectors WHERE id = ?').run(memoryId);
        }
    }
    /**
     * Get or compute entities for text (with caching)
     */
    getEntities(text) {
        const cached = this.entityCache.get(text);
        if (cached)
            return cached;
        const entities = this.entityMatcher.extractEntities(text);
        this.entityCache.set(text, entities);
        // Limit cache size
        if (this.entityCache.size > 1000) {
            const firstKey = this.entityCache.keys().next().value;
            if (firstKey !== undefined) {
                this.entityCache.delete(firstKey);
            }
        }
        return entities;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            indexed: this.memoryEmbeddings.size,
            openclawCacheHits: this.openclawDb ? 1 : 0,
            dims: this.config.dims,
            embeddingEngine: this.embeddingEngine.getModelInfo(),
            entityCacheSize: this.entityCache.size,
        };
    }
    /**
     * Shutdown: close DBs
     */
    shutdown() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        if (this.openclawDb) {
            this.openclawDb.close();
            this.openclawDb = null;
        }
    }
    // ==========================================================================
    // Private helpers
    // ==========================================================================
    /**
     * Try to get embedding from OpenClaw's cache
     */
    getOpenClawEmbedding(text) {
        if (!this.openclawDb)
            return null;
        try {
            // OpenClaw caches by hash — we need to match by text content
            // The cache stores embeddings as JSON text arrays
            const row = this.openclawDb.prepare('SELECT embedding, dims FROM embedding_cache WHERE hash = ? LIMIT 1').get(this.hashText(text));
            if (row && row.embedding) {
                const arr = JSON.parse(row.embedding);
                return new Float32Array(arr);
            }
        }
        catch (e) {
            // Silently fail — will use TF-IDF fallback
        }
        return null;
    }
    /**
     * Hash text for cache lookup (match OpenClaw's hashing)
     */
    hashText(text) {
        // Simple hash — OpenClaw likely uses a similar approach
        const { createHash } = require('node:crypto');
        return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
    }
    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom > 0 ? dot / denom : 0;
    }
    /**
     * Days since timestamp
     */
    daysSince(isoTimestamp) {
        return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60 * 24);
    }
    /**
     * Load existing embeddings from DB
     */
    async loadEmbeddings() {
        if (!this.db)
            return;
        const rows = this.db.prepare('SELECT id, embedding FROM memory_vectors WHERE embedding IS NOT NULL').all();
        for (const row of rows) {
            if (row.embedding && row.embedding.length > 0) {
                const vec = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4);
                this.memoryEmbeddings.set(row.id, vec);
            }
        }
    }
}
exports.VectorMemory = VectorMemory;
//# sourceMappingURL=vector-memory.js.map