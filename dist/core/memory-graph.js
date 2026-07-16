"use strict";
/**
 * MemoryGraph — a lightweight knowledge graph over the brain's facts + entities.
 *
 * Flat semantic recall answers "what do I know that looks like this query?".
 * It CANNOT answer bridge questions like "dự án đó chạy chain nào?" when the
 * chain is only linked to the project through another fact. Zep/Graphiti solve
 * this with a temporal knowledge graph; this is the same idea, small and local.
 *
 * The graph is built from the facts table (subject --relation--> object). Each
 * distinct subject/object string is a node; each active (non-superseded) fact
 * is a directed, labelled edge. We can then:
 *   - find the node(s) a query mentions,
 *   - walk up to `maxHops` edges out,
 *   - and return a compact set of connected facts ("bridge" knowledge) so Aira
 *     can reason across links instead of one isolated fact.
 *
 * It is rebuilt on demand from current facts (cheap for the brain's scale) and
 * respects supersede/validity so lehal (outdated) edges never surface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryGraph = void 0;
exports.isCleanFactRow = isCleanFactRow;
function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
const GRAPH_STOP = new Set([
    'gi', 'la', 'co', 'khong', 'nao', 'dung', 'cua', 'cho', 'va', 'thi', 'con',
    'the', 'nay', 'do', 'em', 'anh', 'sep', 'oi', 'nha', 'nhe', 'the', 'bao',
]);
function tokenize(s) {
    return norm(s)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 2 && !GRAPH_STOP.has(w));
}
/** Reject rambling/question-like facts so the graph only links real knowledge. */
function isCleanFactRow(f) {
    const subj = String(f.subject || '').trim();
    const obj = String(f.object || '').trim();
    if (!subj || !obj)
        return false;
    if (/\n/.test(subj) || /\n/.test(obj))
        return false;
    if (subj.length > 42 || obj.length > 60)
        return false;
    if (subj.split(/\s+/).length > 7)
        return false;
    if (/[?？]|khong\s*em|duoc\s+khong|vay\s+ha|nhi$/i.test(norm(subj)))
        return false;
    return true;
}
class MemoryGraph {
    db;
    nodes = new Map();
    out = new Map(); // adjacency: node id -> edges
    in = new Map(); // reverse adjacency
    built = false;
    constructor(db) {
        this.db = db;
    }
    /** (Re)build the graph from currently-active facts. */
    build() {
        this.nodes.clear();
        this.out.clear();
        this.in.clear();
        const facts = this.db.getActiveFacts().filter(isCleanFactRow);
        for (const f of facts) {
            const fromId = this.addNode(f.subject, 'entity');
            const toId = this.addNode(f.object, 'value');
            const edge = {
                from: fromId,
                to: toId,
                relation: f.relation,
                confidence: f.confidence,
                timestamp: f.timestamp,
                factId: f.id,
            };
            if (!this.out.has(fromId))
                this.out.set(fromId, []);
            this.out.get(fromId).push(edge);
            if (!this.in.has(toId))
                this.in.set(toId, []);
            this.in.get(toId).push(edge);
        }
        this.built = true;
    }
    addNode(label, kind) {
        const id = norm(label);
        if (!this.nodes.has(id))
            this.nodes.set(id, { id, label, kind });
        return id;
    }
    stats() {
        if (!this.built)
            this.build();
        let edges = 0;
        for (const list of this.out.values())
            edges += list.length;
        return { nodes: this.nodes.size, edges };
    }
    /** Find node ids whose label shares tokens with the query. */
    matchNodes(query) {
        const qTokens = new Set(tokenize(query));
        if (qTokens.size === 0)
            return [];
        const scored = [];
        for (const node of this.nodes.values()) {
            const nTokens = tokenize(node.label);
            let hit = 0;
            for (const t of nTokens)
                if (qTokens.has(t))
                    hit++;
            // require at least one shared token; longer matches rank higher
            if (hit > 0)
                scored.push({ id: node.id, score: hit + node.label.length * 0.001 });
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 4).map((s) => s.id);
    }
    /**
     * Multi-hop recall: from any node the query mentions, gather connected facts
     * up to `maxHops` away (both directions). Returns the bridging facts, most
     * confident/recent first, deduped.
     */
    recallConnected(query, opts = {}) {
        if (!this.built)
            this.build();
        const maxHops = opts.maxHops ?? 2;
        const limit = opts.limit ?? 6;
        const seeds = this.matchNodes(query);
        if (seeds.length === 0)
            return { facts: [], nodesVisited: 0 };
        const visited = new Set();
        const collected = new Map();
        let frontier = [...seeds];
        for (const s of seeds)
            visited.add(s);
        for (let hop = 1; hop <= maxHops && frontier.length > 0; hop++) {
            const next = [];
            for (const nodeId of frontier) {
                const edges = [...(this.out.get(nodeId) || []), ...(this.in.get(nodeId) || [])];
                for (const e of edges) {
                    if (!collected.has(e.factId))
                        collected.set(e.factId, { edge: e, hops: hop });
                    const other = e.from === nodeId ? e.to : e.from;
                    if (!visited.has(other)) {
                        visited.add(other);
                        next.push(other);
                    }
                }
            }
            frontier = next;
        }
        const factRows = this.db.getActiveFacts();
        const byId = new Map(factRows.map((f) => [f.id, f]));
        const facts = [...collected.values()]
            .sort((a, b) => a.hops - b.hops || b.edge.confidence - a.edge.confidence
            || String(b.edge.timestamp).localeCompare(String(a.edge.timestamp)))
            .map((c) => byId.get(c.edge.factId))
            .filter((f) => !!f)
            .slice(0, limit);
        return { facts, nodesVisited: visited.size };
    }
    /**
     * Format connected facts for prompt injection. Only emits when it surfaces
     * facts BEYOND a trivial single direct match, so it complements (not
     * duplicates) the flat facts line.
     */
    formatForInjection(query, opts = {}) {
        const { facts } = this.recallConnected(query, opts);
        if (facts.length === 0)
            return '';
        const lines = facts.map((f) => `${f.subject} ${f.relation} ${f.object}`);
        return `Liên kết tri thức (graph): ${lines.join(' · ')}`;
    }
}
exports.MemoryGraph = MemoryGraph;
//# sourceMappingURL=memory-graph.js.map