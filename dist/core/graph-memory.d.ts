/**
 * Graph Memory — entity/relationship memory inside AgentBrain's brain.db
 *
 * This ports the standalone memory-graph shape into AgentBrain without keeping
 * a second SQLite database. It stores graph_entities, graph_relationships, and
 * graph_conversations through BrainDatabase.
 */
import { BrainDatabase } from '../storage/brain-db.js';
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
export declare class GraphMemory {
    private db;
    constructor(db: BrainDatabase);
    rememberKnowledge(input: RememberKnowledgeInput): {
        entities: number;
        relationships: number;
    };
    rememberConversationTurn(input: {
        message: string;
        response: string;
        timestamp: string;
        entityNames?: string[];
    }): void;
    recall(query: string, options?: {
        maxHops?: number;
        limit?: number;
    }): GraphRecallResult;
    recallEntity(entityName: string, maxHops?: number): GraphRecallResult;
    getStats(): {
        entities: number;
        relationships: number;
        conversations: number;
    };
    private rankEntities;
    private formatContext;
    private tokenize;
    private toEntity;
    private toRelationship;
    private parseJson;
    private key;
}
//# sourceMappingURL=graph-memory.d.ts.map