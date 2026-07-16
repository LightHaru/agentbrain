/**
 * RecallEval tests — prove the harness measures recall quality correctly AND
 * run it against the REAL Hippocampus recall + RelevanceCritic so we have a
 * baseline number for "does the brain find the right memory".
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { cleanupDir } from './helpers/cleanup.js';
import { Hippocampus } from '../src/core/hippocampus.js';
import { SqlStorageAdapter } from '../src/storage/sql-adapter.js';
import { RelevanceCritic } from '../src/core/relevance-critic.js';
import { defaultConfig } from '../src/core/config.js';
import {
  runRecallEval,
  GOLDEN_RECALL_CORPUS,
  type RecallProbe,
} from '../src/training/recall-eval.js';

describe('RecallEval harness', () => {
  it('scores perfect recall as 1.0 and pure noise as 0', async () => {
    const probes: RecallProbe[] = [
      { id: 'p1', query: 'q', relevantIds: ['a', 'b'] },
    ];
    const perfect = await runRecallEval(probes, () => ['a', 'b'], 5);
    expect(perfect.recallAtK).toBe(1);
    expect(perfect.precisionAtK).toBe(1);
    expect(perfect.clean).toBe(1);
    expect(perfect.mrr).toBe(1);

    const noise = await runRecallEval(probes, () => ['x', 'y', 'z'], 5);
    expect(noise.recallAtK).toBe(0);
    expect(noise.precisionAtK).toBe(0);
    expect(noise.clean).toBe(0);
  });

  it('MRR rewards ranking the relevant memory higher', async () => {
    const probes: RecallProbe[] = [{ id: 'p', query: 'q', relevantIds: ['a'] }];
    const early = await runRecallEval(probes, () => ['a', 'x', 'y'], 5);
    const late = await runRecallEval(probes, () => ['x', 'y', 'a'], 5);
    expect(early.mrr).toBeGreaterThan(late.mrr);
  });

  describe('against real Hippocampus recall', () => {
    let dir: string;
    let storage: SqlStorageAdapter;
    let hippo: Hippocampus;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'agentbrain-recall-eval-'));
      storage = new SqlStorageAdapter(dir);
      // Seed the golden corpus with STABLE ids so eval labels line up.
      const now = new Date().toISOString();
      await storage.writeMemoryFile(
        'semantic',
        GOLDEN_RECALL_CORPUS.map((g) => ({
          id: g.id,
          type: 'semantic' as const,
          content: g.content,
          timestamp: now,
          confidence: 0.8,
          accessCount: 1,
          lastAccessed: now,
          tags: [],
        })),
      );
      hippo = new Hippocampus({ ...defaultConfig, brainDir: dir }, storage);
      await hippo.initialize();
    });

    afterEach(async () => {
      storage.close();
      await cleanupDir(dir);
    });

    it('recalls the right golden memories at a usable quality bar', async () => {
      const critic = new RelevanceCritic();
      const probes: RecallProbe[] = [];
      for (const g of GOLDEN_RECALL_CORPUS) {
        for (const q of g.queries) {
          probes.push({ id: `${g.id}:${q.slice(0, 12)}`, query: q, relevantIds: [g.id] });
        }
      }

      const result = await runRecallEval(
        probes,
        async (query) => {
          const mems = await hippo.recall(query, 'general');
          const critique = critic.critique(mems, { query, maxKeep: 5 });
          return critique.kept.map((m) => m.id);
        },
        5,
      );

      // Baseline bar: the brain should find the right memory for most probes.
      // (keyword/vector recall on 8 distinct facts should be strong.)
      expect(result.recallAtK).toBeGreaterThanOrEqual(0.6);
      expect(result.mrr).toBeGreaterThanOrEqual(0.5);
    });
  });
});
