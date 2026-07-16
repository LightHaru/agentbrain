"use strict";
/**
 * OutcomeTracker - Learn from Every Interaction
 *
 * Tracks outcomes of every brain turn to enable continuous self-improvement:
 * - Records success/failure of each interaction
 * - Analyzes which strategies and memories were most effective
 * - Adjusts future behavior based on feedback
 * - Generates meta-learnings about what works
 *
 * This is the core of the auto-learning loop.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomeTracker = void 0;
// ============================================================================
// OutcomeTracker Class
// ============================================================================
class OutcomeTracker {
    hippocampus;
    lessonLearner;
    feedbackAnalyzer;
    config;
    outcomes = [];
    metaLearnings = [];
    strategyWeights = new Map();
    pendingOutcomes = new Map();
    constructor(hippocampus, lessonLearner, feedbackAnalyzer, config) {
        this.hippocampus = hippocampus;
        this.lessonLearner = lessonLearner;
        this.feedbackAnalyzer = feedbackAnalyzer;
        this.config = config;
        this.initializeStrategyWeights();
    }
    startTurn(data) {
        const record = {
            ...data,
            timestamp: new Date().toISOString(),
            success: false,
            userFeedback: null,
            rewardSignal: 0,
            confidenceAccuracy: 0,
        };
        this.pendingOutcomes.set(data.turnId, record);
    }
    completeTurn(turnId, feedback) {
        const pending = this.pendingOutcomes.get(turnId);
        if (!pending)
            return;
        const reward = this.feedbackAnalyzer.toRewardSignal(feedback);
        const success = reward > 0 || feedback.sentiment === 'positive';
        const confidenceAccuracy = this.calculateConfidenceAccuracy(pending, success);
        pending.success = success;
        pending.userFeedback = feedback;
        pending.rewardSignal = reward;
        pending.confidenceAccuracy = confidenceAccuracy;
        this.outcomes.push(pending);
        this.pendingOutcomes.delete(turnId);
        this.extractImmediateLearnings(pending);
        if (this.outcomes.length > 500) {
            this.outcomes = this.outcomes.slice(-500);
        }
        if (this.outcomes.length % 20 === 0) {
            this.analyzeRecentOutcomes();
        }
    }
    recordOutcome(record) {
        this.outcomes.push(record);
        this.extractImmediateLearnings(record);
        if (this.outcomes.length > 500) {
            this.outcomes = this.outcomes.slice(-500);
        }
    }
    extractImmediateLearnings(record) {
        this.updateMemoryRelevance(record);
        this.updateStrategyWeights(record);
        if (record.success && record.rewardSignal > 0.5) {
            this.reinforceSuccessPatterns(record);
        }
    }
    updateMemoryRelevance(record) {
        // Memory relevance updates would happen here
    }
    updateStrategyWeights(record) {
        const delta = record.rewardSignal * 0.05;
        for (const strategy of record.strategiesApplied) {
            const current = this.strategyWeights.get(strategy) || 1.0;
            const updated = Math.max(0.1, Math.min(2.0, current + delta));
            this.strategyWeights.set(strategy, updated);
        }
    }
    reinforceSuccessPatterns(record) {
        if (record.strategiesApplied.length >= 2) {
            const pattern = record.strategiesApplied.sort().join('+');
            const current = this.strategyWeights.get(pattern) || 1.0;
            this.strategyWeights.set(pattern, current + 0.1);
        }
    }
    calculateConfidenceAccuracy(record, actualSuccess) {
        if (actualSuccess) {
            return record.confidenceLevel;
        }
        else {
            return 1 - record.confidenceLevel;
        }
    }
    analyzeRecentOutcomes() {
        const recent = this.outcomes.slice(-20);
        this.analyzeStrategyTrends(recent);
        this.analyzeMemoryEffectiveness(recent);
        this.detectPerformancePatterns(recent);
        this.generateMetaLearnings(recent);
    }
    analyzeStrategyTrends(recent) {
        const strategySuccess = new Map();
        for (const outcome of recent) {
            for (const strategy of outcome.strategiesApplied) {
                if (!strategySuccess.has(strategy)) {
                    strategySuccess.set(strategy, { success: 0, total: 0 });
                }
                const stats = strategySuccess.get(strategy);
                stats.total++;
                if (outcome.success)
                    stats.success++;
            }
        }
        for (const [strategy, stats] of strategySuccess.entries()) {
            const successRate = stats.success / stats.total;
            const current = this.strategyWeights.get(strategy) || 1.0;
            if (successRate < 0.3 && stats.total >= 5) {
                this.strategyWeights.set(strategy, current * 0.9);
            }
            else if (successRate > 0.8 && stats.total >= 5) {
                this.strategyWeights.set(strategy, Math.min(2.0, current * 1.1));
            }
        }
    }
    analyzeMemoryEffectiveness(recent) {
        // Memory type analysis would happen here
    }
    detectPerformancePatterns(recent) {
        const hourlyPerformance = new Map();
        for (const outcome of recent) {
            const hour = new Date(outcome.timestamp).getHours();
            if (!hourlyPerformance.has(hour)) {
                hourlyPerformance.set(hour, []);
            }
            hourlyPerformance.get(hour).push(outcome.rewardSignal);
        }
        let bestHour = -1;
        let bestScore = -Infinity;
        for (const [hour, rewards] of hourlyPerformance.entries()) {
            const avg = rewards.reduce((a, b) => a + b, 0) / rewards.length;
            if (avg > bestScore) {
                bestScore = avg;
                bestHour = hour;
            }
        }
        if (bestHour !== -1 && bestScore > 0.5) {
            this.metaLearnings.push({
                id: this.generateId(),
                type: 'timing-insight',
                title: `Peak performance around ${bestHour}:00`,
                description: `Recent data shows better outcomes around ${bestHour}:00 (avg reward: ${bestScore.toFixed(2)})`,
                confidence: 0.6,
                evidence: recent.map(o => o.turnId),
                timestamp: new Date().toISOString(),
                applied: false,
            });
        }
    }
    generateMetaLearnings(recent) {
        const strategyPerf = this.getStrategyPerformance();
        const bestStrategy = strategyPerf.reduce((best, s) => s.successRate > best.successRate ? s : best, strategyPerf[0]);
        if (bestStrategy && bestStrategy.successRate > 0.75 && bestStrategy.timesUsed >= 5) {
            this.metaLearnings.push({
                id: this.generateId(),
                type: 'strategy-insight',
                title: `Strategy "${bestStrategy.strategyName}" performing well`,
                description: `Success rate: ${(bestStrategy.successRate * 100).toFixed(0)}% over ${bestStrategy.timesUsed} uses`,
                confidence: 0.8,
                evidence: recent.filter(o => o.strategiesApplied.includes(bestStrategy.strategyName)).map(o => o.turnId),
                timestamp: new Date().toISOString(),
                applied: false,
            });
        }
        const fastResponses = recent.filter(o => o.responseTime < 2000);
        const slowResponses = recent.filter(o => o.responseTime > 5000);
        if (fastResponses.length >= 5) {
            const fastSuccess = fastResponses.filter(o => o.success).length / fastResponses.length;
            const slowSuccess = slowResponses.length > 0
                ? slowResponses.filter(o => o.success).length / slowResponses.length
                : 0;
            if (fastSuccess > slowSuccess + 0.2) {
                this.metaLearnings.push({
                    id: this.generateId(),
                    type: 'timing-insight',
                    title: 'Faster responses correlate with better outcomes',
                    description: `Fast responses (<2s): ${(fastSuccess * 100).toFixed(0)}% success. Consider more decisive responses.`,
                    confidence: 0.7,
                    evidence: fastResponses.map(o => o.turnId),
                    timestamp: new Date().toISOString(),
                    applied: false,
                });
            }
        }
        if (this.metaLearnings.length > 50) {
            this.metaLearnings = this.metaLearnings.slice(-50);
        }
    }
    initializeStrategyWeights() {
        const defaultStrategies = [
            'direct',
            'decompose',
            'research-first',
            'ask-help',
            'simplify',
            'recall-first',
            'reason-then-act',
        ];
        for (const strategy of defaultStrategies) {
            this.strategyWeights.set(strategy, 1.0);
        }
    }
    getStrategyWeight(strategy) {
        return this.strategyWeights.get(strategy) || 1.0;
    }
    getAllStrategyWeights() {
        return new Map(this.strategyWeights);
    }
    getStatistics() {
        const total = this.outcomes.length;
        if (total === 0) {
            return {
                totalTurns: 0,
                successRate: 0,
                avgReward: 0,
                avgResponseTime: 0,
                avgConfidenceAccuracy: 0,
                strategyPerformance: [],
                memoryTypePerformance: [],
                metaLearnings: [],
                recentTrend: 'stable',
            };
        }
        const successCount = this.outcomes.filter(o => o.success).length;
        const avgReward = this.outcomes.reduce((sum, o) => sum + o.rewardSignal, 0) / total;
        const avgResponseTime = this.outcomes.reduce((sum, o) => sum + o.responseTime, 0) / total;
        const avgConfAccuracy = this.outcomes.reduce((sum, o) => sum + o.confidenceAccuracy, 0) / total;
        return {
            totalTurns: total,
            successRate: successCount / total,
            avgReward,
            avgResponseTime,
            avgConfidenceAccuracy: avgConfAccuracy,
            strategyPerformance: this.getStrategyPerformance(),
            memoryTypePerformance: this.getMemoryTypePerformance(),
            metaLearnings: this.metaLearnings.slice(-10),
            recentTrend: this.detectTrend(),
        };
    }
    getStrategyPerformance() {
        const strategyStats = new Map();
        for (const outcome of this.outcomes) {
            for (const strategy of outcome.strategiesApplied) {
                if (!strategyStats.has(strategy)) {
                    strategyStats.set(strategy, { used: 0, success: 0, totalReward: 0, lastUsed: '' });
                }
                const stats = strategyStats.get(strategy);
                stats.used++;
                if (outcome.success)
                    stats.success++;
                stats.totalReward += outcome.rewardSignal;
                stats.lastUsed = outcome.timestamp;
            }
        }
        return Array.from(strategyStats.entries()).map(([name, stats]) => ({
            strategyName: name,
            timesUsed: stats.used,
            successCount: stats.success,
            failureCount: stats.used - stats.success,
            successRate: stats.success / stats.used,
            avgReward: stats.totalReward / stats.used,
            lastUsed: stats.lastUsed,
        }));
    }
    getMemoryTypePerformance() {
        return [];
    }
    detectTrend() {
        if (this.outcomes.length < 20)
            return 'stable';
        const recent = this.outcomes.slice(-10);
        const previous = this.outcomes.slice(-20, -10);
        const recentAvg = recent.reduce((sum, o) => sum + o.rewardSignal, 0) / recent.length;
        const previousAvg = previous.reduce((sum, o) => sum + o.rewardSignal, 0) / previous.length;
        const diff = recentAvg - previousAvg;
        if (diff > 0.1)
            return 'improving';
        if (diff < -0.1)
            return 'declining';
        return 'stable';
    }
    getRecentOutcomes(limit = 20) {
        return this.outcomes.slice(-limit);
    }
    getMetaLearnings() {
        return [...this.metaLearnings];
    }
    markMetaLearningApplied(learningId) {
        const learning = this.metaLearnings.find(l => l.id === learningId);
        if (learning) {
            learning.applied = true;
        }
    }
    generateId() {
        return `out-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
exports.OutcomeTracker = OutcomeTracker;
//# sourceMappingURL=outcome-tracker.js.map