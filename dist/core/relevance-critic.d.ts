/**
 * RelevanceCritic — Self-RAG-style post-retrieval criticism.
 *
 * Naive top-k recall injects whatever the vector index returns. Self-RAG
 * (Asai et al., arXiv:2310.11511) shows retrieval should be CRITIQUED before
 * use: is each item actually relevant, fresh enough, and confident enough?
 * mem0/Graphiti add temporal reasoning — prefer the memory that is true NOW.
 *
 * This critic runs AFTER recall and BEFORE injection. It:
 *   - scores each memory on lexical overlap, recency, confidence, and access;
 *   - drops items below a keep threshold (so stale/irrelevant noise is not
 *     stuffed into the prompt);
 *   - detects likely contradictions (same subject, conflicting values) and
 *     flags them so Aira surfaces the conflict instead of blending silently.
 *
 * It is intentionally dependency-free (no embeddings here) so it is cheap and
 * deterministic; the heavy semantic work already happened during recall.
 */
import { Memory } from '../index.js';
export interface CritiqueOptions {
    /** Query the memories were recalled for. */
    query: string;
    /** Minimum keep score (0..1). Below this, a memory is dropped. */
    minKeepScore?: number;
    /** Treat memories older than this many days as stale (down-weighted). */
    staleDays?: number;
    /** Hard cap on how many memories survive. */
    maxKeep?: number;
    /** When true, the query explicitly wants historical context; skip stale penalty. */
    wantsHistory?: boolean;
}
export interface ScoredMemory {
    memory: Memory;
    score: number;
    fresh: boolean;
}
export interface CritiqueResult {
    kept: Memory[];
    dropped: Memory[];
    /** Human-readable conflict notes to surface to Aira, or []. */
    conflicts: string[];
    /** True when recall was weak (kept set is empty or all low-score). */
    weak: boolean;
}
export declare class RelevanceCritic {
    critique(memories: Memory[], opts: CritiqueOptions): CritiqueResult;
    /**
     * Detect likely contradictions among kept memories: same subject/entity but
     * conflicting numeric values (prices, versions, counts). Cheap heuristic.
     */
    private detectConflicts;
    /** Format critic output for prompt injection (compact). */
    formatForInjection(result: CritiqueResult): string;
    private daysSince;
}
//# sourceMappingURL=relevance-critic.d.ts.map