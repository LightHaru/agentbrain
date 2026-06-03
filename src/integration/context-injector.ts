/**
 * Brain Context Injector
 * 
 * Formats brain state into a compact, injectable prompt section.
 * Designed to add ~250-450 tokens of enriched context per turn.
 * 
 * Output format:
 * ```
 * ## AgentBrain Recall (auto-injected)
 * Use as private turn context. This context is already available; no AgentBrain tool call is required.
 * Current ask: ...
 * Turn: intent=action_request | topic=coding | urgency=medium | tone=neutral
 * ...
 * ```
 */

import { BrainContext, EmotionalState, Memory, MessageClassification } from '../index.js';
import { PersonalityTraits } from '../core/cingulate.js';
import { Skill, Habit } from '../core/cerebellum.js';
import { RelationshipState } from '../core/amygdala.js';
import { WorkingMemoryItem } from '../core/prefrontal.js';
import { PriorityEnforcer } from './priority-enforcer.js';

export interface InjectionContext {
  currentMessage?: string;
  classification: MessageClassification;
  emotionalState: EmotionalState;
  personality: PersonalityTraits;
  relationship: RelationshipState | null;
  relevantMemories: Memory[];
  graphContext?: string[];
  topSkills: Skill[];
  activeHabits: Habit[];
  workingMemory: WorkingMemoryItem[];
  rewardTrend: number;
  // Phase 5 additions
  lessonsContext?: string;
  styleDirectives?: string;
  suggestionsContext?: string;
}

export interface InjectionOptions {
  /** Maximum tokens budget (approximate, based on ~4 chars/token) */
  maxTokens: number;
  /** Include personality traits */
  includePersonality: boolean;
  /** Include emotional state */
  includeEmotions: boolean;
  /** Include memories */
  includeMemories: boolean;
  /** Include skills */
  includeSkills: boolean;
  /** Include working memory */
  includeWorkingMemory: boolean;
}

const DEFAULT_OPTIONS: InjectionOptions = {
  maxTokens: 450,
  includePersonality: true,
  includeEmotions: true,
  includeMemories: true,
  includeSkills: true,
  includeWorkingMemory: true,
};

export class ContextInjector {
  private enforcer: PriorityEnforcer;

  constructor(enforcer: PriorityEnforcer) {
    this.enforcer = enforcer;
  }

  /**
   * Generate the injectable brain context string
   */
  inject(context: InjectionContext, options: Partial<InjectionOptions> = {}): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const lines: string[] = [];

    lines.push('## AgentBrain Recall (auto-injected)');
    lines.push('Use as private turn context. This context is already available; no AgentBrain tool call is required.');

    if (context.currentMessage) {
      lines.push(`Current ask: ${this.shorten(context.currentMessage, 180)}`);
    }

    const turn = context.classification;
    lines.push(`Turn: intent=${turn.intent} | topic=${turn.topic} | urgency=${turn.urgency} | tone=${turn.emotionalTone}`);

    // Emotional state (compact)
    if (opts.includeEmotions) {
      const { mood, valence, arousal } = context.emotionalState;
      lines.push(`Mood: ${mood} | Valence: ${valence.toFixed(2)} | Arousal: ${arousal.toFixed(2)}`);
    }

    // Relationship (if exists)
    if (context.relationship) {
      const { depth, trustLevel } = context.relationship;
      lines.push(`Relationship: depth ${depth.toFixed(0)}/100, trust ${trustLevel.toFixed(0)}/100`);
    }

    // Personality highlights (only notable deviations from 50)
    if (opts.includePersonality) {
      const notable = this.getNotableTraits(context.personality);
      if (notable.length > 0) {
        lines.push(`Personality: ${notable.join(', ')}`);
      }
    }

    // Graph memory (entity/relationship context from AgentBrain's merged graph)
    if (opts.includeMemories && context.graphContext && context.graphContext.length > 0) {
      const graphContext = this.filterGraphContext(context.graphContext);
      lines.push('Graph memory:');
      for (const item of graphContext.slice(0, 8)) {
        lines.push(`  ${this.shorten(item, 120)}`);
      }
    }

