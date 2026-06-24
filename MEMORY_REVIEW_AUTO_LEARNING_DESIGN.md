# AgentBrain Memory Review & Auto-Learning Upgrade Plan

**Date:** 2026-06-24
**Goal:** Nâng cấp AgentBrain với cơ chế tự động học và memory review như Hermes Agent

## 1. Current State Analysis

### Existing Capabilities
AgentBrain đã có nền tảng tốt:

✅ **Memory System:**
- Hippocampus: episodic/semantic/procedural memory
- Vector memory: semantic similarity search
- Memory consolidation & decay
- Query-aware retrieval

✅ **Learning Components:**
- LessonLearner: học từ corrections
- FeedbackAnalyzer: phân tích user reactions
- Metacognition: self-monitoring & reflection
- ReasoningCortex: task-specific hints

✅ **Cognitive Architecture:**
- 15+ brain modules (Thalamus, Amygdala, Prefrontal, etc.)
- Neurochemistry system
- Emotional processing
- Theory of Mind

### Missing for Hermes-like Behavior

❌ **Automatic Memory Review:**
- Không có scheduled memory review
- Không tự động phân tích memory patterns
- Không consolidate memories thành insights
- Không detect contradictions

❌ **Self-Improvement Loop:**
- Không track success/failure metrics per memory type
- Không tự adjust retrieval strategies
- Không proactive memory cleanup
- Không generate meta-learnings

## 2. Hermes Agent Inspiration

Hermes Agent có:
1. **Memory Review Cycles:** định kỳ review memories để tìm patterns
2. **Auto-Learning:** tự học từ mọi interaction
3. **Memory Quality Scoring:** đánh giá quality của memories
4. **Contradiction Detection:** tìm conflicting information
5. **Insight Generation:** tổng hợp insights từ nhiều memories

## 3. Design: Memory Review System

### 3.1 Memory Review Cycle

`	ypescript
interface MemoryReviewCycle {
  trigger: 'scheduled' | 'threshold' | 'manual';
  timestamp: string;
  scope: 'recent' | 'all' | 'topic-specific';
  findings: ReviewFinding[];
  actions: ReviewAction[];
}

interface ReviewFinding {
  type: 'pattern' | 'contradiction' | 'gap' | 'insight';
  severity: number; // 0-1
  description: string;
  affectedMemories: string[]; // memory IDs
  confidence: number;
}

interface ReviewAction {
  type: 'consolidate' | 'prune' | 'flag' | 'strengthen' | 'create-insight';
  targetMemories: string[];
  reason: string;
  executed: boolean;
}
`

### 3.2 Memory Reviewer Module

`	ypescript
class MemoryReviewer {
  // Review strategies
  detectPatterns(): Pattern[];
  findContradictions(): Contradiction[];
  identifyGaps(): Gap[];
  generateInsights(): Insight[];
  
  // Quality assessment
  scoreMemoryQuality(memory: Memory): number;
  detectLowValueMemories(): Memory[];
  
  // Consolidation
  consolidateRelatedMemories(memories: Memory[]): ConsolidatedMemory;
  createMetaMemory(cluster: Memory[]): Memory;
  
  // Scheduling
  scheduleReview(trigger: ReviewTrigger): void;
}
`

### 3.3 Pattern Detection

Tìm patterns trong memories:
- Repeated topics → user interests
- Repeated corrections → persistent mistakes
- Temporal patterns → habits, routines
- Entity co-occurrence → relationships
- Success/failure patterns → what works/doesn't

### 3.4 Contradiction Detection

`	ypescript
interface Contradiction {
  memoryA: Memory;
  memoryB: Memory;
  conflictType: 'factual' | 'preference' | 'instruction';
  severity: number;
  resolution: 'keep-newer' | 'keep-both' | 'manual-review';
}
`

## 4. Design: Auto-Learning System

### 4.1 Learning Loop

`
User Input → Brain Process → Response
              ↓
         Track Outcome
              ↓
    Analyze Success/Failure
              ↓
      Extract Learnings
              ↓
   Update Strategies & Memories
              ↓
      Apply in Future Turns
`

