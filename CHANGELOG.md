# Changelog

## [Unreleased] - 2026-06-16

### AgentBrain / OpenClaw Runtime
- Added Qwen3-4B advisor configuration as `verifier-only` private support.
- Kept Aira/OpenClaw explicitly in control of final action and final answer; AgentBrain/Qwen only critique, verify, and guide evidence quality.
- Increased Brain Whisper budget and formatting so critical guidance survives prompt injection.
- Added advisor metadata to OpenClaw plugin config and runtime manifest injection.

### ReasoningCortex Training
- Added frontend artifact QA playbook for landing pages, responsive UI, browser/screenshot verification, visual quality, and honest reporting.
- Added anti-AI-template checks: reject vague slogans, empty mockups, arbitrary decorative geometry, fake logo rows, blank reveal-on-scroll screenshots, and generic content that could fit any company.
- Added code/tool execution QA playbook: inspect files before editing, tie claims to command output/diff/runtime evidence, run targeted tests, and report blocked or failed tools plainly.
- Added Vietnamese and non-accented prompt matching for Aira workflows such as `tao landing`, `kiem tra`, `song dong`, `nhin AI`, `chay tool`, and `sua bug`.
- Kept market/source filtering playbooks separate from local UI/code verification so `kiem tra` does not incorrectly trigger live-data sourcing.

### Verification
- Added focused ReasoningCortex tests for Qwen3-4B advisor-only behavior, frontend realism, Vietnamese prompts, code-tool evidence rules, and live-source routing.
- Verified runtime prompt output from `dist`:
  - Landing prompts activate `frontend-artifact-quality` with Qwen3-4B `verifier-only`.
  - Code/tool prompts activate `code-tool-execution-quality` with real evidence rules.
  - PRL/source prompts activate live-data/source-triangulation playbooks.
- Verified build and full test suite locally: `npm run build` passed; `npm test` passed with 16 files and 229 tests.

### Landing Page Runtime Test Artifacts
- Generated and reviewed OpenClaw landing test artifacts under `.codex-openclaw-landing-real-test/`.
- Rendered desktop and mobile screenshots with Playwright and checked console errors, page errors, failed requests, horizontal overflow, hidden cards, and tall empty sections.
- Fixed the studio artifact so content is visible by default, no-scroll screenshots are complete, and the page has a lived-in workbench preview instead of hidden reveal-only sections.

## [0.5.0] - 2026-06-09

### 🧠 Intelligence Upgrade: Memory Quality + Emotional Stability + Learning Loop

A comprehensive 5-phase upgrade targeting recall precision, emotional stability, context-aware reasoning, and adaptive personality learning from user feedback.

#### Phase 1: Memory Cleanup
- **Raised quality thresholds** to reduce noise and improve recall precision:
  - `minMemoryConfidence`: 0.2 → 0.4 (prune weak memories)
  - `minSimilarity` (vector recall): 0.3 → 0.5 (stricter semantic matching)
- **Result**: Memory count reduced from 204 → 180 (-12% noise). Recall no longer returns irrelevant praise/chat fragments when querying technical context.
- **Changed files**: `src/core/config.ts`, `src/core/vector-memory.ts`, `src/core/hippocampus.ts`

#### Phase 2: Emotional Tuning
- **Fixed stuck emotion loop**: Agent would enter `alarmed` or `anger` state and remain there indefinitely.
- **Root cause**: Threat assessment incorrectly used lingering `emo.mood === 'alarmed'` instead of assessing the current message, creating a self-reinforcing loop.
- **Solution**: Threat detection now uses fresh `assessThreat(text)` per message, decoupled from persisted mood state. Increased decay rate toward neutral baseline.
- **Result**: Emotions now respond accurately to context and recover naturally.
- **Changed files**: `src/plugin/entry.ts` (affect appraisal logic)

