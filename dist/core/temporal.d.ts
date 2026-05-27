/**
 * Temporal Lobe — Language & Semantic Processing
 *
 * Like the brain's temporal lobe, this module handles:
 * - Language comprehension & generation
 * - Semantic memory (word meanings, concepts, relationships)
 * - Context management (conversation history, active topics)
 * - Multi-modal integration (text + audio + visual language)
 *
 * Key areas:
 * - Wernicke's area: Language comprehension
 * - Semantic memory: Concept relationships
 * - Context window: Active conversation state
 */
import { BrainConfig } from './config.js';
export interface SemanticRepresentation {
    /** Core concepts extracted from text */
    concepts: string[];
    /** Relationships between concepts */
    relations: Array<{
        from: string;
        to: string;
        type: 'is-a' | 'has-a' | 'related-to' | 'causes' | 'opposite-of';
        strength: number;
    }>;
    /** Overall sentiment (-1 to 1) */
    sentiment: number;
    /** Detected intent */
    intent: string;
    /** Confidence in this representation */
    confidence: number;
}
export interface ConceptNode {
    /** Concept name/identifier */
    name: string;
    /** Human-readable definition */
    definition: string;
    /** Related concepts with connection strength */
    relatedConcepts: Array<{
        concept: string;
        relationType: string;
        strength: number;
    }>;
    /** Example usages */
    examples: string[];
    /** Last time this concept was accessed */
    lastAccessed: number;
    /** How many times accessed (for importance) */
    accessCount: number;
    /** Emotional valence associated with this concept */
    emotionalValence: number;
}
export interface ContextWindow {
    /** Recent messages in conversation */
    messages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: number;
        concepts: string[];
    }>;
    /** Currently active concepts (mentioned recently) */
    activeConcepts: Map<string, number>;
    /** Current conversation topic */
    currentTopic: string;
    /** Previous topics in this conversation */
    topicHistory: Array<{
        topic: string;
        startTime: number;
        endTime: number;
    }>;
    /** Maximum messages to keep in window */
    windowSize: number;
}
export interface LanguagePattern {
    /** Pattern name */
    name: string;
    /** Regex or keyword pattern */
    pattern: RegExp | string[];
    /** What this pattern indicates */
    meaning: string;
    /** Confidence when matched */
    confidence: number;
}
export declare class TemporalLobe {
    private config;
    /** Semantic memory: concept graph */
    private semanticMemory;
    /** Current conversation context */
    private contextWindow;
    /** Language patterns for comprehension */
    private languagePatterns;
    /** Concept activation decay rate (per minute) */
    private readonly ACTIVATION_DECAY;
    /** Minimum activation to keep in active concepts */
    private readonly MIN_ACTIVATION;
    constructor(config: BrainConfig);
    /**
     * Comprehend incoming text and extract semantic representation
     */
    comprehend(text: string, context?: {
        role: string;
        timestamp: number;
    }): SemanticRepresentation;
    /**
     * Extract key concepts from text
     */
    private extractConcepts;
    /**
     * Detect relationships between concepts
     */
    private detectRelations;
    /**
     * Analyze sentiment of text
     */
    private analyzeSentiment;
    /**
     * Detect user intent
     */
    private detectIntent;
    /**
     * Calculate confidence in semantic representation
     */
    private calculateConfidence;
    /**
     * Get concept from semantic memory
     */
    getSemanticMemory(concept: string): ConceptNode | undefined;
    /**
     * Add or update concept in semantic memory
     */
    addConcept(concept: string, definition: string, examples?: string[]): void;
    /**
     * Link two concepts with a relationship
     */
    linkConcepts(concept1: string, concept2: string, relationType: string, strength?: number): void;
    /**
     * Activate concepts (increase activation level)
     */
    private activateConcepts;
    /**
     * Decay concept activation over time
     */
    decayActivation(minutesElapsed: number): void;
    /**
     * Update conversation context with new message
     */
    updateContext(message: ContextWindow['messages'][0]): void;
    /**
     * Get relevant context for a query
     */
    getRelevantContext(query: string): ContextWindow;
    /**
     * Get currently active concepts
     */
    getActiveConcepts(): string[];
    /**
     * Update current topic based on active concepts
     */
    private updateCurrentTopic;
    /**
     * Clear context window (start fresh conversation)
     */
    clearContext(): void;
    /**
     * Generate response based on intent and context
     * (This is a simple version; in production, integrate with LLM)
     */
    generateResponse(intent: string, context: ContextWindow): string;
    /**
     * Initialize basic language patterns
     */
    private initializeLanguagePatterns;
    /**
     * Initialize basic semantic concepts
     */
    private initializeBasicConcepts;
    /**
     * Get current state for debugging
     */
    getState(): {
        semanticMemorySize: number;
        activeConceptsCount: number;
        currentTopic: string;
        contextWindowSize: number;
        topActiveConcepts: string[];
    };
}
//# sourceMappingURL=temporal.d.ts.map