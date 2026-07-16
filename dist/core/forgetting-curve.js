"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.stability = stability;
exports.retention = retention;
exports.shouldForget = shouldForget;
exports.decayedConfidence = decayedConfidence;
/**
 * Memory stability (in days) — how slowly it fades. Base 3 days, +2 days per
 * access (capped), scaled up by confidence. A memory recalled 5+ times with
 * high confidence is very stable; a never-used low-confidence one is fragile.
 */
function stability(accessCount, confidence) {
    const base = 3;
    const accessBonus = Math.min(20, accessCount * 2);
    const confScale = 0.5 + confidence; // 0.5..1.5
    return (base + accessBonus) * confScale;
}
/** Ebbinghaus retention R = exp(-ageDays / stability), 0..1. */
function retention(input) {
    const s = stability(input.accessCount, input.confidence);
    if (s <= 0)
        return 0;
    const r = Math.exp(-input.ageDays / s);
    return Math.max(0, Math.min(1, r));
}
/**
 * Decide whether a memory should be forgotten (pruned). It is forgotten only
 * when retention has dropped below `threshold` AND it is not a protected
 * high-confidence, frequently-used memory. This is stricter than a raw
 * confidence cut: a fact recalled often survives even if old.
 */
function shouldForget(input, threshold = 0.18) {
    // Never forget something still actively used and trusted.
    if (input.accessCount >= 5 && input.confidence >= 0.6)
        return false;
    return retention(input) < threshold;
}
/**
 * Apply retention as a confidence multiplier for a maintenance pass. Returns the
 * new confidence after this idle period, protecting well-used memories.
 */
function decayedConfidence(input) {
    const r = retention(input);
    // Blend: high-retention keeps most confidence; low-retention loses it.
    return Math.max(0, Math.min(1, input.confidence * (0.4 + 0.6 * r)));
}
//# sourceMappingURL=forgetting-curve.js.map