#### Phase 3: Personalized Recall (Task-Type Filter)
- **Problem**: Generic recall returned memories unrelated to task context (e.g., coding queries returned praise fragments).
- **Solution**: Added task-type classification and filtering:
  - Types: `coding`, `content`, `crypto`, `ops`, `project`, `general`
  - When query matches a task type (e.g., "fix bug"), recall filters memories by matching tags
  - Generic queries remain unfiltered
- **Result**: 
  - Query "fix agentbrain bug" → returns only 5 `coding`-tagged memories
  - Query "xong chưa" → returns 2 general status memories
  - No more irrelevant recall pollution
- **Changed files**: `src/core/hippocampus.ts`

#### Phase 4: Context Reasoning (Status-Check Short-Circuit)
- **Problem**: Status-check queries like "Xong chưa", "Sao rồi", "Tới đâu rồi" were not handled with appropriate brevity.
- **Solution**: 
  - Added `status-check` topic to Thalamus classifier with pattern matching
  - Default urgency `medium` (unless explicit urgency markers like "gấp/nhanh" → `high`)
  - Brain context injection now includes hint: "⚡ Status-check query: keep reply brief (≤3 sentences)"
- **Added urgency keywords**: `gấp`, `nhanh`, `ngay`, `liền` to high-urgency list
- **Result**: Status queries are now classified correctly and agent self-regulates response length
- **Changed files**: `src/core/thalamus.ts`, `src/integration/context-injector.ts`

#### Phase 5: Learning Loop (Adaptive Personality from Feedback)
- **Problem**: Personality traits were static; no learning from user reactions or corrections.
- **Solution**: Built a complete feedback → learning → adjustment pipeline:

##### 5.1 FeedbackAnalyzer (`src/core/feedback-analyzer.ts`, 143 lines)
- **Reaction timing detection**:
  - Quick reply (<30s) = positive engagement
  - Slow reply (>5min) = neutral/busy
  - No reply (30min+) = possible dissatisfaction
- **Sentiment classification**: praise (`hay`, `tốt`, `ok`, `cảm ơn`) vs correction (`sai`, `tệ`, `dài dòng`, `lỗi`)
- **Feedback markers**: `too_verbose`, `too_brief`, `unclear`, `slow`, `good`, `error`
- **Reward signal**: converts feedback → numeric reward (-1 to +1) weighted by confidence

##### 5.2 PersonalityAdjuster (`src/core/personality-adjuster.ts`, 132 lines)
- **Adjustment rules** based on feedback patterns:
  - `too_verbose` ×2 → `directness` +8 (be more concise)
  - `too_brief` ×2 → `directness` -8 (add more detail)
  - `unclear` ×2 → `warmth` +5 (add supportive context)
  - `good` ×3 → `warmth` +3 (reinforce current balance)
- **Anti-overfitting constraints**:
  - Max ±5 per individual adjustment
  - Max ±20 per trait per week
  - Oscillation detection (conflicting adjustments) → freeze trait 24h

##### 5.3 Integration (`src/plugin/entry.ts`)
- **message_received hook**: Analyzes user message as feedback signal, records timing
- **message_sent hook**: Records agent reply timestamp for reaction time measurement
- **Every 10 interactions**: Triggers personality adjustment based on accumulated feedback patterns
- **Adjusted traits** applied to both `AnteriorCingulate` and `PersonalityInfluence` modules

##### Verification
- Feedback detection test:
  - "dài dòng quá em ơi" (15s) → sentiment: negative, marker: `too_verbose`, reward: -0.56
  - "ok hay đó" (8s) → sentiment: positive, marker: `good`, reward: +1.00
  - "sai rồi em" (20s) → sentiment: negative, marker: `error`, reward: -0.32
  - "cảm ơn em nhiều" (5s) → sentiment: positive, reward: +0.56
- Personality adjustment test:
  - Pattern: `too_verbose` ×3 → `directness` adjusted 75 → 80 (+5)
  - Result: Agent will respond more concisely after learning user dislikes verbosity

**Result**: Agent now learns tone preference from user reactions over time. Personality traits evolve based on real feedback patterns.

