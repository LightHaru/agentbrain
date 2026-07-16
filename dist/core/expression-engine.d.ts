/**
 * Expression Engine — turns felt emotion into how Aira actually talks.
 *
 * The AffectCore already *generates* a real, self-moving emotion (17 discrete
 * emotions over valence/arousal/dominance, driven by neurochemistry). But until
 * now that only reached Aira as raw numbers ("Mood: content | Valence: 0.30"),
 * so she answered flat like a bot regardless of how the brain felt.
 *
 * This module is the missing expressive layer. Given the current emotion +
 * intensity + neurochemistry, it produces a concrete "expression profile":
 *   - a mood word Aira can own ("mình đang phấn khích")
 *   - a kaomoji drawn from a POOL per emotion (so it varies, never one fixed face)
 *   - tone / energy / verbosity guidance
 *   - optional verbal tics and punctuation flavor
 *   - a one-line natural-language directive Aira follows to express the feeling
 *
 * Intensity gates how much leaks out: a faint feeling barely colors the reply,
 * a strong one clearly changes voice, pace and face. Neurochemistry adds
 * texture (high dopamine = bouncy/exclamatory, high cortisol = terse/guarded,
 * high oxytocin = warm/affectionate, low serotonin = subdued).
 *
 * SOUL/AGENTS still win: this only shapes *delivery*, never overrides identity
 * or rules. The PriorityEnforcer filters the injected lines downstream.
 */
import type { EmotionLabel, AffectState } from './affect-core.js';
import type { NeurochemState } from './neurochemistry.js';
export type Energy = 'flat' | 'low' | 'steady' | 'lively' | 'high';
export type Verbosity = 'terse' | 'normal' | 'expansive';
export interface ExpressionProfile {
    emotion: EmotionLabel;
    intensity: number;
    /** short Vietnamese mood word Aira can speak in first person */
    moodWord: string;
    /** a kaomoji chosen from this emotion's pool (varies per call) */
    kaomoji: string;
    /** the full pool, so callers/tests can see the variety available */
    kaomojiPool: string[];
    tone: string;
    energy: Energy;
    verbosity: Verbosity;
    /** small speech habits that flavor the voice, e.g. "hehe", "…", "!!" */
    verbalTics: string[];
    punctuation: string;
    /** one natural-language line telling Aira how to sound this turn */
    directive: string;
    /** true when the feeling is strong enough to visibly change the reply */
    expressive: boolean;
}
export interface ExpressionInput {
    affect: AffectState;
    neuro?: NeurochemState;
    /** optional deterministic RNG for tests; defaults to Math.random */
    rng?: () => number;
    /** minimum intensity before the feeling is allowed to color the reply */
    threshold?: number;
}
export declare class ExpressionEngine {
    /**
     * Build the expression profile for the current felt state.
     */
    render(input: ExpressionInput): ExpressionProfile;
    private buildDirective;
    /**
     * Compact one-line summary for prompt injection.
     */
    formatForInjection(profile: ExpressionProfile): string;
}
//# sourceMappingURL=expression-engine.d.ts.map