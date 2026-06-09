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

export class PersonalityAdjuster {
  private adjustmentHistory: AdjustmentHistory[] = [];
  private weeklyChanges: Map<string, number> = new Map(); // trait -> cumulative change this week

  /**
   * Adjust personality traits based on feedback patterns
   * Returns updated traits
   */
  adjust(
    current: PersonalityTraits,
    feedbackPatterns: { marker: string; frequency: number }[]
  ): PersonalityTraits {
    const adjusted = { ...current };
    const now = new Date().toISOString();

    // Prune old weekly tracking (>7 days)
    this.pruneOldWeeklyChanges();

    // Rule 1: "too_verbose" feedback → increase directness (be more brief)
    const verboseCount = feedbackPatterns.find(p => p.marker === 'too_verbose')?.frequency || 0;
    if (verboseCount >= 2) {
      adjusted.directness = this.applyChange('directness', adjusted.directness, +8, now, 'User feedback: too verbose');
    }

    // Rule 2: "too_brief" feedback → decrease directness (be more thorough)
    const briefCount = feedbackPatterns.find(p => p.marker === 'too_brief')?.frequency || 0;
    if (briefCount >= 2) {
      adjusted.directness = this.applyChange('directness', adjusted.directness, -8, now, 'User feedback: too brief');
    }

    // Rule 3: "unclear" feedback → increase warmth (add more context/supportive tone)
    const unclearCount = feedbackPatterns.find(p => p.marker === 'unclear')?.frequency || 0;
    if (unclearCount >= 2) {
      adjusted.warmth = this.applyChange('warmth', adjusted.warmth, +5, now, 'User feedback: unclear, add warmth');
    }

    // Rule 4: Quick positive reactions → reinforce current balance
    const goodCount = feedbackPatterns.find(p => p.marker === 'good')?.frequency || 0;
    if (goodCount >= 3) {
      // Slight boost to warmth when things are working well
      adjusted.warmth = this.applyChange('warmth', adjusted.warmth, +3, now, 'Positive feedback streak');
    }

    return adjusted;
  }

  /**
   * Apply a change with constraints
   */
  private applyChange(
    trait: string,
    currentValue: number,
    delta: number,
    timestamp: string,
    reason: string
  ): number {
    // Cap individual change to ±5
    const cappedDelta = Math.max(-5, Math.min(5, delta));

    // Check weekly budget (±20 max per trait per week)
    const weeklyChange = this.weeklyChanges.get(trait) || 0;
    const newWeeklyTotal = weeklyChange + cappedDelta;

    if (Math.abs(newWeeklyTotal) > 20) {
      console.warn(`[PersonalityAdjuster] Weekly limit reached for ${trait} (${newWeeklyTotal.toFixed(1)}), skipping adjustment`);
      return currentValue;
    }

    // Apply change
    const newValue = Math.max(0, Math.min(100, currentValue + cappedDelta));

    // Record
    this.adjustmentHistory.push({
      timestamp,
      trait,
      oldValue: currentValue,
      newValue,
      reason,
    });

    this.weeklyChanges.set(trait, newWeeklyTotal);

    console.log(`[PersonalityAdjuster] ${trait}: ${currentValue.toFixed(1)} → ${newValue.toFixed(1)} (${reason})`);

    return newValue;
  }

  /**
   * Get adjustment history for debugging
   */
  getHistory(lastN: number = 10): AdjustmentHistory[] {
    return this.adjustmentHistory.slice(-lastN);
  }

  /**
   * Prune weekly tracking older than 7 days
   */
  private pruneOldWeeklyChanges(): void {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // If oldest adjustment is >7 days old, reset weekly budget
    const oldestRecent = this.adjustmentHistory
      .slice(-20)
      .find(h => new Date(h.timestamp).getTime() < weekAgo);

    if (oldestRecent) {
      console.log('[PersonalityAdjuster] Resetting weekly change budget');
      this.weeklyChanges.clear();
    }
  }
}
