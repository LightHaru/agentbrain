/**
 * EmbeddingService — one consistent way to turn text into a stored vector.
 *
 * "Store like people do" (production RAG/vector-DB practice) means:
 *   - ONE embedding model of record, identified by name + dimension
 *   - every stored vector tagged with that model id + dim
 *   - vectors L2-normalized (unit length) so dot product == cosine
 *   - NEVER compare vectors from different models/dims (meaningless distance);
 *     re-embed on mismatch instead
 *
 * This wraps the local MiniLM EmbeddingEngine and adds the metadata + guarantees
 * the raw engine doesn't. All durable stores (knowledge, conversation) embed
 * through this so the whole brain shares one vector space.
 */
import { EmbeddingEngine } from './embedding-engine.js';
export declare const EMBED_MODEL_ID = "Xenova/all-MiniLM-L6-v2";
export declare const EMBED_DIM = 384;
export interface EmbeddedVector {
    vector: Float32Array;
    model: string;
    dim: number;
}
/** L2-normalize in place; returns the same array (unit length, or unchanged if zero). */
export declare function l2normalize(v: Float32Array): Float32Array;
/** Cosine similarity for equal-length vectors (== dot product if both unit-norm). */
export declare function cosineSim(a: Float32Array, b: Float32Array): number;
export declare class EmbeddingService {
    private engine;
    readonly model = "Xenova/all-MiniLM-L6-v2";
    readonly dim = 384;
    constructor(engine?: EmbeddingEngine);
    isReady(): boolean;
    warmup(): Promise<boolean>;
    /** Embed text into a tagged, unit-normalized vector (or null if model down). */
    embed(text: string): Promise<EmbeddedVector | null>;
    /**
     * Compare a live query embedding against a STORED vector, honoring model/dim.
     * Returns null when the stored vector is from a different space (caller should
     * re-embed rather than trust a bogus score).
     */
    compatible(storedModel: string | null, storedDim: number | null): boolean;
}
export declare function getEmbeddingService(): EmbeddingService;
//# sourceMappingURL=embedding-service.d.ts.map