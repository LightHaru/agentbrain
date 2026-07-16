/**
 * Brain Context Injector
 * 
 * Formats brain state into a compact, injectable prompt section.
 * Designed to add ~150-250 tokens of enriched context per turn.
 * 
 * Output format:
 * ```
 * ## Brain State (AgentBrain — auto-injected)
 * - Mood: content | Valence: 0.3 | Arousal: 0.2
 * - Relationship: depth 45/100, trust 72/100
 * - Top skills: research (85), crypto-analysis (70)
 * - Recent habit: Sếp hay hỏi crypto buổi trưa
 * - Relevant memories: [max 5 items]
 * ```
 */

import { BrainContext, EmotionalState, Memory, MessageClassification } from '../index.js';
import { PersonalityTraits } from '../core/cingulate.js';
import { Skill, Habit } from '../core/cerebellum.js';
import { RelationshipState } from '../core/amygdala.js';
import { WorkingMemoryItem } from '../core/prefrontal.js';
import { PriorityEnforcer } from './priority-enforcer.js';

export interface InjectionContext {
  classification: MessageClassification;
  emotionalState: EmotionalState;
  personality: PersonalityTraits;
  relationship: RelationshipState | null;
  relevantMemories: Memory[];
  topSkills: Skill[];
  activeHabits: Habit[];
  workingMemory: WorkingMemoryItem[];
  rewardTrend: number;
  feeling?: { label: string; intensity: number; valence: number; arousal: number };
  /** Rich expression guidance so the felt emotion actually shows in Aira's voice. */
  expressionContext?: string;
  // Phase 5 additions
  lessonsContext?: string;
  styleDirectives?: string;
  suggestionsContext?: string;
  factsContext?: string;
  /** Memory-graph bridge facts: knowledge connected across links (multi-hop). */
  graphContext?: string;
  /** Reminders that a fact changed (old → new) so Aira never quotes stale values. */
  factChangeContext?: string;
  /** Learned insights (đúc kết kinh nghiệm) surfaced automatically. */
  insightsContext?: string;
  /** Reminders of past mistakes + fixes relevant to this task. */
  errorContext?: string;
  /** Recent + relevant past conversation so Aira keeps context. */
  convContext?: string;
  /** Distilled knowledge retrieved by semantic search for this message. */
  knowledgeContext?: string;
  // Phase 6: Reasoning Whisper
  reasoningWhisper?: string;
  /** Search-first directive: force/encourage live web search before answering. */
  searchDirective?: string;
  /** Relevance-critic output: memory conflicts + weak-recall warnings. */
  criticContext?: string;
  /** Freshness guard: warns that recalled volatile (price/market) data is stale. */
  freshnessContext?: string;
  /** Source verifier: force identity + multi-source verification for named entities. */
  verifyContext?: string;
  /** Time awareness: current time/buổi/ngày/lễ + message-timing & gap inference. */
  timeContext?: string;
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
  maxTokens: 250,
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

    lines.push('## Brain State (AgentBrain — auto-injected)');

    // Time awareness comes first: like a person, Aira should always know what
    // time/day it is and when the message arrived before anything else.
    if (context.timeContext) {
      lines.push(context.timeContext);
    }

    // Search-first directive is the HIGHEST-priority hint: if a query needs
    // fresh/external evidence, tell Aira to search before answering from memory.
    if (context.searchDirective) {
      lines.push(context.searchDirective);
    }

    // Freshness/TTL guard: recalled price/market data older than its TTL must
    // not be reused — warn Aira and it will re-search for a live number.
    if (context.freshnessContext) {
      lines.push(context.freshnessContext);
    }

    // Fact-change reminders are correctness-critical: a stale value is worse
    // than a missing one, so warn Aira EARLY (survives token-budget trimming).
    if (context.factChangeContext) {
      lines.push(context.factChangeContext);
    }

    // Structured facts (exact user-stated values) — placed early so they survive
    // trimming before long, lower-value blocks.
    if (context.factsContext) {
      lines.push(context.factsContext);
    }

    // Graph "bridge" facts: knowledge connected across links (multi-hop) so
    // Aira can reason across relationships, not just isolated facts.
    if (context.graphContext) {
      lines.push(context.graphContext);
    }

    // Source-identity verification: for named/ambiguous entities (tokens,
    // projects, people) force Aira to confirm identity across multiple sources
    // before quoting data — a name/ticker match is not identity.
    if (context.verifyContext) {
      lines.push(context.verifyContext);
    }

    // Phase 4: Status-check hint (inject early for high visibility)
    if (context.classification.topic === 'status-check') {
      lines.push('⚡ Status-check query detected: keep reply brief (≤3 sentences), focus on current state + blockers + ETA.');
    }

