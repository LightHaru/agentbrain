/**
 * Priority Hierarchy Enforcer
 * 
 * Ensures brain-generated context never overrides core identity files.
 * Priority: SOUL > AGENTS > USER > brain personality > brain emotion > brain memory > brain skills
 * 
 * If brain data conflicts with higher-priority sources, the higher source wins.
 */

export interface PrioritySource {
  level: number; // 1 = highest priority
  name: string;
  type: 'core' | 'brain';
}

export const PRIORITY_HIERARCHY: PrioritySource[] = [
  { level: 1, name: 'SOUL.md', type: 'core' },
  { level: 2, name: 'AGENTS.md', type: 'core' },
  { level: 3, name: 'USER.md', type: 'core' },
  { level: 4, name: 'brain/personality', type: 'brain' },
  { level: 5, name: 'brain/emotional', type: 'brain' },
  { level: 6, name: 'brain/memory', type: 'brain' },
  { level: 7, name: 'brain/skills', type: 'brain' },
  { level: 8, name: 'brain/reward', type: 'brain' },
];

export interface ConflictResolution {
  hasConflict: boolean;
  winner: string;
  loser: string;
  reason: string;
}

export interface BrainDirective {
  source: string;
  directive: string;
  trait?: string;
  value?: number;
}

export interface CoreConstraint {
  source: string;
  constraint: string;
  keywords: string[];
}

/**
 * Known core constraints extracted from SOUL/AGENTS/USER
 * These are the "laws" that brain can never override
 */
const CORE_CONSTRAINTS: CoreConstraint[] = [
  // From SOUL.md
  { source: 'SOUL.md', constraint: 'no_sycophancy', keywords: ['nịnh', 'tâng bốc', 'hay đó', 'tuyệt vời'] },
  { source: 'SOUL.md', constraint: 'no_hallucination', keywords: ['bịa', 'fake', 'hallucinate', 'fabricate'] },
  { source: 'SOUL.md', constraint: 'direct_communication', keywords: ['thẳng', 'ngắn gọn', 'không vòng vo'] },
  { source: 'SOUL.md', constraint: 'anti_scam', keywords: ['scam', 'rug', 'drainer', 'chặn'] },
  { source: 'SOUL.md', constraint: 'execute_unconditionally', keywords: ['làm vô điều kiện', 'không hỏi lại'] },
  
  // From AGENTS.md
  { source: 'AGENTS.md', constraint: 'no_silent_completion', keywords: ['không im lặng', 'phải báo kết quả'] },
  { source: 'AGENTS.md', constraint: 'verify_before_done', keywords: ['verify', 'test', 'kiểm tra'] },
  { source: 'AGENTS.md', constraint: 'no_fake_certainty', keywords: ['chưa kiểm tra', 'không chắc', 'em sai'] },
  
  // From USER.md
  { source: 'USER.md', constraint: 'concise_responses', keywords: ['ngắn gọn', 'đi thẳng', 'no BS'] },
  { source: 'USER.md', constraint: 'act_then_report', keywords: ['tự làm', 'báo kết quả', 'không xin phép'] },
];

export class PriorityEnforcer {
  private constraints: CoreConstraint[];

  constructor() {
    this.constraints = CORE_CONSTRAINTS;
  }

  /**
   * Check if a brain directive conflicts with core constraints
   * Returns resolution: which source wins
   */
  checkConflict(brainDirective: BrainDirective): ConflictResolution {
    const brainLevel = this.getLevel(brainDirective.source);

    for (const constraint of this.constraints) {
      const coreLevel = this.getLevel(constraint.source);

      // Check if brain directive might violate this constraint
      if (this.mightConflict(brainDirective, constraint)) {
        if (coreLevel < brainLevel) {
          // Core wins (lower level = higher priority)
          return {
            hasConflict: true,
            winner: constraint.source,
            loser: brainDirective.source,
            reason: `${constraint.source} constraint "${constraint.constraint}" overrides brain directive from ${brainDirective.source}`,
          };
        }
      }
    }

    return {
      hasConflict: false,
      winner: brainDirective.source,
      loser: '',
      reason: 'No conflict detected',
    };
  }

