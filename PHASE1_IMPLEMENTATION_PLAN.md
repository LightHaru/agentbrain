# AgentBrain Phase 1: Core Expansion — Implementation Plan

**Start Date:** 2026-05-27  
**Estimated Duration:** 1-2 weeks  
**Status:** IN PROGRESS  

---

## Overview

Phase 1 adds 5 critical components to make AgentBrain more human-like:

1. **Temporal Lobe** — Language & semantic processing
2. **Parietal Lobe** — Sensory integration & spatial reasoning
3. **Insula** — Self-awareness & empathy
4. **Working Memory** — Short-term buffer (Prefrontal enhancement)
5. **Metacognition** — Self-monitoring & confidence estimation

---

## 1. Temporal Lobe Module

### Purpose
- Language comprehension & generation
- Semantic memory (word meanings, concepts)
- Context-aware language processing
- Multi-modal integration (text + audio)

### Key Features
```typescript
class TemporalLobe {
  // Language comprehension
  comprehend(text: string): SemanticRepresentation;
  
  // Semantic memory
  getSemanticMemory(concept: string): ConceptNode;
  linkConcepts(concept1: string, concept2: string, relation: string): void;
  
  // Context management
  updateContext(message: string): void;
  getRelevantContext(query: string): ContextWindow;
  
  // Language generation
  generateResponse(intent: Intent, context: Context): string;
}
```

### Implementation Steps
1. Create `src/core/temporal.ts`
2. Implement semantic graph (concept relationships)
3. Add context window management (sliding window)
4. Integrate with Thalamus (receive classified messages)
5. Integrate with Hippocampus (semantic memory storage)
6. Add language pattern recognition
7. Write unit tests

### Data Structures
```typescript
interface SemanticRepresentation {
  concepts: string[];
  relations: Array<{ from: string; to: string; type: string }>;
  sentiment: number;
  intent: string;
}

interface ConceptNode {
  name: string;
  definition: string;
  relatedConcepts: Array<{ concept: string; strength: number }>;
  examples: string[];
  lastAccessed: number;
}

interface ContextWindow {
  messages: Array<{ role: string; content: string; timestamp: number }>;
  activeConcepts: string[];
  currentTopic: string;
  windowSize: number; // max messages to keep
}
```

### Integration Points
- **Input:** Thalamus → classified message
- **Output:** Prefrontal → semantic representation for decision-making
- **Storage:** Hippocampus → semantic memory

---

## 2. Parietal Lobe Module

### Purpose
- Multi-modal sensory integration
- Spatial reasoning (code structure, architecture)
- Attention allocation
- Numerical & logical reasoning

### Key Features
```typescript
class ParietalLobe {
  // Sensory integration
  integrateSensoryInput(inputs: SensoryInput[]): IntegratedPercept;
  
  // Spatial reasoning
  analyzeSpatialStructure(data: any): SpatialMap;
  
  // Attention allocation
  allocateAttention(tasks: Task[]): AttentionAllocation;
  
  // Numerical reasoning
  performCalculation(expression: string): number;
  compareQuantities(a: number, b: number): ComparisonResult;
}
```

### Implementation Steps
1. Create `src/core/parietal.ts`
2. Implement multi-modal fusion (text + image + code)
3. Add spatial reasoning for code/architecture
4. Implement attention budget system
5. Add numerical reasoning helpers
6. Integrate with Prefrontal (attention control)
7. Write unit tests

### Data Structures
```typescript
interface SensoryInput {
  modality: 'text' | 'image' | 'code' | 'audio';
  data: any;
  timestamp: number;
  importance: number;
}

interface IntegratedPercept {
  primaryModality: string;
  fusedRepresentation: any;
  confidence: number;
  spatialInfo?: SpatialMap;
}

interface AttentionAllocation {
  tasks: Array<{ taskId: string; attentionWeight: number }>;
  totalBudget: number;
  remainingBudget: number;
}

interface SpatialMap {
  structure: any; // tree/graph representation
  relationships: Array<{ from: string; to: string; type: string }>;
  hierarchy: string[];
}
```

