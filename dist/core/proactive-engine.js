"use strict";
/**
 * Proactive Engine — Pattern-based action recommendations
 *
 * Observes user behavior patterns and proactively suggests:
 * - Routine actions at expected times
 * - Follow-ups on incomplete tasks
 * - Warnings based on detected patterns
 * - Opportunities based on context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProactiveEngine = void 0;
// ============================================================================
// Proactive Engine
// ============================================================================
class ProactiveEngine {
    patterns = [];
    actionLog = [];
    lastSuggestions = new Map(); // patternId → timestamp
    constructor() {
        // Built-in patterns
        this.patterns = this.getDefaultPatterns();
    }
    /**
     * Record a user action (for sequence/absence detection)
     */
    recordAction(action, timestamp) {
        this.actionLog.push({ action, timestamp });
        // Keep last 100 actions
        if (this.actionLog.length > 100) {
            this.actionLog = this.actionLog.slice(-100);
        }
    }
    /**
     * Check for triggered patterns and generate suggestions
     */
    checkTriggers(context) {
        const now = Date.now();
        const suggestions = [];
        for (const pattern of this.patterns) {
            if (pattern.confidence < 0.4)
                continue;
            // Check cooldown
            const lastTriggered = this.lastSuggestions.get(pattern.id) || 0;
            if (now - lastTriggered < pattern.cooldownMs)
                continue;
            // Check trigger
            const triggered = this.evaluateTrigger(pattern.trigger, context);
            if (!triggered)
                continue;
            suggestions.push({
                pattern,
                message: pattern.action,
                priority: pattern.confidence * (pattern.occurrences > 3 ? 1.0 : 0.7),
                expiresAt: new Date(now + pattern.cooldownMs).toISOString(),
            });
            this.lastSuggestions.set(pattern.id, now);
        }
        // Sort by priority
        suggestions.sort((a, b) => b.priority - a.priority);
        return suggestions.slice(0, 2); // Max 2 suggestions per check
    }
    /**
     * Learn a new pattern from observed behavior
     */
    learnPattern(params) {
        // Check if similar pattern exists
        const existing = this.patterns.find(p => p.description.toLowerCase() === params.description.toLowerCase());
        if (existing) {
            existing.occurrences++;
            existing.confidence = Math.min(1.0, existing.confidence + 0.05);
            return existing;
        }
        const pattern = {
            id: `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            type: params.type,
            description: params.description,
            trigger: params.trigger,
            action: params.action,
            confidence: 0.5,
            occurrences: 1,
            lastTriggered: new Date().toISOString(),
            cooldownMs: 4 * 60 * 60 * 1000, // 4 hours default cooldown
        };
        this.patterns.push(pattern);
        return pattern;
    }
    /**
     * Reinforce a pattern (user followed the suggestion)
     */
    reinforce(patternId) {
        const pattern = this.patterns.find(p => p.id === patternId);
        if (pattern) {
            pattern.confidence = Math.min(1.0, pattern.confidence + 0.1);
            pattern.occurrences++;
        }
    }
    /**
     * Weaken a pattern (user ignored/dismissed the suggestion)
     */
    weaken(patternId) {
        const pattern = this.patterns.find(p => p.id === patternId);
        if (pattern) {
            pattern.confidence = Math.max(0, pattern.confidence - 0.15);
        }
    }
    /**
     * Get all patterns
     */
    getPatterns() {
        return this.patterns;
    }
    /**
     * Load persisted patterns
     */
    loadPatterns(patterns) {
        // Merge with defaults (don't lose built-in patterns)
        const defaultIds = new Set(this.patterns.map(p => p.id));
        for (const p of patterns) {
            if (!defaultIds.has(p.id)) {
                this.patterns.push(p);
            }
            else {
                // Update existing with persisted state
                const existing = this.patterns.find(e => e.id === p.id);
                if (existing) {
                    existing.confidence = p.confidence;
                    existing.occurrences = p.occurrences;
                    existing.lastTriggered = p.lastTriggered;
                }
            }
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            total: this.patterns.length,
            active: this.patterns.filter(p => p.confidence >= 0.4).length,
            learned: this.patterns.filter(p => !p.id.startsWith('default-')).length,
        };
    }
    // ==========================================================================
    // Private
    // ==========================================================================
    evaluateTrigger(trigger, context) {
        switch (trigger.kind) {
            case 'time':
                return trigger.hours?.includes(context.currentHour) || false;
            case 'keyword': {
                const msgLower = context.lastMessage.toLowerCase();
                return trigger.keywords?.some(k => msgLower.includes(k.toLowerCase())) || false;
            }
            case 'sequence': {
                if (!trigger.afterActions || trigger.afterActions.length === 0)
                    return false;
                const recentActions = this.actionLog.slice(-5).map(a => a.action);
                return trigger.afterActions.every(a => recentActions.includes(a));
            }
            case 'absence': {
                if (!trigger.absenceAction || !trigger.absenceMs)
                    return false;
                const lastOccurrence = this.actionLog
                    .filter(a => a.action === trigger.absenceAction)
                    .pop();
                if (!lastOccurrence)
                    return true; // Never done = absence
                return Date.now() - new Date(lastOccurrence.timestamp).getTime() > trigger.absenceMs;
            }
            case 'threshold': {
                if (!trigger.metric || trigger.threshold === undefined || !context.metrics)
                    return false;
                const value = context.metrics[trigger.metric];
                if (value === undefined)
                    return false;
                return trigger.direction === 'above'
                    ? value > trigger.threshold
                    : value < trigger.threshold;
            }
            default:
                return false;
        }
    }
    getDefaultPatterns() {
        return [
            {
                id: 'default-check-miner',
                type: 'routine',
                description: 'User regularly checks miner status',
                trigger: { kind: 'time', hours: [8, 14, 20] },
                action: 'Sếp thường check miner lúc này. Miner status có thể đã thay đổi.',
                confidence: 0.6,
                occurrences: 5,
                lastTriggered: '',
                cooldownMs: 6 * 60 * 60 * 1000,
            },
            {
                id: 'default-late-night',
                type: 'risk',
                description: 'User active after 2AM',
                trigger: { kind: 'time', hours: [2, 3, 4, 5] },
                action: 'Sếp ơi, khuya rồi. Sức khỏe quan trọng hơn mọi thứ.',
                confidence: 0.9,
                occurrences: 10,
                lastTriggered: '',
                cooldownMs: 2 * 60 * 60 * 1000,
            },
            {
                id: 'default-hashrate-low',
                type: 'opportunity',
                description: 'Miner hashrate below expected',
                trigger: { kind: 'threshold', metric: 'hashrate_th', threshold: 15, direction: 'below' },
                action: 'Hashrate đang thấp hơn baseline 18 TH/s. Có thể thermal throttle hoặc driver issue.',
                confidence: 0.7,
                occurrences: 2,
                lastTriggered: '',
                cooldownMs: 4 * 60 * 60 * 1000,
            },
            {
                id: 'default-no-backup',
                type: 'routine',
                description: 'Daily memory backup reminder',
                trigger: { kind: 'absence', absenceAction: 'memory_backup', absenceMs: 24 * 60 * 60 * 1000 },
                action: 'Chưa backup memory hôm nay. Nên chạy backup để tránh mất data.',
                confidence: 0.5,
                occurrences: 1,
                lastTriggered: '',
                cooldownMs: 24 * 60 * 60 * 1000,
            },
        ];
    }
}
exports.ProactiveEngine = ProactiveEngine;
//# sourceMappingURL=proactive-engine.js.map