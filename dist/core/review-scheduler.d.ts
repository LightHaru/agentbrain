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
import { MemoryReviewer, ReviewScope } from './memory-reviewer.js';
import { Hippocampus } from './hippocampus.js';
export interface ScheduleConfig {
    enableScheduled: boolean;
    intervalMs: number;
    enableThreshold: boolean;
    memoryCountThreshold: number;
    hoursSinceLastReview: number;
    enableSmartScheduling: boolean;
    preferLowActivityPeriods: boolean;
}
export interface ScheduleStatus {
    active: boolean;
    lastReviewTime: string | null;
    nextScheduledReview: string | null;
    memoryCountSinceReview: number;
    hoursSinceReview: number;
}
export declare class ReviewScheduler {
    private reviewer;
    private hippocampus;
    private config;
    private intervalId;
    private thresholdCheckIntervalId;
    private lastReviewTime;
    private memoriesAtLastReview;
    private isReviewing;
    constructor(reviewer: MemoryReviewer, hippocampus: Hippocampus, config: ScheduleConfig);
    start(): void;
    stop(): void;
    triggerReview(scope?: Partial<ReviewScope>): Promise<void>;
    getStatus(): ScheduleStatus;
    updateConfig(config: Partial<ScheduleConfig>): void;
    private startScheduledReviews;
    private startThresholdChecks;
    private shouldRunScheduledReview;
    private shouldRunThresholdReview;
}
export declare function createDefaultScheduleConfig(): ScheduleConfig;
//# sourceMappingURL=review-scheduler.d.ts.map