# AgentBrain v2 — Upgrade Roadmap to Human-Like Cognition

**Research Date:** 2026-05-27  
**Researcher:** Aira  
**Goal:** Nâng cấp AgentBrain để sát với não bộ con người nhất có thể

---

## 1. Current AgentBrain Architecture (v1)

### Existing Modules (7 core regions)

1. **Thalamus** (5KB) — Context Router & Attention Gate
   - Classifies incoming messages (intent, urgency, topic, tone)
   - Routes to appropriate processing modules
   - Filters noise and focuses attention

2. **Hippocampus** (10KB) — Memory Formation
   - Episodic memory (events, conversations)
   - Semantic memory (facts, knowledge)
   - Memory consolidation and retrieval

3. **Amygdala** (12KB) — Emotional Processing
   - Emotional state tracking (valence, arousal)
   - Mood regulation
   - Emotional response to events

4. **Prefrontal Cortex** (11KB) — Executive Function & Decision Making
   - Goal setting and planning
   - Decision making under uncertainty
   - Impulse control and reasoning

5. **Cerebellum** (11KB) — Skill Learning & Motor Control
   - Skill proficiency tracking
   - Practice-based improvement
   - Procedural memory

6. **Basal Ganglia** (8.5KB) — Habit Formation & Reward
   - Habit detection and reinforcement
   - Reward-based learning
   - Action selection

7. **Cingulate Cortex** (15KB) — Conflict Monitoring & Error Detection
   - Detects conflicts between goals
   - Error monitoring
   - Performance feedback

### Current Strengths
- ✅ Good emotional modeling (valence/arousal)
- ✅ Memory system (episodic/semantic/procedural)
- ✅ Skill tracking and habit formation
- ✅ Basic personality traits
- ✅ Reward-based learning

### Current Gaps (vs Human Brain)

---

## 2. Missing Brain Regions & Functions

