"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffectCore = void 0;
/** Prototype VAD coordinates for each discrete emotion. */
const PROTOTYPES = {
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
const AFFECT_FILE = 'emotional/affect.md';
class AffectCore {
    baselineValence = 0;
    baselineArousal = 0.3;
    primary = { label: 'neutral', intensity: 0.3 };
    secondary = null;
    dimensional = { ...PROTOTYPES.neutral };
    lastAppraisal = null;
    lastTrigger = '';
    recent = [];
    // ── Mood momentum (emotional inertia) ──────────────────────────────────
    // A felt mood persists across turns instead of resetting every message.
    // Each new appraisal decays the lingering mood a little, then must be strong
    // enough to actually dislodge it — otherwise the current mood holds. This is
    // what makes praise-then-neutral stay warm rather than snapping to neutral.
    /** how much of the current mood carries into the next turn (0..1). */
    moodInertia;
    /** incoming emotion must reach this fraction of the lingering intensity to switch. */
    switchResistance;
    store;
    constructor(store = null, opts = {}) {
        this.store = store;
        this.moodInertia = opts.moodInertia ?? 0.8;
        this.switchResistance = opts.switchResistance ?? 0.7;
    }
    /** Load persisted mood so emotion survives restarts / new sessions. */
    async initialize() {
        if (!this.store)
            return;
        try {
            const raw = await this.store.readFile(AFFECT_FILE);
            if (raw)
                this.restore(raw);
        }
        catch { /* best-effort: start fresh if unreadable */ }
        console.log(`[AffectCore] Initialized — mood: ${this.primary.label} (${this.primary.intensity.toFixed(2)}), ` +
            `baselineV: ${this.baselineValence.toFixed(2)}`);
    }
    /** Persist current mood + baseline so it carries into the next session. */
    async persist() {
        if (!this.store)
            return;
        try {
            await this.store.writeFile(AFFECT_FILE, this.serialize());
        }
        catch { /* best-effort */ }
    }
    serialize() {
        return JSON.stringify({
            v: 1,
            baselineValence: this.baselineValence,
            baselineArousal: this.baselineArousal,
            primary: this.primary,
            secondary: this.secondary,
            dimensional: this.dimensional,
            lastTrigger: this.lastTrigger,
            recent: this.recent.slice(-30),
            savedAt: Date.now(),
        });
    }
    restore(raw) {
        const data = JSON.parse(raw);
        if (typeof data.baselineValence === 'number')
            this.baselineValence = data.baselineValence;
        if (typeof data.baselineArousal === 'number')
            this.baselineArousal = data.baselineArousal;
        if (data.primary?.label && PROTOTYPES[data.primary.label]) {
            this.primary = { label: data.primary.label, intensity: clamp01(data.primary.intensity ?? 0.3) };
        }
        if (data.secondary?.label && PROTOTYPES[data.secondary.label]) {
            this.secondary = { label: data.secondary.label, intensity: clamp01(data.secondary.intensity ?? 0) };
        }
        else {
            this.secondary = null;
        }
        if (data.dimensional) {
            this.dimensional = {
                valence: clamp(data.dimensional.valence ?? 0, -1, 1),
                arousal: clamp01(data.dimensional.arousal ?? 0.3),
                dominance: clamp(data.dimensional.dominance ?? 0.3, -1, 1),
            };
        }
        if (typeof data.lastTrigger === 'string')
            this.lastTrigger = data.lastTrigger;
        if (Array.isArray(data.recent))
            this.recent = data.recent.slice(-30);
    }
    /**
     * Event-driven emotion generation. Returns the discrete emotion the agent
     * actually feels given HOW it appraises the situation, not just its valence.
     */
    appraise(input, trigger = '') {
        const { goalCongruence: gc, goalRelevance: rel, agency, copingPotential: cope, novelty, certainty } = input;
        const scored = [];
        const push = (label, score) => {
            if (score > 0)
                scored.push({ label, score });
        };
        if (gc >= 0) {
            // Positive appraisals — differentiated by agency & certainty.
            const mag = gc * (0.4 + 0.6 * rel);
            if (agency === 'other') {
                // A clear social cause makes the feeling relational, not generic joy.
                push('affection', mag * 1.05);
                push('gratitude', mag * 0.9);
                push('joy', mag * (0.3 + 0.3 * certainty));
            }
            else if (agency === 'self') {
                // Self-caused success is felt as pride before generic joy.
                push('pride', mag * 1.05);
                push('joy', mag * (0.3 + 0.3 * certainty));
            }
            else {
                push('joy', mag * (0.5 + 0.5 * certainty));
            }
            if (certainty < 0.5)
                push('hope', mag * (1 - certainty));
            // Low-arousal positive with little novelty reads as contentment.
            if (novelty < 0.4)
                push('contentment', mag * (0.6 - novelty) * 0.8);
            // Relief: a previously negative situation flipped positive.
            if (this.dimensional.valence < -0.2)
                push('relief', mag * 0.9 + 0.2);
        }
        else {
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
            if (cope >= 0.4 && cope < 0.6)
                push('anxiety', mag * 0.8);
            if (agency === 'self')
                push('frustration', mag * 0.85);
            if (agency === 'other' && cope < 0.6)
                push('anxiety', mag * 0.5);
            // Mild negative that was expected reads as disappointment, not fear.
            if (novelty < 0.4 && !settledLoss)
                push('disappointment', mag * (0.6 - novelty));
        }
        // Novelty on its own (neutral-to-positive) sparks curiosity.
        if (novelty >= 0.5 && gc >= -0.2)
            push('curiosity', novelty * (0.4 + 0.6 * rel));
        if (scored.length === 0)
            scored.push({ label: 'neutral', score: 0.3 });
        scored.sort((a, b) => b.score - a.score);
        const incoming = { label: scored[0].label, intensity: clamp01(scored[0].score) };
        const incomingSecondary = scored[1] && scored[1].score > 0.15 ? { label: scored[1].label, intensity: clamp01(scored[1].score) } : null;
        // Apply mood momentum: the lingering mood resists being overwritten.
        const { primary, secondary } = this.blendWithMomentum(incoming, incomingSecondary);
        this.applyEmotion(primary, secondary, trigger, input);
        return this.primary;
    }
    /**
     * Emotional inertia. The current mood lingers and only yields when the new
     * feeling is strong enough. Same emotion → reinforce (intensity climbs).
     * Different emotion → the incoming must beat the decayed current mood to take
     * over; if it can't, the current mood holds but is nudged toward the new one.
     */
    blendWithMomentum(incoming, incomingSecondary) {
        const cur = this.primary;
        // A neutral/no-op appraisal never erases a real mood — it just lets it decay.
        const incomingIsIdle = incoming.label === 'neutral' || incoming.intensity < 0.2;
        const lingering = cur.intensity * this.moodInertia;
        if (cur.label === 'neutral' || cur.intensity < 0.15) {
            // No real mood currently → adopt the incoming emotion directly.
            return { primary: incoming, secondary: incomingSecondary };
        }
        if (incoming.label === cur.label) {
            // Same feeling reinforces and slowly intensifies (mood deepens).
            const intensity = clamp01(Math.max(incoming.intensity, lingering) + incoming.intensity * 0.15);
            return { primary: { label: cur.label, intensity }, secondary: incomingSecondary };
        }
        if (incomingIsIdle) {
            // Neutral turn while in a mood → mood persists, just decays a little.
            return {
                primary: { label: cur.label, intensity: clamp01(lingering) },
                secondary: this.secondary,
            };
        }
        // Different real emotion → it must overcome the lingering mood to switch.
        if (incoming.intensity >= lingering * this.switchResistance) {
            // Strong enough: switch, but the old mood tints it as a secondary.
            return {
                primary: incoming,
                secondary: incomingSecondary ?? { label: cur.label, intensity: clamp01(lingering * 0.5) },
            };
        }
        // Not strong enough: current mood holds, nudged slightly by the newcomer.
        const nudged = clamp01(lingering - incoming.intensity * 0.15);
        return {
            primary: { label: cur.label, intensity: nudged },
            secondary: { label: incoming.label, intensity: clamp01(incoming.intensity * 0.5) },
        };
    }
    /**
     * Spontaneous affect. Called on a heartbeat/interval with the agent's own
     * interoceptive signals. Generates emotion from internal state alone —
     * no external message required.
     */
    tick(intero) {
        // Mood floor drifts toward serotonin baseline; dopamine lifts it slightly.
        const targetValence = (intero.serotonin - 0.5) * 0.8 + (intero.dopamine - 0.4) * 0.3 - intero.stress * 0.4;
        const targetArousal = 0.25 + intero.dopamine * 0.3 + intero.stress * 0.35 + (intero.circadianAlertness - 0.5) * 0.2;
        this.baselineValence = this.baselineValence * 0.85 + clamp(targetValence, -1, 1) * 0.15;
        this.baselineArousal = clamp01(this.baselineArousal * 0.85 + targetArousal * 0.15);
        // Decide the spontaneous emotion from the strongest internal pressure.
        const scored = [];
        if (intero.stress >= 0.4)
            scored.push({ label: 'anxiety', score: intero.stress });
        if (intero.curiosityDrive >= 0.55 && intero.circadianAlertness >= 0.4)
            scored.push({ label: 'restlessness', score: intero.curiosityDrive * 0.9 });
        if (intero.drivePressure >= 0.6 && intero.circadianAlertness < 0.4)
            scored.push({ label: 'boredom', score: intero.drivePressure * 0.7 });
        if (intero.serotonin >= 0.6 && intero.stress < 0.3 && intero.drivePressure < 0.5)
            scored.push({ label: 'contentment', score: intero.serotonin * 0.7 });
        if (intero.circadianAlertness < 0.3)
            scored.push({ label: 'boredom', score: 0.5 });
        if (scored.length === 0)
            scored.push({ label: 'neutral', score: 0.3 });
        scored.sort((a, b) => b.score - a.score);
        const emo = { label: scored[0].label, intensity: clamp01(scored[0].score) };
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
    getState() {
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
    applyEmotion(primary, secondary, trigger, input) {
        this.primary = primary;
        this.secondary = secondary;
        this.lastAppraisal = { ...input };
        this.lastTrigger = trigger || 'appraisal';
        const proto = PROTOTYPES[primary.label];
        const blend = secondary ? PROTOTYPES[secondary.label] : null;
        const w = primary.intensity;
        const sv = blend ? blend.valence * secondary.intensity * 0.3 : 0;
        const sa = blend ? blend.arousal * secondary.intensity * 0.3 : 0;
        this.dimensional = {
            valence: clamp(proto.valence * w + sv, -1, 1),
            arousal: clamp01(proto.arousal * w + sa + this.baselineArousal * 0.1),
            dominance: clamp(proto.dominance * w, -1, 1),
        };
        this.record(primary, this.lastTrigger);
    }
    record(emo, trigger) {
        this.recent.push({ label: emo.label, intensity: Number(emo.intensity.toFixed(3)), at: Date.now(), trigger });
        if (this.recent.length > 50)
            this.recent = this.recent.slice(-50);
    }
}
exports.AffectCore = AffectCore;
function clamp01(n) {
    return Math.max(0, Math.min(1, n));
}
function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}
//# sourceMappingURL=affect-core.js.map