/**
 * ReasoningCortex — Brain Whisper System (Phase 6.5 - Enhanced)
 *
 * Provides reasoning hints and suggestions to Aira (the main agent)
 * WITHOUT taking over the thinking process.
 *
 * ENHANCEMENTS (Phase 6.5):
 * 1. Context-Aware: Time pressure, data availability, urgency detection
 * 2. Smart Heuristics: Task-specific adaptive hints
 * 3. Self-Learning: Outcome tracking + effectiveness scoring
 * 4. Token Budget: Adaptive whisper length based on context size
 *
 * Brain's role: Internal assistant that whispers hints
 * Aira's role: Main agent that decides and responds
 */
import { BrainConfig } from './config.js';
import { Hippocampus } from './hippocampus.js';
import { TemporalLobe } from './temporal.js';
export type TaskType = 'factual-lookup' | 'market-data' | 'creative' | 'planning' | 'troubleshooting' | 'casual' | 'unknown';
export type Complexity = 'simple' | 'medium' | 'complex';
export type Urgency = 'low' | 'normal' | 'high' | 'critical';
export type ThinkingMode = 'quick' | 'balanced' | 'deep' | 'reflective';
export interface AdvisorModelHint {
    enabled: true;
    provider: string;
    model: string;
    role: 'verifier-only';
    maxTokens: number;
}
export interface BrainWhisper {
    /** Unique id for recording this whisper's outcome */
    whisperId: string;
    /** Advisory-only support role. Aira/OpenClaw remains the final responder. */
    supportRole: 'advisor-only';
    /** Private thinking depth for this turn */
    thinkingMode: ThinkingMode;
    /** Detected task type */
    taskType: TaskType;
    /** Estimated complexity */
    complexity: Complexity;
    /** Detected urgency level */
    urgency: Urgency;
    /** Time pressure detected (seconds remaining if known) */
    timePressure?: number;
    /** Relevant memories from hippocampus */
    relevantMemories: string[];
    /** Overall confidence (0-1) */
    confidence: number;
    /** Whether brain has relevant knowledge */
    knowledgeAvailable: boolean;
    /** Suggestions (not commands) - adaptive based on context */
    suggestions: string[];
    /** Matched training playbooks that shaped this whisper */
    playbookIds: string[];
    /** Private reasoning scaffold, not chain-of-thought */
    reasoningFrame: string[];
    /** Checks Aira should satisfy before answering */
    verificationChecks: string[];
    /** Live/source lookup plan for Aira to execute itself */
    sourcePlan: string[];
    /** What a complete answer should include */
    answerContract: string[];
    /** How Aira should rank and reject evidence */
    evidenceRules: string[];
    /** What Aira should do when evidence is weak or contradictory */
    recoverySteps: string[];
    /** Signals that should lower certainty or trigger clarification */
    uncertaintySignals: string[];
    /** Cautions to be aware of */
    cautions: string[];
    /** Optional suggested approach */
    suggestedApproach?: string;
    /** Explicit handoff back to the main agent */
    handoffDirective: string;
    /** Optional lightweight verifier. It may critique only; it must not answer for Aira. */
    advisorModel?: AdvisorModelHint;
    /** Token budget used for this whisper */
    tokenBudget: number;
}
export interface TaskAnalysis {
    type: TaskType;
    complexity: Complexity;
    urgency: Urgency;
    requiredKnowledge: string[];
    keywords: string[];
    timeSensitive: boolean;
}
export interface WhisperContext {
    userMessage: string;
    conversationHistory?: any[];
    timeoutSeconds?: number;
    contextTokens?: number;
    elapsedSeconds?: number;
}
export interface WhisperOutcome {
    whisperId: string;
    taskType: TaskType;
    suggestions: string[];
    success: boolean;
    timeTaken: number;
    userSatisfaction?: number;
    timestamp: number;
}
export declare class ReasoningCortex {
    private config;
    private hippocampus;
    private temporal;
    /** Outcome tracking for self-learning */
    private outcomes;
    private maxOutcomeHistory;
    /** Heuristics library for different task types (ENHANCED) */
    private readonly HEURISTICS;
    constructor(config: BrainConfig, hippocampus: Hippocampus, temporal: TemporalLobe);
    /**
     * Main entry point: Generate whisper for Aira (ENHANCED)
     */
    generateWhisper(context: WhisperContext): Promise<BrainWhisper>;
    /**
     * Return a no-op whisper when the feature is disabled or the token budget is zero.
     */
    private createEmptyWhisper;
    private getAdvisorModelHint;
    /**
     * Detect time pressure from context
     */
    private detectTimePressure;
    /**
     * Detect urgency from message content
     */
    private detectUrgency;
    /**
     * Generate adaptive suggestions based on time pressure and context
     */
    private generateAdaptiveSuggestions;
    /**
     * Get suggested approach (adaptive based on time pressure)
     */
    private getSuggestedApproach;
    /**
     * Pick how much private cognitive scaffolding Aira needs for this turn.
     */
    private determineThinkingMode;
    /**
     * Generate compact private reasoning structure without exposing chain-of-thought.
     */
    private generateReasoningFrame;
    /**
     * Generate output quality gates before Aira answers.
     */
    private generateVerificationChecks;
    /**
     * Identify why this whisper should stay cautious.
     */
    private detectUncertaintySignals;
    private generateSourcePlan;
    private generateAnswerContract;
    private generateEvidenceRules;
    private generateRecoverySteps;
    private hasPlaybook;
    private hasAnyPlaybook;
    private prioritizePlaybookHints;
    private orderPlaybooks;
    private playbookSpecificity;
    private unique;
    /**
     * Track whisper for outcome learning
     */
    private trackWhisper;
    /**
     * Get effective suggestions based on past outcomes
     */
    private getEffectiveSuggestions;
    /**
     * Record outcome for learning (called externally after task completion)
     */
    recordOutcome(whisperId: string, success: boolean, userSatisfaction?: number): void;
    /**
     * Calculate adaptive token budget for whisper
     */
    private calculateTokenBudget;
    /**
     * Query relevant memories (ENHANCED with token budget awareness)
     */
    private queryRelevantMemories;
    /**
     * Analyze task type and complexity from user message (ENHANCED)
     */
    private normalizeIntentText;
    private analyzeTask;
    /**
     * Assess confidence based on available knowledge and task familiarity
     */
    private assessConfidence;
    /**
     * Get success rate for a task type from past outcomes
     */
    private getSuccessRate;
    /**
     * Generate cautions based on task type and confidence
     */
    private generateCautions;
    /**
     * Get whisper statistics
     */
    getStatistics(): {
        totalWhispers: number;
        successRate: number;
        avgTimeTaken: number;
        taskTypeBreakdown: Record<TaskType, number>;
    };
}
//# sourceMappingURL=reasoning-cortex.d.ts.map