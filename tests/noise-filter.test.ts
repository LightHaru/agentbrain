/**
 * Tests for Noise Filter — protects memory from runtime/telemetry pollution.
 */

import { describe, it, expect } from 'vitest';
import { isSystemNoise, stripNoiseLines } from '../src/core/noise-filter.js';

describe('NoiseFilter', () => {
  describe('isSystemNoise — real pollution seen in the live brain DB', () => {
    it('flags model metadata fallback warnings', () => {
      expect(
        isSystemNoise('⚠ Model metadata for `claude-opus-4-8` not found. Defaulting to fallback metadata')
      ).toBe(true);
    });

    it('flags token/cost telemetry counters', () => {
      expect(isSystemNoise('🧮 Tokens: 61k in / 2.7k out · 💵 Cost: $0.0000')).toBe(true);
    });

    it('flags assistant turn failure notices', () => {
      expect(isSystemNoise('[assistant turn failed: provider error]')).toBe(true);
    });

    it('flags context window / session status lines', () => {
      expect(isSystemNoise('Context window compacted to fit budget')).toBe(true);
      expect(isSystemNoise('Session resumed')).toBe(true);
    });

    it('flags rate-limit / retry plumbing', () => {
      expect(isSystemNoise('Rate limit exceeded, remaining 0')).toBe(true);
      expect(isSystemNoise('Retrying in 500 ms')).toBe(true);
    });

    it('flags log-level diagnostic prefixes', () => {
      expect(isSystemNoise('WARNING: embedding cache miss')).toBe(true);
      expect(isSystemNoise('[telemetry] flushed 12 events')).toBe(true);
    });
  });

  describe('isSystemNoise — genuine conversation is preserved', () => {
    it('keeps real user preferences', () => {
      expect(isSystemNoise('Anh thích dùng Cursor hơn VSCode')).toBe(false);
    });

    it('keeps real findings with prices', () => {
      expect(isSystemNoise('Giá PRL hiện tại là $0.42, tăng 5% hôm nay')).toBe(false);
    });

    it('keeps decisions', () => {
      expect(isSystemNoise('Chốt rồi, deploy lên production đi')).toBe(false);
    });

    it('handles empty / null input', () => {
      expect(isSystemNoise('')).toBe(false);
      expect(isSystemNoise(undefined)).toBe(false);
      expect(isSystemNoise(null)).toBe(false);
    });
  });

  describe('stripNoiseLines', () => {
    it('removes telemetry footer but keeps the real finding', () => {
      const mixed = [
        'Giá PRL hiện tại là $0.42',
        '🧮 Tokens: 61k in / 2.7k out · 💵 Cost: $0.0000',
      ].join('\n');
      const cleaned = stripNoiseLines(mixed);
      expect(cleaned).toContain('$0.42');
      expect(cleaned).not.toContain('Tokens');
    });

    it('returns empty when everything is noise', () => {
      const allNoise = [
        '⚠ Model metadata for `x` not found. Defaulting to fallback metadata',
        '🧮 Tokens: 10k in / 1k out',
      ].join('\n');
      expect(stripNoiseLines(allNoise)).toBe('');
    });
  });
});
