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
import { BrainConfig } from './config.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

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

// ============================================================================
// ReviewScheduler Class
// ============================================================================

export class ReviewScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private thresholdCheckIntervalId: NodeJS.Timeout | null = null;
  private lastReviewTime: number = 0;
  private memoriesAtLastReview: number = 0;
  private isReviewing: boolean = false;

  constructor(
    private reviewer: MemoryReviewer,
    private hippocampus: Hippocampus,
    private config: ScheduleConfig
  ) {}

  start(): void {
    if (this.config.enableScheduled) {
      this.startScheduledReviews();
    }
    
    if (this.config.enableThreshold) {
      this.startThresholdChecks();
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.thresholdCheckIntervalId) {
      clearInterval(this.thresholdCheckIntervalId);
      this.thresholdCheckIntervalId = null;
    }
  }

  async triggerReview(scope?: Partial<ReviewScope>): Promise<void> {
    if (this.isReviewing) {
      return;
    }
    
    this.isReviewing = true;
    
    try {
      const reviewScope: ReviewScope = {
        type: scope?.type || 'recent',
        trigger: scope?.trigger || 'manual',
        timeWindow: scope?.timeWindow || this.config.intervalMs,
        topic: scope?.topic,
      };
      
      await this.reviewer.runReviewCycle(reviewScope);
      
      this.lastReviewTime = Date.now();
      this.memoriesAtLastReview = this.hippocampus.getStats().total;
      
    } finally {
      this.isReviewing = false;
    }
  }

  getStatus(): ScheduleStatus {
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

  updateConfig(config: Partial<ScheduleConfig>): void {
    Object.assign(this.config, config);
    this.stop();
    this.start();
  }

  private startScheduledReviews(): void {
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

  private startThresholdChecks(): void {
    this.thresholdCheckIntervalId = setInterval(async () => {
      if (this.shouldRunThresholdReview()) {
        await this.triggerReview({
          type: 'recent',
          trigger: 'threshold',
        });
      }
    }, 5 * 60 * 1000);
  }

  private shouldRunScheduledReview(): boolean {
    if (this.isReviewing) return false;
    
    if (this.config.enableSmartScheduling && this.config.preferLowActivityPeriods) {
      const hour = new Date().getHours();
      const isLowActivityPeriod = hour >= 2 && hour <= 6;
      
      if (!isLowActivityPeriod) {
        return false;
      }
    }
    
    return true;
  }

  private shouldRunThresholdReview(): boolean {
    if (this.isReviewing) return false;
    
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

export function createDefaultScheduleConfig(): ScheduleConfig {
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
