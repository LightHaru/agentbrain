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
import { Memory } from '../index.js';
import type { BrainDatabase } from '../storage/brain-db.js';
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
export declare class VectorMemory {
    private config;
    private db;
    private openclawDb;
    private embedder;
    private memoryEmbeddings;
    private embeddingEngine;
    private entityMatcher;
    private entityCache;
    private brainDb;
    constructor(config?: Partial<VectorMemoryConfig>, brainDb?: BrainDatabase);
    /**
     * Initialize: open DBs, load existing embeddings
     */
    initialize(): Promise<void>;
    /**
     * Multi-signal recall: combines embedding similarity, BM25, and entity matching
     * Score = 0.5 * embedding_similarity + 0.3 * bm25_score + 0.2 * entity_match_score
     */
    recall(query: string, memories: Memory[], topic?: string): Promise<RecallResult[]>;
    /**
     * Index a new memory (compute and store embedding)
     * 3-tier fallback: EmbeddingEngine → OpenClaw cache → TF-IDF
     */
    indexMemory(memory: Memory): Promise<void>;
    /**
     * Batch index all memories (call during heartbeat)
     */
    indexAll(memories: Memory[]): Promise<number>;
    /**
     * Remove a memory from the index
     */
    removeMemory(memoryId: string): void;
    /**
     * Get or compute entities for text (with caching)
     */
    private getEntities;
    /**
     * Get stats
     */
    getStats(): {
        indexed: number;
        openclawCacheHits: number;
        dims: number;
        embeddingEngine: any;
        entityCacheSize: number;
    };
    /**
     * Shutdown: close DBs
     */
    shutdown(): void;
    /**
     * Try to get embedding from OpenClaw's cache
     */
    private getOpenClawEmbedding;
    /**
     * Hash text for cache lookup (match OpenClaw's hashing)
     */
    private hashText;
    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity;
    /**
     * Days since timestamp
     */
    private daysSince;
    /**
     * Load existing embeddings from DB
     */
    private loadEmbeddings;
}
//# sourceMappingURL=vector-memory.d.ts.map