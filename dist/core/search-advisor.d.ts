/**
 * SearchAdvisor — decide when Aira MUST search before answering.
 *
 * The single biggest failure mode of a memory-equipped agent is confident
 * recall of stale or unknown facts. Market memory systems (mem0 temporal
 * reasoning, Graphiti validity windows, Self-RAG "decide-to-retrieve") all
 * converge on the same idea: some questions are time-sensitive or fact-heavy
 * and the model's parametric + remembered knowledge is NOT enough. For those,
 * external retrieval (web search / live tools) is mandatory.
 *
 * This module classifies the query and, when appropriate, emits a directive
 * that is injected into Aira's prompt telling her to search FIRST and cite
 * sources, instead of answering from memory alone.
 *
 * It is deliberately conservative: casual chat, emotional turns, and pure
 * "recall what we decided" questions do NOT trigger a search demand.
 */
export type SearchUrgency = 'none' | 'recommended' | 'required';
export interface SearchAdvice {
    urgency: SearchUrgency;
    /** Human-readable reasons (why search is needed). */
    reasons: string[];
    /** The exact injectable directive line(s), or '' when urgency === 'none'. */
    directive: string;
    /** Suggested tools in priority order (best-effort hint for Aira). */
    suggestedTools: string[];
}
export declare class SearchAdvisor {
    private timeSensitive;
    private volatile;
    private explicit;
    private externalFactual;
    private internalOnly;
    /**
     * Analyze a user message and decide whether Aira should search first.
     * @param message the raw user message
     * @param opts.hasWebSearch whether a web-search tool is actually available
     */
    advise(message: string, opts?: {
        hasWebSearch?: boolean;
    }): SearchAdvice;
    private formatDirective;
    private any;
}
//# sourceMappingURL=search-advisor.d.ts.map