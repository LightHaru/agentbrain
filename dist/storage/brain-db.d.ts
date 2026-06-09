/**
 * BrainDatabase — SQLite storage layer for AgentBrain
 *
 * Replaces Markdown file storage with proper SQL:
 * - Atomic writes, no corruption
 * - Fast queries with indexes
 * - UNIQUE constraints prevent duplicates
 * - vec0 extension ready for embeddings
 * - Easy delete/update/query
 */
export interface MemoryRow {
    id: string;
    type: 'episodic' | 'semantic' | 'procedural';
    content: string;
    content_hash: string;
    timestamp: string;
    confidence: number;
    access_count: number;
    last_accessed: string;
    tags: string;
    embedding: Buffer | null;
}
export interface FactRow {
    id: string;
    subject: string;
    relation: string;
    object: string;
    confidence: number;
    source: string;
    timestamp: string;
    superseded_by: string | null;
    valid_from: string;
    valid_until: string | null;
}
export interface EntityRow {
    id: string;
    name: string;
    type: string;
    aliases: string;
    first_seen: string;
    last_seen: string;
}
export interface LessonRow {
    id: string;
    type: string;
    trigger_text: string;
    wrong: string;
    correct: string;
    confidence: number;
    occurrences: number;
    timestamp: string;
    last_applied: string;
    source: string;
}
export interface PatternRow {
    id: string;
    type: string;
    description: string;
    trigger_json: string;
    action: string;
    confidence: number;
    occurrences: number;
    last_triggered: string;
    cooldown_ms: number;
}
export interface RelationshipRow {
    user_id: string;
    user_name: string;
    depth: number;
    trust_level: number;
    total_interactions: number;
    positive_interactions: number;
    negative_interactions: number;
    last_interaction: string;
    preferences: string;
    emotional_history: string;
}
export interface PersonalityRow {
    trait: string;
    value: number;
    updated_at: string;
}
export interface ReflectionRow {
    id: string;
    timestamp: string;
    task_description: string;
    outcome: string;
    user_satisfaction: number;
    self_assessment: number;
    lessons_learned: string;
    adjustments: string;
}
export interface SkillRow {
    id: string;
    name: string;
    category: string;
    proficiency: number;
    times_used: number;
    last_used: string;
    successes: number;
    failures: number;
}
export interface HabitRow {
    id: string;
    pattern: string;
    action: string;
    frequency: number;
    confidence: number;
    first_seen: string;
    last_seen: string;
    active: number;
}
export declare class BrainDatabase {
    private db;
    private dbPath;
    constructor(dbPath: string);
    private initialize;
    insertMemory(memory: {
        id: string;
        type: string;
        content: string;
        timestamp: string;
        confidence: number;
        tags: string[];
    }): boolean;
    getMemories(type?: string, limit?: number): MemoryRow[];
    getAllMemories(): MemoryRow[];
    searchMemories(query: string, limit?: number): MemoryRow[];
    /**
     * BM25 full-text search using FTS5
     * Returns memories ranked by BM25 relevance score
     */
    bm25Search(query: string, limit?: number): Array<MemoryRow & {
        bm25_score: number;
    }>;
    updateMemoryAccess(id: string): void;
    deleteMemory(id: string): void;
    deleteMemoriesByContent(contentPattern: string): number;
    getMemoryStats(): {
        total: number;
        episodic: number;
        semantic: number;
        procedural: number;
    };
    insertFact(fact: {
        id: string;
        subject: string;
        relation: string;
        object: string;
        confidence: number;
        source: string;
        timestamp: string;
        validFrom?: string;
    }): void;
    getActiveFacts(subject?: string): FactRow[];
    /**
     * Get facts valid at a specific point in time
     */
    getFactsAt(timestamp: string, subject?: string): FactRow[];
    /**
     * Get currently valid facts (valid_until IS NULL)
     */
    getCurrentFacts(subject?: string): FactRow[];
    supersedeFact(oldFactId: string, newFactId: string, timestamp?: string): void;
    upsertEntity(entity: {
        name: string;
        type: string;
        aliases?: string[];
        timestamp: string;
    }): void;
    getEntities(type?: string): EntityRow[];
    insertLesson(lesson: {
        id: string;
        type: string;
        trigger: string;
        wrong: string;
        right: string;
        confidence: number;
        timestamp: string;
        source: string;
    }): void;
    reinforceLesson(id: string): void;
    getLessons(minConfidence?: number): LessonRow[];
    upsertPattern(pattern: {
        id: string;
        type: string;
        description: string;
        trigger: any;
        action: string;
        confidence: number;
        cooldownMs: number;
    }): void;
    getPatterns(): PatternRow[];
    updatePatternTriggered(id: string): void;
    upsertRelationship(rel: Partial<RelationshipRow> & {
        user_id: string;
    }): void;
    getRelationship(userId: string): RelationshipRow | undefined;
    getAllRelationships(): RelationshipRow[];
    setTrait(trait: string, value: number): void;
    getTraits(): Record<string, number>;
    insertReflection(ref: {
        id: string;
        timestamp: string;
        task: string;
        outcome: string;
        satisfaction: number;
        selfAssessment: number;
        lessons: string[];
        adjustments: any[];
    }): void;
    getReflections(limit?: number): ReflectionRow[];
    getReflectionStats(): {
        total: number;
        successRate: number;
        avgSatisfaction: number;
    };
    upsertSkill(skill: {
        id: string;
        name: string;
        category: string;
        proficiency: number;
        timesUsed: number;
        lastUsed: string;
        successes: number;
        failures: number;
    }): void;
    getSkills(): SkillRow[];
    upsertHabit(habit: {
        id: string;
        pattern: string;
        action: string;
        frequency: number;
        confidence: number;
        firstSeen: string;
        lastSeen: string;
        active: boolean;
    }): void;
    getActiveHabits(): HabitRow[];
    setMeta(key: string, value: string): void;
    getMeta(key: string): string | undefined;
    hashContent(content: string): string;
    close(): void;
    getDbPath(): string;
    /**
     * Run raw SQL (for advanced queries)
     */
    raw(sql: string, params?: any[]): any;
    /**
     * Transaction wrapper
     */
    transaction<T>(fn: () => T): T;
}
//# sourceMappingURL=brain-db.d.ts.map