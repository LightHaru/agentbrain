# CHANGELOG

## [Unreleased] — v0.17 upgrade (in progress)

### Phase 1 — recall→inject quick wins (measured, no new runtime deps)

Raised memory-recall quality by closing the vocabulary gap between how a user
phrases a query and how a memory was worded — the biggest driver of missed
recalls on the golden set.

#### Added
- **`src/core/synonym-expander.ts`**: a small, curated, bidirectional domain
  synonym map (deploy/ops/db/crypto/time/errors). `expandQuery()` widens the
  query before vector search; `sharesSynonym()` credits multi-word synonym links
  ("lưu dữ liệu" ↔ "database") that token overlap misses; `synonymsForToken()`
  feeds single-word synonyms to the lexical critic. Dependency-free.
- **`tests/synonym-expander.test.ts`** (+9) and dynamic-TTL cases in
  `freshness-guard.test.ts` (+3).

#### Changed
- **`src/core/hippocampus.ts`**: `recall()` now searches on the synonym-expanded
  query and unions a high-precision synonym keyword scan with the vector hits so
  a synonym match is never ranked out.
- **`src/core/relevance-critic.ts`**: lexical coverage counts synonym matches;
  fact conflicts are now resolved by recency (prefer the newer memory, name the
  older) instead of flagging both symmetrically.
- **`src/core/freshness-guard.ts`**: per-value volatility scales the category
  TTL — fast movers (altcoins) expire at 0.5×, stable pegs (USDT/VND) at 3×.
- **`eslint.config.js`**: added a light flat config (ESLint 9 + typescript-eslint,
  dev-only) so lint runs green as a regression gate; known cleanups are warnings.

#### Measured (scripts/recall-eval.mjs, golden set, k=5)
- Precision@5 **70.6% → 87.2%**, Recall@5 **86.7% → 100%**, MRR **0.833 → 0.967**,
  Clean **60% → 80%**. Intelligence scorecard held at **3/3**. 401/401 tests pass.

## [0.16.3] - 2026-07-13

### 🎯 Fix: distilled DESIGN/CODE knowledge now actually reaches Aira at generation time

Root cause found while chasing the design gap (Aira 86.1% vs teacher 97.2%): the
reasoning cortex only unlocked its "rich" 6-check whisper for the two builtin
playbook IDs (`frontend-artifact-quality`, `code-tool-execution-quality`). Every
distilled DESIGN/CODE playbook (a11y, design tokens, contrast, hierarchy,
anti-AI-look, debug-from-evidence, …) was silently truncated to 2 checks and
its verification/evidence/recovery items were starved by the builtin list — so
that trained knowledge never surfaced in the prompt.

### Fixed
- **`src/core/reasoning-playbooks.ts`**: added a single source of truth —
  `isRichArtifactPlaybookId()` / `hasRichArtifactPlaybook()` — covering the
  builtin high-craft playbooks plus distilled prefixes (`distilled-design-`,
  `distilled-code-`, `distilled-debug-`, `distilled-e2e-`, `distilled-testing-`).
- **`src/core/reasoning-cortex.ts`**: replaced the hardcoded 2-ID allowlist in
  the verification-check limit, evidence rules, recovery steps, and cautions
  gating with the shared helper. Added `mergePlaybookLists()` — when a rich
  artifact playbook matches, distilled (trained) playbooks are ordered first and
  their full checklists are concatenated so domain checks (a11y/tokens/contrast/
  hierarchy) win the top slots instead of being diluted by scope/writing
  playbooks; other task types keep their deliberate authored ordering (verified
  no change to the market-data path).
- **`src/integration/brain-whisper-format.ts`**: the rich-output formatter now
  uses `isRichArtifactPlaybookId()` instead of matching only
  `frontend-artifact-quality`.

### Verified
- All **387 tests pass** (added a regression test in `reasoning-cortex.test.ts`
  that registers a distilled design playbook and asserts its a11y/tokens/
  hierarchy checks surface in the whisper).
- Probe against the live persisted brain: a hero/landing design query now
  surfaces all four design signals (type scale, focal point/hierarchy,
  anti-AI-look, WCAG contrast) in the top verification checks — previously only
  the builtin frontend QA checks appeared.

> Note: end-to-end A/B re-measurement of the design benchmark requires
> restarting the live OpenClaw gateway (it caches the plugin in memory). Pending
> owner approval since that briefly interrupts the live Aira service.


## [0.16.2] - 2026-07-13

### 📏 Self-measured HumanEval-style pass@1 (teacher vs Aira) + light-touch training

Followed real benchmark methodology (HumanEval: execute generated code against
hidden unit tests, score pass@1) instead of string matching. Measured the
teacher (Opus-4.8) and Aira on the SAME executable harness, each Aira task in a
NEW session.

### Added
- **`bench/run-humaneval.mjs`** + `bench/humaneval-{lite,hard,tricky}.json`:
  19 executable Python tasks across 3 difficulty tiers (incl. spec traps:
  banker's rounding, truncate-toward-zero RPN, semantic version compare, LRU,
  word-break, spiral). Real subprocess execution → pass@1.
- **`scripts/aira-train-light.mjs`**: light-touch trainer — open prompts (no
  spoon-feeding), a NEW session per prompt, so AgentBrain self-distills durable
  knowledge from successful turns instead of memorizing dictated steps.

### Results
- pass@1: **teacher (Opus-4.8) 19/19 = 100%**, **Aira (Sonnet + AgentBrain)
  19/19 = 100%** — Aira matches the teacher on executable code-gen incl. tricky
  spec traps; stable (5/5 tricky) after training.
- Light training grew the live brain: conversation turns 193 → 267, memories →
  120, KnowledgeStore held at 83 (dedup anti-bloat). See `EVAL_REPORT_humaneval.md`.

