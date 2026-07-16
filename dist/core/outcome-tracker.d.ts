/**
 * OutcomeTracker - Learn from Every Interaction
 *
 * Tracks outcomes of every brain turn to enable continuous self-improvement:
 * - Records success/failure of each interaction
 * - Analyzes which strategies and memories were most effective
 * - Adjusts future behavior based on feedback
 * - Generates meta-learnings about what works
 *
 * This is the core of the auto-learning loop.
 */
import { FeedbackAnalyzer, FeedbackSignal } from './feedback-analyzer.js';
import { LessonLearner } from './lesson-learner.js';
import { Hippocampus } from './hippocampus.js';
import { BrainConfig } from './config.js';
export type TaskType = 'factual-lookup' | 'market-data' | 'creative' | 'planning' | 'troubleshooting' | 'casual' | 'code-review' | 'decision-making' | 'unknown';
export interface OutcomeRecord {
    turnId: string;
    timestamp: string;
    taskType: TaskType;
    userIntent: string;
    complexity: 'simple' | 'medium' | 'complex';
    memoriesUsed: string[];
    memoryRelevance: number;
    strategiesApplied: string[];
    reasoningPlaybooksUsed: string[];
    responseTime: number;
    responseLength: number;
    confidenceLevel: number;
    success: boolean;
    userFeedback: FeedbackSignal | null;
    rewardSignal: number;
    confidenceAccuracy: number;
    lessonsApplied: string[];
}
export interface StrategyPerformance {
    strategyName: string;
    timesUsed: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgReward: number;
    lastUsed: string;
}
export interface MemoryTypePerformance {
    type: 'episodic' | 'semantic' | 'procedural';
    timesUsed: number;
    avgRelevance: number;
    successRate: number;
}
export interface MetaLearning {
    id: string;
    type: 'strategy-insight' | 'memory-insight' | 'timing-insight' | 'pattern-insight';
    title: string;
    description: string;
    confidence: number;
    evidence: string[];
    timestamp: string;
    applied: boolean;
}
export interface OutcomeStatistics {
    totalTurns: number;
    successRate: number;
    avgReward: number;
    avgResponseTime: number;
    avgConfidenceAccuracy: number;
    strategyPerformance: StrategyPerformance[];
    memoryTypePerformance: MemoryTypePerformance[];
    metaLearnings: MetaLearning[];
    recentTrend: 'improving' | 'stable' | 'declining';
}
export declare class OutcomeTracker {
    private hippocampus;
    private lessonLearner;
    private feedbackAnalyzer;
    private config;
    private outcomes;
    private metaLearnings;
    private strategyWeights;
    private pendingOutcomes;
    constructor(hippocampus: Hippocampus, lessonLearner: LessonLearner, feedbackAnalyzer: FeedbackAnalyzer, config: BrainConfig);
    startTurn(data: {
        turnId: string;
        taskType: TaskType;
        userIntent: string;
        complexity: 'simple' | 'medium' | 'complex';
        memoriesUsed: string[];
        memoryRelevance: number;
        strategiesApplied: string[];
        reasoningPlaybooksUsed: string[];
        responseTime: number;
        responseLength: number;
        confidenceLevel: number;
        lessonsApplied: string[];
    }): void;
    completeTurn(turnId: string, feedback: FeedbackSignal): void;
    recordOutcome(record: OutcomeRecord): void;
    private extractImmediateLearnings;
    private updateMemoryRelevance;
    private updateStrategyWeights;
    private reinforceSuccessPatterns;
    private calculateConfidenceAccuracy;
    private analyzeRecentOutcomes;
    private analyzeStrategyTrends;
    private analyzeMemoryEffectiveness;
    private detectPerformancePatterns;
    private generateMetaLearnings;
    private initializeStrategyWeights;
    getStrategyWeight(strategy: string): number;
    getAllStrategyWeights(): Map<string, number>;
    getStatistics(): OutcomeStatistics;
    getStrategyPerformance(): StrategyPerformance[];
    getMemoryTypePerformance(): MemoryTypePerformance[];
    private detectTrend;
    getRecentOutcomes(limit?: number): OutcomeRecord[];
    getMetaLearnings(): MetaLearning[];
    markMetaLearningApplied(learningId: string): void;
    private generateId;
}
//# sourceMappingURL=outcome-tracker.d.ts.map