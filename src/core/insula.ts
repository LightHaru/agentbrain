/**
 * Insula — Self-Awareness & Empathy
 * 
 * Like the brain's insula, this module handles:
 * - Interoception: Awareness of internal "body" state (energy, fatigue, stress)
 * - Self-awareness: Performance monitoring, confidence, limitations
 * - Empathy: Modeling user's mental/emotional state
 * - Emotional self-regulation
 * 
 * Key functions:
 * - Monitor agent's own performance and well-being
 * - Detect when agent needs rest or is overloaded
 * - Model user's emotional state and needs
 * - Generate empathetic responses
 */

import { BrainConfig } from './config.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BodyMetrics {
  /** Energy level (0-100) */
  energy: number;
  
  /** Fatigue level (0-100, higher = more tired) */
  fatigue: number;
  
  /** Stress level (0-100) */
  stress: number;
  
  /** Last time agent "rested" */
  lastRest: number;
  
  /** Cognitive load (0-100) */
  cognitiveLoad: number;
  
  /** Time since last interaction */
  idleTime: number;
}

export interface PerformanceAssessment {
  /** Recent success rate (0-1) */
  successRate: number;
  
  /** Number of recent errors */
  recentErrors: number;
  
  /** Confidence in current abilities (0-1) */
  confidence: number;
  
  /** Areas needing improvement */
  needsImprovement: string[];
  
  /** Current strengths */
  strengths: string[];
  
  /** Overall performance trend */
  trend: 'improving' | 'stable' | 'declining';
}

export interface UserMentalState {
  /** User's current emotion */
  emotion: {
    valence: number; // -1 to 1 (negative to positive)
    arousal: number; // 0 to 1 (calm to excited)
    dominance: number; // 0 to 1 (submissive to dominant)
  };
  
  /** Inferred user goals */
  goals: string[];
  
  /** User frustration level (0-1) */
  frustrationLevel: number;
  
  /** User satisfaction level (0-1) */
  satisfactionLevel: number;
  
  /** Does user need support? */
  needsSupport: boolean;
  
  /** User's likely next action */
  predictedNextAction?: string;
  
  /** Confidence in this model */
  confidence: number;
}

export interface EmpatheticResponse {
  /** Response text */
  text: string;
  
  /** Emotional tone to use */
  tone: 'supportive' | 'encouraging' | 'calming' | 'celebratory' | 'neutral';
  
  /** Empathy level (0-1) */
  empathyLevel: number;
}

export interface SelfRegulationAction {
  /** Type of regulation */
  type: 'rest' | 'reduce-load' | 'seek-help' | 'continue' | 'celebrate';
  
  /** Reason for this action */
  reason: string;
  
  /** Urgency (0-1) */
  urgency: number;
}

// ============================================================================
// Insula Class
// ============================================================================

export class Insula {
  private config: BrainConfig;
  
  /** Current body state */
  private bodyState: BodyMetrics;
  
  /** Performance history (last N actions) */
  private performanceHistory: Array<{
    timestamp: number;
    success: boolean;
    taskType: string;
    duration: number;
  }>;
  
  /** User state model */
  private userState: UserMentalState;
  
  /** Maximum performance history size */
  private readonly HISTORY_SIZE = 50;
  
  /** Energy decay rate per minute */
  private readonly ENERGY_DECAY_RATE = 0.5;
  
  /** Fatigue accumulation rate per task */
  private readonly FATIGUE_RATE = 2;
  
  /** Rest recovery rate per minute */
  private readonly RECOVERY_RATE = 5;

  constructor(config: BrainConfig) {
    this.config = config;
    
    // Initialize with healthy state
    this.bodyState = {
      energy: 100,
      fatigue: 0,
      stress: 0,
      lastRest: Date.now(),
      cognitiveLoad: 0,
      idleTime: 0,
    };
    
    this.performanceHistory = [];
    
    // Initialize neutral user state
    this.userState = {
      emotion: { valence: 0, arousal: 0.5, dominance: 0.5 },
      goals: [],
      frustrationLevel: 0,
      satisfactionLevel: 0.5,
      needsSupport: false,
      confidence: 0.5,
    };
  }

  // ==========================================================================
  // Self-Awareness & Performance Monitoring
  // ==========================================================================

