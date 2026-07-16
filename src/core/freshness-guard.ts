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

export const DEFAULT_FRESHNESS: FreshnessConfig = {
  ttlSeconds: {
    price: 300,    // 5 minutes — the window the user asked for
    market: 300,   // market cap / volume / liquidity move just as fast
    balance: 900,  // wallet/pool balances: 15 minutes
  },
};

// Price / money wording. Requiring this + a number keeps false positives low.
const PRICE_WORDS = /(giá|price|tỷ giá|floor price|ath|atl|\$|usd|usdt|đồng\/|vnđ|vnd)/i;
const MARKET_WORDS = /(market cap|marketcap|vốn hóa|volume|khối lượng|thanh khoản|liquidity|apr|apy|lãi suất|tvl)/i;
const BALANCE_WORDS = /(balance|số dư|hashrate|th\/s|gh\/s|reward|payout|lãi|earnings|thu nhập)/i;
// A numeric value (with optional $ , . and unit) — evidence the text carries data.
const HAS_NUMBER = /\$?\d[\d.,]*\s*(k|m|b|%|usd|usdt|prl|th\/s|gh\/s)?/i;

export interface FreshnessVerdict {
  kind: VolatileKind;
  isVolatile: boolean;
  isStale: boolean;
  ageSeconds: number;
  ttlSeconds: number;
}

export class FreshnessGuard {
  private cfg: FreshnessConfig;

  constructor(cfg: FreshnessConfig = DEFAULT_FRESHNESS) {
    this.cfg = cfg;
  }

  /** Classify text into a volatile category (needs both wording AND a number). */
  classify(text: string): VolatileKind {
    if (!text) return 'none';
    const hasNum = HAS_NUMBER.test(text);
    // Check the more specific categories first; PRICE_WORDS includes the broad
    // "$" symbol which also appears in market-cap/volume lines.
    if (MARKET_WORDS.test(text) && hasNum) return 'market';
    if (BALANCE_WORDS.test(text) && hasNum) return 'balance';
    if (PRICE_WORDS.test(text) && hasNum) return 'price';
    return 'none';
  }

  /** True when a query is ABOUT volatile data (wording alone is enough here). */
  queryIsVolatile(query: string): VolatileKind {
    if (!query) return 'none';
    if (MARKET_WORDS.test(query)) return 'market';
    if (BALANCE_WORDS.test(query)) return 'balance';
    if (PRICE_WORDS.test(query)) return 'price';
    return 'none';
  }

  private ttlFor(kind: VolatileKind): number {
    if (kind === 'none') return Infinity;
    return this.cfg.ttlSeconds[kind] ?? 300;
  }

  /**
   * Judge one remembered item by its content + timestamp.
   * @param content the memory text
   * @param timestampIso when the data was captured/last confirmed
   * @param nowMs current time (injectable for tests)
   */
  judge(content: string, timestampIso: string, nowMs: number = Date.now()): FreshnessVerdict {
    const kind = this.classify(content);
    const isVolatile = kind !== 'none';
    const ttl = this.ttlFor(kind);
    const t = Date.parse(timestampIso);
    const ageSeconds = Number.isNaN(t) ? Infinity : Math.max(0, (nowMs - t) / 1000);
    const isStale = isVolatile && ageSeconds > ttl;
    return { kind, isVolatile, isStale, ageSeconds, ttlSeconds: ttl };
  }

  /** Human-friendly age, e.g. "7 phút trước", "2 giờ trước". */
  formatAge(ageSeconds: number): string {
    if (!Number.isFinite(ageSeconds)) return 'không rõ thời điểm';
    if (ageSeconds < 90) return `${Math.round(ageSeconds)} giây trước`;
    if (ageSeconds < 5400) return `${Math.round(ageSeconds / 60)} phút trước`;
    if (ageSeconds < 172800) return `${Math.round(ageSeconds / 3600)} giờ trước`;
    return `${Math.round(ageSeconds / 86400)} ngày trước`;
  }

  /**
   * Given the memories recalled for a volatile query, return an injectable
   * warning listing stale price/market data that must NOT be reused. Returns ''
   * when nothing volatile is stale.
   */
  buildStaleWarning(
    memories: Array<{ content: string; timestamp: string; lastAccessed?: string }>,
    nowMs: number = Date.now(),
  ): { warning: string; hasStale: boolean } {
    const stale: string[] = [];
    for (const m of memories) {
      // Judge by when the DATA was captured (m.timestamp), NOT when we last read
      // it. lastAccessed is bumped to "now" on every recall, so using it would
      // make every just-recalled price look fresh — defeating the TTL.
      const v = this.judge(m.content, m.timestamp, nowMs);
      if (v.isStale) {
        stale.push(`  • "${m.content.slice(0, 70)}" — ${this.formatAge(v.ageSeconds)} (quá ${Math.round(v.ttlSeconds / 60)} phút)`);
      }
    }
    if (stale.length === 0) return { warning: '', hasStale: false };
    const warning = [
      `⏱️ Dữ liệu giá/thị trường trong trí nhớ đã CŨ (quá hạn ${Math.round((this.cfg.ttlSeconds.price ?? 300) / 60)} phút) — KHÔNG dùng lại con số này:`,
      ...stale,
      'Bắt buộc search giá/số liệu live NGAY rồi mới trả lời + dẫn nguồn + ghi thời điểm.',
    ].join('\n');
    return { warning, hasStale: true };
  }

}
