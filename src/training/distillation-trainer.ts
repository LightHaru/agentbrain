/**
 * Distillation trainer — transfers Opus-4.8 reasoning into AgentBrain's real
 * learnable stores and reinforces it over epochs, then measures the gain.
 *
 * What it actually does (symbolic distillation, not GPU fine-tuning):
 *  1. Registers distilled reasoning playbooks into the live playbook registry
 *     (so ReasoningCortex whispers now carry teacher-quality frames/checks).
 *  2. Feeds distilled lessons through the REAL LessonLearner reinforcement path
 *     (repetition raises confidence, exactly like learning from a human).
 *  3. Writes distilled procedures as procedural memories via the storage layer.
 *  4. Persists learned playbooks + lessons so the knowledge survives restarts
 *     and ACCUMULATES across future runs (the brain gets smarter over time).
 *  5. Benchmarks reasoning coverage before vs after to prove improvement.
 */

import {
  registerLearnedPlaybook,
  deserializePlaybook,
  getLearnedPlaybooks,
  countPlaybooks,
  type SerializedPlaybook,
} from '../core/reasoning-playbooks.js';
import { LessonLearner, type Lesson } from '../core/lesson-learner.js';
import { runBenchmark, runBenchmarkSemantic, HELDOUT_PROBES, type BenchmarkResult, type BenchProbe } from './benchmark.js';
import { SemanticPlaybookMatcher } from '../core/semantic-playbook-matcher.js';
import { getEmbeddingEngine } from '../core/embedding-engine.js';
import { ErrorLedger } from '../core/error-ledger.js';
import { OPUS_DISTILLATION, type DistillationCorpus } from './distillation-corpus.js';
import { OPUS_DISTILLATION_DOMAINS } from './distillation-corpus-domains.js';
import { OPUS_DISTILLATION_DOMAINS2 } from './distillation-corpus-domains2.js';
import { OPUS_DISTILLATION_CODE } from './distillation-corpus-code.js';
import { OPUS_DISTILLATION_DESIGN } from './distillation-corpus-design.js';
import { OPUS_DISTILLATION_REASONING } from './distillation-corpus-reasoning.js';
import type { KnowledgeStore } from '../core/knowledge-store.js';

const LEARNED_PLAYBOOKS_FILE = 'learning/reasoning-playbooks.md';
const LEARNED_LESSONS_FILE = 'learning/distilled-lessons.md';

/** Minimal storage surface the trainer needs. */
export interface TrainerStore {
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<void>;
}

export interface TrainerDeps {
  store?: TrainerStore | null;
  lessonLearner?: LessonLearner;
  /** procedural memory sink (optional) */
  addProcedure?: (trigger: string, action: string, tags: string[]) => void | Promise<void>;
  /** error ledger to seed distilled common mistakes into (optional) */
  errorLedger?: ErrorLedger;
  /** durable searchable knowledge store (embeddings + dedup + prune) */
  knowledgeStore?: KnowledgeStore;
}

export interface EpochReport {
  epoch: number;
  playbooks: number;
  lessonsReinforced: number;
  avgLessonConfidence: number;
  benchmark: number;
  elapsedMs: number;
}

export interface TrainingRunReport {
  teacher: string;
  corpusVersion: string;
  epochs: number;
  before: BenchmarkResult;
  after: BenchmarkResult;
  improvement: number;
  heldoutBefore: BenchmarkResult;
  heldoutAfter: BenchmarkResult;
  heldoutImprovement: number;
  /** held-out score using the LOCAL semantic matcher (intent-level generalization). */
  heldoutSemantic: number | null;
  semanticMatcherReady: boolean;
  playbookCount: ReturnType<typeof countPlaybooks>;
  lessonCount: number;
  avgLessonConfidence: number;
  knowledgeCount: number;
  knowledgeByKind: Record<string, number>;
  knowledgePruned: number;
  epochReports: EpochReport[];
  startedAt: string;
  finishedAt: string;
}

export class DistillationTrainer {
  private store: TrainerStore | null;
  private lessonLearner: LessonLearner;
  private addProcedure?: TrainerDeps['addProcedure'];

