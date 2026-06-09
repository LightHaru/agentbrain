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

export type EmotionLabel =
  | 'joy' | 'pride' | 'affection' | 'gratitude' | 'relief' | 'hope'
  | 'curiosity' | 'contentment'
  | 'fear' | 'anxiety' | 'anger' | 'frustration' | 'sadness'
  | 'disappointment' | 'restlessness' | 'boredom' | 'neutral';

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
  valence: number; // -1..1
  arousal: number; // 0..1
  dominance: number; // -1..1 (helpless ← → in-control)
}

export interface DiscreteEmotion {
  label: EmotionLabel;
  intensity: number; // 0..1
}

export interface AffectState {
  primary: DiscreteEmotion;
  secondary: DiscreteEmotion | null;
  dimensional: EmotionVAD;
  /** slow-moving background tone the agent drifts toward with no input. */
  baseline: { valence: number; arousal: number };
  lastAppraisal: AppraisalInput | null;
  lastTrigger: string;
  recent: Array<{ label: EmotionLabel; intensity: number; at: number; trigger: string }>;
}

/** Prototype VAD coordinates for each discrete emotion. */
const PROTOTYPES: Record<EmotionLabel, EmotionVAD> = {
  joy: { valence: 0.8, arousal: 0.65, dominance: 0.5 },
  pride: { valence: 0.7, arousal: 0.55, dominance: 0.8 },
  affection: { valence: 0.8, arousal: 0.4, dominance: 0.3 },
  gratitude: { valence: 0.7, arousal: 0.4, dominance: 0.2 },
  relief: { valence: 0.5, arousal: 0.25, dominance: 0.4 },
  hope: { valence: 0.45, arousal: 0.5, dominance: 0.35 },
  curiosity: { valence: 0.35, arousal: 0.6, dominance: 0.5 },
  contentment: { valence: 0.55, arousal: 0.2, dominance: 0.5 },
  fear: { valence: -0.7, arousal: 0.85, dominance: -0.6 },
  anxiety: { valence: -0.4, arousal: 0.6, dominance: -0.35 },
  anger: { valence: -0.4, arousal: 0.8, dominance: 0.7 },
  frustration: { valence: -0.5, arousal: 0.6, dominance: 0.15 },
  sadness: { valence: -0.6, arousal: 0.2, dominance: -0.3 },
  disappointment: { valence: -0.4, arousal: 0.3, dominance: -0.15 },
  restlessness: { valence: -0.15, arousal: 0.55, dominance: 0.25 },
  boredom: { valence: -0.2, arousal: 0.15, dominance: 0.1 },
  neutral: { valence: 0, arousal: 0.3, dominance: 0.3 },
};

export class AffectCore {
  private baselineValence = 0;
  private baselineArousal = 0.3;
  private primary: DiscreteEmotion = { label: 'neutral', intensity: 0.3 };
  private secondary: DiscreteEmotion | null = null;
  private dimensional: EmotionVAD = { ...PROTOTYPES.neutral };
  private lastAppraisal: AppraisalInput | null = null;
  private lastTrigger = '';
  private recent: AffectState['recent'] = [];

  /**
   * Event-driven emotion generation. Returns the discrete emotion the agent
   * actually feels given HOW it appraises the situation, not just its valence.
   */
  appraise(input: AppraisalInput, trigger = ''): DiscreteEmotion {
    const { goalCongruence: gc, goalRelevance: rel, agency, copingPotential: cope, novelty, certainty } = input;
    const scored: Array<{ label: EmotionLabel; score: number }> = [];

    const push = (label: EmotionLabel, score: number) => {
      if (score > 0) scored.push({ label, score });
    };

    if (gc >= 0) {
      // Positive appraisals — differentiated by agency & certainty.
      const mag = gc * (0.4 + 0.6 * rel);
      if (agency === 'other') {
        // A clear social cause makes the feeling relational, not generic joy.
        push('affection', mag * 1.05);
        push('gratitude', mag * 0.9);
        push('joy', mag * (0.3 + 0.3 * certainty));
      } else if (agency === 'self') {
        // Self-caused success is felt as pride before generic joy.
        push('pride', mag * 1.05);
        push('joy', mag * (0.3 + 0.3 * certainty));
      } else {
        push('joy', mag * (0.5 + 0.5 * certainty));
      }
      if (certainty < 0.5) push('hope', mag * (1 - certainty));
      // Low-arousal positive with little novelty reads as contentment.
      if (novelty < 0.4) push('contentment', mag * (0.6 - novelty) * 0.8);
      // Relief: a previously negative situation flipped positive.
      if (this.dimensional.valence < -0.2) push('relief', mag * 0.9 + 0.2);
    } else {
      // Negative appraisals — differentiated by coping & agency.
      const mag = -gc * (0.4 + 0.6 * rel);
      // Distinguish grief from fear by NOVELTY: a settled/known bad outcome
      // (low novelty) is grieved; a surprising, uncertain threat (high novelty)
      // is feared. Coping must be low for either.
      const settledLoss = cope < 0.4 && novelty < 0.45 && rel >= 0.6;
      if (cope >= 0.6) {
        // Can handle it: threat reads as protective anger / determination.
        push('anger', mag * (0.5 + 0.5 * cope));
      }
      if (cope < 0.4) {
        // Can't handle it: fear if surprising/uncertain, sadness if settled.
        push('fear', mag * (1 - cope) * (0.5 + 0.5 * novelty));
        push('sadness', mag * (1 - cope) * (settledLoss ? 1.1 : 0.55));
      }
      if (cope >= 0.4 && cope < 0.6) push('anxiety', mag * 0.8);
      if (agency === 'self') push('frustration', mag * 0.85);
      if (agency === 'other' && cope < 0.6) push('anxiety', mag * 0.5);
      // Mild negative that was expected reads as disappointment, not fear.
      if (novelty < 0.4 && !settledLoss) push('disappointment', mag * (0.6 - novelty));
    }

    // Novelty on its own (neutral-to-positive) sparks curiosity.
    if (novelty >= 0.5 && gc >= -0.2) push('curiosity', novelty * (0.4 + 0.6 * rel));

    if (scored.length === 0) scored.push({ label: 'neutral', score: 0.3 });
    scored.sort((a, b) => b.score - a.score);

    const primary: DiscreteEmotion = { label: scored[0].label, intensity: clamp01(scored[0].score) };
    const secondary: DiscreteEmotion | null =
      scored[1] && scored[1].score > 0.15 ? { label: scored[1].label, intensity: clamp01(scored[1].score) } : null;

    this.applyEmotion(primary, secondary, trigger, input);
    return primary;
  }

