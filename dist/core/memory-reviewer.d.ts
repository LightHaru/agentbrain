/**
 * MemoryReviewer - Automatic Memory Review & Quality Assessment
 *
 * Inspired by Hermes Agent's self-learning capabilities, this module:
 * - Periodically reviews memories for patterns, contradictions, and gaps
 * - Scores memory quality and relevance
 * - Consolidates related memories into insights
 * - Detects conflicting information
 * - Generates meta-learnings from memory clusters
 *
 * This is a key component for making AgentBrain self-improving.
 */
import { Memory } from '../index.js';
import { Hippocampus } from './hippocampus.js';
import { BrainConfig } from './config.js';
export interface ReviewScope {
    type: 'recent' | 'all' | 'topic-specific';
    trigger: 'scheduled' | 'threshold' | 'manual';
    timeWindow?: number;
    topic?: string;
}
export interface MemoryReviewCycle {
    id: string;
    trigger: 'scheduled' | 'threshold' | 'manual';
    timestamp: string;
    scope: 'recent' | 'all' | 'topic-specific';
    memoriesReviewed: number;
    findings: ReviewFinding[];
    actions: ReviewAction[];
    executionTimeMs: number;
}
export interface ReviewFinding {
    type: 'pattern' | 'contradiction' | 'gap' | 'insight' | 'low-quality';
    severity: number;
    description: string;
    affectedMemories: string[];
    confidence: number;
    metadata?: Record<string, unknown>;
}
export interface ReviewAction {
    type: 'consolidate' | 'prune' | 'flag' | 'strengthen' | 'create-insight' | 'resolve-contradiction';
    targetMemories: string[];
    reason: string;
    executed: boolean;
    result?: string;
}
export interface Pattern {
    type: 'repeated-topic' | 'repeated-correction' | 'temporal' | 'entity-cooccurrence';
    description: string;
    memories: Memory[];
    frequency: number;
    confidence: number;
}
export interface Contradiction {
    memoryA: Memory;
    memoryB: Memory;
    conflictType: 'factual' | 'preference' | 'instruction';
    severity: number;
    description: string;
    resolution: 'keep-newer' | 'keep-both' | 'flag-for-review' | 'merge';
}
export interface Gap {
    topic: string;
    description: string;
    relatedMemories: Memory[];
    severity: number;
}
export interface Insight {
    id: string;
    title: string;
    content: string;
    sourceMemories: string[];
    confidence: number;
    timestamp: string;
    type: 'user-preference' | 'behavioral-pattern' | 'knowledge-cluster' | 'meta-learning';
}
export declare class MemoryReviewer {
    private hippocampus;
    private config;
    private reviewHistory;
    private insights;
    private lastReviewTime;
    constructor(hippocampus: Hippocampus, config: BrainConfig);
    runReviewCycle(scope: ReviewScope): Promise<MemoryReviewCycle>;
    private detectPatterns;
    private detectRepeatedTopics;
    private detectRepeatedCorrections;
    private detectTemporalPatterns;
    private detectEntityCooccurrence;
    private findContradictions;
    private detectConflict;
    private determineResolution;
    private identifyGaps;
    private assessMemoryQuality;
    private scoreMemoryQuality;
    private generateInsights;
    private generateActions;
    private executeActions;
    private getMemoriesForReview;
    private groupByTopic;
    private clusterBySimilarity;
    private tokenize;
    private daysSince;
    private generateId;
    private patternToFinding;
    private contradictionToFinding;
    private gapToFinding;
    private insightToFinding;
    getReviewHistory(limit?: number): MemoryReviewCycle[];
    getInsights(limit?: number): Insight[];
    getStatistics(): {
        totalReviews: number;
        totalFindings: number;
        totalInsights: number;
        lastReviewTime: string | null;
        avgReviewTime: number;
    };
    shouldReview(memoryCount: number, hoursSinceLastReview: number): boolean;
}
//# sourceMappingURL=memory-reviewer.d.ts.map