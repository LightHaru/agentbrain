---
name: agentbrain
description: "Brain-inspired cognitive architecture. Self-evolving personality, memory, emotions, skill learning, and reward adaptation. Injects brain context into every prompt."
metadata:
  openclaw:
    emoji: "brain"
    requires:
      bins: []
    install: []
---

# AgentBrain

Self-evolving AI cognitive architecture with semantic memory, emotion modeling, personality traits, skill learning, and reward systems.

## Features

### Dual-Layer Memory
- Vector Memory: fast semantic similarity matching via local embeddings.
- Graph Memory: entity/relationship recall with semantic traversal.
- Long-term context preservation across sessions.
- Automatic memory consolidation and decay.

### Adaptive RAG
- Query-aware retrieval instead of fixed top-k memory injection.
- Vector recall for semantic similarity, graph recall for entities and links,
  procedural recall for workflows, and reflective recall for lessons.
- Relevance criticism before prompt injection: filter stale, weak, unrelated,
  or contradicted memories.
- Memory reinforcement: useful recalls increase access count and confidence.
- Noise gating: greetings, teasing-only turns, and one-word reactions are not
  saved unless the response contains concrete durable findings.

### Emotion System (AffectCore)
- Generative discrete emotions via cognitive appraisal theory.
- Valence/Arousal/Dominance tracking.
- Spontaneous mood drift based on interoception.
- Vietnamese sentiment detection.

### Personality & Traits
- Real-time personality influence on responses.
- Warmth, assertiveness, directness, protectiveness scales.
- Self-aware persona management.
- Adaptive tone based on relationship depth.

### Knowledge Extraction
- Automatic fact/entity extraction from sessions.
- Relationship type inference.
- Knowledge graph building.
- Cross-session semantic linking.

## Tools

AgentBrain exposes these OpenClaw tools when the plugin is active:

```bash
agentbrain_status
agentbrain_emotions
agentbrain_graph
agentbrain_memories
agentbrain_skills
agentbrain_reflect
```

## Storage

Brain state persists in `~/.openclaw/data/agentbrain/brain.db`:
- SQLite database with vector embeddings.
- Relationship graphs.
- Memory decay tracking.
- Personality snapshots.
