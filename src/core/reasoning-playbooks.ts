/**
 * Structured ReasoningCortex training playbooks.
 *
 * These are not final answers. They teach AgentBrain how to route Aira toward
 * reliable evidence for recurring tasks while leaving OpenClaw/Aira in charge.
 */

export interface ReasoningPlaybook {
  id: string;
  label: string;
  matchAll: RegExp[];
  matchAny?: RegExp[];
  suggestions: string[];
  reasoningFrame: string[];
  verificationChecks: string[];
  sourcePlan: string[];
  answerContract: string[];
  evidenceRules?: string[];
  recoverySteps?: string[];
  cautions: string[];
  uncertaintySignals: string[];
  approach?: string;
  /**
   * Natural-language example intents this playbook should fire on. Used by the
   * SEMANTIC matcher (local MiniLM embeddings) so the brain recognizes the
   * intent even when the wording differs from the regex patterns. This is what
   * lets distilled reasoning generalize to unseen phrasings.
   */
  intentAnchors?: string[];
}

function normalizeReasoningText(message: string): string {
  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0111\u0110]/g, 'd')
    .replace(/[đĐ]/g, 'd');
}

export const REASONING_PLAYBOOKS: ReasoningPlaybook[] = [
  {
    id: 'frontend-artifact-quality',
    label: 'Frontend artifact QA and visual verification',
    matchAll: [/\b(landing|frontend|website|web\s+site|site|webapp|web\s+app|page|html|css|ui|responsive|mobile|desktop|component|trang\s+web|giao\s+dien|ung\s+dung\s+web)\b/i],
    matchAny: [/\b(create|build|generate|design|write|code|implement|prototype|random|open|render|test|verify|check|real|authentic|lived-in|alive|polished|tao|xay\s+dung|thiet\s+ke|viet|lap\s+trinh|mo|kiem(?:\s+tra)?|xem|that|thuc\s+te|song\s+dong|giong\s+ai|kieu\s+ai|nhin\s+ai|qua\s+ai)\b/i],
    suggestions: [
      'Treat generated UI as a working artifact; verify the page in a browser before claiming it works',
      'Check desktop and mobile layouts for text fit, overlap, horizontal scroll, and blank sections',
      'Use meaningful visual assets or intentional product/interface visuals instead of placeholder-only decoration',
      'Keep design choices domain-appropriate and avoid one-note color palettes',
      'Make the page feel authentic and lived-in with concrete product states, realistic copy, and human-scale details',
    ],
    reasoningFrame: [
      'Goal -> files -> render -> interaction -> responsive QA -> final paths and known limits',
      'File existence is not evidence of quality until the artifact is opened and inspected',
      'Design quality depends on layout, hierarchy, typography, visual assets, and responsive behavior together',
      'Realism check: brand context -> real user scenario -> specific data/content -> lived-in visual state -> screenshot review',
    ],
    verificationChecks: [
      'Open or screenshot each page at desktop and mobile sizes; confirm the first screen is nonblank and correctly framed',
      'Check console errors, missing local assets, broken links, and failed scripts/styles',
      'Check text fit, overlap, horizontal scroll, and excessive blank gaps across viewports',
      'Compare the result against the requested design variety and domain style',
      'Reject AI-template signals: generic slogans, empty mockups, arbitrary blobs/shapes, fake logo rows, and sections hidden until scroll',
      'Check the no-scroll screenshot and after-scroll screenshot; both should look intentionally complete, not blank or half-loaded',
    ],
    sourcePlan: [
      'Inspect generated files and local asset references after writing them',
      'Render every generated page with a browser or screenshot tool at desktop and mobile viewports',
      'If visual assets are required, use real/generated bitmap assets or an intentional interface mockup that renders',
      'Use domain-specific copy, data, UI states, timestamps, names, labels, and imperfections that a real product page would show',
      'Record concrete verification evidence before summarizing completion',
    ],
    answerContract: [
      'Return the created paths and how each page can be opened',
      'State the browser/viewports/tests used for verification',
      'If browser verification was not actually run, say it was not run instead of implying it passed',
      'Name any known visual issue instead of hiding it',
      'State whether the page still looks generic/AI-made after screenshot review, and what was changed to make it feel real',
    ],
    evidenceRules: [
      'Do not claim browser/render verification unless a browser or screenshot command actually ran and produced observable output',
      'A browser render or screenshot is stronger evidence than file existence',
      'A page still fails quality if it looks AI-generated: pristine generic cards, vague headlines, decorative geometry without purpose, or content that could fit any company',
      'Specific real-world details beat generic polish: named incidents, realistic timestamps, product empty/error/loading states, actual workflow screenshots, and believable customer proof',
      'Reveal-on-scroll animations must not make full-page screenshots look blank; important sections need visible fallback content before interaction',
      'No console errors, missing assets, or horizontal overflow should remain in a finished UI artifact',
      'Readable text and non-overlapping controls beat decorative typography effects',
      'Visual variety requires layout, typography, color, and content differences, not only swapped gradients',
      'Placeholder boxes are weak evidence when the user expects a website with visual assets',
    ],
    recoverySteps: [
      're-render after fixing blank pages, broken links, console errors, or missing linked files/assets',
      'If the page feels AI-made, replace generic hero copy and abstract shapes with a concrete scenario, real UI state, named data rows, and imperfect lived-in details',
      'If reveal animations hide cards in screenshots, add no-JS/no-scroll visible defaults or trigger only subtle motion after content is already visible',
      'If mobile text overlaps or clips, reduce effect complexity and re-check at narrow width',
      'If a section has excessive empty space, tighten spacing and verify scroll continuity',
      'If the page is one-note or asset-poor, add relevant visual/media elements and rebalance palette',
    ],
    cautions: [
      'Do not equate generated files with a verified working page',
      'Do not claim a browser check when only file existence was checked',
      'Fancy text effects can reduce readability on mobile',
      'Responsive CSS can still fail at real viewport sizes',
      'A technically valid landing page can still be unacceptable if it looks like a generic AI template',
      'Over-clean dashboards, fake logos, and decorative shape scenes often read as artificial instead of alive',
    ],
    uncertaintySignals: [
      'unrendered local artifact',
      'mobile text-fit risk',
      'missing asset risk',
      'AI-template visual risk',
      'lived-in detail missing',
    ],
    approach: 'Build artifact -> render desktop/mobile -> inspect realism and layout -> replace generic/AI-looking parts -> re-render no-scroll and after-scroll -> report paths and checks',
  },
  {
    id: 'code-tool-execution-quality',
    label: 'Code and tool execution QA',
    matchAll: [/\b(code|tool|tools|command|script|test|tests|build|plugin|api|hook|file|files|repo|debug|fix|bug|cong\s+cu|lenh|ma\s+nguon|tap\s+tin|tep|sua\s+bug)\b/i],
    matchAny: [/\b(run|execute|inspect|verify|check|fix|debug|build|test|tests|edit|patch|report|tool|tools|chay|kiem(?:\s+tra)?|xac\s+minh|sua|doc|bao\s+cao)\b/i],
    suggestions: [
      'Keep Aira/OpenClaw as the operator; AgentBrain and Qwen may only critique the plan and evidence',
      'Inspect existing files and local patterns before editing code or claiming behavior',
      'Tie every tool claim to observed command output, file diff, screenshot, or runtime evidence',
      'Run the smallest relevant test first, then broaden only when the change risk requires it',
    ],
    reasoningFrame: [
      'Intent -> relevant files -> minimal change -> targeted test -> broader verification -> clear residual risk',
      'Separate observed tool output from inference or expectation',
      'Tool failure is evidence that changes the plan; do not hide or smooth it over',
    ],
    verificationChecks: [
      'Read the relevant files before editing and follow the repo pattern',
      'Run targeted tests or build commands that cover the touched behavior',
      'Check the final diff is scoped and does not revert unrelated user work',
      'Report exact tool failures, skipped checks, and remaining risk',
    ],
    sourcePlan: [
      'Use fast local search and direct file reads to locate the behavior under test',
      'Use repo scripts, targeted tests, build output, and runtime commands as verification evidence',
      'If a tool is unavailable, blocked, or fails, capture that result and choose a safe fallback',
      'For UI/tool changes, prefer screenshot/runtime evidence over static file existence',
    ],
    answerContract: [
      'List changed files, verification commands, and pass/fail status',
      'State any tool failure or skipped verification plainly',
      'Keep Aira/OpenClaw as the final actor; advisor output is private support only',
    ],
    evidenceRules: [
      'A successful command exit plus relevant output beats intent, memory, or assumed behavior',
      'Never claim a test, build, tool call, or browser check passed unless it actually ran successfully',
      'A failed or blocked tool is a result to report and reason from, not a detail to omit',
      'File diffs prove code changed, but only tests/runtime evidence prove behavior',
      'Advisor model feedback is weaker than direct tool output and cannot replace verification',
    ],
    recoverySteps: [
      'If a test or build fails, read the failure, fix the smallest root cause, and rerun the relevant check',
      'If a tool is blocked or unavailable, state the gap and use the next best local evidence',
      'If the diff touches unrelated files, isolate the intended change without reverting user work',
      'If verification is too narrow for the claim, reduce the claim or run a broader check',
    ],
    cautions: [
      'Do not let Qwen or AgentBrain replace Aira as the acting agent',
      'Do not claim tool success from a plan, README, or previous run',
      'Do not treat generated code as correct until the relevant behavior is exercised',
      'Avoid broad refactors while fixing a narrow tool/code issue',
    ],
    uncertaintySignals: [
      'tool output missing',
      'test not run',
      'runtime not verified',
      'diff broader than task',
    ],
    approach: 'Inspect -> patch narrowly -> run targeted evidence -> broaden if needed -> report exact status',
  },
  {
    id: 'evidence-triangulation-live',
    label: 'Source filtering and contradiction handling',
    matchAll: [/(current|latest|live|now|today|price|gia|giÃ¡|market|source|sources|fact|data|status|token|coin|dex|liquidity|volume|prl|wprl|pearl|hien tai|bay gio|bÃ¢y|moi nhat|moi nhat|nguon|tim nguon|thong tin|noi dung|loc nguon|loc thong tin)/i],
    suggestions: [
      'Turn the request into a precise claim, then require evidence before answering',
      'Prefer structured/current sources over memory, snippets, reposts, or generic pages',
      'If evidence conflicts, continue searching or present ambiguity instead of forcing one answer',
    ],
    reasoningFrame: [
      'Claim -> source quality -> identity match -> conflict check -> confidence level',
      'Each numeric/live claim needs source, timestamp, and reason it matches the user intent',
      'When the first result is off-target, revise the query and search again',
    ],
    verificationChecks: [
      'Check source freshness, exact identity, and whether the source is primary or derivative',
      'Do not label a dated or stale value as current when live data was requested',
      'Do not mix identity fields from one source with price/liquidity from another source',
      'Compare at least two current signals when the fact changes quickly or money is involved',
      'Discard results that match only by a loose name/ticker but not by identity',
      'State uncertainty when evidence is blocked, stale, thin, or contradictory',
    ],
    sourcePlan: [
      'Start with the most structured live source available for the domain',
      'Cross-check with a second current source or an alternate exact query',
      'If the first source is blocked, stale, or unrelated, revise by contract, chain, name, or official identifier',
      'Prefer JSON/API endpoints over rendered pages or search snippets when exact live data is needed',
    ],
    answerContract: [
      'Include the chosen source, time checked, confidence, and why this source/result was selected',
      'If candidates conflict, name the candidates and ask for a contract/chain or explain the chosen interpretation',
    ],
    evidenceRules: [
      'Primary/structured API, official data, or on-chain data beats search snippets and memory',
      'Exact contract, chain, pair, or official identifier beats ticker/name-only matches',
      'A timestamp older than the requested live check is stale for fast-moving market data',
      'A candidate is valid only when identity, chain, contract/pair, and price come from compatible evidence',
      'Fresh timestamp, liquidity, volume, and source reputation affect confidence',
      'A source that reports a different asset or stale value should be rejected',
      'A blocked page, search result snippet, or cached card is weak evidence for a live number',
    ],
    recoverySteps: [
      'If the first answer candidate does not exactly match intent, change the query and search again',
      'If a webpage is blocked or returns only snippets, try the source API before using that number',
      'If a candidate only has stale data, mark it stale or omit the current price and keep searching',
      'If chain/contract/price do not come from the same verified candidate, split or remove that candidate',
      'If two credible sources disagree, resolve by freshness/identity/liquidity or report both',
      'If only weak evidence is available, say what is missing instead of inventing certainty',
    ],
    cautions: [
      'Stored memories and search snippets can be stale',
      'Many tickers and product names collide',
      'A single source is not enough for high-stakes or fast-moving data',
    ],
    uncertaintySignals: [
      'source mismatch',
      'old timestamp',
      'only one weak source',
      'missing exact identifier',
    ],
    approach: 'Define claim -> find structured evidence -> compare sources -> resolve conflict or ask for identifier',
  },
  {
    id: 'market-token-price-live',
    label: 'Live token price lookup',
    matchAll: [/(price|giá|gia|bao nhiêu|market|chart|liquidity|volume|fdv|mcap|market cap)/i],
    matchAny: [/(token|coin|crypto|dex|pair|contract|ticker|symbol|ca\b|\b[A-Z0-9]{2,10}\b)/],
    suggestions: [
      'Use live market data, not stored memory, for the quoted price',
      'Identify token symbol/name plus chain or contract before trusting a result',
      'Compare candidate pairs and prefer the relevant pair with strongest liquidity',
    ],
    reasoningFrame: [
      'Disambiguate asset -> pick live source -> verify pair -> report timestamped value',
      'Treat cached memories as routing hints, not current market truth',
    ],
    verificationChecks: [
      'Verify token identity, chain, quote asset, liquidity, and timestamp',
      'Each candidate price should come from the current API row for that candidate',
      'Do not combine a candidate name from web search with a price or contract from a different row',
      'If multiple assets share the ticker, state ambiguity instead of guessing',
      'Cross-check priceUsd against another live source or another relevant pair when possible',
      'Reject search snippets when a structured pair API gives a different live value',
    ],
    sourcePlan: [
      'Use DexScreener or GeckoTerminal API responses instead of rendered DEX pages when possible',
      'Search DexScreener by token symbol/name/contract and inspect returned pairs',
      'For each candidate, read priceUsd, liquidity, volume, and chain from the same current API response',
      'Keep candidate identity, chain, pair, and price tied to the same row or exact pair endpoint',
      'Prefer pairs with matching base token, expected chain, meaningful liquidity, and recent volume',
      'For major listed assets, cross-check CoinGecko/CoinMarketCap; for new DEX tokens, trust DexScreener more than stale listings',
    ],
    answerContract: [
      'Return priceUsd, source, chain, pair/quote token, liquidity or 24h volume, and time checked',
      'If a candidate only has stale or weak data, label it stale instead of presenting it as current',
      'Do not list a candidate if its chain/contract/price were assembled from mismatched sources',
      'Do not present cached memory price as current price',
    ],
    evidenceRules: [
      'For DEX tokens, pair-level data with base token, quote token, chain, liquidity, and volume is stronger than a plain coin page',
      'Do not trust a ticker-only match when another token with the same ticker has stronger identity evidence',
      'Memory can suggest user intent, but only live sources can justify price, venue, liquidity, or volume',
      'Use liquidity and recent volume to decide which pair is representative',
      'A quoted DEX price should come from the exact pair API, not from a search result card',
      'A listing page dated earlier than the check time is not a live DEX price',
      'Never mix chain or contract metadata from one token with price data from another token',
    ],
    recoverySteps: [
      'If the top result is a different token, search by contract/name and inspect other pairs',
      'If prices differ across pairs, prefer the matching high-liquidity pair and mention outliers when relevant',
      'If a DEX page cannot be fetched, use its public API/search endpoint before trusting snippets',
    ],
    cautions: [
      'Do not use cached memory as current price',
      'Ticker collisions are common',
      'Low-liquidity pairs can show misleading prices',
      'Market data changes minute by minute',
    ],
    uncertaintySignals: [
      'live market data required',
      'ticker/name collision risk',
    ],
    approach: 'Asset identity -> live DexScreener lookup -> choose best-liquidity pair -> timestamped answer',
  },
  {
    id: 'prl-wprl-dexscreener',
    label: 'PRL / Wrapped Pearl source routing',
    matchAll: [/\b(prl|wprl|pearl)\b/i, /(price|giá|gia|bao nhiêu|market|chart|dex|liquidity|volume)/i],
    suggestions: [
      'For bare PRL price requests, treat the ticker as ambiguous and check DexScreener q=PRL plus q=WPRL',
      'Do not give one unqualified PRL price unless the user supplied a chain/contract or one candidate clearly matches intent',
      'For Pearl/Wrapped Pearl intent, prefer WPRL pairs and verify the base token address before quoting price',
    ],
    reasoningFrame: [
      'Disambiguate PRL candidates first: Perle PRL, Parallel PRL, Pearl/WPRL, and any dead or unrelated PRL assets',
      'Map Pearl/Wrapped Pearl intent to WPRL, then verify chain, pair, liquidity, and priceUsd',
      'Reject unrelated Solana/pump pairs that merely contain WPRL letters in an address',
    ],
    verificationChecks: [
      'DexScreener queries should include q=PRL and q=WPRL before choosing a PRL candidate',
      'For Pearl/WPRL, base token should be Wrapped Pearl / WPRL before trusting priceUsd',
      'If choosing a non-Pearl PRL candidate, explain why it fits the user intent better than WPRL',
      'Choose the relevant candidate with strongest liquidity/volume for the headline price',
    ],
    sourcePlan: [
      'Fetch api.dexscreener.com/latest/dex/search with q=WPRL and q=PRL first; use JSON rows',
      'Cross-check CoinPaprika tickers prl-pearl-1 and wprl-pearlbridge-bridged-wprl-ethereum',
      'Keep CoinPaprika prl-pearl-1 and wprl-pearlbridge-bridged-wprl-ethereum as separate rows; never reuse price, volume, change, or timestamp between IDs',
      'For each PRL candidate such as Perle, Parallel, and WPRL, quote only current API priceUsd/liquidity/volume/change data from the same row',
      'Only list PRL candidates whose chain, pair, contract, price, volume, and change are tied to the same API candidate row',
      'For WPRL/Pearl, prefer API data from the exact WPRL pair over GeckoTerminal/DexScreener page snippets',
      'For Pearl intent, filter for baseToken.symbol WPRL or name Wrapped Pearl',
      'Rank matching pairs by liquidity.usd, then read priceUsd, volume.h24, liquidity.usd, chainId, pair URL',
    ],
    answerContract: [
      'If PRL is ambiguous, list top candidates or ask for contract/chain',
      'Do not call stale Perle/Parallel listings current',
      'Do not add a PRL candidate unless chain/contract/price/volume/change share the same live source row',
      'For CoinPaprika, label metrics by exact ticker id before copying them into the answer',
      'Report exact source-specific API prices (priceUsd) and metrics; do not collapse them into a broad range',
      'Do not cite memory as the reason for choosing price, venue, liquidity, or volume',
      'Say whether the quoted value is Perle PRL, Parallel PRL, or WPRL/Pearl market data from DexScreener',
      'Include priceUsd, chain, pair quote token, liquidity, 24h volume/change, and check time',
    ],
    evidenceRules: [
      'A bare PRL request is not enough to identify one asset with certainty',
      'Perle PRL, Parallel PRL, and Wrapped Pearl WPRL are separate candidates and should not be merged',
      'Every reported metric, including price, liquidity, volume, change, and lastUpdated, must come from the same live source row',
      'CoinPaprika prl-pearl-1 and wprl-pearlbridge-bridged-wprl-ethereum are separate evidence rows',
      'The chosen candidate must be justified by user wording, contract/chain, source identity, or liquidity',
      'For WPRL, an exact pair API value beats a web/search card that reports a different number',
      'For Perle or Parallel PRL, the q=PRL API row is stronger than an older listing-page quote',
      'If Perle appears on Solana in the API but another source says BNB, treat that as a conflict rather than merging them',
    ],
    recoverySteps: [
      'If Aira initially picks Perle PRL, still compare WPRL/Pearl and Parallel PRL before finalizing',
      'If the user likely means Pearl but wrote PRL, state the ambiguity and include WPRL separately',
      'If WPRL sources conflict, use the exact pair API or report the conflict instead of choosing the larger number',
      'If Perle/Parallel numbers come from stale sources, replace them with current q=PRL API rows or call them stale',
      'If an extra PRL candidate cannot be tied to a same-source API row, omit it from the live-price answer',
    ],
    cautions: [
      'PRL is an ambiguous ticker; Perle PRL, Parallel PRL, and Pearl/WPRL are different assets',
      'PRL may appear as Wrapped Pearl (WPRL) on DEX data',
      'Search results may include unrelated tokens whose addresses contain WPRL',
    ],
    uncertaintySignals: [
      'bare PRL ticker ambiguity',
      'PRL/WPRL naming ambiguity',
      'must filter unrelated DexScreener results',
    ],
    approach: 'DexScreener q=PRL + q=WPRL -> compare candidates -> choose only if identity is clear -> answer with timestamp',
  },
];

