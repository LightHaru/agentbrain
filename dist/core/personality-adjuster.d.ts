/**
 * Personality Adjuster — Learn Tone from Feedback
 *
 * Phase 5: Adjust personality traits based on reward trends
 * - Directness: response brevity preference
 * - Warmth: supportive vs neutral tone
 * - Assertiveness: when to "scold" or push back
 *
 * Anti-overfitting: max ±5 per adjustment, ±20 per week
 */
import { PersonalityTraits } from './cingulate.js';
export interface AdjustmentHistory {
    timestamp: string;
    trait: string;
    oldValue: number;
    newValue: number;
    reason: string;
}
export declare class PersonalityAdjuster {
    private adjustmentHistory;
    private weeklyChanges;
    /**
     * Adjust personality traits based on feedback patterns
     * Returns updated traits
     */
    adjust(current: PersonalityTraits, feedbackPatterns: {
        marker: string;
        frequency: number;
    }[]): PersonalityTraits;
    /**
     * Apply a change with constraints
     */
    private applyChange;
    /**
     * Get adjustment history for debugging
     */
    getHistory(lastN?: number): AdjustmentHistory[];
    /**
     * Prune weekly tracking older than 7 days
     */
    private pruneOldWeeklyChanges;
}
//# sourceMappingURL=personality-adjuster.d.ts.map