/**
 * Corpus Callosum — inter-module signal bus
 *
 * REAL state: modules register, send signals through it, and it counts real
 * traffic, measures latency, and detects conflicts (e.g. amygdala says
 * "alarmed" while hypothalamus reports "calm"). Metrics are computed from
 * actual routed signals, not hardcoded zeros.
 */
export interface ModuleSignal {
    from: string;
    to: string | 'broadcast';
    type: string;
    payload?: any;
    at: number;
}
export interface ConflictRecord {
    between: [string, string];
    reason: string;
    at: number;
}
export interface CorpusCallosumState {
    registeredModules: string[];
    pendingSignals: number;
    processedSignals: number;
    metrics: {
        totalMessages: number;
        messagesPerMinute: number;
        averageLatency: number;
        droppedMessages: number;
        activeModules: number;
        conflicts: number;
    };
    recentConflicts: ConflictRecord[];
}
export declare class CorpusCallosum {
    private modules;
    private processed;
    private dropped;
    private latencies;
    private timestamps;
    private conflicts;
    private lastSignalByModule;
    register(moduleId: string): void;
    /** Route a signal between modules. Returns true if delivered. */
    send(signal: Omit<ModuleSignal, 'at'>): boolean;
    /** Record a detected cross-module conflict. */
    flagConflict(a: string, b: string, reason: string): void;
    getState(): CorpusCallosumState;
}
//# sourceMappingURL=corpus-callosum.d.ts.map