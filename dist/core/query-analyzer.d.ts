/**
 * Query Analyzer — Query Understanding for Context-Aware Memory Retrieval
 *
 * Analyzes user queries before memory recall to:
 * - Detect intent (status-check, technical, decision, how-to, general)
 * - Extract entities (projects, files, tech terms, people)
 * - Identify task type (coding, ops, content, crypto, project)
 * - Extract keywords for BM25 boost
 * - Assess complexity for memory budget
 *
 * This enables targeted retrieval instead of blind top-k similarity search.
 */
export interface QueryContext {
    intent: 'status-check' | 'technical-question' | 'decision-recall' | 'how-to' | 'general';
    entities: string[];
    taskType: string | null;
    keywords: string[];
    complexity: 'simple' | 'medium' | 'complex';
    filters: {
        memoryTypes?: Array<'episodic' | 'semantic' | 'procedural'>;
        tags?: string[];
        minConfidence?: number;
    };
}
export declare class QueryAnalyzer {
    private entityPatterns;
    /**
     * Analyze query and return rich context
     */
    analyze(query: string, topic?: string): Promise<QueryContext>;
    /**
     * Detect query intent
     */
    private detectIntent;
    /**
     * Extract named entities from query
     */
    private extractEntities;
    /**
     * Detect task type for candidate filtering (weighted scoring)
     */
    private detectTaskType;
    /**
     * Count how many keywords from list appear in query
     */
    private countMatches;
    /**
     * Extract important keywords for BM25 boost
     */
    private extractKeywords;
    /**
     * Assess query complexity to determine memory budget
     */
    private assessComplexity;
    /**
     * Build memory filters based on query analysis
     */
    private buildFilters;
    /**
     * Get memory limit based on query intent and complexity
     */
    getMemoryLimit(context: QueryContext): number;
    /**
     * Format query context for debugging
     */
    formatDebug(context: QueryContext): string;
}
//# sourceMappingURL=query-analyzer.d.ts.map