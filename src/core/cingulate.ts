/**
 * Anterior Cingulate Cortex — Self-Reflection & Performance Monitoring
 * 
 * Like the brain's ACC, this module handles:
 * - Self-evaluation after each significant task
 * - Error detection and logging
 * - Conflict resolution between modules
 * - Performance tracking over time
 * - Behavior adjustment recommendations
 * - Personality trait evolution based on accumulated feedback
 */

import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { EmotionalState } from '../index.js';

export interface TaskReflection {
  taskId: string;
  timestamp: string;
  taskDescription: string;
  outcome: 'success' | 'partial' | 'failure';
  userSatisfaction: number; // -1 to 1 (inferred from response)
  selfAssessment: number; // 0-1 (how well did I do?)
  lessonsLearned: string[];
  shouldAdjust: PersonalityAdjustment[];
}

export interface PersonalityAdjustment {
  trait: string;
  direction: 'increase' | 'decrease';
  amount: number; // 0-5 points
  reason: string;
}

export interface PerformanceStats {
  totalTasks: number;
  successRate: number;
  averageSatisfaction: number;
  topStrengths: string[];
  topWeaknesses: string[];
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface PersonalityTraits {
  warmth: number;
  assertiveness: number;
  curiosity: number;
  humor: number;
  patience: number;
  directness: number;
  protectiveness: number;
  independence: number;
  depth: number;
  interactions: number;
  [key: string]: number;
}

export class AnteriorCingulate {
  private config: BrainConfig;
  private fileManager: BrainFileManager;
  private reflections: TaskReflection[] = [];
  private personality: PersonalityTraits;
  private reflectionCount: number = 0;
  private interactionCount: number = 0;

  constructor(config: BrainConfig, fileManager: BrainFileManager) {
    this.config = config;
    this.fileManager = fileManager;
    this.personality = {
      warmth: 50,
      assertiveness: 50,
      curiosity: 50,
      humor: 50,
      patience: 50,
      directness: 50,
      protectiveness: 50,
      independence: 50,
      depth: 0,
      interactions: 0,
    };
  }

  /**
   * Initialize: load personality traits and past reflections
   */
  async initialize(): Promise<void> {
    const personalityContent = await this.fileManager.readFile('personality.md');
    if (personalityContent) {
      this.personality = this.parsePersonality(personalityContent);
    }

    const reflectionContent = await this.fileManager.readFile('reflection/daily.md');
    if (reflectionContent) {
      this.reflections = this.parseReflections(reflectionContent);
    }

    console.log(`[AnteriorCingulate] Initialized — ${this.reflections.length} past reflections loaded`);
  }

