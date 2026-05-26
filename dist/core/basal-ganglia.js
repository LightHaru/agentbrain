"use strict";
/**
 * Basal Ganglia — Reward & Motivation System
 *
 * Like the brain's basal ganglia, this module handles:
 * - Processing reward signals from user feedback
 * - Reinforcing successful behaviors
 * - Reducing unsuccessful behaviors
 * - Motivation scoring: prioritize task types with high success history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasalGanglia = void 0;
class BasalGanglia {
    config;
    fileManager;
    rewardHistory = [];
    behaviorScores = new Map();
    motivationProfiles = new Map();
    constructor(config, fileManager) {
        this.config = config;
        this.fileManager = fileManager;
    }
    /**
     * Initialize: load reward history and behavior scores
     */
    async initialize() {
        const rewardContent = await this.fileManager.readFile('reward/feedback_log.md');
        if (rewardContent) {
            this.rewardHistory = this.parseRewardHistory(rewardContent);
        }
        // Rebuild motivation profiles from history
        this.rebuildMotivationProfiles();
        console.log(`[BasalGanglia] Initialized — ${this.rewardHistory.length} reward signals, ${this.motivationProfiles.size} profiles`);
    }
    /**
     * Process a reward signal (positive or negative feedback)
     */
    processReward(signal) {
        this.rewardHistory.push(signal);
        // Keep last 200 signals
        if (this.rewardHistory.length > 200) {
            this.rewardHistory = this.rewardHistory.slice(-200);
        }
        // Update behavior score for this task type
        this.updateBehaviorScore(signal);
        // Update motivation profile
        this.updateMotivationProfile(signal);
    }
    /**
     * Get motivation score for a task type (0-1)
     * Higher = agent should prioritize this type of work
     */
    getMotivation(taskType) {
        const profile = this.motivationProfiles.get(taskType);
        if (!profile)
            return 0.5; // neutral for unknown tasks
        return profile.motivation;
    }
    /**
     * Get all motivation profiles sorted by motivation
     */
    getMotivationRanking() {
        return [...this.motivationProfiles.values()]
            .sort((a, b) => b.motivation - a.motivation);
    }
    /**
     * Get behavior reinforcement score
     */
    getBehaviorScore(behavior) {
        return this.behaviorScores.get(behavior)?.reinforcement || 0;
    }
    /**
     * Get recent reward trend (-1 to 1)
     */
    getRecentTrend(lastN = 10) {
        const recent = this.rewardHistory.slice(-lastN);
        if (recent.length === 0)
            return 0;
        return recent.reduce((sum, r) => sum + r.signal, 0) / recent.length;
    }
    /**
     * Persist reward data
     */
    async persist() {
        await this.fileManager.writeFile('reward/feedback_log.md', this.formatRewardHistory());
        await this.fileManager.writeFile('reward/motivation_scores.md', this.formatMotivation());
        await this.fileManager.writeFile('reward/reinforcement.md', this.formatBehaviorScores());
    }
    // --- Internal ---
    updateBehaviorScore(signal) {
        const existing = this.behaviorScores.get(signal.taskType);
        if (existing) {
            // Exponential moving average
            const alpha = 0.3;
            existing.reinforcement = existing.reinforcement * (1 - alpha) + signal.signal * alpha;
            existing.sampleSize++;
            existing.lastUpdated = signal.timestamp;
        }
        else {
            this.behaviorScores.set(signal.taskType, {
                behavior: signal.taskType,
                reinforcement: signal.signal,
                sampleSize: 1,
                lastUpdated: signal.timestamp,
            });
        }
    }
    updateMotivationProfile(signal) {
        let profile = this.motivationProfiles.get(signal.taskType);
        if (!profile) {
            profile = {
                taskType: signal.taskType,
                motivation: 0.5,
                historicalSuccess: 0.5,
                recentFeedback: 0,
            };
        }
        // Update recent feedback (EMA)
        profile.recentFeedback = profile.recentFeedback * 0.7 + signal.signal * 0.3;
        // Historical success based on positive signals
        const typeSignals = this.rewardHistory.filter(r => r.taskType === signal.taskType);
        const positiveCount = typeSignals.filter(r => r.signal > 0).length;
        profile.historicalSuccess = typeSignals.length > 0 ? positiveCount / typeSignals.length : 0.5;
        // Motivation = weighted combo of historical success + recent feedback
        profile.motivation = Math.max(0, Math.min(1, profile.historicalSuccess * 0.6 + (profile.recentFeedback + 1) / 2 * 0.4));
        this.motivationProfiles.set(signal.taskType, profile);
    }
    rebuildMotivationProfiles() {
        const taskTypes = new Set(this.rewardHistory.map(r => r.taskType));
        for (const taskType of taskTypes) {
            const signals = this.rewardHistory.filter(r => r.taskType === taskType);
            const positiveCount = signals.filter(r => r.signal > 0).length;
            const recentSignals = signals.slice(-5);
            const recentFeedback = recentSignals.length > 0
                ? recentSignals.reduce((s, r) => s + r.signal, 0) / recentSignals.length
                : 0;
            const historicalSuccess = signals.length > 0 ? positiveCount / signals.length : 0.5;
            this.motivationProfiles.set(taskType, {
                taskType,
                motivation: Math.max(0, Math.min(1, historicalSuccess * 0.6 + (recentFeedback + 1) / 2 * 0.4)),
                historicalSuccess,
                recentFeedback,
            });
        }
    }
    // --- Formatting ---
    formatRewardHistory() {
        const recent = this.rewardHistory.slice(-50);
        let content = `# Reward Feedback Log
> Auto-managed by AgentBrain Basal Ganglia
> Last updated: ${new Date().toISOString()}
> Total signals: ${this.rewardHistory.length}

`;
        for (const signal of recent) {
            const emoji = signal.signal > 0 ? '✓' : signal.signal < 0 ? '✗' : '○';
            content += `${emoji} [${signal.timestamp}] ${signal.taskType}: ${signal.signal.toFixed(2)} (${signal.source}) — ${signal.context}\n`;
        }
        return content;
    }
    formatMotivation() {
        const sorted = [...this.motivationProfiles.values()].sort((a, b) => b.motivation - a.motivation);
        let content = `# Motivation Scores
> Auto-managed by AgentBrain Basal Ganglia
> Last updated: ${new Date().toISOString()}

`;
        for (const profile of sorted) {
            const bar = '█'.repeat(Math.round(profile.motivation * 20)) + '░'.repeat(20 - Math.round(profile.motivation * 20));
            content += `## ${profile.taskType}
- Motivation: ${bar} ${(profile.motivation * 100).toFixed(0)}%
- Historical success: ${(profile.historicalSuccess * 100).toFixed(0)}%
- Recent feedback: ${profile.recentFeedback.toFixed(2)}

`;
        }
        return content;
    }
    formatBehaviorScores() {
        let content = `# Behavior Reinforcement
> Auto-managed by AgentBrain Basal Ganglia
> Last updated: ${new Date().toISOString()}

`;
        for (const [, score] of this.behaviorScores) {
            const direction = score.reinforcement > 0 ? '↑ reinforce' : score.reinforcement < 0 ? '↓ reduce' : '→ neutral';
            content += `- ${score.behavior}: ${score.reinforcement.toFixed(3)} (${direction}, n=${score.sampleSize})\n`;
        }
        return content;
    }
    parseRewardHistory(content) {
        const signals = [];
        const lines = content.split('\n').filter(l => /^[✓✗○]/.test(l));
        for (const line of lines) {
            const match = line.match(/\[(.+?)\] (.+?): ([-\d.]+) \((\w+)\) — (.+)/);
            if (match) {
                signals.push({
                    timestamp: match[1],
                    taskType: match[2],
                    signal: parseFloat(match[3]),
                    source: match[4],
                    context: match[5],
                });
            }
        }
        return signals;
    }
}
exports.BasalGanglia = BasalGanglia;
//# sourceMappingURL=basal-ganglia.js.map