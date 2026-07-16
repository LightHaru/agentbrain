/**
 * Tests for the Error Ledger — AgentBrain remembers mistakes + fixes and
 * recalls the relevant one so Aira does not repeat it.
 */

import { describe, it, expect } from 'vitest';
import { ErrorLedger, type ErrorLedgerStore } from '../src/core/error-ledger.js';

function memStore(): ErrorLedgerStore & { dump: Map<string, string> } {
  const dump = new Map<string, string>();
  return {
    dump,
    async readFile(p) { return dump.has(p) ? dump.get(p)! : null; },
    async writeFile(p, c) { dump.set(p, c); },
  };
}

describe('ErrorLedger', () => {
  it('records a mistake + fix and recalls it for a similar task', async () => {
    const led = new ErrorLedger(memStore());
    await led.record({
      context: 'fixing a failing api test',
      mistake: 'claimed fixed without running the test',
      rootCause: 'assumed correctness',
      fix: 'reproduce then re-run the failing test to confirm',
      tags: ['debug'],
    });

    const recalled = await led.recall('api test đang fail, sửa giúp anh', 3);
    expect(recalled.length).toBeGreaterThan(0);
    expect(recalled[0].fix).toContain('re-run');
  });

  it('reinforces (not duplicates) a recurring mistake', async () => {
    const led = new ErrorLedger(memStore());
    const first = await led.record({
      context: 'deploy to production', mistake: 'deployed without confirming', fix: 'confirm first', tags: ['safety'],
    });
    expect(first.occurrences).toBe(1);
    const confBefore = first.confidence;
    const again = await led.record({
      context: 'deploy to production', mistake: 'deployed without confirming', fix: 'confirm first and check reversibility', tags: ['safety'],
    });
    expect(again.id).toBe(first.id);
    expect(again.occurrences).toBe(2);
    expect(again.confidence).toBeGreaterThan(confBefore);
    expect(led.size()).toBe(1);
  });

  it('persists and reloads across instances (learns over time)', async () => {
    const store = memStore();
    const led1 = new ErrorLedger(store);
    await led1.record({ context: 'scope creep', mistake: 'refactored unrelated code', fix: 'minimal edit only', tags: ['scope'] });

    const led2 = new ErrorLedger(store);
    await led2.initialize();
    expect(led2.size()).toBe(1);
    const r = await led2.recall('refactored unrelated code again', 3);
    expect(r.length).toBeGreaterThan(0);
  });

  it('formats recalled mistakes as a Vietnamese reminder for Aira', async () => {
    const led = new ErrorLedger(memStore());
    await led.record({ context: 'giá token', mistake: 'nói số cũ như số hiện tại', rootCause: 'coi data volatile là ổn định', fix: 'lấy nguồn live + timestamp', tags: ['verify'] });
    const r = await led.recall('giá token bây giờ bao nhiêu', 3);
    const text = led.formatForInjection(r);
    expect(text).toContain('Lỗi cũ');
    expect(text).toContain('Cách sửa');
  });

  it('returns empty recall on an empty ledger', async () => {
    const led = new ErrorLedger(memStore());
    expect(await led.recall('anything', 3)).toEqual([]);
    expect(led.formatForInjection([])).toBe('');
  });
});
