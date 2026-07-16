/**
 * AgentBrain Engine â€” agent-neutral SDK facade (v0.7.0)
 *
 * The OpenClaw plugin (src/plugin/entry.ts) wires the brain into one specific
 * host. This module exposes the SAME cognitive core as a clean, importable
 * engine any external agent (Codex, Claude, a CLI, a test) can drive with a
 * single stable call:
 *
 *   const brain = createBrainEngine();
 *   await brain.init();
 *   const turn = await brain.processTurn({ message, userId });
 *   const state = brain.getState();
 *
 * Design goals (addressing the v0.6.0 audit findings):
 *  - One entrypoint owns orchestration; the caller never wires modules by hand.
 *  - Storage and the clock are injectable adapters (default: in-memory + Date.now).
 *  - processTurn() returns a typed, cloned snapshot â€” no live internal references.
 */
import { BrainConfig } from './core/config.js';
import { BrainFileManager } from './storage/md-writer.js';
import type { MessageClassification, Memory } from './index.js';
/** A clock the host can override (e.g. for deterministic tests / time travel). */
export type Clock = () => number;
export interface BrainEngineOptions {
    config?: Partial<BrainConfig>;
    /** Storage adapter. Defaults to in-memory (no filesystem). Pass a
     *  BrainFileManager / SqlStorageAdapter for persistence. */
    storage?: BrainFileManager;
    /** Injectable clock; defaults to Date.now. */
    clock?: Clock;
    /** IANA timezone for circadian/hypothalamus. Default Asia/Ho_Chi_Minh. */
    timezone?: string;
    enableMemoryReview?: boolean;
    reviewScheduleConfig?: Partial<ScheduleConfig>;
    enableOutcomeTracking?: boolean;
}
export interface TurnInput {
    message: string;
    userId: string;
    userName?: string;
    sessionId?: string;
    /** Optional explicit success signal for the prior task (feeds drives). */
    taskSucceeded?: boolean;
    timestamp?: string;
}
export interface TurnResult {
    classification: MessageClassification;
    userSentiment: number;
    threat: {
        isThreat: boolean;
        severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
        threatType: string | null;
        reason: string | null;
    };
    emotionalState: {
        mood: string;
        intensity: number;
        valence: number;
        arousal: number;
    };
    /** Generated discrete emotion from cognitive appraisal (v0.8.0). Same
     *  valence can yield pride vs affection vs protective anger depending on
     *  who caused it and whether the agent can cope. */
    feeling: {
        label: string;
        intensity: number;
        valence: number;
        arousal: number;
        dominance: number;
    };
    neurochemistry: {
        dopamine: number;
        serotonin: number;
        cortisol: number;
        oxytocin: number;
        signal: string;
    };
    relevantMemories: Memory[];
    focus: {
        source: string;
        content: string;
        salience: number;
    } | null;
}
export interface BrainEngine {
    readonly version: string;
    init(): Promise<void>;
    processTurn(input: TurnInput): Promise<TurnResult>;
    /** Advance time-based subsystems (drives grow, autonomic processes fire,
     *  neurochemistry decays). Call on a heartbeat/interval. */
    tick(now?: number): {
        autonomicFired: string[];
    };
    /** Full typed snapshot of every subsystem. Always a deep copy. */
    getState(): Record<string, unknown>;
    /** Direct access to the storage adapter (e.g. MemoryStorage.dump()). */
    readonly storage: BrainFileManager;
    reviewMemories(scope?: Partial<import('./core/memory-reviewer.js').ReviewScope>): Promise<import('./core/memory-reviewer.js').MemoryReviewCycle>;
    getOutcomeStats(): import('./core/outcome-tracker.js').OutcomeStatistics;
    getReviewStats(): ReturnType<import('./core/memory-reviewer.js').MemoryReviewer['getStatistics']>;
    getSchedulerStatus(): ReturnType<import('./core/review-scheduler.js').ReviewScheduler['getStatus']> | null;
    getStrategyWeights(): Map<string, number>;
    getInsights(limit?: number): ReturnType<import('./core/memory-reviewer.js').MemoryReviewer['getInsights']>;
    getMetaLearnings(): ReturnType<import('./core/outcome-tracker.js').OutcomeTracker['getMetaLearnings']>;
    shutdown(): Promise<void>;
}
import { type ScheduleConfig } from './core/review-scheduler.js';
export declare function createBrainEngine(options?: BrainEngineOptions): BrainEngine;
export default createBrainEngine;
//# sourceMappingURL=engine.d.ts.map