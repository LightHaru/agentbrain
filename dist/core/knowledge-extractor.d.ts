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
    supersededBy?: string;
    validFrom?: string;
    validUntil?: string;
}
export interface ProceduralMemory {
    id: string;
    type: 'source_routing' | 'workflow' | 'shortcut';
    trigger: string;
    action: string;
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
    summary: string;
}
interface ExtractionContext {
    senderName: string;
    timestamp: string;
    previousFacts: Fact[];
}
export declare class KnowledgeExtractor {
    private entities;
    private facts;
    private proceduralMemories;
    private patterns;
    constructor();
    /**
     * Extract structured knowledge from a conversation turn
     */
    extract(message: string, response: string, context: ExtractionContext): ExtractionResult;
    /**
     * Query known facts about a subject
     */
    queryFacts(subject: string): Fact[];
    /**
     * Query facts valid at a specific point in time
     */
    queryFactsAtTime(subject: string, timestamp: string): Fact[];
    /**
     * Get all known entities
     */
    getEntities(): Entity[];
    /**
     * Get active facts (not superseded)
     */
    getActiveFacts(): Fact[];
    /**
     * Get procedural memories (source routing, workflows)
     */
    getProceduralMemories(): ProceduralMemory[];
    /**
     * Query procedural memory for a trigger
     */
    queryProcedural(trigger: string): ProceduralMemory | null;
    /**
     * Load persisted knowledge
     */
    loadFacts(facts: Fact[]): void;
    loadEntities(entities: Entity[]): void;
    loadProceduralMemories(memories: ProceduralMemory[]): void;
    private extractFromText;
    private extractEntities;
    private cleanSubject;
    private cleanObject;
    /**
     * Normalized "core" of a subject for conflict detection: drop leading time /
     * filler words (giờ, hiện tại, bây giờ) and generic qualifiers (chính, chủ)
     * and articles so "database chính của dự án" and "giờ dự án" match on the
     * shared head noun ("dự án"). Used only for supersede matching.
     */
    private subjectCore;
    /** Do two subjects refer to the same thing? (core token containment) */
    private sameSubject;
    /** Relations that express the same kind of assertion (value assignment). */
    private compatibleRelation;
    private makeEntity;
    private detectCorrections;
    private summarize;
    private extractProceduralMemories;
    private buildPatterns;
}
export {};
//# sourceMappingURL=knowledge-extractor.d.ts.map