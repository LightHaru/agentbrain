# AgentBrain Phase 1 — Integration Plan

**Date:** 2026-05-27  
**Status:** Ready for Integration  

---

## 🎯 Goal

Wire 5 new Phase 1 modules into AgentBrain core and test with real OpenClaw agent.

---

## 📋 Current State

### Existing Modules (7)
- ✅ Thalamus (sensory relay)
- ✅ Hippocampus (memory)
- ✅ Amygdala (emotion)
- ✅ Prefrontal (executive)
- ✅ Cerebellum (skills)
- ✅ Basal Ganglia (habits)
- ✅ Cingulate (conflict)

### New Modules (5) — Phase 1
- ✨ Temporal (language)
- ✨ Parietal (sensory integration)
- ✨ Insula (self-awareness)
- ✨ Working Memory (limited buffer)
- ✨ Metacognition (self-monitoring)

---

## 🔍 Code Review Findings

### Issues Found

#### 1. **Missing Exports in index.ts**
**Severity:** Medium  
**Issue:** New modules not exported from main entry point  
**Fix:** Add exports for 5 new modules

#### 2. **No Integration in createAgentBrain()**
**Severity:** High  
**Issue:** New modules not instantiated in plugin factory  
**Fix:** Initialize new modules in createAgentBrain()

#### 3. **Missing Inter-Module Wiring**
**Severity:** High  
**Issue:** New modules need to communicate with existing ones  
**Fix:** Wire data flow between modules

#### 4. **No Brain Cycle Integration**
**Severity:** High  
**Issue:** New modules not called in onPreResponse/onPostResponse  
**Fix:** Add to brain processing cycle

#### 5. **Working Memory Not Connected to Prefrontal**
**Severity:** Medium  
**Issue:** Working Memory is standalone, should be part of Prefrontal  
**Fix:** Integrate WorkingMemory into PrefrontalCortex class

---

## 🔧 Integration Steps

### Step 1: Update Exports (index.ts)

```typescript
// Add to exports
export { TemporalLobe } from './core/temporal.js';
export { ParietalLobe } from './core/parietal.js';
export { Insula } from './core/insula.js';
export { WorkingMemory } from './core/working-memory.js';
export { Metacognition } from './core/metacognition.js';
```

### Step 2: Update AgentBrainPlugin Interface

```typescript
export interface AgentBrainPlugin {
  name: string;
  version: string;
  config: BrainConfig;
  
  // Existing modules
  thalamus: Thalamus;
  hippocampus: Hippocampus;
  amygdala: Amygdala;
  prefrontal: PrefrontalCortex;
  cerebellum: Cerebellum;
  basalGanglia: BasalGanglia;
  cingulate: AnteriorCingulate;
  
  // Phase 1 modules
  temporal: TemporalLobe;
  parietal: ParietalLobe;
  insula: Insula;
  metacognition: Metacognition;
  
  fileManager: BrainFileManager;
  
  initialize(): Promise<void>;
  onPreResponse(context: MessageContext): Promise<BrainContext>;
  onPostResponse(context: MessageContext, response: string): Promise<void>;
  onHeartbeat(): Promise<void>;
  onSessionStart(sessionId: string): Promise<void>;
}
```

### Step 3: Initialize New Modules in createAgentBrain()

```typescript
export function createAgentBrain(userConfig?: Partial<BrainConfig>): AgentBrainPlugin {
  const config = { ...defaultConfig, ...userConfig };
  const fileManager = new BrainFileManager(config.brainDir);
  
  // Existing modules
  const thalamus = new Thalamus(config);
  const hippocampus = new Hippocampus(config, fileManager);
  const amygdala = new Amygdala(config, fileManager);
  const prefrontal = new PrefrontalCortex(config, fileManager);
  const cerebellum = new Cerebellum(config, fileManager);
  const basalGanglia = new BasalGanglia(config, fileManager);
  const cingulate = new AnteriorCingulate(config, fileManager);
  
  // Phase 1 modules
  const temporal = new TemporalLobe(config);
  const parietal = new ParietalLobe(config);
  const insula = new Insula(config);
  const metacognition = new Metacognition(config);
  
  // ... rest of plugin
}
```

