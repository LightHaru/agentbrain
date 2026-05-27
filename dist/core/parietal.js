"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParietalLobe = void 0;
// ============================================================================
// Parietal Lobe Class
// ============================================================================
class ParietalLobe {
    config;
    /** Recent sensory inputs (short-term buffer) */
    sensoryBuffer;
    /** Maximum buffer size */
    BUFFER_SIZE = 20;
    /** Current attention allocation */
    attentionState;
    /** Active tasks */
    activeTasks;
    constructor(config) {
        this.config = config;
        this.sensoryBuffer = [];
        this.activeTasks = new Map();
        this.attentionState = {
            tasks: [],
            totalBudget: 1.0,
            remainingBudget: 1.0,
            currentFocus: null,
        };
    }
    // ==========================================================================
    // Sensory Integration
    // ==========================================================================
    /**
     * Integrate multiple sensory inputs into unified percept
     */
    integrateSensoryInput(inputs) {
        // Add to buffer
        this.sensoryBuffer.push(...inputs);
        // Trim buffer to size
        if (this.sensoryBuffer.length > this.BUFFER_SIZE) {
            this.sensoryBuffer = this.sensoryBuffer.slice(-this.BUFFER_SIZE);
        }
        // Find primary modality (highest importance)
        const primary = inputs.reduce((max, input) => input.importance > max.importance ? input : max);
        // Fuse representations
        const fused = this.fuseRepresentations(inputs);
        // Extract spatial information if applicable
        const spatialInfo = this.extractSpatialInfo(inputs);
        // Calculate confidence
        const confidence = this.calculateIntegrationConfidence(inputs);
        return {
            primaryModality: primary.modality,
            fusedRepresentation: fused,
            confidence,
            spatialInfo,
            sources: inputs,
        };
    }
    /**
     * Fuse multiple sensory representations
     */
    fuseRepresentations(inputs) {
        // Simple fusion: combine all data with weights
        const fused = {
            modalities: inputs.map(i => i.modality),
            timestamp: Date.now(),
            combined: {},
        };
        for (const input of inputs) {
            fused.combined[input.modality] = {
                data: input.data,
                importance: input.importance,
                metadata: input.metadata,
            };
        }
        return fused;
    }
    /**
     * Extract spatial information from inputs
     */
    extractSpatialInfo(inputs) {
        // Look for code or structured data
        const codeInput = inputs.find(i => i.modality === 'code');
        if (codeInput && typeof codeInput.data === 'string') {
            return this.analyzeSpatialStructure(codeInput.data);
        }
        return undefined;
    }
    /**
     * Calculate confidence in sensory integration
     */
    calculateIntegrationConfidence(inputs) {
        // More inputs with high importance = higher confidence
        const avgImportance = inputs.reduce((sum, i) => sum + i.importance, 0) / inputs.length;
        const modalityDiversity = new Set(inputs.map(i => i.modality)).size / 5; // max 5 modalities
        return (avgImportance + modalityDiversity) / 2;
    }
    // ==========================================================================
    // Spatial Reasoning
    // ==========================================================================
    /**
     * Analyze spatial structure of code or data
     */
    analyzeSpatialStructure(data) {
        // Simple heuristic for code structure
        // In production, use AST parsing
        const relationships = [];
        const hierarchy = [];
        if (typeof data === 'string') {
            // Count nesting levels (indentation)
            const lines = data.split('\n');
            let maxDepth = 0;
            let currentDepth = 0;
            for (const line of lines) {
                const indent = line.match(/^\s*/)?.[0].length || 0;
                currentDepth = Math.floor(indent / 2);
                maxDepth = Math.max(maxDepth, currentDepth);
            }
            // Extract function/class names (simple regex)
            const functionMatches = data.match(/function\s+(\w+)|class\s+(\w+)|const\s+(\w+)\s*=/g) || [];
            hierarchy.push(...functionMatches.map(m => m.split(/\s+/)[1]));
            return {
                structure: { type: 'code', lines: lines.length },
                relationships,
                hierarchy,
                properties: {
                    depth: maxDepth,
                    breadth: hierarchy.length,
                    complexity: maxDepth * hierarchy.length,
                },
            };
        }
        // Default empty structure
        return {
            structure: {},
            relationships: [],
            hierarchy: [],
            properties: { depth: 0, breadth: 0, complexity: 0 },
        };
    }
    /**
     * Find spatial relationships between elements
     */
    findSpatialRelationships(element1, element2, structure) {
        // Check if elements are related in the structure
        const rel = structure.relationships.find(r => (r.from === element1 && r.to === element2) || (r.from === element2 && r.to === element1));
        return rel ? rel.type : null;
    }
    // ==========================================================================
    // Attention Allocation
    // ==========================================================================
    /**
     * Allocate attention across multiple tasks
     */
    allocateAttention(tasks) {
        // Update active tasks
        for (const task of tasks) {
            this.activeTasks.set(task.id, task);
        }
        // Calculate attention weights based on priority and deadline
        const weights = tasks.map(task => {
            let weight = task.priority;
            // Boost weight if deadline is near
            if (task.deadline) {
                const timeLeft = task.deadline - Date.now();
                const urgency = Math.max(0, 1 - timeLeft / (24 * 60 * 60 * 1000)); // 1 day = max urgency
                weight = Math.min(1, weight + urgency * 0.3);
            }
            // Reduce weight by cognitive load (harder tasks get less attention)
            weight = weight * (1 - task.cognitiveLoad * 0.2);
            return { taskId: task.id, weight };
        });
        // Normalize weights to sum to 1.0
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        const normalized = weights.map(w => ({
            taskId: w.taskId,
            attentionWeight: totalWeight > 0 ? w.weight / totalWeight : 0,
            reason: this.explainAttentionAllocation(w.taskId, w.weight / totalWeight),
        }));
        // Find current focus (highest attention)
        const focus = normalized.reduce((max, curr) => curr.attentionWeight > max.attentionWeight ? curr : max, normalized[0]);
        this.attentionState = {
            tasks: normalized,
            totalBudget: 1.0,
            remainingBudget: 0, // all allocated
            currentFocus: focus?.taskId || null,
        };
        return this.attentionState;
    }
    /**
     * Explain why attention was allocated this way
     */
    explainAttentionAllocation(taskId, weight) {
        const task = this.activeTasks.get(taskId);
        if (!task)
            return 'Unknown task';
        if (weight > 0.5) {
            return `High priority (${task.priority.toFixed(2)}) and urgent`;
        }
        else if (weight > 0.3) {
            return `Moderate priority (${task.priority.toFixed(2)})`;
        }
        else {
            return `Lower priority or high cognitive load`;
        }
    }
    /**
     * Get current attention state
     */
    getAttentionState() {
        return this.attentionState;
    }
    /**
     * Shift attention to a specific task
     */
    shiftAttention(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task)
            return;
        // Boost this task's attention
        const existing = this.attentionState.tasks.find(t => t.taskId === taskId);
        if (existing) {
            existing.attentionWeight = Math.min(1, existing.attentionWeight + 0.2);
            this.attentionState.currentFocus = taskId;
        }
    }
    // ==========================================================================
    // Numerical & Logical Reasoning
    // ==========================================================================
    /**
     * Perform numerical calculation
     */
    performCalculation(expression) {
        try {
            // Simple eval (in production, use safe math parser)
            // eslint-disable-next-line no-eval
            return eval(expression);
        }
        catch (error) {
            return NaN;
        }
    }
    /**
     * Compare two quantities
     */
    compareQuantities(a, b) {
        const difference = Math.abs(a - b);
        const relativeDiff = difference / Math.max(Math.abs(a), Math.abs(b), 1);
        // Confidence based on how clear the difference is
        const confidence = Math.min(1, relativeDiff * 2);
        let result;
        if (Math.abs(a - b) < 0.0001) {
            result = 'equal';
        }
        else if (a > b) {
            result = 'a';
        }
        else {
            result = 'b';
        }
        return { result, difference, confidence };
    }
    /**
     * Logical reasoning: check if condition is satisfied
     */
    evaluateCondition(condition, context) {
        // Simple condition evaluation
        // In production, use safe expression evaluator
        try {
            // Replace variables with values
            let expr = condition;
            for (const [key, value] of Object.entries(context)) {
                expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), JSON.stringify(value));
            }
            // eslint-disable-next-line no-eval
            return eval(expr);
        }
        catch (error) {
            return false;
        }
    }
    // ==========================================================================
    // Task Management
    // ==========================================================================
    /**
     * Add a new task
     */
    addTask(task) {
        this.activeTasks.set(task.id, task);
    }
    /**
     * Update task status
     */
    updateTaskStatus(taskId, status) {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = status;
        }
    }
    /**
     * Get all active tasks
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.values()).filter(t => t.status !== 'completed');
    }
    /**
     * Remove completed tasks
     */
    pruneCompletedTasks() {
        for (const [id, task] of this.activeTasks.entries()) {
            if (task.status === 'completed') {
                this.activeTasks.delete(id);
            }
        }
    }
    // ==========================================================================
    // Introspection & Debugging
    // ==========================================================================
    /**
     * Get current state for debugging
     */
    getState() {
        return {
            sensoryBufferSize: this.sensoryBuffer.length,
            activeTasksCount: this.activeTasks.size,
            currentFocus: this.attentionState.currentFocus,
            attentionAllocated: this.attentionState.tasks.length,
            recentModalities: [...new Set(this.sensoryBuffer.slice(-5).map(i => i.modality))],
        };
    }
}
exports.ParietalLobe = ParietalLobe;
//# sourceMappingURL=parietal.js.map