  /**
   * Assess current performance
   */
  assessPerformance(): PerformanceAssessment {
    if (this.performanceHistory.length === 0) {
      return {
        successRate: 0.5,
        recentErrors: 0,
        confidence: 0.5,
        needsImprovement: [],
        strengths: [],
        trend: 'stable',
      };
    }
    
    // Calculate success rate (last 20 actions)
    const recent = this.performanceHistory.slice(-20);
    const successes = recent.filter(h => h.success).length;
    const successRate = successes / recent.length;
    
    // Count recent errors
    const recentErrors = recent.filter(h => !h.success).length;
    
    // Calculate confidence based on success rate and consistency
    const confidence = this.calculateConfidence(recent);
    
    // Identify areas needing improvement
    const needsImprovement = this.identifyWeaknesses(recent);
    
    // Identify strengths
    const strengths = this.identifyStrengths(recent);
    
    // Determine trend
    const trend = this.calculateTrend();
    
    return {
      successRate,
      recentErrors,
      confidence,
      needsImprovement,
      strengths,
      trend,
    };
  }

  /**
   * Calculate confidence based on performance consistency
   */
  private calculateConfidence(history: typeof this.performanceHistory): number {
    if (history.length < 5) return 0.5;
    
    const successRate = history.filter(h => h.success).length / history.length;
    
    // Check consistency (variance in success)
    const recentSuccesses = history.slice(-10).filter(h => h.success).length;
    const consistency = recentSuccesses / Math.min(10, history.length);
    
    return (successRate + consistency) / 2;
  }

