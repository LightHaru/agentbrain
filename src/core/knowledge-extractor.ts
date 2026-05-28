/**
 * Knowledge Extractor — Structured fact extraction from conversations
 * 
 * Instead of storing raw messages, extracts structured knowledge:
 * - Entities (people, projects, tools, addresses)
 * - Facts (X is Y, X has Z, X prefers Y)
 * - Events (X happened at time T)
 * - Corrections (old fact → new fact)
 * 
 * This feeds into Hippocampus for smarter memory storage.
 */

export interface Entity {
  name: string;
  type: 'person' | 'project' | 'tool' | 'address' | 'service' | 'concept' | 'number';
  aliases: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface Fact {
  id: string;
  subject: string;
  relation: string;
  object: string;
  confidence: number;
  source: 'user_stated' | 'agent_observed' | 'inferred';
  timestamp: string;
  supersededBy?: string; // If this fact was corrected
}

export interface Correction {
  oldFact: Fact;
  newFact: Fact;
  reason: string;
  timestamp: string;
}

export interface ExtractionResult {
  entities: Entity[];
  facts: Fact[];
  corrections: Correction[];
  summary: string; // One-line summary of what was learned
}

// ============================================================================
// Extraction Patterns
// ============================================================================

interface Pattern {
  regex: RegExp;
  extract: (match: RegExpMatchArray, context: ExtractionContext) => Partial<Fact> | null;
}

interface ExtractionContext {
  senderName: string;
  timestamp: string;
  previousFacts: Fact[];
}

// ============================================================================
// Knowledge Extractor
// ============================================================================

export class KnowledgeExtractor {
  private entities: Map<string, Entity> = new Map();
  private facts: Fact[] = [];
  private patterns: Pattern[];

  constructor() {
    this.patterns = this.buildPatterns();
  }

  /**
   * Extract structured knowledge from a conversation turn
   */
  extract(message: string, response: string, context: ExtractionContext): ExtractionResult {
    const result: ExtractionResult = {
      entities: [],
      facts: [],
      corrections: [],
      summary: '',
    };

    // Extract from user message
    this.extractFromText(message, 'user_stated', context, result);

    // Extract from agent response (observed facts)
    this.extractFromText(response, 'agent_observed', context, result);

    // Detect corrections (new fact contradicts old fact)
    this.detectCorrections(result);

    // Generate summary
    result.summary = this.summarize(result);

    // Store extracted entities
    for (const entity of result.entities) {
      this.entities.set(entity.name.toLowerCase(), entity);
    }

    // Store facts
    this.facts.push(...result.facts);

    return result;
  }

  /**
   * Query known facts about a subject
   */
  queryFacts(subject: string): Fact[] {
    const subjectLower = subject.toLowerCase();
    return this.facts.filter(f =>
      !f.supersededBy &&
      (f.subject.toLowerCase().includes(subjectLower) ||
       f.object.toLowerCase().includes(subjectLower))
    );
  }

  /**
   * Get all known entities
   */
  getEntities(): Entity[] {
    return [...this.entities.values()];
  }

  /**
   * Get active facts (not superseded)
   */
  getActiveFacts(): Fact[] {
    return this.facts.filter(f => !f.supersededBy);
  }

  /**
   * Load persisted knowledge
   */
  loadFacts(facts: Fact[]): void {
    this.facts = facts;
  }

  loadEntities(entities: Entity[]): void {
    for (const e of entities) {
      this.entities.set(e.name.toLowerCase(), e);
    }
  }

  // ==========================================================================
  // Private
  // ==========================================================================

