/**
 * Prefrontal Cortex — Executive Planning & Decision Making
 *
 * Like the brain's prefrontal cortex, this module handles:
 * - Task decomposition (break complex tasks into sub-tasks)
 * - Priority ranking based on user history + success rates
 * - Working memory (keep relevant short-term context)
 * - Impulse control (don't jump tasks before completing current)
 * - Decision logging (track reasoning for transparency)
 */
import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { MessageClassification } from '../index.js';
export interface TaskPlan {
    id: string;
    timestamp: string;
    description: string;
    priority: number;
    subTasks: SubTask[];
    status: 'planning' | 'in_progress' | 'completed' | 'abandoned';
    estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'epic';
}
export interface SubTask {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'done' | 'skipped';
    order: number;
}
export interface Decision {
    timestamp: string;
    context: string;
    decision: string;
    reasoning: string;
    confidence: number;
}
export interface WorkingMemoryItem {
    content: string;
    relevance: number;
    addedAt: string;
    source: string;
}
export declare class PrefrontalCortex {
    private config;
    private fileManager;
    private currentPlan;
    private workingMemory;
    private decisions;
    private taskHistory;
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    /**
     * Initialize: load current plan and decision history
     */
    initialize(): Promise<void>;
    /**
     * Plan a response strategy based on message classification
     */
    plan(classification: MessageClassification, message: string): TaskPlan;
    /**
     * Estimate task complexity
     */
    private estimateComplexity;
    /**
     * Calculate priority (1-10)
     */
    private calculatePriority;
    /**
     * Decompose task into sub-tasks
     */
    private decompose;
    /**
     * Log a decision for transparency
     */
    logDecision(context: string, decision: string, reasoning: string, confidence: number): void;
    /**
     * Update working memory with relevant context
     */
    updateWorkingMemory(content: string, source: string, relevance: number): void;
    /**
     * Get working memory items
     */
    getWorkingMemory(): WorkingMemoryItem[];
    /**
     * Get current plan
     */
    getCurrentPlan(): TaskPlan | null;
    /**
     * Mark current plan as completed
     */
    completePlan(): void;
    /**
     * Persist executive state
     */
    persist(): Promise<void>;
    private formatPlan;
    private formatDecisions;
    private formatPriorities;
    private parsePlan;
    private parseDecisions;
}
//# sourceMappingURL=prefrontal.d.ts.map