### Step 4: Wire Data Flow in onPreResponse()

```typescript
async onPreResponse(context: MessageContext): Promise<BrainContext> {
  // 1. Thalamus: Classify message
  const classification = this.thalamus.classify(context);
  
  // 2. Temporal: Comprehend language & extract semantics
  const semanticRep = this.temporal.comprehend(
    context.message,
    { role: 'user', timestamp: Date.now() }
  );
  
  // 3. Parietal: Integrate sensory input
  const percept = this.parietal.integrateSensoryInput([
    {
      modality: 'text',
      data: context.message,
      timestamp: Date.now(),
      importance: classification.urgency === 'critical' ? 1.0 : 0.5,
    }
  ]);
  
  // 4. Insula: Model user state
  const userState = this.insula.modelUserState({
    message: context.message,
    recentInteractions: 10, // from session history
    userSuccessRate: 0.8, // from performance tracking
    timeOfDay: new Date().getHours(),
  });
  
  // 5. Hippocampus: Retrieve relevant memories
  const memories = await this.hippocampus.recall(
    semanticRep.concepts.join(' '),
    5
  );
  
  // 6. Amygdala: Assess emotional state
  const emotionalState = this.amygdala.assess(
    classification.emotionalTone,
    userState.emotion.valence
  );
  
  // 7. Prefrontal: Plan response
  const plan = this.prefrontal.plan(classification, context.message);
  
  // 8. Metacognition: Monitor thinking process
  const thinkingProcess = {
    steps: [
      { action: 'Classify', reasoning: 'Thalamus classified message', timestamp: Date.now() },
      { action: 'Comprehend', reasoning: 'Temporal extracted semantics', timestamp: Date.now() },
      { action: 'Plan', reasoning: 'Prefrontal created plan', timestamp: Date.now() },
    ],
    duration: Date.now() - startTime,
    complexity: plan.estimatedComplexity === 'complex' ? 0.8 : 0.4,
    successful: true,
  };
  
  const metacogState = this.metacognition.monitorThinking(thinkingProcess);
  
  return {
    classification,
    semanticRepresentation: semanticRep,
    percept,
    userState,
    relevantMemories: memories,
    emotionalState,
    plan,
    metacognitiveState: metacogState,
    activeSkills: this.cerebellum.getActiveSkills(),
  };
}
```

### Step 5: Update onPostResponse()

```typescript
async onPostResponse(context: MessageContext, response: string): Promise<void> {
  // 1. Temporal: Update context window
  this.temporal.comprehend(response, { role: 'assistant', timestamp: Date.now() });
  
  // 2. Insula: Record performance
  const success = true; // determine from response quality
  this.insula.recordPerformance(success, 'response', Date.now() - startTime);
  
  // 3. Metacognition: Reflect if needed
  if (this.insula.needsRest()) {
    const reflection = this.metacognition.reflect([
      { action: 'Response', outcome: success ? 'success' : 'failure', reasoning: 'Generated response' }
    ]);
    // Log reflection
  }
  
  // 4. Hippocampus: Store episodic memory
  await this.hippocampus.store({
    type: 'episodic',
    content: `User: ${context.message}\nAssistant: ${response}`,
    timestamp: new Date().toISOString(),
    tags: this.temporal.getActiveConcepts(),
  });
  
  // 5. Parietal: Decay activation
  this.temporal.decayActivation(1); // 1 minute elapsed
  
  // 6. Insula: Update body state
  this.insula.updateBodyState({
    energy: this.insula.getEnergyLevel() - 1,
    cognitiveLoad: this.parietal.getAttentionState().tasks.length * 10,
  });
}
```

### Step 6: Add Heartbeat Integration

```typescript
async onHeartbeat(): Promise<void> {
  // 1. Temporal: Decay concept activation
  this.temporal.decayActivation(5); // 5 minutes since last heartbeat
  
  // 2. Insula: Check if needs rest
  if (this.insula.needsRest()) {
    console.log('[AgentBrain] Agent needs rest - energy low or fatigue high');
    this.insula.rest(5); // 5 minutes rest
  }
  
  // 3. Metacognition: Periodic reflection
  const recentActions = []; // get from history
  if (recentActions.length > 5) {
    const reflection = this.metacognition.reflect(recentActions);
    // Store reflection in memory
  }
  
  // 4. Parietal: Prune completed tasks
  this.parietal.pruneCompletedTasks();
}
```