  private errorLedger?: ErrorLedger;
  private knowledgeStore?: KnowledgeStore;

  constructor(deps: TrainerDeps = {}) {
    this.store = deps.store ?? null;
    this.lessonLearner = deps.lessonLearner ?? new LessonLearner();
    this.addProcedure = deps.addProcedure;
    this.errorLedger = deps.errorLedger;
    this.knowledgeStore = deps.knowledgeStore;
  }

  /** Merge base + domain corpus into one effective corpus. */
  private effectiveCorpus(base: DistillationCorpus): DistillationCorpus {
    return {
      ...base,
      playbooks: [
        ...base.playbooks,
        ...OPUS_DISTILLATION_DOMAINS.playbooks,
        ...OPUS_DISTILLATION_DOMAINS2.playbooks,
        ...OPUS_DISTILLATION_CODE.playbooks,
        ...OPUS_DISTILLATION_DESIGN.playbooks,
        ...OPUS_DISTILLATION_REASONING.playbooks,
      ],
      lessons: [
        ...base.lessons,
        ...(OPUS_DISTILLATION_CODE.lessons ?? []),
        ...(OPUS_DISTILLATION_DESIGN.lessons ?? []),
        ...(OPUS_DISTILLATION_REASONING.lessons ?? []),
      ],
      procedures: [
        ...base.procedures,
        ...(OPUS_DISTILLATION_CODE.procedures ?? []),
        ...(OPUS_DISTILLATION_DESIGN.procedures ?? []),
        ...(OPUS_DISTILLATION_REASONING.procedures ?? []),
      ],
      commonErrors: [
        ...base.commonErrors,
        ...OPUS_DISTILLATION_DOMAINS.commonErrors,
        ...OPUS_DISTILLATION_DOMAINS2.commonErrors,
        ...(OPUS_DISTILLATION_CODE.commonErrors ?? []),
        ...(OPUS_DISTILLATION_DESIGN.commonErrors ?? []),
        ...(OPUS_DISTILLATION_REASONING.commonErrors ?? []),
      ],
    };
  }

  /** Write all distilled knowledge into the searchable KnowledgeStore. */
  private async writeToKnowledgeStore(corpus: DistillationCorpus): Promise<void> {
    if (!this.knowledgeStore) return;
    // Warm up the local embedding model so items are stored WITH embeddings.
    try { await getEmbeddingEngine().embed('warmup'); } catch { /* ok */ }
    for (const dp of corpus.playbooks) {
      const pb = dp.playbook;
      const content = [pb.label, ...(pb.intentAnchors || []), ...(pb.reasoningFrame || []), pb.approach || '']
        .filter(Boolean).join(' | ');
      await this.knowledgeStore.upsert({
        kind: 'playbook', title: pb.label, content, payload: pb,
        tags: [], source: `distilled:${corpus.teacher}`, confidence: 0.75,
      });
    }
    for (const l of corpus.lessons) {
      await this.knowledgeStore.upsert({
        kind: 'lesson', title: l.trigger,
        content: `${l.trigger} | nên: ${l.right} | tránh: ${l.wrong}`,
        payload: l, tags: [l.type], source: `distilled:${corpus.teacher}`, confidence: l.confidence,
      });
    }
    for (const e of corpus.commonErrors) {
      await this.knowledgeStore.upsert({
        kind: 'error', title: e.mistake,
        content: `${e.context} | lỗi: ${e.mistake} | sửa: ${e.fix}`,
        payload: e, tags: e.tags, source: `distilled:${corpus.teacher}`, confidence: 0.7,
      });
    }
    for (const p of corpus.procedures) {
      await this.knowledgeStore.upsert({
        kind: 'procedure', title: p.trigger,
        content: `${p.trigger} → ${p.action}`, payload: p, tags: p.tags,
        source: `distilled:${corpus.teacher}`, confidence: 0.7,
      });
    }
  }