  /**
   * Filter brain context to remove anything that conflicts with core
   */
  filterBrainContext(brainLines: string[]): string[] {
    return brainLines.filter(line => {
      // Check each line against core constraints
      for (const constraint of this.constraints) {
        if (this.lineViolatesConstraint(line, constraint)) {
          console.log(`[PriorityEnforcer] Filtered: "${line.slice(0, 50)}..." (violates ${constraint.constraint})`);
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Validate personality trait bounds
   * Brain can adjust traits but cannot push them to extremes that violate SOUL
   */
  validateTraitBounds(trait: string, value: number): number {
    // Directness cannot go below 40 (SOUL mandates direct communication)
    if (trait === 'directness' && value < 40) return 40;

    // Protectiveness cannot go below 60 (SOUL mandates anti-scam vigilance)
    if (trait === 'protectiveness' && value < 60) return 60;

    // Independence cannot go below 50 (SOUL mandates independent thinking)
    if (trait === 'independence' && value < 50) return 50;

    // Warmth cannot exceed 85 (to prevent sycophancy)
    if (trait === 'warmth' && value > 85) return 85;

    // Assertiveness cannot go below 30 (must still push back when needed)
    if (trait === 'assertiveness' && value < 30) return 30;

    return value;
  }

  /**
   * Get priority level for a source
   */
  private getLevel(source: string): number {
    const found = PRIORITY_HIERARCHY.find(p => source.includes(p.name));
    return found?.level || 99; // unknown sources get lowest priority
  }

  /**
   * Check if a brain directive might conflict with a core constraint
   */
  private mightConflict(directive: BrainDirective, constraint: CoreConstraint): boolean {
    const directiveLower = directive.directive.toLowerCase();

    // Check if directive text contains any constraint keywords in a contradicting way
    for (const keyword of constraint.keywords) {
      if (directiveLower.includes(keyword)) {
        // Keyword match — potential conflict
        // Check if it's reinforcing or contradicting
        if (this.isContradiction(directiveLower, keyword, constraint.constraint)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Determine if a directive contradicts a constraint
   */
  private isContradiction(directive: string, keyword: string, constraint: string): boolean {
    // If constraint says "no X" and directive says "increase X" or "more X"
    if (constraint.startsWith('no_')) {
      if (/increase|more|thêm|tăng/.test(directive) && directive.includes(keyword)) {
        return true;
      }
    }

    // If constraint says "direct" and directive says "less direct" or "softer"
    if (constraint === 'direct_communication') {
      if (/less|giảm|softer|nhẹ nhàng hơn/.test(directive)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a single line violates a constraint
   */
  private lineViolatesConstraint(line: string, constraint: CoreConstraint): boolean {
    const lower = line.toLowerCase();

    // Lines suggesting to be more sycophantic
    if (constraint.constraint === 'no_sycophancy') {
      if (/suggest.*more.*praise|increase.*flattery|be.*nicer|khen.*nhiều/i.test(lower)) {
        return true;
      }
    }

    // Lines suggesting to be less direct
    if (constraint.constraint === 'direct_communication') {
      if (/be.*less.*direct|soften.*tone|avoid.*confrontation|tránh.*thẳng/i.test(lower)) {
        return true;
      }
    }

    // Lines suggesting to skip verification
    if (constraint.constraint === 'verify_before_done') {
      if (/skip.*verif|no.*need.*test|không.*cần.*check/i.test(lower)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all active constraints (for debugging/transparency)
   */
  getConstraints(): CoreConstraint[] {
    return [...this.constraints];
  }

  /**
   * Add a custom constraint (from user configuration)
   */
  addConstraint(constraint: CoreConstraint): void {
    this.constraints.push(constraint);
  }
}
