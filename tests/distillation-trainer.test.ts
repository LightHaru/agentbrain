/**
 * Tests for the Opus-4.8 distillation trainer: distilled reasoning is really
 * ingested, benchmark improves, lessons reinforce, and learned knowledge
 * persists so the brain keeps getting smarter across runs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DistillationTrainer, type TrainerStore } from '../src/training/distillation-trainer.js';
import { OPUS_DISTILLATION } from '../src/training/distillation-corpus.js';
import { runBenchmark } from '../src/training/benchmark.js';
import { clearLearnedPlaybooks, countPlaybooks } from '../src/core/reasoning-playbooks.js';
import { LessonLearner } from '../src/core/lesson-learner.js';

function memStore(): TrainerStore & { dump: Map<string, string> } {
  const dump = new Map<string, string>();
  return {
    dump,
    async readFile(p) { return dump.has(p) ? dump.get(p)! : null; },
    async writeFile(p, c) { dump.set(p, c); },
  };
}

describe('DistillationTrainer', () => {
  beforeEach(() => {
    clearLearnedPlaybooks(); // isolate the global registry per test
  });

  it('training raises the reasoning benchmark (brain gets smarter)', async () => {
    const lessonLearner = new LessonLearner();
    const before = runBenchmark(undefined, lessonLearner);

    const trainer = new DistillationTrainer({ store: memStore(), lessonLearner });
    const report = await trainer.train({ epochs: 3 });

    expect(report.before.total).toBeCloseTo(before.total, 5);
    expect(report.after.total).toBeGreaterThan(report.before.total);
    expect(report.improvement).toBeGreaterThan(0);
  });

  it('generalizes to HELD-OUT probes (not just memorized training probes)', async () => {
    const trainer = new DistillationTrainer({ store: memStore(), lessonLearner: new LessonLearner() });
    const report = await trainer.train({ epochs: 3 });
    // Distilled reasoning must lift performance on unseen phrasings too.
    expect(report.heldoutAfter.total).toBeGreaterThan(report.heldoutBefore.total);
    expect(report.heldoutImprovement).toBeGreaterThan(0);
  });

  it('ingests distilled playbooks into the live registry', async () => {
    const trainer = new DistillationTrainer({ store: memStore() });
    await trainer.train({ epochs: 1 });
    expect(countPlaybooks().learned).toBeGreaterThanOrEqual(OPUS_DISTILLATION.playbooks.length);
  });

  it('reinforces distilled lessons with rising confidence over epochs', async () => {
    const lessonLearner = new LessonLearner();
    const trainer = new DistillationTrainer({ store: memStore(), lessonLearner });
    const report = await trainer.train({ epochs: 4 });

    expect(report.lessonCount).toBeGreaterThanOrEqual(OPUS_DISTILLATION.lessons.length);
    // Confidence should climb from repeated reinforcement across epochs.
    const first = report.epochReports[0].avgLessonConfidence;
    const last = report.epochReports[report.epochReports.length - 1].avgLessonConfidence;
    expect(last).toBeGreaterThanOrEqual(first);
  });

  it('persists learned knowledge and reloads it (accumulates across runs)', async () => {
    const store = memStore();

    // Run 1
    const t1 = new DistillationTrainer({ store, lessonLearner: new LessonLearner() });
    await t1.train({ epochs: 2 });
    expect(store.dump.has('learning/reasoning-playbooks.md')).toBe(true);
    expect(store.dump.has('learning/distilled-lessons.md')).toBe(true);

    // Simulate restart: clear the in-memory registry, then a fresh trainer loads.
    clearLearnedPlaybooks();
    expect(countPlaybooks().learned).toBe(0);

    const t2 = new DistillationTrainer({ store, lessonLearner: new LessonLearner() });
    await t2.loadLearned();
    expect(countPlaybooks().learned).toBeGreaterThan(0); // reloaded from persistence
  });

  it('respects a training deadline (time cap)', async () => {
    const trainer = new DistillationTrainer({ store: memStore() });
    // Deadline already passed → should stop before running epochs.
    const report = await trainer.train({ epochs: 100, deadlineMs: Date.now() - 1 });
    expect(report.epochs).toBe(0);
  });

  it('writes procedures through the sink on first epoch', async () => {
    const procs: Array<{ trigger: string; action: string }> = [];
    const trainer = new DistillationTrainer({
      store: memStore(),
      addProcedure: (trigger, action) => { procs.push({ trigger, action }); },
    });
    await trainer.train({ epochs: 2 });
    // The trainer writes the MERGED effective corpus (base + code + design),
    // so it must include at least the base procedures and add the new ones.
    expect(procs.length).toBeGreaterThanOrEqual(OPUS_DISTILLATION.procedures.length);
    expect(procs.some((p) => /reproduce|stack trace|bug/i.test(p.action))).toBe(true); // code proc
    expect(procs.some((p) => /tokens|render|responsive|AI-tells|8px/i.test(p.action))).toBe(true); // design proc
  });
});
