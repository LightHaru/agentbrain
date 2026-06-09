"use strict";
/**
 * Entity Matcher — Extract and match entities for multi-signal retrieval
 *
 * Extracts named entities from queries and memories, then boosts
 * memories that share entities with the query.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityMatcher = void 0;
class EntityMatcher {
    /**
     * Extract entities from text
     */
    extractEntities(text) {
        const entities = [];
        const normalized = text.toLowerCase();
        // Extract capitalized names (2+ consecutive capitalized words)
        const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
        const names = text.match(namePattern) || [];
        for (const name of names) {
            entities.push({
                text: name,
                type: 'name',
                normalized: name.toLowerCase(),
            });
        }
        // Extract tool/command names (words with underscores, dashes, or camelCase)
        const toolPattern = /\b[a-z][a-z0-9_-]*[a-z0-9]\b|\b[a-z]+[A-Z][a-zA-Z0-9]*\b/g;
        const tools = text.match(toolPattern) || [];
        for (const tool of tools) {
            if (tool.length > 3 && !this.isCommonWord(tool)) {
                entities.push({
                    text: tool,
                    type: 'tool',
                    normalized: tool.toLowerCase(),
                });
            }
        }
        // Extract addresses (0x... or wallet-like patterns)
        const addressPattern = /\b0x[a-fA-F0-9]{40}\b|\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
        const addresses = text.match(addressPattern) || [];
        for (const addr of addresses) {
            entities.push({
                text: addr,
                type: 'address',
                normalized: addr.toLowerCase(),
            });
        }
        // Extract numbers (including decimals, percentages)
        const numberPattern = /\b\d+(?:\.\d+)?%?\b/g;
        const numbers = text.match(numberPattern) || [];
        for (const num of numbers) {
            entities.push({
                text: num,
                type: 'number',
                normalized: num,
            });
        }
        // Extract important keywords (3+ chars, not common words)
        const words = normalized.split(/\s+/);
        for (const word of words) {
            if (word.length >= 3 && !this.isCommonWord(word) && !entities.some(e => e.normalized === word)) {
                entities.push({
                    text: word,
                    type: 'keyword',
                    normalized: word,
                });
            }
        }
        return entities;
    }
    /**
     * Calculate entity match score between query and memory
     * Returns 0-1 score based on shared entities
     */
    matchScore(queryEntities, memoryEntities) {
        if (queryEntities.length === 0)
            return 0;
        const querySet = new Set(queryEntities.map(e => e.normalized));
        const memorySet = new Set(memoryEntities.map(e => e.normalized));
        let matches = 0;
        let weightedMatches = 0;
        for (const qEntity of queryEntities) {
            if (memorySet.has(qEntity.normalized)) {
                matches++;
                // Weight by entity type importance
                const weight = this.getEntityWeight(qEntity.type);
                weightedMatches += weight;
            }
        }
        // Normalize by query entity count
        const rawScore = matches / queryEntities.length;
        const weightedScore = weightedMatches / (queryEntities.length * 1.5); // Max weight is 1.5
        // Return average of raw and weighted scores
        return (rawScore + weightedScore) / 2;
    }
    /**
     * Get importance weight for entity type
     */
    getEntityWeight(type) {
        switch (type) {
            case 'name': return 1.5;
            case 'address': return 1.5;
            case 'tool': return 1.2;
            case 'number': return 1.0;
            case 'keyword': return 0.8;
            default: return 1.0;
        }
    }
    /**
     * Check if word is too common to be useful
     */
    isCommonWord(word) {
        const common = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
            'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
            'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
            'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
            'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did',
            'em', 'anh', 'sếp', 'là', 'của', 'có', 'được', 'này', 'cho', 'với',
        ]);
        return common.has(word.toLowerCase());
    }
}
exports.EntityMatcher = EntityMatcher;
//# sourceMappingURL=entity-matcher.js.map