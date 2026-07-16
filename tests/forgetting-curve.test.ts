/**
 * ForgettingCurve tests — Ebbinghaus retention + protection of useful memories.
 */
import { describe, it, expect } from 'vitest';
import { retention, stability, shouldForget, decayedConfidence } from '../src/core/forgetting-curve.js';

describe('ForgettingCurve', () => {
  it('retention decreases with age', () => {
    const fresh = retention({ ageDays: 0, accessCount: 1, confidence: 0.7 });
    const old = retention({ ageDays: 30, accessCount: 1, confidence: 0.7 });
    expect(fresh).toBeGreaterThan(old);
    expect(fresh).toBeCloseTo(1, 1);
  });

  it('more accesses => more stable => higher retention at same age', () => {
    const rare = retention({ ageDays: 20, accessCount: 1, confidence: 0.6 });
    const frequent = retention({ ageDays: 20, accessCount: 10, confidence: 0.6 });
    expect(frequent).toBeGreaterThan(rare);
    expect(stability(10, 0.6)).toBeGreaterThan(stability(1, 0.6));
  });

  it('protects frequently-used, high-confidence memories from being forgotten', () => {
    // very old but recalled a lot and trusted
    expect(shouldForget({ ageDays: 365, accessCount: 8, confidence: 0.8 })).toBe(false);
  });

  it('forgets old, never-used, low-confidence noise', () => {
    expect(shouldForget({ ageDays: 60, accessCount: 0, confidence: 0.3 })).toBe(true);
  });

  it('decayedConfidence keeps most confidence when fresh, drops it when stale', () => {
    const fresh = decayedConfidence({ ageDays: 0, accessCount: 2, confidence: 0.8 });
    const stale = decayedConfidence({ ageDays: 90, accessCount: 0, confidence: 0.8 });
    expect(fresh).toBeGreaterThan(0.7);
    expect(stale).toBeLessThan(0.5);
  });
});
