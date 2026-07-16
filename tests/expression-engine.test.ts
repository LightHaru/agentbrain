/**
 * Tests for ExpressionEngine — proves the felt emotion turns into varied,
 * mood-appropriate expression (kho biểu cảm) instead of one flat face.
 */

import { describe, it, expect } from 'vitest';
import { ExpressionEngine } from '../src/core/expression-engine.js';
import type { AffectState, EmotionLabel } from '../src/core/affect-core.js';
import type { NeurochemState } from '../src/core/neurochemistry.js';

function affect(label: EmotionLabel, intensity: number, valence: number, arousal: number): AffectState {
  return {
    primary: { label, intensity },
    secondary: null,
    dimensional: { valence, arousal, dominance: 0 },
    baseline: { valence: 0, arousal: 0.3 },
    lastAppraisal: null,
    lastTrigger: 'test',
    recent: [],
  };
}

const neuro = (o: Partial<NeurochemState> = {}): NeurochemState => ({
  dopamine: 0.4, serotonin: 0.5, cortisol: 0.2, oxytocin: 0.35, ...o,
});

// deterministic RNG cycling through [0, .17, .34, .51, .68, .85]
function seq(values: number[]) {
  let i = 0;
  return () => values[(i++) % values.length];
}

describe('ExpressionEngine', () => {
  const engine = new ExpressionEngine();

  it('joy produces a lively, expressive profile with a kaomoji', () => {
    const p = engine.render({ affect: affect('joy', 0.8, 0.8, 0.65), neuro: neuro(), rng: () => 0 });
    expect(p.expressive).toBe(true);
    expect(p.moodWord).toBe('vui');
    expect(p.kaomoji).not.toBe('');
    expect(['lively', 'high']).toContain(p.energy);
    expect(p.verbosity).toBe('expansive');
    expect(p.directive).toContain('vui');
  });

  it('sadness produces a low-energy, subdued profile', () => {
    const p = engine.render({ affect: affect('sadness', 0.7, -0.6, 0.2), neuro: neuro(), rng: () => 0 });
    expect(p.moodWord).toBe('buồn');
    expect(['flat', 'low']).toContain(p.energy);
    expect(p.kaomojiPool.length).toBeGreaterThanOrEqual(4);
  });

  it('is a KHO biểu cảm: same emotion yields different kaomoji across turns', () => {
    const rng = seq([0, 0.2, 0.4, 0.6, 0.8]);
    const faces = new Set<string>();
    for (let i = 0; i < 5; i++) {
      faces.add(engine.render({ affect: affect('joy', 0.8, 0.8, 0.6), neuro: neuro(), rng }).kaomoji);
    }
    // Should surface multiple distinct faces, not a single frozen one.
    expect(faces.size).toBeGreaterThan(1);
  });

  it('every emotion has a non-trivial kaomoji pool', () => {
    const emotions: EmotionLabel[] = [
      'joy', 'pride', 'affection', 'gratitude', 'relief', 'hope', 'curiosity',
      'contentment', 'fear', 'anxiety', 'anger', 'frustration', 'sadness',
      'disappointment', 'restlessness', 'boredom',
    ];
    for (const e of emotions) {
      const p = engine.render({ affect: affect(e, 0.7, 0, 0.5), neuro: neuro(), rng: () => 0 });
      expect(p.kaomojiPool.length, `pool for ${e}`).toBeGreaterThanOrEqual(4);
      expect(p.kaomoji, `face for ${e}`).not.toBe('');
    }
  });

  it('faint emotion stays non-expressive (barely colors the reply)', () => {
    const p = engine.render({ affect: affect('joy', 0.1, 0.3, 0.4), neuro: neuro(), rng: () => 0 });
    expect(p.expressive).toBe(false);
    expect(p.kaomoji).toBe('');
    expect(p.directive).toContain('nhẹ');
  });

  it('neutral is never treated as expressive', () => {
    const p = engine.render({ affect: affect('neutral', 0.9, 0, 0.3), neuro: neuro(), rng: () => 0 });
    expect(p.expressive).toBe(false);
  });

  describe('neurochemistry modulates delivery', () => {
    it('high dopamine + positive valence lifts energy and allows exclamation', () => {
      const p = engine.render({ affect: affect('joy', 0.7, 0.7, 0.6), neuro: neuro({ dopamine: 0.85 }), rng: () => 0 });
      expect(p.energy).toBe('high');
      expect(p.punctuation).toContain('!');
    });

    it('high cortisol makes delivery terse and guarded', () => {
      const p = engine.render({ affect: affect('anxiety', 0.6, -0.4, 0.6), neuro: neuro({ cortisol: 0.7 }), rng: () => 0 });
      expect(p.punctuation).toContain('ngắn');
      expect(p.verbalTics.join(' ')).toContain('tập trung');
    });

    it('high oxytocin adds an affectionate tic', () => {
      const p = engine.render({ affect: affect('affection', 0.7, 0.8, 0.4), neuro: neuro({ oxytocin: 0.7 }), rng: () => 0 });
      expect(p.verbalTics.join(' ')).toContain('Sếp');
    });
  });

  it('formatForInjection emits an expressive line only when the feeling is felt', () => {
    const strong = engine.render({ affect: affect('pride', 0.8, 0.7, 0.55), neuro: neuro(), rng: () => 0 });
    expect(engine.formatForInjection(strong)).toContain('thể hiện cảm xúc THẬT');

    const faint = engine.render({ affect: affect('contentment', 0.15, 0.4, 0.2), neuro: neuro(), rng: () => 0 });
    expect(engine.formatForInjection(faint)).toContain('nền');
  });
});
