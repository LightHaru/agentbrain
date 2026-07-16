/**
 * Error Ledger — AgentBrain remembers mistakes it made and how they were fixed,
 * then proactively reminds Aira BEFORE she repeats them.
 *
 * This is durable "scar tissue": every time a fix follows a failure, the ledger
 * records (context, what went wrong, root cause, the fix that worked). On a new
 * task it recalls the most relevant past mistakes — by keyword now and by local
 * MiniLM embedding when available — so the same bug is not made twice. Entries
 * gain confidence when the same mistake recurs, and the reminder is injected
 * into Aira's prompt. This is a core "learn from errors over time" mechanism.
 */
export interface ErrorEntry {
    id: string;
    context: string;
    mistake: string;
    rootCause: string;
    fix: string;
    tags: string[];
    occurrences: number;
    confidence: number;
    firstSeen: string;
    lastSeen: string;
    embedding?: number[];
}
export interface ErrorLedgerStore {
    readFile(path: string): Promise<string | null>;
    writeFile(path: string, content: string): Promise<void>;
}
/** Optional embedder (the local MiniLM engine) for semantic recall. */
export interface LedgerEmbedder {
    isLoaded(): boolean;
    embed(text: string): Promise<Float32Array | null>;
}
export declare class ErrorLedger {
    private entries;
    private store;
    private embedder;
    constructor(store?: ErrorLedgerStore | null, embedder?: LedgerEmbedder | null);
    initialize(): Promise<void>;
    persist(): Promise<void>;
    getAll(): ErrorEntry[];
    size(): number;
    /**
     * Record a mistake + its fix. If a very similar mistake already exists, it is
     * reinforced (occurrences++, confidence up) instead of duplicated.
     */
    record(input: {
        context: string;
        mistake: string;
        rootCause?: string;
        fix: string;
        tags?: string[];
        timestamp?: string;
    }): Promise<ErrorEntry>;
    /** Keyword-based similarity fallback (always available). */
    private findSimilar;
    /**
     * Recall the most relevant past mistakes for the current task. Uses local
     * MiniLM embeddings when available, else keyword overlap.
     */
    recall(query: string, limit?: number): Promise<ErrorEntry[]>;
    /** Format recalled mistakes as a compact reminder for Aira's prompt. */
    formatForInjection(entries: ErrorEntry[]): string;
    /** Bulk-load (e.g. from distillation seed). */
    load(entries: ErrorEntry[]): void;
}
//# sourceMappingURL=error-ledger.d.ts.map