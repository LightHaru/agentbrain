/**
 * Tests for AffectCore mood momentum + persistence.
 *
 * Sếp's requirement: a mood must LINGER across turns — praise then a neutral
 * message must stay warm, not snap back to neutral like a machine. And the
 * emotional state must survive /new & restarts (persist + reload).
 */

import { describe, it, expect } from 'vitest';
import { AffectCore, type AffectStore } from '../src/core/affect-core.js';

const praise = {
  goalCongruence: 0.9, goalRelevance: 0.9, agency: 'other' as const,
  copingPotential: 0.8, novelty: 0.5, certainty: 0.9,
};
const neutralTurn = {
  goalCongruence: 0, goalRelevance: 0.3, agency: 'self' as const,
  copingPotential: 0.6, novelty: 0.1, certainty: 0.9,
};
const strongLoss = {
  goalCongruence: -0.9, goalRelevance: 0.9, agency: 'circumstance' as const,
  copingPotential: 0.2, novelty: 0.2, certainty: 0.9,
};

describe('AffectCore mood momentum', () => {
  it('a happy mood LINGERS through neutral turns (not machine-like reset)', () => {
    const a = new AffectCore();
    const first = a.appraise(praise, 'Sếp khen');
    expect(['affection', 'gratitude', 'joy', 'pride']).toContain(first.label);

    // Several neutral turns follow — mood must hold, only decaying gradually.
    let last = first;
    for (let i = 0; i < 3; i++) last = a.appraise(neutralTurn, 'câu bình thường');

    expect(last.label).toBe(first.label); // still the same warm mood
    expect(last.intensity).toBeGreaterThan(0.15); // still felt
    expect(last.intensity).toBeLessThan(first.intensity); // but decaying
  });

  it('mood only flips when the new emotion is strong enough', () => {
    const a = new AffectCore();
    a.appraise(praise, 'khen');            // warm mood established
    const mild = a.appraise(
      { goalCongruence: -0.2, goalRelevance: 0.3, agency: 'self', copingPotential: 0.6, novelty: 0.2, certainty: 0.8 },
      'hơi phàn nàn nhẹ'
    );
    // A mild negative should NOT overturn a strong warm mood immediately.
    expect(['affection', 'gratitude', 'joy', 'pride']).toContain(mild.label);

    // But a strong loss overcomes the lingering mood and switches it.
    const strong = a.appraise(strongLoss, 'mất mát lớn');
    expect(['sadness', 'disappointment', 'fear', 'anxiety']).toContain(strong.label);
  });

  it('same emotion repeated deepens (intensity climbs)', () => {
    const a = new AffectCore();
    const one = a.appraise(praise, 'khen 1');
    const two = a.appraise(praise, 'khen 2');
    expect(two.intensity).toBeGreaterThanOrEqual(one.intensity);
  });
});

describe('AffectCore persistence (nhớ xuyên session)', () => {
  it('serialize → restore round-trips the felt mood', () => {
    const a = new AffectCore();
    a.appraise(praise, 'khen');
    const before = a.getState();
    const blob = a.serialize();

    const b = new AffectCore();
    b.restore(blob);
    const after = b.getState();

    expect(after.primary.label).toBe(before.primary.label);
    expect(after.primary.intensity).toBeCloseTo(before.primary.intensity, 5);
    expect(after.dimensional.valence).toBeCloseTo(before.dimensional.valence, 5);
  });

  it('persist + initialize via a store carries mood into a NEW instance', async () => {
    const mem = new Map<string, string>();
    const store: AffectStore = {
      async readFile(p) { return mem.has(p) ? mem.get(p)! : null; },
      async writeFile(p, c) { mem.set(p, c); },
    };

    const session1 = new AffectCore(store);
    await session1.initialize();
    session1.appraise(praise, 'Sếp khen cuối phiên');
    const moodBefore = session1.getState().primary;
    await session1.persist();

    // Simulate /new or restart: a brand-new AffectCore over the same store.
    const session2 = new AffectCore(store);
    await session2.initialize();
    const moodAfter = session2.getState().primary;

    expect(moodAfter.label).toBe(moodBefore.label);
    expect(moodAfter.intensity).toBeCloseTo(moodBefore.intensity, 5);
  });

  it('with no store, still works (defaults, no throw)', async () => {
    const a = new AffectCore();
    await a.initialize();
    await a.persist();
    expect(a.getState().primary.label).toBeTruthy();
  });
});
