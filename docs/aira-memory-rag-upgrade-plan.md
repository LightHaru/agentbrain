# Aira Memory and RAG Upgrade Plan

This note turns the current research pass into a practical AgentBrain roadmap.
It focuses on better recall, cleaner memory consolidation, and OpenClaw-native
delivery.

## Sources Read

- RAG foundation: Lewis et al., "Retrieval-Augmented Generation for
  Knowledge-Intensive NLP Tasks" (arXiv:2005.11401).
- Self-RAG: Asai et al., "Learning to Retrieve, Generate, and Critique through
  Self-Reflection" (arXiv:2310.11511).
- RAPTOR: Sarthi et al., "Recursive Abstractive Processing for Tree-Organized
  Retrieval" (arXiv:2401.18059).
- GraphRAG: Edge et al., "From Local to Global: A Graph RAG Approach to
  Query-Focused Summarization" (arXiv:2404.16130), plus Microsoft GraphRAG docs.
- MemGPT: Packer et al., "Towards LLMs as Operating Systems"
  (arXiv:2310.08560).
- Generative Agents: Park et al., "Interactive Simulacra of Human Behavior"
  (arXiv:2304.03442).
- Karpathy-inspired coding skill: multica-ai/andrej-karpathy-skills.
- OpenClaw docs: Building plugins, Skills, Plugin runtime helpers, and
  Gateway Tools Invoke API.

## Research Takeaways

1. RAG works because it combines parametric model knowledge with external
   non-parametric memory. For AgentBrain, the external memory is the SQLite
   brain DB plus vector and graph indexes.
2. Naive top-k vector recall is not enough. Self-RAG suggests retrieval should
   be adaptive: decide whether to retrieve, critique retrieved evidence, and
   avoid stuffing irrelevant memories into the prompt.
3. RAPTOR suggests a brain-like hierarchy: raw episodes at the leaf level,
   cluster summaries above them, and high-level reflections at the top.
4. GraphRAG is useful when the user asks broad or cross-project questions.
   Entity and relationship expansion should complement vector search.
5. MemGPT maps well to AgentBrain: working memory, short-term memory, and
   archival memory should move information between tiers instead of treating
   all context as equal.
6. Generative Agents reinforces three core loops: observe, retrieve, reflect.
   Reflection should synthesize repeated episodes into stable beliefs and
   plans.
7. Karpathy-style guidance belongs in metacognition/executive control: define
   success, keep changes simple, avoid silent assumptions, and verify before
   reporting done.
8. OpenClaw skills are `SKILL.md` instruction bundles. Plugin-provided skills
   should be declared in `openclaw.plugin.json` with a `skills` directory.
9. OpenClaw direct tool verification can use `POST /tools/invoke` with Gateway
   auth, but this endpoint is operator-grade and must remain private.

## Target Architecture

AgentBrain should treat memory like a layered cognitive system:

- Working memory: current task, active constraints, open questions.
- Episodic memory: concrete events and decisions.
- Semantic memory: stable facts, preferences, project state.
- Procedural memory: workflows and habits.
- Reflective memory: summaries, lessons, and high-level beliefs.
- Graph memory: entities, relationships, and claims.
- Retrieval controller: decides what kind of memory to query and how much to
  inject.
- Critic: checks recalled memories for relevance, conflicts, confidence, and
  recency.

## Implementation Phases

### Phase 1: OpenClaw-native skill integration

Status: implemented locally.

- Add an `aira-executive-control` skill under `skills/`.
- Declare plugin skills in `openclaw.plugin.json`.
- Package `skills/` in npm releases.
- Keep the skill focused on planning, retrieval discipline, surgical changes,
  and verification.
- Add explicit adaptive RAG routing and retrieval criticism to the skill.

### Phase 2: Query understanding and adaptive retrieval

Bring in the VPS `QueryAnalyzer` work after reconciling it with `main`.

- Classify query intent: status check, decision recall, how-to, technical,
  broad synthesis, emotional/support, direct action.
- Extract entities, files, projects, people, and time hints.
- Select retrieval mode:
  - status check: tiny, recent, high-confidence context;
  - how-to: procedural memories first;
  - technical: semantic + procedural;
  - broad synthesis: graph/community summaries;
  - emotional/support: relationship + recent affect.
- Apply dynamic memory budgets instead of fixed `slice(0, 5)`.

### Phase 3: Relevance critic

Add a lightweight post-retrieval scorer before prompt injection.

- Score each memory on semantic relevance, entity overlap, recency, confidence,
  access count, salience, and type fit.
- Penalize stale or low-confidence memories unless the query explicitly asks
  for old context.
- Detect contradictions and inject them as explicit uncertainty instead of
  silently choosing one memory.

### Phase 4: Human-like consolidation

Improve `Hippocampus.consolidate`.

- Gate out greetings, one-word pokes, slash commands, and playful chat unless
  they contain durable facts.
- Save stable memories as structured records:
  - `event`: what happened;
  - `fact`: subject, relation, object;
  - `lesson`: wrong behavior, corrected behavior, confidence;
  - `procedure`: trigger, steps, expected result;
  - `preference`: scope, value, source.
- Promote repeated episodes into semantic facts.
- Promote repeated corrections into lessons.
- Generate daily or session reflections when enough evidence accumulates.

### Phase 5: Hierarchical summaries

Implement RAPTOR-like layers without overbuilding.

- Cluster memories by project/topic/entity.
- Generate compact summaries per cluster.
- Store summary memories with backlinks to raw memory IDs.
- Recall summaries for broad questions, then raw memories for evidence.

### Phase 6: Dashboard becomes live

Current dashboard is a mock visualization. Make it useful for Aira operations.

- Read live state from Gateway `/tools/invoke` or a local read-only API.
- Show memory counts by type, top entities, recent recalls, conflicts, and
  confidence distribution.
- Show retrieval traces: query intent, candidate count, selected memories, and
  dropped memories.
- Keep operator credentials private; never expose Gateway bearer tokens in the
  browser bundle.

## Acceptance Tests

- Skill discovery: OpenClaw sees `aira-executive-control` from the plugin.
- Manifest validation: `openclaw.plugin.json` has `skills` and tool contracts.
- Retrieval tests:
  - status query returns at most two or three focused memories;
  - how-to query prioritizes procedural memories;
  - entity query retrieves graph neighbors;
  - unrelated memory is not injected.
- Consolidation tests:
  - low-value chat is not saved;
  - concrete decisions are saved;
  - repeated corrections strengthen lessons.
- Dashboard tests:
  - page renders;
  - live status call succeeds;
  - no token appears in client-side source.

## Immediate Next Step

Merge the VPS retrieval work carefully:

1. Port `src/core/query-analyzer.ts`.
2. Adapt `Hippocampus.recall` to use it.
3. Add tests for intent-based retrieval budgets.
4. Then layer the low-value memory gate and recall reinforcement.
