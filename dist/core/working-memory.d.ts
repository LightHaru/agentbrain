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
export type MemoryItemType = 'goal' | 'fact' | 'task' | 'context' | 'instruction';
export interface MemoryItem {
    /** Unique identifier */
    id: string;
    /** Content of the memory item */
    content: any;
    /** Type of memory item */
    type: MemoryItemType;
    /** When this item was added */
    addedAt: number;
    /** Last time this item was accessed/refreshed */
    lastRefreshed: number;
    /** Importance/priority (0-1) */
    importance: number;
    /** Decay rate (how fast it fades, 0-1) */
    decayRate: number;
    /** Current activation level (0-1) */
    activation: number;
}
export interface WorkingMemoryState {
    /** Current items in working memory */
    items: MemoryItem[];
    /** Maximum capacity (default 7) */
    capacity: number;
    /** Current cognitive load (0-1) */
    cognitiveLoad: number;
    /** Is working memory overloaded? */
    isOverloaded: boolean;
}
export interface ChunkingResult {
    /** Original items */
    originalItems: MemoryItem[];
    /** Chunked representation */
    chunks: Array<{
        id: string;
        items: MemoryItem[];
        summary: string;
    }>;
    /** Space saved */
    spaceSaved: number;
}
export declare class WorkingMemory {
    /** Memory items */
    private items;
    /** Maximum capacity (Miller's Law: 7±2) */
    private capacity;
    /** Decay rate per minute */
    private readonly DECAY_RATE;
    /** Minimum activation to keep in memory */
    private readonly MIN_ACTIVATION;
    /** Refresh boost amount */
    private readonly REFRESH_BOOST;
    constructor(capacity?: number);
    /**
     * Add item to working memory
     * Returns false if memory is full and item couldn't be added
     */
    add(item: Omit<MemoryItem, 'id' | 'addedAt' | 'lastRefreshed' | 'activation'>): boolean;
    /**
     * Get item by ID
     */
    get(id: string): MemoryItem | undefined;
    /**
     * Get all items
     */
    getAll(): MemoryItem[];
    /**
     * Get items by type
     */
    getByType(type: MemoryItemType): MemoryItem[];
    /**
     * Refresh an item (prevent decay)
     */
    refresh(id: string): boolean;
    /**
     * Remove item by ID
     */
    remove(id: string): boolean;
    /**
     * Clear all items
     */
    clear(): void;
    /**
     * Remove lowest activation item
     */
    private removeLowestActivation;
    /**
     * Apply decay to all items based on time elapsed
     */
    decay(minutesElapsed: number): void;
    /**
     * Auto-decay (call periodically)
     */
    autoDecay(): void;
    /**
     * Calculate current cognitive load (0-1)
     */
    getCognitiveLoad(): number;
    /**
     * Check if working memory is overloaded
     */
    isOverloaded(): boolean;
    /**
     * Get available capacity
     */
    getAvailableCapacity(): number;
    /**
     * Chunk related items together to save space
     */
    chunk(relatedItemIds: string[], summary: string): ChunkingResult | null;
    /**
     * Rehearse (refresh) all high-importance items
     */
    rehearse(): void;
    /**
     * Get current state
     */
    getState(): WorkingMemoryState;
    /**
     * Get summary for debugging
     */
    getSummary(): string;
    /**
     * Set capacity (for testing different limits)
     */
    setCapacity(capacity: number): void;
}
//# sourceMappingURL=working-memory.d.ts.map