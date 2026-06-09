/**
 * Brainstem — arousal regulation + autonomic background processes
 *
 * REAL state: tracks actual uptime, runs autonomic processes on their real
 * intervals (lastRun advances when due), records real threats with decay,
 * and derives alertness/arousal from recent threat activity.
 */
export interface AutonomicProcess {
    id: string;
    name: string;
    intervalMs: number;
    lastRun: number;
    enabled: boolean;
    action: string;
    runCount: number;
}
export interface ThreatRecord {
    severity: 'low' | 'medium' | 'high' | 'critical';
    at: number;
    note: string;
}
export interface BrainstemState {
    alertness: 'drowsy' | 'calm' | 'alert' | 'hypervigilant';
    arousalLevel: number;
    activeReflexes: number;
    recentThreats: ThreatRecord[];
    autonomicProcesses: Array<Omit<AutonomicProcess, 'runCount'> & {
        runCount: number;
    }>;
    uptime: number;
    responseLatency: number;
}
export declare class Brainstem {
    private startTime;
    private threats;
    private processes;
    private baseArousal;
    constructor(now?: number);
    /** Advance autonomic processes whose interval has elapsed. Returns ids that fired. */
    pump(now?: number): string[];
    recordThreat(severity: ThreatRecord['severity'], note?: string): void;
    private recentThreats;
    getState(): BrainstemState;
}
//# sourceMappingURL=brainstem.d.ts.map