    // Emotional state (compact)
    if (opts.includeEmotions) {
      const { mood, valence, arousal } = context.emotionalState;
      lines.push(`Mood: ${mood} | Valence: ${valence.toFixed(2)} | Arousal: ${arousal.toFixed(2)}`);
      if (context.feeling && context.feeling.intensity >= 0.25) {
        const f = context.feeling;
        lines.push(`Feeling: ${f.label} (intensity ${f.intensity.toFixed(2)})`);
      }
      // Expression guidance: HOW to voice the current emotion (mood word,
      // varied kaomoji, tone, energy, verbal tics). This is what stops Aira
      // from sounding like a flat bot regardless of how the brain feels.
      if (context.expressionContext) {
        lines.push(context.expressionContext);
      }
    }

    // Relationship (if exists)
    if (context.relationship) {
      const { depth, trustLevel } = context.relationship;
      lines.push(`Relationship: depth ${depth.toFixed(0)}/100, trust ${trustLevel.toFixed(0)}/100`);
    }

    // Conversation continuity — recent + relevant past chat (high priority so
    // Aira keeps context; placed early to survive token-budget trimming).
    if (context.convContext) {
      lines.push(context.convContext);
    }

    // Personality highlights (only notable deviations from 50)
    if (opts.includePersonality) {
      const notable = this.getNotableTraits(context.personality);
      if (notable.length > 0) {
        lines.push(`Personality: ${notable.join(', ')}`);
      }
    }

    // Phase 6: Reasoning Whisper is high-priority private support for Aira.
    if (context.reasoningWhisper) {
      lines.push(context.reasoningWhisper);
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


    // Learned insights — the brain's distilled experience.
    if (context.insightsContext) {
      lines.push(context.insightsContext);
    }

    // Retrieved distilled knowledge (RAG over the KnowledgeStore).
    if (context.knowledgeContext) {
      lines.push(context.knowledgeContext);
    }

    // Past-mistake reminders (learn-from-errors memory) — high value, keep early.
    if (context.errorContext) {
      lines.push(context.errorContext);
    }


    // Relevant memories (compact) - limit is applied by Hippocampus based on query intent
    if (opts.includeMemories && context.relevantMemories.length > 0) {
      if (this.isLiveMarketReasoning(context.reasoningWhisper)) {
        lines.push('Memory policy: memories are routing hints only; live price, venue, liquidity, and volume require current source evidence.');
      }
      lines.push('Relevant memories:');
      for (const mem of context.relevantMemories) {
        const shortContent = mem.content.slice(0, 80);
        lines.push(`  [${mem.type}] ${shortContent} (conf: ${mem.confidence.toFixed(2)})`);
      }
    }

    // Relevance-critic: surface memory conflicts + weak-recall warnings so Aira
    // does not silently blend contradictory or stale memories.
    if (context.criticContext) {
      lines.push(context.criticContext);
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
      // Trim lower-value blocks, but never drop high-priority correctness
      // support. The Reasoning Whisper carries a11y/design/verification guidance
      // and MUST reach the model, so it is reserved and protected from trimming.
      const protectedLines = [
        context.reasoningWhisper,
        context.searchDirective,
        context.freshnessContext,
        context.factChangeContext,
      ].filter((l): l is string => Boolean(l));
      result = this.trimToTokenBudget(filtered, opts.maxTokens, protectedLines);
    }

    return result;
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

  private isLiveMarketReasoning(reasoningWhisper?: string): boolean {
    return Boolean(reasoningWhisper?.includes('Task detected: market-data'));
  }

  /**
   * Trim content to fit within token budget
   */
  private trimToTokenBudget(
    lines: string[],
    maxTokens: number,
    protectedLines: string[] = []
  ): string {
    const maxChars = maxTokens * 4;
    const protectedSet = new Set(protectedLines.filter(Boolean));

    // Reserve space up-front for protected blocks so lower-priority content
    // above them in the ordering can never starve them out of the budget.
    let reserved = 0;
    for (const p of protectedSet) {
      reserved += p.length + 1;
    }
    const budget = Math.max(0, maxChars - reserved);

    const kept: string[] = [];
    let used = 0;
    for (const line of lines) {
      if (protectedSet.has(line)) {
        // Always keep protected lines in their original position (already reserved).
        kept.push(line);
        continue;
      }
      if (used + line.length + 1 > budget) {
        // Skip this block but keep scanning: a later, smaller block (or a
        // protected block) may still fit / must still be kept.
        continue;
      }
      kept.push(line);
      used += line.length + 1;
    }

    return kept.join('\n').trim();
  }
}
