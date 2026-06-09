export interface Drive {
    id: string;
    name: string;
    intensity: number;
    lastSatisfied: number;
    decayRate: number;
    priority: number;
}
export interface HypothalamusState {
    circadian: {
        currentPhase: string;
        alertnessLevel: number;
        optimalForCreativity: boolean;
        optimalForAnalysis: boolean;
        optimalForRoutine: boolean;
        hourOfDay: number;
        timezone: string;
    };
    drives: Drive[];
    homeostasis: {
        energy: number;
        stress: number;
        curiosity: number;
        socialNeed: number;
        achievementNeed: number;
        restNeed: number;
        overallBalance: number;
    };
    currentMotivation: {
        primaryDrive: string;
        intensity: number;
        suggestedAction: string;
        urgency: 'low' | 'medium' | 'high';
    };
    stressResponse: 'calm' | 'guarded' | 'stressed';
}
export declare class Hypothalamus {
    private timezone;
    private drives;
    private stress;
    private lastUpdate;
    constructor(timezone?: string, now?: number);
    /** Let drives grow with neglect. Called on heartbeat or before reading state. */
    tick(now?: number): void;
    /** Satisfy a drive (reduces its intensity). Called from real pipeline events. */
    satisfy(driveId: string, amount?: number): void;
    /** Map a classified message into drive satisfaction. */
    observe(topic: string, sentiment: number, taskSucceeded?: boolean): void;
    /** Stress fed from amygdala threat severity. */
    registerThreat(severity: 'low' | 'medium' | 'high' | 'critical'): void;
    getState(): HypothalamusState;
}
//# sourceMappingURL=hypothalamus.d.ts.map