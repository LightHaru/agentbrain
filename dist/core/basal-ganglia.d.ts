/**
 * Basal Ganglia — Reward & Motivation System
 *
 * Like the brain's basal ganglia, this module handles:
 * - Processing reward signals from user feedback
 * - Reinforcing successful behaviors
 * - Reducing unsuccessful behaviors
 * - Motivation scoring: prioritize task types with high success history
 */
import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
export interface RewardSignal {
    timestamp: string;
    taskType: string;
    signal: number;
    source: 'explicit' | 'implicit';
    context: string;
}
export interface BehaviorScore {
    behavior: string;
    reinforcement: number;
    sampleSize: number;
    lastUpdated: string;
}
export interface MotivationProfile {
    taskType: string;
    motivation: number;
    historicalSuccess: number;
    recentFeedback: number;
}
export declare class BasalGanglia {
    private config;
    private fileManager;
    private rewardHistory;
    private behaviorScores;
    private motivationProfiles;
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    /**
     * Initialize: load reward history and behavior scores
     */
    initialize(): Promise<void>;
    /**
     * Process a reward signal (positive or negative feedback)
     */
    processReward(signal: RewardSignal): void;
    /**
     * Get motivation score for a task type (0-1)
     * Higher = agent should prioritize this type of work
     */
    getMotivation(taskType: string): number;
    /**
     * Get all motivation profiles sorted by motivation
     */
    getMotivationRanking(): MotivationProfile[];
    /**
     * Get behavior reinforcement score
     */
    getBehaviorScore(behavior: string): number;
    /**
     * Get recent reward trend (-1 to 1)
     */
    getRecentTrend(lastN?: number): number;
    /**
     * Persist reward data
     */
    persist(): Promise<void>;
    private updateBehaviorScore;
    private updateMotivationProfile;
    private rebuildMotivationProfiles;
    private formatRewardHistory;
    private formatMotivation;
    private formatBehaviorScores;
    private parseRewardHistory;
}
//# sourceMappingURL=basal-ganglia.d.ts.map