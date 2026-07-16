/**
 * Synonym Expander — bridges the vocabulary gap between how a user PHRASES a
 * query and how a memory was WORDED.
 *
 * Local MiniLM embeddings are strong but not perfect at cross-lingual / jargon
 * synonymy: "timezone" does not land near "múi giờ", "lưu dữ liệu" does not land
 * near "database/PostgreSQL". Lexical overlap (RelevanceCritic) misses them too
 * because the tokens simply differ. A small, curated bidirectional synonym map
 * closes the most common gaps for THIS project's domain (deploy/ops/crypto/db)
 * without pulling in a heavy model.
 *
 * Deliberately small and dependency-free: it is a precision aid, not a
 * thesaurus. Every group is bidirectional — matching any member expands to all
 * members. Vietnamese and English domain terms are grouped together on purpose.
 */
/**
 * Expand a raw query string with domain synonyms. Returns the original text
 * PLUS any synonym phrases whose trigger appears in the query, joined by space.
 * Multi-word triggers are matched as substrings; single words as tokens.
 */
export declare function expandQuery(query: string): string;
/**
 * Collect the set of synonym phrases triggered by the text, EXCLUDING phrases
 * already present in it. Useful when you want the added terms only.
 */
export declare function collectSynonyms(text: string): Set<string>;
/**
 * True when the query and a memory are linked by a domain synonym even if they
 * share no tokens: the query contains a term from some group AND the memory
 * contains another term from the SAME group (e.g. query "lưu dữ liệu" ↔ memory
 * "database"). Works at the phrase level, so it catches multi-word synonyms
 * that token-level overlap cannot. Used by RelevanceCritic to credit coverage.
 */
export declare function sharesSynonym(query: string, memoryContent: string): boolean;
/**
 * Diacritic-free single-word synonyms for a token, for lexical-overlap scoring
 * (RelevanceCritic strips diacritics, so we fold too). Multi-word phrases are
 * skipped — they can never match a single token. Returns [] when none.
 */
export declare function synonymsForToken(token: string): string[];
//# sourceMappingURL=synonym-expander.d.ts.map