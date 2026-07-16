/**
 * AutoReflector — self-triggered reflection after a rough patch.
 *
 * The user asked that Aira "biết tự test lại", "nhớ lỗi đã mắc và cách sửa", and
 * think like a person instead of asking again and again. Manual reflection
 * (agentbrain_reflect tool) and per-turn cingulate.reflect already exist, but
 * nothing FIRES when a session accumulates several corrections/failures in a
 * row — exactly when a human would stop and think "why do I keep getting this
 * wrong?".
 *
 * This tracker watches turn signals per session. When negative signals cross a
 * threshold within a window, it emits a consolidated reflection: the recurring
 * theme, the corrections, and a distilled "do differently next time" lesson.
 * The plugin then persists that lesson (KnowledgeStore + a strong reminder), so
 * the brain genuinely learns from a bad streak instead of repeating it.
 */
export interface ReflectionSignal {
    sessionId: string;
    userMessage: string;
    agentResponse: string;
    /** user sentiment for this turn, -1..1 */
    sentiment: number;
    /** true if the user corrected/complained this turn */
    correction: boolean;
    /** optional fix text learned this turn */
    fix?: string;
    timestamp: string;
}
export interface AutoReflection {
    sessionId: string;
    theme: string;
    correctionCount: number;
    negativeCount: number;
    /** distilled lesson to remember */
    lesson: string;
    corrections: string[];
    timestamp: string;
}
export declare class AutoReflector {
    private sessions;
    private windowSize;
    private negThreshold;
    private correctionThreshold;
    constructor(opts?: {
        windowSize?: number;
        negThreshold?: number;
        correctionThreshold?: number;
    });
    /**
     * Record a turn's signal. Returns an AutoReflection when the session just
     * crossed the "rough patch" threshold (else null). One reflection per streak.
     */
    record(signal: ReflectionSignal): AutoReflection | null;
    private buildReflection;
    /** Clear a session's tracked signals (e.g. on /new or /reset). */
    reset(sessionId: string): void;
    formatForInjection(reflection: AutoReflection): string;
}
//# sourceMappingURL=auto-reflector.d.ts.map