/**
 * Circadian Rhythm Module
 *
 * Provides timezone-aware circadian phase detection and alertness calculation.
 * Used by Insula and other modules to adjust behavior based on time of day.
 */
export interface CircadianPhase {
    phase: 'morning' | 'afternoon' | 'evening' | 'late-night' | 'deep-night';
    alertness: number;
    hour: number;
}
/**
 * Get circadian phase and alertness for a given hour in a timezone
 *
 * @param hour - Hour in 24h format (0-23) in the target timezone
 * @param timezone - IANA timezone (e.g., 'Asia/Ho_Chi_Minh')
 * @returns CircadianPhase with phase name and alertness level
 */
export declare function getCircadianPhase(hour: number, timezone?: string): CircadianPhase;
/**
 * Get current circadian phase for a timezone
 */
export declare function getCurrentCircadianPhase(timezone?: string): CircadianPhase;
/**
 * Check if it's a good time for intensive work
 */
export declare function isGoodWorkTime(hour: number, timezone?: string): boolean;
/**
 * Check if agent should suggest rest
 */
export declare function shouldSuggestRest(hour: number, timezone?: string): boolean;
//# sourceMappingURL=circadian.d.ts.map