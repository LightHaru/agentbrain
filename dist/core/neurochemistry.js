"use strict";
/**
 * Neurochemistry — Neuromodulator System (Phase 3)
 *
 * Simulates four core neuromodulators that bias how the agent feels and reacts,
 * giving emotional state real *momentum* instead of a fixed inertia constant:
 *
 *  - Dopamine  (DA): reward / motivation / drive. Spikes on success & praise,
 *                    decays fast. High DA → more energy (arousal) + reward seeking.
 *  - Serotonin (5HT): mood floor / wellbeing / patience. Slow-moving baseline.
 *                    High 5HT → higher valence floor, calmer, more resilient.
 *  - Cortisol  (COR): stress / threat hormone. Spikes on threats & negativity,
 *                    decays slowly (stress lingers). High COR → high arousal,
 *                    suppressed valence, narrowed patience.
 *  - Oxytocin  (OXT): bonding / trust / warmth. Rises with positive social
 *                    contact & praise. High OXT → warmer, more trusting.
 *
 * The amygdala calls `modulate()` to bias valence/arousal each interaction, and
 * `applyEvent()` to push neurochemicals on sentiment/threat/bonding signals.
 * `decay()` is called on heartbeats so levels drift back toward baseline at
 * chemical-specific rates (this is what creates lingering moods).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Neurochemistry = void 0;
/** Per-chemical baseline + decay-per-heartbeat toward baseline. */
const PROFILE = {
    dopamine: { baseline: 0.4, decay: 0.18 }, // fast decay (phasic)
    serotonin: { baseline: 0.5, decay: 0.04 }, // slow (tonic mood floor)
    cortisol: { baseline: 0.2, decay: 0.08 }, // moderate; stress lingers
    oxytocin: { baseline: 0.35, decay: 0.06 }, // slow-moderate
};
const clamp01 = (n) => Math.max(0, Math.min(1, n));
class Neurochemistry {
    config;
    fileManager;
    state;
    constructor(config, fileManager) {
        this.config = config;
        this.fileManager = fileManager;
        this.state = {
            dopamine: PROFILE.dopamine.baseline,
            serotonin: PROFILE.serotonin.baseline,
            cortisol: PROFILE.cortisol.baseline,
            oxytocin: PROFILE.oxytocin.baseline,
        };
    }
    async initialize() {
        const content = await this.fileManager.readFile('emotional/neurochemistry.md');
        if (content) {
            this.state = this.parse(content);
        }
        console.log(`[Neurochemistry] Initialized — DA:${this.state.dopamine.toFixed(2)} 5HT:${this.state.serotonin.toFixed(2)} COR:${this.state.cortisol.toFixed(2)} OXT:${this.state.oxytocin.toFixed(2)}`);
    }
    /**
     * Push neurochemicals based on an interaction's signals.
     * @param userSentiment -1..1
     * @param isThreat       threat detected this turn
     * @param threatSeverity 'none'|'low'|'medium'|'high'|'critical'
     * @param bonding        positive social/praise signal (0..1), e.g. thanks/praise
     */
    applyEvent(userSentiment, isThreat, threatSeverity = 'none', bonding = 0) {
        const s = this.state;
        // Dopamine: reward on positive sentiment, mild dip on negative.
        if (userSentiment > 0)
            s.dopamine += userSentiment * 0.45;
        else
            s.dopamine += userSentiment * 0.15;
        // Serotonin: nudged by sustained positivity, eroded by negativity (slow).
        s.serotonin += userSentiment * 0.08;
        // Cortisol: spikes on threats (scaled by severity) and clear negativity.
        const sevWeight = {
            none: 0,
            low: 0.15,
            medium: 0.3,
            high: 0.5,
            critical: 0.7,
        };
        // Threat cortisol spike — critical/high threats hit hard (amygdala hijack).
        if (isThreat)
            s.cortisol += sevWeight[threatSeverity] ?? 0.3;
        // Acute danger also blunts reward chemicals so a good mood can't mask it.
        if (isThreat && (threatSeverity === 'high' || threatSeverity === 'critical')) {
            s.dopamine -= 0.35;
            s.oxytocin -= 0.2;
        }
        if (userSentiment < -0.2)
            s.cortisol += Math.abs(userSentiment) * 0.25;
        // Positive contact relieves stress a little.
        if (userSentiment > 0.3)
            s.cortisol -= 0.08;
        // Oxytocin: bonding/praise + warm positive contact.
        s.oxytocin += bonding * 0.4 + Math.max(0, userSentiment) * 0.1;
        this.normalize();
    }
    /**
     * Return modulation biases for the amygdala to fold into valence/arousal.
     * - High serotonin lifts the valence floor (resilient good mood).
     * - High cortisol suppresses valence and pushes arousal up (stressed/alert).
     * - High dopamine adds arousal/energy and a small positive valence lift.
     * - Inertia is dynamic: high serotonin = more stable; high cortisol = more
     *   reactive (mood swings under stress).
     */
    modulate() {
        const s = this.state;
        const valenceBias = (s.serotonin - PROFILE.serotonin.baseline) * 0.6 +
            (s.dopamine - PROFILE.dopamine.baseline) * 0.3 -
            (s.cortisol - PROFILE.cortisol.baseline) * 0.7;
        const arousalBias = (s.dopamine - PROFILE.dopamine.baseline) * 0.4 +
            (s.cortisol - PROFILE.cortisol.baseline) * 0.6;
        // base inertia 0.6; serotonin stabilizes (up to +0.2), cortisol destabilizes (down to -0.2)
        const inertia = clamp01(0.6 + (s.serotonin - PROFILE.serotonin.baseline) * 0.4 - (s.cortisol - PROFILE.cortisol.baseline) * 0.4);
        return {
            valenceBias: Math.max(-1, Math.min(1, valenceBias)),
            arousalBias: Math.max(-1, Math.min(1, arousalBias)),
            inertia,
            stressLevel: s.cortisol,
            reward: s.dopamine,
            // When cortisol is high, acute threat response overrides positive mood.
            dangerOverride: s.cortisol >= 0.6,
        };
    }
    /**
     * Decay all chemicals toward their baselines. Called on heartbeats.
     * @param ticks how many decay steps (e.g. multiple heartbeats elapsed)
     */
    decay(ticks = 1) {
        for (let i = 0; i < ticks; i++) {
            for (const key of Object.keys(PROFILE)) {
                const { baseline, decay } = PROFILE[key];
                this.state[key] = this.state[key] + (baseline - this.state[key]) * decay;
            }
        }
        this.normalize();
    }
    normalize() {
        this.state.dopamine = clamp01(this.state.dopamine);
        this.state.serotonin = clamp01(this.state.serotonin);
        this.state.cortisol = clamp01(this.state.cortisol);
        this.state.oxytocin = clamp01(this.state.oxytocin);
    }
    getState() {
        return { ...this.state };
    }
    /** Human-readable label for the dominant chemical signal (for status/UX). */
    describe() {
        const s = this.state;
        const parts = [];
        if (s.cortisol > 0.55)
            parts.push('stressed');
        if (s.dopamine > 0.6)
            parts.push('motivated');
        if (s.serotonin > 0.65)
            parts.push('content');
        if (s.serotonin < 0.35)
            parts.push('low');
        if (s.oxytocin > 0.6)
            parts.push('warm');
        return parts.length ? parts.join('+') : 'balanced';
    }
    async persist() {
        await this.fileManager.writeFile('emotional/neurochemistry.md', this.format());
    }
    format() {
        const s = this.state;
        return `# Neurochemistry
> Auto-managed by AgentBrain Neurochemistry (Phase 3)
> Last updated: ${new Date().toISOString()}

## Levels (0-1)
- Dopamine: ${s.dopamine.toFixed(3)} (reward/motivation, baseline ${PROFILE.dopamine.baseline})
- Serotonin: ${s.serotonin.toFixed(3)} (mood floor/wellbeing, baseline ${PROFILE.serotonin.baseline})
- Cortisol: ${s.cortisol.toFixed(3)} (stress, baseline ${PROFILE.cortisol.baseline})
- Oxytocin: ${s.oxytocin.toFixed(3)} (bonding/trust, baseline ${PROFILE.oxytocin.baseline})

## Signal
- State: ${this.describe()}
`;
    }
    parse(content) {
        const num = (label, dflt) => parseFloat(content.match(new RegExp(`${label}: ([\\d.]+)`))?.[1] || String(dflt));
        return {
            dopamine: num('Dopamine', PROFILE.dopamine.baseline),
            serotonin: num('Serotonin', PROFILE.serotonin.baseline),
            cortisol: num('Cortisol', PROFILE.cortisol.baseline),
            oxytocin: num('Oxytocin', PROFILE.oxytocin.baseline),
        };
    }
}
exports.Neurochemistry = Neurochemistry;
//# sourceMappingURL=neurochemistry.js.map