**Changed files**: `src/core/feedback-analyzer.ts` (new), `src/core/personality-adjuster.ts` (new), `src/core/cingulate.ts` (+`updatePersonality()` method), `src/plugin/entry.ts`

---

### 🧪 Verification

#### Unit Tests
- ✅ Memory recall filter: coding query → 5 coding-tagged memories
- ✅ Status-check detection: "Xong chưa" → `topic: status-check`
- ✅ Feedback timing + sentiment → reward signal conversion
- ✅ Personality adjustment: `too_verbose` pattern → `directness` +5

#### Integration Tests
- ✅ Subagent spawn → brain context injected successfully
- ✅ Subagent receives mood/personality/memories in prompt
- ✅ Task execution verified (30 .ts files found in core/)
- ✅ Completion event routing → parent session receives result

#### Regression
- ✅ TypeScript compilation: no errors
- ✅ Gateway restart: successful, v0.4.1 → v0.5.0
- ✅ All existing brain modules operational

---

### 📊 Impact Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Memory count** | 204 | 180 | -12% (noise pruned) |
| **Recall precision** | Low (returns irrelevant praise) | High (task-type filtered) | ✅ Significant improvement |
| **Emotional stability** | Stuck in alarmed/anger loops | Stable, context-responsive | ✅ Fixed |
| **Status-check handling** | Verbose, no special treatment | Brief (≤3 sentences), auto-detected | ✅ Optimized |
| **Personality learning** | Static, no adaptation | Dynamic, learns from feedback every 10 turns | ✅ New capability |

---

### 🔧 Breaking Changes
None. All changes are backward-compatible enhancements to existing modules.

---

### 📦 New Dependencies
None. All new modules built with existing TypeScript + Better-SQLite3 stack.

---

### 🚀 Upgrade Notes
- **No migration required**. Existing brain state files remain compatible.
- **Personality learning** is automatic and incremental. No manual configuration needed.
- **Memory quality** improves immediately upon restart as thresholds are applied.

---

## [0.8.1] - 2026-05-31

### 🔧 Fix: Vietnamese sentiment detection (feeds AffectCore)

The v0.8.0 dual-judge audit (Codex + native subagent) flagged that genuine
Vietnamese praise often scored `neutral` through the engine, capping affect
quality — the bottleneck was the old keyword classifier, not AffectCore.

- `src/core/amygdala.ts` — `detectSentiment()`:
  - Expanded the Vietnamese lexicon (praise: `giỏi`, `làm tốt`, `chuẩn`,
    `xịn`, `quá hay`…; affection: `thương`, `quý`, `mến`, `cưng`; sadness,
    anger, breakage and slowness terms), plus simple negation (`không được`,
    `chẳng ra gì`) so negated praise reads negative.
  - Replaced score-averaging with a saturating probabilistic-OR per polarity
    (`1 - Π(1 - w)`), so a strong signal stays strong instead of being diluted
    by a second weaker match. Plain messages still return exactly `0`.
- Word-boundary anchored ambiguous English tokens (`ok`, `good`, `nice`) to
  avoid matching inside unrelated words.

#### Verification
- Engine E2E: "em làm tốt lắm" / "chuẩn rồi đó" now → affection (V ≈0.61),
  previously neutral.
- Regression unchanged: vitest 207/207, affect 14/14, engine-sdk 23/23,
  phase2 24/24, codex-agent-eval 19/19, codex-affect-eval 12/12, neurochem green.

## [0.8.0] - 2026-05-31

### ✨ Generative affect via cognitive appraisal (AffectCore)

Until now emotion was *reactive*: keywords → valence → a mood label. v0.8.0
adds a layer that *generates* discrete emotions the way appraisal theory
(Scherer / OCC) describes — by evaluating a situation against the agent's own
goals, drives, expectations and sense of control, and by drifting on its own
when nothing is happening.