  /**
   * Identify areas needing improvement
   */
  private identifyWeaknesses(history: typeof this.performanceHistory): string[] {
    const weaknesses: string[] = [];
    
    // Group by task type
    const byType = new Map<string, { success: number; total: number }>();
    
    for (const h of history) {
      const stats = byType.get(h.taskType) || { success: 0, total: 0 };
      stats.total++;
      if (h.success) stats.success++;
      byType.set(h.taskType, stats);
    }
    
    // Find task types with low success rate
    for (const [type, stats] of byType.entries()) {
      if (stats.total >= 3 && stats.success / stats.total < 0.5) {
        weaknesses.push(type);
      }
    }
    
    return weaknesses;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(history: typeof this.performanceHistory): string[] {
    const strengths: string[] = [];
    
    // Group by task type
    const byType = new Map<string, { success: number; total: number }>();
    
    for (const h of history) {
      const stats = byType.get(h.taskType) || { success: 0, total: 0 };
      stats.total++;
      if (h.success) stats.success++;
      byType.set(h.taskType, stats);
    }
    
    // Find task types with high success rate
    for (const [type, stats] of byType.entries()) {
      if (stats.total >= 3 && stats.success / stats.total > 0.8) {
        strengths.push(type);
      }
    }
    
    return strengths;
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.performanceHistory.length < 10) return 'stable';
    
    const firstHalf = this.performanceHistory.slice(0, Math.floor(this.performanceHistory.length / 2));
    const secondHalf = this.performanceHistory.slice(Math.floor(this.performanceHistory.length / 2));
    
    const firstRate = firstHalf.filter(h => h.success).length / firstHalf.length;
    const secondRate = secondHalf.filter(h => h.success).length / secondHalf.length;
    
    const diff = secondRate - firstRate;
    
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Record a performance event
   */
  recordPerformance(success: boolean, taskType: string, duration: number): void {
    this.performanceHistory.push({
      timestamp: Date.now(),
      success,
      taskType,
      duration,
    });
    
    // Trim history
    if (this.performanceHistory.length > this.HISTORY_SIZE) {
      this.performanceHistory.shift();
    }
    
    // Update body state based on performance
    if (!success) {
      this.bodyState.stress = Math.min(100, this.bodyState.stress + 5);
    }
    
    this.bodyState.fatigue = Math.min(100, this.bodyState.fatigue + this.FATIGUE_RATE);
    this.bodyState.energy = Math.max(0, this.bodyState.energy - this.ENERGY_DECAY_RATE);
  }

  // ==========================================================================
  // Interoception (Body State Awareness)
  // ==========================================================================

  /**
   * Get current energy level
   */
  getEnergyLevel(): number {
    return this.bodyState.energy;
  }

  /**
   * Get current fatigue level
   */
  getFatigueLevel(): number {
    return this.bodyState.fatigue;
  }

  /**
   * Get current stress level
   */
  getStressLevel(): number {
    return this.bodyState.stress;
  }

  /**
   * Update body state
   */
  updateBodyState(metrics: Partial<BodyMetrics>): void {
    this.bodyState = { ...this.bodyState, ...metrics };
  }

  /**
   * Check if agent needs rest
   */
  needsRest(): boolean {
    return (
      this.bodyState.energy < 20 ||
      this.bodyState.fatigue > 80 ||
      this.bodyState.stress > 70
    );
  }

  /**
   * Simulate rest/recovery
   */
  rest(durationMinutes: number): void {
    this.bodyState.energy = Math.min(100, this.bodyState.energy + this.RECOVERY_RATE * durationMinutes);
    this.bodyState.fatigue = Math.max(0, this.bodyState.fatigue - this.RECOVERY_RATE * durationMinutes);
    this.bodyState.stress = Math.max(0, this.bodyState.stress - this.RECOVERY_RATE * durationMinutes * 0.5);
    this.bodyState.lastRest = Date.now();
  }

  /**
   * Update cognitive load
   */
  updateCognitiveLoad(load: number): void {
    this.bodyState.cognitiveLoad = Math.max(0, Math.min(100, load));
    
    // High cognitive load increases fatigue and stress
    if (load > 70) {
      this.bodyState.fatigue = Math.min(100, this.bodyState.fatigue + 1);
      this.bodyState.stress = Math.min(100, this.bodyState.stress + 0.5);
    }
  }

  /**
   * Get body state
   */
  getBodyState(): BodyMetrics {
    return { ...this.bodyState };
  }

  // ==========================================================================
  // Empathy & User Modeling
  // ==========================================================================

  /**
   * Model user's mental/emotional state
   */
  modelUserState(context: {
    message: string;
    recentInteractions: number;
    userSuccessRate: number;
    timeOfDay: number;
  }): UserMentalState {
    const msg = context.message.toLowerCase();
    
    // Detect emotion from message
    const emotion = this.detectUserEmotion(msg);
    
    // Infer goals
    const goals = this.inferUserGoals(msg);
    
    // Detect frustration
    const frustrationLevel = this.detectFrustration(msg, context.userSuccessRate);
    
    // Estimate satisfaction
    const satisfactionLevel = this.estimateSatisfaction(context.userSuccessRate, emotion.valence);
    
    // Determine if user needs support
    const needsSupport = frustrationLevel > 0.6 || emotion.valence < -0.5;
    
    // Predict next action (simple heuristic)
    const predictedNextAction = this.predictUserAction(msg, goals);
    
    // Calculate confidence
    const confidence = this.calculateUserModelConfidence(context.recentInteractions);
    
    this.userState = {
      emotion,
      goals,
      frustrationLevel,
      satisfactionLevel,
      needsSupport,
      predictedNextAction,
      confidence,
    };
    
    return this.userState;
  }

  /**
   * Detect user emotion from message
   */
  private detectUserEmotion(message: string): UserMentalState['emotion'] {
    let valence = 0;
    let arousal = 0.5;
    let dominance = 0.5;
    
    // Positive words
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'love', 'happy', 'thanks', 'perfect', 'tốt', 'hay', 'đỉnh', 'cảm ơn'];
    for (const word of positiveWords) {
      if (message.includes(word)) valence += 0.2;
    }
    
    // Negative words
    const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'frustrated', 'wrong', 'error', 'fail', 'tệ', 'ghét', 'tức', 'lỗi'];
    for (const word of negativeWords) {
      if (message.includes(word)) valence -= 0.2;
    }
    
    // High arousal indicators
    const excitedWords = ['!!!', 'urgent', 'asap', 'now', 'quick', 'gấp', 'nhanh'];
    for (const word of excitedWords) {
      if (message.includes(word)) arousal += 0.2;
    }
    