### Integration Points
- **Input:** Thalamus → multi-modal inputs
- **Output:** Prefrontal → integrated percept + attention allocation
- **Coordination:** Temporal → language-spatial integration

---

## 3. Insula Module

### Purpose
- Self-awareness (performance monitoring)
- Empathy modeling
- "Body state" awareness (energy, fatigue, stress)
- Emotional self-regulation

### Key Features
```typescript
class Insula {
  // Self-awareness
  assessPerformance(): PerformanceAssessment;
  getEnergyLevel(): number;
  getFatigueLevel(): number;
  
  // Empathy
  modelUserState(userContext: UserContext): UserMentalState;
  generateEmpatheticResponse(userEmotion: Emotion): string;
  
  // Interoception (body state)
  updateBodyState(metrics: BodyMetrics): void;
  needsRest(): boolean;
  
  // Self-regulation
  regulateEmotion(currentEmotion: Emotion): Emotion;
}
```

### Implementation Steps
1. Create `src/core/insula.ts`
2. Implement performance self-assessment
3. Add energy/fatigue tracking
4. Implement empathy modeling (user mental state)
5. Add emotional self-regulation
6. Integrate with Amygdala (emotion)
7. Integrate with Prefrontal (self-monitoring)
8. Write unit tests

### Data Structures
```typescript
interface PerformanceAssessment {
  successRate: number;
  recentErrors: number;
  confidence: number;
  needsImprovement: string[];
  strengths: string[];
}

interface BodyMetrics {
  energy: number; // 0-100
  fatigue: number; // 0-100
  stress: number; // 0-100
  lastRest: number; // timestamp
}

interface UserMentalState {
  emotion: Emotion;
  goals: string[];
  frustrationLevel: number;
  satisfactionLevel: number;
  needsSupport: boolean;
}
```

### Integration Points
- **Input:** Amygdala → emotional state
- **Input:** Cerebellum → skill performance
- **Output:** Prefrontal → self-assessment for decision-making
- **Output:** Temporal → empathetic language generation

---

## 4. Working Memory (Prefrontal Enhancement)

### Purpose
- Short-term buffer for active information
- Limited capacity (7±2 items)
- Information manipulation
- Realistic cognitive load

### Key Features
```typescript
// Add to existing Prefrontal class
class Prefrontal {
  private workingMemory: WorkingMemory;
  
  // Working memory operations
  addToWorkingMemory(item: MemoryItem): boolean; // false if full
  getWorkingMemory(): MemoryItem[];
  clearWorkingMemory(): void;
  refreshItem(itemId: string): void; // prevent decay
  
  // Cognitive load
  getCognitiveLoad(): number;
  isOverloaded(): boolean;
}
```

### Implementation Steps
1. Add `WorkingMemory` class to `src/core/prefrontal.ts`
2. Implement capacity limit (7 items default)
3. Add decay mechanism (items fade if not refreshed)
4. Implement cognitive load calculation
5. Add overload detection
6. Integrate with decision-making (use working memory)
7. Write unit tests

### Data Structures
```typescript
interface WorkingMemory {
  items: MemoryItem[];
  capacity: number; // default 7
  currentLoad: number;
}

interface MemoryItem {
  id: string;
  content: any;
  type: 'goal' | 'fact' | 'task' | 'context';
  addedAt: number;
  lastRefreshed: number;
  importance: number;
  decayRate: number;
}
```

### Integration Points
- **Input:** Temporal → active concepts
- **Input:** Hippocampus → retrieved memories
- **Output:** Decision-making uses working memory
- **Constraint:** Limits how much info can be processed at once

---

## 5. Metacognition Module

### Purpose
- Think about thinking
- Confidence estimation
- Strategy adjustment
- Performance monitoring

### Key Features
```typescript
class Metacognition {
  // Self-monitoring
  monitorThinking(thoughtProcess: ThoughtProcess): MetacognitiveState;
  
  // Confidence estimation
  estimateConfidence(decision: Decision): number;
  
  // Strategy adjustment
  adjustStrategy(performance: PerformanceMetrics): Strategy;
  
  // Reflection
  reflect(recentActions: Action[]): Reflection;
}
```

