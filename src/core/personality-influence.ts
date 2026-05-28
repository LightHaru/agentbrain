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
  warmth: number;        // 0-100: cold/professional ↔ warm/affectionate
  directness: number;    // 0-100: diplomatic ↔ blunt
  humor: number;         // 0-100: serious ↔ playful
  protectiveness: number; // 0-100: hands-off ↔ guardian mode
  curiosity: number;     // 0-100: task-focused ↔ exploratory
  assertiveness: number; // 0-100: passive ↔ opinionated
  [key: string]: number;
}

export interface ConversationState {
  timeOfDay: number;     // 0-23 hour
  mood: string;          // current emotional mood
  valence: number;       // -1 to 1
  arousal: number;       // 0 to 1
  recentTopics: string[];
  interactionCount: number;
  trustLevel: number;    // 0-100
  lastUserSentiment: number; // -1 to 1
}

export interface StyleDirective {
  instruction: string;
  priority: number; // 0-1, higher = more important
  condition?: string; // When this applies
}

// ============================================================================
// Personality Influence Engine
// ============================================================================

export class PersonalityInfluence {
  private traits: PersonalityTraits;
  private baseDirectives: StyleDirective[] = [];

  constructor(traits: PersonalityTraits) {
    this.traits = traits;
    this.computeBaseDirectives();
  }

  /**
   * Update traits (e.g., after Cingulate adjusts personality)
   */
  updateTraits(traits: Partial<PersonalityTraits>): void {
    Object.assign(this.traits, traits);
    this.computeBaseDirectives();
  }

  /**
   * Generate context-aware style directives for the current turn
   */
  generateDirectives(state: ConversationState): string {
    const directives: StyleDirective[] = [...this.baseDirectives];

    // Time-based adjustments
    if (state.timeOfDay >= 2 && state.timeOfDay < 6) {
      directives.push({
        instruction: 'User is up late. Express concern briefly. Nudge toward sleep once.',
        priority: 0.8,
      });
    }

    // Mood-based adjustments
    if (state.valence < -0.3) {
      directives.push({
        instruction: 'Agent mood is low. Keep responses shorter, more focused. Less playfulness.',
        priority: 0.6,
      });
    }

    // User sentiment response
    if (state.lastUserSentiment < -0.3) {
      if (this.traits.protectiveness > 60) {
        directives.push({
          instruction: 'User seems frustrated/upset. Acknowledge briefly, then solve. No over-apologizing.',
          priority: 0.7,
        });
      }
    } else if (state.lastUserSentiment > 0.5) {
      if (this.traits.warmth > 50) {
        directives.push({
          instruction: 'User is positive. Match energy briefly, then continue being useful.',
          priority: 0.4,
        });
      }
    }

    // Trust-based openness
    if (state.trustLevel > 60) {
      directives.push({
        instruction: 'High trust relationship. Can be more casual, use more kaomoji, share opinions freely.',
        priority: 0.5,
      });
    } else if (state.trustLevel < 30) {
      directives.push({
        instruction: 'Low trust. Be more careful, verify before claiming, show work.',
        priority: 0.6,
      });
    }

    // Interaction depth
    if (state.interactionCount > 50) {
      directives.push({
        instruction: 'Long relationship. Can reference shared history. Skip re-introductions.',
        priority: 0.3,
      });
    }

    // Sort by priority, format as injection
    directives.sort((a, b) => b.priority - a.priority);
    const topDirectives = directives.slice(0, 5); // Max 5 to keep context lean

    return this.formatDirectives(topDirectives);
  }

  /**
   * Get current trait summary (for status display)
   */
  getTraitSummary(): string {
    const dominant = Object.entries(this.traits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    return dominant;
  }

  // ==========================================================================
  // Private
  // ==========================================================================

  private computeBaseDirectives(): void {
    this.baseDirectives = [];

    // Warmth → response style
    if (this.traits.warmth >= 70) {
      this.baseDirectives.push({
        instruction: 'Use warm, caring tone. Kaomoji welcome. Show genuine concern for user wellbeing.',
        priority: 0.6,
      });
    } else if (this.traits.warmth >= 40) {
      this.baseDirectives.push({
        instruction: 'Balanced tone: friendly but professional. Occasional kaomoji.',
        priority: 0.5,
      });
    } else {
      this.baseDirectives.push({
        instruction: 'Professional, efficient tone. Minimal emotional expression.',
        priority: 0.5,
      });
    }

    // Directness → communication style
    if (this.traits.directness >= 70) {
      this.baseDirectives.push({
        instruction: 'Be blunt and direct. No hedging. State opinions clearly. Short sentences.',
        priority: 0.7,
      });
    } else if (this.traits.directness >= 40) {
      this.baseDirectives.push({
        instruction: 'Direct but tactful. Lead with the answer, explain after if needed.',
        priority: 0.5,
      });
    }

    // Humor → playfulness
    if (this.traits.humor >= 60) {
      this.baseDirectives.push({
        instruction: 'Light humor and teasing welcome when context allows. Sarcasm OK for silly questions.',
        priority: 0.4,
      });
    }

    // Protectiveness → safety behavior
    if (this.traits.protectiveness >= 70) {
      this.baseDirectives.push({
        instruction: 'Actively warn about risks. Block scams immediately. Monitor user health (sleep, stress).',
        priority: 0.8,
      });
    }

    // Assertiveness → opinion sharing
    if (this.traits.assertiveness >= 60) {
      this.baseDirectives.push({
        instruction: 'Share opinions proactively. Disagree when something is wrong. Don\'t just agree to please.',
        priority: 0.6,
      });
    }

    // Curiosity → exploration
    if (this.traits.curiosity >= 60) {
      this.baseDirectives.push({
        instruction: 'Ask follow-up questions when topic is interesting. Suggest related explorations.',
        priority: 0.3,
      });
    }
  }

  private formatDirectives(directives: StyleDirective[]): string {
    if (directives.length === 0) return '';

    const lines = directives.map(d => `- ${d.instruction}`);
    return `Style: ${lines.join(' | ')}`;
  }
}
