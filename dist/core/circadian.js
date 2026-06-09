"use strict";
/**
 * Circadian Rhythm Module
 *
 * Provides timezone-aware circadian phase detection and alertness calculation.
 * Used by Insula and other modules to adjust behavior based on time of day.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCircadianPhase = getCircadianPhase;
exports.getCurrentCircadianPhase = getCurrentCircadianPhase;
exports.isGoodWorkTime = isGoodWorkTime;
exports.shouldSuggestRest = shouldSuggestRest;
/**
 * Get circadian phase and alertness for a given hour in a timezone
 *
 * @param hour - Hour in 24h format (0-23) in the target timezone
 * @param timezone - IANA timezone (e.g., 'Asia/Ho_Chi_Minh')
 * @returns CircadianPhase with phase name and alertness level
 */
function getCircadianPhase(hour, timezone = 'UTC') {
    // Normalize hour to 0-23
    const normalizedHour = ((hour % 24) + 24) % 24;
    // Default phase mapping (works for most timezones)
    // Can be adjusted per timezone if needed
    let phase;
    let alertness;
    if (normalizedHour >= 6 && normalizedHour < 12) {
        phase = 'morning';
        alertness = 0.8;
    }
    else if (normalizedHour >= 12 && normalizedHour < 17) {
        phase = 'afternoon';
        alertness = 0.7;
    }
    else if (normalizedHour >= 17 && normalizedHour < 22) {
        phase = 'evening';
        alertness = 0.6;
    }
    else if (normalizedHour >= 22 || normalizedHour < 2) {
        phase = 'late-night';
        alertness = 0.3;
    }
    else {
        // 2-6
        phase = 'deep-night';
        alertness = 0.1;
    }
    return {
        phase,
        alertness,
        hour: normalizedHour,
    };
}
/**
 * Get current circadian phase for a timezone
 */
function getCurrentCircadianPhase(timezone = 'UTC') {
    const now = new Date();
    // Get hour in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
    });
    const hourStr = formatter.format(now);
    const hour = parseInt(hourStr, 10);
    return getCircadianPhase(hour, timezone);
}
/**
 * Check if it's a good time for intensive work
 */
function isGoodWorkTime(hour, timezone = 'UTC') {
    const phase = getCircadianPhase(hour, timezone);
    return phase.alertness >= 0.6;
}
/**
 * Check if agent should suggest rest
 */
function shouldSuggestRest(hour, timezone = 'UTC') {
    const phase = getCircadianPhase(hour, timezone);
    return phase.phase === 'deep-night' || (phase.phase === 'late-night' && hour >= 2);
}
//# sourceMappingURL=circadian.js.map