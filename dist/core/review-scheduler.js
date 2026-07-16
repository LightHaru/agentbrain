"use strict";
/**
 * ReviewScheduler - Automated Memory Review Scheduling
 *
 * Manages periodic and threshold-based memory reviews:
 * - Scheduled reviews (hourly, daily, weekly)
 * - Threshold-triggered reviews (memory count, activity level)
 * - Smart scheduling based on activity patterns
 *
 * Part of the auto-learning system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewScheduler = void 0;
exports.createDefaultScheduleConfig = createDefaultScheduleConfig;
// ============================================================================
// ReviewScheduler Class
// ============================================================================
class ReviewScheduler {
    reviewer;
    hippocampus;
    config;
    intervalId = null;
    thresholdCheckIntervalId = null;
    lastReviewTime = 0;
    memoriesAtLastReview = 0;
    isReviewing = false;
    constructor(reviewer, hippocampus, config) {
        this.reviewer = reviewer;
        this.hippocampus = hippocampus;
        this.config = config;
    }
    start() {
        if (this.config.enableScheduled) {
            this.startScheduledReviews();
        }
        if (this.config.enableThreshold) {
            this.startThresholdChecks();
        }
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.thresholdCheckIntervalId) {
            clearInterval(this.thresholdCheckIntervalId);
            this.thresholdCheckIntervalId = null;
        }
    }
    async triggerReview(scope) {
        if (this.isReviewing) {
            return;
        }
        this.isReviewing = true;
        try {
            const reviewScope = {
                type: scope?.type || 'recent',
                trigger: scope?.trigger || 'manual',
                timeWindow: scope?.timeWindow || this.config.intervalMs,
                topic: scope?.topic,
            };
            await this.reviewer.runReviewCycle(reviewScope);
            this.lastReviewTime = Date.now();
            this.memoriesAtLastReview = this.hippocampus.getStats().total;
        }
        finally {
            this.isReviewing = false;
        }
    }
    getStatus() {
        const stats = this.hippocampus.getStats();
        const now = Date.now();
        const hoursSinceReview = this.lastReviewTime > 0
            ? (now - this.lastReviewTime) / (1000 * 60 * 60)
            : Infinity;
        const nextReview = this.intervalId && this.lastReviewTime > 0
            ? new Date(this.lastReviewTime + this.config.intervalMs).toISOString()
            : null;
        return {
            active: this.intervalId !== null || this.thresholdCheckIntervalId !== null,
            lastReviewTime: this.lastReviewTime > 0 ? new Date(this.lastReviewTime).toISOString() : null,
            nextScheduledReview: nextReview,
            memoryCountSinceReview: stats.total - this.memoriesAtLastReview,
            hoursSinceReview: hoursSinceReview === Infinity ? 0 : hoursSinceReview,
        };
    }
    updateConfig(config) {
        Object.assign(this.config, config);
        this.stop();
        this.start();
    }
    startScheduledReviews() {
        this.intervalId = setInterval(async () => {
            if (this.shouldRunScheduledReview()) {
                await this.triggerReview({
                    type: 'recent',
                    trigger: 'scheduled',
                    timeWindow: this.config.intervalMs,
                });
            }
        }, this.config.intervalMs);
    }
    startThresholdChecks() {
        this.thresholdCheckIntervalId = setInterval(async () => {
            if (this.shouldRunThresholdReview()) {
                await this.triggerReview({
                    type: 'recent',
                    trigger: 'threshold',
                });
            }
        }, 5 * 60 * 1000);
    }
    shouldRunScheduledReview() {
        if (this.isReviewing)
            return false;
        if (this.config.enableSmartScheduling && this.config.preferLowActivityPeriods) {
            const hour = new Date().getHours();
            const isLowActivityPeriod = hour >= 2 && hour <= 6;
            if (!isLowActivityPeriod) {
                return false;
            }
        }
        return true;
    }
    shouldRunThresholdReview() {
        if (this.isReviewing)
            return false;
        const stats = this.hippocampus.getStats();
        const memoryCount = stats.total - this.memoriesAtLastReview;
        const hoursSince = this.lastReviewTime > 0
            ? (Date.now() - this.lastReviewTime) / (1000 * 60 * 60)
            : Infinity;
        if (memoryCount >= this.config.memoryCountThreshold) {
            return true;
        }
        if (hoursSince >= this.config.hoursSinceLastReview) {
            return true;
        }
        return false;
    }
}
exports.ReviewScheduler = ReviewScheduler;
function createDefaultScheduleConfig() {
    return {
        enableScheduled: true,
        intervalMs: 3600000,
        enableThreshold: true,
        memoryCountThreshold: 50,
        hoursSinceLastReview: 24,
        enableSmartScheduling: true,
        preferLowActivityPeriods: true,
    };
}
//# sourceMappingURL=review-scheduler.js.map