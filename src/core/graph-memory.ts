/**
 * Graph Memory — entity/relationship memory inside AgentBrain's brain.db
 *
 * This ports the standalone memory-graph shape into AgentBrain without keeping
 * a second SQLite database. It stores graph_entities, graph_relationships, and
 * graph_conversations through BrainDatabase.
 */

import { BrainDatabase, GraphEntityRow, GraphRelationshipRow } from '../storage/brain-db.js';
import type { Entity as ExtractedEntity, KnowledgeRelationship, ExtractionResult } from './knowledge-extractor.js';

export interface GraphEntity {
  id: string;
  name: string;
  type: string;
  properties: Record<string, unknown>;
  firstSeen: string;
  lastSeen: string;
  mentionCount: number;
  confidence: number;
}

export interface GraphRelationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  properties: Record<string, unknown>;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  validUntil?: string;
  sourceMemoryId?: string;
}

export interface GraphSearchResult {
  entity: GraphEntity;
  score: number;
  source: 'keyword' | 'graph';
  hops: number;
}

export interface GraphRecallResult {
  query: string;
  entities: GraphSearchResult[];
  relationships: GraphRelationship[];
  context: string[];
}

export interface RememberKnowledgeInput {
  entities?: ExtractedEntity[];
  relationships?: KnowledgeRelationship[];
  extraction?: ExtractionResult;
  timestamp: string;
  sourceMemoryId?: string;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'what', 'when',
  'anh', 'em', 'sếp', 'sep', 'toi', 'tôi', 'ban', 'bạn', 'cua', 'của',
  'voi', 'với', 'cho', 'la', 'là', 'co', 'có', 'duoc', 'được', 'nay', 'này',
  'hai', 'mot', 'một', 'nhung', 'nhưng', 'thi', 'thì', 'di', 'đi',
]);

export class GraphMemory {
  private db: BrainDatabase;

  constructor(db: BrainDatabase) {
    this.db = db;
  }

  rememberKnowledge(input: RememberKnowledgeInput): { entities: number; relationships: number } {
    const extraction = input.extraction;
    const entities = input.entities || extraction?.entities || [];
    const relationships = input.relationships || extraction?.relationships || [];
    const entityIds = new Map<string, string>();

    for (const entity of entities) {
      const id = this.db.upsertGraphEntity({
        name: entity.name,
        type: entity.type,
        properties: {
          aliases: entity.aliases,
          source: 'knowledge-extractor',
        },
        timestamp: input.timestamp,
        confidence: 0.75,
      });
      entityIds.set(this.key(entity.name, entity.type), id);
      entityIds.set(entity.name.toLowerCase(), id);
    }

    let savedRelationships = 0;
    for (const rel of relationships) {
      const fromType = rel.fromType || 'concept';
      const toType = rel.toType || 'concept';
      const fromId = entityIds.get(this.key(rel.from, fromType))
        || entityIds.get(rel.from.toLowerCase())
        || this.db.upsertGraphEntity({
          name: rel.from,
          type: fromType,
          timestamp: input.timestamp,
          confidence: rel.confidence,
        });
      const toId = entityIds.get(this.key(rel.to, toType))
        || entityIds.get(rel.to.toLowerCase())
        || this.db.upsertGraphEntity({
          name: rel.to,
          type: toType,
          timestamp: input.timestamp,
          confidence: rel.confidence,
        });

      this.db.upsertGraphRelationship({
        fromEntityId: fromId,
        toEntityId: toId,
        type: rel.type,
        properties: {
          ...rel.properties,
          source: rel.source,
        },
        confidence: rel.confidence,
        timestamp: input.timestamp,
        validUntil: rel.validUntil,
        sourceMemoryId: input.sourceMemoryId,
      });
      savedRelationships++;
    }

    return { entities: entities.length, relationships: savedRelationships };
  }

  rememberConversationTurn(input: {
    message: string;
    response: string;
    timestamp: string;
    entityNames?: string[];
  }): void {
    const entityNames = input.entityNames || [];
    this.db.addGraphConversation({
      role: 'user',
      content: input.message,
      timestamp: input.timestamp,
      entities: entityNames,
    });

    if (input.response.trim().length > 0) {
      this.db.addGraphConversation({
        role: 'assistant',
        content: input.response,
        timestamp: input.timestamp,
        entities: entityNames,
      });
    }
  }