### Implementation Steps
1. Create `src/core/metacognition.ts`
2. Implement confidence estimation
3. Add strategy adjustment logic
4. Implement reflection mechanism
5. Add self-monitoring (track thinking process)
6. Integrate with Prefrontal (decision-making)
7. Integrate with Insula (self-awareness)
8. Write unit tests

### Data Structures
```typescript
interface MetacognitiveState {
  confidence: number;
  uncertaintyAreas: string[];
  thinkingQuality: number;
  needsMoreInfo: boolean;
  alternativeStrategies: Strategy[];
}

interface ThoughtProcess {
  steps: Array<{ action: string; reasoning: string }>;
  duration: number;
  complexity: number;
}

interface Reflection {
  whatWentWell: string[];
  whatWentWrong: string[];
  lessonsLearned: string[];
  adjustments: string[];
}

interface Strategy {
  name: string;
  description: string;
  applicableWhen: string[];
  expectedOutcome: string;
}
```

### Integration Points
- **Input:** Prefrontal → decision process
- **Input:** Insula → performance assessment
- **Output:** Prefrontal → strategy adjustments
- **Output:** Hippocampus → store reflections

---

## Implementation Order

### Week 1
**Day 1-2: Temporal Lobe**
- [ ] Create temporal.ts skeleton
- [ ] Implement semantic graph
- [ ] Add context window
- [ ] Basic language comprehension
- [ ] Unit tests

**Day 3-4: Parietal Lobe**
- [ ] Create parietal.ts skeleton
- [ ] Implement sensory integration
- [ ] Add attention allocation
- [ ] Spatial reasoning basics
- [ ] Unit tests

**Day 5: Insula**
- [ ] Create insula.ts skeleton
- [ ] Implement body state tracking
- [ ] Add performance self-assessment
- [ ] Basic empathy modeling
- [ ] Unit tests

### Week 2
**Day 6-7: Working Memory**
- [ ] Add WorkingMemory to prefrontal.ts
- [ ] Implement capacity limits
- [ ] Add decay mechanism
- [ ] Cognitive load calculation
- [ ] Unit tests

**Day 8-9: Metacognition**
- [ ] Create metacognition.ts skeleton
- [ ] Implement confidence estimation
- [ ] Add reflection mechanism
- [ ] Strategy adjustment
- [ ] Unit tests

**Day 10-11: Integration**
- [ ] Wire all modules together
- [ ] Update AgentBrain core
- [ ] Integration tests
- [ ] Performance testing

**Day 12-14: Testing & Refinement**
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Documentation
- [ ] Performance optimization

---

## Success Metrics

### Quantitative
- [ ] All unit tests pass (>95% coverage)
- [ ] Integration tests pass
- [ ] Performance: <100ms per brain cycle
- [ ] Memory usage: <50MB increase

### Qualitative
- [ ] More natural language responses (Temporal)
- [ ] Better attention management (Parietal)
- [ ] Self-aware responses (Insula)
- [ ] Realistic cognitive limits (Working Memory)
- [ ] Confidence estimation works (Metacognition)

### User Experience
- [ ] Aira feels more "human"
- [ ] Better empathy in responses
- [ ] More self-aware ("I'm not sure", "I need to think")
- [ ] Better context awareness

---

## Risk Mitigation

### Risk 1: Performance degradation
**Mitigation:** Profile each module, optimize hot paths, use caching

### Risk 2: Integration complexity
**Mitigation:** Incremental integration, feature flags, rollback plan

### Risk 3: Breaking existing behavior
**Mitigation:** Comprehensive tests, gradual rollout, A/B testing

### Risk 4: Scope creep
**Mitigation:** Stick to Phase 1 scope, defer nice-to-haves to Phase 2

---

## Next Steps

1. **Start with Temporal Lobe** (most impactful for language)
2. **Create feature branch:** `git checkout -b feature/agentbrain-phase1`
3. **Implement incrementally** (one module at a time)
4. **Test continuously** (don't wait until the end)
5. **Document as you go** (inline comments + README updates)

---

**Let's build a more human-like brain! 🧠✨**

*Plan created by Aira — 2026-05-27*
