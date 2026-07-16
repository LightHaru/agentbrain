/**
 * SourceVerifier — force identity + multi-source verification before Aira
 * quotes facts about a named entity (token, project, company, person).
 *
 * The failure this fixes: for an ambiguous name (e.g. several tokens all called
 * "PRL"), Aira grabbed the FIRST search hit and quoted the WRONG project. A
 * name/ticker match is not identity. Real analysts confirm identity by
 * corroborating across independent sources and matching a canonical identifier
 * (contract address + chain, official domain, verified handle).
 *
 * This module detects when a query targets a named/ambiguous entity and injects
 * a verification protocol telling Aira to:
 *   1. pin the canonical identifier (contract+chain / official domain / handle);
 *   2. corroborate across the official site, the project's X/Twitter, reputable
 *      news, and the canonical registry/explorer — not one source;
 *   3. reject name-only matches and flag ticker collisions explicitly;
 *   4. only quote data whose source row matches the confirmed identity.
 *
 * It is language-aware (Vietnamese + English) and conservative: it does not
 * fire for casual chat or pure internal recall.
 */
export type EntityKind = 'token' | 'project' | 'person' | 'company' | 'generic';
export interface VerifyAdvice {
    needed: boolean;
    entityKind: EntityKind;
    /** Candidate entity names/tickers detected in the query. */
    candidates: string[];
    /** Injectable verification protocol, or '' when not needed. */
    directive: string;
}
export declare class SourceVerifier {
    /**
     * Decide whether the query needs source-identity verification.
     * @param message raw user message
     * @param opts.hasWebSearch whether live search tools exist
     */
    advise(message: string, opts?: {
        hasWebSearch?: boolean;
    }): VerifyAdvice;
    private extractCandidates;
    private buildDirective;
}
//# sourceMappingURL=source-verifier.d.ts.map