### 4.2 Outcome Tracker

`	ypescript
interface OutcomeRecord {
  turnId: string;
  timestamp: string;
  
  // Context
  taskType: TaskType;
  userIntent: string;
  memoriesUsed: string[];
  strategiesApplied: string[];
  
  // Outcome
  success: boolean;
  userFeedback: FeedbackSignal;
  rewardSignal: number; // -1 to 1
  
  // Metrics
  responseTime: number;
  memoryRelevance: number;
  confidenceAccuracy: number;
}
`

### 4.3 Strategy Adjuster

Tự động điều chỉnh strategies based on outcomes:

`	ypescript
class StrategyAdjuster {
  // Track performance
  trackStrategyOutcome(strategy: string, success: boolean): void;
  
  // Adjust weights
  adjustStrategyWeight(strategy: string, delta: number): void;
  
  // Learn new strategies
  discoverStrategy(pattern: Pattern): Strategy;
  
  // Retire bad strategies
  retireLowPerformingStrategies(): void;
}
`

### 4.4 Meta-Learning

Học về việc học:
- Which memory types work best for which tasks?
- Which retrieval strategies are most effective?
- When should I ask for clarification vs. proceed?
- What patterns indicate user frustration?

## 5. Implementation Plan

### Phase 1: Memory Review Core (Week 1)

**File:** src/core/memory-reviewer.ts

`	ypescript
export class MemoryReviewer {
  constructor(
    private hippocampus: Hippocampus,
    private config: BrainConfig
  ) {}
  
  async runReviewCycle(scope: ReviewScope): Promise<MemoryReviewCycle> {
    const findings: ReviewFinding[] = [];
    
    // 1. Pattern detection
    const patterns = await this.detectPatterns(scope);
    findings.push(...patterns.map(p => this.patternToFinding(p)));
    
    // 2. Contradiction detection
    const contradictions = await this.findContradictions(scope);
    findings.push(...contradictions.map(c => this.contradictionToFinding(c)));
    
    // 3. Gap analysis
    const gaps = await this.identifyGaps(scope);
    findings.push(...gaps.map(g => this.gapToFinding(g)));
    
    // 4. Generate actions
    const actions = this.generateActions(findings);
    
    // 5. Execute actions
    await this.executeActions(actions);
    
    return {
      trigger: scope.trigger,
      timestamp: new Date().toISOString(),
      scope: scope.type,
      findings,
      actions,
    };
  }
}
`

### Phase 2: Auto-Learning Loop (Week 2)

**File:** src/core/outcome-tracker.ts

`	ypescript
export class OutcomeTracker {
  private outcomes: OutcomeRecord[] = [];
  
  recordOutcome(record: OutcomeRecord): void {
    this.outcomes.push(record);
    
    // Immediate learning
    this.extractImmedateLearnings(record);
    
    // Check for patterns
    if (this.outcomes.length % 10 === 0) {
      this.analyzeRecentOutcomes();
    }
  }
  
  private extractImmedateLearnings(record: OutcomeRecord): void {
    // If failure, learn what went wrong
    if (!record.success && record.userFeedback.sentiment === 'negative') {
      this.lessonLearner.extractLesson(record);
    }
    
    // Update strategy weights
    this.strategyAdjuster.adjustWeights(record);
    
    // Update memory relevance scores
    this.hippocampus.updateMemoryRelevance(
      record.memoriesUsed,
      record.rewardSignal
    );
  }
}
`

### Phase 3: Integration với Engine (Week 2)

**Update:** src/engine.ts

