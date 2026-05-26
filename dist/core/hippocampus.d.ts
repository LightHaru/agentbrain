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
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    /**
     * Initialize: load existing memories from brain files
     */
    initialize(): Promise<void>;
    /**
     * Recall relevant memories for a given query/topic
     */
    recall(query: string, topic: string): Promise<Memory[]>;
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
     * Persist memories to brain files
     */
    private persist;
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
    };
}
//# sourceMappingURL=hippocampus.d.ts.map