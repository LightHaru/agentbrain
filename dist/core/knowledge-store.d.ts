/**
 * KnowledgeStore — the durable, searchable brain of distilled knowledge.
 *
 * This is how real systems store distilled/RAG knowledge: each item is a row
 * with its own EMBEDDING, searched by semantic similarity (local MiniLM), not a
 * JSON blob. It is designed to stay SMART and NOT bloat:
 *   - content-hash dedup: identical knowledge is never stored twice
 *   - reinforcement: re-adding raises confidence + usefulness instead of duping
 *   - usage tracking: useCount/lastUsed recorded on every retrieval
 *   - pruning: low-value items (never used, low confidence, superseded) are
 *     dropped so the store reflects what actually helps Aira
 *
 * Kinds: 'playbook' (reasoning frame), 'lesson' (do/don't), 'error' (mistake+fix),
 * 'procedure' (how-to), 'fact' (durable knowledge).
 */
import type { BrainDatabase } from '../storage/brain-db.js';
export type KnowledgeKind = 'playbook' | 'lesson' | 'error' | 'procedure' | 'fact';
export interface KnowledgeItem {
    id: string;
    kind: KnowledgeKind;
    title: string;
    /** the searchable text (what gets embedded) */
    content: string;
    /** structured payload (e.g. the full playbook JSON) */
    payload: any;
    tags: string[];
    source: string;
    confidence: number;
    useCount: number;
    createdAt: string;
    lastUsed: string;
    contentHash: string;
    embedding?: Float32Array | null;
    embedModel?: string | null;
    embedDim?: number | null;
}
export interface KnowledgeEmbedder {
    isLoaded(): boolean;
    embed(text: string): Promise<Float32Array | null>;
}
export interface SearchHit {
    item: KnowledgeItem;
    score: number;
}
export declare class KnowledgeStore {
    private db;
    private embedder;
    private service;
    constructor(db: BrainDatabase, embedder?: KnowledgeEmbedder | null);
    private embedReady;
    private ensureSchema;
    size(): number;
    countByKind(): Record<string, number>;
    /**
     * Upsert a knowledge item. Dedup by content hash: an identical item is
     * REINFORCED (confidence + a small bump, useCount preserved) rather than
     * duplicated — this is the core anti-bloat guarantee.
     */
    upsert(input: {
        kind: KnowledgeKind;
        title: string;
        content: string;
        payload?: any;
        tags?: string[];
        source?: string;
        confidence?: number;
        timestamp?: string;
    }): Promise<{
        id: string;
        created: boolean;
    }>;
    private rowToItem;
    /**
     * Semantic search over knowledge (local embeddings). Falls back to keyword
     * overlap when the model isn't loaded. Records usage on the hits returned.
     */
    search(query: string, opts?: {
        kind?: KnowledgeKind;
        limit?: number;
        minScore?: number;
    }): Promise<SearchHit[]>;
    private persistEmbedding;
    private recordUsage;
    /**
     * Prune low-value knowledge so the store stays lean and smart.
     * Removes items that are old, never used, AND low confidence.
     */
    prune(opts?: {
        maxAgeDays?: number;
        minConfidence?: number;
    }): number;
    getAll(kind?: KnowledgeKind): KnowledgeItem[];
}
//# sourceMappingURL=knowledge-store.d.ts.map