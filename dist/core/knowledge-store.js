"use strict";
/**
 * KnowledgeStore — the durable, searchable brain of distilled knowledge.
 *
 * This is how real systems store distilled/RAG knowledge: each item is a row
 * with its own EMBEDDING, searched by semantic similarity (local MiniLM), not a
 * JSON blob. It is designed to stay SMART and NOT bloat:
 *   - content-hash dedup: identical knowledge is never stored twice
 *   - reinforcement: re-adding raises confidence + usefulness instead of duping
 *   - usage tracking: useCount/lastUsed recorded on every retrieval
 *   - pruning: low-value items (never used, low confidence, superseded) are
 *     dropped so the store reflects what actually helps Aira
 *
 * Kinds: 'playbook' (reasoning frame), 'lesson' (do/don't), 'error' (mistake+fix),
 * 'procedure' (how-to), 'fact' (durable knowledge).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeStore = void 0;
const node_crypto_1 = require("node:crypto");
const embedding_service_js_1 = require("./embedding-service.js");
function sha1(s) {
    return (0, node_crypto_1.createHash)('sha1').update(s).digest('hex');
}
function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0)
        return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function f32ToBuf(v) {
    return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}
function bufToF32(b) {
    return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4));
}
class KnowledgeStore {
    db;
    embedder;
    service;
    constructor(db, embedder = null) {
        this.db = db;
        this.embedder = embedder;
        // When a real embedder is provided, route through the shared service so all
        // stored vectors are unit-normalized and tagged with model + dim.
        this.service = embedder ? (0, embedding_service_js_1.getEmbeddingService)() : null;
        this.ensureSchema();
    }
    embedReady() {
        return !!this.embedder && this.embedder.isLoaded();
    }
    ensureSchema() {
        this.db.raw(`
      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        payload TEXT NOT NULL DEFAULT '{}',
        tags TEXT NOT NULL DEFAULT '[]',
        source TEXT NOT NULL DEFAULT '',
        confidence REAL NOT NULL DEFAULT 0.6,
        use_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_used TEXT NOT NULL DEFAULT '',
        content_hash TEXT NOT NULL UNIQUE,
        embedding BLOB,
        embed_model TEXT,
        embed_dim INTEGER
      );
    `);
        // Backfill columns for older DBs (ignore if they already exist).
        try {
            this.db.raw('ALTER TABLE knowledge ADD COLUMN embed_model TEXT');
        }
        catch { /* exists */ }
        try {
            this.db.raw('ALTER TABLE knowledge ADD COLUMN embed_dim INTEGER');
        }
        catch { /* exists */ }
        this.db.raw(`CREATE INDEX IF NOT EXISTS idx_knowledge_kind ON knowledge(kind);`);
        this.db.raw(`CREATE INDEX IF NOT EXISTS idx_knowledge_hash ON knowledge(content_hash);`);
    }
    size() {
        const rows = this.db.raw(`SELECT COUNT(*) AS c FROM knowledge`);
        return rows[0]?.c ?? 0;
    }
    countByKind() {
        const rows = this.db.raw(`SELECT kind, COUNT(*) AS c FROM knowledge GROUP BY kind`);
        const out = {};
        for (const r of rows)
            out[r.kind] = r.c;
        return out;
    }
    /**
     * Upsert a knowledge item. Dedup by content hash: an identical item is
     * REINFORCED (confidence + a small bump, useCount preserved) rather than
     * duplicated — this is the core anti-bloat guarantee.
     */
    async upsert(input) {
        const now = input.timestamp || new Date().toISOString();
        const hash = sha1(`${input.kind}|${input.content.trim().toLowerCase()}`);
        const existing = this.db.raw(`SELECT id, confidence FROM knowledge WHERE content_hash = ?`, [hash]);
        if (existing.length > 0) {
            const row = existing[0];
            const newConf = Math.min(1, row.confidence + 0.03);
            this.db.raw(`UPDATE knowledge SET confidence = ?, last_used = last_used WHERE id = ?`, [newConf, row.id]);
            return { id: row.id, created: false };
        }
        const id = `kn-${input.kind}-${sha1(input.title + now).slice(0, 10)}`;
        let embBuf = null;
        let embModel = null;
        let embDim = null;
        if (this.service && this.embedReady()) {
            const ev = await this.service.embed(input.content);
            if (ev) {
                embBuf = f32ToBuf(ev.vector);
                embModel = ev.model;
                embDim = ev.dim;
            }
        }
        this.db.raw(`INSERT INTO knowledge (id, kind, title, content, payload, tags, source, confidence, use_count, created_at, last_used, content_hash, embedding, embed_model, embed_dim)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, '', ?, ?, ?, ?)`, [
            id, input.kind, input.title, input.content,
            JSON.stringify(input.payload ?? {}), JSON.stringify(input.tags ?? []),
            input.source ?? '', input.confidence ?? 0.6, now, hash, embBuf, embModel, embDim,
        ]);
        return { id, created: true };
    }
    rowToItem(r) {
        return {
            id: r.id, kind: r.kind, title: r.title, content: r.content,
            payload: safeJson(r.payload), tags: safeJson(r.tags) || [], source: r.source,
            confidence: r.confidence, useCount: r.use_count, createdAt: r.created_at,
            lastUsed: r.last_used, contentHash: r.content_hash,
            embedding: r.embedding ? bufToF32(r.embedding) : null,
            embedModel: r.embed_model ?? null, embedDim: r.embed_dim ?? null,
        };
    }
    /**
     * Semantic search over knowledge (local embeddings). Falls back to keyword
     * overlap when the model isn't loaded. Records usage on the hits returned.
     */
    async search(query, opts = {}) {
        const limit = opts.limit ?? 5;
        const minScore = opts.minScore ?? 0.3;
        const where = opts.kind ? `WHERE kind = ?` : ``;
        const rows = (opts.kind
            ? this.db.raw(`SELECT * FROM knowledge ${where}`, [opts.kind])
            : this.db.raw(`SELECT * FROM knowledge`));
        if (rows.length === 0)
            return [];
        const items = rows.map((r) => this.rowToItem(r));
        let hits = [];
        if (this.service && this.embedReady()) {
            const qv = await this.service.embed(query);
            if (qv) {
                for (const it of items) {
                    let emb = it.embedding;
                    // Only trust a stored vector from the SAME model + dim; otherwise
                    // re-embed it so we never compare across incompatible vector spaces.
                    const sameSpace = this.service.compatible(it.embedModel ?? null, it.embedDim ?? null)
                        && !!emb && emb.length === qv.dim;
                    if (!sameSpace) {
                        const rev = await this.service.embed(it.content);
                        if (rev) {
                            emb = rev.vector;
                            this.persistEmbedding(it.id, rev.vector, rev.model, rev.dim);
                        }
                    }
                    const sim = emb && emb.length === qv.vector.length ? cosine(qv.vector, emb) : 0;
                    const score = sim * (0.7 + 0.3 * it.confidence);
                    if (score >= minScore)
                        hits.push({ item: it, score });
                }
            }
        }
        if (hits.length === 0) {
            // keyword fallback
            const qt = new Set(tokenize(query));
            for (const it of items) {
                const et = new Set(tokenize(`${it.title} ${it.content} ${it.tags.join(' ')}`));
                let overlap = 0;
                for (const t of qt)
                    if (et.has(t))
                        overlap++;
                const score = (overlap / Math.sqrt((qt.size || 1) * (et.size || 1))) * (0.7 + 0.3 * it.confidence);
                if (score > 0.12)
                    hits.push({ item: it, score });
            }
        }
        hits.sort((a, b) => b.score - a.score);
        hits = hits.slice(0, limit);
        this.recordUsage(hits.map((h) => h.item.id));
        return hits;
    }
    persistEmbedding(id, v, model, dim) {
        try {
            this.db.raw(`UPDATE knowledge SET embedding = ?, embed_model = ?, embed_dim = ? WHERE id = ?`, [f32ToBuf(v), model, dim, id]);
        }
        catch { /* ok */ }
    }
    recordUsage(ids) {
        if (ids.length === 0)
            return;
        const now = new Date().toISOString();
        for (const id of ids) {
            this.db.raw(`UPDATE knowledge SET use_count = use_count + 1, last_used = ? WHERE id = ?`, [now, id]);
        }
    }
    /**
     * Prune low-value knowledge so the store stays lean and smart.
     * Removes items that are old, never used, AND low confidence.
     */
    prune(opts = {}) {
        const maxAgeDays = opts.maxAgeDays ?? 30;
        const minConfidence = opts.minConfidence ?? 0.4;
        const cutoff = new Date(Date.now() - maxAgeDays * 86400_000).toISOString();
        const res = this.db.raw(`DELETE FROM knowledge WHERE use_count = 0 AND confidence < ? AND created_at < ?`, [minConfidence, cutoff]);
        return typeof res?.changes === 'number' ? res.changes : 0;
    }
    getAll(kind) {
        const rows = (kind
            ? this.db.raw(`SELECT * FROM knowledge WHERE kind = ? ORDER BY confidence DESC`, [kind])
            : this.db.raw(`SELECT * FROM knowledge ORDER BY confidence DESC`));
        return rows.map((r) => this.rowToItem(r));
    }
}
exports.KnowledgeStore = KnowledgeStore;
function tokenize(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z0-9]+/).filter((w) => w.length > 2);
}
function safeJson(s) {
    try {
        return JSON.parse(s);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=knowledge-store.js.map