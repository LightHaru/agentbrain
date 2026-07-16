import { describe, it, expect } from 'vitest';
import { FreshnessGuard } from '../src/core/freshness-guard.js';

const guard = new FreshnessGuard();
const NOW = Date.parse('2026-07-13T12:00:00.000Z');
const ago = (sec: number) => new Date(NOW - sec * 1000).toISOString();

describe('FreshnessGuard', () => {
  it('classifies a price finding as volatile', () => {
    expect(guard.classify('Giá PRL ~$0.171 trên Raydium')).toBe('price');
    expect(guard.classify('market cap ~$30M, volume 24h $4,080')).toBe('market');
    expect(guard.classify('hashrate rig chính 120 TH/s')).toBe('balance');
  });

  it('does not classify plain chat as volatile', () => {
    expect(guard.classify('anh dùng pool AlphaPool nhé')).toBe('none');
    // price word but no number -> not volatile as a stored fact
    expect(guard.classify('giá cả dạo này thế nào em')).toBe('none');
  });

  it('treats a fresh price (< 5 min) as NOT stale', () => {
    const v = guard.judge('Giá PRL $0.171', ago(120), NOW); // 2 min
    expect(v.isVolatile).toBe(true);
    expect(v.isStale).toBe(false);
  });

  it('treats a price older than 5 min as stale', () => {
    const v = guard.judge('Giá PRL $0.171', ago(360), NOW); // 6 min
    expect(v.isStale).toBe(true);
  });

  it('queryIsVolatile detects a price question by wording alone', () => {
    expect(guard.queryIsVolatile('Giá PRL bây giờ bao nhiêu?')).toBe('price');
    expect(guard.queryIsVolatile('em khỏe không')).toBe('none');
  });

  it('builds a stale warning only for expired volatile memories', () => {
    const mems = [
      { content: 'Giá PRL $0.171', timestamp: ago(600) },          // 10 min -> stale
      { content: 'anh dùng pool AlphaPool', timestamp: ago(600) }, // not volatile
      { content: 'Giá PRL $0.18', timestamp: ago(60) },            // 1 min -> fresh
    ];
    const { warning, hasStale } = guard.buildStaleWarning(mems, NOW);
    expect(hasStale).toBe(true);
    expect(warning).toContain('CŨ');
    expect(warning).toContain('$0.171');
    expect(warning).not.toContain('AlphaPool');
  });

  it('returns no warning when volatile data is all fresh', () => {
    const mems = [{ content: 'Giá PRL $0.18', timestamp: ago(30) }];
    const { hasStale } = guard.buildStaleWarning(mems, NOW);
    expect(hasStale).toBe(false);
  });

  it('formats age in human-friendly Vietnamese', () => {
    expect(guard.formatAge(45)).toContain('giây');
    expect(guard.formatAge(420)).toContain('phút');
    expect(guard.formatAge(7200)).toContain('giờ');
  });
});
