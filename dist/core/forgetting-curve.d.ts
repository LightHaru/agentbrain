/**
 * ForgettingCurve — Ebbinghaus-style retention scoring for memory maintenance.
 *
 * The user asked for "lưu data thông minh, đừng phình vô ích": memory should
 * fade when it is not useful and STICK when it is. Hippocampus already decays
 * confidence linearly with idle days; this adds the classic exponential
 * retention model R = exp(-t / S), where the stability S grows every time a
 * memory is accessed (spaced-repetition intuition: recalling something makes it
 * more durable). Frequently-used, high-confidence memories resist forgetting;
 * one-off noise fades fast.
 *
 * Pure functions, deterministic, no I/O — used by Hippocampus maintenance and
 * by KnowledgeStore/graph pruning decisions, and unit-testable in isolation.
 */
export interface RetentionInput {
    /** days since last access */
    ageDays: number;
    /** times this memory has been retrieved */
    accessCount: number;
    /** current stored confidence 0..1 */
    confidence: number;
}
/**
 * Memory stability (in days) — how slowly it fades. Base 3 days, +2 days per
 * access (capped), scaled up by confidence. A memory recalled 5+ times with
 * high confidence is very stable; a never-used low-confidence one is fragile.
 */
export declare function stability(accessCount: number, confidence: number): number;
/** Ebbinghaus retention R = exp(-ageDays / stability), 0..1. */
export declare function retention(input: RetentionInput): number;
/**
 * Decide whether a memory should be forgotten (pruned). It is forgotten only
 * when retention has dropped below `threshold` AND it is not a protected
 * high-confidence, frequently-used memory. This is stricter than a raw
 * confidence cut: a fact recalled often survives even if old.
 */
export declare function shouldForget(input: RetentionInput, threshold?: number): boolean;
/**
 * Apply retention as a confidence multiplier for a maintenance pass. Returns the
 * new confidence after this idle period, protecting well-used memories.
 */
export declare function decayedConfidence(input: RetentionInput): number;
//# sourceMappingURL=forgetting-curve.d.ts.map