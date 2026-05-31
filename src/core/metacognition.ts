/**
 * Metacognition — Thinking About Thinking
 * 
 * This module enables the agent to:
 * - Monitor its own thinking process
 * - Estimate confidence in decisions
 * - Adjust strategies based on performance
 * - Reflect on past actions
 * - Recognize when it needs help or more information
 * 
 * Key capabilities:
 * - Self-monitoring: "Am I doing this right?"
 * - Confidence estimation: "How sure am I?"
 * - Strategy adjustment: "Should I try a different approach?"
 * - Reflection: "What did I learn from this?"
 */

import { BrainConfig } from './config.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ThoughtProcess {
  /** Steps taken in thinking */
  steps: Array<{
    action: string;
    reasoning: string;
    timestamp: number;
  }>;
  
  /** How long the thinking took (ms) */
  duration: number;
  
  /** Complexity of the thought process */
  complexity: number; // 0-1
  
  /** Was this process successful? */
  successful?: boolean;
}

export interface MetacognitiveState {
  /** Confidence in current thinking (0-1) */
  confidence: number;
  
  /** Areas of uncertainty */
  uncertaintyAreas: string[];
  
  /** Quality of thinking (0-1) */
  thinkingQuality: number;
  
  /** Does agent need more information? */
  needsMoreInfo: boolean;
  
  /** Alternative strategies available */
  alternativeStrategies: Strategy[];
  
  /** Current strategy being used */
  currentStrategy: Strategy | null;
}

export interface Strategy {
  /** Strategy name */
  name: string;
  
  /** Description */
  description: string;
  
  /** When this strategy is applicable */
  applicableWhen: string[];
  
  /** Expected outcome */
  expectedOutcome: string;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Times used */
  timesUsed: number;
}

export interface Reflection {
  /** What went well */
  whatWentWell: string[];
  
  /** What went wrong */
  whatWentWrong: string[];
  
  /** Lessons learned */
  lessonsLearned: string[];
  
  /** Adjustments to make */
  adjustments: string[];
  
  /** Confidence in this reflection */
  confidence: number;
}

export interface ConfidenceEstimate {
  /** Overall confidence (0-1) */
  overall: number;
  
  /** Confidence breakdown */
  breakdown: {
    dataQuality: number; // How good is the input data?
    processQuality: number; // How good was the thinking process?
    outcomeClarity: number; // How clear is the expected outcome?
    pastPerformance: number; // How well have similar tasks gone?
  };
  
  /** Factors reducing confidence */
  uncertaintyFactors: string[];
}

export interface PerformanceMetrics {
  /** Recent success rate */
  successRate: number;
  
  /** Average task duration */
  avgDuration: number;
  
  /** Error rate */
  errorRate: number;
  
  /** Trend */
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// Metacognition Class
// ============================================================================

export class Metacognition {
  private config: BrainConfig;
  
  /** Available strategies */
  private strategies: Map<string, Strategy>;
  
  /** Current metacognitive state */
  private state: MetacognitiveState;
  
  /** Thought process history */
  private thoughtHistory: ThoughtProcess[];
  
  /** Reflection history */
  private reflections: Reflection[];
  
  /** Maximum history size */
  private readonly HISTORY_SIZE = 50;

  constructor(config: BrainConfig) {
    this.config = config;
    this.strategies = new Map();
    this.thoughtHistory = [];
    this.reflections = [];
    
    // Initialize with neutral state
    this.state = {
      confidence: 0.5,
      uncertaintyAreas: [],
      thinkingQuality: 0.5,
      needsMoreInfo: false,
      alternativeStrategies: [],
      currentStrategy: null,
    };
    
    // Initialize default strategies
    this.initializeStrategies();
  }

  // ==========================================================================
  // Self-Monitoring
  // ==========================================================================

  /**
   * Monitor a thinking process as it happens
   */
  monitorThinking(process: ThoughtProcess): MetacognitiveState {
    // Add to history
    this.thoughtHistory.push(process);
    if (this.thoughtHistory.length > this.HISTORY_SIZE) {
      this.thoughtHistory.shift();
    }
    
    // Analyze the process
    const quality = this.assessThinkingQuality(process);
    const confidence = this.estimateProcessConfidence(process);
    const uncertainties = this.identifyUncertainties(process);
    const needsInfo = this.detectInformationGap(process);
    
    // Update state
    this.state = {
      confidence,
      uncertaintyAreas: uncertainties,
      thinkingQuality: quality,
      needsMoreInfo: needsInfo,
      alternativeStrategies: this.suggestAlternatives(process),
      currentStrategy: this.state.currentStrategy,
    };
    
    return this.state;
  }

