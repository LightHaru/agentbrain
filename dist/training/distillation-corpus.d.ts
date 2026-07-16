/**
 * Distillation corpus — reasoning distilled from Opus 4.8 into AgentBrain.
 *
 * AgentBrain is a symbolic cognitive system, not a neural net, so "distillation"
 * here means transferring high-quality THINKING (frames, heuristics, checks,
 * lessons, procedures) from the teacher model into AgentBrain's own learnable
 * stores — reasoning playbooks, lessons, and procedural knowledge — so its
 * judgement improves and keeps improving as more distillation runs.
 *
 * Each item is teacher-authored, general-purpose reasoning (not a canned final
 * answer). The trainer ingests these through the real learning modules and
 * reinforces them over epochs, then a benchmark measures the gain.
 */
import type { SerializedPlaybook } from '../core/reasoning-playbooks.js';
/** A distilled thinking playbook + the probe queries it should help on. */
export interface DistilledPlaybook {
    playbook: SerializedPlaybook;
    /** Example user messages this reasoning should trigger on (for benchmarking). */
    probes: string[];
}
/** A distilled lesson (a durable "do X, not Y" the teacher wants internalized). */
export interface DistilledLesson {
    type: 'correction' | 'preference' | 'workflow' | 'anti-pattern';
    trigger: string;
    wrong: string;
    right: string;
    confidence: number;
}
/** A distilled procedural memory (a reusable how-to shortcut). */
export interface DistilledProcedure {
    trigger: string;
    action: string;
    tags: string[];
}
/** A distilled common mistake + its fix, seeded into the Error Ledger. */
export interface DistilledError {
    context: string;
    mistake: string;
    rootCause: string;
    fix: string;
    tags: string[];
}
export interface DistillationCorpus {
    version: string;
    teacher: string;
    playbooks: DistilledPlaybook[];
    lessons: DistilledLesson[];
    procedures: DistilledProcedure[];
    commonErrors: DistilledError[];
}
export declare const OPUS_DISTILLATION: DistillationCorpus;
//# sourceMappingURL=distillation-corpus.d.ts.map