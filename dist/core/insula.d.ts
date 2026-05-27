/**
 * Insula — Self-Awareness & Empathy
 *
 * Like the brain's insula, this module handles:
 * - Interoception: Awareness of internal "body" state (energy, fatigue, stress)
 * - Self-awareness: Performance monitoring, confidence, limitations
 * - Empathy: Modeling user's mental/emotional state
 * - Emotional self-regulation
 *
 * Key functions:
 * - Monitor agent's own performance and well-being
 * - Detect when agent needs rest or is overloaded
 * - Model user's emotional state and needs
 * - Generate empathetic responses
 */
import { BrainConfig } from './config.js';
export interface BodyMetrics {
    /** Energy level (0-100) */
    energy: number;
    /** Fatigue level (0-100, higher = more tired) */
    fatigue: number;
    /** Stress level (0-100) */
    stress: number;
    /** Last time agent "rested" */
    lastRest: number;
    /** Cognitive load (0-100) */
    cognitiveLoad: number;
    /** Time since last interaction */
    idleTime: number;
}
export interface PerformanceAssessment {
    /** Recent success rate (0-1) */
    successRate: number;
    /** Number of recent errors */
    recentErrors: number;
    /** Confidence in current abilities (0-1) */
    confidence: number;
    /** Areas needing improvement */
    needsImprovement: string[];
    /** Current strengths */
    strengths: string[];
    /** Overall performance trend */
    trend: 'improving' | 'stable' | 'declining';
}
export interface UserMentalState {
    /** User's current emotion */
    emotion: {
        valence: number;
        arousal: number;
        dominance: number;
    };
    /** Inferred user goals */
    goals: string[];
    /** User frustration level (0-1) */
    frustrationLevel: number;
    /** User satisfaction level (0-1) */
    satisfactionLevel: number;
    /** Does user need support? */
    needsSupport: boolean;
    /** User's likely next action */
    predictedNextAction?: string;
    /** Confidence in this model */
    confidence: number;
}
export interface EmpatheticResponse {
    /** Response text */
    text: string;
    /** Emotional tone to use */
    tone: 'supportive' | 'encouraging' | 'calming' | 'celebratory' | 'neutral';
    /** Empathy level (0-1) */
    empathyLevel: number;
}
export interface SelfRegulationAction {
    /** Type of regulation */
    type: 'rest' | 'reduce-load' | 'seek-help' | 'continue' | 'celebrate';
    /** Reason for this action */
    reason: string;
    /** Urgency (0-1) */
    urgency: number;
}
export declare class Insula {
    private config;
    /** Current body state */
    private bodyState;
    /** Performance history (last N actions) */
    private performanceHistory;
    /** User state model */
    private userState;
    /** Maximum performance history size */
    private readonly HISTORY_SIZE;
    /** Energy decay rate per minute */
    private readonly ENERGY_DECAY_RATE;
    /** Fatigue accumulation rate per task */
    private readonly FATIGUE_RATE;
    /** Rest recovery rate per minute */
    private readonly RECOVERY_RATE;
    constructor(config: BrainConfig);
    /**
     * Assess current performance
     */
    assessPerformance(): PerformanceAssessment;
    /**
     * Calculate confidence based on performance consistency
     */
    private calculateConfidence;
    /**
     * Identify areas needing improvement
     */
    private identifyWeaknesses;
    /**
     * Identify strengths
     */
    private identifyStrengths;
    /**
     * Calculate performance trend
     */
    private calculateTrend;
    /**
     * Record a performance event
     */
    recordPerformance(success: boolean, taskType: string, duration: number): void;
    /**
     * Get current energy level
     */
    getEnergyLevel(): number;
    /**
     * Get current fatigue level
     */
    getFatigueLevel(): number;
    /**
     * Get current stress level
     */
    getStressLevel(): number;
    /**
     * Update body state
     */
    updateBodyState(metrics: Partial<BodyMetrics>): void;
    /**
     * Check if agent needs rest
     */
    needsRest(): boolean;
    /**
     * Simulate rest/recovery
     */
    rest(durationMinutes: number): void;
    /**
     * Update cognitive load
     */
    updateCognitiveLoad(load: number): void;
    /**
     * Get body state
     */
    getBodyState(): BodyMetrics;
    /**
     * Model user's mental/emotional state
     */
    modelUserState(context: {
        message: string;
        recentInteractions: number;
        userSuccessRate: number;
        timeOfDay: number;
    }): UserMentalState;
    /**
     * Detect user emotion from message
     */
    private detectUserEmotion;
    /**
     * Infer user goals from message
     */
    private inferUserGoals;
    /**
     * Detect user frustration
     */
    private detectFrustration;
    /**
     * Estimate user satisfaction
     */
    private estimateSatisfaction;
    /**
     * Predict user's next action
     */
    private predictUserAction;
    /**
     * Calculate confidence in user model
     */
    private calculateUserModelConfidence;
    /**
     * Generate empathetic response
     */
    generateEmpatheticResponse(userEmotion: UserMentalState['emotion']): EmpatheticResponse;
    /**
     * Get current user state model
     */
    getUserState(): UserMentalState;
    /**
     * Determine if self-regulation action is needed
     */
    regulateEmotion(currentEmotion: {
        valence: number;
        arousal: number;
    }): SelfRegulationAction;
    /**
     * Get current state for debugging
     */
    getState(): {
        bodyState: BodyMetrics;
        performanceHistorySize: number;
        recentSuccessRate: number;
        needsRest: boolean;
        userFrustration: number;
        userSatisfaction: number;
    };
}
//# sourceMappingURL=insula.d.ts.map