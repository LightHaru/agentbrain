/**
 * SelfDistiller — AgentBrain distills NEW knowledge from its own real,
 * successful conversations, so it keeps getting smarter over time (not just
 * from the one-time Opus seed).
 *
 * How it stays trustworthy and lean:
 *   - only learns from turns with a POSITIVE outcome signal (user sentiment /
 *     explicit praise) — mistakes are handled by the Error Ledger instead
 *   - extracts durable, generalizable knowledge (stated preferences, decisions,
 *     stable facts), not ephemeral chatter
 *   - writes through the KnowledgeStore, which dedups by content hash and
 *     prunes low-value items → no bloat
 *   - watermarks the last processed timestamp so each run only handles new chat
 */
import type { KnowledgeStore } from '../core/knowledge-store.js';
import type { ConversationLog } from '../core/conversation-log.js';
export interface SelfDistillerStore {
    readFile(path: string): Promise<string | null>;
    writeFile(path: string, content: string): Promise<void>;
}
export interface SelfDistillReport {
    scanned: number;
    learned: number;
    skipped: number;
    fromTimestamp: string;
    toTimestamp: string;
}
export declare class SelfDistiller {
    private knowledge;
    private log;
    private store;
    constructor(knowledge: KnowledgeStore, log: ConversationLog, store?: SelfDistillerStore | null);
    private getWatermark;
    private setWatermark;
    /**
     * Classify what durable knowledge (if any) a successful turn carries.
     * Returns null for ephemeral/low-value turns.
     */
    private classify;
    /**
     * Run one self-distillation pass over conversations newer than the watermark.
     * Only positive-outcome turns produce knowledge. Returns a report.
     */
    run(opts?: {
        minSentiment?: number;
        limit?: number;
        now?: string;
    }): Promise<SelfDistillReport>;
}
//# sourceMappingURL=self-distiller.d.ts.map