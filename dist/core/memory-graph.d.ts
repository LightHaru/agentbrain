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
import type { BrainDatabase, FactRow } from '../storage/brain-db.js';
export interface GraphNode {
    id: string;
    label: string;
    kind: 'entity' | 'value';
}
export interface GraphEdge {
    from: string;
    to: string;
    relation: string;
    confidence: number;
    timestamp: string;
    factId: string;
}
export interface GraphPath {
    facts: FactRow[];
    hops: number;
}
export interface ConnectedResult {
    facts: FactRow[];
    nodesVisited: number;
}
/** Reject rambling/question-like facts so the graph only links real knowledge. */
export declare function isCleanFactRow(f: {
    subject?: string;
    object?: string;
}): boolean;
export declare class MemoryGraph {
    private db;
    private nodes;
    private out;
    private in;
    private built;
    constructor(db: BrainDatabase);
    /** (Re)build the graph from currently-active facts. */
    build(): void;
    private addNode;
    stats(): {
        nodes: number;
        edges: number;
    };
    /** Find node ids whose label shares tokens with the query. */
    private matchNodes;
    /**
     * Multi-hop recall: from any node the query mentions, gather connected facts
     * up to `maxHops` away (both directions). Returns the bridging facts, most
     * confident/recent first, deduped.
     */
    recallConnected(query: string, opts?: {
        maxHops?: number;
        limit?: number;
    }): ConnectedResult;
    /**
     * Format connected facts for prompt injection. Only emits when it surfaces
     * facts BEYOND a trivial single direct match, so it complements (not
     * duplicates) the flat facts line.
     */
    formatForInjection(query: string, opts?: {
        maxHops?: number;
        limit?: number;
    }): string;
}
//# sourceMappingURL=memory-graph.d.ts.map