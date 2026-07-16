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

import { getEmbeddingEngine, EmbeddingEngine } from './embedding-engine.js';

export const EMBED_MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
export const EMBED_DIM = 384;

export interface EmbeddedVector {
  vector: Float32Array; // unit-normalized
  model: string;
  dim: number;
}

/** L2-normalize in place; returns the same array (unit length, or unchanged if zero). */
export function l2normalize(v: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

/** Cosine similarity for equal-length vectors (== dot product if both unit-norm). */
export function cosineSim(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return NaN; // different spaces are not comparable
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export class EmbeddingService {
  private engine: EmbeddingEngine;
  readonly model = EMBED_MODEL_ID;
  readonly dim = EMBED_DIM;

  constructor(engine: EmbeddingEngine = getEmbeddingEngine()) {
    this.engine = engine;
  }

  isReady(): boolean {
    return this.engine.isLoaded();
  }

  async warmup(): Promise<boolean> {
    const v = await this.engine.embed('warmup');
    return !!v && !this.engine.hasFailed();
  }

  /** Embed text into a tagged, unit-normalized vector (or null if model down). */
  async embed(text: string): Promise<EmbeddedVector | null> {
    const raw = await this.engine.embed(text);
    if (!raw) return null;
    return { vector: l2normalize(new Float32Array(raw)), model: this.model, dim: raw.length };
  }

  /**
   * Compare a live query embedding against a STORED vector, honoring model/dim.
   * Returns null when the stored vector is from a different space (caller should
   * re-embed rather than trust a bogus score).
   */
  compatible(storedModel: string | null, storedDim: number | null): boolean {
    return storedModel === this.model && storedDim === this.dim;
  }
}

let shared: EmbeddingService | null = null;
export function getEmbeddingService(): EmbeddingService {
  if (!shared) shared = new EmbeddingService();
  return shared;
}
