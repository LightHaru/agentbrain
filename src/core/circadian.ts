/**
 * Circadian Rhythm Module
 * 
 * Provides timezone-aware circadian phase detection and alertness calculation.
 * Used by Insula and other modules to adjust behavior based on time of day.
 */

export interface CircadianPhase {
  phase: 'morning' | 'afternoon' | 'evening' | 'late-night' | 'deep-night';
  alertness: number; // 0-1
  hour: number; // 0-23
}

/**
 * Get circadian phase and alertness for a given hour in a timezone
 * 
 * @param hour - Hour in 24h format (0-23) in the target timezone
 * @param timezone - IANA timezone (e.g., 'Asia/Ho_Chi_Minh')
 * @returns CircadianPhase with phase name and alertness level
 */
export function getCircadianPhase(hour: number, timezone: string = 'UTC'): CircadianPhase {
  // Normalize hour to 0-23
  const normalizedHour = ((hour % 24) + 24) % 24;
  
  // Default phase mapping (works for most timezones)
  // Can be adjusted per timezone if needed
  let phase: CircadianPhase['phase'];
  let alertness: number;
  
  if (normalizedHour >= 6 && normalizedHour < 12) {
    phase = 'morning';
    alertness = 0.8;
  } else if (normalizedHour >= 12 && normalizedHour < 17) {
    phase = 'afternoon';
    alertness = 0.7;
  } else if (normalizedHour >= 17 && normalizedHour < 22) {
    phase = 'evening';
    alertness = 0.6;
  } else if (normalizedHour >= 22 || normalizedHour < 2) {
    phase = 'late-night';
    alertness = 0.3;
  } else {
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
export function getCurrentCircadianPhase(timezone: string = 'UTC'): CircadianPhase {
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
export function isGoodWorkTime(hour: number, timezone: string = 'UTC'): boolean {
  const phase = getCircadianPhase(hour, timezone);
  return phase.alertness >= 0.6;
}

/**
 * Check if agent should suggest rest
 */
export function shouldSuggestRest(hour: number, timezone: string = 'UTC'): boolean {
  const phase = getCircadianPhase(hour, timezone);
  return phase.phase === 'deep-night' || (phase.phase === 'late-night' && hour >= 2);
}
