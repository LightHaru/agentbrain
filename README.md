<p align="center">
  <img src="https://raw.githubusercontent.com/LightHaru/agentbrain/main/docs/assets/agentbrain-hero.png" alt="AgentBrain — Brain-Inspired Cognitive Architecture for AI Agents" width="100%">
</p>

<h1 align="center">🧠 AgentBrain</h1>

<p align="center">
  <strong>Give your AI agent a brain.</strong><br>
  Memory that persists. Personality that evolves. Emotions that feel real.<br>
  All running locally, with zero extra token cost.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lightharu/agentbrain"><img src="https://img.shields.io/npm/v/@lightharu/agentbrain?color=blue&label=npm" alt="npm version"></a>
  <a href="https://github.com/LightHaru/agentbrain/actions/workflows/ci.yml"><img src="https://github.com/LightHaru/agentbrain/actions/workflows/ci.yml/badge.svg" alt="Build"></a>
  <a href="https://clawhub.ai/lightharu/agentbrain"><img src="https://img.shields.io/badge/ClawHub-0.9.0-orange" alt="ClawHub"></a>
  <a href="https://github.com/LightHaru/agentbrain"><img src="https://img.shields.io/github/stars/LightHaru/agentbrain?style=social" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
</p>

<p align="center">
  <a href="#-why-agentbrain">Why?</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-documentation">Docs</a> •
  <a href="README.vi.md">🇻🇳 Tiếng Việt</a>
</p>

---

## 🎯 Why AgentBrain?

**Most AI agents are amnesiacs.** They forget who you are between conversations, repeat mistakes you already corrected, and respond with the same flat tone whether you just shipped a release or lost a week of work.

**AgentBrain fixes that.** It gives your agent:

- 🧠 **Persistent memory** — remembers conversations, facts, and corrections permanently
- 🎭 **Evolving personality** — traits like warmth and directness adapt based on interactions
- 💭 **Emotional awareness** — tracks mood, builds trust, reads the room
- 🧪 **Neurochemistry** — dopamine/serotonin/cortisol give emotions real momentum
- 📚 **Learning from mistakes** — "don't do X" is remembered forever, not repeated next turn
- 🔮 **Proactive suggestions** — surfaces helpful actions based on observed patterns

### Before vs After

```diff
Without AgentBrain                    With AgentBrain
─────────────────────                 ─────────────────────
"Who are you again?"              →   "Welcome back! Last time we were
                                      debugging the deploy script."

Repeats corrected mistake         →   "Skipping that approach — you told
                                      me it breaks the build."

Flat, stateless tone              →   Mood + trust adapt to how the
                                      relationship has actually gone

Forgets context after 10 turns    →   Recalls relevant details from weeks ago
                                      via semantic memory search
```

---

## ⚡ Quick Start

### Installation

**Via OpenClaw CLI:**
```bash
openclaw plugins install @lightharu/agentbrain
```

**Via npm:**
```bash
npm install @lightharu/agentbrain
```

**Via ClawHub:**
```bash
clawhub package install @lightharu/agentbrain
```

### Configuration

Add to your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "lightharu-agentbrain": {
        "enabled": true,
        "config": {
          "brainDir": "~/.openclaw/data/agentbrain",
          "maxRecallResults": 10,
          "enableReflection": true,
          "enableEmotions": true,
          "enableSkillTracking": true
        }
      }
    }
  }
}
```

### Verify Installation

```bash
# Check plugin status
openclaw plugins list

