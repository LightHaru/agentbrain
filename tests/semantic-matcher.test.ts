/**
 * Tests for SemanticPlaybookMatcher — proves it degrades gracefully to regex
 * when the local model isn't loaded, and returns regex matches as a baseline.
 * (The full local-model path is exercised by the real training run + E2E,
 * since loading MiniLM in unit tests is slow/network-dependent.)
 */

import { describe, it, expect } from 'vitest';
import { SemanticPlaybookMatcher } from '../src/core/semantic-playbook-matcher.js';
import { matchReasoningPlaybooks } from '../src/core/reasoning-playbooks.js';

// A stub embedder that is never "loaded" → matcher must fall back to regex.
const notLoadedEngine = {
  isLoaded: () => false,
  hasFailed: () => false,
  embed: async () => null,
  embedBatch: async (t: string[]) => t.map(() => null),
} as any;

describe('SemanticPlaybookMatcher', () => {
  it('falls back to regex matches when the model is not ready', async () => {
    const m = new SemanticPlaybookMatcher(notLoadedEngine);
    expect(m.isReady()).toBe(false);
    const msg = 'landing page cần build và verify trên browser';
    const got = await m.match(msg);
    const regex = matchReasoningPlaybooks(msg);
    expect(got.map((p) => p.id).sort()).toEqual(regex.map((p) => p.id).sort());
  });

  it('warmup reports not-ready if the model fails to load', async () => {
    const failing = { ...notLoadedEngine, embed: async () => null };
    const m = new SemanticPlaybookMatcher(failing);
    const ready = await m.warmup([]);
    expect(ready).toBe(false);
  });

  it('bestScore returns 0 when matcher is not ready', async () => {
    const m = new SemanticPlaybookMatcher(notLoadedEngine);
    expect(await m.bestScore('anything', 'distilled-root-cause-analysis')).toBe(0);
  });
});