  /** Load any previously-learned playbooks/lessons so training accumulates. */
  async loadLearned(): Promise<void> {
    if (!this.store) return;
    try {
      const raw = await this.store.readFile(LEARNED_PLAYBOOKS_FILE);
      if (raw) {
        const arr: SerializedPlaybook[] = JSON.parse(raw);
        for (const sp of arr) registerLearnedPlaybook(deserializePlaybook(sp));
      }
    } catch { /* start fresh if unreadable */ }
    try {
      const raw = await this.store.readFile(LEARNED_LESSONS_FILE);
      if (raw) {
        const lessons: Lesson[] = JSON.parse(raw);
        this.lessonLearner.loadLessons(lessons);
      }
    } catch { /* ok */ }
  }

  /** Ingest a corpus into the live stores. Returns serialized playbooks added. */
  ingest(corpus: DistillationCorpus): SerializedPlaybook[] {
    const added: SerializedPlaybook[] = [];
    for (const dp of corpus.playbooks) {
      registerLearnedPlaybook(deserializePlaybook(dp.playbook));
      added.push(dp.playbook);
    }
    return added;
  }

  /**
   * Reinforce distilled lessons through the real LessonLearner. Feeding the
   * teacher lesson repeatedly is how confidence climbs — the same mechanism as
   * a human correcting the agent multiple times.
   */
  reinforceLessons(corpus: DistillationCorpus, timestamp: string): number {
    let count = 0;
    for (const dl of corpus.lessons) {
      // Seed/raise a durable lesson. We inject directly and reinforce so the
      // learner's confidence-on-repetition logic applies.
      const existing = this.lessonLearner.getLessons().find(
        (l) => l.trigger === dl.trigger && l.right === dl.right
      );
      if (existing) {
        existing.occurrences++;
        existing.confidence = Math.min(1, existing.confidence + 0.05);
        existing.lastApplied = timestamp;
      } else {
        this.lessonLearner.addLesson({
          id: `distilled-${count}-${Math.random().toString(36).slice(2, 8)}`,
          type: dl.type,
          trigger: dl.trigger,
          wrong: dl.wrong,
          right: dl.right,
          confidence: dl.confidence,
          occurrences: 1,
          timestamp,
          lastApplied: timestamp,
          source: 'distilled:opus-4.8',
        });
      }
      count++;
    }
    return count;
  }

  async persistLearned(): Promise<void> {
    if (!this.store) return;
    const playbooks = getLearnedPlaybooks().map(serializePlaybook);
    await this.store.writeFile(LEARNED_PLAYBOOKS_FILE, JSON.stringify(playbooks, null, 2));
    await this.store.writeFile(LEARNED_LESSONS_FILE, JSON.stringify(this.lessonLearner.getLessons(), null, 2));
  }

  private avgLessonConfidence(): number {
    const lessons = this.lessonLearner.getLessons();
    if (lessons.length === 0) return 0;
    return lessons.reduce((s, l) => s + l.confidence, 0) / lessons.length;
  }

