/**
 * Entity Matcher — Extract and match entities for multi-signal retrieval
 *
 * Extracts named entities from queries and memories, then boosts
 * memories that share entities with the query.
 */
export interface Entity {
    text: string;
    type: 'name' | 'tool' | 'address' | 'number' | 'keyword';
    normalized: string;
}
export declare class EntityMatcher {
    /**
     * Extract entities from text
     */
    extractEntities(text: string): Entity[];
    /**
     * Calculate entity match score between query and memory
     * Returns 0-1 score based on shared entities
     */
    matchScore(queryEntities: Entity[], memoryEntities: Entity[]): number;
    /**
     * Get importance weight for entity type
     */
    private getEntityWeight;
    /**
     * Check if word is too common to be useful
     */
    private isCommonWord;
}
//# sourceMappingURL=entity-matcher.d.ts.map