  recall(query: string, options: { maxHops?: number; limit?: number } = {}): GraphRecallResult {
    const maxHops = options.maxHops ?? 1;
    const limit = options.limit ?? 8;
    const anchors = this.rankEntities(query, limit);
    const seen = new Map<string, GraphSearchResult>();
    const relationships = new Map<string, GraphRelationship>();
    const queue: Array<{ entity: GraphEntity; score: number; hops: number }> = [];

    for (const anchor of anchors) {
      seen.set(anchor.entity.id, anchor);
      queue.push({ entity: anchor.entity, score: anchor.score, hops: 0 });
    }

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (item.hops >= maxHops) continue;

      for (const relRow of this.db.getGraphRelationships(item.entity.id)) {
        const rel = this.toRelationship(relRow);
        relationships.set(rel.id, rel);

        const nextId = rel.fromEntityId === item.entity.id ? rel.toEntityId : rel.fromEntityId;
        if (seen.has(nextId)) continue;

        const nextRow = this.db.getGraphEntity(nextId);
        if (!nextRow) continue;

        const hopScore = item.score * 0.5 * Math.max(0.1, rel.confidence);
        if (hopScore < 0.08) continue;

        const next = this.toEntity(nextRow);
        const graphHit: GraphSearchResult = {
          entity: next,
          score: hopScore,
          source: 'graph',
          hops: item.hops + 1,
        };
        seen.set(next.id, graphHit);
        queue.push({ entity: next, score: hopScore, hops: item.hops + 1 });
      }
    }

    const entities = [...seen.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    const entityIds = new Set(entities.map(hit => hit.entity.id));
    const scopedRelationships = [...relationships.values()]
      .filter(rel => entityIds.has(rel.fromEntityId) || entityIds.has(rel.toEntityId))
      .slice(0, limit * 2);

    return {
      query,
      entities,
      relationships: scopedRelationships,
      context: this.formatContext(entities, scopedRelationships),
    };
  }

  recallEntity(entityName: string, maxHops: number = 1): GraphRecallResult {
    return this.recall(entityName, { maxHops, limit: 12 });
  }

  getStats(): { entities: number; relationships: number; conversations: number } {
    return this.db.getGraphStats();
  }

  private rankEntities(query: string, limit: number): GraphSearchResult[] {
    const terms = this.tokenize(query);
    if (terms.length === 0) return [];

    const rows = this.db.searchGraphEntities(terms.join(' '), Math.max(limit * 4, 24));
    const scored = rows.map(row => {
      const entity = this.toEntity(row);
      const haystack = `${entity.name} ${entity.type} ${JSON.stringify(entity.properties)}`.toLowerCase();
      let score = 0;

      for (const term of terms) {
        const name = entity.name.toLowerCase();
        if (name === term) score += 1.0;
        else if (name.includes(term)) score += 0.65;
        else if (haystack.includes(term)) score += 0.35;
      }

      score += Math.min(0.2, entity.mentionCount * 0.01);
      score += Math.min(0.15, entity.confidence * 0.1);

      return {
        entity,
        score: score / Math.max(terms.length, 1),
        source: 'keyword' as const,
        hops: 0,
      };
    });

    return scored
      .filter(result => result.score >= 0.18)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private formatContext(entities: GraphSearchResult[], relationships: GraphRelationship[]): string[] {
    const byId = new Map(entities.map(hit => [hit.entity.id, hit.entity]));
    const lines: string[] = [];

    for (const hit of entities) {
      const prefix = hit.hops === 0 ? 'Entity' : `Related entity (${hit.hops} hop)`;
      lines.push(`${prefix}: ${hit.entity.name} [${hit.entity.type}]`);
    }

    for (const rel of relationships) {
      const from = byId.get(rel.fromEntityId);
      const to = byId.get(rel.toEntityId);
      if (!from || !to) continue;
      lines.push(`Relationship: ${from.name} --${rel.relationType}--> ${to.name}`);
    }

    return lines;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^\p{L}\p{N}_-]+/u)
      .map(term => term.trim())
      .filter(term => term.length > 1 && !STOPWORDS.has(term))
      .slice(0, 12);
  }

  private toEntity(row: GraphEntityRow): GraphEntity {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      properties: this.parseJson(row.properties),
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      mentionCount: row.mention_count,
      confidence: row.confidence,
    };
  }

  private toRelationship(row: GraphRelationshipRow): GraphRelationship {
    return {
      id: row.id,
      fromEntityId: row.from_entity_id,
      toEntityId: row.to_entity_id,
      relationType: row.relation_type,
      properties: this.parseJson(row.properties),
      confidence: row.confidence,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      validUntil: row.valid_until || undefined,
      sourceMemoryId: row.source_memory_id || undefined,
    };
  }

  private parseJson(value: string): Record<string, unknown> {
    try {
      return JSON.parse(value || '{}');
    } catch {
      return {};
    }
  }

  private key(name: string, type: string): string {
    return `${type}:${name}`.toLowerCase();
  }
}
