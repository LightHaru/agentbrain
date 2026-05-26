# 🧠 AgentBrain

> Brain-inspired cognitive architecture plugin for AI agents. Self-evolving personality, memory, emotions, and learning.

[![Tests](https://img.shields.io/badge/tests-122%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## What is AgentBrain?

AgentBrain gives AI agents a **brain** — not just memory, but full cognition: emotions, personality evolution, skill learning, reward-based adaptation, and self-reflection.

While tools like Mem0 and Letta solve **memory**, AgentBrain solves **cognition**. Your agent doesn't just remember — it *thinks*, *feels*, *learns*, and *evolves*.

```
┌─────────────────────────────────────────────────┐
│                 AgentBrain Core                   │
├─────────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │Hippocampus│  │Prefrontal │  │  Amygdala  │   │
│  │  Memory   │  │  Cortex   │  │  Emotion   │   │
│  │ Formation │  │ Planning  │  │ & Safety   │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐   │
│  │Cerebellum │  │  Basal    │  │ Anterior  │   │
│  │  Skills   │  │  Ganglia  │  │ Cingulate │   │
│  │ & Habits  │  │  Reward   │  │ Reflect   │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        └───────────────┼───────────────┘         │
│              ┌─────────┴─────────┐               │
│              │     Thalamus      │               │
│              │  Context Router   │               │
│              └───────────────────┘               │
└─────────────────────────────────────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| **7-Module Architecture** | Mapped from real neuroscience (hippocampus, amygdala, cerebellum, etc.) |
| **Personality Evolution** | Traits shift based on interactions — agent becomes unique over time |
| **Emotional System** | Mood persistence, sentiment detection, relationship depth tracking |
| **Skill Learning** | Tracks proficiency, detects habits, suggests automation |
| **Reward Adaptation** | Reinforces successful behaviors, reduces unsuccessful ones |
| **Self-Reflection** | Agent evaluates its own performance and adjusts |
| **Priority Hierarchy** | Brain never overrides core identity (SOUL > AGENTS > brain) |
| **Zero API Cost** | All processing is local — no external LLM calls for brain operations |
| **Brain Templates** | Pre-configured personalities (Professional, Creative, Code Reviewer, etc.) |
| **Brain Sync** | Export/import/snapshot brain state |
| **Multi-Agent Network** | Agents can share knowledge selectively |

## Quick Start

```bash
# Install
npm install agentbrain

# Or clone and build
git clone https://github.com/AiraTeam/agentbrain.git
cd agentbrain
npm install
npm run build
```

### As OpenClaw Plugin

```bash
openclaw plugins install ./agentbrain
```

### Programmatic Usage

```typescript
import { createOpenClawPlugin } from 'agentbrain';

const brain = createOpenClawPlugin({
  brainDir: './brain',
  enableEmotions: true,
  enableReflection: true,
  enableSkillTracking: true,
});

await brain.initialize();

// Pre-response: get brain context to inject into prompt
const context = await brain.onPreResponse({
  sessionId: 'session-1',
  message: 'Fix the bug in the API',
  senderId: 'user-001',
  senderName: 'Alice',
  timestamp: new Date().toISOString(),
  channel: 'telegram',
});

console.log(context);
// ## Brain State (AgentBrain — auto-injected)
// Mood: alert | Valence: 0.10 | Arousal: 0.45
// Relationship: depth 32/100, trust 68/100
// Top skills: code-debugging (82), code-writing (75)
// ...

// Post-response: consolidate memory and update brain
await brain.onPostResponse(hookContext, 'Fixed! The bug was in line 42.');

// Heartbeat: periodic maintenance
await brain.onHeartbeat();

// Status
console.log(brain.getStatus());
```

### Brain Templates

```typescript
import { TemplateManager } from 'agentbrain';

const templates = new TemplateManager('./brain', fileManager);

// List available templates
const list = await templates.listTemplates();
// → professional-assistant, creative-partner, code-reviewer, research-analyst

// Apply a template
const template = await templates.getTemplate('code-reviewer');
await templates.applyTemplate(template);

// Export your brain as a template
await templates.exportAsTemplate('My Brain', 'Custom config', 'Me', ['custom']);
```

### Brain Sync (Backup & Restore)

```typescript
import { BrainSync } from 'agentbrain';

const sync = new BrainSync('./brain');

// Save snapshot
await sync.saveSnapshot('before-experiment');

// ... make changes ...

// Restore if needed
const snapshot = await sync.loadSnapshot('snapshot-before-experiment.json');
await sync.restore(snapshot);

// Diff two states
const diff = sync.diff(snapshotBefore, snapshotAfter);
console.log(`Added: ${diff.added.length}, Modified: ${diff.modified.length}`);
```

## Run the Demo

```bash
npm run demo
```

Simulates 20 conversation turns and shows how the brain evolves:
- Personality traits shift
- Memories form and consolidate
- Skills are tracked and proficiency grows
- Emotional state responds to interactions
- Self-reflection generates lessons learned

## Architecture

### Self-Evolution Loop

Every interaction, the agent changes slightly:

```
Input → Thalamus (classify) → Amygdala (emotion) → Prefrontal (plan)
  → Execute → Cingulate (reflect) → Basal Ganglia (reward)
  → Cerebellum (skill) → Hippocampus (memory) → [Agent evolved]
```

After 100 interactions, personality evolves noticeably. After 1000, the agent becomes a unique entity shaped by its relationship with the user.

### Priority Hierarchy

Brain context never overrides core identity:

```
1. SOUL.md      — Immutable DNA (who am I)
2. AGENTS.md    — Operating rules (what must I do)
3. USER.md      — User info (who am I serving)
4. brain/       — Evolved state (how am I feeling/growing)
```

If brain data conflicts with higher-priority sources, the higher source always wins.

### Performance Budget

- **Latency:** <500ms per turn (all local, no LLM calls)
- **Token overhead:** ~150-250 tokens/turn (brain context injection)
- **Storage:** ~1-5MB after months of use
- **API cost:** Zero

## File Structure

```
agentbrain/
├── src/
│   ├── index.ts                    # Main entry + exports
│   ├── core/
│   │   ├── thalamus.ts             # Context router
│   │   ├── hippocampus.ts          # Memory engine
│   │   ├── prefrontal.ts           # Executive planner
│   │   ├── amygdala.ts             # Emotional system
│   │   ├── cerebellum.ts           # Skill/habit engine
│   │   ├── basal-ganglia.ts        # Reward system
│   │   ├── cingulate.ts            # Self-reflection
│   │   └── config.ts               # Configuration
│   ├── integration/
│   │   ├── openclaw-plugin.ts      # OpenClaw plugin entry
│   │   ├── priority-enforcer.ts    # Hierarchy enforcement
│   │   └── context-injector.ts     # Prompt injection
│   ├── marketplace/
│   │   ├── template-manager.ts     # Brain templates
│   │   ├── brain-sync.ts           # Backup/restore
│   │   └── brain-network.ts        # Multi-agent sharing
│   └── storage/
│       └── md-writer.ts            # Markdown file manager
├── brain/                           # Runtime brain state
├── demo/
│   └── simulate-evolution.ts       # Evolution demo
├── dashboard/                       # 3D visualization (Phase 5)
└── tests/                           # 122 tests
```

## Competitive Landscape

| Feature | Mem0 | Letta/MemGPT | LinkedIn CMA | **AgentBrain** |
|---------|------|--------------|--------------|----------------|
| Persistent memory | ✅ | ✅ | ✅ | ✅ |
| Memory tiers | ✅ | ✅ | ✅ | ✅ |
| Personality evolution | ❌ | ❌ | ❌ | ✅ |
| Self-reflection | ❌ | ❌ | ❌ | ✅ |
| Emotional system | ❌ | ❌ | ❌ | ✅ |
| Habit/skill learning | ❌ | ❌ | ❌ | ✅ |
| Reward adaptation | ❌ | Partial | ❌ | ✅ |
| Brain-inspired arch | ❌ | OS-inspired | ❌ | ✅ |
| Plugin/self-hosted | SDK | Full runtime | Internal | ✅ Plugin |
| Open source | ✅ | ✅ | ❌ | ✅ |
| Zero API cost | ❌ | ❌ | ❌ | ✅ |

## Configuration

```typescript
interface BrainConfig {
  brainDir: string;              // Where brain files live (default: ./brain)
  maxRecallResults: number;      // Max memories per recall (default: 10)
  memoryDecayRate: number;       // Decay per day (default: 0.01)
  minMemoryConfidence: number;   // Prune threshold (default: 0.2)
  enableReflection: boolean;     // Self-reflection (default: true)
  enableEmotions: boolean;       // Emotional tracking (default: true)
  enableSkillTracking: boolean;  // Skill/habit detection (default: true)
  maintenanceInterval: number;   // Heartbeats between maintenance (default: 6)
}
```

## Development

```bash
npm run build        # Compile TypeScript
npm run test         # Run all 122 tests
npm run test:watch   # Watch mode
npm run demo         # Run evolution demo
npm run lint         # ESLint
npm run dev          # Watch + rebuild
```

## Roadmap

- [x] Phase 1: Foundation (Thalamus + Hippocampus)
- [x] Phase 2: Personality & Emotion (Amygdala + Cingulate)
- [x] Phase 3: Learning & Adaptation (Cerebellum + Basal Ganglia)
- [x] Phase 4: Integration & Launch (OpenClaw plugin + Priority Hierarchy)
- [x] Phase 5: 3D Brain Dashboard (Three.js visualization)
- [x] Phase 6: Marketplace & Scale (Templates + Sync + Network)

## License

MIT — Built by Sếp & Aira with (✧ω✧)

## References

- LinkedIn Cognitive Memory Agent (InfoQ, April 2026)
- Letta/MemGPT — stateful agents with memory tiers
- Mem0 — framework-agnostic memory layer
- "Brain-inspired and Self-based AI" (arXiv, Feb 2024)
- BrainCog — spiking neural network cognitive engine
- Cleveland Clinic / Johns Hopkins brain anatomy references
