"use strict";
/**
 * FactChangeTracker — surfaces "this fact CHANGED" to Aira.
 *
 * The brain already supersedes an old fact when a conflicting new one arrives
 * (KnowledgeExtractor.detectCorrections + db.supersedeFact). But it did that
 * SILENTLY: only current facts were injected, so Aira had no signal that a
 * value used to be different and was updated. That matters because Aira might
 * still have the old value in the running conversation and blend them.
 *
 * This tracker looks at recently-superseded facts relevant to the current
 * message and injects a compact reminder: "X đã đổi: <old> → <new>, dùng giá
 * trị mới". Graphiti/Zep call this temporal invalidation; here it is a cheap,
 * local, deterministic note.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactChangeTracker = void 0;
const memory_graph_js_1 = require("./memory-graph.js");
function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function tokens(s) {
    return new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 2));
}
class FactChangeTracker {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Recent fact changes relevant to `query` (shares a token with subject/object).
     * Only returns changes where a current replacement value actually exists and
     * differs from the old value.
     */
    relevantChanges(query, opts = {}) {
        const sinceMs = opts.sinceMs ?? 30 * 86400_000;
        const limit = opts.limit ?? 3;
        const qTokens = tokens(query);
        if (qTokens.size === 0)
            return [];
        const rows = this.db.getRecentlySupersededFacts(sinceMs);
        const changes = [];
        const seen = new Set();
        // Only crisp value-assignment relations make a meaningful "X changed to Y"
        // note; fuzzy ones like "prefers <clause>" are not clean value changes.
        const CRISP = new Set(['is', 'uses', 'runs_on', 'costs', 'balance', 'codename']);
        for (const { old, current } of rows) {
            if (!current)
                continue;
            if (!(0, memory_graph_js_1.isCleanFactRow)(old) || !(0, memory_graph_js_1.isCleanFactRow)(current))
                continue;
            if (!CRISP.has(old.relation) && !CRISP.has(current.relation))
                continue;
            // Values should look like concise values, not rambling clauses.
            if (old.object.split(/\s+/).length > 6 || current.object.split(/\s+/).length > 6)
                continue;
            if (norm(old.object) === norm(current.object))
                continue; // no real value change
            const hay = tokens(`${old.subject} ${old.relation} ${old.object} ${current.object}`);
            let overlap = 0;
            for (const t of qTokens)
                if (hay.has(t))
                    overlap++;
            if (overlap === 0)
                continue;
            // Dedup on the OLD→NEW value transition so differently-phrased subjects
            // ("dự án" vs "database chính của dự án") don't double-report the same change.
            const key = `${norm(old.relation)}|${norm(old.object)}|${norm(current.object)}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            changes.push({
                subject: old.subject,
                relation: old.relation,
                oldValue: old.object,
                newValue: current.object,
                changedAt: old.valid_until || current.timestamp,
            });
        }
        return changes.slice(0, limit);
    }
    formatForInjection(changes) {
        if (changes.length === 0)
            return '';
        const lines = changes.map((c) => `  • ${c.subject} ${c.relation}: "${c.oldValue}" → "${c.newValue}" (đã cập nhật, dùng giá trị MỚI)`);
        return `⚠️ Thông tin đã thay đổi:\n${lines.join('\n')}`;
    }
}
exports.FactChangeTracker = FactChangeTracker;
//# sourceMappingURL=fact-change-tracker.js.map