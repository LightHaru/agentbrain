/**
 * Hippocampus — Memory Formation & Retrieval
 *
 * Like the brain's hippocampus, this module handles:
 * - Creating new memories from interactions
 * - Classifying memories (episodic/semantic/procedural)
 * - Retrieving relevant memories based on context
 * - Memory consolidation (short-term → long-term)
 * - Memory decay (unused memories lose confidence over time)
 */
import { BrainConfig } from './config.js';
import { Memory } from '../index.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { SqlStorageAdapter } from '../storage/sql-adapter.js';
export interface ConversationTurn {
    message: string;
    response: string;
    senderId: string;
    senderName: string;
    timestamp: string;
}
export interface MemoryCandidate {
    content: string;
    type: 'episodic' | 'semantic' | 'procedural';
    tags: string[];
    importance: number;
}
export declare class Hippocampus {
    private config;
    private fileManager;
    private shortTermBuffer;
    private memories;
    private heartbeatCount;
    private vectorMemory;
    private queryAnalyzer;
    constructor(config: BrainConfig, fileManager: BrainFileManager | SqlStorageAdapter);
    /**
     * Initialize: load existing memories from brain files
     */
    initialize(): Promise<void>;
    /**
     * Recall relevant memories using context-aware retrieval
     * Phase 4 enhancement: query understanding + smart filtering + dynamic limit
     */
    recall(query: string, topic: string): Promise<Memory[]>;
    /**
     * Filter candidate memories based on query context
     */
    private filterCandidates;
    /**
     * Lightweight keyword scan over ALL memories, independent of vector ranking.
     *
     * Semantic recall can miss short volatile queries (e.g. "giá PRL giờ bao
     * nhiêu?" collapses to a stopword-like concept), yet a stale price memory may
     * still be in the store. The FreshnessGuard uses this to catch stale
     * price/market data that ranked recall overlooked. Matches when a memory
     * shares any query token (len > 1) OR any provided must-have term.
     */
    scanByTerms(terms: string[]): Memory[];
    /**
     * Fallback keyword-based recall
     */
    private keywordRecall;
    /**
     * Consolidate a conversation turn into memory
     */
    consolidate(turn: ConversationTurn): Promise<void>;
    /**
     * Extract potential memories from a conversation turn
     */
    private extractMemoryCandidates;
    /**
     * Periodic maintenance: decay old memories, prune low-confidence ones
     */
    maintenance(): Promise<void>;
    /**
     * Self-heal: remove any stored memory whose content is runtime/system noise.
     * Runs on load and during maintenance so the second brain keeps only real
     * memories even if noise was persisted by an older build or other write path.
     * Returns the number of memories purged.
     */
    purgeNoise(): Promise<number>;
    /**
     * Persist memories to brain files
     */
    private persist;
    /**
     * Detect strong sentiment for memory importance
     */
    private detectStrongSentiment;
    /**
     * Skip chat noise unless it contains durable data.
     */
    private isLowValueMessage;
    /**
     * Extract topic tags from text
     */
    private extractTags;
    /**
     * Calculate days since a given ISO timestamp
     */
    private daysSince;
    /**
     * Generate a unique memory ID
     */
    private generateId;
    /**
     * Get memory stats
     */
    getStats(): {
        total: number;
        episodic: number;
        semantic: number;
        procedural: number;
        vectorIndexed: number;
    };
    /**
     * Flush buffered memories without closing the vector store.
     */
    flush(): Promise<void>;
    /**
     * Shutdown: close vector DB
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=hippocampus.d.ts.map