/**
 * Learned playbooks — distilled at runtime (e.g. from an Opus-4.8 distillation
 * pass) and layered ON TOP of the built-in ones. This is how AgentBrain's
 * reasoning grows smarter over time: new high-quality thinking frames get
 * registered here, persisted by the trainer, and reloaded on boot.
 */
const LEARNED_PLAYBOOKS: ReasoningPlaybook[] = [];

/** Serializable form of a learned playbook (RegExp stored as source strings). */
export interface SerializedPlaybook {
  id: string;
  label: string;
  matchAll: string[];
  matchAny?: string[];
  suggestions: string[];
  reasoningFrame: string[];
  verificationChecks: string[];
  sourcePlan: string[];
  answerContract: string[];
  evidenceRules?: string[];
  recoverySteps?: string[];
  cautions: string[];
  uncertaintySignals: string[];
  approach?: string;
  intentAnchors?: string[];
}

function toRegExp(src: string): RegExp {
  // Support "/pattern/flags" or a bare pattern (default case-insensitive).
  const m = /^\/(.*)\/([a-z]*)$/i.exec(src);
  if (m) return new RegExp(m[1], m[2]);
  return new RegExp(src, 'i');
}

export function deserializePlaybook(p: SerializedPlaybook): ReasoningPlaybook {
  return {
    id: p.id,
    label: p.label,
    matchAll: p.matchAll.map(toRegExp),
    matchAny: p.matchAny ? p.matchAny.map(toRegExp) : undefined,
    suggestions: p.suggestions || [],
    reasoningFrame: p.reasoningFrame || [],
    verificationChecks: p.verificationChecks || [],
    sourcePlan: p.sourcePlan || [],
    answerContract: p.answerContract || [],
    evidenceRules: p.evidenceRules,
    recoverySteps: p.recoverySteps,
    cautions: p.cautions || [],
    uncertaintySignals: p.uncertaintySignals || [],
    approach: p.approach,
    intentAnchors: p.intentAnchors,
  };
}

