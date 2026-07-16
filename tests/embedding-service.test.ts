/**
 * Tests for storing vectors "like people do": unit-normalization, model/dim
 * tagging, and refusal to compare across incompatible vector spaces.
 */
import { describe, it, expect } from 'vitest';
import { l2normalize, cosineSim, EmbeddingService, EMBED_DIM, EMBED_MODEL_ID } from '../src/core/embedding-service.js';

describe('embedding vector discipline', () => {
  it('l2normalize makes a unit-length vector', () => {
    const v = new Float32Array([3, 4]); // length 5
    l2normalize(v);
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    expect(len).toBeCloseTo(1, 5);
  });

  it('cosineSim of a normalized vector with itself is 1', () => {
    const v = l2normalize(new Float32Array([1, 2, 3, 4]));
    expect(cosineSim(v, v)).toBeCloseTo(1, 5);
  });

  it('cosineSim returns NaN for different-length (incompatible) vectors', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([1, 2, 3, 4]);
    expect(Number.isNaN(cosineSim(a, b))).toBe(true);
  });

  it('service.compatible only accepts matching model + dim', () => {
    const svc = new EmbeddingService({
      isLoaded: () => true, hasFailed: () => false,
      embed: async () => new Float32Array(EMBED_DIM),
    } as any);
    expect(svc.compatible(EMBED_MODEL_ID, EMBED_DIM)).toBe(true);
    expect(svc.compatible('other-model', EMBED_DIM)).toBe(false);
    expect(svc.compatible(EMBED_MODEL_ID, 768)).toBe(false);
    expect(svc.compatible(null, null)).toBe(false);
  });

  it('service.embed returns a unit-normalized, tagged vector', async () => {
    const raw = new Float32Array([3, 4, 0]); // not normalized
    const svc = new EmbeddingService({
      isLoaded: () => true, hasFailed: () => false,
      embed: async () => raw,
    } as any);
    const ev = await svc.embed('hello');
    expect(ev).not.toBeNull();
    expect(ev!.model).toBe(EMBED_MODEL_ID);
    expect(ev!.dim).toBe(3);
    const len = Math.sqrt(ev!.vector.reduce((s, x) => s + x * x, 0));
    expect(len).toBeCloseTo(1, 5);
  });
});
