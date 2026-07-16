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

import { createHash } from 'node:crypto';
import type { BrainDatabase } from '../storage/brain-db.js';
import { getEmbeddingService, EmbeddingService, cosineSim } from './embedding-service.js';

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

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function f32ToBuf(v: Float32Array): Buffer { return Buffer.from(v.buffer, v.byteOffset, v.byteLength); }
function bufToF32(b: Buffer): Float32Array { return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4)); }
function tokenize(s: string): string[] {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}

export class ConversationLog {
  private db: BrainDatabase;
  private embedder: ConvEmbedder | null;
  private service: EmbeddingService | null = null;
  private maxTurns: number;

  constructor(db: BrainDatabase, embedder: ConvEmbedder | null = null, maxTurns = 5000) {
    this.db = db;
    this.embedder = embedder;
    this.service = embedder ? getEmbeddingService() : null;
    this.maxTurns = maxTurns;
    this.ensureSchema();
  }

  private embedReady(): boolean { return !!this.embedder && this.embedder.isLoaded(); }

  private ensureSchema(): void {
    this.db.raw(`
      CREATE TABLE IF NOT EXISTS conversation_turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL DEFAULT '',
        user_name TEXT NOT NULL DEFAULT '',
        user_message TEXT NOT NULL,
        agent_response TEXT NOT NULL DEFAULT '',
        topic TEXT NOT NULL DEFAULT '',
        sentiment REAL NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        embedding BLOB,
        embed_model TEXT,
        embed_dim INTEGER
      );
    `);
    try { this.db.raw('ALTER TABLE conversation_turns ADD COLUMN embed_model TEXT'); } catch { /* exists */ }
    try { this.db.raw('ALTER TABLE conversation_turns ADD COLUMN embed_dim INTEGER'); } catch { /* exists */ }
    this.db.raw(`CREATE INDEX IF NOT EXISTS idx_conv_ts ON conversation_turns(timestamp);`);
    this.db.raw(`CREATE INDEX IF NOT EXISTS idx_conv_session ON conversation_turns(session_id);`);
  }

  size(): number {
    const r = this.db.raw(`SELECT COUNT(*) AS c FROM conversation_turns`) as Array<{ c: number }>;
    return r[0]?.c ?? 0;
  }

