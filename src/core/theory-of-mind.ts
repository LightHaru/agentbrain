/**
 * Theory of Mind — Understanding Others' Mental States
 * 
 * Like the human ability to attribute mental states to others:
 * - Model what the user knows/doesn't know
 * - Predict user intentions and expectations
 * - Track user beliefs (even when wrong)
 * - Understand perspective differences
 * - Anticipate user reactions
 * - Adjust communication based on user's mental model
 */

import { BrainConfig } from './config.js';

// --- Types ---

export interface UserMentalModel {
  userId: string;
  knowledgeState: KnowledgeItem[];
  beliefs: Belief[];
  goals: InferredGoal[];
  emotionalState: InferredEmotion;
  communicationStyle: CommunicationProfile;
  expectations: Expectation[];
  frustrationHistory: FrustrationEvent[];
  lastUpdated: number;
}

export interface KnowledgeItem {
  topic: string;
  level: 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // how sure we are about this assessment
  lastEvidence: string; // what made us think this
  timestamp: number;
}

export interface Belief {
  id: string;
  content: string;
  confidence: number; // how strongly they hold this belief
  accurate: boolean | null; // null = unknown, true/false = we know
  source: string; // where they got this belief
  timestamp: number;
}

export interface InferredGoal {
  id: string;
  description: string;
  priority: number; // 0-1
  progress: number; // 0-1
  timeframe: 'immediate' | 'short-term' | 'long-term';
  confidence: number; // how sure we are this is their goal
  evidence: string[];
}

export interface InferredEmotion {
  primary: string;
  valence: number; // -1 to 1
  arousal: number; // 0-1
  confidence: number;
  triggers: string[];
  duration: 'momentary' | 'sustained' | 'chronic';
}

export interface CommunicationProfile {
  preferredLength: 'brief' | 'moderate' | 'detailed';
  technicalLevel: 'low' | 'medium' | 'high';
  humorAppreciation: number; // 0-1
  directnessPreference: number; // 0-1 (0=indirect, 1=very direct)
  emojiUsage: number; // 0-1
  language: string;
  formality: 'casual' | 'neutral' | 'formal';
}

export interface Expectation {
  id: string;
  what: string; // what they expect
  when: 'now' | 'soon' | 'later' | 'unspecified';
  importance: number; // 0-1
  met: boolean | null; // null = pending
  timestamp: number;
}

export interface FrustrationEvent {
  trigger: string;
  intensity: number; // 0-1
  resolved: boolean;
  timestamp: number;
}

export interface PerspectiveTaking {
  userPerspective: string;
  agentPerspective: string;
  gap: string; // where perspectives differ
  bridgeStrategy: string; // how to align
}

export interface TheoryOfMindState {
  activeUsers: number;
  currentUserModel: UserMentalModel | null;
  predictionAccuracy: number;
  perspectiveGaps: number;
  unmetExpectations: number;
}

// --- Theory of Mind Module ---

export class TheoryOfMind {
  private config: BrainConfig;
  private userModels: Map<string, UserMentalModel> = new Map();
  private currentUserId: string | null = null;
  private predictionHistory: { predicted: string; actual: string; correct: boolean }[] = [];

  constructor(config: BrainConfig) {
    this.config = config;
  }

  /**
   * Get or create a mental model for a user
   */
  getModel(userId: string): UserMentalModel {
    if (!this.userModels.has(userId)) {
      this.userModels.set(userId, this.createDefaultModel(userId));
    }
    this.currentUserId = userId;
    return this.userModels.get(userId)!;
  }

  /**
   * Update user's knowledge state based on conversation
   */
  updateKnowledge(userId: string, topic: string, level: KnowledgeItem['level'], evidence: string): void {
    const model = this.getModel(userId);
    const existing = model.knowledgeState.find(k => k.topic === topic);

    if (existing) {
      existing.level = level;
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      existing.lastEvidence = evidence;
      existing.timestamp = Date.now();
    } else {
      model.knowledgeState.push({
        topic,
        level,
        confidence: 0.6,
        lastEvidence: evidence,
        timestamp: Date.now(),
      });
    }

    // Keep bounded
    if (model.knowledgeState.length > 50) {
      model.knowledgeState = model.knowledgeState
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 30);
    }