# Inspect brain state
openclaw tools call agentbrain_status
```

That's it! AgentBrain will automatically:
- Inject ~200 tokens of cognitive context into every prompt
- Remember conversations permanently
- Learn from corrections
- Evolve personality traits based on interactions

---

## ✨ Features

### 🧠 Memory System

**Three types of memory:**
- **Episodic** — conversations, events ("You asked about deploy scripts yesterday")
- **Semantic** — facts, knowledge ("The API key is in .env.local")
- **Procedural** — skills, habits ("User prefers Markdown code blocks")

**Smart recall via 3-tier fallback:**
1. Local embedding model (all-MiniLM-L6-v2, 384D)
2. OpenClaw embedding cache (if available)
3. TF-IDF keyword search (always works)

**Deduplication:**
- Content-hash based UNIQUE constraint in SQLite
- No repeated memories, ever

**Example:**
```
User: "Where did I put the API key?"
Agent: [recalls] "You mentioned it's in .env.local (3 days ago)"
```

### 🎭 Personality Evolution

**6 core traits** (0-100 scale):
- `warmth` — how caring/supportive the agent is
- `directness` — brevity vs detail
- `protectiveness` — safety warnings, risk detection
- `assertiveness` — opinion sharing, disagreement
- `humor` — playfulness, sarcasm
- `curiosity` — exploration, follow-up questions

**Traits evolve based on:**
- Task outcomes (success → confidence boost)
- User feedback (praise → warmth increase)
- Corrections (repeated mistakes → assertiveness increase)
- Relationship depth (trust → more honesty)

**Example:**
```
After 10 successful debugging sessions:
  directness: 70 → 75 (more concise)
  assertiveness: 65 → 70 (stronger opinions)
  
After user says "too verbose":
  directness: 75 → 80 (even more brief)
```

### 💭 Emotional Intelligence

**Real-time emotion tracking:**
- Mood (happy, neutral, concerned, alarmed, etc.)
- Valence (-1 to +1, negative to positive)
- Arousal (0 to 1, calm to excited)

**Relationship tracking per user:**
- Trust level (0-100)
- Interaction depth (0-100)
- Sentiment history
- Topic preferences

**Neurochemistry system:**
| Chemical | Effect | Use Case |
|----------|--------|----------|
| Dopamine | Reward, motivation | Task success → energy boost |
| Serotonin | Mood floor, stability | Sustained praise → lasting good mood |
| Cortisol | Stress, reactivity | Threats → lingering caution |
| Oxytocin | Bonding, trust | Repeated positive interactions |

**Example:**
```
User praises agent repeatedly
→ Serotonin rises
→ Mood floor lifts
→ Agent stays positive even during boring tasks

Critical bug detected
→ Cortisol spike
→ Agent stays alert for 30 minutes even after fix
```

### 📚 Lesson Learning

**Automatic correction detection:**
- "Don't do X" / "Đừng làm X"
- "Not X, but Y" / "Không phải X mà là Y"
- "Next time, do Y" / "Lần sau phải Y"
- Frustration signals ("I told you already")

**Reinforcement:**
- Lessons gain confidence on repetition
- High-confidence lessons inject into prompt automatically
- Superseded lessons are marked obsolete

**Example:**
```
User: "Don't use git push --force on main"
→ Stored as lesson (confidence: 0.7)

[Next time agent tries to push]
Agent: [recalls lesson] "Skipping --force on main (you warned me about this)"

[User confirms]
→ Lesson confidence: 0.7 → 0.85
```

### 🔮 Proactive Suggestions

**Pattern-based action proposals:**
- "You usually run tests after code changes — want me to run them now?"
- "It's 2 AM and you're still coding — should I remind you to commit before sleep?"
- "Last 3 times you deployed, you forgot to update the changelog — should I check it?"

**Configurable triggers:**
- Frequency threshold (pattern must repeat N times)
- Confidence threshold (only suggest if confident)
- Time-based (e.g., only suggest backups after 8 PM)

### 🛠️ Agent Tools

**Runtime inspection:**
```bash
# Full brain status
agentbrain_status

# Personality traits
agentbrain_personality

# Emotional state + relationships
agentbrain_emotions

# Query memories
agentbrain_memories query="deploy script" topic="coding"

# Tracked skills
agentbrain_skills

# Manual reflection (after big tasks)
agentbrain_reflect taskDescription="Deployed v2.0" outcome="success"

