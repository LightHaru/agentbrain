/**
 * Parietal Lobe — Sensory Integration & Spatial Reasoning
 *
 * Like the brain's parietal lobe, this module handles:
 * - Multi-modal sensory integration (text + image + code + audio)
 * - Spatial reasoning (code structure, architecture, relationships)
 * - Attention allocation (limited resource, priority-based)
 * - Numerical & logical reasoning
 *
 * Key areas:
 * - Somatosensory cortex: Sensory input processing
 * - Posterior parietal cortex: Spatial awareness & attention
 * - Angular gyrus: Mathematical reasoning
 */
import { BrainConfig } from './config.js';
export type SensoryModality = 'text' | 'image' | 'code' | 'audio' | 'video';
export interface SensoryInput {
    /** Type of sensory input */
    modality: SensoryModality;
    /** Raw data */
    data: any;
    /** When this input was received */
    timestamp: number;
    /** Importance/salience (0-1) */
    importance: number;
    /** Optional metadata */
    metadata?: Record<string, any>;
}
export interface IntegratedPercept {
    /** Primary modality (most important) */
    primaryModality: SensoryModality;
    /** Fused representation combining all modalities */
    fusedRepresentation: any;
    /** Confidence in this integration */
    confidence: number;
    /** Spatial information if applicable */
    spatialInfo?: SpatialMap;
    /** Contributing inputs */
    sources: SensoryInput[];
}
export interface SpatialMap {
    /** Structure representation (tree/graph) */
    structure: any;
    /** Relationships between elements */
    relationships: Array<{
        from: string;
        to: string;
        type: 'parent-child' | 'sibling' | 'depends-on' | 'contains' | 'references';
        strength: number;
    }>;
    /** Hierarchical levels */
    hierarchy: string[];
    /** Spatial properties */
    properties: {
        depth: number;
        breadth: number;
        complexity: number;
    };
}
export interface Task {
    /** Task identifier */
    id: string;
    /** Task description */
    description: string;
    /** Priority (0-1, higher = more important) */
    priority: number;
    /** Estimated cognitive load */
    cognitiveLoad: number;
    /** Deadline (optional) */
    deadline?: number;
    /** Current status */
    status: 'pending' | 'active' | 'completed' | 'blocked';
}
export interface AttentionAllocation {
    /** Tasks with allocated attention */
    tasks: Array<{
        taskId: string;
        attentionWeight: number;
        reason: string;
    }>;
    /** Total attention budget (always 1.0) */
    totalBudget: number;
    /** Remaining unallocated attention */
    remainingBudget: number;
    /** Current focus (task receiving most attention) */
    currentFocus: string | null;
}
export interface ComparisonResult {
    /** Which is greater: 'a', 'b', or 'equal' */
    result: 'a' | 'b' | 'equal';
    /** Magnitude of difference */
    difference: number;
    /** Confidence in comparison */
    confidence: number;
}
export declare class ParietalLobe {
    private config;
    /** Recent sensory inputs (short-term buffer) */
    private sensoryBuffer;
    /** Maximum buffer size */
    private readonly BUFFER_SIZE;
    /** Current attention allocation */
    private attentionState;
    /** Active tasks */
    private activeTasks;
    constructor(config: BrainConfig);
    /**
     * Integrate multiple sensory inputs into unified percept
     */
    integrateSensoryInput(inputs: SensoryInput[]): IntegratedPercept;
    /**
     * Fuse multiple sensory representations
     */
    private fuseRepresentations;
    /**
     * Extract spatial information from inputs
     */
    private extractSpatialInfo;
    /**
     * Calculate confidence in sensory integration
     */
    private calculateIntegrationConfidence;
    /**
     * Analyze spatial structure of code or data
     */
    analyzeSpatialStructure(data: any): SpatialMap;
    /**
     * Find spatial relationships between elements
     */
    findSpatialRelationships(element1: string, element2: string, structure: SpatialMap): string | null;
    /**
     * Allocate attention across multiple tasks
     */
    allocateAttention(tasks: Task[]): AttentionAllocation;
    /**
     * Explain why attention was allocated this way
     */
    private explainAttentionAllocation;
    /**
     * Get current attention state
     */
    getAttentionState(): AttentionAllocation;
    /**
     * Shift attention to a specific task
     */
    shiftAttention(taskId: string): void;
    /**
     * Perform numerical calculation
     */
    performCalculation(expression: string): number;
    /**
     * Compare two quantities
     */
    compareQuantities(a: number, b: number): ComparisonResult;
    /**
     * Logical reasoning: check if condition is satisfied
     */
    evaluateCondition(condition: string, context: Record<string, any>): boolean;
    /**
     * Add a new task
     */
    addTask(task: Task): void;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: Task['status']): void;
    /**
     * Get all active tasks
     */
    getActiveTasks(): Task[];
    /**
     * Remove completed tasks
     */
    pruneCompletedTasks(): void;
    /**
     * Get current state for debugging
     */
    getState(): {
        sensoryBufferSize: number;
        activeTasksCount: number;
        currentFocus: string | null;
        attentionAllocated: number;
        recentModalities: SensoryModality[];
    };
}
//# sourceMappingURL=parietal.d.ts.map