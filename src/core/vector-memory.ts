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

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { Memory } from '../index.js';
import { getEmbeddingEngine } from './embedding-engine.js';

// ============================================================================
// Types
// ============================================================================

export interface VectorMemoryConfig {
  /** Path to AgentBrain's vector DB */
  dbPath: string;
  /** Path to OpenClaw's memory SQLite (for embedding cache reuse) */
  openclawDbPath: string;
  /** Embedding dimensions */
  dims: number;
  /** Max results for recall */
  maxResults: number;
  /** Minimum similarity score (0-1) to include in results */
  minSimilarity: number;
}

export interface EmbeddedMemory {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural';
  content: string;
  timestamp: string;
  confidence: number;
  accessCount: number;
  lastAccessed: string;
  tags: string[];
  embedding: Float32Array | null;
}

export interface RecallResult {
  memory: Memory;
  similarity: number;
  method: 'vector' | 'keyword' | 'hybrid';
}

// ============================================================================
// Simple TF-IDF Embedder (fallback when no cached embedding available)
// ============================================================================

class SimpleEmbedder {
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private dims: number;

  constructor(dims: number = 768) {
    this.dims = dims;
  }

  /**
   * Build vocabulary from corpus of texts
   */
  buildVocabulary(texts: string[]): void {
    const docFreq = new Map<string, number>();
    const allTerms = new Set<string>();

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
  embed(text: string): Float32Array {
    const vec = new Float32Array(this.dims);
    const terms = this.tokenize(text);
    const termFreq = new Map<string, number>();

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

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  hasVocabulary(): boolean {
    return this.vocabulary.size > 0;
  }
}

// ============================================================================
// Vector Memory Store
// ============================================================================

export class VectorMemory {
  private config: VectorMemoryConfig;
  private db: Database.Database | null = null;
  private openclawDb: Database.Database | null = null;
  private embedder: SimpleEmbedder;
  private memoryEmbeddings: Map<string, Float32Array> = new Map();
  private embeddingEngine = getEmbeddingEngine();

  constructor(config: Partial<VectorMemoryConfig> = {}) {
    this.config = {
      dbPath: config.dbPath || './brain/vector.db',
      openclawDbPath: config.openclawDbPath || join(
        process.env.HOME || '~', '.openclaw/memory/main.sqlite'
      ),
      dims: config.dims || 768,
      maxResults: config.maxResults || 10,
      minSimilarity: config.minSimilarity || 0.3,
    };
    this.embedder = new SimpleEmbedder(this.config.dims);
  }

  /**
   * Initialize: open DBs, load existing embeddings
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    const dir = dirname(this.config.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Open AgentBrain's vector DB
    this.db = new Database(this.config.dbPath);
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
    if (existsSync(this.config.openclawDbPath)) {
      try {
        this.openclawDb = new Database(this.config.openclawDbPath, { readonly: true });
        console.log('[VectorMemory] Connected to OpenClaw embedding cache');
      } catch (e) {
        console.log('[VectorMemory] Could not open OpenClaw DB, using TF-IDF only');
      }
    }

    // Load existing embeddings into memory
    await this.loadEmbeddings();

    console.log(`[VectorMemory] Initialized — ${this.memoryEmbeddings.size} vectors loaded`);
  }

  /**
   * Semantic recall: find memories similar to query
   * 3-tier fallback: EmbeddingEngine → OpenClaw cache → TF-IDF
   */
  async recall(query: string, memories: Memory[], topic?: string): Promise<RecallResult[]> {
    // Tier 1: Try EmbeddingEngine (Transformers.js)
    let queryVec = await this.embeddingEngine.embed(query);
    let method: 'vector' | 'keyword' | 'hybrid' = 'vector';

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

    // Score all memories
    const results: RecallResult[] = [];

    for (const memory of memories) {
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

      if (memVec && queryVec) {
        const similarity = this.cosineSimilarity(queryVec, memVec);

        // Boost by confidence and recency
        const recencyBoost = Math.max(0, 0.05 - this.daysSince(memory.lastAccessed) * 0.005);
        const confidenceBoost = memory.confidence * 0.1;
        const topicBoost = (topic && memory.tags.includes(topic)) ? 0.15 : 0;

        const finalScore = similarity + recencyBoost + confidenceBoost + topicBoost;

        if (finalScore >= this.config.minSimilarity) {
          results.push({ memory, similarity: finalScore, method });
        }
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
  async indexMemory(memory: Memory): Promise<void> {
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
        stmt.run(
          memory.id,
          memory.content,
          memory.type,
          Buffer.from(vec.buffer),
          source,
          memory.timestamp,
          new Date().toISOString()
        );
      }
    }
  }

  /**
   * Batch index all memories (call during heartbeat)
   */
  async indexAll(memories: Memory[]): Promise<number> {
    // Rebuild TF-IDF vocabulary for fallback
    this.embedder.buildVocabulary(memories.map(m => m.content));

    // Filter memories that need indexing
    const toIndex = memories.filter(m => !this.memoryEmbeddings.has(m.id));
    
    if (toIndex.length === 0) return 0;

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
          stmt.run(
            memory.id,
            memory.content,
            memory.type,
            Buffer.from(vec.buffer),
            source,
            memory.timestamp,
            new Date().toISOString()
          );
        }
        indexed++;
      }
    }
    
    return indexed;
  }

  /**
   * Remove a memory from the index
   */
  removeMemory(memoryId: string): void {
    this.memoryEmbeddings.delete(memoryId);
    if (this.db) {
      this.db.prepare('DELETE FROM memory_vectors WHERE id = ?').run(memoryId);
    }
  }

  /**
   * Get stats
   */
  getStats(): { indexed: number; openclawCacheHits: number; dims: number; embeddingEngine: any } {
    return {
      indexed: this.memoryEmbeddings.size,
      openclawCacheHits: this.openclawDb ? 1 : 0,
      dims: this.config.dims,
      embeddingEngine: this.embeddingEngine.getModelInfo(),
    };
  }

  /**
   * Shutdown: close DBs
   */
  shutdown(): void {
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
  private getOpenClawEmbedding(text: string): Float32Array | null {
    if (!this.openclawDb) return null;

    try {
      // OpenClaw caches by hash — we need to match by text content
      // The cache stores embeddings as JSON text arrays
      const row = this.openclawDb.prepare(
        'SELECT embedding, dims FROM embedding_cache WHERE hash = ? LIMIT 1'
      ).get(this.hashText(text)) as { embedding: string; dims: number } | undefined;

      if (row && row.embedding) {
        const arr = JSON.parse(row.embedding) as number[];
        return new Float32Array(arr);
      }
    } catch (e) {
      // Silently fail — will use TF-IDF fallback
    }

    return null;
  }

  /**
   * Hash text for cache lookup (match OpenClaw's hashing)
   */
  private hashText(text: string): string {
    // Simple hash — OpenClaw likely uses a similar approach
    const { createHash } = require('node:crypto');
    return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
  }

  /**
   * Cosine similarity between two vectors
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;

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
  private daysSince(isoTimestamp: string): number {
    return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Load existing embeddings from DB
   */
  private async loadEmbeddings(): Promise<void> {
    if (!this.db) return;

    const rows = this.db.prepare('SELECT id, embedding FROM memory_vectors WHERE embedding IS NOT NULL').all() as Array<{ id: string; embedding: Buffer }>;

    for (const row of rows) {
      if (row.embedding && row.embedding.length > 0) {
        const vec = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4);
        this.memoryEmbeddings.set(row.id, vec);
      }
    }
  }
}