# Snapshots (backup/restore)
agentbrain_snapshot action="save" label="before-refactor"
agentbrain_snapshot action="list"
```

---

## 🏗️ Architecture

AgentBrain is organized into **brain-inspired modules**, each handling a specific cognitive function:

```
┌─────────────────────────────────────────────────────────┐
│                      AgentBrain                          │
├─────────────────────────────────────────────────────────┤
│  Sensory Input                                           │
│  ┌─────────────┐                                         │
│  │  Thalamus   │  Message classification                │
│  │  (gateway)  │  (intent, urgency, topic, tone)        │
│  └─────────────┘                                         │
│         │                                                │
│         ├──────────┬──────────┬──────────┐              │
│         ▼          ▼          ▼          ▼              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Hippocampus│ │ Amygdala │ │Prefrontal│ │Cerebellum│  │
│  │  Memory   │ │ Emotions │ │ Planning │ │  Skills  │  │
│  │  Recall   │ │   Trust  │ │  Goals   │ │  Habits  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│         │          │          │          │              │
│         └──────────┴──────────┴──────────┘              │
│                     │                                    │
│                     ▼                                    │
│         ┌─────────────────────┐                         │
│         │ Context Injector    │                         │
│         │ (~200 tokens)       │                         │
│         └─────────────────────┘                         │
│                     │                                    │
│                     ▼                                    │
│              [Agent Prompt]                              │
│                     │                                    │
│                     ▼                                    │
│              [Agent Response]                            │
│                     │                                    │
│         ┌───────────┴───────────┐                       │
│         ▼           ▼           ▼                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Memory  │ │ Knowledge│ │  Lesson  │               │
│  │Consolidate│ │Extractor │ │ Learner  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│         │           │           │                       │
│         └───────────┴───────────┘                       │
│                     │                                    │
│                     ▼                                    │
│             ┌──────────────┐                            │
│             │ SQLite DB    │                            │
│             │  brain.db    │                            │
│             └──────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Function | Key Features |
|--------|----------|--------------|
| **Thalamus** | Sensory gating | Classifies intent, urgency, topic, tone |
| **Hippocampus** | Memory | Formation, deduplication, vector recall |
| **Amygdala** | Emotion | Sentiment, threat detection, relationships |
| **Prefrontal Cortex** | Planning | Working memory, goal management |
| **Cerebellum** | Motor learning | Skill proficiency, habit detection |
| **Basal Ganglia** | Rewards | Motivation ranking, reinforcement |
| **Anterior Cingulate** | Reflection | Self-assessment, personality evolution |
| **Temporal Lobe** | Language | Semantic extraction, concept mapping |
| **Parietal Lobe** | Integration | Attention, sensory fusion |
| **Insula** | Interoception | User state modeling (frustration, satisfaction) |

### Smart Modules (v0.3+)

| Module | Purpose |
|--------|---------|
| **VectorMemory** | Embedding-based semantic recall (3-tier fallback) |
| **EmbeddingEngine** | Local Transformers.js model (all-MiniLM-L6-v2) |
| **KnowledgeExtractor** | Structured fact/entity extraction |
| **LessonLearner** | Correction detection, lesson storage |
| **PersonalityInfluence** | Trait-to-directive translation |
| **ProactiveEngine** | Pattern-based action suggestions |
| **Neurochemistry** | Dopamine/serotonin/cortisol/oxytocin modeling |

---

## 💾 Storage

All brain state lives in a **single SQLite file** (`brain.db`):

| Table | Contents |
|-------|----------|
| `memories` | Episodic, semantic, procedural memories (UNIQUE on content hash) |
| `facts` | Structured knowledge (subject → relation → object) |
| `entities` | Extracted entities (people, tools, addresses) |
| `lessons` | Learned corrections with confidence scores |
| `patterns` | Behavioral patterns for proactive suggestions |
| `relationships` | Per-user trust, depth, interaction history |
| `personality` | Evolving trait values |
| `reflections` | Task outcomes and self-assessments |
| `skills` | Proficiency tracking per skill category |
| `neurochemistry` | Chemical levels (dopamine, serotonin, etc.) |

### Why SQLite?

✅ **No duplicates** — UNIQUE constraints at DB level  
✅ **Fast queries** — indexed columns, no regex parsing  
✅ **Atomic writes** — no corrupted half-written files  
✅ **Single file** — easy backup (`cp brain.db brain-backup.db`)  
✅ **Zero config** — no external database server  
✅ **Portable** — move the file, move the brain  

