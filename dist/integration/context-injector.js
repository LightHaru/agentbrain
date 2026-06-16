"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextInjector = void 0;
const DEFAULT_OPTIONS = {
    maxTokens: 250,
    includePersonality: true,
    includeEmotions: true,
    includeMemories: true,
    includeSkills: true,
    includeWorkingMemory: true,
};
class ContextInjector {
    enforcer;
    constructor(enforcer) {
        this.enforcer = enforcer;
    }
    /**
     * Generate the injectable brain context string
     */
    inject(context, options = {}) {
        const opts = { ...DEFAULT_OPTIONS, ...options };
        const lines = [];
        lines.push('## Brain State (AgentBrain — auto-injected)');
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
        // Structured facts are kept compact and placed before long memories so exact
        // user-stated values survive token-budget trimming.
        if (context.factsContext) {
            lines.push(context.factsContext);
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
    /**
     * Get personality traits that deviate notably from baseline (50)
     */
    getNotableTraits(personality) {
        const notable = [];
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
    isLiveMarketReasoning(reasoningWhisper) {
        return Boolean(reasoningWhisper?.includes('Task detected: market-data'));
    }
    /**
     * Trim content to fit within token budget
     */
    trimToTokenBudget(lines, maxTokens) {
        const maxChars = maxTokens * 4;
        let result = '';
        for (const line of lines) {
            if ((result + line + '\n').length > maxChars)
                break;
            result += line + '\n';
        }
        return result.trim();
    }
}
exports.ContextInjector = ContextInjector;
//# sourceMappingURL=context-injector.js.map