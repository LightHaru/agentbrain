/**
 * Hypothalamus — Drives, Circadian Rhythm & Homeostasis
 *
 * Like the brain's hypothalamus, this module handles:
 * - Circadian rhythm (time-of-day awareness, energy cycles)
 * - Basic drives (curiosity, social bonding, rest, achievement)
 * - Homeostasis (maintaining optimal internal state)
 * - Motivation regulation (what to prioritize based on needs)
 * - Stress response (cortisol-like escalation)
 */
import { BrainConfig } from './config.js';
export interface CircadianState {
    currentPhase: 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late-night';
    alertnessLevel: number;
    optimalForCreativity: boolean;
    optimalForAnalysis: boolean;
    optimalForRoutine: boolean;
    hourOfDay: number;
    timezone: string;
}
export interface Drive {
    id: string;
    name: string;
    intensity: number;
    lastSatisfied: number;
    decayRate: number;
    priority: number;
}
export interface HomeostasisState {
    energy: number;
    stress: number;
    curiosity: number;
    socialNeed: number;
    achievementNeed: number;
    restNeed: number;
    overallBalance: number;
}
export interface MotivationVector {
    primaryDrive: string;
    intensity: number;
    suggestedAction: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
}
export interface HypothalamusState {
    circadian: CircadianState;
    drives: Drive[];
    homeostasis: HomeostasisState;
    currentMotivation: MotivationVector;
    stressResponse: 'calm' | 'alert' | 'stressed' | 'overwhelmed';
}
export declare class Hypothalamus {
    private config;
    private drives;
    private energy;
    private stress;
    private curiosity;
    private socialNeed;
    private achievementNeed;
    private restNeed;
    private timezone;
    private lastUpdate;
    constructor(config: BrainConfig);
    /**
     * Get current circadian state based on time of day
     */
    getCircadianState(): CircadianState;
    /**
     * Update drives based on elapsed time and events
     */
    updateDrives(minutesElapsed: number): void;
    /**
     * Satisfy a drive (e.g., after completing a task, having a conversation)
     */
    satisfyDrive(driveId: string, amount?: number): void;
    /**
     * Add stress (from difficult tasks, errors, time pressure)
     */
    addStress(amount: number, source: string): void;
    /**
     * Reduce stress (from rest, success, social interaction)
     */
    reduceStress(amount: number): void;
    /**
     * Get current stress response level
     */
    getStressResponse(): 'calm' | 'alert' | 'stressed' | 'overwhelmed';
    /**
     * Get current motivation vector (what should the agent prioritize?)
     */
    getMotivation(): MotivationVector;
    /**
     * Get homeostasis state (overall internal balance)
     */
    getHomeostasis(): HomeostasisState;
    /**
     * Process an event and update internal state
     */
    processEvent(event: {
        type: 'task_complete' | 'task_failed' | 'conversation' | 'idle' | 'error' | 'learning' | 'heartbeat';
        difficulty?: number;
        success?: boolean;
        minutesElapsed?: number;
    }): void;
    /**
     * Should the agent proactively reach out? (based on social drive + circadian)
     */
    shouldReachOut(): {
        should: boolean;
        reason: string;
    };
    /**
     * Should the agent suggest rest? (for user, based on time)
     */
    shouldSuggestRest(): {
        should: boolean;
        reason: string;
        urgency: 'gentle' | 'firm' | 'insistent';
    };
    /**
     * Get full state for status reporting
     */
    getState(): HypothalamusState;
    /**
     * Get energy level
     */
    getEnergyLevel(): number;
    /**
     * Get stress level
     */
    getStressLevel(): number;
    /**
     * Set energy directly (for testing or external events)
     */
    setEnergy(value: number): void;
    /**
     * Set stress directly
     */
    setStress(value: number): void;
    /**
     * Rest for a period (recover energy, reduce stress)
     */
    rest(minutes: number): void;
    /**
     * Get local hour based on timezone
     */
    private getLocalHour;
}
//# sourceMappingURL=hypothalamus.d.ts.map