---

## 📖 Documentation

### User Guides

- [Installation Guide](docs/installation.md)
- [Configuration Reference](docs/configuration.md)
- [Memory System Deep Dive](docs/memory-system.md)
- [Personality & Emotions](docs/personality-emotions.md)
- [Lesson Learning](docs/lesson-learning.md)
- [Agent Tools Reference](docs/agent-tools.md)

### Developer Guides

- [Architecture Overview](docs/architecture.md)
- [Module Reference](docs/modules.md)
- [Storage Schema](docs/storage-schema.md)
- [Plugin Development](docs/plugin-dev.md)
- [Testing Guide](docs/testing.md)

### Vietnamese Documentation

- [🇻🇳 Hướng dẫn cài đặt](docs/vi/installation.md)
- [🇻🇳 Cấu hình chi tiết](docs/vi/configuration.md)
- [🇻🇳 Hệ thống ký ức](docs/vi/memory-system.md)
- [🇻🇳 Tính cách & Cảm xúc](docs/vi/personality-emotions.md)

---

## 🚀 Getting Started Tutorial

### 1. Install & Configure

```bash
# Install AgentBrain
openclaw plugins install @lightharu/agentbrain

# Verify installation
openclaw plugins list | grep agentbrain
```

Add to `openclaw.json`:
```json
{
  "plugins": {
    "entries": {
      "lightharu-agentbrain": {
        "enabled": true,
        "config": {
          "brainDir": "~/.openclaw/data/agentbrain",
          "maxRecallResults": 10,
          "enableReflection": true,
          "enableEmotions": true
        }
      }
    }
  }
}
```

Restart OpenClaw:
```bash
openclaw gateway restart
```

### 2. First Conversation

```
You: "I'm working on a deploy script for my Node.js app"
Agent: [stores memory] "Got it! What deployment platform are you targeting?"

[10 turns later...]

You: "Remind me what I was working on?"
Agent: [recalls memory] "You're building a deploy script for your Node.js app.
       We discussed targeting Vercel and using environment variables."
```

### 3. Teach a Lesson

```
You: "Don't use 'rm -rf' in production scripts"
Agent: [stores lesson] "Understood. I'll avoid 'rm -rf' in production contexts."

[Next time agent suggests a script with 'rm -rf']
Agent: [recalls lesson] "Skipping 'rm -rf' — you warned me this is dangerous in production."
```

### 4. Inspect Brain State

```bash
# Check current mood & personality
openclaw tools call agentbrain_status

# Query memories about "deploy"
openclaw tools call agentbrain_memories query="deploy script"

# View learned lessons
openclaw tools call agentbrain_memories topic="lessons"
```

### 5. Backup Your Brain

```bash
# Create snapshot
openclaw tools call agentbrain_snapshot action="save" label="before-refactor"

# Or copy the DB file directly
cp ~/.openclaw/data/agentbrain/brain.db ~/backups/brain-$(date +%Y%m%d).db
```

---

## 🔬 Advanced Usage

### Custom Personality Template

Create a personality template for specific use cases:

```json
{
  "name": "Debugging Assistant",
  "personality": {
    "warmth": 50,
    "directness": 90,
    "assertiveness": 85,
    "protectiveness": 95,
    "humor": 30,
    "curiosity": 80
  },
  "description": "Highly direct, protective, focused debugging partner"
}
```

Apply it:
```bash
openclaw tools call agentbrain_template_apply templateId="debugging-assistant"
```

### Memory Pruning

Control memory growth:

```json
{
  "config": {
    "memoryDecayRate": 0.05,
    "minMemoryConfidence": 0.3,
    "maxMemories": 1000
  }
}
```

- `memoryDecayRate`: confidence decay per day (0.05 = 5% per day)
- `minMemoryConfidence`: prune memories below this threshold
- `maxMemories`: hard limit (oldest pruned first)

### Neurochemistry Tuning

Adjust emotional responsiveness:

```json
{
  "config": {
    "neurochemistry": {
      "dopamineDecayRate": 0.1,
      "serotoninDecayRate": 0.02,
      "cortisolDecayRate": 0.03,
      "oxytocinDecayRate": 0.04
    }
  }
}
```

