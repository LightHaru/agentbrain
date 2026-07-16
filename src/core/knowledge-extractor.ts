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

import { isSystemNoise, stripNoiseLines } from './noise-filter.js';

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
  validFrom?: string; // When this fact became true
  validUntil?: string; // When this fact stopped being true (null = still valid)
}

export interface ProceduralMemory {
  id: string;
  type: 'source_routing' | 'workflow' | 'shortcut';
  trigger: string; // What triggers this memory (e.g., "PRL price")
  action: string; // What to do (e.g., "Use DexScreener API")
  confidence: number;
  timesUsed: number;
  successRate: number;
  lastUsed: string;
  created: string;
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
  proceduralMemories: ProceduralMemory[];
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
  private proceduralMemories: ProceduralMemory[] = [];
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
      proceduralMemories: [],
      summary: '',
    };

    // Extract from user message
    this.extractFromText(message, 'user_stated', context, result);

    // Extract from agent response (observed facts)
    this.extractFromText(response, 'agent_observed', context, result);

    // Detect corrections (new fact contradicts old fact)
    this.detectCorrections(result);

    // Extract procedural memories (source routing)
    this.extractProceduralMemories(message, response, context, result);

    // Generate summary
    result.summary = this.summarize(result);

    // Store extracted entities
    for (const entity of result.entities) {
      this.entities.set(entity.name.toLowerCase(), entity);
    }

    // Store facts
    this.facts.push(...result.facts);

    // Store procedural memories
    this.proceduralMemories.push(...result.proceduralMemories);

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
   * Query facts valid at a specific point in time
   */
  queryFactsAtTime(subject: string, timestamp: string): Fact[] {
    const subjectLower = subject.toLowerCase();
    return this.facts.filter(f => {
      const matchesSubject = f.subject.toLowerCase().includes(subjectLower) ||
                            f.object.toLowerCase().includes(subjectLower);
      if (!matchesSubject) return false;

      // Check temporal validity
      const validFrom = (f as any).validFrom || f.timestamp;
      const validUntil = (f as any).validUntil;

      const isValidFrom = validFrom <= timestamp;
      const isValidUntil = !validUntil || validUntil > timestamp;

      return isValidFrom && isValidUntil;
    });
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
   * Get procedural memories (source routing, workflows)
   */
  getProceduralMemories(): ProceduralMemory[] {
    return this.proceduralMemories;
  }

  /**
   * Query procedural memory for a trigger
   */
  queryProcedural(trigger: string): ProceduralMemory | null {
    const triggerLower = trigger.toLowerCase();
    const matches = this.proceduralMemories.filter(pm =>
      triggerLower.includes(pm.trigger.toLowerCase())
    );
    
    if (matches.length === 0) return null;
    
    // Return highest confidence + success rate
    return matches.sort((a, b) => {
      const scoreA = a.confidence * a.successRate;
      const scoreB = b.confidence * b.successRate;
      return scoreB - scoreA;
    })[0];
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

  loadProceduralMemories(memories: ProceduralMemory[]): void {
    this.proceduralMemories = memories;
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
    // Never extract facts/entities from runtime telemetry or system noise.
    const clean = stripNoiseLines(text);
    if (!clean || isSystemNoise(text)) {
      return;
    }
    text = clean;

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
            validFrom: context.timestamp,
            validUntil: undefined,
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

  private cleanSubject(value: string): string {
    let v = value
      .replace(/^(?:hãy\s+)?(?:ghi\s+nhớ|remember|note)\s*[:,-]?\s*/iu, '')
      .replace(/^(?:rằng|that)\s+/iu, '')
      .trim();
    // Strip leading conjunctions / filler that the loose "X là Y" pattern often
    // captures ("và dự án chính của anh tên" → "dự án"). A garbage subject makes
    // an otherwise-correct fact read like noise to Aira, so normalize the head.
    for (let i = 0; i < 4; i++) {
      const before = v;
      v = v
        .replace(/^(?:và|and|còn|rồi|thì|mà|nên|với|cũng|là|nữa|ờ|à|ừ|ok|okay)\s+/iu, '')
        .replace(/^(?:anh|em|sếp|mình|tôi|tui|bạn|nó|họ)\s+(?:cho\s+em\s+biết\s+|nói\s+|bảo\s+|dặn\s+)?/iu, '')
        .replace(/\s+(?:tên|tên\s+là|có\s+tên)$/iu, '')
        .trim();
      if (v === before) break;
    }
    return v || value.trim();
  }

  private cleanObject(value: string): string {
    return value
      .replace(/\s+(?:và|and)\s+.*$/iu, '')
      .replace(/\s+(?:rồi|nha|nhé|luôn|đó|ạ)\s*$/iu, '')
      .replace(/[.!?。]+$/u, '')
      .trim();
  }

  /**
   * Normalized "core" of a subject for conflict detection: drop leading time /
   * filler words (giờ, hiện tại, bây giờ) and generic qualifiers (chính, chủ)
   * and articles so "database chính của dự án" and "giờ dự án" match on the
   * shared head noun ("dự án"). Used only for supersede matching.
   */
  private subjectCore(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(gio|hien tai|bay gio|hom nay|now|currently|the)\b/g, ' ')
      .replace(/\b(chinh|chu yeu|main|primary)\b/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .join(' ')
      .trim();
  }

  /** Do two subjects refer to the same thing? (core token containment) */
  private sameSubject(a: string, b: string): boolean {
    const ca = this.subjectCore(a);
    const cb = this.subjectCore(b);
    if (!ca || !cb) return false;
    if (ca === cb) return true;
    const SUBJ_STOP = new Set(['cua', 'la', 'va', 'cho', 'den', 'voi', 'mot', 'nay', 'do']);
    const meaningful = (c: string) =>
      new Set(c.split(' ').filter((w) => w.length >= 2 && !SUBJ_STOP.has(w)));
    const ta = meaningful(ca);
    const tb = meaningful(cb);
    if (ta.size === 0 || tb.size === 0) return false;
    // one subject's meaningful tokens are a subset of the other's (shared head noun)
    const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
    let hit = 0;
    for (const t of small) if (big.has(t)) hit++;
    return hit === small.size;
  }

  /** Relations that express the same kind of assertion (value assignment). */
  private compatibleRelation(a: string, b: string): boolean {
    if (a === b) return true;
    const valueRels = new Set(['is', 'uses', 'runs_on', 'costs', 'balance']);
    return valueRels.has(a) && valueRels.has(b);
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
        f.id !== newFact.id &&
        this.sameSubject(f.subject, newFact.subject) &&
        this.compatibleRelation(f.relation, newFact.relation) &&
        f.object.toLowerCase() !== newFact.object.toLowerCase()
      );

      if (conflicting) {
        conflicting.supersededBy = newFact.id;
        conflicting.validUntil = newFact.timestamp; // Mark when old fact stopped being valid
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
    if (result.proceduralMemories.length > 0) {
      parts.push(`${result.proceduralMemories.length} procedures`);
    }
    return parts.length > 0 ? `Extracted: ${parts.join(', ')}` : '';
  }

  private extractProceduralMemories(
    message: string,
    response: string,
    context: ExtractionContext,
    result: ExtractionResult
  ): void {
    // Detect source routing patterns
    // Pattern: user asks about X, agent uses specific source Y successfully
    
    // PRL price → DexScreener
    if (/prl|pearl.*price|giá.*prl/i.test(message) && /dexscreener/i.test(response)) {
      const existing = this.proceduralMemories.find(pm => pm.trigger === 'PRL price');
      if (!existing) {
        result.proceduralMemories.push({
          id: `proc-${Date.now().toString(36)}`,
          type: 'source_routing',
          trigger: 'PRL price',
          action: 'Use DexScreener API: https://api.dexscreener.com/latest/dex/search?q=WPRL',
          confidence: 0.8,
          timesUsed: 1,
          successRate: 1.0,
          lastUsed: context.timestamp,
          created: context.timestamp,
        });
      }
    }
    
    // Token price → DexScreener (general)
    if (/token.*price|price.*token|giá.*token/i.test(message) && /dexscreener/i.test(response)) {
      const existing = this.proceduralMemories.find(pm => pm.trigger === 'token price');
      if (!existing) {
        result.proceduralMemories.push({
          id: `proc-${Date.now().toString(36)}`,
          type: 'source_routing',
          trigger: 'token price',
          action: 'Use DexScreener API for token price lookup',
          confidence: 0.7,
          timesUsed: 1,
          successRate: 1.0,
          lastUsed: context.timestamp,
          created: context.timestamp,
        });
      }
    }
    
    // GameFi news → TinGameFi
    if (/gamefi.*news|tin.*gamefi|game.*news/i.test(message) && /tingamefi/i.test(response)) {
      const existing = this.proceduralMemories.find(pm => pm.trigger === 'GameFi news');
      if (!existing) {
        result.proceduralMemories.push({
          id: `proc-${Date.now().toString(36)}`,
          type: 'source_routing',
          trigger: 'GameFi news',
          action: 'Check TinGameFi.com for latest GameFi news',
          confidence: 0.9,
          timesUsed: 1,
          successRate: 1.0,
          lastUsed: context.timestamp,
          created: context.timestamp,
        });
      }
    }
  }

  private buildPatterns(): Pattern[] {
    return [
      // "mật danh của Aira là X" / "codename for Aira is X"
      {
        regex: /(?:mật\s+danh|codename|code\s+name)\s+(?:runtime\s+)?(?:của|for)?\s*([\p{L}\p{N}_ .'-]{1,40}?)\s+(?:là|is|=|:)\s+(.{3,100}?)(?=\s+(?:và|and)\b|[.!?。]|$)/iu,
        extract: (m) => ({
          subject: this.cleanSubject(`mật danh ${m[1]}`),
          relation: 'codename',
          object: this.cleanObject(m[2]),
          confidence: 0.95,
        }),
      },
      // "X is Y" / "X là Y"
      {
        regex: /(?:^|[\s:])([\p{L}\p{N}_][\p{L}\p{N}_\s.'()/-]{1,60}?)\s+(?:is|là)\s+(.{3,100}?)(?=\s+(?:và|and)\b|[.!?。]|$)/iu,
        extract: (m) => ({
          subject: this.cleanSubject(m[1]),
          relation: 'is',
          object: this.cleanObject(m[2]),
        }),
      },
      // "X uses Y" / "X dùng Y"
      {
        regex: /(?:^|\s)([\p{L}\p{N}_][\p{L}\p{N}_\s.'()/-]{1,40}?)\s+(?:uses?|dùng|xài)\s+(.{3,60}?)(?=\s+(?:và|and)\b|[.!?。]|$)/iu,
        extract: (m) => ({
          subject: this.cleanSubject(m[1]),
          relation: 'uses',
          object: this.cleanObject(m[2]),
        }),
      },
      // "X prefers Y" / "X thích Y"
      {
        regex: /(?:^|\s)(?:anh|em|sếp|i)\s+(?:thích|prefer|like|muốn|want)\s+(.{3,80}?)(?=\s+(?:và|and)\b|[.!?。]|$)/iu,
        extract: (m, ctx) => ({ subject: ctx.senderName, relation: 'prefers', object: this.cleanObject(m[1]) }),
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