#### New
- `src/core/affect-core.ts` — `AffectCore` with two emotion sources:
  - `appraise(input, trigger)` — event-driven. The SAME valence yields a
    DIFFERENT discrete emotion depending on **agency** (who caused it),
    **coping potential** (can I handle it), **novelty** (did I expect it) and
    **certainty**. Praise-from-user → affection; own success → pride; a threat
    the agent can handle → protective anger; one it can't → fear; a settled
    loss → sadness. Returns a discrete emotion plus a VAD
    (valence/arousal/dominance) vector.
  - `tick(intero)` — spontaneous. With NO input, mood still drifts from
    interoception: neglected drives breed restlessness, stress breeds
    background anxiety, low circadian alertness breeds boredom, serotonin sets
    the mood floor. This is what makes affect self-generated, not just
    stimulus-response.
- Wired into the engine: `processTurn()` now returns a `feeling`
  (label + VAD) generated by appraisal alongside the existing `emotionalState`;
  `tick()` advances spontaneous affect; `getState()` exposes `affect`.
- Barrel exports `AffectCore` and its types (`EmotionLabel`, `DiscreteEmotion`,
  `AppraisalInput`, `AffectState`, `EmotionVAD`, `Agency`).

#### Verification
- New `test/affect-verify.mjs`: 14/14 — proves agency/coping/novelty change the
  felt emotion at constant valence, and that emotion arises with no input.
- Regression: vitest 207/207, engine-sdk 23/23, phase2 24/24,
  codex-agent-eval 19/19, neurochem-verify green.

## [0.7.0] - 2026-05-31

### ✨ Agent-neutral SDK engine (createBrainEngine)

Responds directly to the independent v0.6.0 audit: the brain was real but
still "plugin-shaped" — callers had to wire modules by hand, key classes
weren't exported, and there was no clean importable entrypoint. v0.7.0 adds a
stable SDK any external agent (Codex, Claude, a CLI, a test) can drive.

#### New
- `src/engine.ts` — `createBrainEngine(options)` owns all orchestration. One
  call wires Thalamus, Hippocampus, Amygdala, Neurochemistry, Hypothalamus,
  Brainstem, CorpusCallosum, GlobalWorkspace and TheoryOfMind together.
  - `init()` — idempotent async setup.
  - `processTurn({ message, userId, ... })` — one stable call per turn;
    returns a typed, deep-cloned `TurnResult` (classification, sentiment,
    threat, emotionalState, neurochemistry, focus, relevantMemories).
  - `tick()` — advance spontaneous drift (drives, chems, mood) with no input.
  - `getState()` — full introspection (all modules, memories, relationships).
  - `persist()` — write state to disk.
- `src/index.ts` — barrel re-exports `createBrainEngine` as the **primary
  public entrypoint**, plus `TurnInput`, `TurnResult`, `BrainEngineOptions`,
  `BrainState`.
- **Decoupled** from OpenClaw plugin contract: engine no longer depends on
  `gateway.json` config or expects the plugin hook structure. SQL adapter is
  optional; file storage is default.

#### Breaking changes
- The engine now expects `processTurn(input)` instead of wiring modules
  yourself. If you called `Hippocampus`, `Amygdala` etc. directly, migrate to
  `createBrainEngine` → `engine.processTurn({ message, userId, … })`.

#### Verification
- New `test/engine-sdk.mjs`: 23/23 — proves engine is usable from a standalone
  script with no OpenClaw config, persists to disk, ticks autonomously, and
  returns typed turn results.
- Regression: vitest 207/207, phase2 24/24, codex-agent-eval 19/19.

## [0.6.0] - 2026-05-30

### ✨ Brain completeness audit + Phase 2 emotional engine

An independent dual-agent audit (Codex + native subagent) verified the brain
is real, then extended it with 8 new modules that model internal state —
drives, stress, circadian rhythms, neurochemistry, autonomic threat response,
inter-module conflict detection, and theory of mind. These modules integrate
with each other and run whether or not the user is talking.

#### Verified real (pre-existing)
- Thalamus, Hippocampus, Amygdala, PrefrontalCortex, AnteriorCingulate,
  Cerebellum, BasalGanglia, TemporalLobe, ParietalLobe, Insula — all present,
  non-stub, with real logic and state.
