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
  context: string;        // what was being attempted
  mistake: string;        // what went wrong
  rootCause: string;      // why it happened (if known)
  fix: string;            // the fix that resolved it
  tags: string[];
  occurrences: number;    // how many times this mistake recurred
  confidence: number;     // 0..1, rises with recurrence + successful fixes
  firstSeen: string;
  lastSeen: string;
  embedding?: number[];   // optional cached MiniLM embedding of context+mistake
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

const LEDGER_FILE = 'learning/error-ledger.md';

function cosine(a: number[] | Float32Array, b: number[] | Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function tokenize(s: string): string[] {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}

export class ErrorLedger {
  private entries: ErrorEntry[] = [];
  private store: ErrorLedgerStore | null;
  private embedder: LedgerEmbedder | null;

  constructor(store: ErrorLedgerStore | null = null, embedder: LedgerEmbedder | null = null) {
    this.store = store;
    this.embedder = embedder;
  }

  async initialize(): Promise<void> {
    if (!this.store) return;
    try {
      const raw = await this.store.readFile(LEDGER_FILE);
      if (raw) this.entries = JSON.parse(raw);
    } catch { /* start empty */ }
  }

  async persist(): Promise<void> {
    if (!this.store) return;
    try { await this.store.writeFile(LEDGER_FILE, JSON.stringify(this.entries, null, 2)); } catch { /* best-effort */ }
  }

  getAll(): ErrorEntry[] { return this.entries.map((e) => ({ ...e })); }
  size(): number { return this.entries.length; }

  /**
   * Record a mistake + its fix. If a very similar mistake already exists, it is
   * reinforced (occurrences++, confidence up) instead of duplicated.
   */
  async record(input: {
    context: string; mistake: string; rootCause?: string; fix: string;
    tags?: string[]; timestamp?: string;
  }): Promise<ErrorEntry> {
    const now = input.timestamp || new Date().toISOString();
    const existing = this.findSimilar(`${input.context} ${input.mistake}`, 0.62);
    if (existing) {
      existing.occurrences++;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.lastSeen = now;
      if (input.fix && input.fix.length > existing.fix.length) existing.fix = input.fix;
      if (input.rootCause && !existing.rootCause) existing.rootCause = input.rootCause;
      await this.persist();
      return existing;
    }
    const entry: ErrorEntry = {
      id: `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      context: input.context,
      mistake: input.mistake,
      rootCause: input.rootCause || '',
      fix: input.fix,
      tags: input.tags || [],
      occurrences: 1,
      confidence: 0.6,
      firstSeen: now,
      lastSeen: now,
    };
    if (this.embedder?.isLoaded()) {
      const emb = await this.embedder.embed(`${entry.context} ${entry.mistake}`);
      if (emb) entry.embedding = Array.from(emb);
    }
    this.entries.push(entry);
    await this.persist();
    return entry;
  }

  /** Keyword-based similarity fallback (always available). */
  private findSimilar(query: string, threshold: number): ErrorEntry | null {
    const qt = new Set(tokenize(query));
    if (qt.size === 0) return null;
    let best: ErrorEntry | null = null;
    let bestScore = 0;
    for (const e of this.entries) {
      const et = new Set(tokenize(`${e.context} ${e.mistake}`));
      let overlap = 0;
      for (const t of qt) if (et.has(t)) overlap++;
      const score = overlap / Math.sqrt(qt.size * (et.size || 1));
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return bestScore >= threshold ? best : null;
  }

  /**
   * Recall the most relevant past mistakes for the current task. Uses local
   * MiniLM embeddings when available, else keyword overlap.
   */
  async recall(query: string, limit = 3): Promise<ErrorEntry[]> {
    if (this.entries.length === 0) return [];

    if (this.embedder?.isLoaded()) {
      const q = await this.embedder.embed(query);
      if (q) {
        const scored = await Promise.all(this.entries.map(async (e) => {
          let emb = e.embedding;
          if (!emb) {
            const v = await this.embedder!.embed(`${e.context} ${e.mistake}`);
            if (v) { emb = Array.from(v); e.embedding = emb; }
          }
          const score = emb ? cosine(q, emb) : 0;
          return { e, score: score * (0.6 + 0.4 * e.confidence) };
        }));
        return scored.filter((x) => x.score >= 0.30).sort((a, b) => b.score - a.score)
          .slice(0, limit).map((x) => x.e);
      }
    }

    // Keyword fallback
    const qt = new Set(tokenize(query));
    const scored = this.entries.map((e) => {
      const et = new Set(tokenize(`${e.context} ${e.mistake} ${e.tags.join(' ')}`));
      let overlap = 0;
      for (const t of qt) if (et.has(t)) overlap++;
      return { e, score: (overlap / Math.sqrt((qt.size || 1) * (et.size || 1))) * (0.6 + 0.4 * e.confidence) };
    });
    return scored.filter((x) => x.score > 0.15).sort((a, b) => b.score - a.score)
      .slice(0, limit).map((x) => x.e);
  }

  /** Format recalled mistakes as a compact reminder for Aira's prompt. */
  formatForInjection(entries: ErrorEntry[]): string {
    if (entries.length === 0) return '';
    const lines = entries.map((e) => {
      const cause = e.rootCause ? ` (nguyên nhân: ${e.rootCause})` : '';
      return `  ⚠️ Lỗi cũ: ${e.mistake}${cause} → Cách sửa: ${e.fix}`;
    });
    return `Bài học từ lỗi đã mắc (đừng lặp lại):\n${lines.join('\n')}`;
  }

  /** Bulk-load (e.g. from distillation seed). */
  load(entries: ErrorEntry[]): void { this.entries = entries; }
}