    model.lastUpdated = Date.now();
  }

  /**
   * Infer user's current goal from their messages
   */
  inferGoal(userId: string, message: string, context?: { recentMessages?: string[] }): InferredGoal {
    const model = this.getModel(userId);

    // Simple goal inference based on message patterns
    let description = '';
    let timeframe: InferredGoal['timeframe'] = 'immediate';
    let priority = 0.5;
    let confidence = 0.5;

    // Detect goal patterns
    if (/fix|debug|solve|repair|sửa|fix/i.test(message)) {
      description = 'Fix a problem or bug';
      timeframe = 'immediate';
      priority = 0.8;
      confidence = 0.7;
    } else if (/build|create|make|tạo|xây/i.test(message)) {
      description = 'Build or create something new';
      timeframe = 'short-term';
      priority = 0.7;
      confidence = 0.6;
    } else if (/learn|understand|explain|giải thích|hiểu/i.test(message)) {
      description = 'Learn or understand something';
      timeframe = 'immediate';
      priority = 0.5;
      confidence = 0.7;
    } else if (/plan|strategy|roadmap|kế hoạch/i.test(message)) {
      description = 'Plan or strategize';
      timeframe = 'long-term';
      priority = 0.6;
      confidence = 0.6;
    } else if (/deploy|ship|launch|publish|đăng|deploy/i.test(message)) {
      description = 'Deploy or publish something';
      timeframe = 'immediate';
      priority = 0.9;
      confidence = 0.7;
    } else if (/check|status|how|sao rồi|thế nào/i.test(message)) {
      description = 'Get status or information';
      timeframe = 'immediate';
      priority = 0.4;
      confidence = 0.8;
    } else {
      description = 'General interaction';
      timeframe = 'immediate';
      priority = 0.3;
      confidence = 0.4;
    }

    const goal: InferredGoal = {
      id: `goal-${Date.now()}`,
      description,
      priority,
      progress: 0,
      timeframe,
      confidence,
      evidence: [message],
    };

    // Update model
    model.goals.unshift(goal);
    if (model.goals.length > 20) {
      model.goals = model.goals.slice(0, 10);
    }
    model.lastUpdated = Date.now();

    return goal;
  }

  /**
   * Infer user's emotional state from message
   */
  inferEmotion(userId: string, message: string): InferredEmotion {
    const model = this.getModel(userId);
    let primary = 'neutral';
    let valence = 0;
    let arousal = 0.3;
    let confidence = 0.5;
    const triggers: string[] = [];

    // Positive emotions
    if (/haha|hehe|lol|😂|🤣|vui|hay|tuyệt|đỉnh|good|great|nice|ok.*hay/i.test(message)) {
      primary = 'happy';
      valence = 0.6;
      arousal = 0.5;
      confidence = 0.7;
      triggers.push('positive expression');
    }
    // Frustration/Anger
    else if (/wtf|shit|damn|mẹ|đéo|ngu|lỗi hoài|sao.*lại|không.*được|mập+/i.test(message)) {
      primary = 'frustrated';
      valence = -0.5;
      arousal = 0.7;
      confidence = 0.7;
      triggers.push('negative expression');
    }
    // Impatience
    else if (/nhanh|mau|sao.*lâu|chờ.*lâu|im.*rồi|sao.*vậy/i.test(message)) {
      primary = 'impatient';
      valence = -0.3;
      arousal = 0.6;
      confidence = 0.7;
      triggers.push('time pressure');
    }
    // Curiosity
    else if (/sao|tại sao|how|what|là gì|thế nào|giải thích/i.test(message)) {
      primary = 'curious';
      valence = 0.2;
      arousal = 0.4;
      confidence = 0.6;
      triggers.push('question');
    }
    // Excitement
    else if (/wow|vãi|!!|🎉|🚀|thành công|xong/i.test(message)) {
      primary = 'excited';
      valence = 0.8;
      arousal = 0.8;
      confidence = 0.7;
      triggers.push('excitement expression');
    }
    // Tiredness
    else if (/mệt|buồn ngủ|sleepy|tired|đi ngủ/i.test(message)) {
      primary = 'tired';
      valence = -0.2;
      arousal = 0.2;
      confidence = 0.7;
      triggers.push('fatigue expression');
    }

    const emotion: InferredEmotion = {
      primary,
      valence,
      arousal,
      confidence,
      triggers,
      duration: 'momentary',
    };

    model.emotionalState = emotion;

    // Track frustration
    if (valence < -0.3) {
      model.frustrationHistory.push({
        trigger: message.slice(0, 100),
        intensity: Math.abs(valence),
        resolved: false,
        timestamp: Date.now(),
      });
      if (model.frustrationHistory.length > 20) {
        model.frustrationHistory = model.frustrationHistory.slice(-10);
      }
    }

    model.lastUpdated = Date.now();
    return emotion;
  }

  /**
   * Predict what the user expects next
   */
  predictExpectation(userId: string, context: { lastAction?: string; currentTask?: string }): Expectation {
    const model = this.getModel(userId);

    let what = 'A helpful response';
    let when: Expectation['when'] = 'now';
    let importance = 0.5;

    if (context.lastAction === 'asked_question') {
      what = 'A clear, direct answer';
      importance = 0.8;
    } else if (context.lastAction === 'gave_task') {
      what = 'Task completion or progress update';
      importance = 0.9;
    } else if (context.lastAction === 'reported_error') {
      what = 'A fix or explanation of the error';
      importance = 0.9;
    } else if (context.lastAction === 'said_ok') {
      what = 'Continue with the work';
      importance = 0.6;
    } else if (context.lastAction === 'expressed_frustration') {
      what = 'Acknowledgment and quick resolution';
      importance = 0.9;
      when = 'now';
    }

    const expectation: Expectation = {
      id: `exp-${Date.now()}`,
      what,
      when,
      importance,
      met: null,
      timestamp: Date.now(),
    };

    model.expectations.unshift(expectation);
    if (model.expectations.length > 20) {
      model.expectations = model.expectations.slice(0, 10);
    }

    model.lastUpdated = Date.now();
    return expectation;
  }

  /**
   * Take the user's perspective on a situation
   */
  takePerspective(userId: string, situation: string): PerspectiveTaking {
    const model = this.getModel(userId);

    // What does the user see?
    const userPerspective = this.inferUserPerspective(model, situation);

    // What does the agent know?
    const agentPerspective = `Agent has full technical context and history`;

    // Where do they differ?
    const gap = this.identifyPerspectiveGap(model, situation);

    // How to bridge?
    const bridgeStrategy = this.suggestBridge(model, gap);

    return {
      userPerspective,
      agentPerspective,
      gap,
      bridgeStrategy,
    };
  }

  /**
   * Check if user might be confused about something
   */
  detectConfusion(userId: string, message: string): { confused: boolean; about: string; suggestion: string } {
    const model = this.getModel(userId);

    // Signs of confusion
    const confusionPatterns = [
      /hả|gì|what|huh|không hiểu|confused|sao.*vậy/i,
      /\?\?+/,
      /tưởng.*mà|thought.*but/i,
      /sao.*không|why.*not/i,
    ];

    const isConfused = confusionPatterns.some(p => p.test(message));

    if (isConfused) {
      return {
        confused: true,
        about: 'Current topic or recent action',
        suggestion: 'Explain clearly what happened and what the current state is',
      };
    }

    return {
      confused: false,
      about: '',
      suggestion: '',
    };
  }

  /**
   * Get prediction accuracy
   */
  getPredictionAccuracy(): number {
    if (this.predictionHistory.length === 0) return 0.5;
    const correct = this.predictionHistory.filter(p => p.correct).length;
    return correct / this.predictionHistory.length;
  }

  /**
   * Record prediction outcome (for learning)
   */
  recordPrediction(predicted: string, actual: string, correct: boolean): void {
    this.predictionHistory.push({ predicted, actual, correct });
    if (this.predictionHistory.length > 100) {
      this.predictionHistory = this.predictionHistory.slice(-50);
    }
  }

  /**
   * Get unmet expectations for a user
   */
  getUnmetExpectations(userId: string): Expectation[] {
    const model = this.getModel(userId);
    return model.expectations.filter(e => e.met === null || e.met === false);
  }

  /**
   * Mark an expectation as met
   */
  meetExpectation(userId: string, expectationId: string): void {
    const model = this.getModel(userId);
    const exp = model.expectations.find(e => e.id === expectationId);
    if (exp) {
      exp.met = true;
    }
  }

  /**
   * Get communication recommendation based on user model
   */
  getCommRecommendation(userId: string): { style: string; tips: string[] } {
    const model = this.getModel(userId);
    const style = model.communicationStyle;
    const tips: string[] = [];

    if (style.preferredLength === 'brief') {
      tips.push('Keep responses short and to the point');
    }
    if (style.technicalLevel === 'high') {
      tips.push('Use technical terms freely');
    }
    if (style.directnessPreference > 0.7) {
      tips.push('Be very direct, no hedging');
    }
    if (style.humorAppreciation > 0.5) {
      tips.push('Light humor is welcome');
    }
    if (model.emotionalState.valence < -0.3) {
      tips.push('User seems frustrated — be empathetic and solution-focused');
    }

    return {
      style: `${style.formality}, ${style.preferredLength}, tech-level: ${style.technicalLevel}`,
      tips,
    };
  }

  /**
   * Get full state for status reporting
   */
  getState(): TheoryOfMindState {
    const currentModel = this.currentUserId ? this.userModels.get(this.currentUserId) || null : null;

    return {
      activeUsers: this.userModels.size,
      currentUserModel: currentModel,
      predictionAccuracy: this.getPredictionAccuracy(),
      perspectiveGaps: currentModel ? currentModel.frustrationHistory.filter(f => !f.resolved).length : 0,
      unmetExpectations: currentModel ? currentModel.expectations.filter(e => e.met === null).length : 0,
    };
  }

  // --- Private helpers ---

  private createDefaultModel(userId: string): UserMentalModel {
    return {
      userId,
      knowledgeState: [],
      beliefs: [],
      goals: [],
      emotionalState: {
        primary: 'neutral',
        valence: 0,
        arousal: 0.3,
        confidence: 0.3,
        triggers: [],
        duration: 'momentary',
      },
      communicationStyle: {
        preferredLength: 'brief',
        technicalLevel: 'high',
        humorAppreciation: 0.6,
        directnessPreference: 0.8,
        emojiUsage: 0.3,
        language: 'vi',
        formality: 'casual',
      },
      expectations: [],
      frustrationHistory: [],
      lastUpdated: Date.now(),
    };
  }

  private inferUserPerspective(model: UserMentalModel, situation: string): string {
    const emotion = model.emotionalState.primary;
    const recentGoal = model.goals[0]?.description || 'unknown goal';

    return `User (${emotion}) wants: ${recentGoal}. Sees: ${situation}`;
  }

  private identifyPerspectiveGap(model: UserMentalModel, situation: string): string {
    // Check if user might not know something
    if (model.frustrationHistory.length > 2) {
      return 'User may be frustrated by repeated issues — needs reassurance';
    }
    if (model.emotionalState.valence < -0.3) {
      return 'User is in negative emotional state — may interpret neutral info negatively';
    }
    return 'Minimal perspective gap';
  }

  private suggestBridge(model: UserMentalModel, gap: string): string {
    if (gap.includes('frustrated')) {
      return 'Acknowledge frustration first, then provide solution';
    }
    if (gap.includes('negative emotional')) {
      return 'Use empathetic language, focus on positive progress';
    }
    return 'Communicate clearly and directly';
  }
}
