/**
 * Semantic Playbook Matcher — makes AgentBrain understand INTENT, not keywords.
 *
 * The regex matcher in reasoning-playbooks.ts is precise but brittle: a slightly
 * different phrasing ("trang web trắng bóc, console báo lỗi") misses the debug
 * playbook even though it clearly IS a debugging situation. This matcher uses
 * the local MiniLM embedding model (already running on CPU for memory recall)
 * to compare the user's message against each playbook's `intentAnchors` by
 * cosine similarity. Anything above a threshold is treated as a match.
 *
 * Effect: distilled reasoning generalizes to unseen wording → higher held-out
 * benchmark → the brain is genuinely smarter, powered by a local model, no API.
 *
 * It layers ON TOP of regex (union of both), never replaces it, and degrades
 * gracefully to regex-only if the model isn't loaded.
 */

import { EmbeddingEngine } from './embedding-engine.js';
import { matchReasoningPlaybooks, REASONING_PLAYBOOKS, getLearnedPlaybooks, type ReasoningPlaybook } from './reasoning-playbooks.js';

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface SemanticMatchOptions {
  /** cosine threshold above which an anchor counts as a match (0..1). */
  threshold?: number;
  /** cap how many playbooks the semantic pass can add. */
  maxAdd?: number;
}

export class SemanticPlaybookMatcher {
  private engine: EmbeddingEngine;
  private threshold: number;
  private maxAdd: number;
  /** cache: playbookId -> anchor embeddings */
  private anchorCache = new Map<string, Float32Array[]>();
  private ready = false;

  constructor(engine: EmbeddingEngine, opts: SemanticMatchOptions = {}) {
    this.engine = engine;
    this.threshold = opts.threshold ?? 0.45;
    this.maxAdd = opts.maxAdd ?? 3;
  }

  /** True once the model is loaded and anchors are embedded. */
  isReady(): boolean {
    return this.ready && this.engine.isLoaded();
  }

  /** Pre-embed all playbook intent anchors. Safe to call repeatedly. */
  async warmup(playbooks: ReasoningPlaybook[] = allPlaybooks()): Promise<boolean> {
    // Force the model to load by embedding a probe.
    const probe = await this.engine.embed('warmup');
    if (!probe || this.engine.hasFailed()) return false;

    for (const pb of playbooks) {
      if (!pb.intentAnchors || pb.intentAnchors.length === 0) continue;
      if (this.anchorCache.has(pb.id)) continue;
      const embs = await this.engine.embedBatch(pb.intentAnchors);
      const valid = embs.filter((e): e is Float32Array => e !== null);
      if (valid.length > 0) this.anchorCache.set(pb.id, valid);
    }
    this.ready = this.anchorCache.size > 0;
    return this.ready;
  }

  /**
   * Return the union of regex matches + semantic matches for a message.
   * Falls back to regex-only if the model isn't ready.
   */
  async match(message: string, playbooks: ReasoningPlaybook[] = allPlaybooks()): Promise<ReasoningPlaybook[]> {
    const regexMatches = matchReasoningPlaybooks(message);
    if (!this.isReady()) return regexMatches;

    const msgEmb = await this.engine.embed(message);
    if (!msgEmb) return regexMatches;

    const matchedIds = new Set(regexMatches.map((p) => p.id));
    const scored: Array<{ pb: ReasoningPlaybook; score: number }> = [];

    for (const pb of playbooks) {
      if (matchedIds.has(pb.id)) continue;
      const anchors = this.anchorCache.get(pb.id);
      if (!anchors) continue;
      let best = 0;
      for (const a of anchors) best = Math.max(best, cosine(msgEmb, a));
      if (best >= this.threshold) scored.push({ pb, score: best });
    }

    scored.sort((x, y) => y.score - x.score);
    const added = scored.slice(0, this.maxAdd).map((s) => s.pb);
    return [...regexMatches, ...added];
  }

  /** Score a single message against a playbook's anchors (for diagnostics/tests). */
  async bestScore(message: string, playbookId: string): Promise<number> {
    if (!this.isReady()) return 0;
    const msgEmb = await this.engine.embed(message);
    const anchors = this.anchorCache.get(playbookId);
    if (!msgEmb || !anchors) return 0;
    let best = 0;
    for (const a of anchors) best = Math.max(best, cosine(msgEmb, a));
    return best;
  }
}

export function allPlaybooks(): ReasoningPlaybook[] {
  return [...REASONING_PLAYBOOKS, ...getLearnedPlaybooks()];
}
