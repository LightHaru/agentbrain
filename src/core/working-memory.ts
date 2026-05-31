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

// ============================================================================
// Types & Interfaces
// ============================================================================

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

// ============================================================================
// Working Memory Class
// ============================================================================

export class WorkingMemory {
  /** Memory items */
  private items: Map<string, MemoryItem>;
  
  /** Maximum capacity (Miller's Law: 7±2) */
  private capacity: number;
  
  /** Decay rate per minute */
  private readonly DECAY_RATE = 0.05;
  
  /** Minimum activation to keep in memory */
  private readonly MIN_ACTIVATION = 0.2;
  
  /** Refresh boost amount */
  private readonly REFRESH_BOOST = 0.3;

  constructor(capacity: number = 7) {
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
  add(item: Omit<MemoryItem, 'id' | 'addedAt' | 'lastRefreshed' | 'activation'>): boolean {
    // Check if at capacity
    if (this.items.size >= this.capacity) {
      // Try to make space by removing lowest activation item
      const removed = this.removeLowestActivation();
      if (!removed) {
        return false; // Couldn't make space
      }
    }
    
    const memoryItem: MemoryItem = {
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
  get(id: string): MemoryItem | undefined {
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
  getAll(): MemoryItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get items by type
   */
  getByType(type: MemoryItemType): MemoryItem[] {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  /**
   * Refresh an item (prevent decay)
   */
  refresh(id: string): boolean {
    const item = this.items.get(id);
    if (!item) return false;
    
    item.lastRefreshed = Date.now();
    item.activation = Math.min(1.0, item.activation + this.REFRESH_BOOST);
    
    return true;
  }

  /**
   * Remove item by ID
   */
  remove(id: string): boolean {
    return this.items.delete(id);
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Remove lowest activation item
   */
  private removeLowestActivation(): boolean {
    if (this.items.size === 0) return false;
    
    let lowestItem: MemoryItem | null = null;
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
  decay(minutesElapsed: number): void {
    const itemsToRemove: string[] = [];
    
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
  autoDecay(): void {
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
  getCognitiveLoad(): number {
    const utilizationLoad = this.items.size / this.capacity;
    
    // Higher importance items increase load
    const importanceLoad = Array.from(this.items.values())
      .reduce((sum, item) => sum + item.importance, 0) / this.items.size || 0;
    
    return (utilizationLoad + importanceLoad) / 2;
  }

  /**
   * Check if working memory is overloaded
   */
  isOverloaded(): boolean {
    return this.getCognitiveLoad() > 0.8;
  }

  /**
   * Get available capacity
   */
  getAvailableCapacity(): number {
    return this.capacity - this.items.size;
  }

  // ==========================================================================
  // Chunking (Combine related items to save space)
  // ==========================================================================

  /**
   * Chunk related items together to save space
   */
  chunk(relatedItemIds: string[], summary: string): ChunkingResult | null {
    // Get items
    const itemsToChunk = relatedItemIds
      .map(id => this.items.get(id))
      .filter((item): item is MemoryItem => item !== undefined);
    
    if (itemsToChunk.length < 2) {
      return null; // Need at least 2 items to chunk
    }
    
    // Remove original items
    for (const id of relatedItemIds) {
      this.items.delete(id);
    }
    
    // Create chunked item
    const chunkedItem: MemoryItem = {
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
  rehearse(): void {
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
  getState(): WorkingMemoryState {
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
  getSummary(): string {
    const load = this.getCognitiveLoad();
    const items = this.getAll();
    
    return `Working Memory: ${items.length}/${this.capacity} items, Load: ${(load * 100).toFixed(0)}%, ${this.isOverloaded() ? 'OVERLOADED' : 'OK'}`;
  }

  /**
   * Set capacity (for testing different limits)
   */
  setCapacity(capacity: number): void {
    this.capacity = Math.max(1, Math.min(12, capacity)); // 1-12 range
    
    // If over capacity, remove lowest activation items
    while (this.items.size > this.capacity) {
      this.removeLowestActivation();
    }
  }
}
