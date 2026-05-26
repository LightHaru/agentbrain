/**
 * Cerebellum — Skill & Habit Learning Engine
 * 
 * Like the brain's cerebellum, this module handles:
 * - Detecting repeated patterns in user requests
 * - Tracking skill proficiency (what agent is good/bad at)
 * - Auto-creating shortcuts for frequent workflows
 * - Habit formation: if X happens N times → automate
 */

import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 0-100
  timesUsed: number;
  lastUsed: string;
  successRate: number; // 0-1
  successes: number;
  failures: number;
}

export interface Habit {
  id: string;
  pattern: string; // what triggers this habit
  action: string; // what to do
  frequency: number; // times detected
  confidence: number; // 0-1 (how sure are we this is a real pattern)
  firstSeen: string;
  lastSeen: string;
  active: boolean;
}

export interface PatternMatch {
  pattern: string;
  category: string;
  count: number;
}

/** Skill categories and their detection patterns */
const SKILL_PATTERNS: Record<string, RegExp[]> = {
  'crypto-analysis': [/phân tích|analyze|check.*token|price|chart|long|short/i],
  'code-writing': [/code|viết.*code|build|tạo.*app|component|function/i],
  'code-debugging': [/fix|bug|lỗi|error|debug|crash/i],
  'content-writing': [/viết.*bài|blog|article|content|seo/i],
  'research': [/tìm hiểu|research|tìm.*giúp|investigate|đánh giá/i],
  'ops-server': [/server|deploy|nginx|docker|systemctl|vps/i],
  'image-generation': [/hình|image|ảnh|generate.*image|tạo.*hình/i],
  'planning': [/plan|kế hoạch|roadmap|architecture|thiết kế/i],
  'social-media': [/tweet|post|thread|đăng|twitter|x\b/i],
};

export class Cerebellum {
  private config: BrainConfig;
  private fileManager: BrainFileManager;
  private skills: Map<string, Skill> = new Map();
  private habits: Habit[] = [];
  private recentPatterns: Array<{ pattern: string; timestamp: string }> = [];

  constructor(config: BrainConfig, fileManager: BrainFileManager) {
    this.config = config;
    this.fileManager = fileManager;
  }

  /**
   * Initialize: load skills and habits from files
   */
  async initialize(): Promise<void> {
    const skillsContent = await this.fileManager.readFile('skills/proficiency.md');
    if (skillsContent) {
      this.skills = this.parseSkills(skillsContent);
    }

    const habitsContent = await this.fileManager.readFile('skills/habits.md');
    if (habitsContent) {
      this.habits = this.parseHabits(habitsContent);
    }

    console.log(`[Cerebellum] Initialized — ${this.skills.size} skills, ${this.habits.length} habits`);
  }

