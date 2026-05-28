# Changelog

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
