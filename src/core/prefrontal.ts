/**
 * Prefrontal Cortex — Executive Planning & Decision Making
 * 
 * Like the brain's prefrontal cortex, this module handles:
 * - Task decomposition (break complex tasks into sub-tasks)
 * - Priority ranking based on user history + success rates
 * - Working memory (keep relevant short-term context)
 * - Impulse control (don't jump tasks before completing current)
 * - Decision logging (track reasoning for transparency)
 */

import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { MessageClassification } from '../index.js';

export interface TaskPlan {
  id: string;
  timestamp: string;
  description: string;
  priority: number; // 1-10
  subTasks: SubTask[];
  status: 'planning' | 'in_progress' | 'completed' | 'abandoned';
  estimatedComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'epic';
}

export interface SubTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
  order: number;
}

export interface Decision {
  timestamp: string;
  context: string;
  decision: string;
  reasoning: string;
  confidence: number; // 0-1
}

export interface WorkingMemoryItem {
  content: string;
  relevance: number; // 0-1
  addedAt: string;
  source: string;
}

export class PrefrontalCortex {
  private config: BrainConfig;
  private fileManager: BrainFileManager;
  private currentPlan: TaskPlan | null = null;
  private workingMemory: WorkingMemoryItem[] = [];
  private decisions: Decision[] = [];
  private taskHistory: TaskPlan[] = [];

  constructor(config: BrainConfig, fileManager: BrainFileManager) {
    this.config = config;
    this.fileManager = fileManager;
  }

  /**
   * Initialize: load current plan and decision history
   */
  async initialize(): Promise<void> {
    const planContent = await this.fileManager.readFile('executive/current_plan.md');
    if (planContent) {
      this.currentPlan = this.parsePlan(planContent);
    }

    const decisionsContent = await this.fileManager.readFile('executive/decisions_log.md');
    if (decisionsContent) {
      this.decisions = this.parseDecisions(decisionsContent);
    }

    console.log(`[PrefrontalCortex] Initialized — ${this.decisions.length} past decisions loaded`);
  }

