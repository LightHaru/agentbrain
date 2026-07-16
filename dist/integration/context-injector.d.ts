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
import { EmotionalState, Memory, MessageClassification } from '../index.js';
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
    feeling?: {
        label: string;
        intensity: number;
        valence: number;
        arousal: number;
    };
    /** Rich expression guidance so the felt emotion actually shows in Aira's voice. */
    expressionContext?: string;
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
export declare class ContextInjector {
    private enforcer;
    constructor(enforcer: PriorityEnforcer);
    /**
     * Generate the injectable brain context string
     */
    inject(context: InjectionContext, options?: Partial<InjectionOptions>): string;
    /**
     * Get personality traits that deviate notably from baseline (50)
     */
    private getNotableTraits;
    private isLiveMarketReasoning;
    /**
     * Trim content to fit within token budget
     */
    private trimToTokenBudget;
}
//# sourceMappingURL=context-injector.d.ts.map