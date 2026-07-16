#!/usr/bin/env node
/**
 * Recall-quality eval runner. Seeds a temp brain with the golden corpus, runs
 * REAL Hippocampus recall + RelevanceCritic, and prints precision/recall@k, MRR
 * and a strict "clean" score. Use before/after an upgrade to prove the brain
 * got better at finding the right memory (not just reasoning).
 *
 * Usage: node scripts/recall-eval.mjs [--k=5] [--json]
 */
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const { Hippocampus } = require('../dist/core/hippocampus.js');
const { SqlStorageAdapter } = require('../dist/storage/sql-adapter.js');
const { RelevanceCritic } = require('../dist/core/relevance-critic.js');
const { defaultConfig } = require('../dist/core/config.js');
const { runRecallEval, GOLDEN_RECALL_CORPUS } = require('../dist/training/recall-eval.js');

const args = process.argv.slice(2);
const k = Number((args.find((a) => a.startsWith('--k=')) || '--k=5').split('=')[1]);
const asJson = args.includes('--json');

const dir = mkdtempSync(join(tmpdir(), 'agentbrain-recall-eval-'));
let storage;
try {
  storage = new SqlStorageAdapter(dir);
  const now = new Date().toISOString();
  await storage.writeMemoryFile(
    'semantic',
    GOLDEN_RECALL_CORPUS.map((g) => ({
      id: g.id, type: 'semantic', content: g.content, timestamp: now,
      confidence: 0.8, accessCount: 1, lastAccessed: now, tags: [],
    })),
  );
  const hippo = new Hippocampus({ ...defaultConfig, brainDir: dir }, storage);
  await hippo.initialize();
  const critic = new RelevanceCritic();

  const probes = [];
  for (const g of GOLDEN_RECALL_CORPUS)
    for (const q of g.queries)
      probes.push({ id: `${g.id}:${q.slice(0, 12)}`, query: q, relevantIds: [g.id] });

  const result = await runRecallEval(
    probes,
    async (query) => {
      const mems = await hippo.recall(query, 'general');
      return critic.critique(mems, { query, maxKeep: k }).kept.map((m) => m.id);
    },
    k,
  );

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n=== AgentBrain Recall Eval (k=${result.k}, ${probes.length} probes) ===`);
    console.log(`Precision@${k}: ${(result.precisionAtK * 100).toFixed(1)}%`);
    console.log(`Recall@${k}:    ${(result.recallAtK * 100).toFixed(1)}%`);
    console.log(`MRR:          ${result.mrr.toFixed(3)}`);
    console.log(`Clean:        ${(result.clean * 100).toFixed(1)}%`);
  }
} finally {
  try { storage?.close?.(); } catch { /* already closed */ }
  // Windows holds the sqlite handle briefly after close; retry the unlink.
  for (let i = 0; i < 5; i++) {
    try { rmSync(dir, { recursive: true, force: true }); break; }
    catch (e) {
      if (i === 4 || (e.code !== 'EBUSY' && e.code !== 'EPERM')) break;
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
}
