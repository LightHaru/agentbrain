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
import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
export interface NeurochemState {
    dopamine: number;
    serotonin: number;
    cortisol: number;
    oxytocin: number;
}
export interface NeurochemModulation {
    valenceBias: number;
    arousalBias: number;
    inertia: number;
    stressLevel: number;
    reward: number;
    dangerOverride: boolean;
}
export declare class Neurochemistry {
    private config;
    private fileManager;
    private state;
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    initialize(): Promise<void>;
    /**
     * Push neurochemicals based on an interaction's signals.
     * @param userSentiment -1..1
     * @param isThreat       threat detected this turn
     * @param threatSeverity 'none'|'low'|'medium'|'high'|'critical'
     * @param bonding        positive social/praise signal (0..1), e.g. thanks/praise
     */
    applyEvent(userSentiment: number, isThreat: boolean, threatSeverity?: string, bonding?: number): void;
    /**
     * Return modulation biases for the amygdala to fold into valence/arousal.
     * - High serotonin lifts the valence floor (resilient good mood).
     * - High cortisol suppresses valence and pushes arousal up (stressed/alert).
     * - High dopamine adds arousal/energy and a small positive valence lift.
     * - Inertia is dynamic: high serotonin = more stable; high cortisol = more
     *   reactive (mood swings under stress).
     */
    modulate(): NeurochemModulation;
    /**
     * Decay all chemicals toward their baselines. Called on heartbeats.
     * @param ticks how many decay steps (e.g. multiple heartbeats elapsed)
     */
    decay(ticks?: number): void;
    private normalize;
    getState(): NeurochemState;
    /** Human-readable label for the dominant chemical signal (for status/UX). */
    describe(): string;
    persist(): Promise<void>;
    private format;
    private parse;
}
//# sourceMappingURL=neurochemistry.d.ts.map