  /**
   * Full training run: load prior knowledge, benchmark, ingest + reinforce over
   * epochs, persist, benchmark again. Stops early if the deadline is reached.
   */
  async train(opts: {
    corpus?: DistillationCorpus;
    epochs?: number;
    probes?: BenchProbe[];
    deadlineMs?: number; // absolute Date.now() cutoff
    onEpoch?: (r: EpochReport) => void;
    evalSemantic?: boolean; // run the local-model held-out eval at the end
  } = {}): Promise<TrainingRunReport> {
    const corpus = this.effectiveCorpus(opts.corpus ?? OPUS_DISTILLATION);
    const epochs = opts.epochs ?? 5;
    const startedAt = new Date().toISOString();

    await this.loadLearned();

    const before = runBenchmark(opts.probes, this.lessonLearner);
    const heldoutBefore = runBenchmark(HELDOUT_PROBES, this.lessonLearner);

    const epochReports: EpochReport[] = [];
    for (let epoch = 1; epoch <= epochs; epoch++) {
      if (opts.deadlineMs && Date.now() >= opts.deadlineMs) break;
      const t0 = Date.now();

      this.ingest(corpus);
      const reinforced = this.reinforceLessons(corpus, new Date().toISOString());

      // Procedures: written once (first epoch) via the sink if provided.
      if (epoch === 1 && this.addProcedure) {
        for (const proc of corpus.procedures) {
          await this.addProcedure(proc.trigger, proc.action, proc.tags);
        }
      }
      if (epoch === 1 && this.errorLedger && corpus.commonErrors) {
        for (const err of corpus.commonErrors) {
          await this.errorLedger.record({
            context: err.context, mistake: err.mistake,
            rootCause: err.rootCause, fix: err.fix, tags: err.tags,
          });
        }
      }
      if (epoch === 1 && this.knowledgeStore) {
        await this.writeToKnowledgeStore(corpus);
      }

      await this.persistLearned();

      const bench = runBenchmark(opts.probes, this.lessonLearner);
      const report: EpochReport = {
        epoch,
        playbooks: countPlaybooks().learned,
        lessonsReinforced: reinforced,
        avgLessonConfidence: Number(this.avgLessonConfidence().toFixed(3)),
        benchmark: Number(bench.total.toFixed(4)),
        elapsedMs: Date.now() - t0,
      };
      epochReports.push(report);
      opts.onEpoch?.(report);
    }

    const after = runBenchmark(opts.probes, this.lessonLearner);
    const heldoutAfter = runBenchmark(HELDOUT_PROBES, this.lessonLearner);

    // Local-model generalization eval: match playbooks by intent via MiniLM.
    let heldoutSemantic: number | null = null;
    let semanticMatcherReady = false;
    if (opts.evalSemantic) {
      try {
        const matcher = new SemanticPlaybookMatcher(getEmbeddingEngine(), { threshold: 0.5 });
        semanticMatcherReady = await matcher.warmup();
        if (semanticMatcherReady) {
          const sem = await runBenchmarkSemantic(matcher, HELDOUT_PROBES, this.lessonLearner);
          heldoutSemantic = Number(sem.total.toFixed(4));
        }
      } catch { /* local model optional */ }
    }
    // Keep the store lean: drop never-used, low-confidence, stale knowledge.
    let knowledgePruned = 0;
    let knowledgeCount = 0;
    let knowledgeByKind: Record<string, number> = {};
    if (this.knowledgeStore) {
      knowledgePruned = this.knowledgeStore.prune({ maxAgeDays: 30, minConfidence: 0.4 });
      knowledgeCount = this.knowledgeStore.size();
      knowledgeByKind = this.knowledgeStore.countByKind();
    }
    const finishedAt = new Date().toISOString();

    return {
      teacher: corpus.teacher,
      corpusVersion: corpus.version,
      epochs: epochReports.length,
      before,
      after,
      improvement: Number((after.total - before.total).toFixed(4)),
      heldoutBefore,
      heldoutAfter,
      heldoutImprovement: Number((heldoutAfter.total - heldoutBefore.total).toFixed(4)),
      heldoutSemantic,
      semanticMatcherReady,
      playbookCount: countPlaybooks(),
      lessonCount: this.lessonLearner.getLessons().length,
      avgLessonConfidence: Number(this.avgLessonConfidence().toFixed(3)),
      knowledgeCount,
      knowledgeByKind,
      knowledgePruned,
      epochReports,
      startedAt,
      finishedAt,
    };
  }
}

export function serializePlaybook(p: ReturnType<typeof getLearnedPlaybooks>[number]): SerializedPlaybook {
  const reSrc = (r: RegExp) => `/${r.source}/${r.flags}`;
  return {
    id: p.id,
    label: p.label,
    matchAll: p.matchAll.map(reSrc),
    matchAny: p.matchAny ? p.matchAny.map(reSrc) : undefined,
    suggestions: p.suggestions,
    reasoningFrame: p.reasoningFrame,
    verificationChecks: p.verificationChecks,
    sourcePlan: p.sourcePlan,
    answerContract: p.answerContract,
    evidenceRules: p.evidenceRules,
    recoverySteps: p.recoverySteps,
    cautions: p.cautions,
    uncertaintySignals: p.uncertaintySignals,
    approach: p.approach,
    intentAnchors: p.intentAnchors,
  };
}
