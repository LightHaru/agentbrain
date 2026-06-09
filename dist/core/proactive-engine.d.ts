/**
 * Proactive Engine — Pattern-based action recommendations
 *
 * Observes user behavior patterns and proactively suggests:
 * - Routine actions at expected times
 * - Follow-ups on incomplete tasks
 * - Warnings based on detected patterns
 * - Opportunities based on context
 */
export interface UserPattern {
    id: string;
    type: 'routine' | 'preference' | 'risk' | 'opportunity';
    description: string;
    trigger: PatternTrigger;
    action: string;
    confidence: number;
    occurrences: number;
    lastTriggered: string;
    cooldownMs: number;
}
export interface PatternTrigger {
    kind: 'time' | 'keyword' | 'sequence' | 'absence' | 'threshold';
    hours?: number[];
    keywords?: string[];
    afterActions?: string[];
    absenceAction?: string;
    absenceMs?: number;
    metric?: string;
    threshold?: number;
    direction?: 'above' | 'below';
}
export interface Suggestion {
    pattern: UserPattern;
    message: string;
    priority: number;
    expiresAt: string;
}
export declare class ProactiveEngine {
    private patterns;
    private actionLog;
    private lastSuggestions;
    constructor();
    /**
     * Record a user action (for sequence/absence detection)
     */
    recordAction(action: string, timestamp: string): void;
    /**
     * Check for triggered patterns and generate suggestions
     */
    checkTriggers(context: {
        currentHour: number;
        lastMessage: string;
        metrics?: Record<string, number>;
    }): Suggestion[];
    /**
     * Learn a new pattern from observed behavior
     */
    learnPattern(params: {
        type: UserPattern['type'];
        description: string;
        trigger: PatternTrigger;
        action: string;
    }): UserPattern;
    /**
     * Reinforce a pattern (user followed the suggestion)
     */
    reinforce(patternId: string): void;
    /**
     * Weaken a pattern (user ignored/dismissed the suggestion)
     */
    weaken(patternId: string): void;
    /**
     * Get all patterns
     */
    getPatterns(): UserPattern[];
    /**
     * Load persisted patterns
     */
    loadPatterns(patterns: UserPattern[]): void;
    /**
     * Get stats
     */
    getStats(): {
        total: number;
        active: number;
        learned: number;
    };
    private evaluateTrigger;
    private getDefaultPatterns;
}
//# sourceMappingURL=proactive-engine.d.ts.map