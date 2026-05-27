/**
 * Metacognition — Thinking About Thinking
 *
 * This module enables the agent to:
 * - Monitor its own thinking process
 * - Estimate confidence in decisions
 * - Adjust strategies based on performance
 * - Reflect on past actions
 * - Recognize when it needs help or more information
 *
 * Key capabilities:
 * - Self-monitoring: "Am I doing this right?"
 * - Confidence estimation: "How sure am I?"
 * - Strategy adjustment: "Should I try a different approach?"
 * - Reflection: "What did I learn from this?"
 */
import { BrainConfig } from './config.js';
export interface ThoughtProcess {
    /** Steps taken in thinking */
    steps: Array<{
        action: string;
        reasoning: string;
        timestamp: number;
    }>;
    /** How long the thinking took (ms) */
    duration: number;
    /** Complexity of the thought process */
    complexity: number;
    /** Was this process successful? */
    successful?: boolean;
}
export interface MetacognitiveState {
    /** Confidence in current thinking (0-1) */
    confidence: number;
    /** Areas of uncertainty */
    uncertaintyAreas: string[];
    /** Quality of thinking (0-1) */
    thinkingQuality: number;
    /** Does agent need more information? */
    needsMoreInfo: boolean;
    /** Alternative strategies available */
    alternativeStrategies: Strategy[];
    /** Current strategy being used */
    currentStrategy: Strategy | null;
}
export interface Strategy {
    /** Strategy name */
    name: string;
    /** Description */
    description: string;
    /** When this strategy is applicable */
    applicableWhen: string[];
    /** Expected outcome */
    expectedOutcome: string;
    /** Success rate (0-1) */
    successRate: number;
    /** Times used */
    timesUsed: number;
}
export interface Reflection {
    /** What went well */
    whatWentWell: string[];
    /** What went wrong */
    whatWentWrong: string[];
    /** Lessons learned */
    lessonsLearned: string[];
    /** Adjustments to make */
    adjustments: string[];
    /** Confidence in this reflection */
    confidence: number;
}
export interface ConfidenceEstimate {
    /** Overall confidence (0-1) */
    overall: number;
    /** Confidence breakdown */
    breakdown: {
        dataQuality: number;
        processQuality: number;
        outcomeClarity: number;
        pastPerformance: number;
    };
    /** Factors reducing confidence */
    uncertaintyFactors: string[];
}
export interface PerformanceMetrics {
    /** Recent success rate */
    successRate: number;
    /** Average task duration */
    avgDuration: number;
    /** Error rate */
    errorRate: number;
    /** Trend */
    trend: 'improving' | 'stable' | 'declining';
}
export declare class Metacognition {
    private config;
    /** Available strategies */
    private strategies;
    /** Current metacognitive state */
    private state;
    /** Thought process history */
    private thoughtHistory;
    /** Reflection history */
    private reflections;
    /** Maximum history size */
    private readonly HISTORY_SIZE;
    constructor(config: BrainConfig);
    /**
     * Monitor a thinking process as it happens
     */
    monitorThinking(process: ThoughtProcess): MetacognitiveState;
    /**
     * Assess quality of thinking process
     */
    private assessThinkingQuality;
    /**
     * Estimate confidence in the thinking process
     */
    private estimateProcessConfidence;
    /**
     * Identify areas of uncertainty
     */
    private identifyUncertainties;
    /**
     * Detect if more information is needed
     */
    private detectInformationGap;
    /**
     * Suggest alternative strategies
     */
    private suggestAlternatives;
    /**
     * Estimate confidence in a decision
     */
    estimateConfidence(decision: {
        context: string;
        reasoning: string;
        dataQuality: number;
        pastPerformance: number;
    }): ConfidenceEstimate;
    /**
     * Select best strategy for current situation
     */
    selectStrategy(context: string, performance: PerformanceMetrics): Strategy | null;
    /**
     * Adjust strategy based on performance
     */
    adjustStrategy(performance: PerformanceMetrics): Strategy | null;
    /**
     * Record strategy outcome
     */
    recordStrategyOutcome(strategyName: string, success: boolean): void;
    /**
     * Reflect on recent actions
     */
    reflect(recentActions: Array<{
        action: string;
        outcome: 'success' | 'failure' | 'partial';
        reasoning: string;
    }>): Reflection;
    /**
     * Get past reflections
     */
    getReflections(limit?: number): Reflection[];
    /**
     * Initialize default strategies
     */
    private initializeStrategies;
    /**
     * Get current metacognitive state
     */
    getState(): MetacognitiveState;
    /**
     * Get summary for debugging
     */
    getSummary(): string;
}
//# sourceMappingURL=metacognition.d.ts.map