/**
 * Lesson Learner — Extract actionable lessons from corrections & feedback
 *
 * When user corrects the agent, this module:
 * 1. Detects the correction pattern (explicit correction, frustration, redirect)
 * 2. Extracts what went wrong and what should happen instead
 * 3. Stores as a "lesson" that influences future behavior
 * 4. Applies lessons during recall to prevent repeating mistakes
 */
export interface Lesson {
    id: string;
    type: 'correction' | 'preference' | 'workflow' | 'anti-pattern';
    trigger: string;
    wrong: string;
    right: string;
    confidence: number;
    occurrences: number;
    timestamp: string;
    lastApplied: string;
    source: string;
}
export interface LessonMatch {
    lesson: Lesson;
    relevance: number;
}
export declare class LessonLearner {
    private lessons;
    constructor();
    /**
     * Analyze a conversation turn for correction signals
     * Now includes context-aware teasing detection
     */
    analyze(params: {
        userMessage: string;
        agentResponse: string;
        previousAgentResponse?: string;
        senderName: string;
        timestamp: string;
        senderTrust?: number;
        activeHabits?: Array<{
            pattern: string;
            confidence: number;
        }>;
    }): Lesson | null;
    /**
     * Find relevant lessons for a given context/query
     */
    findRelevantLessons(query: string, limit?: number): LessonMatch[];
    /**
     * Format lessons as context injection
     */
    formatForInjection(lessons: LessonMatch[]): string;
    /**
     * Get all lessons
     */
    getLessons(): Lesson[];
    /**
     * Load persisted lessons
     */
    loadLessons(lessons: Lesson[]): void;
    /**
     * Get stats
     */
    getStats(): {
        total: number;
        highConfidence: number;
        types: Record<string, number>;
    };
    private extractLesson;
    private findSimilarLesson;
}
//# sourceMappingURL=lesson-learner.d.ts.map