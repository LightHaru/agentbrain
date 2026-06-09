/**
 * Personality Influence — Translate personality traits into generation modifiers
 *
 * Instead of just injecting "warmth: 50" as text, this module:
 * 1. Maps trait values to concrete behavioral rules
 * 2. Generates context-aware style directives
 * 3. Adapts based on conversation state (time, mood, topic)
 * 4. Produces actionable prompt fragments that actually change output
 */
export interface PersonalityTraits {
    warmth: number;
    directness: number;
    humor: number;
    protectiveness: number;
    curiosity: number;
    assertiveness: number;
    [key: string]: number;
}
export interface ConversationState {
    timeOfDay: number;
    mood: string;
    valence: number;
    arousal: number;
    recentTopics: string[];
    interactionCount: number;
    trustLevel: number;
    lastUserSentiment: number;
}
export interface StyleDirective {
    instruction: string;
    priority: number;
    condition?: string;
}
export declare class PersonalityInfluence {
    private traits;
    private baseDirectives;
    constructor(traits: PersonalityTraits);
    /**
     * Update traits (e.g., after Cingulate adjusts personality)
     */
    updateTraits(traits: Partial<PersonalityTraits>): void;
    /**
     * Generate context-aware style directives for the current turn
     */
    generateDirectives(state: ConversationState): string;
    /**
     * Get current trait summary (for status display)
     */
    getTraitSummary(): string;
    private computeBaseDirectives;
    private formatDirectives;
}
//# sourceMappingURL=personality-influence.d.ts.map