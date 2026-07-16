/**
 * KnowledgeStore tests — durable, dedup'd, searchable, prunable knowledge.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { KnowledgeStore } from '../src/core/knowledge-store.js';

describe('KnowledgeStore', () => {
  let dir: string;
  let db: BrainDatabase;
  let ks: KnowledgeStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'agentbrain-ks-'));
    db = new BrainDatabase(join(dir, 'brain.db'));
    ks = new KnowledgeStore(db, null); // no embedder → keyword fallback
  });
  afterEach(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('stores knowledge and finds it by keyword search', async () => {
    await ks.upsert({ kind: 'lesson', title: 'verify before done', content: 'run the build and tests before claiming done', tags: ['verification'] });
    const hits = await ks.search('did you run tests before done', { limit: 3 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].item.title).toContain('verify');
  });

  it('DEDUPS identical content (anti-bloat) and reinforces confidence', async () => {
    const a = await ks.upsert({ kind: 'lesson', title: 't', content: 'same content here', confidence: 0.6 });
    const b = await ks.upsert({ kind: 'lesson', title: 't', content: 'same content here', confidence: 0.6 });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.id).toBe(a.id);
    expect(ks.size()).toBe(1);
    const item = ks.getAll('lesson')[0];
    expect(item.confidence).toBeGreaterThan(0.6);
  });

  it('records usage on retrieval', async () => {
    await ks.upsert({ kind: 'procedure', title: 'p', content: 'deploy pipeline steps ci cd build test' });
    await ks.search('ci cd build test pipeline', { limit: 1 });
    const item = ks.getAll('procedure')[0];
    expect(item.useCount).toBeGreaterThan(0);
  });

  it('prunes never-used low-confidence stale knowledge', async () => {
    // Insert a stale, low-confidence, unused item by backdating created_at.
    await ks.upsert({ kind: 'fact', title: 'junk', content: 'useless never used fact', confidence: 0.2 });
    // Force created_at into the past.
    db.raw(`UPDATE knowledge SET created_at = ? WHERE kind = 'fact'`, ['2020-01-01T00:00:00.000Z']);
    const before = ks.size();
    const pruned = ks.prune({ maxAgeDays: 30, minConfidence: 0.4 });
    expect(pruned).toBeGreaterThan(0);
    expect(ks.size()).toBeLessThan(before);
  });

  it('does NOT prune high-confidence or used knowledge', async () => {
    await ks.upsert({ kind: 'lesson', title: 'good', content: 'high value lesson', confidence: 0.9 });
    db.raw(`UPDATE knowledge SET created_at = ? WHERE kind = 'lesson'`, ['2020-01-01T00:00:00.000Z']);
    const pruned = ks.prune({ maxAgeDays: 30, minConfidence: 0.4 });
    expect(pruned).toBe(0);
    expect(ks.size()).toBe(1);
  });

  it('counts by kind', async () => {
    await ks.upsert({ kind: 'lesson', title: 'l', content: 'lesson one' });
    await ks.upsert({ kind: 'error', title: 'e', content: 'error one' });
    const counts = ks.countByKind();
    expect(counts.lesson).toBe(1);
    expect(counts.error).toBe(1);
  });
});