---

## 🧪 Testing Plan

### Unit Tests (Already Done)
- ✅ Temporal: 14/14 tests passing
- ✅ Working Memory: 18/18 tests passing
- ✅ Metacognition: 18/18 tests passing
- ⏳ Parietal: Need to write tests
- ⏳ Insula: Need to write tests

### Integration Tests (To Do)

#### Test 1: Language Comprehension Flow
```typescript
// Test: User message → Temporal → Semantic representation
const context = { message: 'Fix the bug in the code', ... };
const result = await brain.onPreResponse(context);
expect(result.semanticRepresentation.concepts).toContain('bug');
expect(result.semanticRepresentation.concepts).toContain('code');
```

#### Test 2: Self-Awareness Flow
```typescript
// Test: Multiple tasks → Insula detects overload
for (let i = 0; i < 10; i++) {
  await brain.onPreResponse({ message: 'Do task ' + i, ... });
}
expect(brain.insula.needsRest()).toBe(true);
```

#### Test 3: Metacognition Flow
```typescript
// Test: Complex task → Low confidence → Ask for help
const context = { message: 'Refactor entire codebase to TypeScript', ... };
const result = await brain.onPreResponse(context);
expect(result.metacognitiveState.confidence).toBeLessThan(0.5);
expect(result.metacognitiveState.needsMoreInfo).toBe(true);
```

#### Test 4: Working Memory Limits
```typescript
// Test: Add 10 items → Only 7 kept
const wm = brain.prefrontal.workingMemory;
for (let i = 0; i < 10; i++) {
  wm.add({ content: 'Item ' + i, type: 'fact', importance: 0.5, decayRate: 0.5 });
}
expect(wm.getAll().length).toBeLessThanOrEqual(7);
```

### End-to-End Test with OpenClaw

```bash
# 1. Build AgentBrain
cd ~/.openclaw/workspace/projects/agentbrain
npm run build

# 2. Link to OpenClaw
npm link
cd ~/.openclaw
npm link agentbrain

# 3. Test with real agent
openclaw chat --agent test-agent
> "Fix bug in code"
# Expect: Temporal extracts concepts, Metacognition estimates confidence

> "I'm frustrated"
# Expect: Insula detects negative emotion, generates empathetic response

> "Do 10 tasks at once"
# Expect: Parietal allocates attention, Insula detects overload
```

---

## 📊 Performance Considerations

### Expected Impact
- **Brain cycle time:** +20-50ms (acceptable)
- **Memory usage:** +10-20MB (acceptable)
- **CPU usage:** Minimal (mostly data structures)

### Optimization Opportunities
1. **Lazy initialization:** Only create modules when needed
2. **Caching:** Cache semantic representations
3. **Batching:** Batch decay operations
4. **Async:** Make heavy operations async

---

## 🚨 Risks & Mitigation

### Risk 1: Performance Degradation
**Mitigation:** Profile brain cycle, optimize hot paths

### Risk 2: Breaking Existing Behavior
**Mitigation:** Feature flag for Phase 1 modules, gradual rollout

### Risk 3: Integration Bugs
**Mitigation:** Comprehensive integration tests, rollback plan

---

## ✅ Acceptance Criteria

- [ ] All 5 modules exported from index.ts
- [ ] All 5 modules initialized in createAgentBrain()
- [ ] Data flow wired in onPreResponse/onPostResponse
- [ ] Integration tests passing
- [ ] End-to-end test with OpenClaw successful
- [ ] Performance impact < 50ms per brain cycle
- [ ] No breaking changes to existing API

---

## 📅 Timeline

- **Step 1-3:** 30 minutes (update exports, interface, initialization)
- **Step 4-6:** 1 hour (wire data flow)
- **Testing:** 1 hour (integration tests + E2E)
- **Total:** ~2.5 hours

---

**Next Action:** Implement Step 1-3 (exports + initialization)
