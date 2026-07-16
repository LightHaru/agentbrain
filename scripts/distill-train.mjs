#!/usr/bin/env node
/**
 * Opus-4.8 → AgentBrain distillation training runner.
 *
 * Trains AgentBrain's reasoning against its REAL persistent brain (SQLite),
 * capped by a wall-clock deadline (default 2h, per Sếp's allowance). Each epoch
 * ingests distilled reasoning, reinforces lessons, writes procedures, persists
 * learned knowledge, and benchmarks. Safe to stop anytime — knowledge persists.
 *
 * Usage:
 *   node scripts/distill-train.mjs [--minutes=120] [--brain=/root/.openclaw/data/agentbrain] [--epochs=100000]
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { DistillationTrainer } = require('../dist/training/distillation-trainer.js');
const { OPUS_DISTILLATION } = require('../dist/training/distillation-corpus.js');
const { SqlStorageAdapter } = require('../dist/storage/sql-adapter.js');
const { LessonLearner } = require('../dist/core/lesson-learner.js');
const { ErrorLedger } = require('../dist/core/error-ledger.js');
const { getEmbeddingEngine } = require('../dist/core/embedding-engine.js');
const { KnowledgeStore } = require('../dist/core/knowledge-store.js');

function arg(name, def) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
}

const minutes = Number(arg('minutes', '120'));
const brainDir = arg('brain', '/root/.openclaw/data/agentbrain');
const maxEpochs = Number(arg('epochs', '100000'));

const deadlineMs = Date.now() + minutes * 60_000;
console.log(`\n🧠 AgentBrain distillation — teacher=${OPUS_DISTILLATION.teacher} corpus=v${OPUS_DISTILLATION.version}`);
console.log(`   brainDir=${brainDir}`);
console.log(`   time cap=${minutes} min (deadline ${new Date(deadlineMs).toISOString()})`);
console.log(`   max epochs=${maxEpochs}\n`);

const store = new SqlStorageAdapter(brainDir);
const db = store.getDatabase();
const lessonLearner = new LessonLearner();

const addProcedure = (trigger, action, tags) => {
  const id = `proc-distill-${Buffer.from(trigger).toString('hex').slice(0, 10)}`;
  db.insertMemory({
    id,
    type: 'procedural',
    content: `[Procedure] ${trigger} → ${action}`,
    timestamp: new Date().toISOString(),
    confidence: 0.75,
    tags: [...tags, 'distilled'],
  });
};

const errorLedger = new ErrorLedger(store, getEmbeddingEngine());
await errorLedger.initialize();
const knowledgeStore = new KnowledgeStore(db, getEmbeddingEngine());

const trainer = new DistillationTrainer({ store, lessonLearner, addProcedure, errorLedger, knowledgeStore });

let epochCount = 0;
const t0 = Date.now();
const onEpoch = (r) => {
  epochCount = r.epoch;
  if (r.epoch % 20 === 0 || r.epoch <= 3) {
    const mins = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(
      `  epoch ${r.epoch} | bench=${r.benchmark} | playbooks=${r.playbooks} | ` +
      `lessons_reinforced=${r.lessonsReinforced} | avgLessonConf=${r.avgLessonConfidence} | ${mins}min`
    );
  }
};

const report = await trainer.train({
  corpus: OPUS_DISTILLATION,
  epochs: maxEpochs,
  deadlineMs,
  onEpoch,
  evalSemantic: true,
});

console.log('\n─────────────── TRAINING COMPLETE ───────────────');
console.log(`teacher:            ${report.teacher} (corpus v${report.corpusVersion})`);
console.log(`epochs run:         ${report.epochs}`);
console.log(`benchmark before:   ${report.before.total.toFixed(4)}`);
console.log(`benchmark after:    ${report.after.total.toFixed(4)}`);
console.log(`improvement:        +${report.improvement.toFixed(4)}`);
console.log(`held-out before:    ${report.heldoutBefore.total.toFixed(4)}`);
console.log(`held-out after:     ${report.heldoutAfter.total.toFixed(4)}  (generalization)`);
console.log(`held-out gain:      +${report.heldoutImprovement.toFixed(4)}`);
if (report.heldoutSemantic !== null) {
  console.log(`held-out SEMANTIC:  ${report.heldoutSemantic.toFixed(4)}  (local MiniLM intent matching)`);
}
console.log(`error ledger size:  ${errorLedger.size()} remembered mistakes`);
console.log(`knowledge store:    ${report.knowledgeCount} items ${JSON.stringify(report.knowledgeByKind)}`);
console.log(`knowledge pruned:   ${report.knowledgePruned} (anti-bloat)`);
console.log(`playbooks:          builtin=${report.playbookCount.builtin} learned=${report.playbookCount.learned} total=${report.playbookCount.total}`);
console.log(`lessons:            ${report.lessonCount} (avg conf ${report.avgLessonConfidence})`);
console.log(`elapsed:            ${((Date.now() - t0) / 60000).toFixed(2)} min`);

const outPath = resolve(brainDir, 'distillation-report.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`\nreport saved: ${outPath}`);
console.log('learned knowledge persisted to the brain (survives restarts & accumulates).');