- Memory consolidation, skill tracking, emotional processing, reflection,
  reward signals, spatial/time encoding — all verified operational.

#### New modules (Phase 2)
- **Hypothalamus** (`src/core/hypothalamus.ts`): homeostatic regulation.
  Tracks drives (curiosity, social connection, novelty, rest, achievement).
  Each drive grows when neglected, shrinks when satisfied. Circadian alertness
  rises in the morning, falls at night. Stress accumulates under threat,
  decays when calm. Outputs homeostatic state that feeds other modules.
- **Brainstem** (`src/core/brainstem.ts`): autonomic fight/flight/freeze
  response. Records threat events, tracks time since last threat, triggers
  alert state when threats are recent or severe. Runs even when idle (via
  `pump()`).
- **Neurochemistry** (`src/core/neurochemistry.ts`): models dopamine
  (reward/motivation), serotonin (mood floor), cortisol (stress), oxytocin
  (social bond). Levels rise/fall based on events (reward, threat, social
  interaction) and decay toward baseline over time. Influences mood and
  decision-making.
- **CorpusCallosum** (`src/core/corpus-callosum.ts`): inter-module
  communication bus. Modules send typed messages (`classification`, `emotion`,
  `threat`, `user-model`) to each other. Detects conflicts (e.g., amygdala
  alarmed but hypothalamus calm) and flags them for metacognition.
- **GlobalWorkspace** (`src/core/global-workspace.ts`): attentional spotlight.
  Modules compete for focus based on salience. The most salient module
  (e.g., amygdala during a threat, thalamus during an urgent task) wins the
  spotlight and influences response priority.
- **TheoryOfMind** (`src/core/theory-of-mind.ts`): models other agents (users).
  Tracks sentiment history, topic preferences, interaction frequency, and
  expectations per user. Predicts what a user might want based on their past
  behavior and recent context.
- **Metacognition** (`src/core/metacognition.ts`): self-monitoring. Tracks
  confidence in recent decisions, detects repeated failures or stuck states
  (e.g., same plan failing twice), and triggers strategy shifts when stuck.
- **Circadian module** (`src/core/circadian.ts`): time-of-day awareness. Maps
  hour → alertness level (0-1), so the agent knows when it's morning (alert)
  vs late night (low energy). Feeds into hypothalamus and affect.

#### Integration
All Phase 2 modules are wired into `src/plugin/entry.ts`:
- Every message: hypothalamus observes topic/sentiment, brainstem checks for
  threats, theory-of-mind updates user model, corpus callosum routes signals,
  global workspace competes modules for focus.
- Every heartbeat: drives grow, neurochemistry decays, autonomic state ticks.
- Metacognition runs on reflection to detect stuck patterns.
- State persists to `brain/*.md` files via file manager.

#### Verification
- New phase2 test suite (`test/phase2-verify.mjs`): 24/24 passing.
  - Hypothalamus: drives grow when neglected, shrink when satisfied; circadian
    alertness rises in morning, falls at night; stress accumulates under threat.
  - Brainstem: fight/flight triggered by recent threats, decays over time.
  - Neurochemistry: dopamine rises on reward, serotonin sets mood floor,
    cortisol rises under stress, all decay toward baseline.
  - CorpusCallosum: inter-module messages routed correctly, conflicts detected
    (e.g., amygdala alarmed + hypothalamus calm).
  - GlobalWorkspace: highest-salience module wins spotlight.
  - TheoryOfMind: user model tracks sentiment/topics/frequency.
  - Metacognition: detects stuck patterns (same plan fails twice).
- Codex agent ran dual-audit workflow: read all modules, verified logic,
  executed test suite, confirmed all modules pass. Report:
  `workspace/agentbrain-audit-2026-05-30-codex.md`.
- Native subagent cross-check: independent verification of Codex findings,
  confirmed all modules real and operational. Report:
  `workspace/agentbrain-audit-2026-05-30-native.md`.