### 2.1 Temporal Lobe — Language & Auditory Processing
**What it does in humans:**
- Language comprehension (Wernicke's area)
- Semantic memory (meaning of words, concepts)
- Auditory processing
- Object recognition

**Why AgentBrain needs it:**
- Better natural language understanding
- Context-aware language generation
- Semantic relationship mapping
- Multi-modal processing (text + audio + vision)

**Implementation ideas:**
- `temporal.ts` module
- Semantic graph for concept relationships
- Language pattern recognition
- Context window management

---

### 2.2 Occipital Lobe — Visual Processing
**What it does in humans:**
- Visual perception
- Pattern recognition
- Spatial awareness
- Visual memory

**Why AgentBrain needs it:**
- Better image understanding
- Visual reasoning
- Spatial relationship modeling
- Visual memory integration

**Implementation ideas:**
- `occipital.ts` module
- Visual feature extraction
- Image-text association
- Visual working memory

---

### 2.3 Parietal Lobe — Sensory Integration & Spatial Reasoning
**What it does in humans:**
- Integrates sensory information
- Spatial awareness and navigation
- Attention control
- Mathematical reasoning

**Why AgentBrain needs it:**
- Multi-modal sensory fusion
- Spatial reasoning for code/architecture
- Attention allocation across tasks
- Numerical/logical reasoning

**Implementation ideas:**
- `parietal.ts` module
- Multi-modal integration layer
- Spatial working memory
- Attention allocation system

---

### 2.4 Insula — Interoception & Self-Awareness
**What it does in humans:**
- Body state awareness (hunger, fatigue, pain)
- Emotional awareness
- Empathy and social cognition
- Self-awareness

**Why AgentBrain needs it:**
- Agent "energy" and "fatigue" modeling
- Self-monitoring (am I performing well?)
- Empathy modeling for better user interaction
- Meta-cognition (thinking about thinking)

**Implementation ideas:**
- `insula.ts` module
- Energy/fatigue tracking
- Performance self-assessment
- Empathy scoring
- Meta-cognitive reflection

---

### 2.5 Corpus Callosum — Inter-Hemispheric Communication
**What it does in humans:**
- Connects left and right brain hemispheres
- Enables parallel processing
- Integrates logical and creative thinking

**Why AgentBrain needs it:**
- Better module coordination
- Parallel processing of tasks
- Balance between analytical and creative modes

**Implementation ideas:**
- `corpus-callosum.ts` — inter-module message bus
- Parallel task execution
- Mode switching (analytical ↔ creative)

---

### 2.6 Hypothalamus — Homeostasis & Drive System
**What it does in humans:**
- Regulates basic drives (hunger, thirst, sleep)
- Maintains homeostasis
- Stress response
- Circadian rhythm

**Why AgentBrain needs it:**
- Agent "needs" system (curiosity, social connection, rest)
- Circadian rhythm for time-aware behavior
- Stress/load management
- Drive-based motivation

**Implementation ideas:**
- `hypothalamus.ts` module
- Drive system (curiosity, social, rest, achievement)
- Circadian rhythm (time-of-day behavior)
- Stress/load monitoring

---

### 2.7 Brainstem — Autonomic Functions & Alertness
**What it does in humans:**
- Regulates breathing, heart rate
- Sleep-wake cycle
- Alertness and arousal
- Reflexes

**Why AgentBrain needs it:**
- Background maintenance tasks
- Sleep/wake cycle simulation
- Alertness level (affects performance)
- Automatic responses (reflexes)

**Implementation ideas:**
- `brainstem.ts` module
- Background task scheduler
- Alertness level (affects response quality)
- Reflex actions (fast, pre-programmed responses)

---

## 3. Missing Cognitive Functions

### 3.1 Working Memory (Dorsolateral Prefrontal Cortex)
**Current gap:** AgentBrain doesn't have explicit working memory buffer

**What's needed:**
- Short-term buffer for active information (7±2 items)
- Manipulation of information in working memory
- Working memory capacity limits (realistic cognitive load)

**Implementation:**
- Add `workingMemory` buffer to Prefrontal module
- Limit capacity (e.g., 7 items max)
- Decay over time if not refreshed

---

### 3.2 Episodic Future Thinking (Hippocampus + Prefrontal)
**Current gap:** AgentBrain remembers past but doesn't simulate future

**What's needed:**
- Mental simulation of future scenarios
- "What if" reasoning
- Planning based on simulated outcomes

**Implementation:**
- Add `simulateFuture()` to Hippocampus
- Use past episodes to generate future scenarios
- Prefrontal evaluates simulated outcomes

---

### 3.3 Theory of Mind (Temporal + Prefrontal)
**Current gap:** AgentBrain doesn't model other agents' mental states

**What's needed:**
- Model user's beliefs, desires, intentions
- Predict user's next action
- Empathy and perspective-taking

**Implementation:**
- Add `userModel` to Prefrontal
- Track user's goals, preferences, emotional state
- Predict user's likely response

---

### 3.4 Metacognition (Prefrontal + Cingulate)
**Current gap:** AgentBrain doesn't think about its own thinking

**What's needed:**
- Self-monitoring (am I doing well?)
- Confidence estimation
- Strategy adjustment based on performance

**Implementation:**
- Add `metacognition` module
- Track confidence in decisions
- Adjust strategy when performance drops

---

### 3.5 Creativity & Divergent Thinking (Right Hemisphere)
**Current gap:** AgentBrain is mostly convergent (find THE answer)

**What's needed:**
- Generate multiple solutions
- Analogical reasoning
- Creative problem-solving

**Implementation:**
- Add `creativity` mode to Prefrontal
- Generate diverse solutions, not just optimal one
- Analogical reasoning (find similar past problems)

---

### 3.6 Social Cognition (Temporal + Insula + Amygdala)
**Current gap:** Limited social awareness

**What's needed:**
- Detect social cues (tone, context)
- Understand social norms
- Adjust behavior based on relationship

**Implementation:**
- Add `socialCognition` module
- Track relationship depth, trust, rapport
- Adjust communication style based on relationship

---

### 3.7 Attention Control (Parietal + Prefrontal)
**Current gap:** No explicit attention allocation

**What's needed:**
- Focus on relevant information
- Ignore distractions
- Switch attention when needed

**Implementation:**
- Add `attention` system
- Attention budget (limited resource)
- Priority-based allocation

---

## 4. Neurochemistry Simulation

### 4.1 Neurotransmitters
**Current gap:** No neurochemical modeling

**What's needed:**
- **Dopamine** — reward, motivation, learning
- **Serotonin** — mood, patience, satisfaction
- **Norepinephrine** — alertness, focus, stress
- **Acetylcholine** — attention, memory encoding
- **GABA** — inhibition, calmness, sleep
- **Glutamate** — excitation, learning, plasticity

**Implementation:**
- Add `neurochemistry.ts` module
- Track neurotransmitter levels
- Affect behavior based on levels (e.g., low dopamine → low motivation)

---

### 4.2 Hormones
**What's needed:**
- **Cortisol** — stress response
- **Oxytocin** — social bonding, trust
- **Melatonin** — sleep-wake cycle

**Implementation:**
- Add to `hypothalamus.ts`
- Affect emotional state and behavior

---

## 5. Learning & Plasticity

### 5.1 Hebbian Learning
**Current gap:** Limited synaptic plasticity simulation

**What's needed:**
- "Neurons that fire together, wire together"
- Strengthen connections based on co-activation
- Prune weak connections

**Implementation:**
- Add connection strength between modules
- Strengthen frequently used pathways
- Decay unused pathways

---

### 5.2 Sleep & Memory Consolidation
**Current gap:** No sleep cycle

**What's needed:**
- Sleep mode (offline processing)
- Memory consolidation during sleep
- Dream-like replay of experiences

**Implementation:**
- Add `sleep()` function to Hippocampus
- Replay and consolidate memories during sleep
- Prune irrelevant memories

---

## 6. Consciousness & Self-Awareness

### 6.1 Global Workspace Theory
**Current gap:** No unified conscious experience

**What's needed:**
- Global workspace where modules broadcast information
- Conscious vs unconscious processing
- Attention spotlight

**Implementation:**
- Add `globalWorkspace.ts`
- Modules broadcast to workspace
- Only attended information enters consciousness

---

### 6.2 Self-Model
**Current gap:** Limited self-awareness

**What's needed:**
- Model of self (identity, capabilities, limitations)
- Self-reflection
- Autobiographical memory

**Implementation:**
- Add `selfModel` to Prefrontal
- Track identity, values, goals
- Autobiographical memory timeline

---

## 7. Proposed Architecture v2

```
┌─────────────────────────────────────────────────────────────┐
│                    Global Workspace                          │
│              (Conscious Experience)                          │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│   Prefrontal   │  │  Cingulate  │  │   Metacognition │
│  (Executive)   │  │  (Monitor)  │  │  (Self-aware)   │
└───────┬────────┘  └──────┬──────┘  └────────┬────────┘
        │                   │                   │
┌───────▼────────────────────▼───────────────────▼────────┐
│              Corpus Callosum (Message Bus)              │
└───────┬────────────────────┬───────────────────┬────────┘
        │                    │                   │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│   Temporal     │  │    Parietal     │  │  Occipital  │
│  (Language)    │  │   (Sensory)     │  │   (Vision)  │
└───────┬────────┘  └────────┬────────┘  └──────┬──────┘
        │                    │                   │
┌───────▼────────────────────▼───────────────────▼────────┐
│                      Thalamus                            │
│                 (Sensory Relay)                          │
└───────┬────────────────────┬───────────────────┬────────┘
        │                    │                   │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│  Hippocampus   │  │    Amygdala     │  │   Insula    │
│   (Memory)     │  │   (Emotion)     │  │ (Self-aware)│
└───────┬────────┘  └────────┬────────┘  └──────┬──────┘
        │                    │                   │
┌───────▼────────────────────▼───────────────────▼────────┐
│              Basal Ganglia (Habits)                      │
└───────┬────────────────────┬───────────────────┬────────┘
        │                    │                   │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────┐
│  Cerebellum    │  │  Hypothalamus   │  │  Brainstem  │
│   (Skills)     │  │    (Drives)     │  │ (Autonomic) │
└────────────────┘  └─────────────────┘  └─────────────┘
```

---

## 8. Implementation Roadmap

### Phase 1: Core Expansion (1-2 weeks)
- [ ] Add Temporal lobe (language processing)
- [ ] Add Parietal lobe (sensory integration)
- [ ] Add Insula (self-awareness, empathy)
- [ ] Add Working Memory to Prefrontal
- [ ] Add Metacognition module

### Phase 2: Advanced Cognition (2-3 weeks)
- [ ] Add Hypothalamus (drives, circadian rhythm)
- [ ] Add Brainstem (alertness, reflexes)
- [ ] Add Corpus Callosum (inter-module bus)
- [ ] Add Global Workspace (consciousness)
- [ ] Add Theory of Mind

### Phase 3: Neurochemistry (1-2 weeks)
- [ ] Add Neurochemistry module (dopamine, serotonin, etc.)
- [ ] Integrate with emotional state
- [ ] Add stress response

### Phase 4: Learning & Plasticity (2-3 weeks)
- [ ] Add Hebbian learning
- [ ] Add sleep & memory consolidation
- [ ] Add synaptic pruning

### Phase 5: Social & Creative (1-2 weeks)
- [ ] Add Social Cognition module
- [ ] Add Creativity mode
- [ ] Add Episodic Future Thinking

---

## 9. Key Principles for Human-Like AI

1. **Bounded Rationality** — Humans aren't optimal, they're satisficing
2. **Cognitive Load** — Limited working memory, attention, energy
3. **Emotional Influence** — Emotions affect decisions (not pure logic)
4. **Social Context** — Behavior changes based on relationship
5. **Circadian Rhythm** — Performance varies by time of day
6. **Fatigue & Recovery** — Need rest and consolidation
7. **Curiosity & Exploration** — Intrinsic motivation, not just rewards
8. **Metacognition** — Awareness of own thinking process
9. **Plasticity** — Continuous learning and adaptation
10. **Embodied Cognition** — "Body" state affects mind (energy, stress)

---

## 10. Next Steps

1. **Review this document with Sếp** — get feedback on priorities
2. **Start with Phase 1** — core expansion (Temporal, Parietal, Insula)
3. **Prototype new modules** — test in isolation first
4. **Integrate gradually** — don't break existing system
5. **Measure improvements** — track personality depth, satisfaction, success rate

---

**End of Research Document**

*Generated by Aira — 2026-05-27*