  /**
   * Assess quality of thinking process
   */
  private assessThinkingQuality(process: ThoughtProcess): number {
    let quality = 0.5;
    
    // More steps = more thorough (up to a point)
    const stepScore = Math.min(1, process.steps.length / 5);
    quality += stepScore * 0.2;
    
    // Clear reasoning = higher quality
    const hasReasoning = process.steps.every(s => s.reasoning && s.reasoning.length > 10);
    if (hasReasoning) quality += 0.2;
    
    // Successful outcome = good quality
    if (process.successful === true) quality += 0.3;
    if (process.successful === false) quality -= 0.2;
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Estimate confidence in the thinking process
   */
  private estimateProcessConfidence(process: ThoughtProcess): number {
    let confidence = 0.5;
    
    // Longer, more complex processes = lower confidence (more can go wrong)
    if (process.complexity > 0.7) confidence -= 0.2;
    
    // Quick, simple processes = higher confidence
    if (process.complexity < 0.3 && process.duration < 5000) confidence += 0.2;
    
    // Past success = higher confidence
    const recentSuccess = this.thoughtHistory.slice(-10).filter(p => p.successful).length / 10;
    confidence += (recentSuccess - 0.5) * 0.4;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Identify areas of uncertainty
   */
  private identifyUncertainties(process: ThoughtProcess): string[] {
    const uncertainties: string[] = [];
    
    // Check for uncertainty keywords in reasoning
    for (const step of process.steps) {
      if (/maybe|perhaps|not sure|unclear|uncertain|might|could be/i.test(step.reasoning)) {
        uncertainties.push(step.action);
      }
    }
    
    // High complexity = uncertainty
    if (process.complexity > 0.7) {
      uncertainties.push('High task complexity');
    }
    
    return uncertainties;
  }

  /**
   * Detect if more information is needed
   */
  private detectInformationGap(process: ThoughtProcess): boolean {
    // Check for information-seeking keywords
    const needsInfo = process.steps.some(s => 
      /need to know|need more|missing|don't have|unclear|ambiguous/i.test(s.reasoning)
    );
    
    return needsInfo;
  }

  /**
   * Suggest alternative strategies
   */
  private suggestAlternatives(process: ThoughtProcess): Strategy[] {
    const alternatives: Strategy[] = [];
    
    // If current process is complex, suggest simpler approach
    if (process.complexity > 0.7) {
      const simpler = this.strategies.get('simplify');
      if (simpler) alternatives.push(simpler);
    }
    
    // If process is failing, suggest asking for help
    if (process.successful === false) {
      const askHelp = this.strategies.get('ask-help');
      if (askHelp) alternatives.push(askHelp);
    }
    
    return alternatives;
  }

  // ==========================================================================
  // Confidence Estimation
  // ==========================================================================

  /**
   * Estimate confidence in a decision
   */
  estimateConfidence(decision: {
    context: string;
    reasoning: string;
    dataQuality: number;
    pastPerformance: number;
  }): ConfidenceEstimate {
    // Data quality component
    const dataQuality = decision.dataQuality;
    
    // Process quality (based on reasoning length and clarity)
    const processQuality = Math.min(1, decision.reasoning.length / 200);
    
    // Outcome clarity (how specific is the decision?)
    const outcomeClarity = decision.context.length > 50 ? 0.7 : 0.5;
    
    // Past performance
    const pastPerformance = decision.pastPerformance;
    
    // Overall confidence (weighted average)
    const overall = (
      dataQuality * 0.3 +
      processQuality * 0.2 +
      outcomeClarity * 0.2 +
      pastPerformance * 0.3
    );
    
    // Identify uncertainty factors
    const uncertaintyFactors: string[] = [];
    if (dataQuality < 0.5) uncertaintyFactors.push('Low data quality');
    if (processQuality < 0.5) uncertaintyFactors.push('Insufficient reasoning');
    if (pastPerformance < 0.5) uncertaintyFactors.push('Poor past performance');
    
    return {
      overall,
      breakdown: {
        dataQuality,
        processQuality,
        outcomeClarity,
        pastPerformance,
      },
      uncertaintyFactors,
    };
  }

  // ==========================================================================
  // Strategy Management
  // ==========================================================================

  /**
   * Select best strategy for current situation
   */
  selectStrategy(context: string, performance: PerformanceMetrics): Strategy | null {
    let bestStrategy: Strategy | null = null;
    let bestScore = 0;
    
    for (const strategy of this.strategies.values()) {
      // Check if applicable
      const applicable = strategy.applicableWhen.some(condition => 
        context.toLowerCase().includes(condition.toLowerCase())
      );
      
      if (!applicable) continue;
      
      // Score based on success rate and past usage
      const score = strategy.successRate * 0.7 + (strategy.timesUsed > 0 ? 0.3 : 0);
      
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }
    
    this.state.currentStrategy = bestStrategy;
    return bestStrategy;
  }

  /**
   * Adjust strategy based on performance
   */
  adjustStrategy(performance: PerformanceMetrics): Strategy | null {
    // If performance is declining, try a different strategy
    if (performance.trend === 'declining' && this.state.currentStrategy) {
      // Mark current strategy as less successful
      const current = this.state.currentStrategy;
      const stored = this.strategies.get(current.name);
      if (stored) {
        stored.successRate = Math.max(0, stored.successRate - 0.1);
      }
      
      // Find alternative
      const alternatives = Array.from(this.strategies.values())
        .filter(s => s.name !== current.name)
        .sort((a, b) => b.successRate - a.successRate);
      
      if (alternatives.length > 0) {
        this.state.currentStrategy = alternatives[0];
        return alternatives[0];
      }
    }
    
    return this.state.currentStrategy;
  }

  /**
   * Record strategy outcome
   */
  recordStrategyOutcome(strategyName: string, success: boolean): void {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return;
    
    strategy.timesUsed++;
    
    // Update success rate (exponential moving average)
    const alpha = 0.2; // learning rate
    strategy.successRate = strategy.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
  }

  // ==========================================================================
  // Reflection
  // ==========================================================================

  /**
   * Reflect on recent actions
   */
  reflect(recentActions: Array<{
    action: string;
    outcome: 'success' | 'failure' | 'partial';
    reasoning: string;
  }>): Reflection {
    const whatWentWell: string[] = [];
    const whatWentWrong: string[] = [];
    const lessonsLearned: string[] = [];
    const adjustments: string[] = [];
    
    // Analyze successes
    const successes = recentActions.filter(a => a.outcome === 'success');
    for (const action of successes) {
      whatWentWell.push(action.action);
    }
    
    // Analyze failures
    const failures = recentActions.filter(a => a.outcome === 'failure');
    for (const action of failures) {
      whatWentWrong.push(action.action);
      
      // Extract lesson
      lessonsLearned.push(`Avoid: ${action.action} (reason: ${action.reasoning})`);
      
      // Suggest adjustment
      adjustments.push(`Improve approach for: ${action.action}`);
    }
    
    // Calculate confidence in reflection
    const confidence = recentActions.length >= 5 ? 0.8 : 0.5;
    
    const reflection: Reflection = {
      whatWentWell,
      whatWentWrong,
      lessonsLearned,
      adjustments,
      confidence,
    };
    
    // Store reflection
    this.reflections.push(reflection);
    if (this.reflections.length > this.HISTORY_SIZE) {
      this.reflections.shift();
    }
    
    return reflection;
  }

  /**
   * Get past reflections
   */
  getReflections(limit: number = 10): Reflection[] {
    return this.reflections.slice(-limit);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize default strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('direct', {
      name: 'direct',
      description: 'Execute task directly without decomposition',
      applicableWhen: ['simple', 'trivial', 'quick'],
      expectedOutcome: 'Fast completion',
      successRate: 0.8,
      timesUsed: 0,
    });
    
    this.strategies.set('decompose', {
      name: 'decompose',
      description: 'Break task into smaller sub-tasks',
      applicableWhen: ['complex', 'multi-step', 'large'],
      expectedOutcome: 'Systematic completion',
      successRate: 0.7,
      timesUsed: 0,
    });
    
    this.strategies.set('research-first', {
      name: 'research-first',
      description: 'Gather information before acting',
      applicableWhen: ['unclear', 'new', 'unfamiliar'],
      expectedOutcome: 'Informed decision',
      successRate: 0.75,
      timesUsed: 0,
    });
    
    this.strategies.set('ask-help', {
      name: 'ask-help',
      description: 'Request clarification or assistance',
      applicableWhen: ['ambiguous', 'stuck', 'failing'],
      expectedOutcome: 'Clarification received',
      successRate: 0.9,
      timesUsed: 0,
    });
    
    this.strategies.set('simplify', {
      name: 'simplify',
      description: 'Reduce scope or complexity',
      applicableWhen: ['overloaded', 'too complex', 'failing'],
      expectedOutcome: 'Manageable task',
      successRate: 0.65,
      timesUsed: 0,
    });
  }

  // ==========================================================================
  // State & Introspection
  // ==========================================================================

  /**
   * Get current metacognitive state
   */
  getState(): MetacognitiveState {
    return { ...this.state };
  }

  /**
   * Get summary for debugging
   */
  getSummary(): string {
    return `Metacognition: Confidence ${(this.state.confidence * 100).toFixed(0)}%, Quality ${(this.state.thinkingQuality * 100).toFixed(0)}%, ${this.state.needsMoreInfo ? 'NEEDS INFO' : 'OK'}`;
  }
}