  /**
   * Detect which skill is being used in this interaction
   */
  detectSkill(message: string): string | null {
    for (const [skill, patterns] of Object.entries(SKILL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          return skill;
        }
      }
    }
    return null;
  }

  /**
   * Record skill usage after a task
   */
  recordSkillUsage(skillName: string, success: boolean): void {
    let skill = this.skills.get(skillName);

    if (!skill) {
      skill = {
        id: `skill-${skillName}`,
        name: skillName,
        category: skillName.split('-')[0] || 'general',
        proficiency: 30, // start at beginner
        timesUsed: 0,
        lastUsed: new Date().toISOString(),
        successRate: 0,
        successes: 0,
        failures: 0,
      };
    }

    skill.timesUsed++;
    skill.lastUsed = new Date().toISOString();

    if (success) {
      skill.successes++;
    } else {
      skill.failures++;
    }

    skill.successRate = skill.successes / skill.timesUsed;

    // Proficiency grows with successful usage, decays with failure
    if (success) {
      skill.proficiency = Math.min(100, skill.proficiency + 2);
    } else {
      skill.proficiency = Math.max(0, skill.proficiency - 1);
    }

    this.skills.set(skillName, skill);
  }

  /**
   * Detect patterns/habits from repeated requests
   */
  detectPattern(message: string, timestamp: string): Habit | null {
    const skill = this.detectSkill(message);
    if (!skill) return null;

    this.recentPatterns.push({ pattern: skill, timestamp });

    // Keep only last 100 patterns
    if (this.recentPatterns.length > 100) {
      this.recentPatterns = this.recentPatterns.slice(-100);
    }

    // Count occurrences of this pattern in recent history
    const count = this.recentPatterns.filter(p => p.pattern === skill).length;

    // If pattern appears 5+ times, it's becoming a habit
    if (count >= 5) {
      const existingHabit = this.habits.find(h => h.pattern === skill);

      if (existingHabit) {
        existingHabit.frequency = count;
        existingHabit.lastSeen = timestamp;
        existingHabit.confidence = Math.min(1, count / 10);
        return existingHabit;
      } else {
        const newHabit: Habit = {
          id: `habit-${Date.now().toString(36)}`,
          pattern: skill,
          action: `Proactively prepare for ${skill} tasks`,
          frequency: count,
          confidence: count / 10,
          firstSeen: this.recentPatterns.find(p => p.pattern === skill)?.timestamp || timestamp,
          lastSeen: timestamp,
          active: true,
        };
        this.habits.push(newHabit);
        return newHabit;
      }
    }

    return null;
  }

  /**
   * Get top skills by proficiency
   */
  getTopSkills(n: number = 5): Skill[] {
    return [...this.skills.values()]
      .sort((a, b) => b.proficiency - a.proficiency)
      .slice(0, n);
  }

  /**
   * Get active habits
   */
  getActiveHabits(): Habit[] {
    return this.habits.filter(h => h.active && h.confidence >= 0.5);
  }

  /**
   * Get skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return [...this.skills.values()];
  }

  /**
   * Persist skills and habits to files
   */
  async persist(): Promise<void> {
    await this.fileManager.writeFile('skills/proficiency.md', this.formatSkills());
    await this.fileManager.writeFile('skills/habits.md', this.formatHabits());
  }

  // --- Formatting ---

  private formatSkills(): string {
    const sorted = [...this.skills.values()].sort((a, b) => b.proficiency - a.proficiency);
    let content = `# Skill Proficiency
> Auto-managed by AgentBrain Cerebellum
> Last updated: ${new Date().toISOString()}

`;
    for (const skill of sorted) {
      const bar = '█'.repeat(Math.round(skill.proficiency / 5)) + '░'.repeat(20 - Math.round(skill.proficiency / 5));
      content += `## ${skill.name}
- Proficiency: ${bar} ${skill.proficiency.toFixed(0)}/100
- Used: ${skill.timesUsed} times (${skill.successes}✓ / ${skill.failures}✗)
- Success rate: ${(skill.successRate * 100).toFixed(0)}%
- Last used: ${skill.lastUsed}

`;
    }
    return content;
  }

  private formatHabits(): string {
    let content = `# Detected Habits & Patterns
> Auto-managed by AgentBrain Cerebellum
> Last updated: ${new Date().toISOString()}

`;
    for (const habit of this.habits) {
      content += `## ${habit.pattern}
- Action: ${habit.action}
- Frequency: ${habit.frequency} times
- Confidence: ${(habit.confidence * 100).toFixed(0)}%
- Active: ${habit.active}
- First seen: ${habit.firstSeen}
- Last seen: ${habit.lastSeen}

`;
    }
    return content;
  }

  private parseSkills(content: string): Map<string, Skill> {
    const map = new Map<string, Skill>();
    const blocks = content.split(/^## /m).slice(1);

    for (const block of blocks) {
      const name = block.split('\n')[0]?.trim();
      if (!name) continue;

      const profMatch = block.match(/Proficiency:.*?(\d+)\/100/);
      const usedMatch = block.match(/Used: (\d+) times \((\d+)✓ \/ (\d+)✗\)/);
      const lastMatch = block.match(/Last used: (.+)/);

      const timesUsed = parseInt(usedMatch?.[1] || '0', 10);
      const successes = parseInt(usedMatch?.[2] || '0', 10);
      const failures = parseInt(usedMatch?.[3] || '0', 10);

      map.set(name, {
        id: `skill-${name}`,
        name,
        category: name.split('-')[0] || 'general',
        proficiency: parseInt(profMatch?.[1] || '30', 10),
        timesUsed,
        lastUsed: lastMatch?.[1] || new Date().toISOString(),
        successRate: timesUsed > 0 ? successes / timesUsed : 0,
        successes,
        failures,
      });
    }

    return map;
  }

  private parseHabits(content: string): Habit[] {
    const habits: Habit[] = [];
    const blocks = content.split(/^## /m).slice(1);

    for (const block of blocks) {
      const pattern = block.split('\n')[0]?.trim();
      if (!pattern) continue;

      const freqMatch = block.match(/Frequency: (\d+)/);
      const confMatch = block.match(/Confidence: (\d+)%/);
      const activeMatch = block.match(/Active: (true|false)/);

      habits.push({
        id: `habit-${habits.length}`,
        pattern,
        action: `Proactively prepare for ${pattern} tasks`,
        frequency: parseInt(freqMatch?.[1] || '0', 10),
        confidence: parseInt(confMatch?.[1] || '0', 10) / 100,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        active: activeMatch?.[1] !== 'false',
      });
    }

    return habits;
  }
}
