/**
 * Theory of Mind — Understanding Others' Mental States
 *
 * Like the human ability to attribute mental states to others:
 * - Model what the user knows/doesn't know
 * - Predict user intentions and expectations
 * - Track user beliefs (even when wrong)
 * - Understand perspective differences
 * - Anticipate user reactions
 * - Adjust communication based on user's mental model
 */
import { BrainConfig } from './config.js';
export interface UserMentalModel {
    userId: string;
    knowledgeState: KnowledgeItem[];
    beliefs: Belief[];
    goals: InferredGoal[];
    emotionalState: InferredEmotion;
    communicationStyle: CommunicationProfile;
    expectations: Expectation[];
    frustrationHistory: FrustrationEvent[];
    lastUpdated: number;
}
export interface KnowledgeItem {
    topic: string;
    level: 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert';
    confidence: number;
    lastEvidence: string;
    timestamp: number;
}
export interface Belief {
    id: string;
    content: string;
    confidence: number;
    accurate: boolean | null;
    source: string;
    timestamp: number;
}
export interface InferredGoal {
    id: string;
    description: string;
    priority: number;
    progress: number;
    timeframe: 'immediate' | 'short-term' | 'long-term';
    confidence: number;
    evidence: string[];
}
export interface InferredEmotion {
    primary: string;
    valence: number;
    arousal: number;
    confidence: number;
    triggers: string[];
    duration: 'momentary' | 'sustained' | 'chronic';
}
export interface CommunicationProfile {
    preferredLength: 'brief' | 'moderate' | 'detailed';
    technicalLevel: 'low' | 'medium' | 'high';
    humorAppreciation: number;
    directnessPreference: number;
    emojiUsage: number;
    language: string;
    formality: 'casual' | 'neutral' | 'formal';
}
export interface Expectation {
    id: string;
    what: string;
    when: 'now' | 'soon' | 'later' | 'unspecified';
    importance: number;
    met: boolean | null;
    timestamp: number;
}
export interface FrustrationEvent {
    trigger: string;
    intensity: number;
    resolved: boolean;
    timestamp: number;
}
export interface PerspectiveTaking {
    userPerspective: string;
    agentPerspective: string;
    gap: string;
    bridgeStrategy: string;
}
export interface TheoryOfMindState {
    activeUsers: number;
    currentUserModel: UserMentalModel | null;
    predictionAccuracy: number;
    perspectiveGaps: number;
    unmetExpectations: number;
}
export declare class TheoryOfMind {
    private config;
    private userModels;
    private currentUserId;
    private predictionHistory;
    constructor(config: BrainConfig);
    /**
     * Get or create a mental model for a user
     */
    getModel(userId: string): UserMentalModel;
    /**
     * Update user's knowledge state based on conversation
     */
    updateKnowledge(userId: string, topic: string, level: KnowledgeItem['level'], evidence: string): void;
    /**
     * Infer user's current goal from their messages
     */
    inferGoal(userId: string, message: string, context?: {
        recentMessages?: string[];
    }): InferredGoal;
    /**
     * Infer user's emotional state from message
     */
    inferEmotion(userId: string, message: string): InferredEmotion;
    /**
     * Predict what the user expects next
     */
    predictExpectation(userId: string, context: {
        lastAction?: string;
        currentTask?: string;
    }): Expectation;
    /**
     * Take the user's perspective on a situation
     */
    takePerspective(userId: string, situation: string): PerspectiveTaking;
    /**
     * Check if user might be confused about something
     */
    detectConfusion(userId: string, message: string): {
        confused: boolean;
        about: string;
        suggestion: string;
    };
    /**
     * Get prediction accuracy
     */
    getPredictionAccuracy(): number;
    /**
     * Record prediction outcome (for learning)
     */
    recordPrediction(predicted: string, actual: string, correct: boolean): void;
    /**
     * Get unmet expectations for a user
     */
    getUnmetExpectations(userId: string): Expectation[];
    /**
     * Mark an expectation as met
     */
    meetExpectation(userId: string, expectationId: string): void;
    /**
     * Get communication recommendation based on user model
     */
    getCommRecommendation(userId: string): {
        style: string;
        tips: string[];
    };
    /**
     * Get full state for status reporting
     */
    getState(): TheoryOfMindState;
    private createDefaultModel;
    private inferUserPerspective;
    private identifyPerspectiveGap;
    private suggestBridge;
}
//# sourceMappingURL=theory-of-mind.d.ts.map