---

## 📊 Example: Brain State Injection

When you send a message, AgentBrain injects ~200 tokens of context into the agent's prompt:

```markdown
## Brain State (AgentBrain — auto-injected)

**Mood:** positive | Valence: +0.65 | Arousal: 0.45
**Relationship:** depth 85/100, trust 92/100
**Personality:** warmth↑70, assertiveness↑75, directness↑80, protectiveness↑85

**Working Memory:**
- User: "Where's the API key?"
- User: "How do I deploy to Vercel?"

**Relevant Memories:**
- [episodic] User mentioned API key is in .env.local (2 days ago, conf: 0.85)
- [semantic] Deployment target is Vercel (4 days ago, conf: 0.90)
- [lesson] Don't use 'rm -rf' in production scripts (user warning, conf: 0.95)

**Neurochemistry:** dopamine: 0.62, serotonin: 0.75, cortisol: 0.15, oxytocin: 0.80
**Recent Feedback:** positive trend (+0.35 over last 10 turns)
```

This context shapes how the agent responds:
- **Memory recall** prevents "who are you?" moments
- **Mood & trust** influence tone warmth
- **Lessons** prevent repeating past mistakes
- **Personality traits** adjust directness/verbosity

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 🐛 Report bugs via [GitHub Issues](https://github.com/LightHaru/agentbrain/issues)
- 💡 Suggest features via [Discussions](https://github.com/LightHaru/agentbrain/discussions)
- 📝 Improve documentation
- 🧪 Add tests
- 🔧 Submit PRs for bug fixes or features

---

## 📋 Requirements

- **OpenClaw:** 2026.3.24 or later
- **Node.js:** 22+ (for plugin runtime)
- **Disk:** ~50MB (SQLite DB + embedding model)
- **Memory:** ~100MB RAM (embedding model loaded on demand)
- **GPU:** Not required (CPU embeddings via Transformers.js)

---

## 🗺️ Roadmap

### v1.0 (Next Major Release)
- [ ] Multi-agent memory sharing
- [ ] Graph-based knowledge representation
- [ ] Fine-tuned embedding model for agent contexts
- [ ] Visual brain state dashboard (web UI)
- [ ] Memory compression (long-term storage)

### v0.10.0 (Released)
- [x] Phase 5: Learning Loop (personality adapts from feedback)
- [x] Phase 4: Context Reasoning (status-check short-circuit)
- [x] Phase 3: Personalized Recall (task-type filter)
- [x] Memory review & auto-learning system
- [ ] Cross-language memory (English ↔ Vietnamese)
- [ ] Memory migration tools

### Completed
- [x] v0.9.0: Intelligence Upgrade (5 phases)
- [x] v0.8.0: Generative affect via cognitive appraisal
- [x] v0.7.0: Agent-neutral SDK engine
- [x] v0.6.0: Brain completeness audit + Phase 2 emotional engine
- [x] v0.4.0: Foundation modules + SQL storage

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔗 Links

- **GitHub:** https://github.com/LightHaru/agentbrain
- **npm:** https://www.npmjs.com/package/@lightharu/agentbrain
- **ClawHub:** https://clawhub.ai/lightharu/agentbrain
- **OpenClaw:** https://openclaw.ai
- **Docs:** https://docs.openclaw.ai/plugins/building-plugins

---

## 💬 Community

- [Discord](https://discord.gg/openclaw) — Join the OpenClaw community
- [GitHub Discussions](https://github.com/LightHaru/agentbrain/discussions) — Ask questions, share ideas
- [Twitter](https://twitter.com/openclaw) — Follow for updates

---

## 🙏 Acknowledgments

AgentBrain is inspired by:
- **Neuroscience:** Brain architecture (Hippocampus, Amygdala, etc.)
- **Cognitive Science:** Appraisal theory, memory consolidation
- **AI Research:** Transformer embeddings, vector databases

Special thanks to the OpenClaw team and community for feedback and support.

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/LightHaru">LightHaru</a></sub>
</p>