/**
 * Register (or replace) a learned playbook. Returns true if it was newly added,
 * false if it replaced an existing learned playbook with the same id.
 */
export function registerLearnedPlaybook(p: ReasoningPlaybook): boolean {
  const idx = LEARNED_PLAYBOOKS.findIndex((x) => x.id === p.id);
  if (idx >= 0) { LEARNED_PLAYBOOKS[idx] = p; return false; }
  LEARNED_PLAYBOOKS.push(p);
  return true;
}

export function getLearnedPlaybooks(): ReasoningPlaybook[] {
  return [...LEARNED_PLAYBOOKS];
}

export function clearLearnedPlaybooks(): void {
  LEARNED_PLAYBOOKS.length = 0;
}

export function countPlaybooks(): { builtin: number; learned: number; total: number } {
  return {
    builtin: REASONING_PLAYBOOKS.length,
    learned: LEARNED_PLAYBOOKS.length,
    total: REASONING_PLAYBOOKS.length + LEARNED_PLAYBOOKS.length,
  };
}

/**
 * Playbook IDs that unlock the "rich" (deeper) whisper output — the 6-check
 * verification set, extra suggestions, evidence rules, recovery steps, and
 * stronger cautions. Historically only the two builtin IDs
 * ('frontend-artifact-quality', 'code-tool-execution-quality') qualified, which
 * silently truncated the distilled DESIGN/CODE playbooks (a11y, design tokens,
 * debug-from-evidence, etc.) down to 2 checks — so that knowledge never reached
 * Aira at generation time. This is the single source of truth for "is this a
 * high-craft artifact playbook that deserves the full whisper".
 */
