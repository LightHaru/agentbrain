/**
 * AffectCore — generative emotion via cognitive appraisal (v0.8.0)
 *
 * The Amygdala maps stimuli to a valence/arousal mood (a reactive lookup).
 * AffectCore goes a layer deeper: it *generates* discrete emotions the way
 * appraisal theory (Scherer / OCC) describes — by evaluating a situation
 * against the agent's own goals, drives, expectations and sense of control,
 * not by keyword matching.
 *
 * Two sources of emotion:
 *  1. appraise()  — event-driven. Same valence yields DIFFERENT emotions
 *     depending on agency (who caused it), coping potential (can I handle it),
 *     and novelty (did I expect it). Praise -> affection; own success -> pride;
 *     threat I can handle -> protective anger; threat I can't -> fear.
 *  2. tick()      — spontaneous. With NO input, mood still drifts from
 *     interoception: neglected drives breed restlessness, accumulated stress
 *     breeds background anxiety, low circadian alertness breeds sluggishness,
 *     serotonin sets the mood floor. This is what makes the affect self-
 *     generated rather than purely reactive.
 *
 * Everything is derived from real numbers fed by the other modules; nothing
 * here is hardcoded to a fixed mood.
 */
export type EmotionLabel = 'joy' | 'pride' | 'affection' | 'gratitude' | 'relief' | 'hope' | 'curiosity' | 'contentment' | 'fear' | 'anxiety' | 'anger' | 'frustration' | 'sadness' | 'disappointment' | 'restlessness' | 'boredom' | 'neutral';
/** Agency: who/what is responsible for the appraised event. */
export type Agency = 'self' | 'other' | 'circumstance';
export interface AppraisalInput {
    /** -1..1: does the event help (+) or block (-) the agent's goals? */
    goalCongruence: number;
    /** 0..1: how much this event matters to the agent right now. */
    goalRelevance: number;
    /** who caused it. */
    agency: Agency;
    /** 0..1: can the agent cope with / control the outcome? */
    copingPotential: number;
    /** 0..1: how unexpected (prediction error / surprise). */
    novelty: number;
    /** 0..1: how sure the agent is about the situation. */
    certainty: number;
}
export interface EmotionVAD {
    valence: number;
    arousal: number;
    dominance: number;
}
export interface DiscreteEmotion {
    label: EmotionLabel;
    intensity: number;
}
export interface AffectState {
    primary: DiscreteEmotion;
    secondary: DiscreteEmotion | null;
    dimensional: EmotionVAD;
    /** slow-moving background tone the agent drifts toward with no input. */
    baseline: {
        valence: number;
        arousal: number;
    };
    lastAppraisal: AppraisalInput | null;
    lastTrigger: string;
    recent: Array<{
        label: EmotionLabel;
        intensity: number;
        at: number;
        trigger: string;
    }>;
}
export declare class AffectCore {
    private baselineValence;
    private baselineArousal;
    private primary;
    private secondary;
    private dimensional;
    private lastAppraisal;
    private lastTrigger;
    private recent;
    /**
     * Event-driven emotion generation. Returns the discrete emotion the agent
     * actually feels given HOW it appraises the situation, not just its valence.
     */
    appraise(input: AppraisalInput, trigger?: string): DiscreteEmotion;
    /**
     * Spontaneous affect. Called on a heartbeat/interval with the agent's own
     * interoceptive signals. Generates emotion from internal state alone —
     * no external message required.
     */
    tick(intero: {
        drivePressure: number;
        curiosityDrive: number;
        stress: number;
        serotonin: number;
        dopamine: number;
        circadianAlertness: number;
    }): DiscreteEmotion;
    getState(): AffectState;
    private applyEmotion;
    private record;
}
//# sourceMappingURL=affect-core.d.ts.map