  /**
   * Plan a response strategy based on message classification
   */
  plan(classification: MessageClassification, message: string): TaskPlan {
    const complexity = this.estimateComplexity(classification, message);
    const priority = this.calculatePriority(classification);

    const plan: TaskPlan = {
      id: `plan-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      description: message.slice(0, 100),
      priority,
      subTasks: this.decompose(classification, message, complexity),
      status: 'in_progress',
      estimatedComplexity: complexity,
    };

    // Impulse control: if there's an active plan, check if we should switch
    if (this.currentPlan && this.currentPlan.status === 'in_progress') {
      if (priority > this.currentPlan.priority + 2) {
        // New task is significantly more urgent — switch
        this.currentPlan.status = 'abandoned';
        this.taskHistory.push(this.currentPlan);
      } else {
        // Queue it, don't switch
        this.taskHistory.push(plan);
        return this.currentPlan;
      }
    }

    this.currentPlan = plan;
    return plan;
  }

  /**
   * Estimate task complexity
   */
  private estimateComplexity(
    classification: MessageClassification,
    message: string
  ): 'trivial' | 'simple' | 'moderate' | 'complex' | 'epic' {
    const wordCount = message.split(/\s+/).length;

    if (!classification.requiresAction) return 'trivial';
    if (wordCount < 10 && classification.urgency === 'low') return 'simple';
    if (/và|and|rồi|then|sau đó|next|also|thêm/.test(message)) return 'moderate';
    if (/project|system|architecture|toàn bộ|refactor|migrate/.test(message)) return 'complex';
    if (/build.*from scratch|redesign|rewrite|toàn diện/.test(message)) return 'epic';

    return 'simple';
  }

  /**
   * Calculate priority (1-10)
   */
  private calculatePriority(classification: MessageClassification): number {
    let priority = 5; // baseline

    // Urgency boost
    switch (classification.urgency) {
      case 'critical': priority += 4; break;
      case 'high': priority += 2; break;
      case 'medium': priority += 1; break;
    }

    // Action requests get slight boost
    if (classification.requiresAction) priority += 1;

    return Math.min(10, priority);
  }

  /**
   * Decompose task into sub-tasks
   */
  private decompose(
    classification: MessageClassification,
    message: string,
    complexity: string
  ): SubTask[] {
    if (complexity === 'trivial' || complexity === 'simple') {
      return [{
        id: 'st-1',
        description: 'Execute directly',
        status: 'pending',
        order: 1,
      }];
    }

    // For moderate+ tasks, create logical sub-tasks
    const subTasks: SubTask[] = [];
    let order = 1;

    // Research/understand phase
    if (classification.intent === 'action_request' || classification.intent === 'research') {
      subTasks.push({
        id: `st-${order}`,
        description: 'Understand requirements and gather context',
        status: 'pending',
        order: order++,
      });
    }

    // Plan phase for complex tasks
    if (complexity === 'complex' || complexity === 'epic') {
      subTasks.push({
        id: `st-${order}`,
        description: 'Design approach and identify risks',
        status: 'pending',
        order: order++,
      });
    }

    // Execute phase
    subTasks.push({
      id: `st-${order}`,
      description: 'Execute primary task',
      status: 'pending',
      order: order++,
    });

    // Verify phase
    if (classification.requiresAction) {
      subTasks.push({
        id: `st-${order}`,
        description: 'Verify result and report',
        status: 'pending',
        order: order++,
      });
    }

    return subTasks;
  }

  /**
   * Log a decision for transparency
   */
  logDecision(context: string, decision: string, reasoning: string, confidence: number): void {
    this.decisions.push({
      timestamp: new Date().toISOString(),
      context,
      decision,
      reasoning,
      confidence,
    });

    // Keep last 100 decisions
    if (this.decisions.length > 100) {
      this.decisions = this.decisions.slice(-100);
    }
  }

  /**
   * Update working memory with relevant context
   */
  updateWorkingMemory(content: string, source: string, relevance: number): void {
    this.workingMemory.push({
      content,
      relevance,
      addedAt: new Date().toISOString(),
      source,
    });

    // Keep only top 5 most relevant items
    this.workingMemory.sort((a, b) => b.relevance - a.relevance);
    this.workingMemory = this.workingMemory.slice(0, 5);
  }

  /**
   * Get working memory items
   */
  getWorkingMemory(): WorkingMemoryItem[] {
    return [...this.workingMemory];
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): TaskPlan | null {
    return this.currentPlan;
  }

  /**
   * Mark current plan as completed
   */
  completePlan(): void {
    if (this.currentPlan) {
      this.currentPlan.status = 'completed';
      this.taskHistory.push(this.currentPlan);
      this.currentPlan = null;
    }
  }

  /**
   * Persist executive state
   */
  async persist(): Promise<void> {
    if (this.currentPlan) {
      await this.fileManager.writeFile('executive/current_plan.md', this.formatPlan(this.currentPlan));
    }
    await this.fileManager.writeFile('executive/decisions_log.md', this.formatDecisions());
    await this.fileManager.writeFile('executive/priorities.md', this.formatPriorities());
  }

  // --- Formatting ---

  private formatPlan(plan: TaskPlan): string {
    let content = `# Current Plan
> Auto-managed by AgentBrain Prefrontal Cortex
> Last updated: ${new Date().toISOString()}

## ${plan.description}
- ID: ${plan.id}
- Priority: ${plan.priority}/10
- Complexity: ${plan.estimatedComplexity}
- Status: ${plan.status}

### Sub-tasks
`;
    for (const st of plan.subTasks) {
      const icon = st.status === 'done' ? '✓' : st.status === 'in_progress' ? '→' : '○';
      content += `${icon} ${st.order}. ${st.description} [${st.status}]\n`;
    }
    return content;
  }

  private formatDecisions(): string {
    const recent = this.decisions.slice(-30);
    let content = `# Decision Log
> Auto-managed by AgentBrain Prefrontal Cortex
> Last updated: ${new Date().toISOString()}
> Total decisions: ${this.decisions.length}

`;
    for (const d of recent) {
      content += `### ${d.timestamp}
- Context: ${d.context}
- Decision: ${d.decision}
- Reasoning: ${d.reasoning}
- Confidence: ${(d.confidence * 100).toFixed(0)}%

`;
    }
    return content;
  }

  private formatPriorities(): string {
    const recent = this.taskHistory.slice(-10);
    let content = `# Priority Stack
> Auto-managed by AgentBrain Prefrontal Cortex
> Last updated: ${new Date().toISOString()}

## Current
${this.currentPlan ? `- [P${this.currentPlan.priority}] ${this.currentPlan.description} (${this.currentPlan.status})` : '(idle)'}

## Recent History
`;
    for (const plan of recent.reverse()) {
      content += `- [P${plan.priority}] ${plan.description} → ${plan.status}\n`;
    }
    return content;
  }

  private parsePlan(content: string): TaskPlan | null {
    const descMatch = content.match(/^## (.+)$/m);
    const idMatch = content.match(/ID: (.+)/);
    const priorityMatch = content.match(/Priority: (\d+)/);
    const complexityMatch = content.match(/Complexity: (\w+)/);
    const statusMatch = content.match(/Status: (\w+)/);

    if (!descMatch) return null;

    return {
      id: idMatch?.[1] || `plan-loaded`,
      timestamp: new Date().toISOString(),
      description: descMatch[1],
      priority: parseInt(priorityMatch?.[1] || '5', 10),
      subTasks: [],
      status: (statusMatch?.[1] as TaskPlan['status']) || 'in_progress',
      estimatedComplexity: (complexityMatch?.[1] as TaskPlan['estimatedComplexity']) || 'simple',
    };
  }

  private parseDecisions(content: string): Decision[] {
    const decisions: Decision[] = [];
    const blocks = content.split(/^### /m).slice(1);

    for (const block of blocks) {
      const timestamp = block.split('\n')[0]?.trim();
      const contextMatch = block.match(/Context: (.+)/);
      const decisionMatch = block.match(/Decision: (.+)/);
      const reasoningMatch = block.match(/Reasoning: (.+)/);
      const confMatch = block.match(/Confidence: (\d+)%/);

      if (timestamp && decisionMatch) {
        decisions.push({
          timestamp,
          context: contextMatch?.[1] || '',
          decision: decisionMatch[1],
          reasoning: reasoningMatch?.[1] || '',
          confidence: parseInt(confMatch?.[1] || '50', 10) / 100,
        });
      }
    }

    return decisions;
  }
}