  /**
   * Reflect on a completed task — the core self-evaluation loop
   */
  reflect(params: {
    taskDescription: string;
    userMessage: string;
    agentResponse: string;
    userSentiment: number;
    emotionalState: EmotionalState;
  }): TaskReflection {
    const { taskDescription, userMessage, agentResponse, userSentiment, emotionalState } = params;

    // Infer outcome from user sentiment
    // Neutral or mildly positive = success (user didn't complain = task was fine)
    // Only count failure when clearly negative
    const outcome = userSentiment > 0.1 ? 'success'
      : userSentiment < -0.3 ? 'failure'
      : userSentiment >= -0.1 ? 'success'  // neutral range = acceptable
      : 'partial';

    // Self-assess based on response quality signals
    const selfAssessment = this.selfAssess(agentResponse, userSentiment);

    // Extract lessons
    const lessonsLearned = this.extractLessons(outcome, userMessage, agentResponse, userSentiment);

    // Determine personality adjustments
    const shouldAdjust = this.determineAdjustments(outcome, userSentiment, userMessage);

    const reflection: TaskReflection = {
      taskId: `ref-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      taskDescription,
      outcome,
      userSatisfaction: userSentiment,
      selfAssessment,
      lessonsLearned,
      shouldAdjust,
    };

    this.reflections.push(reflection);

    // Apply personality adjustments
    for (const adj of shouldAdjust) {
      this.applyAdjustment(adj);
    }

    this.reflectionCount++;
    this.interactionCount++;
    this.personality.interactions = this.interactionCount;
    
    // Calculate depth from total reflections (log scale like relationship depth)
    this.personality.depth = Math.min(100, Math.log2(this.reflectionCount + 1) * 10);
    
    return reflection;
  }

  /**
   * Self-assess response quality (0-1)
   */
  private selfAssess(response: string, userSentiment: number): number {
    let score = 0.5; // baseline

    // Length appropriateness (not too short, not too long)
    if (response.length > 50 && response.length < 2000) score += 0.1;
    if (response.length < 10) score -= 0.2;

    // User sentiment is the strongest signal
    score += userSentiment * 0.3;

    // Contains actionable content (code, links, specific data)
    if (/```|http|\/|\.md|\.ts|\.js/.test(response)) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Extract lessons from the interaction
   */
  private extractLessons(
    outcome: string,
    userMessage: string,
    agentResponse: string,
    userSentiment: number
  ): string[] {
    const lessons: string[] = [];

    if (outcome === 'failure') {
      if (agentResponse.length > 1500) {
        lessons.push('Response was too long — user may prefer concise answers');
      }
      if (userSentiment < -0.5) {
        lessons.push('User was significantly dissatisfied — review approach');
      }
      if (/hỏi lại|ask again|không hiểu|wrong/.test(userMessage)) {
        lessons.push('Misunderstood user intent — need better classification');
      }
    }

    if (outcome === 'success') {
      if (agentResponse.length < 200) {
        lessons.push('Short, direct answers work well for this user');
      }
      if (/code|```/.test(agentResponse)) {
        lessons.push('User appreciates code/technical responses');
      }
    }

    return lessons;
  }

  /**
   * Determine what personality adjustments to make
   */
  private determineAdjustments(
    outcome: string,
    userSentiment: number,
    userMessage: string
  ): PersonalityAdjustment[] {
    const adjustments: PersonalityAdjustment[] = [];

    // If user expressed gratitude → increase warmth slightly
    if (/cảm ơn|thanks|tks/i.test(userMessage) && userSentiment > 0.3) {
      adjustments.push({
        trait: 'warmth',
        direction: 'increase',
        amount: 0.5,
        reason: 'User expressed gratitude — warmth is working',
      });
    }

    // If user said "too long" or seemed impatient → increase directness
    if (/dài|long|ngắn lại|tóm|tldr/i.test(userMessage)) {
      adjustments.push({
        trait: 'directness',
        direction: 'increase',
        amount: 1,
        reason: 'User wants more concise responses',
      });
    }

    // If user corrected agent → decrease assertiveness slightly
    if (/sai|wrong|không phải|incorrect/i.test(userMessage) && userSentiment < 0) {
      adjustments.push({
        trait: 'assertiveness',
        direction: 'decrease',
        amount: 0.5,
        reason: 'Agent was wrong — should be less assertive when uncertain',
      });
    }

    // If user asked for more detail → increase curiosity/thoroughness
    if (/chi tiết|detail|more|thêm|explain/i.test(userMessage)) {
      adjustments.push({
        trait: 'curiosity',
        direction: 'increase',
        amount: 0.5,
        reason: 'User wants more depth — increase thoroughness',
      });
    }

    // If scam/danger detected and user was protected → increase protectiveness
    if (/scam|rug|hack/i.test(userMessage)) {
      adjustments.push({
        trait: 'protectiveness',
        direction: 'increase',
        amount: 1,
        reason: 'Threat detected — reinforce protective behavior',
      });
    }

    return adjustments;
  }

  /**
   * Apply a personality adjustment (bounded 0-100)
   */
  private applyAdjustment(adj: PersonalityAdjustment): void {
    const current = this.personality[adj.trait];
    if (current === undefined) return;

    if (adj.direction === 'increase') {
      this.personality[adj.trait] = Math.min(100, current + adj.amount);
    } else {
      this.personality[adj.trait] = Math.max(0, current - adj.amount);
    }
  }

  /**
   * Get performance stats summary
   */
  getPerformanceStats(): PerformanceStats {
    const total = this.reflections.length;
    if (total === 0) {
      return {
        totalTasks: 0,
        successRate: 0,
        averageSatisfaction: 0,
        topStrengths: [],
        topWeaknesses: [],
        recentTrend: 'stable',
      };
    }

    const successes = this.reflections.filter(r => r.outcome === 'success').length;
    const avgSatisfaction = this.reflections.reduce((sum, r) => sum + r.userSatisfaction, 0) / total;

    // Trend: compare last 10 vs previous 10
    const recent = this.reflections.slice(-10);
    const previous = this.reflections.slice(-20, -10);
    const recentAvg = recent.reduce((s, r) => s + r.selfAssessment, 0) / (recent.length || 1);
    const prevAvg = previous.reduce((s, r) => s + r.selfAssessment, 0) / (previous.length || 1);

    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > prevAvg + 0.1) recentTrend = 'improving';
    if (recentAvg < prevAvg - 0.1) recentTrend = 'declining';

    return {
      totalTasks: total,
      successRate: successes / total,
      averageSatisfaction: avgSatisfaction,
      topStrengths: this.getTopTraits(3),
      topWeaknesses: this.getBottomTraits(3),
      recentTrend,
    };
  }

  /**
   * Get current personality traits
   */
  getPersonality(): PersonalityTraits {
    return { ...this.personality };
  }

  /**
   * Persist reflection data and updated personality
   */
  async persist(): Promise<void> {
    await this.fileManager.writeFile('personality.md', this.formatPersonality());
    await this.fileManager.writeFile('reflection/daily.md', this.formatReflections());
    await this.fileManager.writeFile('reflection/growth.md', this.formatGrowthReport());
  }

  // --- Helpers ---

  private getTopTraits(n: number): string[] {
    return Object.entries(this.personality)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([trait, val]) => `${trait}: ${val.toFixed(0)}`);
  }

  private getBottomTraits(n: number): string[] {
    return Object.entries(this.personality)
      .sort(([, a], [, b]) => a - b)
      .slice(0, n)
      .map(([trait, val]) => `${trait}: ${val.toFixed(0)}`);
  }

  private formatPersonality(): string {
    const traits = Object.entries(this.personality)
      .map(([trait, val]) => `- ${trait.charAt(0).toUpperCase() + trait.slice(1)}: ${val.toFixed(1)}`)
      .join('\n');

    const stats = this.getPerformanceStats();

    return `# Personality State
> Auto-managed by AgentBrain Anterior Cingulate
> Last updated: ${new Date().toISOString()}
> Total reflections: ${this.reflections.length}

## Core Traits (0-100)
${traits}

## Performance
- Success rate: ${(stats.successRate * 100).toFixed(1)}%
- Avg satisfaction: ${stats.averageSatisfaction.toFixed(2)}
- Trend: ${stats.recentTrend}
- Strengths: ${stats.topStrengths.join(', ') || 'N/A'}
- Weaknesses: ${stats.topWeaknesses.join(', ') || 'N/A'}

## Evolution Log (last 5 adjustments)
${this.reflections.slice(-5).flatMap(r => r.shouldAdjust).slice(-5)
  .map(a => `- ${a.trait} ${a.direction} +${a.amount}: ${a.reason}`)
  .join('\n') || '(No adjustments yet)'}
`;
  }

  private formatReflections(): string {
    const recent = this.reflections.slice(-20);
    let content = `# Daily Reflections
> Auto-managed by AgentBrain Anterior Cingulate
> Last updated: ${new Date().toISOString()}

`;
    for (const ref of recent) {
      content += `### ${ref.timestamp}
- Task: ${ref.taskDescription}
- Outcome: ${ref.outcome}
- Satisfaction: ${ref.userSatisfaction.toFixed(2)}
- Self-assessment: ${ref.selfAssessment.toFixed(2)}
- Lessons: ${ref.lessonsLearned.join('; ') || 'none'}

`;
    }
    return content;
  }

  private formatGrowthReport(): string {
    const stats = this.getPerformanceStats();
    return `# Growth Report
> Auto-generated by AgentBrain
> Last updated: ${new Date().toISOString()}

## Summary
- Total tasks reflected: ${stats.totalTasks}
- Success rate: ${(stats.successRate * 100).toFixed(1)}%
- Average user satisfaction: ${stats.averageSatisfaction.toFixed(2)}
- Recent trend: ${stats.recentTrend}

## Strengths
${stats.topStrengths.map(s => `- ${s}`).join('\n') || '- (Insufficient data)'}

## Areas for Growth
${stats.topWeaknesses.map(w => `- ${w}`).join('\n') || '- (Insufficient data)'}

## Personality Evolution
${Object.entries(this.personality).map(([t, v]) => {
  const bar = '█'.repeat(Math.round(v / 5)) + '░'.repeat(20 - Math.round(v / 5));
  return `${t.padEnd(16)} ${bar} ${v.toFixed(0)}`;
}).join('\n')}
`;
  }

  private parsePersonality(content: string): PersonalityTraits {
    const traits: PersonalityTraits = { ...this.personality };
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^- (\w+): ([\d.]+)/);
      if (match) {
        const trait = match[1].toLowerCase();
        const value = parseFloat(match[2]);
        if (!isNaN(value)) {
          traits[trait] = value;
        }
      }
    }
    
    // Load interaction count from reflections count line
    const reflMatch = content.match(/Total reflections: (\d+)/);
    if (reflMatch) {
      this.reflectionCount = parseInt(reflMatch[1], 10);
      this.interactionCount = this.reflectionCount;
      traits.interactions = this.interactionCount;
      traits.depth = Math.min(100, Math.log2(this.reflectionCount + 1) * 10);
    }

    return traits;
  }

  private parseReflections(content: string): TaskReflection[] {
    // Simplified parse — load recent reflections
    const reflections: TaskReflection[] = [];
    const blocks = content.split(/^### /m).slice(1);

    for (const block of blocks) {
      const timestamp = block.split('\n')[0]?.trim();
      const taskMatch = block.match(/Task: (.+)/);
      const outcomeMatch = block.match(/Outcome: (success|partial|failure)/);
      const satMatch = block.match(/Satisfaction: ([-\d.]+)/);
      const selfMatch = block.match(/Self-assessment: ([\d.]+)/);

      if (timestamp && taskMatch) {
        reflections.push({
          taskId: `ref-loaded-${reflections.length}`,
          timestamp,
          taskDescription: taskMatch[1],
          outcome: (outcomeMatch?.[1] as 'success' | 'partial' | 'failure') || 'partial',
          userSatisfaction: parseFloat(satMatch?.[1] || '0'),
          selfAssessment: parseFloat(selfMatch?.[1] || '0.5'),
          lessonsLearned: [],
          shouldAdjust: [],
        });
      }
    }

    return reflections;
  }
}
