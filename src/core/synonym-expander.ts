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

/** Bidirectional synonym groups. Lowercased, diacritics kept (matched NFC). */
const SYNONYM_GROUPS: string[][] = [
  // Deploy / ops
  ['deploy', 'deployment', 'triển khai', 'launch', 'ship', 'chạy app', 'khởi chạy', 'lên production'],
  ['pm2', 'process manager'],
  ['systemd', 'service manager'],
  // Database / storage
  ['database', 'db', 'cơ sở dữ liệu', 'lưu dữ liệu', 'lưu trữ', 'data store', 'lưu data', 'chứa dữ liệu'],
  ['postgresql', 'postgres', 'pg'],
  ['mysql', 'my sql'],
  // Time / timezone
  ['timezone', 'time zone', 'múi giờ', 'giờ địa phương', 'gmt', 'utc'],
  // Hardware / infra
  ['vps', 'server', 'máy chủ', 'máy'],
  ['ram', 'bộ nhớ', 'memory'],
  ['gpu', 'card đồ họa', 'graphics'],
  // Crypto / mining
  ['mining', 'đào', 'khai thác', 'mine'],
  ['pool', 'bể đào', 'mining pool'],
  ['payout', 'trả thưởng', 'chi trả', 'reward'],
  ['wallet', 'ví'],
  // Language / addressing
  ['ngôn ngữ', 'language', 'tiếng'],
  ['xưng hô', 'addressing', 'cách gọi', 'xưng'],
  // Errors / debugging
  ['error', 'bug', 'lỗi', 'sự cố', 'issue', 'problem'],
  ['fix', 'sửa', 'khắc phục', 'vá'],
  // Domain / web
  ['domain', 'tên miền', 'website', 'trang web', 'web'],
];

/** Build a lookup: term -> set of all synonyms (including itself). */
const SYNONYM_INDEX: Map<string, Set<string>> = (() => {
  const idx = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const set = new Set(group);
    for (const term of group) {
      const existing = idx.get(term);
      if (existing) {
        for (const s of set) existing.add(s);
      } else {
        idx.set(term, new Set(set));
      }
    }
  }
  return idx;
})();

/** Normalize for matching: lowercase + NFC (keep Vietnamese diacritics). */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFC').trim();
}

/**
 * Expand a raw query string with domain synonyms. Returns the original text
 * PLUS any synonym phrases whose trigger appears in the query, joined by space.
 * Multi-word triggers are matched as substrings; single words as tokens.
 */
export function expandQuery(query: string): string {
  const extra = collectSynonyms(query);
  if (extra.size === 0) return query;
  return `${query} ${[...extra].join(' ')}`;
}

/**
 * Collect the set of synonym phrases triggered by the text, EXCLUDING phrases
 * already present in it. Useful when you want the added terms only.
 */
export function collectSynonyms(text: string): Set<string> {
  const hay = norm(text);
  const out = new Set<string>();
  for (const [term, syns] of SYNONYM_INDEX) {
    if (hay.includes(term)) {
      for (const s of syns) {
        if (!hay.includes(s)) out.add(s);
      }
    }
  }
  return out;
}

/**
 * True when the query and a memory are linked by a domain synonym even if they
 * share no tokens: the query contains a term from some group AND the memory
 * contains another term from the SAME group (e.g. query "lưu dữ liệu" ↔ memory
 * "database"). Works at the phrase level, so it catches multi-word synonyms
 * that token-level overlap cannot. Used by RelevanceCritic to credit coverage.
 */
export function sharesSynonym(query: string, memoryContent: string): boolean {
  const q = norm(query);
  const m = norm(memoryContent);
  for (const group of SYNONYM_GROUPS) {
    const inQ = group.some((t) => q.includes(t));
    if (!inQ) continue;
    const inM = group.some((t) => m.includes(t));
    if (inM) return true;
  }
  return false;
}

/**
 * Diacritic-free single-word synonyms for a token, for lexical-overlap scoring
 * (RelevanceCritic strips diacritics, so we fold too). Multi-word phrases are
 * skipped — they can never match a single token. Returns [] when none.
 */
export function synonymsForToken(token: string): string[] {
  const syns = ASCII_SYNONYM_INDEX.get(token);
  return syns ? [...syns] : [];
}

function stripDiacritics(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

/** Diacritic-free single-word synonym lookup, matching the critic's tokenizer. */
const ASCII_SYNONYM_INDEX: Map<string, Set<string>> = (() => {
  const idx = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const words = group.map(stripDiacritics).filter((w) => !w.includes(' ') && w.length > 2);
    for (const term of words) {
      const set = idx.get(term) || new Set<string>();
      for (const w of words) set.add(w);
      idx.set(term, set);
    }
  }
  return idx;
})();