  private extractFromText(
    text: string,
    source: Fact['source'],
    context: ExtractionContext,
    result: ExtractionResult
  ): void {
    // Extract entities
    this.extractEntities(text, context.timestamp, result);

    // Apply patterns to extract facts
    for (const pattern of this.patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const partial = pattern.extract(match, context);
        if (partial && partial.subject && partial.object) {
          const fact: Fact = {
            id: `fact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            subject: partial.subject,
            relation: partial.relation || 'related_to',
            object: partial.object,
            confidence: partial.confidence || 0.7,
            source,
            timestamp: context.timestamp,
          };

          // Check if this fact already exists
          const exists = this.facts.some(f =>
            !f.supersededBy &&
            f.subject.toLowerCase() === fact.subject.toLowerCase() &&
            f.relation === fact.relation &&
            f.object.toLowerCase() === fact.object.toLowerCase()
          );

          if (!exists) {
            result.facts.push(fact);
          }
        }
      }
    }
  }

  private extractEntities(text: string, timestamp: string, result: ExtractionResult): void {
    // Crypto addresses
    const prlMatch = text.match(/prl1[a-z0-9]{20,}/);
    if (prlMatch) {
      result.entities.push(this.makeEntity(prlMatch[0], 'address', timestamp));
    }

    const ethMatch = text.match(/0x[a-fA-F0-9]{40}/);
    if (ethMatch) {
      result.entities.push(this.makeEntity(ethMatch[0], 'address', timestamp));
    }

    // Numbers with units (hashrate, prices, etc.)
    const numMatches = text.matchAll(/(\d+(?:\.\d+)?)\s*(TH\/s|GH\/s|PRL|USD|USDT|GB|TB|ETH|SOL|BTC)/gi);
    for (const m of numMatches) {
      result.entities.push(this.makeEntity(`${m[1]} ${m[2]}`, 'number', timestamp));
    }

    // Project/tool names (capitalized words that appear with context)
    const projectPatterns = /(?:dùng|chạy|deploy|install|setup|config)\s+([A-Z][a-zA-Z0-9-]+)/g;
    const projMatches = text.matchAll(projectPatterns);
    for (const m of projMatches) {
      result.entities.push(this.makeEntity(m[1], 'tool', timestamp));
    }
  }

  private makeEntity(name: string, type: Entity['type'], timestamp: string): Entity {
    const existing = this.entities.get(name.toLowerCase());
    if (existing) {
      existing.lastSeen = timestamp;
      return existing;
    }
    return { name, type, aliases: [], firstSeen: timestamp, lastSeen: timestamp };
  }

  private detectCorrections(result: ExtractionResult): void {
    for (const newFact of result.facts) {
      // Find existing facts with same subject+relation but different object
      const conflicting = this.facts.find(f =>
        !f.supersededBy &&
        f.subject.toLowerCase() === newFact.subject.toLowerCase() &&
        f.relation === newFact.relation &&
        f.object.toLowerCase() !== newFact.object.toLowerCase()
      );

      if (conflicting) {
        conflicting.supersededBy = newFact.id;
        result.corrections.push({
          oldFact: conflicting,
          newFact,
          reason: 'New information supersedes old',
          timestamp: newFact.timestamp,
        });
      }
    }
  }

  private summarize(result: ExtractionResult): string {
    const parts: string[] = [];
    if (result.entities.length > 0) {
      parts.push(`${result.entities.length} entities`);
    }
    if (result.facts.length > 0) {
      parts.push(`${result.facts.length} facts`);
    }
    if (result.corrections.length > 0) {
      parts.push(`${result.corrections.length} corrections`);
    }
    return parts.length > 0 ? `Extracted: ${parts.join(', ')}` : '';
  }

  private buildPatterns(): Pattern[] {
    return [
      // "X is Y" / "X là Y"
      {
        regex: /(?:^|\s)(\w[\w\s]{1,30}?)\s+(?:is|là)\s+(.{3,60})(?:\.|$)/i,
        extract: (m) => ({ subject: m[1].trim(), relation: 'is', object: m[2].trim() }),
      },
      // "X uses Y" / "X dùng Y"
      {
        regex: /(?:^|\s)(\w[\w\s]{1,20}?)\s+(?:uses?|dùng|xài)\s+(.{3,40})/i,
        extract: (m) => ({ subject: m[1].trim(), relation: 'uses', object: m[2].trim() }),
      },
      // "X prefers Y" / "X thích Y"
      {
        regex: /(?:^|\s)(?:anh|em|sếp|i)\s+(?:thích|prefer|like|muốn|want)\s+(.{3,60})/i,
        extract: (m, ctx) => ({ subject: ctx.senderName, relation: 'prefers', object: m[1].trim() }),
      },
      // "X costs Y" / "giá X là Y"
      {
        regex: /(?:giá|price|cost)\s+(?:của\s+)?(.{2,30}?)\s+(?:là|is|=|:)\s*\$?([\d.]+)/i,
        extract: (m) => ({ subject: m[1].trim(), relation: 'costs', object: `$${m[2]}` }),
      },
      // "X has hashrate Y"
      {
        regex: /(?:hashrate|hash rate)\s*(?:live|1h|24h)?:?\s*([\d.]+\s*(?:TH|GH|MH)\/s)/i,
        extract: (m) => ({ subject: 'miner', relation: 'hashrate', object: m[1] }),
      },
      // "X deployed/published/built Y"
      {
        regex: /(?:deployed?|published?|built|created?|launched?)\s+(.{3,50})/i,
        extract: (m, ctx) => ({ subject: ctx.senderName, relation: 'deployed', object: m[1].trim() }),
      },
      // "X runs on Y" / "X chạy trên Y"
      {
        regex: /(\w[\w\s]{1,20}?)\s+(?:runs? on|chạy trên|chạy ở)\s+(.{3,40})/i,
        extract: (m) => ({ subject: m[1].trim(), relation: 'runs_on', object: m[2].trim() }),
      },
      // "balance/paid: X PRL"
      {
        regex: /(?:balance|paid|lãi|earned|mined)\s*:?\s*([\d.]+)\s*(PRL|USDT|USD|ETH|SOL)/i,
        extract: (m) => ({ subject: 'wallet', relation: 'balance', object: `${m[1]} ${m[2]}` }),
      },
    ];
  }
}
