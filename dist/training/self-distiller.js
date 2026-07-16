"use strict";
/**
 * SelfDistiller — AgentBrain distills NEW knowledge from its own real,
 * successful conversations, so it keeps getting smarter over time (not just
 * from the one-time Opus seed).
 *
 * How it stays trustworthy and lean:
 *   - only learns from turns with a POSITIVE outcome signal (user sentiment /
 *     explicit praise) — mistakes are handled by the Error Ledger instead
 *   - extracts durable, generalizable knowledge (stated preferences, decisions,
 *     stable facts), not ephemeral chatter
 *   - writes through the KnowledgeStore, which dedups by content hash and
 *     prunes low-value items → no bloat
 *   - watermarks the last processed timestamp so each run only handles new chat
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfDistiller = void 0;
const WATERMARK_FILE = 'learning/self-distill-watermark.md';
/** Patterns that mark durable, worth-remembering user statements. */
const PREFERENCE_RE = /\b(thích|prefer|muốn|luôn luôn|always|đừng bao giờ|never|nhớ là|remember|từ giờ|from now|quy tắc|rule|ưu tiên|chỉ dùng|only use|dùng .* thay vì)\b/i;
const DECISION_RE = /\b(chốt|quyết định|decide[d]?|đồng ý|agree|ok luôn|dùng .* nhé|sẽ dùng|go with|thống nhất)\b/i;
const FACT_RE = /\b(là|is|are|bằng|gồm|có nghĩa|means|viết tắt|stands for|địa chỉ|address|url|token|contract|repo|domain)\b/i;
class SelfDistiller {
    knowledge;
    log;
    store;
    constructor(knowledge, log, store = null) {
        this.knowledge = knowledge;
        this.log = log;
        this.store = store;
    }
    async getWatermark() {
        if (!this.store)
            return '1970-01-01T00:00:00.000Z';
        try {
            const raw = await this.store.readFile(WATERMARK_FILE);
            if (raw) {
                const o = JSON.parse(raw);
                if (o.ts)
                    return o.ts;
            }
        }
        catch { /* ignore */ }
        return '1970-01-01T00:00:00.000Z';
    }
    async setWatermark(ts) {
        if (!this.store)
            return;
        try {
            await this.store.writeFile(WATERMARK_FILE, JSON.stringify({ ts }));
        }
        catch { /* ignore */ }
    }
    /**
     * Classify what durable knowledge (if any) a successful turn carries.
     * Returns null for ephemeral/low-value turns.
     */
    classify(turn) {
        const msg = (turn.userMessage || '').trim();
        if (msg.length < 12)
            return null; // too short to be durable knowledge
        if (PREFERENCE_RE.test(msg) || DECISION_RE.test(msg)) {
            return {
                kind: 'lesson',
                title: `Sếp preference/decision: ${msg.slice(0, 70)}`,
                content: `Người dùng đã nêu (được xác nhận tốt): ${msg}`,
                tags: ['self-distilled', 'preference'],
            };
        }
        if (FACT_RE.test(msg) && msg.length >= 20) {
            return {
                kind: 'fact',
                title: msg.slice(0, 70),
                content: msg,
                tags: ['self-distilled', 'fact'],
            };
        }
        return null;
    }
    /**
     * Run one self-distillation pass over conversations newer than the watermark.
     * Only positive-outcome turns produce knowledge. Returns a report.
     */
    async run(opts = {}) {
        const minSentiment = opts.minSentiment ?? 0.25;
        const from = await this.getWatermark();
        const turns = this.log.since(from, opts.limit ?? 500);
        let learned = 0;
        let skipped = 0;
        let maxTs = from;
        for (const turn of turns) {
            if (turn.timestamp > maxTs)
                maxTs = turn.timestamp;
            // Only learn from turns that went WELL (positive signal). Negative turns
            // are the Error Ledger's job, not knowledge to imitate.
            if ((turn.sentiment ?? 0) < minSentiment) {
                skipped++;
                continue;
            }
            const k = this.classify(turn);
            if (!k) {
                skipped++;
                continue;
            }
            const res = await this.knowledge.upsert({
                kind: k.kind, title: k.title, content: k.content,
                tags: k.tags, source: 'self-distilled:conversation',
                confidence: 0.6, timestamp: turn.timestamp,
            });
            if (res.created)
                learned++;
            else
                skipped++;
        }
        await this.setWatermark(maxTs);
        return {
            scanned: turns.length, learned, skipped,
            fromTimestamp: from, toTimestamp: maxTs,
        };
    }
}
exports.SelfDistiller = SelfDistiller;
//# sourceMappingURL=self-distiller.js.map