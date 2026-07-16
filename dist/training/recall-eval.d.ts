/**
 * RecallEval — measures MEMORY RECALL quality, not just reasoning coverage.
 *
 * benchmark.ts proves the brain brings good reasoning frames to a message.
 * This harness proves the OTHER half the user cares about: when Aira needs a
 * fact from memory, does the brain surface the RIGHT memory and drop noise?
 *
 * It is a golden-set information-retrieval eval:
 *   - seed a store with labelled memories (each has a stable id)
 *   - for each probe: a query + the set of ids that are truly relevant
 *   - run the brain's real recall (optionally + RelevanceCritic) and score
 *     precision@k, recall@k, MRR, and a "clean" score (relevant kept AND
 *     irrelevant dropped).
 *
 * A gain here = the brain got measurably better at finding the right memory,
 * which is exactly "nhớ tốt hơn, gợi ý context chính xác hơn".
 */
export interface RecallProbe {
    id: string;
    query: string;
    /** ids of memories that SHOULD be recalled for this query */
    relevantIds: string[];
}
export interface ProbeRecallScore {
    id: string;
    precisionAtK: number;
    recallAtK: number;
    mrr: number;
    /** fraction of relevant found AND all returned were relevant (strict) */
    clean: number;
    returned: number;
    hit: number;
}
export interface RecallEvalResult {
    /** macro-averaged over probes, 0..1 */
    precisionAtK: number;
    recallAtK: number;
    mrr: number;
    clean: number;
    k: number;
    probeScores: ProbeRecallScore[];
    timestamp: string;
}
/** A recall function under test: query -> ordered list of memory ids. */
export type RecallFn = (query: string) => Promise<string[]> | string[];
export declare function runRecallEval(probes: RecallProbe[], recall: RecallFn, k?: number): Promise<RecallEvalResult>;
/**
 * Default golden recall set. Each entry is a memory to seed (content + id) and
 * the probes that should retrieve it. Kept in ONE structure so the seeded
 * corpus and the labels never drift apart.
 */
export interface GoldenEntry {
    id: string;
    content: string;
    /** queries for which THIS memory is a relevant answer */
    queries: string[];
}
export declare const GOLDEN_RECALL_CORPUS: GoldenEntry[];
//# sourceMappingURL=recall-eval.d.ts.map