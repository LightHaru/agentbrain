# Changelog

## [0.5.0] - 2026-05-31

### ✨ Phase 3 — Neurochemistry (Neuromodulator System)

#### New module: `src/core/neurochemistry.ts`
- Four neuromodulators give emotion real **momentum** instead of a fixed inertia constant:
  - **Dopamine** (reward/motivation) — spikes on praise/success, fast decay (0.18/hb).
  - **Serotonin** (mood floor/wellbeing) — slow tonic baseline (0.04/hb); sustained positivity raises the floor.
  - **Cortisol** (stress) — spikes on threats by severity, slow decay (0.08/hb) so stress lingers.
  - **Oxytocin** (bonding/trust) — rises on praise/warm contact.
- `applyEvent()` pushes chemicals from sentiment/threat/bonding; `modulate()` returns valence/arousal bias + dynamic inertia + `dangerOverride`; `decay()` drifts toward baseline on heartbeats.

#### Wired into Amygdala (the real pipeline, not a shell)
- `updateEmotionalState` now uses **dynamic inertia** (serotonin stabilizes, cortisol destabilizes) instead of fixed 0.6.
- **Amygdala hijack:** high/critical threats override a good mood → forces `alarmed` (valence ≤ -0.3, arousal ≥ 0.8) so the agent never stays 'excited' while a scam is on the table.
- Bonding/praise detection feeds oxytocin.

#### Plugin (`entry.ts`)
- Neurochemistry initialized, attached to amygdala, decays on heartbeat, persists to `emotional/neurochemistry.md`.
- `agentbrain_status` now reports `neurochemistry` levels + signal; `neurochemistry: true` is a REAL module (unlike the 5 declared-but-empty Phase 2 shells — tracked as tech debt).

#### Tests
- `test/neurochem-verify.mjs` (8 behavioral assertions) + `test/neurochem-integration.mjs` (3 scenarios) all pass.
- Existing suite green: 207/207.

## [0.4.1] - 2026-05-28

### 🐛 Bug Fixes

#### Success Rate Calculation (Cingulate)
- **Fixed:** Neutral interactions now correctly count as success
- Changed threshold: sentiment >= -0.1 = success (was > 0.1)
- Only sentiment < -0.3 counts as failure
- Result: Success rate now accurately reflects ~80%+ instead of inflated 23%

#### Circadian Rhythm & Alertness
- **New:** `circadian.ts` module with timezone-aware phase detection
- **Fixed:** 21:00 Asia/Ho_Chi_Minh now correctly shows as "evening" (alertness 0.6)
- Phase mapping for UTC+7:
  - morning (6-12): alertness 0.8
  - afternoon (12-17): alertness 0.7
  - evening (17-22): alertness 0.6
  - late-night (22-02): alertness 0.3
  - deep-night (02-06): alertness 0.1
- Insula now tracks circadian phase and adjusts alertness based on energy/fatigue

#### User Modeling (Theory of Mind)
- **Fixed:** Insula.modelUserState() now receives data every turn in before_prompt_build
- User emotion, goals, frustration, and satisfaction are tracked per interaction
- Relationship data (trust, depth) feeds into user state model
- activeUsers and currentUserModel now populated correctly

### 🚀 Enhancements

#### Working Memory Expansion
- **Increased:** Prefrontal working memory capacity from 5 → 7 items
- Allows agent to track more context in complex multi-step tasks

#### Web-Research Skill
- **Added:** `web-research` skill category to Cerebellum
- Detects: search, lookup, fact-check, source, citation patterns
- Tracks proficiency and success rate for research tasks

#### Source Routing (Procedural Memory)
- **Added:** ProceduralMemory type to KnowledgeExtractor
- Learns best sources for specific queries:
  - "PRL price" → DexScreener API
  - "token price" → DexScreener
  - "GameFi news" → TinGameFi.com
- Tracks confidence, timesUsed, successRate per route
- `queryProcedural(trigger)` returns best source for a topic

### 📝 Tests
- **Updated:** Working memory test now expects max 7 items (was 5)
- All 207 tests passing

---

## [0.3.0] - 2026-05-28

### 🚀 Major: SQLite Storage + Smart Modules

