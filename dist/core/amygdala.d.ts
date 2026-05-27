/**
 * Amygdala — Emotional Processing & Safety System
 *
 * Like the brain's amygdala, this module handles:
 * - Detecting user emotional state from message tone
 * - Managing agent's own emotional state (mood persistence)
 * - Risk/threat detection (scam, danger, manipulation)
 * - Relationship tracking (attachment depth over time)
 * - Fight-or-flight: escalate critical threats immediately
 */
import { BrainConfig } from './config.js';
import { EmotionalState, MessageContext } from '../index.js';
import { BrainFileManager } from '../storage/md-writer.js';
export interface RelationshipState {
    userId: string;
    userName: string;
    depth: number;
    trustLevel: number;
    totalInteractions: number;
    positiveInteractions: number;
    negativeInteractions: number;
    lastInteraction: string;
    knownPreferences: string[];
    emotionalHistory: EmotionalSnapshot[];
}
export interface EmotionalSnapshot {
    timestamp: string;
    mood: string;
    valence: number;
    trigger: string;
}
export interface ThreatAssessment {
    isThreat: boolean;
    threatType: string | null;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    reason: string | null;
}
export declare class Amygdala {
    private config;
    private fileManager;
    private currentState;
    private relationships;
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    /**
     * Initialize: load emotional state and relationships from files
     */
    initialize(): Promise<void>;
    /**
     * Process incoming message: detect sentiment, assess threats, update state
     */
    process(context: MessageContext): {
        userSentiment: number;
        threat: ThreatAssessment;
        updatedState: EmotionalState;
    };
    /**
     * Detect user sentiment from message (-1 to 1)
     */
    detectSentiment(message: string): number;
    /**
     * Assess if message contains threats (scam, hack, danger)
     */
    assessThreat(message: string): ThreatAssessment;
    /**
     * Update agent's emotional state based on interaction
     */
    private updateEmotionalState;
    /**
     * Derive mood label from valence and arousal
     */
    private deriveMood;
    /**
     * Update relationship state with user
     */
    private updateRelationship;
    /**
     * Decay emotional state toward neutral (for heartbeat)
     */
    decayToward(target: string, amount: number): void;
    /**
     * Persist emotional state and relationships to files
     */
    persist(): Promise<void>;
    /**
     * Get current emotional state
     */
    getState(): EmotionalState;
    /**
     * Get relationship with a specific user
     */
    getRelationship(userId: string): RelationshipState | undefined;
    private formatEmotionalState;
    private formatRelationships;
    private parseEmotionalState;
    private parseRelationships;
}
//# sourceMappingURL=amygdala.d.ts.map