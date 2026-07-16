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
import { synonymsForToken, sharesSynonym } from './synonym-expander.js';

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

const STOP = new Set([
  'the','a','an','and','or','but','to','of','in','on','at','for','is','are','was','were',
  'em','sếp','anh','của','và','có','được','là','thì','cho','một','các','này','đó','ơi','nha','nhé',
]);

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP.has(w)),
  );
}

export class RelevanceCritic {
  critique(memories: Memory[], opts: CritiqueOptions): CritiqueResult {
    const minKeep = opts.minKeepScore ?? 0.18;
    const staleDays = opts.staleDays ?? 45;
    const maxKeep = opts.maxKeep ?? 6;
    const qTokens = tokens(opts.query);

    const scored: ScoredMemory[] = memories.map(m => {
      const mTokens = tokens(m.content);
      // Lexical overlap (Jaccard-ish, biased toward query coverage). A query
      // token counts as covered if the memory shares it OR shares one of its
      // domain synonyms ("database"↔"postgres", "timezone"↔"mui gio").
      let overlap = 0;
      for (const t of qTokens) {
        if (mTokens.has(t) || synonymsForToken(t).some(s => mTokens.has(s))) overlap++;
      }
      let coverage = qTokens.size > 0 ? overlap / qTokens.size : 0;

      // Multi-word domain synonyms (e.g. "lưu dữ liệu" ↔ "database") share no
      // tokens, so token overlap misses them. Credit a floor coverage when the
      // query and memory are linked by such a synonym, so the zero-overlap gate
      // below does not wrongly discard the intended memory.
      if (coverage === 0 && sharesSynonym(opts.query, m.content)) {
        coverage = 0.5;
      }

      const ageDays = this.daysSince(m.lastAccessed || m.timestamp);
      const fresh = ageDays <= staleDays;
      const recencyBoost = Math.max(0, 0.15 - ageDays * 0.002);
      const stalePenalty = !fresh && !opts.wantsHistory ? 0.15 : 0;
      const accessBoost = Math.min(0.1, m.accessCount * 0.01);

      // Confidence and lexical relevance are the backbone; the rest are nudges.
      const score = Math.max(
        0,
        0.45 * coverage +
        0.35 * m.confidence +
        recencyBoost +
        accessBoost -
        stalePenalty,
      );

      // Relevance gate: a memory with ZERO lexical overlap with the query is
      // almost never worth injecting, no matter how fresh/confident it is.
      // Down-weight it hard so recency/confidence nudges cannot rescue noise.
      const gated = coverage === 0 ? score * 0.3 : score;

      return { memory: m, score: gated, fresh };
    });

    scored.sort((a, b) => b.score - a.score);

    const kept: Memory[] = [];
    const dropped: Memory[] = [];
    for (const s of scored) {
      if (s.score >= minKeep && kept.length < maxKeep) kept.push(s.memory);
      else dropped.push(s.memory);
    }

    const conflicts = this.detectConflicts(kept);
    const weak = kept.length === 0 || scored.every(s => s.score < minKeep + 0.05);

    return { kept, dropped, conflicts, weak };
  }

  /**
   * Detect likely contradictions among kept memories: same subject/entity but
   * conflicting numeric values (prices, versions, counts). Cheap heuristic.
   */
  private detectConflicts(memories: Memory[]): string[] {
    const conflicts: string[] = [];
    const numRe = /(\$?\d[\d.,]*)\s*(usd|usdt|prl|th\/s|gh\/s|gb|tb|%|version|v)?/gi;

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        const a = memories[i], b = memories[j];
        const aT = tokens(a.content), bT = tokens(b.content);
        // Shared subject tokens (need meaningful overlap to be "same topic").
        let shared = 0;
        for (const t of aT) if (bT.has(t)) shared++;
        if (shared < 2) continue;

        const aNums = (a.content.match(numRe) || []).map(x => x.trim());
        const bNums = (b.content.match(numRe) || []).map(x => x.trim());
        if (aNums.length && bNums.length) {
          const same = aNums.some(x => bNums.includes(x));
          if (!same) {
            // Resolve by recency instead of just flagging both: whichever memory
            // was written/updated more recently is the one to trust. Aira still
            // sees the conflict, but with an explicit "use the newer" steer so it
            // doesn't average two contradictory values.
            const [newer, older] = this.byRecency(a, b);
            conflicts.push(
              `⚠️ Trí nhớ mâu thuẫn cùng chủ đề — ưu tiên bản MỚI: "${newer.content.slice(0, 50)}" (bỏ qua bản cũ: "${older.content.slice(0, 50)}"). Đừng trộn hai giá trị.`,
            );
          }
        }
      }
    }
    return conflicts.slice(0, 2);
  }

  /** Return [newer, older] by lastAccessed/timestamp. */
  private byRecency(a: Memory, b: Memory): [Memory, Memory] {
    const ta = Date.parse(a.lastAccessed || a.timestamp) || 0;
    const tb = Date.parse(b.lastAccessed || b.timestamp) || 0;
    return ta >= tb ? [a, b] : [b, a];
  }

  /** Format critic output for prompt injection (compact). */
  formatForInjection(result: CritiqueResult): string {
    if (result.conflicts.length === 0 && !result.weak) return '';
    const lines: string[] = [];
    for (const c of result.conflicts) lines.push(c);
    if (result.weak) {
      lines.push('Trí nhớ liên quan yếu/không chắc: nói rõ điều chưa biết thay vì đoán; cân nhắc search hoặc hỏi lại.');
    }
    return lines.join('\n');
  }

  private daysSince(iso: string): number {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return 999;
    return Math.max(0, (Date.now() - t) / 86400_000);
  }
}