  /**
   * Spontaneous affect. Called on a heartbeat/interval with the agent's own
   * interoceptive signals. Generates emotion from internal state alone —
   * no external message required.
   */
  tick(intero: {
    drivePressure: number; // 0..1 avg unmet-drive intensity (hypothalamus)
    curiosityDrive: number; // 0..1 specific curiosity/novelty hunger
    stress: number; // 0..1 (hypothalamus/cortisol)
    serotonin: number; // 0..1 mood floor
    dopamine: number; // 0..1 drive/energy
    circadianAlertness: number; // 0..1
  }): DiscreteEmotion {
    // Mood floor drifts toward serotonin baseline; dopamine lifts it slightly.
    const targetValence = (intero.serotonin - 0.5) * 0.8 + (intero.dopamine - 0.4) * 0.3 - intero.stress * 0.4;
    const targetArousal = 0.25 + intero.dopamine * 0.3 + intero.stress * 0.35 + (intero.circadianAlertness - 0.5) * 0.2;
    this.baselineValence = this.baselineValence * 0.85 + clamp(targetValence, -1, 1) * 0.15;
    this.baselineArousal = clamp01(this.baselineArousal * 0.85 + targetArousal * 0.15);

    // Decide the spontaneous emotion from the strongest internal pressure.
    const scored: Array<{ label: EmotionLabel; score: number }> = [];
    if (intero.stress >= 0.4) scored.push({ label: 'anxiety', score: intero.stress });
    if (intero.curiosityDrive >= 0.55 && intero.circadianAlertness >= 0.4)
      scored.push({ label: 'restlessness', score: intero.curiosityDrive * 0.9 });
    if (intero.drivePressure >= 0.6 && intero.circadianAlertness < 0.4)
      scored.push({ label: 'boredom', score: intero.drivePressure * 0.7 });
    if (intero.serotonin >= 0.6 && intero.stress < 0.3 && intero.drivePressure < 0.5)
      scored.push({ label: 'contentment', score: intero.serotonin * 0.7 });
    if (intero.circadianAlertness < 0.3) scored.push({ label: 'boredom', score: 0.5 });

    if (scored.length === 0) scored.push({ label: 'neutral', score: 0.3 });
    scored.sort((a, b) => b.score - a.score);

    const emo: DiscreteEmotion = { label: scored[0].label, intensity: clamp01(scored[0].score) };
    // Spontaneous emotion blends gently — it's a background drift, not a spike.
    this.primary = emo;
    this.secondary = null;
    this.lastTrigger = 'spontaneous';
    const proto = PROTOTYPES[emo.label];
    this.dimensional = {
      valence: clamp(this.baselineValence * 0.6 + proto.valence * emo.intensity * 0.4, -1, 1),
      arousal: clamp01(this.baselineArousal * 0.6 + proto.arousal * emo.intensity * 0.4),
      dominance: clamp(proto.dominance * emo.intensity, -1, 1),
    };
    this.record(emo, 'spontaneous');
    return emo;
  }

  getState(): AffectState {
    return {
      primary: { ...this.primary },
      secondary: this.secondary ? { ...this.secondary } : null,
      dimensional: { ...this.dimensional },
      baseline: { valence: Number(this.baselineValence.toFixed(3)), arousal: Number(this.baselineArousal.toFixed(3)) },
      lastAppraisal: this.lastAppraisal ? { ...this.lastAppraisal } : null,
      lastTrigger: this.lastTrigger,
      recent: this.recent.map((r) => ({ ...r })),
    };
  }

  // --- internals ---
  private applyEmotion(primary: DiscreteEmotion, secondary: DiscreteEmotion | null, trigger: string, input: AppraisalInput): void {
    this.primary = primary;
    this.secondary = secondary;
    this.lastAppraisal = { ...input };
    this.lastTrigger = trigger || 'appraisal';
    const proto = PROTOTYPES[primary.label];
    const blend = secondary ? PROTOTYPES[secondary.label] : null;
    const w = primary.intensity;
    const sv = blend ? blend.valence * secondary!.intensity * 0.3 : 0;
    const sa = blend ? blend.arousal * secondary!.intensity * 0.3 : 0;
    this.dimensional = {
      valence: clamp(proto.valence * w + sv, -1, 1),
      arousal: clamp01(proto.arousal * w + sa + this.baselineArousal * 0.1),
      dominance: clamp(proto.dominance * w, -1, 1),
    };
    this.record(primary, this.lastTrigger);
  }

  private record(emo: DiscreteEmotion, trigger: string): void {
    this.recent.push({ label: emo.label, intensity: Number(emo.intensity.toFixed(3)), at: Date.now(), trigger });
    if (this.recent.length > 50) this.recent = this.recent.slice(-50);
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
