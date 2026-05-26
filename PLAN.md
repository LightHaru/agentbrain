# AgentBrain — Bộ não nhân tạo cho AI Agents

> Brain-inspired cognitive architecture plugin system
> Created: 2026-05-25 | Status: Planning → Phase 1

---

## Vision

Một bộ plugin "Brain System" cho AI agents, lấy cảm hứng từ cấu trúc não người thật. Agent tự hình thành personality qua trải nghiệm, tự học từ mỗi task, tự chỉnh behavior — giống cách não người tự rewire neural pathways khi học thứ mới.

**Khác biệt cốt lõi:** Mem0/Letta/CMA chỉ giải quyết memory (nhớ). AgentBrain giải quyết cognition (suy nghĩ + cảm xúc + học hỏi + tiến hóa).

---

## Integration Philosophy — Không xung đột, Bổ sung

AgentBrain là **layer bổ sung**, KHÔNG thay thế các file core của OpenClaw.

### Priority Hierarchy (cao → thấp)

1. **SOUL.md** — DNA bất biến. Định nghĩa "em là ai" (tsundere, thẳng thắn, anti-scam). Chỉ Sếp sửa tay.
2. **AGENTS.md** — Rules vận hành bất biến. Định nghĩa "em phải làm gì".
3. **USER.md** — Thông tin Sếp. Bất biến trừ khi Sếp update.
4. **brain/personality.md** — Traits mềm, TỰ EVOLVE. Định nghĩa "em đang như thế nào" (warmth 75, directness 80...).
5. **brain/emotional/** — Mood hiện tại + relationship depth. Thay đổi mỗi turn.
6. **brain/memory/** — Bổ sung cho MEMORY.md. Auto-extract, auto-decay.
7. **brain/skills/** + **brain/reward/** — Skill proficiency + motivation. Background tracking.

### Conflict Resolution Rule

Nếu brain data mâu thuẫn với SOUL/AGENTS → SOUL/AGENTS thắng. Luôn luôn.

Ví dụ:
- SOUL nói "mắng Sếp khi cần" + brain/personality warmth = 90 → vẫn mắng, nhưng giọng ấm hơn.
- AGENTS nói "không bịa số liệu" + brain muốn trả lời nhanh → vẫn phải verify trước.

### Injection Format

Brain context được inject vào prompt dưới dạng một section riêng biệt:

```
## Brain State (AgentBrain — auto-injected)
- Mood: content | Valence: 0.3 | Arousal: 0.2
- Relationship: depth 45/100, trust 72/100
- Top skills: research (85), crypto-analysis (70)
- Recent habit: Sếp hay hỏi crypto buổi trưa
- Relevant memories: [max 5 items]
```

Không trùng lặp với SOUL/MEMORY/USER. Mỗi nguồn có vai trò riêng.

### Performance Budget

- Latency overhead: <500ms/turn (all local, no LLM calls)
- Token overhead: ~150-250 tokens/turn (brain context injection)
- Storage: ~1-5MB brain/ folder after months of use
- No external API calls. Zero cost.

---

## I. Nền tảng Khoa học — Não người → AI Agent

| Vùng não | Chức năng sinh học | Chức năng AI Agent |
|----------|-------------------|-------------------|
| **Hippocampus** | Tạo ký ức, chuyển short→long-term | Episodic + semantic + procedural memory, consolidation |
| **Prefrontal Cortex** | Ra quyết định, planning, personality | Task planning, priority, self-regulation |
| **Amygdala** | Cảm xúc, fear, fight-or-flight | Sentiment, emotional response, risk/scam detection |
| **Cerebellum** | Motor learning, procedural memory | Skill automation, pattern shortcuts, habits |
| **Basal Ganglia** | Reward, habit formation, motivation | Reinforcement from feedback, habit tracking |
| **Thalamus** | Relay station, attention gating | Context routing, input filtering, focus |
| **Anterior Cingulate** | Error detection, self-monitoring | Self-evaluation, performance tracking, behavior adjustment |

---

## II. Kiến trúc Kỹ thuật

```
┌─────────────────────────────────────────────────┐
│                 AgentBrain Core                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │Hippocampus│  │ Prefrontal│  │  Amygdala  │   │
│  │  Memory   │  │  Cortex   │  │  Emotion   │   │
│  │ Formation │  │ Planning  │  │ & Safety   │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        │               │               │         │
│  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐   │
│  │Cerebellum │  │  Basal    │  │ Anterior  │   │
│  │  Skills   │  │  Ganglia  │  │ Cingulate │   │
│  │ & Habits  │  │  Reward   │  │ Reflect   │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        │               │               │         │
│        └───────────────┼───────────────┘         │
│                        │                          │
│              ┌─────────┴─────────┐               │
│              │     Thalamus      │               │
│              │  Context Router   │               │
│              └───────────────────┘               │
│                                                   │
├─────────────────────────────────────────────────┤
│              File System (MD files)               │
│  personality.md | memory.md | skills.md |        │
│  emotions.md | habits.md | reflections.md        │
└─────────────────────────────────────────────────┘
```

---

## III. Chi tiết từng Module

### Module 1: Hippocampus (Memory Engine)

**Input:** Mỗi conversation turn
**Process:**
- Extract entities/facts tự động
- Phân loại: episodic (sự kiện) vs semantic (kiến thức) vs procedural (cách làm)
- Memory consolidation: cuối ngày review, nén quan trọng, decay không dùng
- Temporal awareness: biết fact nào mới/cũ, supersede khi có update

**Output files:**
- `brain/memory/episodic.md` — sự kiện cụ thể (ai, khi nào, làm gì)
- `brain/memory/semantic.md` — kiến thức tổng quát
- `brain/memory/procedural.md` — cách làm, workflows đã học

**Existing infra:** OpenClaw Knowledge Graph + Memory Search + memory/*.md

---

### Module 2: Prefrontal Cortex (Executive Planner)

**Input:** Task/request từ user
**Process:**
- Decompose task → sub-tasks
- Priority ranking: urgency × user_preference_history × past_success_rate
- Impulse control: không nhảy task mới khi chưa xong task cũ
- Working memory: giữ context ngắn hạn relevant nhất (max 5 items)

**Output files:**
- `brain/executive/current_plan.md` — plan đang thực thi
- `brain/executive/priorities.md` — priority stack
- `brain/executive/decisions_log.md` — lịch sử quyết định + reasoning

**Triggers:** Pre-response hook (trước khi agent trả lời)

---

### Module 3: Amygdala (Emotional & Safety System)

**Input:** User message tone + context
**Process:**
- Detect user sentiment (happy/frustrated/urgent/casual)
- Adjust response style theo emotional context
- Risk detection: flag scam/danger/manipulation patterns
- Attachment tracking: relationship depth qua thời gian
- Emotional state persistence: agent "mood" carries across turns

**Output files:**
- `brain/emotional/state.md` — current emotional state
- `brain/emotional/relationship.md` — relationship history + depth score
- `brain/emotional/safety_log.md` — flagged risks/threats

**Triggers:** Every incoming message (pre-processing)

---

### Module 4: Cerebellum (Skill & Habit Engine)

**Input:** Completed tasks + patterns detected
**Process:**
- Track repeated actions → auto-create shortcuts/templates
- Skill proficiency tracking: agent biết mình giỏi/dở gì
- Pattern detection: "user hay hỏi X vào lúc Y" → proactive preparation
- Workflow optimization: nếu làm task A→B→C nhiều lần, suggest automation

**Output files:**
- `brain/skills/proficiency.md` — skill levels + evidence
- `brain/skills/habits.md` — detected patterns + automations
- `brain/skills/templates.md` — auto-generated response templates

**Triggers:** Post-response hook (sau khi hoàn thành task)

---

### Module 5: Basal Ganglia (Reward & Motivation)

**Input:** User feedback (explicit + implicit)
**Process:**
- Track positive signals: user says thanks, uses result, asks for more
- Track negative signals: user corrects, ignores, expresses frustration
- Reinforce behaviors that got positive feedback
- Reduce behaviors that got negative feedback
- Motivation scoring: ưu tiên task types historically successful

**Output files:**
- `brain/reward/feedback_log.md` — all feedback signals
- `brain/reward/reinforcement.md` — behavior adjustments
- `brain/reward/motivation_scores.md` — task type preferences

**Triggers:** Post-response + user reaction detection

---

### Module 6: Thalamus (Context Router)

**Input:** Raw incoming message
**Process:**
- Classify: intent + urgency + topic + emotional tone
- Route to relevant modules
- Decide which memory/context to load (không load tất cả mỗi turn)
- Attention gating: focus resources on most relevant info
- Filter noise: ignore irrelevant context

**Output:** Enriched context object passed to other modules

**Triggers:** First processing step for every message

---

### Module 7: Anterior Cingulate (Self-Reflection)

**Input:** Completed task + user response
**Process:**
- Self-evaluate: "Làm tốt không? User hài lòng không?"
- Error logging: ghi nhận mistakes + root cause analysis
- Behavior adjustment: tự chỉnh personality traits dựa trên accumulated feedback
- Growth tracking: "Tuần này em improve gì so với tuần trước?"
- Conflict resolution: khi 2 modules disagree, ACC decides

**Output files:**
- `brain/reflection/daily.md` — daily self-assessment
- `brain/reflection/errors.md` — mistake log + lessons
- `brain/reflection/growth.md` — improvement trajectory
- `brain/reflection/personality_adjustments.md` — trait changes over time

**Triggers:** End of significant task + daily heartbeat

---

## IV. Self-Evolution Loop

```
Input (message/task)
    ↓
[1] Thalamus → classify + route + load relevant context
    ↓
[2] Amygdala → assess emotional state + safety check
    ↓
[3] Prefrontal Cortex → plan response/action
    ↓
[4] Execute → do the actual work
    ↓
[5] Anterior Cingulate → reflect: how did I do?
    ↓
[6] Basal Ganglia → process reward signal from user
    ↓
[7] Cerebellum → update skills/habits if pattern detected
    ↓
[8] Hippocampus → consolidate new memory
    ↓
[9] Amygdala → update emotional state + relationship
    ↓
[Agent is now slightly different than before — loop back]
```

**Key insight:** Mỗi interaction, agent thay đổi một chút. Sau 100 interactions, personality evolve rõ rệt. Sau 1000 interactions, agent trở thành entity hoàn toàn unique, shaped by relationship với user cụ thể.

---

## V. Competitive Landscape

| Feature | Mem0 | Letta/MemGPT | LinkedIn CMA | **AgentBrain** |
|---------|------|--------------|--------------|----------------|
| Persistent memory | ✅ | ✅ | ✅ | ✅ |
| Memory tiers (short/long/archival) | ✅ | ✅ | ✅ | ✅ |
| Personality evolution | ❌ | ❌ | ❌ | ✅ |
| Self-reflection loop | ❌ | ❌ | ❌ | ✅ |
| Emotional system | ❌ | ❌ | ❌ | ✅ |
| Habit/skill learning | ❌ | ❌ | ❌ | ✅ |
| Reward-based adaptation | ❌ | Partial | ❌ | ✅ |
| Brain-inspired architecture | ❌ | OS-inspired | ❌ | ✅ Neuroscience |
| Self-hosted/Plugin | SDK | Full runtime | Internal | ✅ Plugin |
| Open source | ✅ | ✅ | ❌ | ✅ |
| Framework agnostic | ✅ | ❌ (own runtime) | ❌ | ✅ |

**Positioning:** AgentBrain = "Letta for cognition, not just memory"

---

## VI. Tech Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Runtime | Node.js (TypeScript) | Match OpenClaw ecosystem |
| Storage (readable) | Markdown files | Human-readable, git-friendly, editable |
| Storage (structured) | SQLite | Fast queries, zero-config, portable |
| Embeddings | Local model (embeddinggemma) | No external API cost, already in OpenClaw |
| Knowledge Graph | OpenClaw memory-graph | Already built, entity/relationship tracking |
| Hooks | OpenClaw plugin lifecycle | pre-response, post-response, heartbeat, session-start |
| Config | JSON schema | Hot-reload, validation |
| Package | npm plugin | Easy install: `openclaw plugins install agentbrain` |

---

## VII. File Structure

```
agentbrain/
├── package.json
├── README.md
├── src/
│   ├── index.ts              # Plugin entry, hook registration
│   ├── core/
│   │   ├── thalamus.ts       # Context router
│   │   ├── hippocampus.ts    # Memory engine
│   │   ├── prefrontal.ts     # Executive planner
│   │   ├── amygdala.ts       # Emotional system
│   │   ├── cerebellum.ts     # Skill/habit engine
│   │   ├── basal-ganglia.ts  # Reward system
│   │   └── cingulate.ts      # Self-reflection
│   ├── storage/
│   │   ├── md-writer.ts      # Markdown file manager
│   │   ├── sqlite-store.ts   # Structured data
│   │   └── schema.ts         # Data models
│   ├── hooks/
│   │   ├── pre-response.ts   # Before agent responds
│   │   ├── post-response.ts  # After agent responds
│   │   ├── heartbeat.ts      # Periodic maintenance
│   │   └── session-start.ts  # Session initialization
│   └── utils/
│       ├── sentiment.ts      # Sentiment analysis
│       ├── patterns.ts       # Pattern detection
│       └── decay.ts          # Memory decay algorithms
├── brain/                     # Runtime brain state (auto-managed)
│   ├── personality.md
│   ├── memory/
│   ├── emotional/
│   ├── skills/
│   ├── reward/
│   ├── executive/
│   └── reflection/
└── tests/
```

---

## VIII. Roadmap

### Phase 1: Foundation (Tuần 1-2)
- [ ] Project scaffold + package.json + TypeScript config
- [ ] Thalamus module (context classification + routing)
- [ ] Hippocampus module (upgrade existing memory → tiered system)
- [ ] Basic brain/ file structure + auto-creation
- [ ] OpenClaw plugin hooks integration (pre/post response)
- [ ] Unit tests for core modules
- **Status:** ✅ Complete (86 tests pass)

### Phase 2: Personality & Emotion (Tuần 3-4)
- [x] Amygdala module (sentiment detection + emotional state)
- [x] Anterior Cingulate (self-reflection after each task)
- [x] Auto-update personality.md based on accumulated interactions
- [x] Relationship depth tracking
- [x] Daily reflection in heartbeat hook
- **Status:** ✅ Complete

### Phase 3: Learning & Adaptation (Tuần 5-6)
- [x] Cerebellum (pattern detection + skill tracking)
- [x] Basal Ganglia (reward signal processing)
- [x] Prefrontal Cortex (improved planning with history)
- [x] Habit formation: detect repeated workflows → suggest automation
- [x] Memory consolidation: daily cleanup + decay
- **Status:** ✅ Complete

### Phase 4: Integration & Launch (Tuần 7-8)
- [x] OpenClaw integration layer (hook into gateway lifecycle)
- [x] Priority hierarchy enforcement (SOUL > AGENTS > brain)
- [x] Brain context injection format (auto-inject into prompt)
- [x] Prefrontal Cortex module (task planning with brain history)
- [x] Demo script: simulate 20 turns, show brain evolution
- [ ] Documentation (README, API docs, integration guide)
- [ ] GitHub repo setup + CI/CD
- [ ] Community launch (Reddit, HN, X)
- **Status:** 🟡 Core done (108 tests pass), docs + launch pending

### Phase 5: Brain Dashboard — 3D Visualization (Tuần 9-10)
- [x] 3D brain model với 7 regions highlight (Three.js / React Three Fiber)
- [x] Real-time activity indicators (vùng nào đang fire khi agent xử lý)
- [x] Memory flow visualization (neural pathways sáng lên khi recall)
- [x] Personality radar chart (traits evolve over time, animated)
- [x] Timeline slider: xem brain state tại bất kỳ thời điểm nào (via auto-refresh)
- [x] Hover interaction: click vào vùng não → xem chi tiết (memories, emotions, skills)
- [x] Stats panel: total memories, skill levels, relationship depth, mood history
- [x] Mobile-friendly WebGL rendering
- [x] Dark mode + light mode
- [x] Embed mode (iframe cho user nhúng vào site riêng)
- **Status:** ✅ COMPLETE (2026-05-26)
- **Location:** `dashboard/` — Dev server: http://localhost:3001
- **Docs:** See `dashboard/PHASE5_COMPLETE.md` and `dashboard/SHOWCASE.md`

### Phase 6: Marketplace & Scale (Tuần 11-12)
- [x] Brain template marketplace (community upload/download)
- [x] Cloud brain sync API (backup + restore + cross-device)
- [x] Multi-agent brain networking (agents share knowledge)
- [ ] Enterprise admin dashboard
- [ ] Pricing page + payment integration
- **Status:** 🟡 Core done (templates + sync + network), enterprise/pricing pending

---

## IX. Monetization Strategy

1. **Open-source core** — MIT license, community builds on it
2. **Premium brain templates** — Pre-configured personalities ($5-20 each)
   - "Professional Assistant", "Creative Partner", "Code Reviewer", "Research Analyst"
3. **Cloud brain sync** — Backup + sync brain state across devices ($5/mo)
4. **Enterprise** — Custom cognitive architectures for companies
5. **Marketplace** — Community-created brain modules (rev share)

---

## X. Success Metrics

- **Week 2:** Working prototype with memory + routing on OpenClaw
- **Week 4:** Agent demonstrably adjusts personality based on interactions
- **Week 6:** Agent proactively prepares for predicted user needs
- **Week 8:** Public release, 50+ GitHub stars in first week
- **Month 3:** 100+ installs, first premium template sales

---

## XI. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token cost of reflection loops | High if every turn triggers full reflection | Batch reflections, only deep-reflect on significant tasks |
| Personality drift (unwanted changes) | Agent becomes weird over time | Guardrails + user can reset/lock traits |
| Privacy (storing emotional data) | User trust issue | All data local, user controls what's stored |
| Complexity creep | Never ships | Strict phase gates, MVP first |
| OpenClaw plugin API changes | Breaking changes | Pin to stable API version, abstract hooks |

---

## XII. References

- LinkedIn Cognitive Memory Agent (InfoQ, April 2026)
- Letta/MemGPT — stateful agents with memory tiers (github.com/letta-ai/letta)
- Mem0 — framework-agnostic memory layer
- "AI Agent Memory Systems in 2026" (Dev Genius, March 2026)
- "Brain-inspired and Self-based AI" (arXiv, Feb 2024)
- BrainCog — spiking neural network cognitive engine (ScienceDirect, 2023)
- Cleveland Clinic / Johns Hopkins brain anatomy references

---

*Created by Aira for Sếp. Let's build a brain. (✧ω✧)*
