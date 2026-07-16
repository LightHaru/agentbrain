/**
 * FactChangeTracker tests — surface superseded (changed) facts to Aira.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { FactChangeTracker } from '../src/core/fact-change-tracker.js';

describe('FactChangeTracker', () => {
  let dir: string;
  let db: BrainDatabase;
  let tracker: FactChangeTracker;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'agentbrain-fct-'));
    db = new BrainDatabase(join(dir, 'brain.db'));
    tracker = new FactChangeTracker(db);
  });
  afterEach(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });

  function fact(id: string, s: string, r: string, o: string) {
    db.insertFact({ id, subject: s, relation: r, object: o, confidence: 0.9, source: 'test', timestamp: new Date().toISOString() });
  }

  it('surfaces a changed value with old → new', () => {
    fact('f1', 'dự án', 'uses', 'MySQL');
    fact('f2', 'dự án', 'uses', 'PostgreSQL');
    db.supersedeFact('f1', 'f2');

    const changes = tracker.relevantChanges('dự án dùng database gì');
    expect(changes.length).toBe(1);
    expect(changes[0].oldValue).toBe('MySQL');
    expect(changes[0].newValue).toBe('PostgreSQL');

    const note = tracker.formatForInjection(changes);
    expect(note).toContain('đã thay đổi');
    expect(note).toContain('MySQL');
    expect(note).toContain('PostgreSQL');
  });

  it('does not surface changes unrelated to the query', () => {
    fact('f1', 'deploy', 'uses', 'pm2');
    fact('f2', 'deploy', 'uses', 'docker');
    db.supersedeFact('f1', 'f2');
    const changes = tracker.relevantChanges('múi giờ của anh là gì');
    expect(changes.length).toBe(0);
  });

  it('ignores supersede when the value did not actually change', () => {
    fact('f1', 'x', 'is', 'same');
    fact('f2', 'x', 'is', 'same');
    db.supersedeFact('f1', 'f2');
    const changes = tracker.relevantChanges('x is what');
    expect(changes.length).toBe(0);
  });
});
