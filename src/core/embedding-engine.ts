/**
 * Embedding Engine — Local Transformers.js embeddings
 * 
 * Uses @huggingface/transformers to generate embeddings locally.
 * Model: Xenova/multilingual-e5-large (1024 dimensions)
 * 
 * Features:
 * - Lazy model loading (doesn't block plugin init)
 * - In-memory model caching after first load
 * - Graceful fallback if model download fails
 * - Batch embedding support
 */

import { pipeline, env } from '@huggingface/transformers';

// Disable remote model checks (use cached models only after first download)
env.allowRemoteModels = true;
env.allowLocalModels = true;

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingEngineConfig {
  /** Model ID from HuggingFace */
  modelId: string;
  /** Expected embedding dimensions */
  dims: number;
  /** Max batch size for embedBatch */
  maxBatchSize: number;
}

// ============================================================================
// Embedding Engine
// ============================================================================

export class EmbeddingEngine {
  private config: EmbeddingEngineConfig;
  private pipeline: any = null;
  private loading: Promise<void> | null = null;
  private loadFailed: boolean = false;

  constructor(config: Partial<EmbeddingEngineConfig> = {}) {
    this.config = {
      modelId: config.modelId || 'Xenova/multilingual-e5-large',
      dims: config.dims || 1024,
      maxBatchSize: config.maxBatchSize || 32,
    };
  }

  /**
   * Embed a single text (lazy loads model on first call)
   */
  async embed(text: string): Promise<Float32Array | null> {
    await this.ensureLoaded();
    if (!this.pipeline) return null;

    try {
      const result = await this.pipeline(text, { pooling: 'mean', normalize: true });
      return new Float32Array(result.data);
    } catch (e) {
      console.error('[EmbeddingEngine] Embed failed:', e);
      return null;
    }
  }

  /**
   * Embed multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<(Float32Array | null)[]> {
    await this.ensureLoaded();
    if (!this.pipeline) return texts.map(() => null);

    const results: (Float32Array | null)[] = [];

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
        } else {
          // Single result
          results.push(new Float32Array(batchResult.data));
        }
      } catch (e) {
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
  isLoaded(): boolean {
    return this.pipeline !== null;
  }

  /**
   * Check if model loading failed
   */
  hasFailed(): boolean {
    return this.loadFailed;
  }

  /**
   * Get embedding dimensions
   */
  getDims(): number {
    return this.config.dims;
  }

  /**
   * Get model info
   */
  getModelInfo(): { modelId: string; dims: number; loaded: boolean; failed: boolean } {
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
  private async ensureLoaded(): Promise<void> {
    // Already loaded
    if (this.pipeline) return;

    // Already failed
    if (this.loadFailed) return;

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
  private async loadModel(): Promise<void> {
    if (process.env.AGENTBRAIN_DISABLE_TRANSFORMERS === '1' || process.env.NODE_ENV === 'test') {
      this.loadFailed = true;
      this.pipeline = null;
      return;
    }

    try {
      console.log(`[EmbeddingEngine] Loading model ${this.config.modelId}...`);
      
      this.pipeline = await pipeline('feature-extraction', this.config.modelId);

      console.log(`[EmbeddingEngine] Model loaded successfully (${this.config.dims}D)`);
    } catch (e) {
      console.error('[EmbeddingEngine] Failed to load model:', e);
      console.log('[EmbeddingEngine] Falling back to TF-IDF');
      this.loadFailed = true;
      this.pipeline = null;
    }
  }
}

// ============================================================================
// Singleton instance (shared across AgentBrain)
// ============================================================================

let globalEngine: EmbeddingEngine | null = null;

/**
 * Get the global embedding engine instance
 */
export function getEmbeddingEngine(): EmbeddingEngine {
  if (!globalEngine) {
    globalEngine = new EmbeddingEngine();
  }
  return globalEngine;
}