## [0.16.1] - 2026-07-13

### 🎓 Distilled CODE + DESIGN mastery from Opus-4.8 (for Aira on Sonnet)

Transferred teacher-quality thinking for the two areas small models are weakest
at — engineering (debug/E2E/perf) and design (anti "vibe-code") — into the live
brain, then benchmarked Aira against SWE-bench / DesignBench-style rubrics.

### Added
- **`training/distillation-corpus-code.ts`**: 5 playbooks (read-before-write,
  debug-from-evidence, E2E-testing, design-before-code, hard perf/concurrency) +
  6 lessons + 4 procedures + 4 common errors. Encodes "reproduce → root-cause →
  fix → regression test" and "done only when build+test+real-run pass".
- **`training/distillation-corpus-design.ts`**: 4 playbooks (visual-system,
  anti-AI-look, layout/responsive, motion-polish) + 5 lessons + 4 procedures +
  3 common errors. Encodes killing AI tells (default fonts, purple gradients,
  emoji headers, uniform blandness), 8px grid + type scale, WCAG AA contrast,
  375/768/1440 responsive, real content over lorem.
- Merged both into the trainer's effective corpus (playbooks + lessons +
  procedures + commonErrors) and added held-out benchmark probes for
  debug/E2E/design/perf.
- **`scripts/aira-skill-bench.mjs`**: rubric benchmark (SWE-bench + DesignBench
  axes) that scores Aira's real gateway outputs; supports A/B with the plugin on/off.

### Results (ingested into the live brain)
- Benchmark 0.7417 → 0.7800; held-out generalization 0.4262 → 0.5856
  (+0.1594); held-out semantic 0.8956. KnowledgeStore now 83 items, 36 playbooks.
- **A/B on real Aira**: DEBUG 86.7% with brain vs 73.3% without (+13.4pp; the
  hard React-loop task went 60% vs 20%). DESIGN ~61% both runs (base model
  already articulates principles; brain's design edge shows on rendered work).
  See `EVAL_REPORT_code_design.md`.

### Tests
- **386 unit tests pass** (added a code/design corpus validation suite; +6).

## [0.16.0] - 2026-07-13

### 🧠 Intelligence upgrade — 6 features so Aira thinks sharper and remembers better

A focused upgrade toward "nhớ tốt hơn, gợi ý context chính xác hơn, thông minh
hơn". Measured, wired into the live gateway, and E2E-verified (not just unit
tests). Everything runs on local MiniLM embeddings + SQLite — no GPU, fits the
4GB VPS.

### Added
- **RecallEval harness** (`training/recall-eval.ts` + `scripts/recall-eval.mjs`):
  a golden-set information-retrieval eval that measures MEMORY recall quality —
  precision@k, recall@k, MRR, and a strict "clean" score — against the REAL
  Hippocampus recall + RelevanceCritic. This is the measuring stick every other
  upgrade is proven against (baseline: recall@5 ≈ 87%, MRR ≈ 0.83).
- **MemoryGraph** (`core/memory-graph.ts`): a local knowledge graph over the
  facts table (subject —relation→ object). Multi-hop "bridge" recall lets Aira
  answer questions whose answer is 2 hops away (e.g. project → chain → chain
  property) instead of only matching one isolated fact. Rebuilt on fact changes
  + every ~20 heartbeats; respects supersede/validity. Injected as a compact
  "Liên kết tri thức (graph)" line and exposed via the `agentbrain_graph` tool.
- **FactChangeTracker** (`core/fact-change-tracker.ts`): when a value is updated
  (superseded), Aira is now TOLD "X: cũ → mới (dùng giá trị MỚI)" instead of the
  change happening silently. Placed early in the injection so it survives token
  trimming — a stale value is worse than a missing one.
- **ForgettingCurve** (`core/forgetting-curve.ts`): Ebbinghaus retention
  (R = exp(-t/S)) where stability S grows with access count + confidence
  (spaced-repetition intuition). Replaces flat linear decay in Hippocampus
  maintenance; frequently-used/trusted memories resist forgetting, one-off noise
  fades fast. KnowledgeStore is now pruned on the heartbeat too (không phình).
- **AutoReflector** (`core/auto-reflector.ts`): self-triggered reflection after a
  rough streak (repeated corrections / negative sentiment in a session). It
  distills a "do differently next time" lesson into the KnowledgeStore + Error
  Ledger, so the brain learns from a bad patch instead of repeating it — thinking
  like a person, not asking again and again.
- **Live dashboard** (`scripts/export-brain-state.mjs`): exports a real brain.db
  → `dashboard/public/brain-state.json`; the 3D dashboard now loads live memory,
  personality, mood, skills and motivation instead of mock data.
- **Intelligence scorecard** (`scripts/intelligence-scorecard.mjs`): runs BRIDGE
  / CHANGE / STREAK scenarios through the real gateway to prove the new signals
  reach Aira (currently 3/3).