#### Docs
- New architecture doc: `docs/architecture.md` — full module map, data flow,
  and interaction diagram.
- Updated README with Phase 2 features and SDK usage examples.

## [0.4.1] - 2026-05-28

### 🔧 Fix: Stuck arousal + missing decay

Arousal spiked to 1.0 on any strong emotion and stayed there forever, making
every subsequent turn feel "hyper" regardless of actual context.

- `src/core/amygdala.ts`:
  - Added `decayToward(targetMood, rate)` — drifts mood/arousal toward a
    baseline over time (called on heartbeats, not just messages).
  - Arousal now decays by 0.1 per heartbeat if no strong emotion is present.
  - Valence drifts toward 0 (neutral) by 0.05 per heartbeat.
- `src/core/neurochemistry.ts`:
  - Added `decay(timeDelta)` — all neurotransmitters (dopamine, serotonin,
    cortisol, oxytocin) now drift toward their baseline over time.
  - Decay rates: dopamine/cortisol -0.05/tick, serotonin/oxytocin -0.02/tick.
- `src/plugin/entry.ts`:
  - Heartbeat hook now calls `amygdala.decayToward('neutral', 0.02)` and
    `neurochem.decay(1)` to advance autonomous drift.

**Result**: Emotions recover naturally over time instead of staying stuck at
peak intensity.

**Verification**: Manual test — triggered strong emotion (valence 0.8, arousal
1.0), then sent 3 heartbeat polls. Arousal decayed 1.0 → 0.9 → 0.8 → 0.7,
valence drifted 0.8 → 0.75 → 0.7. Mood transitioned from `joyful` →
`interested` → `neutral`.

## [0.4.0] - 2026-05-27

### ✨ Phase 0: Foundation modules + SQL storage

The original markdown-based brain worked but had no memory search, no real
emotional state tracking, and no multi-session support. v0.4.0 rebuilds the
foundation with SQL storage, vector memory, and baseline emotional/cognitive
modules that actually run.

#### Core modules (non-stub, fully wired)
- **Thalamus** (`src/core/thalamus.ts`): sensory gating + message classification.
  Detects topic (coding, content, crypto, ops, general), urgency (low/medium/high/critical),
  intent (question, action_request, statement), and whether action is required.
  Every message is classified before other modules see it.
- **Hippocampus** (`src/core/hippocampus.ts`): episodic + semantic memory.
  Stores conversations as memories (episodic), facts (semantic), and skills
  (procedural). Vector-based recall using embeddings + keyword fallback.
  Consolidates short-term buffer into long-term storage. Memory confidence
  decays over time (forgetting curve).
- **Amygdala** (`src/core/amygdala.ts`): emotional processing + threat detection.
  Detects sentiment (positive/negative/neutral), assesses threat level
  (none/low/medium/high/critical), tracks emotional state (mood, valence, arousal).
  Relationships: tracks trust + depth per user, adjusts emotional response
  based on relationship history.
- **Neurochemistry** (`src/core/neurochemistry.ts`): models dopamine (reward),
  serotonin (mood baseline), cortisol (stress), oxytocin (social bonding).
  Levels rise/fall based on events, decay toward baseline, influence mood.
- **AnteriorCingulate** (`src/core/cingulate.ts`): self-reflection + personality.
  After significant interactions, reflects on what went well/poorly, adjusts
  personality traits (warmth, assertiveness, directness, humor, curiosity,
  protectiveness) based on performance. Tracks growth over time.
- **Cerebellum** (`src/core/cerebellum.ts`): motor learning + skill tracking.
  Detects repeated skill usage (coding, writing, debugging, research), tracks
  success rate, builds fluency over time. Detects relationship interaction
  patterns (praise, correction, question, command).
- **BasalGanglia** (`src/core/basal-ganglia.ts`): reward processing + motivation.
  Records positive/negative feedback signals, builds behavior reinforcement
  scores, computes motivation level for different task types. High historical
  success → higher motivation for that task type.
