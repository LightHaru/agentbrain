/**
 * MemoryGraph tests — multi-hop "bridge" recall over the facts graph.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { MemoryGraph } from '../src/core/memory-graph.js';

describe('MemoryGraph', () => {
  let dir: string;
  let db: BrainDatabase;
  let graph: MemoryGraph;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'agentbrain-graph-'));
    db = new BrainDatabase(join(dir, 'brain.db'));
    graph = new MemoryGraph(db);
  });
  afterEach(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });

  function fact(id: string, s: string, r: string, o: string) {
    db.insertFact({ id, subject: s, relation: r, object: o, confidence: 0.9, source: 'test', timestamp: new Date().toISOString() });
  }

  it('builds nodes and edges from active facts', () => {
    fact('f1', 'TinGameFi', 'runs_on', 'Solana');
    fact('f2', 'Solana', 'is', 'blockchain layer 1');
    const stats = graph.stats();
    expect(stats.nodes).toBeGreaterThanOrEqual(3);
    expect(stats.edges).toBe(2);
  });

  it('bridges across two hops: project -> chain -> chain property', () => {
    fact('f1', 'TinGameFi', 'runs_on', 'Solana');
    fact('f2', 'Solana', 'has', 'phí gas thấp');
    // Query mentions the project; the gas-fee fact is 2 hops away via Solana.
    const { facts } = graph.recallConnected('TinGameFi', { maxHops: 2 });
    const objs = facts.map((f) => f.object);
    expect(objs).toContain('Solana');
    expect(objs).toContain('phí gas thấp');
  });

  it('does NOT surface unrelated facts', () => {
    fact('f1', 'TinGameFi', 'runs_on', 'Solana');
    fact('f2', 'Sếp', 'prefers', 'cà phê sữa đá');
    const { facts } = graph.recallConnected('TinGameFi', { maxHops: 2 });
    const text = facts.map((f) => `${f.subject} ${f.object}`).join(' ');
    expect(text).not.toContain('cà phê');
  });

  it('respects superseded facts (outdated edges never surface)', () => {
    fact('f1', 'dự án', 'uses', 'MySQL');
    fact('f2', 'dự án', 'uses', 'PostgreSQL');
    db.supersedeFact('f1', 'f2');
    graph.build();
    const { facts } = graph.recallConnected('dự án dùng database gì', { maxHops: 1 });
    const objs = facts.map((f) => f.object);
    expect(objs).toContain('PostgreSQL');
    expect(objs).not.toContain('MySQL');
  });

  it('formatForInjection emits a compact graph line or nothing', () => {
    fact('f1', 'TinGameFi', 'runs_on', 'Solana');
    fact('f2', 'Solana', 'has', 'phí gas thấp');
    const line = graph.formatForInjection('TinGameFi', { maxHops: 2 });
    expect(line).toContain('graph');
    expect(line).toContain('Solana');
    expect(graph.formatForInjection('chủ đề hoàn toàn không liên quan xyz')).toBe('');
  });
});