    // Relevant memories (compact)
    if (opts.includeMemories && context.relevantMemories.length > 0) {
      lines.push('Relevant memories:');
      for (const mem of context.relevantMemories.slice(0, 4)) {
        const shortContent = this.shorten(mem.content, 120);
        lines.push(`  [${mem.type}] ${shortContent} (conf: ${mem.confidence.toFixed(2)})`);
      }
    }

    // Top skills
    if (opts.includeSkills && context.topSkills.length > 0) {
      const skillStr = context.topSkills
        .slice(0, 3)
        .map(s => `${s.name} (${s.proficiency})`)
        .join(', ');
      lines.push(`Top skills: ${skillStr}`);
    }

    // Active habits
    if (context.activeHabits.length > 0) {
      const habit = context.activeHabits[0]; // most relevant
      lines.push(`Active pattern: ${habit.pattern} (${(habit.confidence * 100).toFixed(0)}% confidence)`);
    }

    // Working memory
    if (opts.includeWorkingMemory && context.workingMemory.length > 0) {
      const wmStr = context.workingMemory
        .slice(0, 2)
        .map(w => w.content.slice(0, 60))
        .join('; ');
      lines.push(`Working memory: ${wmStr}`);
    }

    // Reward trend
    if (context.rewardTrend !== 0) {
      const trendLabel = context.rewardTrend > 0.3 ? 'positive'
        : context.rewardTrend < -0.3 ? 'needs_improvement'
        : 'neutral';
      lines.push(`Recent feedback trend: ${trendLabel} (${context.rewardTrend.toFixed(2)})`);
    }

    // Phase 5: Lessons from past corrections
    if (context.lessonsContext) {
      lines.push(context.lessonsContext);
    }

    // Phase 5: Style directives from personality influence
    if (context.styleDirectives) {
      lines.push(context.styleDirectives);
    }

    // Phase 5: Proactive suggestions
    if (context.suggestionsContext) {
      lines.push(context.suggestionsContext);
    }

    // Apply priority enforcement — filter out anything that conflicts with SOUL/AGENTS
    const filtered = this.enforcer.filterBrainContext(lines);

    // Token budget check (approximate: 4 chars ≈ 1 token)
    let result = filtered.join('\n');
    const approxTokens = result.length / 4;

    if (approxTokens > opts.maxTokens) {
      // Trim from bottom (memories first, then skills, then personality)
      result = this.trimToTokenBudget(filtered, opts.maxTokens);
    }

    return result;
  }

  private shorten(value: string, maxChars: number): string {
    const compact = value.replace(/\s+/g, ' ').trim();
    if (compact.length <= maxChars) return compact;
    return `${compact.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
  }

  private filterGraphContext(items: string[]): string[] {
    return items.filter(item => !/(^|\/|\s)memory-graph\.db\b|agent-memory-graph|plugin-memory-graph|@openclaw\/plugin-memory-graph/i.test(item));
  }

  /**
   * Get personality traits that deviate notably from baseline (50)
   */
  private getNotableTraits(personality: PersonalityTraits): string[] {
    const notable: string[] = [];
    const threshold = 15; // only show traits that deviate 15+ from baseline

    for (const [trait, value] of Object.entries(personality)) {
      const deviation = value - 50;
      if (Math.abs(deviation) >= threshold) {
        const direction = deviation > 0 ? '↑' : '↓';
        notable.push(`${trait}${direction}${value.toFixed(0)}`);
      }
    }

    return notable.slice(0, 4); // max 4 notable traits
  }

  /**
   * Trim content to fit within token budget
   */
  private trimToTokenBudget(lines: string[], maxTokens: number): string {
    const maxChars = maxTokens * 4;
    let result = '';

    for (const line of lines) {
      if ((result + line + '\n').length > maxChars) break;
      result += line + '\n';
    }

    return result.trim();
  }
}