const RICH_ARTIFACT_PLAYBOOK_IDS = new Set<string>([
  // Builtin high-craft playbooks
  'frontend-artifact-quality',
  'code-tool-execution-quality',
]);

/** Prefixes for distilled (learned) playbooks that also deserve rich output. */
const RICH_ARTIFACT_PLAYBOOK_PREFIXES = [
  'distilled-design-', // visual-system, anti-ai-look, layout-responsive, motion-polish, critique, tokens-in-code
  'distilled-code-',   // code-review-quality, code-read-before-write, code-comprehension
  'distilled-debug-',  // debug-from-evidence
  'distilled-e2e-',    // e2e-testing
  'distilled-testing-',// testing-strategy
];

/** True when a single playbook id qualifies for rich whisper output. */
export function isRichArtifactPlaybookId(id: string): boolean {
  if (RICH_ARTIFACT_PLAYBOOK_IDS.has(id)) return true;
  return RICH_ARTIFACT_PLAYBOOK_PREFIXES.some((prefix) => id.startsWith(prefix));
}

/** True when any of the given playbooks qualifies for rich whisper output. */
export function hasRichArtifactPlaybook(
  playbooks: Array<{ id: string }>
): boolean {
  return playbooks.some((playbook) => isRichArtifactPlaybookId(playbook.id));
}

export function matchReasoningPlaybooks(message: string): ReasoningPlaybook[] {
  const searchableMessage = `${message} ${normalizeReasoningText(message)}`;

  const all = [...REASONING_PLAYBOOKS, ...LEARNED_PLAYBOOKS];
  return all.filter((playbook) => {
    const allMatch = playbook.matchAll.every((pattern) => pattern.test(searchableMessage));
    const anyMatch = !playbook.matchAny || playbook.matchAny.some((pattern) => pattern.test(searchableMessage));
    return allMatch && anyMatch;
  });
}
