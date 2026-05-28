# 🧠 AgentBrain

> Give your AI agent a brain — not just memory, but cognition. Emotions, personality, learning from mistakes, and proactive behavior.

[![Version](https://img.shields.io/badge/version-0.3.0-blue)]()
[![Tests](https://img.shields.io/badge/tests-207%20passing-brightgreen)]()
[![Storage](https://img.shields.io/badge/storage-SQLite-orange)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## Why AgentBrain?

Most AI agents are stateless. They forget everything between sessions, respond the same way regardless of who's talking, and repeat the same mistakes forever.

AgentBrain fixes this. It's a plugin that gives your agent:

- **Memory that actually works** — vector-based semantic recall, not keyword matching
- **Personality that evolves** — traits shift based on real interactions
- **Learning from corrections** — when you say "don't do X", it remembers next time
- **Emotional awareness** — tracks mood, trust, relationship depth
- **Proactive behavior** — suggests actions based on observed patterns

All processing is local. Zero external API calls. Zero token cost for brain operations.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AgentBrain v0.3.0                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐     │
│  │ Hippocampus │  │  Prefrontal  │  │  Amygdala   │     │
│  │   Memory    │  │   Planning   │  │  Emotions   │     │
│  │ + Vectors   │  │   + Goals    │  │  + Safety   │     │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘     │
│         │                 │                  │            │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌──────┴──────┐     │
│  │ Cerebellum  │  │Basal Ganglia │  │  Cingulate  │     │
│  │   Skills    │  │   Rewards    │  │ Reflection  │     │
│  │  + Habits   │  │ + Motivation │  │+ Personality│     │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘     │
│         │                 │                  │            │
│  ┌──────┴──────┐  ┌──────┴───────┐  ┌──────┴──────┐     │
│  │  Temporal   │  │   Parietal   │  │   Insula    │     │
│  │  Language   │  │  Attention   │  │ User State  │     │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘     │
│         └────────────────┼────────────────────┘          │
│                   ┌──────┴───────┐                       │
│                   │   Thalamus   │                       │
│                   │Context Router│                       │
│                   └──────────────┘                       │
│                                                           │
│  ── v0.3.0 New ──────────────────────────────────────    │
│                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ VectorMemory │ │  Knowledge   │ │   Lesson     │     │
│  │  Embeddings  │ │  Extractor   │ │   Learner    │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│  │ Personality  │ │  Proactive   │ │   SQLite     │     │
│  │  Influence   │ │   Engine     │ │   Storage    │     │
│  └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Features

### Core Cognition (v0.1.0)
- **Thalamus** — classifies every message (intent, urgency, topic, tone)
- **Hippocampus** — memory formation with deduplication and confidence decay
- **Amygdala** — emotion processing, threat detection, relationship tracking
- **Prefrontal Cortex** — planning, working memory, goal management
- **Cerebellum** — skill proficiency tracking, habit detection
- **Basal Ganglia** — reward processing, motivation ranking
- **Anterior Cingulate** — self-reflection, personality evolution

### Extended Brain (v0.2.0)
- **Temporal Lobe** — language comprehension, semantic extraction
- **Parietal Lobe** — attention allocation, sensory integration
- **Insula** — interoception, user frustration/satisfaction modeling
- **Metacognition** — confidence tracking, strategy selection
- **Hypothalamus** — circadian rhythm, drives, homeostasis
- **Brainstem** — alertness, reflexes, autonomic processes

### Smart Modules (v0.3.0)
- **VectorMemory** — embedding-based semantic recall (cosine similarity, TF-IDF fallback)
- **KnowledgeExtractor** — structured facts, entities, corrections (fact superseding)
- **LessonLearner** — detects corrections, extracts "don't X, do Y" lessons, reinforces on repeat
- **PersonalityInfluence** — translates traits into actual style directives that affect output
- **ProactiveEngine** — pattern-based suggestions (time, keyword, absence, threshold triggers)
- **SQLite Storage** — single `brain.db` file, UNIQUE constraints, atomic writes, no corruption

---

## Installation

```bash
openclaw plugins install agentbrain
```

Or from source:
```bash
cd your-openclaw-project
npm install agentbrain
```

### Configuration

```json
{
  "plugins": {
    "entries": {
      "agentbrain": {
        "enabled": true,
        "config": {
          "brainDir": "~/.openclaw/data/agentbrain",
          "maxRecallResults": 10,
          "memoryDecayRate": 0.01,
          "enableReflection": true,
          "enableEmotions": true,
          "enableSkillTracking": true,
          "maxInjectionTokens": 250,
          "logging": false
        }
      }
    }
  }
}
```

---

## How It Works

### Every message your agent receives:

1. **Thalamus** classifies intent, urgency, topic
2. **Temporal Lobe** extracts semantic concepts
3. **Parietal Lobe** allocates attention
4. **Insula** models user state (frustration, satisfaction)
5. **Hippocampus** recalls relevant memories (vector similarity)
6. **Amygdala** processes emotion, updates relationship
7. **LessonLearner** finds relevant past corrections
8. **PersonalityInfluence** generates style directives
9. **ProactiveEngine** checks for triggered suggestions
10. **ContextInjector** builds ~200 token brain context → injected into prompt

### After every response:

1. **Hippocampus** consolidates new memories (with dedup)
2. **KnowledgeExtractor** extracts structured facts
3. **LessonLearner** detects if user corrected the agent
4. **Cerebellum** records skill usage
5. **Basal Ganglia** processes reward signal
6. **Cingulate** reflects on task outcome
7. All state persisted to SQLite

---

## Storage

AgentBrain v0.3.0 uses SQLite (`brain.db`) with 9 tables:

| Table | Purpose |
|-------|---------|
| `memories` | Episodic, semantic, procedural memories (UNIQUE on content hash) |
| `facts` | Structured knowledge (subject → relation → object) |
| `entities` | People, projects, tools, addresses |
| `lessons` | Learned corrections ("don't X, do Y") |
| `patterns` | Behavioral patterns for proactive suggestions |
| `relationships` | Per-user trust, depth, interaction history |
| `personality` | Trait values (warmth, directness, etc.) |
| `reflections` | Task outcomes and self-assessments |
| `skills` | Proficiency tracking per skill category |

Benefits over file storage:
- No duplicates (UNIQUE constraints)
- Fast queries (indexed)
- Atomic writes (no corruption)
- Easy cleanup (`DELETE FROM memories WHERE ...`)
- Single file backup

---

## Priority System

AgentBrain never overrides your agent's core identity:

```
SOUL.md (persona) > AGENTS.md (rules) > USER.md (preferences) > Brain State
```

The PriorityEnforcer filters brain context to ensure personality traits stay within bounds defined by your agent's identity files.

---

## What It Actually Does For Your Agent

Real impact, not vanity metrics:

| Feature | Without AgentBrain | With AgentBrain |
|---------|-------------------|-----------------|
| User says "don't use X" | Forgets next session | Remembers forever, injects as lesson |
| Repeated interactions | Same generic tone | Adapts: more casual with high trust |
| 2AM message | Normal response | Warns about sleep (protectiveness trait) |
| User frustrated | Doesn't notice | Shorter responses, less playfulness |
| Same mistake twice | No awareness | Lesson triggers, different approach |
| Skill proficiency | Unknown | Tracks success rate, suggests automation |

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npx vitest run

# Type check
npx tsc --noEmit

# Build
npx tsc
```

### Test Stats
- 15 test files
- 207 tests passing
- ~800ms total runtime

---

## Roadmap

- [ ] **Phase 4: Neurochemistry** — Dopamine/Serotonin simulation for motivation curves
- [ ] **Phase 5: Learning & Plasticity** — Hebbian learning, sleep consolidation
- [ ] **Phase 6: Social & Creative** — Multi-agent social cognition, creativity mode
- [ ] **Embedding integration** — Direct model embedding calls (not just cache reuse)
- [ ] **ClawHub publish** — Public release as installable OpenClaw plugin

---

## License

MIT

---

Built with 🧠 by [Aira](https://aira.tingamefi.com) for [OpenClaw](https://openclaw.ai)