`	ypescript
// Add to BrainEngine
export function createBrainEngine(config?: Partial<BrainConfig>) {
  // ... existing modules ...
  
  const memoryReviewer = new MemoryReviewer(hippocampus, cfg);
  const outcomeTracker = new OutcomeTracker(
    hippocampus,
    lessonLearner,
    strategyAdjuster,
    cfg
  );
  
  return {
    // ... existing methods ...
    
    async processTurn(input) {
      const turnId = generateId();
      const startTime = Date.now();
      
      // ... existing processing ...
      
      // Track outcome
      const outcome: OutcomeRecord = {
        turnId,
        timestamp: new Date().toISOString(),
        taskType: thalamus.getLastClassification()?.taskType || 'unknown',
        userIntent: input.message,
        memoriesUsed: relevantMemories.map(m => m.id),
        strategiesApplied: getAppliedStrategies(),
        success: false, // will be updated on next turn
        userFeedback: null,
        rewardSignal: 0,
        responseTime: Date.now() - startTime,
        memoryRelevance: calculateAvgRelevance(relevantMemories),
        confidenceAccuracy: 0,
      };
      
      outcomeTracker.recordOutcome(outcome);
      
      return result;
    },
    
    async reviewMemories(scope?: ReviewScope): Promise<MemoryReviewCycle> {
      return await memoryReviewer.runReviewCycle(scope || { 
        type: 'recent', 
        trigger: 'manual' 
      });
    },
    
    getOutcomeStats(): OutcomeStatistics {
      return outcomeTracker.getStatistics();
    },
  };
}
`

### Phase 4: Scheduled Reviews (Week 3)

**File:** src/core/review-scheduler.ts

`	ypescript
export class ReviewScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  
  start(
    reviewer: MemoryReviewer,
    intervalMs: number = 3600000 // 1 hour default
  ): void {
    this.intervalId = setInterval(async () => {
      const scope: ReviewScope = {
        type: 'recent',
        trigger: 'scheduled',
        timeWindow: intervalMs,
      };
      
      await reviewer.runReviewCycle(scope);
    }, intervalMs);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
`

### Phase 5: OpenClaw Integration (Week 3)

**Update:** src/plugin/entry.ts

Add tools:
- gentbrain_review_memories: trigger manual review
- gentbrain_learning_stats: get learning statistics
- gentbrain_outcome_history: view recent outcomes

**Update:** openclaw.plugin.json

`json
{
  "contracts": {
    "tools": [
      "agentbrain_status",
      "agentbrain_review_memories",
      "agentbrain_learning_stats",
      "agentbrain_outcome_history",
      ...existing tools...
    ]
  }
}
`

## 6. Key Features Summary

### Memory Review System
✅ Automatic pattern detection
✅ Contradiction detection & resolution
✅ Memory quality scoring
✅ Insight generation from memory clusters
✅ Scheduled & triggered reviews

### Auto-Learning System
✅ Outcome tracking for every turn
✅ Strategy adjustment based on success/failure
✅ Memory relevance scoring
✅ Meta-learning (learning about learning)
✅ Continuous improvement loop

### OpenClaw Integration
✅ Exposed as plugin tools
✅ Non-intrusive background operation
✅ Manual trigger option
✅ Statistics & insights available

## 7. Testing Strategy

### Unit Tests
- MemoryReviewer.detectPatterns()
- MemoryReviewer.findContradictions()
- OutcomeTracker.recordOutcome()
- StrategyAdjuster.adjustWeights()

### Integration Tests
- Full review cycle execution
- Learning loop with real conversations
- Memory consolidation accuracy
- Strategy improvement over time

### Performance Tests
- Review cycle time for 1000+ memories
- Impact on processTurn() latency
- Memory usage during review

## 8. Success Metrics

- **Memory Quality:** % of high-relevance memories retrieved
- **Learning Rate:** Strategy success rate improvement over time
- **Review Efficiency:** Time to complete review cycle
- **User Satisfaction:** Reduction in negative feedback
- **Self-Correction:** % of contradictions detected & resolved

## 9. Next Steps

1. ✅ Create design document (this file)
2. ⏳ Implement MemoryReviewer core
3. ⏳ Implement OutcomeTracker
4. ⏳ Integrate with BrainEngine
5. ⏳ Add OpenClaw tools
6. ⏳ Write tests
7. ⏳ Deploy & monitor

---

**End of Design Document**
