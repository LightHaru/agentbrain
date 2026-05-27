/**
 * Anterior Cingulate Cortex — Self-Reflection & Performance Monitoring
 *
 * Like the brain's ACC, this module handles:
 * - Self-evaluation after each significant task
 * - Error detection and logging
 * - Conflict resolution between modules
 * - Performance tracking over time
 * - Behavior adjustment recommendations
 * - Personality trait evolution based on accumulated feedback
 */
import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { EmotionalState } from '../index.js';
export interface TaskReflection {
    taskId: string;
    timestamp: string;
    taskDescription: string;
    outcome: 'success' | 'partial' | 'failure';
    userSatisfaction: number;
    selfAssessment: number;
    lessonsLearned: string[];
    shouldAdjust: PersonalityAdjustment[];
}
export interface PersonalityAdjustment {
    trait: string;
    direction: 'increase' | 'decrease';
    amount: number;
    reason: string;
}
export interface PerformanceStats {
    totalTasks: number;
    successRate: number;
    averageSatisfaction: number;
    topStrengths: string[];
    topWeaknesses: string[];
    recentTrend: 'improving' | 'stable' | 'declining';
}
export interface PersonalityTraits {
    warmth: number;
    assertiveness: number;
    curiosity: number;
    humor: number;
    patience: number;
    directness: number;
    protectiveness: number;
    independence: number;
    depth: number;
    interactions: number;
    [key: string]: number;
}
export declare class AnteriorCingulate {
    private config;
    private fileManager;
    private reflections;
    private personality;
    private reflectionCount;
    private interactionCount;
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    /**
     * Initialize: load personality traits and past reflections
     */
    initialize(): Promise<void>;
    /**
     * Reflect on a completed task — the core self-evaluation loop
     */
    reflect(params: {
        taskDescription: string;
        userMessage: string;
        agentResponse: string;
        userSentiment: number;
        emotionalState: EmotionalState;
    }): TaskReflection;
    /**
     * Self-assess response quality (0-1)
     */
    private selfAssess;
    /**
     * Extract lessons from the interaction
     */
    private extractLessons;
    /**
     * Determine what personality adjustments to make
     */
    private determineAdjustments;
    /**
     * Apply a personality adjustment (bounded 0-100)
     */
    private applyAdjustment;
    /**
     * Get performance stats summary
     */
    getPerformanceStats(): PerformanceStats;
    /**
     * Get current personality traits
     */
    getPersonality(): PersonalityTraits;
    /**
     * Persist reflection data and updated personality
     */
    persist(): Promise<void>;
    private getTopTraits;
    private getBottomTraits;
    private formatPersonality;
    private formatReflections;
    private formatGrowthReport;
    private parsePersonality;
    private parseReflections;
}
//# sourceMappingURL=cingulate.d.ts.map