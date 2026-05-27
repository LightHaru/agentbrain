"use strict";
/**
 * Working Memory Enhancement for Prefrontal Cortex
 *
 * Implements realistic working memory with:
 * - Limited capacity (7±2 items, Miller's Law)
 * - Temporal decay (items fade if not refreshed)
 * - Cognitive load tracking
 * - Chunking and rehearsal mechanisms
 *
 * This is a separate module that can be integrated into Prefrontal Cortex
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkingMemory = void 0;
// ============================================================================
// Working Memory Class
// ============================================================================
class WorkingMemory {
    /** Memory items */
    items;
    /** Maximum capacity (Miller's Law: 7±2) */
    capacity;
    /** Decay rate per minute */
    DECAY_RATE = 0.05;
    /** Minimum activation to keep in memory */
    MIN_ACTIVATION = 0.2;
    /** Refresh boost amount */
    REFRESH_BOOST = 0.3;
    constructor(capacity = 7) {
        this.items = new Map();
        this.capacity = capacity;
    }
    // ==========================================================================
    // Core Operations
    // ==========================================================================
    /**
     * Add item to working memory
     * Returns false if memory is full and item couldn't be added
     */
    add(item) {
        // Check if at capacity
        if (this.items.size >= this.capacity) {
            // Try to make space by removing lowest activation item
            const removed = this.removeLowestActivation();
            if (!removed) {
                return false; // Couldn't make space
            }
        }
        const memoryItem = {
            ...item,
            id: `wm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            addedAt: Date.now(),
            lastRefreshed: Date.now(),
            activation: 1.0, // Start at full activation
        };
        this.items.set(memoryItem.id, memoryItem);
        return true;
    }
    /**
     * Get item by ID
     */
    get(id) {
        const item = this.items.get(id);
        if (item) {
            // Accessing an item refreshes it
            this.refresh(id);
        }
        return item;
    }
    /**
     * Get all items
     */
    getAll() {
        return Array.from(this.items.values());
    }
    /**
     * Get items by type
     */
    getByType(type) {
        return Array.from(this.items.values()).filter(item => item.type === type);
    }
    /**
     * Refresh an item (prevent decay)
     */
    refresh(id) {
        const item = this.items.get(id);
        if (!item)
            return false;
        item.lastRefreshed = Date.now();
        item.activation = Math.min(1.0, item.activation + this.REFRESH_BOOST);
        return true;
    }
    /**
     * Remove item by ID
     */
    remove(id) {
        return this.items.delete(id);
    }
    /**
     * Clear all items
     */
    clear() {
        this.items.clear();
    }
    /**
     * Remove lowest activation item
     */
    removeLowestActivation() {
        if (this.items.size === 0)
            return false;
        let lowestItem = null;
        let lowestActivation = Infinity;
        for (const item of this.items.values()) {
            if (item.activation < lowestActivation) {
                lowestActivation = item.activation;
                lowestItem = item;
            }
        }
        if (lowestItem) {
            this.items.delete(lowestItem.id);
            return true;
        }
        return false;
    }
    // ==========================================================================
    // Decay & Maintenance
    // ==========================================================================
    /**
     * Apply decay to all items based on time elapsed
     */
    decay(minutesElapsed) {
        const itemsToRemove = [];
        for (const [id, item] of this.items.entries()) {
            // Apply decay based on minutes elapsed parameter
            const decayAmount = item.decayRate * minutesElapsed * this.DECAY_RATE;
            item.activation = Math.max(0, item.activation - decayAmount);
            // Update lastRefreshed to simulate time passing
            item.lastRefreshed = item.lastRefreshed - (minutesElapsed * 60 * 1000);
            // Mark for removal if activation too low
            if (item.activation < this.MIN_ACTIVATION) {
                itemsToRemove.push(id);
            }
        }
        // Remove decayed items
        for (const id of itemsToRemove) {
            this.items.delete(id);
        }
    }
    /**
     * Auto-decay (call periodically)
     */
    autoDecay() {
        // Decay based on time since last decay
        // For simplicity, assume 1 minute has passed
        this.decay(1);
    }
    // ==========================================================================
    // Cognitive Load
    // ==========================================================================
    /**
     * Calculate current cognitive load (0-1)
     */
    getCognitiveLoad() {
        const utilizationLoad = this.items.size / this.capacity;
        // Higher importance items increase load
        const importanceLoad = Array.from(this.items.values())
            .reduce((sum, item) => sum + item.importance, 0) / this.items.size || 0;
        return (utilizationLoad + importanceLoad) / 2;
    }
    /**
     * Check if working memory is overloaded
     */
    isOverloaded() {
        return this.getCognitiveLoad() > 0.8;
    }
    /**
     * Get available capacity
     */
    getAvailableCapacity() {
        return this.capacity - this.items.size;
    }
    // ==========================================================================
    // Chunking (Combine related items to save space)
    // ==========================================================================
    /**
     * Chunk related items together to save space
     */
    chunk(relatedItemIds, summary) {
        // Get items
        const itemsToChunk = relatedItemIds
            .map(id => this.items.get(id))
            .filter((item) => item !== undefined);
        if (itemsToChunk.length < 2) {
            return null; // Need at least 2 items to chunk
        }
        // Remove original items
        for (const id of relatedItemIds) {
            this.items.delete(id);
        }
        // Create chunked item
        const chunkedItem = {
            id: `chunk-${Date.now()}`,
            content: {
                summary,
                items: itemsToChunk.map(i => i.content),
            },
            type: 'context',
            addedAt: Date.now(),
            lastRefreshed: Date.now(),
            importance: Math.max(...itemsToChunk.map(i => i.importance)),
            decayRate: Math.min(...itemsToChunk.map(i => i.decayRate)),
            activation: 1.0,
        };
        this.items.set(chunkedItem.id, chunkedItem);
        return {
            originalItems: itemsToChunk,
            chunks: [{
                    id: chunkedItem.id,
                    items: itemsToChunk,
                    summary,
                }],
            spaceSaved: itemsToChunk.length - 1,
        };
    }
    // ==========================================================================
    // Rehearsal (Keep important items active)
    // ==========================================================================
    /**
     * Rehearse (refresh) all high-importance items
     */
    rehearse() {
        for (const item of this.items.values()) {
            if (item.importance > 0.7) {
                this.refresh(item.id);
            }
        }
    }
    // ==========================================================================
    // State & Introspection
    // ==========================================================================
    /**
     * Get current state
     */
    getState() {
        return {
            items: this.getAll(),
            capacity: this.capacity,
            cognitiveLoad: this.getCognitiveLoad(),
            isOverloaded: this.isOverloaded(),
        };
    }
    /**
     * Get summary for debugging
     */
    getSummary() {
        const load = this.getCognitiveLoad();
        const items = this.getAll();
        return `Working Memory: ${items.length}/${this.capacity} items, Load: ${(load * 100).toFixed(0)}%, ${this.isOverloaded() ? 'OVERLOADED' : 'OK'}`;
    }
    /**
     * Set capacity (for testing different limits)
     */
    setCapacity(capacity) {
        this.capacity = Math.max(1, Math.min(12, capacity)); // 1-12 range
        // If over capacity, remove lowest activation items
        while (this.items.size > this.capacity) {
            this.removeLowestActivation();
        }
    }
}
exports.WorkingMemory = WorkingMemory;
//# sourceMappingURL=working-memory.js.map