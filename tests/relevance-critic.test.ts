import { describe, it, expect } from 'vitest';
import { RelevanceCritic } from '../src/core/relevance-critic.js';
import type { Memory } from '../src/index.js';

const critic = new RelevanceCritic();
const now = new Date().toISOString();
const old = new Date(Date.now() - 120 * 86400_000).toISOString();

function mem(p: Partial<Memory>): Memory {
  return {
    id: Math.random().toString(36).slice(2),
    type: 'semantic',
    content: '',
    timestamp: now,
    confidence: 0.7,
    accessCount: 1,
    lastAccessed: now,
    tags: [],
    ...p,
  };
}

describe('RelevanceCritic', () => {
  it('keeps relevant high-confidence memories', () => {
    const r = critic.critique(
      [mem({ content: 'Anh dùng pool AlphaPool cho mining PRL', confidence: 0.8 })],
      { query: 'pool mining PRL nào' },
    );
    expect(r.kept.length).toBe(1);
  });

  it('drops clearly irrelevant memories', () => {
    const r = critic.critique(
      [mem({ content: 'Sếp thích uống cà phê sữa đá buổi sáng', confidence: 0.5 })],
      { query: 'cấu hình nginx reverse proxy như nào' },
    );
    expect(r.kept.length).toBe(0);
    expect(r.dropped.length).toBe(1);
  });

  it('penalizes stale memories unless history is wanted', () => {
    const fresh = mem({ content: 'giá sàn PRL là 2 USD', confidence: 0.7, lastAccessed: now, timestamp: now });
    const stale = mem({ content: 'giá sàn PRL là 5 USD', confidence: 0.7, lastAccessed: old, timestamp: old });
    const r = critic.critique([fresh, stale], { query: 'giá sàn PRL bao nhiêu' });
    // fresh should rank ahead of stale
    expect(r.kept[0].content).toContain('2 USD');
  });

  it('flags conflicting numeric memories', () => {
    const a = mem({ content: 'hashrate rig chính là 100 TH/s', confidence: 0.7 });
    const b = mem({ content: 'hashrate rig chính là 250 TH/s', confidence: 0.7 });
    const r = critic.critique([a, b], { query: 'hashrate rig chính bao nhiêu' });
    expect(r.conflicts.length).toBeGreaterThan(0);
  });

  it('marks weak recall when nothing is relevant', () => {
    const r = critic.critique(
      [mem({ content: 'random unrelated note about weather', confidence: 0.3 })],
      { query: 'kubernetes ingress controller' },
    );
    expect(r.weak).toBe(true);
    expect(critic.formatForInjection(r)).toContain('yếu');
  });
});
