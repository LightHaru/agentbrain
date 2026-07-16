/**
 * Reasoning benchmark — measures how well AgentBrain's reasoning covers a set
 * of probe scenarios. Used to prove distillation training actually made the
 * brain smarter (score before vs after).
 *
 * The score for a probe rewards the brain for surfacing structured reasoning
 * that matters: a matched playbook, a concrete reasoning frame, verification
 * checks, an approach, and relevant lessons. This is a proxy for "did the brain
 * bring good judgement to this situation" — measurable without a human grader.
 */
import { LessonLearner } from '../core/lesson-learner.js';
export interface BenchProbe {
    id: string;
    message: string;
    /** reasoning capabilities we hope the brain brings to this kind of message */
    expectTags: string[];
}
export interface ProbeScore {
    id: string;
    score: number;
    playbookMatched: boolean;
    frames: number;
    checks: number;
    hasApproach: boolean;
    lessons: number;
}
export interface BenchmarkResult {
    total: number;
    probeScores: ProbeScore[];
    timestamp: string;
}
/** Default probe suite spanning core reasoning skills. */
export declare const DEFAULT_PROBES: BenchProbe[];
/**
 * Held-out probes: DIFFERENT phrasings than the distillation corpus was written
 * against. A gain here shows the brain generalizes the distilled reasoning to
 * unseen wording, not that it memorized the training probes.
 */
export declare const HELDOUT_PROBES: BenchProbe[];
export declare function scoreProbe(message: string, lessonLearner?: LessonLearner): ProbeScore;
export declare function runBenchmark(probes?: BenchProbe[], lessonLearner?: LessonLearner): BenchmarkResult;
/** Like scoreProbe but uses a semantic matcher (local model) for playbook match. */
export declare function scoreProbeSemantic(message: string, matcher: {
    match: (m: string) => Promise<Array<{
        reasoningFrame: string[];
        verificationChecks: string[];
        approach?: string;
    }>>;
}, lessonLearner?: LessonLearner): Promise<ProbeScore>;
export declare function runBenchmarkSemantic(matcher: {
    match: (m: string) => Promise<any[]>;
}, probes?: BenchProbe[], lessonLearner?: LessonLearner): Promise<BenchmarkResult>;
//# sourceMappingURL=benchmark.d.ts.map