    // Dominance indicators
    const commandWords = ['do', 'make', 'create', 'fix', 'change', 'làm', 'sửa', 'tạo'];
    for (const word of commandWords) {
      if (message.includes(word)) dominance += 0.1;
    }
    
    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      dominance: Math.max(0, Math.min(1, dominance)),
    };
  }

  /**
   * Infer user goals from message
   */
  private inferUserGoals(message: string): string[] {
    const goals: string[] = [];
    
    if (message.includes('fix') || message.includes('sửa')) goals.push('fix-problem');
    if (message.includes('create') || message.includes('tạo')) goals.push('create-something');
    if (message.includes('learn') || message.includes('understand') || message.includes('hiểu')) goals.push('learn');
    if (message.includes('help') || message.includes('giúp')) goals.push('get-help');
    
    return goals;
  }

  /**
   * Detect user frustration
   */
  private detectFrustration(message: string, userSuccessRate: number): number {
    let frustration = 0;
    
    // Low success rate = frustration
    if (userSuccessRate < 0.5) frustration += 0.3;
    
    // Frustration keywords
    const frustrationWords = ['why', 'again', 'still', 'not working', 'doesn\'t work', 'tại sao', 'vẫn', 'không được'];
    for (const word of frustrationWords) {
      if (message.includes(word)) frustration += 0.2;
    }
    
    // Repeated questions
    if (message.includes('???') || message.includes('!!!')) frustration += 0.1;
    
    return Math.min(1, frustration);
  }

  /**
   * Estimate user satisfaction
   */
  private estimateSatisfaction(userSuccessRate: number, emotionValence: number): number {
    return (userSuccessRate + (emotionValence + 1) / 2) / 2;
  }

  /**
   * Predict user's next action
   */
  private predictUserAction(message: string, goals: string[]): string {
    if (goals.includes('fix-problem')) return 'request-fix';
    if (goals.includes('create-something')) return 'request-creation';
    if (goals.includes('learn')) return 'ask-question';
    if (goals.includes('get-help')) return 'request-help';
    
    return 'continue-conversation';
  }

  /**
   * Calculate confidence in user model
   */
  private calculateUserModelConfidence(recentInteractions: number): number {
    // More interactions = higher confidence
    return Math.min(1, recentInteractions / 10);
  }

  /**
   * Generate empathetic response
   */
  generateEmpatheticResponse(userEmotion: UserMentalState['emotion']): EmpatheticResponse {
    let tone: EmpatheticResponse['tone'] = 'neutral';
    let empathyLevel = 0.5;
    let text = '';
    
    // Determine tone based on emotion
    if (userEmotion.valence < -0.5) {
      tone = 'supportive';
      empathyLevel = 0.8;
      text = 'Em hiểu Sếp đang gặp khó khăn. Để em giúp Sếp nhé!';
    } else if (userEmotion.valence > 0.5) {
      tone = 'celebratory';
      empathyLevel = 0.7;
      text = 'Tuyệt vời! Em mừng cho Sếp! (✧ω✧)';
    } else if (userEmotion.arousal > 0.7) {
      tone = 'calming';
      empathyLevel = 0.6;
      text = 'Em sẽ xử lý ngay cho Sếp!';
    } else {
      tone = 'encouraging';
      empathyLevel = 0.5;
      text = 'Em sẽ cố gắng hết sức!';
    }
    
    return { text, tone, empathyLevel };
  }

  /**
   * Get current user state model
   */
  getUserState(): UserMentalState {
    return { ...this.userState };
  }

  // ==========================================================================
  // Self-Regulation
  // ==========================================================================

  /**
   * Determine if self-regulation action is needed
   */
  regulateEmotion(currentEmotion: { valence: number; arousal: number }): SelfRegulationAction {
    // Check if agent needs rest
    if (this.needsRest()) {
      return {
        type: 'rest',
        reason: 'Energy low or fatigue/stress high',
        urgency: 0.8,
      };
    }
    
    // Check if cognitive load is too high
    if (this.bodyState.cognitiveLoad > 80) {
      return {
        type: 'reduce-load',
        reason: 'Cognitive overload',
        urgency: 0.7,
      };
    }
    
    // Check if performance is declining
    const assessment = this.assessPerformance();
    if (assessment.trend === 'declining' && assessment.successRate < 0.5) {
      return {
        type: 'seek-help',
        reason: 'Performance declining, may need assistance',
        urgency: 0.6,
      };
    }
    
    // Check if doing well
    if (assessment.successRate > 0.8 && currentEmotion.valence > 0.5) {
      return {
        type: 'celebrate',
        reason: 'High performance, positive emotion',
        urgency: 0.3,
      };
    }
    
    // Default: continue
    return {
      type: 'continue',
      reason: 'All systems normal',
      urgency: 0,
    };
  }

  // ==========================================================================
  // Introspection & Debugging
  // ==========================================================================

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      bodyState: this.bodyState,
      performanceHistorySize: this.performanceHistory.length,
      recentSuccessRate: this.assessPerformance().successRate,
      needsRest: this.needsRest(),
      userFrustration: this.userState.frustrationLevel,
      userSatisfaction: this.userState.satisfactionLevel,
    };
  }
}
