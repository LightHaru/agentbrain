/**
 * Brainstem — Alertness, Reflexes & Autonomic Responses
 *
 * Like the brain's brainstem, this module handles:
 * - Alertness levels (awake, drowsy, sleep mode)
 * - Reflexive responses (immediate reactions before conscious processing)
 * - Autonomic regulation (background processes, maintenance)
 * - Fight/flight/freeze responses (threat detection)
 * - Arousal modulation (how "awake" the system is)
 */
import { BrainConfig } from './config.js';
export type AlertnessLevel = 'hypervigilant' | 'alert' | 'relaxed' | 'drowsy' | 'sleep';
export interface ReflexTrigger {
    pattern: string | RegExp;
    category: 'threat' | 'urgent' | 'greeting' | 'farewell' | 'error' | 'praise' | 'insult';
    response: string;
    priority: number;
    cooldownMs: number;
    lastFired?: number;
}
export interface ThreatAssessment {
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    source: string;
    response: 'ignore' | 'monitor' | 'alert' | 'fight' | 'freeze';
    details: string;
}
export interface AutonomicProcess {
    id: string;
    name: string;
    intervalMs: number;
    lastRun: number;
    enabled: boolean;
    action: string;
}
export interface BrainstemState {
    alertness: AlertnessLevel;
    arousalLevel: number;
    activeReflexes: number;
    recentThreats: ThreatAssessment[];
    autonomicProcesses: AutonomicProcess[];
    uptime: number;
    responseLatency: number;
}
export declare class Brainstem {
    private config;
    private alertness;
    private arousal;
    private startTime;
    private lastActivity;
    private recentThreats;
    private reflexHistory;
    private reflexes;
    private autonomicProcesses;
    constructor(config: BrainConfig);
    /**
     * Check for reflexive responses (fast, pre-conscious processing)
     */
    checkReflexes(input: string): ReflexTrigger | null;
    /**
     * Assess threat level from input
     */
    assessThreat(input: string, context?: {
        sender?: string;
        isKnown?: boolean;
    }): ThreatAssessment;
    /**
     * Update alertness based on activity and time
     */
    updateAlertness(event?: {
        type: string;
        importance?: number;
    }): void;
    /**
     * Get due autonomic processes (background tasks that need to run)
     */
    getDueProcesses(): AutonomicProcess[];
    /**
     * Mark an autonomic process as completed
     */
    markProcessComplete(processId: string): void;
    /**
     * Run heartbeat (periodic maintenance)
     */
    heartbeat(): {
        dueProcesses: AutonomicProcess[];
        alertness: AlertnessLevel;
        threats: number;
    };
    /**
     * Get estimated response latency based on alertness
     */
    getResponseLatency(): number;
    /**
     * Fight/Flight/Freeze response
     */
    getFightFlightFreeze(threatLevel: ThreatAssessment['level']): 'fight' | 'flight' | 'freeze';
    /**
     * Get full state for status reporting
     */
    getState(): BrainstemState;
    /**
     * Get alertness level
     */
    getAlertness(): AlertnessLevel;
    /**
     * Get arousal level
     */
    getArousalLevel(): number;
    /**
     * Set arousal directly (for testing)
     */
    setArousal(value: number): void;
    /**
     * Adjust arousal based on reflex category
     */
    private adjustArousal;
}
//# sourceMappingURL=brainstem.d.ts.map