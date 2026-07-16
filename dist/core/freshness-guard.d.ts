/**
 * FreshnessGuard — time-to-live (TTL) for volatile data in memory.
 *
 * Inspired by Graphiti/Zep "validity windows": a remembered fact is only valid
 * for a bounded time. Prices, market metrics, balances, and other fast-moving
 * numbers go stale within MINUTES. Without a TTL, the brain happily re-injects a
 * price it saw an hour ago and Aira may repeat it as if it were current.
 *
 * This guard:
 *   - classifies a memory (or a query) as VOLATILE, based on price/market
 *     wording and the presence of numeric values;
 *   - decides whether a volatile memory is STALE given its age vs a category
 *     TTL (default 5 minutes for prices/markets);
 *   - produces an injectable warning so Aira treats a stale number as expired
 *     and re-searches instead of reusing it.
 *
 * It is intentionally cheap (regex + timestamp math) and language-aware
 * (Vietnamese + English).
 */
export type VolatileKind = 'price' | 'market' | 'balance' | 'none';
export interface FreshnessConfig {
    /** TTL per category, in seconds. Volatile price data defaults to 5 minutes. */
    ttlSeconds: Partial<Record<Exclude<VolatileKind, 'none'>, number>>;
}
export declare const DEFAULT_FRESHNESS: FreshnessConfig;
export interface FreshnessVerdict {
    kind: VolatileKind;
    isVolatile: boolean;
    isStale: boolean;
    ageSeconds: number;
    ttlSeconds: number;
}
export declare class FreshnessGuard {
    private cfg;
    constructor(cfg?: FreshnessConfig);
    /** Classify text into a volatile category (needs both wording AND a number). */
    classify(text: string): VolatileKind;
    /** True when a query is ABOUT volatile data (wording alone is enough here). */
    queryIsVolatile(query: string): VolatileKind;
    private ttlFor;
    /**
     * Judge one remembered item by its content + timestamp.
     * @param content the memory text
     * @param timestampIso when the data was captured/last confirmed
     * @param nowMs current time (injectable for tests)
     */
    judge(content: string, timestampIso: string, nowMs?: number): FreshnessVerdict;
    /** Human-friendly age, e.g. "7 phút trước", "2 giờ trước". */
    formatAge(ageSeconds: number): string;
    /**
     * Given the memories recalled for a volatile query, return an injectable
     * warning listing stale price/market data that must NOT be reused. Returns ''
     * when nothing volatile is stale.
     */
    buildStaleWarning(memories: Array<{
        content: string;
        timestamp: string;
        lastAccessed?: string;
    }>, nowMs?: number): {
        warning: string;
        hasStale: boolean;
    };
}
//# sourceMappingURL=freshness-guard.d.ts.map