- **PrefrontalCortex** (`src/core/prefrontal.ts`): executive planning +
  working memory. Plans multi-step responses, tracks active goals, inhibits
  impulsive reactions when needed, maintains working memory of recent context.
- **TemporalLobe** (`src/core/temporal.ts`): semantic comprehension. Extracts
  concepts/entities/relationships from text, encodes timestamps, provides
  richer semantic representation than raw text.
- **ParietalLobe** (`src/core/parietal.ts`): spatial/sensory integration.
  Integrates multi-modal inputs (text, images, time-of-day), tracks attention,
  provides holistic situational awareness.
- **Insula** (`src/core/insula.ts`): interoception + user-state modeling.
  Models user emotional state, time-of-day effects, interaction frequency,
  success rate. Helps predict user needs before they ask.

#### Storage
- **SQL adapter** (`src/storage/sql-adapter.ts`): replaces markdown files for
  core state. Uses Better-SQLite3. Schema: memories, personality, emotions,
  neurochemistry, skills, relationships, reflections. Faster than file I/O,
  supports complex queries.
- **Vector memory** (`src/core/vector-memory.ts`): semantic memory search.
  Stores embeddings for all memories, computes cosine similarity for recall.
  Falls back to TF-IDF when embeddings unavailable. Integrates with OpenClaw's
  embedding cache (SQLite + embeddinggemma-300m).
- **Brain database** (`src/storage/brain-db.ts`): typed SQL wrapper. Migrations,
  schema init, CRUD for all brain entities.

#### Integration
- **Plugin hooks**: `before_prompt_build` (inject brain context), `message_received`
  (process incoming), `message_sent` (consolidate memory + reflection),
  `agent_end` (persist state).
- **Context injection** (`src/integration/context-injector.ts`): builds
  markdown-formatted brain state (mood, personality, working memory, relevant
  memories) and injects into agent prompt. Optional priority enforcement
  (critical signals go first).
- **Heartbeat**: every heartbeat poll, brain ticks autonomously — emotions
  decay, memories consolidate, drives grow.

#### Verification
- All modules tested in isolation: thalamus classification, hippocampus recall,
  amygdala threat detection, neurochemistry decay, cingulate reflection,
  cerebellum skill tracking, basal ganglia reward.
- End-to-end: message → classification → emotion → memory recall → reflection
  → persistence. Verified via manual testing + trace logs.

#### Breaking changes
- Old markdown-only storage is deprecated. Brain now uses SQL by default.
  Existing markdown memories are migrated on first init (one-time auto-import).

## [0.3.0] - 2026-05-15

### ✨ Multi-session memory + proactive engine

- **Proactive suggestions**: brain now proposes next actions based on detected
  patterns (e.g., "You usually run tests after code changes — want me to run
  them now?").
- **Lesson learning**: detects corrections from user, stores "wrong → right"
  lessons, applies them in future similar contexts.
- **Knowledge extraction**: pulls structured facts from conversations, stores
  them separately from episodic memories for faster lookup.
- **Session-scoped memory**: different sessions (Telegram, Slack, CLI) maintain
  separate short-term buffers but share long-term semantic knowledge.

## [0.2.0] - 2026-05-01

### ✨ Personality system + emotional memory

- **Personality traits**: warmth, assertiveness, directness, humor, curiosity,
  protectiveness. Traits influence tone and decision-making.
- **Emotional tagging**: memories are tagged with emotional context (joy, fear,
  anger, sadness, trust). Recall prioritizes emotionally salient memories.
- **Relationship tracking**: per-user trust + interaction depth scores.

## [0.1.0] - 2026-04-20

### 🎉 Initial release

- **Memory consolidation**: short-term buffer → long-term markdown files.
- **Skill tracking**: detects repeated tasks, tracks fluency.
- **Reflection**: end-of-day self-assessment, growth tracking.
- **OpenClaw plugin**: hooks into message lifecycle, injects brain context into prompts.
