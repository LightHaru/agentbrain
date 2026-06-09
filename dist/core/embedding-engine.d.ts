/**
 * Embedding Engine — Local Transformers.js embeddings
 *
 * Uses @huggingface/transformers to generate embeddings locally.
 * Model: Xenova/all-MiniLM-L6-v2 (22MB, 384 dimensions)
 *
 * Features:
 * - Lazy model loading (doesn't block plugin init)
 * - In-memory model caching after first load
 * - Graceful fallback if model download fails
 * - Batch embedding support
 */
export interface EmbeddingEngineConfig {
    /** Model ID from HuggingFace */
    modelId: string;
    /** Expected embedding dimensions */
    dims: number;
    /** Max batch size for embedBatch */
    maxBatchSize: number;
}
export declare class EmbeddingEngine {
    private config;
    private pipeline;
    private loading;
    private loadFailed;
    constructor(config?: Partial<EmbeddingEngineConfig>);
    /**
     * Embed a single text (lazy loads model on first call)
     */
    embed(text: string): Promise<Float32Array | null>;
    /**
     * Embed multiple texts in batch
     */
    embedBatch(texts: string[]): Promise<(Float32Array | null)[]>;
    /**
     * Check if model is loaded
     */
    isLoaded(): boolean;
    /**
     * Check if model loading failed
     */
    hasFailed(): boolean;
    /**
     * Get embedding dimensions
     */
    getDims(): number;
    /**
     * Get model info
     */
    getModelInfo(): {
        modelId: string;
        dims: number;
        loaded: boolean;
        failed: boolean;
    };
    /**
     * Ensure model is loaded (lazy loading)
     */
    private ensureLoaded;
    /**
     * Load the model
     */
    private loadModel;
}
/**
 * Get the global embedding engine instance
 */
export declare function getEmbeddingEngine(): EmbeddingEngine;
//# sourceMappingURL=embedding-engine.d.ts.map