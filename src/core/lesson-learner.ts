/**
 * Lesson Learner — Extract actionable lessons from corrections & feedback
 * 
 * When user corrects the agent, this module:
 * 1. Detects the correction pattern (explicit correction, frustration, redirect)
 * 2. Extracts what went wrong and what should happen instead
 * 3. Stores as a "lesson" that influences future behavior
 * 4. Applies lessons during recall to prevent repeating mistakes
 */

export interface Lesson {
  id: string;
  type: 'correction' | 'preference' | 'workflow' | 'anti-pattern';
  trigger: string;       // What situation triggers this lesson
  wrong: string;         // What was wrong / what NOT to do
  right: string;         // What to do instead
  confidence: number;    // How sure we are (increases with repetition)
  occurrences: number;   // How many times this lesson was reinforced
  timestamp: string;
  lastApplied: string;
  source: string;        // Original message that taught this
}

export interface LessonMatch {
  lesson: Lesson;
  relevance: number;
}

// ============================================================================
// Correction Detection Patterns
// ============================================================================

interface CorrectionSignal {
  pattern: RegExp;
  type: Lesson['type'];
  severity: number; // 0-1, how strong the correction signal is
}

const CORRECTION_SIGNALS: CorrectionSignal[] = [
  // Explicit corrections (Vietnamese)
  { pattern: /không phải.*mà là|sai rồi|em sai|nhầm rồi|đúng ra là/i, type: 'correction', severity: 0.9 },
  { pattern: /đừng|không được.*nữa|cấm|bỏ cái|thôi đi/i, type: 'anti-pattern', severity: 0.8 },
  { pattern: /lần sau.*phải|nhớ là|ghi nhớ|remember/i, type: 'preference', severity: 0.7 },
  
  // Frustration signals
  { pattern: /gà|ngu|dở|chán|tệ|lại bị|lại sai|mấy lần rồi/i, type: 'correction', severity: 0.6 },
  { pattern: /nói rồi mà|bảo rồi|đã nói|told you/i, type: 'anti-pattern', severity: 0.8 },
  
  // Redirects (user corrects approach)
  { pattern: /không cần.*chỉ cần|đơn giản.*thôi|làm thẳng|đi thẳng/i, type: 'workflow', severity: 0.6 },
  { pattern: /dùng.*thay vì|thay bằng|đổi sang|switch to|use.*instead/i, type: 'preference', severity: 0.7 },
  
  // English corrections
  { pattern: /wrong|incorrect|that's not|no,\s*it's|actually it's/i, type: 'correction', severity: 0.8 },
  { pattern: /don't.*again|stop doing|never do|quit/i, type: 'anti-pattern', severity: 0.8 },
  { pattern: /next time|from now on|always|prefer/i, type: 'preference', severity: 0.6 },
];

// ============================================================================
// Lesson Learner
// ============================================================================

export class LessonLearner {
  private lessons: Lesson[] = [];

  constructor() {}

  /**
   * Analyze a conversation turn for correction signals
   */
  analyze(params: {
    userMessage: string;
    agentResponse: string;
    previousAgentResponse?: string;
    senderName: string;
    timestamp: string;
  }): Lesson | null {
    const { userMessage, agentResponse, previousAgentResponse, senderName, timestamp } = params;

    // Check for correction signals
    let strongestSignal: CorrectionSignal | null = null;
    let maxSeverity = 0;

    for (const signal of CORRECTION_SIGNALS) {
      if (signal.pattern.test(userMessage) && signal.severity > maxSeverity) {
        strongestSignal = signal;
        maxSeverity = signal.severity;
      }
    }

    if (!strongestSignal || maxSeverity < 0.5) return null;

    // Extract what went wrong and what's right
    const extraction = this.extractLesson(userMessage, previousAgentResponse || '', strongestSignal);
    if (!extraction) return null;

    // Check if similar lesson already exists
    const existing = this.findSimilarLesson(extraction.trigger);
    if (existing) {
      // Reinforce existing lesson
      existing.occurrences++;
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      existing.lastApplied = timestamp;
      return existing;
    }

    // Create new lesson
    const lesson: Lesson = {
      id: `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: strongestSignal.type,
      trigger: extraction.trigger,
      wrong: extraction.wrong,
      right: extraction.right,
      confidence: maxSeverity * 0.8,
      occurrences: 1,
      timestamp,
      lastApplied: timestamp,
      source: userMessage.slice(0, 200),
    };

    this.lessons.push(lesson);
    return lesson;
  }

  /**
   * Find relevant lessons for a given context/query
   */
  findRelevantLessons(query: string, limit: number = 3): LessonMatch[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const matches: LessonMatch[] = [];

    for (const lesson of this.lessons) {
      if (lesson.confidence < 0.4) continue;

      const triggerLower = lesson.trigger.toLowerCase();
      const rightLower = lesson.right.toLowerCase();

      // Word overlap scoring
      let matchCount = 0;
      for (const word of queryWords) {
        if (triggerLower.includes(word) || rightLower.includes(word)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const relevance = (matchCount / queryWords.length) * lesson.confidence;
        if (relevance > 0.2) {
          matches.push({ lesson, relevance });
        }
      }
    }

    matches.sort((a, b) => b.relevance - a.relevance);
    return matches.slice(0, limit);
  }

  /**
   * Format lessons as context injection
   */
  formatForInjection(lessons: LessonMatch[]): string {
    if (lessons.length === 0) return '';

    const lines = lessons.map(({ lesson }) => {
      switch (lesson.type) {
        case 'correction':
          return `⚠️ Learned: ${lesson.right} (not: ${lesson.wrong})`;
        case 'anti-pattern':
          return `🚫 Don't: ${lesson.wrong} → Do: ${lesson.right}`;
        case 'preference':
          return `✓ User prefers: ${lesson.right}`;
        case 'workflow':
          return `→ Workflow: ${lesson.right}`;
      }
    });

    return `Lessons:\n${lines.join('\n')}`;
  }

  /**
   * Get all lessons
   */
  getLessons(): Lesson[] {
    return this.lessons;
  }

  /**
   * Load persisted lessons
   */
  loadLessons(lessons: Lesson[]): void {
    this.lessons = lessons;
  }

  /**
   * Get stats
   */
  getStats(): { total: number; highConfidence: number; types: Record<string, number> } {
    const types: Record<string, number> = {};
    let highConf = 0;

    for (const l of this.lessons) {
      types[l.type] = (types[l.type] || 0) + 1;
      if (l.confidence >= 0.7) highConf++;
    }

    return { total: this.lessons.length, highConfidence: highConf, types };
  }

  // ==========================================================================
  // Private
  // ==========================================================================

  private extractLesson(
    userMessage: string,
    previousResponse: string,
    signal: CorrectionSignal
  ): { trigger: string; wrong: string; right: string } | null {
    const msg = userMessage;

    // Try to extract "not X, but Y" patterns
    const notButMatch = msg.match(/(?:không phải|not)\s+(.{3,50}?)(?:mà là|but|mà)\s+(.{3,50})/i);
    if (notButMatch) {
      return {
        trigger: notButMatch[1].trim(),
        wrong: notButMatch[1].trim(),
        right: notButMatch[2].trim(),
      };
    }

    // "Don't X" / "Đừng X"
    const dontMatch = msg.match(/(?:đừng|don'?t|không được|cấm|thôi)\s+(.{3,80})/i);
    if (dontMatch) {
      return {
        trigger: dontMatch[1].trim().slice(0, 50),
        wrong: dontMatch[1].trim(),
        right: `Avoid: ${dontMatch[1].trim().slice(0, 50)}`,
      };
    }

    // "Use X instead" / "Dùng X thay vì Y"
    const useInsteadMatch = msg.match(/(?:dùng|use|thay bằng|switch to)\s+(.{3,50})(?:\s+(?:thay vì|instead of)\s+(.{3,50}))?/i);
    if (useInsteadMatch) {
      return {
        trigger: useInsteadMatch[2]?.trim() || 'previous approach',
        wrong: useInsteadMatch[2]?.trim() || 'previous approach',
        right: `Use ${useInsteadMatch[1].trim()}`,
      };
    }

    // "Next time X" / "Lần sau X"
    const nextTimeMatch = msg.match(/(?:lần sau|next time|from now on|nhớ là)\s+(.{3,80})/i);
    if (nextTimeMatch) {
      return {
        trigger: 'general',
        wrong: previousResponse.slice(0, 50) || 'previous behavior',
        right: nextTimeMatch[1].trim(),
      };
    }

    // Generic: use the correction message itself as the lesson
    if (signal.severity >= 0.6) {
      return {
        trigger: msg.slice(0, 50),
        wrong: previousResponse.slice(0, 50) || 'unknown',
        right: msg.slice(0, 100),
      };
    }

    return null;
  }

  private findSimilarLesson(trigger: string): Lesson | null {
    const tokenize = (s: string) => s.toLowerCase().normalize('NFC')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    const triggerWords = tokenize(trigger);

    return this.lessons.find(l => {
      const existingLower = l.trigger.toLowerCase().normalize('NFC');
      const triggerLower = trigger.toLowerCase().normalize('NFC');
      // Exact or substring match
      if (existingLower.includes(triggerLower) || triggerLower.includes(existingLower)) {
        return true;
      }
      // Word overlap: if >=2 words match, consider similar
      const existingWords = tokenize(l.trigger);
      const overlap = triggerWords.filter(w => existingWords.includes(w)).length;
      return overlap >= 2;
    }) || null;
  }
}
