/**
 * AutoReflector tests — self-triggered reflection after a rough streak.
 */
import { describe, it, expect } from 'vitest';
import { AutoReflector, type ReflectionSignal } from '../src/core/auto-reflector.js';

const S = 'sess-1';
function sig(p: Partial<ReflectionSignal>): ReflectionSignal {
  return {
    sessionId: S,
    userMessage: '',
    agentResponse: '',
    sentiment: 0,
    correction: false,
    timestamp: new Date().toISOString(),
    ...p,
  };
}

describe('AutoReflector', () => {
  it('does not reflect on a good session', () => {
    const ar = new AutoReflector();
    let fired = null;
    for (let i = 0; i < 5; i++) {
      fired = ar.record(sig({ userMessage: 'cảm ơn em', sentiment: 0.6 }));
    }
    expect(fired).toBeNull();
  });

  it('fires after enough corrections and distills a lesson', () => {
    const ar = new AutoReflector({ correctionThreshold: 2 });
    ar.record(sig({ userMessage: 'sai rồi, deploy phải dùng pm2', sentiment: -0.5, correction: true, fix: 'dùng pm2 không dùng systemd' }));
    const fired = ar.record(sig({ userMessage: 'lại sai cái deploy nữa', sentiment: -0.5, correction: true, fix: 'nhớ pm2' }));
    expect(fired).not.toBeNull();
    expect(fired!.correctionCount).toBeGreaterThanOrEqual(2);
    expect(fired!.theme).toContain('deploy');
    expect(fired!.lesson.toLowerCase()).toContain('pm2');
  });

  it('fires after a streak of negative sentiment', () => {
    const ar = new AutoReflector({ negThreshold: 3 });
    ar.record(sig({ userMessage: 'không đúng', sentiment: -0.4 }));
    ar.record(sig({ userMessage: 'vẫn sai', sentiment: -0.4 }));
    const fired = ar.record(sig({ userMessage: 'tệ quá', sentiment: -0.4 }));
    expect(fired).not.toBeNull();
    expect(fired!.negativeCount).toBeGreaterThanOrEqual(3);
  });

  it('resets the streak after firing (no double-fire on next turn)', () => {
    const ar = new AutoReflector({ correctionThreshold: 2 });
    ar.record(sig({ userMessage: 'sai deploy', sentiment: -0.5, correction: true }));
    const first = ar.record(sig({ userMessage: 'sai deploy nữa', sentiment: -0.5, correction: true }));
    expect(first).not.toBeNull();
    const second = ar.record(sig({ userMessage: 'ok cảm ơn', sentiment: 0.5 }));
    expect(second).toBeNull();
  });

  it('isolates sessions', () => {
    const ar = new AutoReflector({ correctionThreshold: 2 });
    ar.record(sig({ sessionId: 'a', correction: true, sentiment: -0.5 }));
    const other = ar.record(sig({ sessionId: 'b', correction: true, sentiment: -0.5 }));
    expect(other).toBeNull(); // session b only has 1 correction
  });
});