#### Storage Migration (Markdown → SQLite)
- **New:** `BrainDatabase` — full SQLite storage with 9 tables (memories, facts, entities, lessons, patterns, relationships, personality, reflections, skills, habits)
- **New:** `SqlStorageAdapter` — drop-in replacement for BrainFileManager, zero module rewrites needed
- **New:** `migrate-to-sql.ts` — one-shot migration from .md files to brain.db
- UNIQUE constraint on content_hash prevents duplicate memories at DB level
- WAL mode for concurrent read/write performance
- Atomic transactions — no more corrupted half-written files

#### New Modules
- **VectorMemory** — embedding-based semantic recall using cosine similarity. Reuses OpenClaw's embedding cache (embeddinggemma-300m, 768 dims) with TF-IDF fallback. Own SQLite vector store.
- **KnowledgeExtractor** — extracts structured facts (subject→relation→object), entities (addresses, numbers, tools), and detects corrections (fact superseding).
- **LessonLearner** — detects user corrections/frustration, extracts actionable lessons ("don't X, do Y"), reinforces on repetition, injects into context to prevent repeated mistakes.
- **PersonalityInfluence** — translates trait values (warmth, directness, protectiveness...) into concrete style directives that actually affect generation. Context-aware: adapts to time-of-day, mood, trust level, user sentiment.
- **ProactiveEngine** — pattern-based action suggestions with time/keyword/absence/threshold triggers. Learns new patterns, reinforces/weakens based on user response.

#### Bug Fixes
- **Fixed:** Memory deduplication — `consolidate()` now checks content before creating, merges tags for duplicates
- **Fixed:** accessCount inflation — only increments for memories scoring > 0.5 relevance
- **Fixed:** Trust calculation — neutral interactions now build trust (+0.2), positive boost increased to +1.5, negative threshold raised to -0.3
- **Fixed:** Success rate — neutral/mildly positive sentiment now counts as success (user didn't complain = task OK)
- **Fixed:** Temporal/Parietal/Insula modules now receive data every turn in onPreResponse
- **Fixed:** Memory extraction — stores structured facts ([Decision], [Fact], [Data], [Finding], [Technical]) instead of raw messages
- **Fixed:** Hippocampus regex patterns (case-insensitive flag added)

#### Integration
- `onPreResponse` now runs 14-step pipeline: Thalamus → Temporal → Parietal → Insula → Hippocampus (vector recall) → Amygdala → Prefrontal → Cerebellum → Lessons → PersonalityInfluence → ProactiveEngine → ContextInjector
- `onPostResponse` adds KnowledgeExtractor + LessonLearner + PersonalityInfluence update
- `onHeartbeat` persists lessons, patterns, and facts to SQL
- `shutdown` cleanly closes all DB connections

#### Tests
- 207 tests across 15 test files (4 new test files for new modules)
- All passing

---

## [0.2.0] - 2026-05-26

### Phase 2: Extended Brain Architecture

#### New Modules
- Temporal Lobe — language comprehension, semantic memory
- Parietal Lobe — sensory integration, attention allocation
- Insula — interoception, user state modeling
- Working Memory — active context management
- Metacognition — confidence tracking, strategy selection
- Hypothalamus — circadian rhythm, drives, homeostasis
- Brainstem — alertness, reflexes, autonomic processes
- Corpus Callosum — inter-module communication
- Global Workspace — consciousness simulation, attention competition
- Theory of Mind — user modeling, perspective tracking

#### Core
- 16 modules online
- Brain-inspired architecture with biologically-named components
- Priority Enforcer ensures SOUL.md > AGENTS.md > Brain state
- Context Injector with token budget management

---

## [0.1.0] - 2026-05-25

### Phase 1: Foundation

- Thalamus (message classification)
- Hippocampus (memory formation & retrieval)
- Amygdala (emotion processing & relationships)
- Anterior Cingulate (reflection & personality evolution)
- Cerebellum (skill tracking & habit detection)
- Basal Ganglia (reward processing & motivation)
- Prefrontal Cortex (planning & working memory)
- Markdown file storage (BrainFileManager)
- OpenClaw plugin integration
- 172 tests passing