### Fixed
- **Supersede detection was too brittle**: natural rephrasing ("database chính
  của dự án" vs "giờ dự án") produced different subjects, so a changed fact was
  never caught. KnowledgeExtractor now normalizes subject cores (drops time /
  filler / qualifier words) and treats value-assignment relations (is/uses/
  runs_on/costs/balance) as compatible, so real-world corrections supersede
  correctly.
- **Injection ordering**: correctness-critical lines (fact-change, facts, graph)
  were rendered late and trimmed away under the ~250-token budget; moved them
  high so they survive.

### Verified
- **380 unit tests pass** (added recall-eval, memory-graph, fact-change-tracker,
  forgetting-curve, auto-reflector, and a v0.16 gateway E2E suite; +24 tests).
- Build clean (`tsc`), dashboard type-checks clean.
- **E2E through the real OpenClaw gateway**: graph bridges project→chain→gas-fee;
  a MySQL→PostgreSQL update is flagged old→new; a deploy-correction streak
  distills a pm2 reminder that is recalled on the next deploy question.
- Dashboard export ran against the live brain.db (57 memories, 48 knowledge
  items, mood=excited).


### Fixed (v0.16 — from live cross-session evaluation with Aira)
- **Injection noise caused hallucination**: live eval found Aira recalled the
  right project cross-session but hallucinated its chain ("BNB" instead of the
  stored "Solana") because the correct fact was buried under rambling junk facts
  and spurious fact-change notes. Fixes: `cleanSubject` strips leading
  conjunctions/filler; a shared `isCleanFactRow`/`isCleanFact` predicate keeps
  rambling, multi-line, question-like facts out of the facts line, the memory
  graph, and the fact-change tracker; `FactChangeTracker` only reports crisp
  value-assignment changes (is/uses/runs_on/costs/balance, ≤6-word values).
  Added `scripts/clean-facts.mjs` (dedup/GC of legacy junk facts; cleaned 21/78
  in the live brain). After the fixes, a brand-new session correctly answered
  "TinGameFi — Solana — pm2".
- Added `scripts/aira-eval.mjs` (cross-session recall driver) and
  `EVAL_REPORT_v016.md` (daily / research / code evaluation).

## [0.15.4] - 2026-07-13

### 🕐 Time awareness — Aira lives in real time

Aira had no sense of clock/calendar and never knew WHEN a message arrived.

### Added
- **TimeAwareness** (`core/time-awareness.ts`, timezone-aware, default
  Asia/Ho_Chi_Minh): injects a `🕐 Bây giờ:` line every turn with the current
  time, buổi (sáng/trưa/chiều/tối/khuya), thứ, ngày, and any Vietnamese
  holiday/Tết (fixed solar holidays + Tết Nguyên Đán windows 2024–2030).
- Message-timing + gap inference: reads the previous turn's timestamp and tells
  Aira when it was sent (lúc HH:MM buổi hôm nay/hôm qua/hôm kia) and infers the
  gap naturally — e.g. a 1:30am message followed by an 8am one →
  "chắc Sếp mới ngủ dậy, chào buổi sáng"; multi-day silence → reconnect note.
- Timezone comes from plugin config (`config.timezone`); TimeAwareness +
  Hypothalamus share it.
- Weather: handled via the existing search-first rule (weather queries already
  force a live search), so Aira never quotes stale weather from memory.
- Skill `aira-executive-control`: new "Time Awareness" section.

### Verified
- 356 unit tests pass (added 11 time-awareness tests covering buổi mapping,
  holidays, Tết, timestamp description, and gap inference).
- E2E through the plugin hook: the current-time line and "Tin trước của Sếp lúc
  01:30 khuya" note appear in the injected context; the overnight→morning
  "mới ngủ dậy" inference fires as specified.

## [0.15.3] - 2026-07-13

### ⏱️🔗 Freshness TTL + source-identity verification

Follow-up to 0.15.2, from live feedback: (a) remembered prices were reused even
when old, and (b) Aira sometimes quoted the WRONG same-named token.

### Added
- **FreshnessGuard** (`core/freshness-guard.ts`): TTL/validity windows for
  volatile data (price/market ~5 min, balance ~15 min, all configurable via
  `volatileTtlSeconds`). On a volatile query it judges recalled memories by
  their DATA-capture timestamp (not last-read time), and if a price/market
  number is past its TTL it injects a `⏱️` stale-data warning naming the old
  value and escalates the search demand to REQUIRED. Backed by a new
  `Hippocampus.scanByTerms()` so stale data is caught even when semantic recall
  under-ranks a short price query.
- **SourceVerifier** (`core/source-verifier.ts`): for named/ambiguous entities
  (tokens, projects, people, companies) injects a `🔗 VERIFY-IDENTITY` protocol —
  pin the canonical identifier (contract+chain / official domain / verified
  handle), corroborate across official site → X/Twitter → news → origin source
  (explorer / CoinGecko), list candidates when a name/ticker collides instead of
  guessing, and never mix numbers between same-named tokens.
- Skill `aira-executive-control`: new "Source-identity verification" and
  "Freshness / TTL" sections.
- Config: `volatileTtlSeconds` (price/market/balance).

### Verified
- 345 unit tests pass (added freshness-guard + source-verifier suites; 15 new).
- E2E through the plugin hook: a 12-min-old "Giá PRL $0.171" memory triggers the
  `⏱️` stale warning + forced re-search; a token query fires SEARCH-FIRST +
  VERIFY-IDENTITY together with the full contract/website/twitter/news/explorer
  cross-check protocol.

## [0.15.2] - 2026-07-13

### 🧠 Smarter memory + adaptive RAG + search-first discipline

Researched the current AI-memory market (mem0 multi-signal fusion + temporal
reasoning, Zep/Graphiti temporal context graphs, Letta/MemGPT tiered memory,
Self-RAG retrieval criticism) and upgraded AgentBrain toward that bar. Verified
live against the real OpenClaw gateway (Aira on claude-sonnet/opus).

### Added
- **SearchAdvisor** (`core/search-advisor.ts`): detects volatile / time-sensitive /
  external-factual / "please look it up" queries and injects a `🔎 SEARCH-FIRST`
  directive telling Aira to search the web and cite sources BEFORE answering,
  instead of trusting possibly-stale memory. Pure recall / chit-chat is
  deliberately NOT forced to search. Unicode-aware (Vietnamese) matching.
- **RelevanceCritic** (`core/relevance-critic.ts`): Self-RAG-style post-retrieval
  criticism. Scores recalled memories (lexical coverage, confidence, recency,
  access), drops stale/irrelevant noise, and surfaces numeric contradictions so
  Aira flags conflicts instead of blending them silently. Weak-recall warnings.
- **InputSanitizer** (`core/input-sanitizer.ts`): cleans the user message before
  it is ever remembered — unwraps the OpenClaw runtime envelope ("Sender
  (untrusted metadata)", "Conversation context (untrusted, ...)", "[Retry ...]"),
  strips AgentBrain's OWN injected "## Brain State" / "### Brain Whisper" blocks,
  and REDACTS secrets (AWS keys incl. next-line secret, GitHub/Slack/OpenAI
  tokens, JWTs, private keys). `redactSecrets()` also scrubs agent responses.
- Skill `aira-executive-control`: new "Search-First Discipline" section.

### Fixed
- **Memory self-pollution**: the brain was storing its own injected context and
  the full runtime prompt envelope as if the user had typed it, wrecking recall.
  Now the sanitized current message flows into consolidation, knowledge
  extraction, and the conversation log.
- **Secret leakage**: credentials (AWS access/secret keys) had been persisted in
  plaintext memory. New captures are redacted; existing polluted rows + leaked
  secrets were cleaned from the live brain.db (backups kept).
- **Config**: `plugins.entries.lightharu-agentbrain.hooks.allowConversationAccess`
  was missing, so the gateway BLOCKED `llm_output`/`agent_end` — the plugin
  could not remember from real chat. Enabled; all hooks now run.
- Stale init log string (`v0.4.1`) → accurate `v0.15.2`; manifest version synced.

### Verified
- 330 unit tests pass (added search-advisor, relevance-critic, input-sanitizer
  suites; 24 new tests).
- Live OpenClaw E2E: volatile "giá PRL hôm nay" query → Aira called web_search +
  web_fetch before answering and cited live sources; pure recall query did not
  force a search; real Telegram-envelope turns now store the CLEAN current
  message (verified in brain.db), zero envelope/secret pollution remaining.


## [0.15.1] - 2026-07-09

### 🔌 Fix: real-runtime persistence (found via live openclaw chat + logs)

Tested against a REAL `openclaw agent` chat (Aira on claude-opus-4-8) and read
the runtime logs — the plugin initialized correctly (27 playbooks, 48 knowledge
items, semantic matcher ready) but conversation turns were NOT being persisted.

### Root cause
Conversation logging, error-ledger recording, and per-turn affect/neurochem
persistence were wired ONLY into the `message_sent` hook. OpenClaw's actual
completion for agent runs flows through `llm_output` / `agent_end`
(`processRuntimeCompletion`), which did memory consolidation but never recorded
the conversation turn, the correction→error-ledger link, or persisted mood.

### Fixed
- `processRuntimeCompletion` now also: records the full conversation turn
  (ConversationLog), logs user corrections into the Error Ledger, and persists
  affect + neurochemistry every turn — matching the `message_sent` path.
- `agent_end` config resolution falls back to `event.context.pluginConfig`.

### Verified
- Full Gateway lifecycle E2E (message_received → before_agent_run →
  before_prompt_build → llm_output → agent_end): turns persist and a later
  message recalls earlier context ("deploy bằng pm2, đừng systemd") + the
  error-ledger reminder. New regression test guards this path.
- Real `openclaw agent --local` chat confirmed init + injection; documented that
  the one-shot `--local` harness emits only `before_prompt_build` (per OpenClaw
  docs, completion hooks run on the Gateway/persistent path).

### Tests
- **+1 regression E2E (308 total, green):** Gateway completion persists + recalls.

### Verified — emotion/mood over the real runtime path
- Tested mood via the Gateway lifecycle: praise → `Mood: excited / Feeling:
  affection` + warm Expression injected; mood **persisted to disk**
  (`emotional/affect.md`) and **reloaded on a fresh plugin instance** (restart)
  instead of resetting; criticism flipped it to `alarmed / anger` with a
  guarded Expression. Added a mood-over-Gateway regression E2E (309 total).

## [0.15.0] - 2026-07-09

### 🌱 Self-distillation — the brain learns from its own successful chats

The core of "phát triển theo thời gian": AgentBrain no longer only knows what
Opus-4.8 seeded once. It now distills NEW durable knowledge from its own real,
successful conversations and keeps that knowledge searchable for Aira.

### Added
- **`training/self-distiller.ts`** — periodically scans recent conversation
  turns and learns durable knowledge (stated preferences, decisions, stable
  facts) into the KnowledgeStore. Safeguards so it stays trustworthy + lean:
  - only learns from POSITIVE-outcome turns (sentiment ≥ threshold); negative
    turns are the Error Ledger's job, not something to imitate
  - ignores ephemeral chatter (too short / no durable signal)
  - dedup via KnowledgeStore content-hash + a persisted watermark so each run
    only processes new chat → no reprocessing, no bloat
- **`ConversationLog.since()`** to iterate new turns for distillation.
- Wired into the plugin heartbeat: runs every ~10 heartbeats in the background.

### Verified (E2E through the built plugin)
- Sếp says "luôn thích deploy bằng pm2, đừng systemd" → on heartbeat the brain
  **self-distilled 1 knowledge item**; later asking "deploy service này lên"
  **retrieved that self-learned preference** into Aira's prompt. Second pass
  learns nothing new (watermark + dedup working).

### Tests
- **+5 tests (307 total, green):** learns from positive turns, ignores
  negative + ephemeral, dedup/watermark, retrievable after learning.

## [0.14.1] - 2026-07-09

### 🧷 Store vectors "like people do" (embedding-space discipline)

Fixed a real storage defect and brought AgentBrain's memory up to production
vector-DB practice: one embedding model of record, every vector tagged +
normalized, and no cross-space comparisons.

### Fixed
- **Mixed embedding spaces in one index.** `vector.db` held vectors of 384
  (MiniLM), 768 (TF-IDF), and even 1152 dims together — cosine across different
  models/dims is meaningless. `VectorMemory` also mislabeled its dim as 768.
- Migrated the live index: purged non-384 vectors (backup kept), so only
  consistent neural vectors remain.

### Added
- **`core/embedding-service.ts`** — one shared service: L2-normalizes every
  vector (dot == cosine), tags it with `model` + `dim`, and refuses to compare
  across incompatible spaces (`compatible()` / length guard).
- **KnowledgeStore + ConversationLog** now store `embed_model` + `embed_dim`
  per row, normalize via the service, and RE-EMBED any stored vector from a
  different model/dim on read instead of trusting a bogus score. Live brain
  migrated: all 48 knowledge items now uniformly MiniLM/384, 0 null embeddings.
- **VectorMemory persist guard** — only neural vectors of the expected dim are
  written to the shared index; TF-IDF/other-dim stay in-session fallback only.

### Added — Distillation batch 2 (`distillation-corpus-domains2.ts`)
- 6 more reasoning playbooks: secrets hygiene, testing strategy, git safety,
  data/spreadsheet integrity, writing quality, estimation-with-uncertainty —
  each with Vietnamese intent anchors + common-mistake seeds.

### Verified (real run)
- 27 playbooks (22 learned); KnowledgeStore 48 items {error:17, lesson:6,
  playbook:22, procedure:3}, all MiniLM/384; held-out semantic **0.88**;
  knowledge pruned 0 (dedup → no bloat); brain.db 268K.

### Tests
- **+5 tests (302 total, green):** embedding normalization, cosine, cross-space
  refusal, model/dim compatibility, tagged-vector output.

### Added — RAG retrieval into the prompt
- The plugin now **semantically searches the KnowledgeStore every turn** and
  injects the most relevant distilled lessons/errors/procedures into Aira's
  prompt ("Tri thức liên quan (đã học)"). Verified E2E: asking to "commit .env
  lên git" retrieves the secrets/git-safety knowledge items. This closes the
  loop — stored knowledge now actually reaches Aira, not just sits in the DB.

## [0.14.0] - 2026-07-09

### 🗄️ Proper knowledge storage + daily conversation memory (no bloat)

Answers "where do people store distilled knowledge, and how does the brain
remember/search it?" — a real embedded knowledge store + a searchable daily
conversation log, both designed to stay smart and not bloat.

### Added — KnowledgeStore (`core/knowledge-store.ts`)
- Distilled knowledge now lives in a dedicated SQLite `knowledge` table, each
  row with its OWN embedding (local MiniLM), searched by semantic similarity —
  not a JSON blob. Kinds: playbook, lesson, error, procedure, fact.
- Anti-bloat by design: content-hash **dedup** (identical knowledge never
  duplicated, re-adding reinforces confidence), **usage tracking**
  (useCount/lastUsed on every retrieval), and **prune()** that drops never-used,
  low-confidence, stale items. Verified: search "con token này có lừa không"
  → surfaces the crypto-scam knowledge (0.62).

### Added — ConversationLog (`core/conversation-log.ts`)
- Every daily chat turn is stored durably (user + agent), with an embedding, so
  Aira keeps context and can search past chat instead of forgetting line to
  line. Recent-turn recall for immediate continuity + semantic recall for
  "nhớ hồi đó mình nói gì về X", injected early so it survives token trimming.
  Rolling cap + dedup keep it bounded. Verified E2E through the plugin: a
  follow-up "tiếp tục nhé" pulls back "build thanh toán tingamefi / dùng USDT".

### Added — Domain distillation (`training/distillation-corpus-domains.ts`)
- 5 domain reasoning playbooks: crypto/on-chain scam detection, code review,
  deep research w/ corroboration, ops incident diagnosis, honest pushback
  (correct the user, no sycophancy) — each with intent anchors + Vietnamese
  common-mistake seeds. Merged into training automatically.

### Changed
- Trainer writes all distilled knowledge into the KnowledgeStore (with embedding
  warmup) and prunes at the end; report now includes knowledge counts by kind
  and pruned count. Runner prints knowledge-store stats.

### Verified (real run against the live brain)
- 21 reasoning playbooks (16 learned); held-out **semantic 0.87**; KnowledgeStore
  36 items {error:11, lesson:6, playbook:16, procedure:3}, all embedded; error
  ledger 11 mistakes. Conversation recall + error reminder both reach Aira's
  prompt E2E.

### Tests
- **+11 tests (297 total, green):** knowledge-store (dedup, usage, prune,
  search) and conversation-log (record, recall, context build, trim).

## [0.13.0] - 2026-07-09

### 🎓 Opus-4.8 distillation + learn-over-time (smarter with a local model)

AgentBrain is symbolic, so "distillation" transfers Opus-4.8's *thinking* into
its real learnable stores and reinforces it — then a local model makes that
thinking generalize. Techniques mirror real KD practice: response/dark-knowledge
(confidence-weighted lessons), rationale/CoT (reasoning frames), and
hard-negative "common mistakes".

### Added — Distillation training
- **`training/distillation-corpus.ts`** — Opus-4.8 reasoning distilled into 8
  playbooks (root-cause debugging, claim verification, scope discipline, task
  decomposition, safety/reversibility, assumption surfacing, tradeoff analysis,
  clarify-ambiguous), plus autonomy/self-test/source-discrimination playbooks,
  distilled lessons, procedures, and common-mistake seeds.
- **`training/distillation-trainer.ts`** — ingests the corpus into the live
  playbook registry + LessonLearner (reinforced over epochs), seeds the Error
  Ledger, persists learned knowledge (accumulates across runs), and benchmarks.
- **`training/benchmark.ts`** — reasoning benchmark with a **held-out** probe set
  (unseen phrasings) to prove generalization, not memorization.
- **`scripts/distill-train.mjs`** — time-capped runner (default 2h) that trains
  against the real brain DB and writes `distillation-report.json`.

### Added — Smarter via the LOCAL model
- **`core/semantic-playbook-matcher.ts`** — matches reasoning playbooks by INTENT
  using the local MiniLM embeddings (already CPU-resident), not just regex.
  Held-out benchmark: regex 0.20 → **semantic 0.83**. Falls back to regex if the
  model isn't loaded. Wired into ReasoningCortex + the plugin (background warmup).

### Added — Learn from mistakes over time
- **`core/error-ledger.ts`** — remembers mistakes made + their fixes, recalls the
  relevant ones (local-embedding semantic recall, keyword fallback), and injects
  a Vietnamese "đừng lặp lại" reminder into Aira's prompt. Recurrences raise
  confidence; entries persist. The plugin records a ledger entry whenever the
  user corrects Aira, and seeds distilled common mistakes on first init.

### Autonomy / self-test / source discrimination
- New distilled playbooks push Aira to solve autonomously (fewer needless
  questions), self-test before claiming done, and weigh source reliability.

### Verified (real run against the live brain)
- benchmark 0.317 → 0.717; held-out (regex) 0.064 → 0.203; **held-out semantic
  0.831**; 16 playbooks; 6 lessons @ conf 1.0; 6 mistakes in the ledger.
- E2E through the built plugin: distilled root-cause reasoning + a past-mistake
  reminder both reach Aira's injected prompt.

### Tests
- **+18 tests (283 total, green):** distillation-trainer (incl. held-out
  generalization, persistence/accumulation, time-cap), error-ledger, and
  semantic-matcher fallback.

### Notes
- Qwen3-4B remains an advisor *hint* (not a running model). The model that runs
  locally on CPU is MiniLM (embeddings), now also powering intent matching and
  error recall.


## [0.12.0] - 2026-07-09

### 🧠💾 Mood memory + momentum — cảm xúc như người thật, xuyên session

Two fixes so Aira's emotion behaves like a real person's, per Sếp's request:
emotion must PERSIST across /new, /reset and restarts, and a mood must LINGER
through the conversation instead of resetting to neutral every message.

### Fixed
- **Emotion reset every restart.** `AffectCore` was created with `new AffectCore()`
  and never saved/loaded, so the felt emotion (the discrete mood, not just the
  neurochemistry) vanished on /new or restart.
- **Machine-like mood flips.** `applyEmotion` overwrote the mood wholesale each
  turn, so praise → warm, then a neutral next message → instantly neutral again.

### Added
- **Mood momentum (emotional inertia)** in `AffectCore`. The current mood lingers
  (`moodInertia`, default 0.8) and only yields when a new emotion is strong enough
  to overcome it (`switchResistance`, default 0.7):
  - Same feeling repeated → deepens (intensity climbs).
  - Neutral/idle turn while in a mood → mood holds, decays gently.
  - A different but weak emotion → current mood holds, tinted as secondary.
  - A strong enough emotion → switches, old mood lingers as secondary.
- **AffectCore persistence.** `serialize()` / `restore()` + `initialize()` /
  `persist()` over the storage layer (SQLite meta table via `emotional/affect.md`).
  Wired into the plugin: loaded on init, and persisted every turn plus on
  `agent_end`, so mood carries across /new and restarts.

### Tests
- **+8 tests (271 total, all green).** `affect-momentum` (mood lingers through
  neutral turns, only flips when strong enough, same-emotion deepening,
  serialize/restore + store round-trip), and two new `plugin-expression.e2e`
  cases driving the **built plugin**: a warm mood survives a plugin reload
  (simulated /new) over the shared brain dir, and lingers through neutral turns.
  Verified persistence round-trips through the real `SqlStorageAdapter`.


## [0.11.0] - 2026-07-09

### 🎭 Emotion Expression — Aira feels and shows it (không còn như bot)

Aira's second brain already *generated* real emotion internally (17 discrete
emotions over valence/arousal/dominance, moved by dopamine/serotonin/cortisol/
oxytocin). But that only reached Aira as raw numbers, so she answered flat
regardless of mood. This release adds the missing expressive layer so the felt
emotion actually changes how Aira talks.

### Added
- **`core/expression-engine.ts`** — a rich expression library ("kho biểu cảm").
  For each of the 17 emotions it holds a POOL of kaomoji + verbal tics (so the
  same feeling never looks identical twice) and maps the current emotion +
  intensity + neurochemistry into a concrete delivery profile: mood word, tone,
  energy (flat→high), verbosity, punctuation flavor, and a natural-language
  directive Aira follows. Intensity gates how much leaks out; neurochemistry
  adds texture (high dopamine = bouncy/exclamatory, high cortisol = terse/
  guarded, high oxytocin = warm "nha Sếp", low serotonin = subdued).
- **Expression injected into every prompt** via the context injector, right
  after the emotional state — e.g. praise →
  `Đang thấy ấm lòng (rõ rệt). Nói với giọng ấm áp, trìu mến… (灬º‿º灬)`,
  criticism → `Đang thấy bực (rõ rệt). Nói với giọng gắt… 凸(￣ヘ￣)`.
- **`enableExpression` config flag** (default on).
- **Đúc kết kinh nghiệm auto-surfaced** — the brain's learned insights
  (`MemoryReviewer.getInsights`) are now injected automatically as
  "Kinh nghiệm đúc kết: …" instead of only via a manual tool. (Lessons from
  corrections were already injected to remind Aira how to answer correctly.)

### Tests
- **+18 tests (263 total, all green).** New: `expression-engine` unit tests
  (variety of the kaomoji pool, intensity gating, neurochemistry modulation),
  `emotion-expression.e2e` (real AffectCore + Neurochemistry → distinct
  expression for praise/loss/threat, plus spontaneous mood drift), and
  `plugin-expression.e2e` which drives the **actual built plugin** through the
  real OpenClaw hook sequence and proves the Expression line reaches the
  injected prompt and differs by mood.

### Notes
- SOUL/AGENTS still win: expression only shapes *delivery*, never identity or
  rules. The PriorityEnforcer filters injected lines downstream.


## [0.10.1] - 2026-07-09

### 🧹 Memory Quality — Telemetry Noise Filter

AgentBrain is Aira's second brain: a durable memory store that assists OpenClaw
without replacing Aira. A store is only useful if it holds *real* memories, so
this release stops runtime/telemetry noise from ever being persisted.

### Fixed
- **Runtime telemetry was being stored as memories.** In the live brain DB two
  bogus memories had appeared:
  - `[Technical] User: ⚠ Model metadata for \`claude-opus-4-8\` not found. Defaulting to fallback metadata`
  - `[Finding] 🧮 Tokens: 61k in / 2.7k out · 💵 Cost: $0.0000`
  These are UI/status lines, not conversation, and would pollute recall forever.

### Added
- **`core/noise-filter.ts`** — centralized `isSystemNoise()` / `stripNoiseLines()`
  that detect model-metadata warnings, token/cost meters, rate-limit/retry
  plumbing, log-level prefixes, context/session status lines, and ANSI/progress
  noise.
- **Hippocampus guard** — drops memory candidates whose user turn is system
  noise and skips telemetry lines when extracting `[Finding]` data.
- **KnowledgeExtractor guard** — refuses to mine facts/entities from noise and
  strips noise lines from mixed content before extraction.
- **14 new tests** (noise-filter + hippocampus) covering the exact pollution
  observed in production. Full suite: 243 passing.

### Maintenance
- Purged the 2 polluted memories from `~/.openclaw/data/agentbrain/{brain,vector}.db`
  (backup saved as `brain.db.pre-noiseclean-*`).

### Added — Self-Heal
- **`Hippocampus.purgeNoise()`** — scans stored memories and removes any whose
  content is telemetry/system noise. Runs automatically on `initialize()` (load)
  and during every maintenance cycle, so legacy noise stored by older builds is
  cleaned without manual SQL.
- **Real deletes on prune.** `maintenance()` previously only filtered the
  in-memory array; pruned/low-confidence memories were left as orphan rows in
  the SQL store forever. Both `SqlStorageAdapter` and `BrainFileManager` now
  expose `deleteMemory()`, and maintenance deletes from storage + vector index.
- **2 more tests** (SQL self-heal on load + `purgeNoise` no-op safety) and an
  end-to-end run against a copy of the live brain confirmed 2 noise memories
  purged while the real memory was kept. Full suite: 245 passing.


## [0.10.0] - 2026-06-24

### 🎉 Major Features - Memory Review & Auto-Learning System

Inspired by Hermes Agent's self-learning capabilities, this release introduces a comprehensive memory review and auto-learning system that enables AgentBrain to continuously improve from every interaction.

### ✨ New Features

#### Memory Review System
- **Automatic Pattern Detection**
  - Repeated topic patterns (user interests)
  - Repeated correction patterns (persistent mistakes)
  - Temporal patterns (activity habits)
  - Entity co-occurrence patterns (relationships)
- **Contradiction Detection**
  - Identifies conflicting preferences, facts, and instructions
  - Automatic resolution strategies (keep-newer, keep-both, flag-for-review)
- **Memory Quality Assessment**
  - Scores memory quality (0-1 scale)
  - Flags low-quality memories for pruning
  - Content length, access count, and age-based scoring
- **Insight Generation**
  - User preference insights from patterns
  - Behavioral pattern insights from corrections
  - Knowledge cluster insights from related memories
  - Meta-learning insights about learning effectiveness
- **Gap Analysis**
  - Identifies incomplete knowledge areas
  - Tracks missing information clusters

#### Auto-Learning System
- **Outcome Tracking**
  - Records success/failure for every turn
  - Tracks user feedback signals (sentiment, markers, timing)
  - Calculates reward signals (-1 to +1)
  - Monitors confidence accuracy
- **Dynamic Strategy Adjustment**
  - Learns which strategies work best
  - Automatically adjusts strategy weights based on performance
  - Reinforces successful patterns
  - Retires low-performing strategies
- **Meta-Learning**
  - Generates insights about strategy effectiveness
  - Detects timing patterns ("faster responses → better outcomes")
  - Identifies peak performance periods
  - Tracks learning trends (improving/stable/declining)
- **Performance Analytics**
  - Success rate tracking
  - Average reward calculation
  - Response time analysis
  - Strategy performance breakdown

#### Review Scheduler
- **Time-based Triggers**
  - Configurable intervals (default: 1 hour)
  - Hourly, daily, or weekly reviews
- **Threshold-based Triggers**
  - Memory count thresholds (default: 50 new memories)
  - Time since last review thresholds
- **Smart Scheduling**
  - Prefers low-activity periods (2-6 AM)
  - Avoids peak usage times
  - Manual trigger support

### 🔧 New API Methods

#### BrainEngine Extensions
`	ypescript
// Trigger memory review
await engine.reviewMemories({ type: 'recent', trigger: 'manual' });

// Get learning statistics
const stats = engine.getOutcomeStats();

// Get review statistics
const reviewStats = engine.getReviewStats();

// Get scheduler status
const status = engine.getSchedulerStatus();

// Get strategy weights
const weights = engine.getStrategyWeights();

// Get generated insights
const insights = engine.getInsights(20);

// Get meta-learnings
const learnings = engine.getMetaLearnings();

// Shutdown (stops scheduler, persists state)
await engine.shutdown();
`

#### BrainEngine Options
`	ypescript
const engine = createBrainEngine({
  // ... existing options
  
  // New learning system options
  enableMemoryReview: true,  // default
  enableOutcomeTracking: true,  // default
  reviewScheduleConfig: {
    intervalMs: 3600000,  // 1 hour
    memoryCountThreshold: 50,
    enableSmartScheduling: true,
  }
});
`

### 🔌 New OpenClaw Plugin Tools

Three new tools exposed to OpenClaw:

#### 1. gentbrain_review_memories
Trigger manual memory review cycles.
`	ypescript
{
  scope: 'recent' | 'all' | 'topic-specific',
  topic?: string
}
`
Returns: review cycle results with findings and insights.

#### 2. gentbrain_learning_stats
Get comprehensive learning performance statistics.
`	ypescript
{}  // no parameters
`
Returns:
- Learning stats (success rate, avg reward, trend)
- Strategy performance breakdown
- Memory review statistics
- Scheduler status
- Recent meta-learnings

#### 3. gentbrain_insights
Get generated insights from memory analysis.
`	ypescript
{
  limit?: number  // default: 20
}
`
Returns:
- Memory insights (patterns, preferences)
- Meta-learnings (strategy insights, timing insights)

### 📦 New Core Modules

- **src/core/memory-reviewer.ts** (613 lines)
  - Pattern detection algorithms
  - Contradiction detection logic
  - Quality scoring system
  - Insight generation engine
  
- **src/core/outcome-tracker.ts** (467 lines)
  - Outcome recording and analysis
  - Strategy weight management
  - Meta-learning generation
  - Performance analytics
  
- **src/core/review-scheduler.ts** (140 lines)
  - Scheduling logic (time + threshold based)
  - Smart scheduling heuristics
  - Manual trigger support

### 🔄 Self-Learning Loop

The system implements a complete feedback loop:

`
User Chat → Brain Process → Response
    ↓
Track Outcome
    ↓
Analyze Feedback (sentiment, markers)
    ↓
Update Strategy Weights
    ↓
Periodic Memory Review (patterns, contradictions, insights)
    ↓
Improved Future Responses
`

### 📊 What Gets Learned

**Per Interaction:**
- Which strategies work best for which tasks
- Which memories are most useful
- User preferences and patterns
- Optimal response timing
- Confidence accuracy

**Aggregated:**
- Strategy effectiveness rankings
- Memory quality trends
- User behavior patterns
- Performance improvement trends
- Peak activity periods

### 🎯 Usage Examples

#### Example 1: Automatic Learning from Corrections
`
Turn 1:
User: "Deploy to VPS"
Agent: Uses strategy "direct"
User: "Wrong, use Docker!"
→ Negative feedback recorded
→ Strategy "direct" weight decreased

Turn 20+:
User: "Deploy to VPS"
Agent: Now prioritizes "research-first" strategy
→ Better outcome
→ Strategy weight increased
`

#### Example 2: Pattern Detection
`
After 50 memories:
System detects:
- User discusses "VPS deployment" 15 times
→ Insight: "User interest in VPS deployment"

- User corrected "Docker usage" 3 times
→ Insight: "User prefers Docker approach"

Next interaction:
Agent recalls patterns → Better initial response
`

#### Example 3: Meta-Learning
`
After analyzing 20 outcomes:
System discovers:
- Fast responses (<2s): 85% success
- Slow responses (>5s): 60% success

→ Meta-learning: "Faster responses correlate with better outcomes"
→ Agent adapts to be more decisive
`

### 💾 Storage & Persistence

Learning data is persisted in the brain database:
- Outcome records (last 500)
- Strategy weights
- Meta-learnings (last 50)
- Review history (last 50 cycles)
- Generated insights (last 100)

### 🔧 Configuration

Default configuration in openclaw.plugin.json:
`json
{
  "enableMemoryReview": true,
  "reviewScheduleConfig": {
    "intervalMs": 3600000,
    "memoryCountThreshold": 50,
    "enableSmartScheduling": true
  }
}
`

### ⚡ Performance

- Memory review cycle: 100-500ms (depends on memory count)
- Outcome tracking: <1ms per turn
- Storage overhead: +2-5MB for learning data
- CPU impact: Minimal (reviews run on schedule, not per-turn)

### 🐛 Bug Fixes

- Fixed memory sanitizer to better filter low-value messages
- Improved memory quality scoring algorithm
- Enhanced entity co-occurrence detection

### 📝 Documentation

New documentation files:
- MEMORY_REVIEW_AUTO_LEARNING_DESIGN.md - Complete architecture design
- RELEASE_NOTES_v0.10.0.md - Detailed release notes
- COMPLETE_IMPLEMENTATION_GUIDE.md - Implementation guide with examples

### ⚠️ Breaking Changes

**None!** This release is fully backward compatible.

### 🔄 Migration Guide

No migration needed. The learning system is enabled by default but doesn't require any changes to existing code.

To disable if needed:
`	ypescript
const engine = createBrainEngine({
  enableMemoryReview: false,
  enableOutcomeTracking: false
});
`

### 🙏 Credits

This release is inspired by Hermes Agent's self-learning capabilities and implements similar patterns for continuous improvement from user interactions.

### 📊 Statistics

- **Code added:** 1,220+ lines
- **New modules:** 3
- **New engine methods:** 8
- **New plugin tools:** 3
- **Development time:** ~110 minutes
- **TypeScript compilation:** ✅ Zero errors

### 🚀 What's Next (v0.11.0)

Planned features:
- Cross-session learning persistence
- Multi-agent memory sharing
- Visual dashboard for learning analytics
- Fine-tuned embedding model for agent contexts
- Memory compression for long-term storage

---

## [0.9.0] - 2026-06-15

Previous release... (existing changelog content)

