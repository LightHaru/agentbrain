"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingEngine = void 0;
exports.getEmbeddingEngine = getEmbeddingEngine;
const transformers_1 = require("@huggingface/transformers");
// Disable remote model checks (use cached models only after first download)
transformers_1.env.allowRemoteModels = true;
transformers_1.env.allowLocalModels = true;
// ============================================================================
// Embedding Engine
// ============================================================================
class EmbeddingEngine {
    config;
    pipeline = null;
    loading = null;
    loadFailed = false;
    constructor(config = {}) {
        this.config = {
            modelId: config.modelId || 'Xenova/all-MiniLM-L6-v2',
            dims: config.dims || 384,
            maxBatchSize: config.maxBatchSize || 32,
        };
    }
    /**
     * Embed a single text (lazy loads model on first call)
     */
    async embed(text) {
        await this.ensureLoaded();
        if (!this.pipeline)
            return null;
        try {
            const result = await this.pipeline(text, { pooling: 'mean', normalize: true });
            return new Float32Array(result.data);
        }
        catch (e) {
            console.error('[EmbeddingEngine] Embed failed:', e);
            return null;
        }
    }
    /**
     * Embed multiple texts in batch
     */
    async embedBatch(texts) {
        await this.ensureLoaded();
        if (!this.pipeline)
            return texts.map(() => null);
        const results = [];
        // Process in chunks to avoid memory issues
        for (let i = 0; i < texts.length; i += this.config.maxBatchSize) {
            const chunk = texts.slice(i, i + this.config.maxBatchSize);
            try {
                const batchResult = await this.pipeline(chunk, { pooling: 'mean', normalize: true });
                // Handle both single and batch results
                if (Array.isArray(batchResult)) {
                    for (const item of batchResult) {
                        results.push(new Float32Array(item.data));
                    }
                }
                else {
                    // Single result
                    results.push(new Float32Array(batchResult.data));
                }
            }
            catch (e) {
                console.error('[EmbeddingEngine] Batch embed failed:', e);
                // Push nulls for failed chunk
                results.push(...chunk.map(() => null));
            }
        }
        return results;
    }
    /**
     * Check if model is loaded
     */
    isLoaded() {
        return this.pipeline !== null;
    }
    /**
     * Check if model loading failed
     */
    hasFailed() {
        return this.loadFailed;
    }
    /**
     * Get embedding dimensions
     */
    getDims() {
        return this.config.dims;
    }
    /**
     * Get model info
     */
    getModelInfo() {
        return {
            modelId: this.config.modelId,
            dims: this.config.dims,
            loaded: this.isLoaded(),
            failed: this.hasFailed(),
        };
    }
    // ==========================================================================
    // Private helpers
    // ==========================================================================
    /**
     * Ensure model is loaded (lazy loading)
     */
    async ensureLoaded() {
        // Already loaded
        if (this.pipeline)
            return;
        // Already failed
        if (this.loadFailed)
            return;
        // Already loading
        if (this.loading) {
            await this.loading;
            return;
        }
        // Start loading
        this.loading = this.loadModel();
        await this.loading;
        this.loading = null;
    }
    /**
     * Load the model
     */
    async loadModel() {
        try {
            console.log(`[EmbeddingEngine] Loading model ${this.config.modelId}...`);
            this.pipeline = await (0, transformers_1.pipeline)('feature-extraction', this.config.modelId);
            console.log(`[EmbeddingEngine] Model loaded successfully (${this.config.dims}D)`);
        }
        catch (e) {
            console.error('[EmbeddingEngine] Failed to load model:', e);
            console.log('[EmbeddingEngine] Falling back to TF-IDF');
            this.loadFailed = true;
            this.pipeline = null;
        }
    }
}
exports.EmbeddingEngine = EmbeddingEngine;
// ============================================================================
// Singleton instance (shared across AgentBrain)
// ============================================================================
let globalEngine = null;
/**
 * Get the global embedding engine instance
 */
function getEmbeddingEngine() {
    if (!globalEngine) {
        globalEngine = new EmbeddingEngine();
    }
    return globalEngine;
}
//# sourceMappingURL=embedding-engine.js.map