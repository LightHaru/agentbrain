/**
 * ConversationLog — durable, searchable record of every chat turn with Aira.
 *
 * Sếp's requirement: daily chat must be stored properly so Aira can recall
 * context and not "forget the previous line by the next line". The Hippocampus
 * only keeps a few high-value extracted memories; this log keeps the ACTUAL
 * conversation so Aira can pull back what was said, semantically.
 *
 * Design (smart, not bloated):
 *   - every turn stored with an embedding for semantic recall (local MiniLM)
 *   - recent-turn recall (fast, ordered) for immediate context continuity
 *   - semantic recall for "nhớ hồi đó mình nói gì về X"
 *   - rolling cap + low-value trimming so it doesn't grow without bound
 */
import type { BrainDatabase } from '../storage/brain-db.js';
export interface ConversationTurnRow {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    userMessage: string;
    agentResponse: string;
    topic: string;
    sentiment: number;
    timestamp: string;
}
export interface ConvEmbedder {
    isLoaded(): boolean;
    embed(text: string): Promise<Float32Array | null>;
}
export interface ConvRecallHit {
    turn: ConversationTurnRow;
    score: number;
}
export declare class ConversationLog {
    private db;
    private embedder;
    private service;
    private maxTurns;
    constructor(db: BrainDatabase, embedder?: ConvEmbedder | null, maxTurns?: number);
    private embedReady;
    private ensureSchema;
    size(): number;
    /** Record one full turn (user + agent). Embeds for semantic recall. */
    record(turn: {
        sessionId?: string;
        userId?: string;
        userName?: string;
        userMessage: string;
        agentResponse?: string;
        topic?: string;
        sentiment?: number;
        timestamp?: string;
    }): Promise<string>;
    /** All turns since a timestamp (for self-distillation over real chat). */
    since(isoTimestamp: string, limit?: number): ConversationTurnRow[];
    /** Most recent turns (immediate context continuity). */
    recent(limit?: number, sessionId?: string): ConversationTurnRow[];
    /** Semantic recall of past turns relevant to a query ("nhớ hồi đó..."). */
    recall(query: string, limit?: number, minScore?: number): Promise<ConvRecallHit[]>;
    /** Compact injection: recent context + any semantically-relevant older turns. */
    buildContext(query: string, opts?: {
        recent?: number;
        relevant?: number;
        sessionId?: string;
    }): Promise<string>;
    /** Keep the log bounded: drop oldest turns beyond maxTurns. */
    private trimIfNeeded;
}
//# sourceMappingURL=conversation-log.d.ts.map