  /** Record one full turn (user + agent). Embeds for semantic recall. */
  async record(turn: {
    sessionId?: string; userId?: string; userName?: string;
    userMessage: string; agentResponse?: string; topic?: string;
    sentiment?: number; timestamp?: string;
  }): Promise<string> {
    const now = turn.timestamp || new Date().toISOString();
    const text = `${turn.userMessage}\n${turn.agentResponse || ''}`.trim();
    const hash = createHash('sha1').update(`${turn.sessionId || ''}|${text}`).digest('hex');

    // Skip exact-duplicate consecutive turns (avoid accidental double-logging).
    const dup = this.db.raw(`SELECT id FROM conversation_turns WHERE content_hash = ?`, [hash]) as any[];
    if (dup.length > 0) return dup[0].id;

    let embBuf: Buffer | null = null;
    let embModel: string | null = null;
    let embDim: number | null = null;
    if (this.service && this.embedReady()) {
      const ev = await this.service.embed(text);
      if (ev) { embBuf = f32ToBuf(ev.vector); embModel = ev.model; embDim = ev.dim; }
    }
    const id = `turn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    this.db.raw(
      `INSERT INTO conversation_turns (id, session_id, user_id, user_name, user_message, agent_response, topic, sentiment, timestamp, content_hash, embedding, embed_model, embed_dim)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, turn.sessionId || '', turn.userId || '', turn.userName || '',
       turn.userMessage, turn.agentResponse || '', turn.topic || '', turn.sentiment ?? 0, now, hash, embBuf, embModel, embDim]
    );
    this.trimIfNeeded();
    return id;
  }

  /** All turns since a timestamp (for self-distillation over real chat). */
  since(isoTimestamp: string, limit = 500): ConversationTurnRow[] {
    const rows = this.db.raw(
      `SELECT * FROM conversation_turns WHERE timestamp > ? ORDER BY timestamp ASC LIMIT ?`,
      [isoTimestamp, limit]
    ) as any[];
    return rows.map(rowToTurn);
  }

  /** Most recent turns (immediate context continuity). */
  recent(limit = 5, sessionId?: string): ConversationTurnRow[] {
    const rows = (sessionId
      ? this.db.raw(`SELECT * FROM conversation_turns WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?`, [sessionId, limit])
      : this.db.raw(`SELECT * FROM conversation_turns ORDER BY timestamp DESC LIMIT ?`, [limit])) as any[];
    return rows.map(rowToTurn).reverse(); // chronological
  }

  /** Semantic recall of past turns relevant to a query ("nhớ hồi đó..."). */
  async recall(query: string, limit = 4, minScore = 0.32): Promise<ConvRecallHit[]> {
    const rows = this.db.raw(`SELECT * FROM conversation_turns`) as any[];
    if (rows.length === 0) return [];
    const turns = rows.map(rowToTurn);

    if (this.service && this.embedReady()) {
      const qv = await this.service.embed(query);
      if (qv) {
        const hits: ConvRecallHit[] = [];
        for (let i = 0; i < rows.length; i++) {
          let emb: Float32Array | null = rows[i].embedding ? bufToF32(rows[i].embedding) : null;
          const sameSpace = this.service.compatible(rows[i].embed_model ?? null, rows[i].embed_dim ?? null)
            && !!emb && emb.length === qv.dim;
          if (!sameSpace) {
            const ev = await this.service.embed(`${turns[i].userMessage}\n${turns[i].agentResponse}`);
            if (ev) {
              emb = ev.vector;
              try { this.db.raw(`UPDATE conversation_turns SET embedding = ?, embed_model = ?, embed_dim = ? WHERE id = ?`, [f32ToBuf(ev.vector), ev.model, ev.dim, turns[i].id]); } catch { /* ok */ }
            }
          }
          const score = emb && emb.length === qv.vector.length ? cosineSim(qv.vector, emb) : 0;
          if (score >= minScore) hits.push({ turn: turns[i], score });
        }
        hits.sort((a, b) => b.score - a.score);
        return hits.slice(0, limit);
      }
    }

    // keyword fallback
    const qt = new Set(tokenize(query));
    const hits = turns.map((t) => {
      const et = new Set(tokenize(`${t.userMessage} ${t.agentResponse} ${t.topic}`));
      let ov = 0; for (const x of qt) if (et.has(x)) ov++;
      return { turn: t, score: ov / Math.sqrt((qt.size || 1) * (et.size || 1)) };
    }).filter((h) => h.score > 0.12);
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  /** Compact injection: recent context + any semantically-relevant older turns. */
  async buildContext(query: string, opts: { recent?: number; relevant?: number; sessionId?: string } = {}): Promise<string> {
    const recentTurns = this.recent(opts.recent ?? 3, opts.sessionId);
    const relevant = await this.recall(query, opts.relevant ?? 2);
    const recentIds = new Set(recentTurns.map((t) => t.id));
    const lines: string[] = [];

    if (recentTurns.length > 0) {
      lines.push('Ngữ cảnh gần đây:');
      for (const t of recentTurns) {
        lines.push(`  - Sếp: ${t.userMessage.slice(0, 80)}${t.agentResponse ? ` | Aira: ${t.agentResponse.slice(0, 60)}` : ''}`);
      }
    }
    const olderRelevant = relevant.filter((h) => !recentIds.has(h.turn.id));
    if (olderRelevant.length > 0) {
      lines.push('Nhớ lại liên quan:');
      for (const h of olderRelevant) {
        lines.push(`  - (${h.turn.timestamp.slice(0, 10)}) Sếp: ${h.turn.userMessage.slice(0, 80)}`);
      }
    }
    return lines.join('\n');
  }

  /** Keep the log bounded: drop oldest turns beyond maxTurns. */
  private trimIfNeeded(): void {
    const n = this.size();
    if (n <= this.maxTurns) return;
    const over = n - this.maxTurns;
    this.db.raw(
      `DELETE FROM conversation_turns WHERE id IN (
         SELECT id FROM conversation_turns ORDER BY timestamp ASC LIMIT ?
       )`, [over]
    );
  }
}

function rowToTurn(r: any): ConversationTurnRow {
  return {
    id: r.id, sessionId: r.session_id, userId: r.user_id, userName: r.user_name,
    userMessage: r.user_message, agentResponse: r.agent_response, topic: r.topic,
    sentiment: r.sentiment, timestamp: r.timestamp,
  };
}
