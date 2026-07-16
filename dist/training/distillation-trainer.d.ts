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
import { getLearnedPlaybooks, countPlaybooks, type SerializedPlaybook } from '../core/reasoning-playbooks.js';
import { LessonLearner } from '../core/lesson-learner.js';
import { type BenchmarkResult, type BenchProbe } from './benchmark.js';
import { ErrorLedger } from '../core/error-ledger.js';
import { type DistillationCorpus } from './distillation-corpus.js';
import type { KnowledgeStore } from '../core/knowledge-store.js';
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
export declare class DistillationTrainer {
    private store;
    private lessonLearner;
    private addProcedure?;
    private errorLedger?;
    private knowledgeStore?;
    constructor(deps?: TrainerDeps);
    /** Merge base + domain corpus into one effective corpus. */
    private effectiveCorpus;
    /** Write all distilled knowledge into the searchable KnowledgeStore. */
    private writeToKnowledgeStore;
    /** Load any previously-learned playbooks/lessons so training accumulates. */
    loadLearned(): Promise<void>;
    /** Ingest a corpus into the live stores. Returns serialized playbooks added. */
    ingest(corpus: DistillationCorpus): SerializedPlaybook[];
    /**
     * Reinforce distilled lessons through the real LessonLearner. Feeding the
     * teacher lesson repeatedly is how confidence climbs — the same mechanism as
     * a human correcting the agent multiple times.
     */
    reinforceLessons(corpus: DistillationCorpus, timestamp: string): number;
    persistLearned(): Promise<void>;
    private avgLessonConfidence;
    /**
     * Full training run: load prior knowledge, benchmark, ingest + reinforce over
     * epochs, persist, benchmark again. Stops early if the deadline is reached.
     */
    train(opts?: {
        corpus?: DistillationCorpus;
        epochs?: number;
        probes?: BenchProbe[];
        deadlineMs?: number;
        onEpoch?: (r: EpochReport) => void;
        evalSemantic?: boolean;
    }): Promise<TrainingRunReport>;
}
export declare function serializePlaybook(p: ReturnType<typeof getLearnedPlaybooks>[number]): SerializedPlaybook;
//# sourceMappingURL=distillation-trainer.d.ts.map