/**
 * Corpus Callosum — Inter-Module Communication Bus
 *
 * Like the brain's corpus callosum connecting left/right hemispheres,
 * this module handles:
 * - Message passing between brain modules
 * - Event broadcasting (one module notifies all others)
 * - Priority routing (urgent signals get fast-tracked)
 * - Synchronization (ensure modules have consistent state)
 * - Conflict resolution (when modules disagree)
 */
import { BrainConfig } from './config.js';
export interface BrainSignal {
    id: string;
    source: string;
    target: string | '*';
    type: 'data' | 'event' | 'query' | 'command' | 'alert';
    priority: 'low' | 'normal' | 'high' | 'critical';
    payload: any;
    timestamp: number;
    ttl: number;
    processed: boolean;
}
export interface ModuleRegistration {
    id: string;
    name: string;
    capabilities: string[];
    subscribedEvents: string[];
    lastActive: number;
    messagesSent: number;
    messagesReceived: number;
}
export interface ConflictReport {
    id: string;
    modules: string[];
    issue: string;
    resolution: string;
    timestamp: number;
    resolved: boolean;
}
export interface BusMetrics {
    totalMessages: number;
    messagesPerMinute: number;
    averageLatency: number;
    droppedMessages: number;
    activeModules: number;
    conflicts: number;
}
export interface CorpusCallosumState {
    registeredModules: ModuleRegistration[];
    pendingSignals: number;
    processedSignals: number;
    metrics: BusMetrics;
    recentConflicts: ConflictReport[];
}
export declare class CorpusCallosum {
    private config;
    private modules;
    private signalQueue;
    private processedSignals;
    private conflicts;
    private listeners;
    private totalMessages;
    private droppedMessages;
    private startTime;
    private signalCounter;
    constructor(config: BrainConfig);
    /**
     * Register a brain module with the communication bus
     */
    registerModule(id: string, name: string, capabilities: string[], subscribedEvents?: string[]): void;
    /**
     * Subscribe to events from the bus
     */
    subscribe(moduleId: string, eventType: string, callback: (signal: BrainSignal) => void): void;
    /**
     * Send a signal between modules
     */
    send(signal: Omit<BrainSignal, 'id' | 'timestamp' | 'processed'>): string;
    /**
     * Broadcast a signal to all modules
     */
    broadcast(source: string, type: BrainSignal['type'], payload: any, priority?: BrainSignal['priority']): string;
    /**
     * Query a specific module for data
     */
    query(source: string, target: string, queryPayload: any): string;
    /**
     * Send an alert (high priority broadcast)
     */
    alert(source: string, alertPayload: {
        level: string;
        message: string;
        data?: any;
    }): string;
    /**
     * Process pending signals in the queue
     */
    processQueue(): {
        processed: number;
        dropped: number;
    };
    /**
     * Report a conflict between modules
     */
    reportConflict(modules: string[], issue: string): string;
    /**
     * Get metrics about the communication bus
     */
    getMetrics(): BusMetrics;
    /**
     * Get registered modules
     */
    getRegisteredModules(): ModuleRegistration[];
    /**
     * Check if a module is registered and active
     */
    isModuleActive(moduleId: string): boolean;
    /**
     * Get full state for status reporting
     */
    getState(): CorpusCallosumState;
    /**
     * Heartbeat — process queue and maintain bus health
     */
    heartbeat(): {
        processed: number;
        dropped: number;
        activeModules: number;
    };
    /**
     * Process a single signal
     */
    private processSignal;
    /**
     * Notify listeners for a module
     */
    private notifyListeners;
    /**
     * Resolve a conflict between modules using priority rules
     */
    private resolveConflict;
}
//# sourceMappingURL=corpus-callosum.d.ts.map