"use strict";
/**
 * Temporal Lobe — Language & Semantic Processing
 *
 * Like the brain's temporal lobe, this module handles:
 * - Language comprehension & generation
 * - Semantic memory (word meanings, concepts, relationships)
 * - Context management (conversation history, active topics)
 * - Multi-modal integration (text + audio + visual language)
 *
 * Key areas:
 * - Wernicke's area: Language comprehension
 * - Semantic memory: Concept relationships
 * - Context window: Active conversation state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalLobe = void 0;
// ============================================================================
// Temporal Lobe Class
// ============================================================================
class TemporalLobe {
    config;
    /** Semantic memory: concept graph */
    semanticMemory;
    /** Current conversation context */
    contextWindow;
    /** Language patterns for comprehension */
    languagePatterns;
    /** Concept activation decay rate (per minute) */
    ACTIVATION_DECAY = 0.1;
    /** Minimum activation to keep in active concepts */
    MIN_ACTIVATION = 0.1;
    constructor(config) {
        this.config = config;
        this.semanticMemory = new Map();
        this.contextWindow = {
            messages: [],
            activeConcepts: new Map(),
            currentTopic: 'general',
            topicHistory: [],
            windowSize: 10, // keep last 10 messages
        };
        this.languagePatterns = this.initializeLanguagePatterns();
        // Initialize some basic concepts
        this.initializeBasicConcepts();
    }
    // ==========================================================================
    // Language Comprehension
    // ==========================================================================
    /**
     * Comprehend incoming text and extract semantic representation
     */
    comprehend(text, context) {
        // Extract concepts (keywords, entities, topics)
        const concepts = this.extractConcepts(text);
        // Detect relationships between concepts
        const relations = this.detectRelations(text, concepts);
        // Analyze sentiment
        const sentiment = this.analyzeSentiment(text);
        // Detect intent
        const intent = this.detectIntent(text);
        // Calculate confidence
        const confidence = this.calculateConfidence(concepts, relations);
        // Update context window
        if (context) {
            this.updateContext({
                role: context.role,
                content: text,
                timestamp: context.timestamp,
                concepts,
            });
        }
        // Activate concepts in semantic memory
        this.activateConcepts(concepts);
        return {
            concepts,
            relations,
            sentiment,
            intent,
            confidence,
        };
    }
    /**
     * Extract key concepts from text
     */
    extractConcepts(text) {
        const concepts = [];
        const lowerText = text.toLowerCase();
        // Extract from semantic memory (known concepts)
        for (const [concept, node] of this.semanticMemory.entries()) {
            if (lowerText.includes(concept.toLowerCase())) {
                concepts.push(concept);
                node.accessCount++;
                node.lastAccessed = Date.now();
            }
        }
        // Extract common nouns and verbs (simple heuristic)
        // In production, use NLP library like compromise or spaCy
        const words = text.split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        for (const word of words) {
            const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleaned.length > 3 && !stopWords.has(cleaned)) {
                if (!concepts.includes(cleaned)) {
                    concepts.push(cleaned);
                }
            }
        }
        return concepts.slice(0, 10); // limit to top 10 concepts
    }
    /**
     * Detect relationships between concepts
     */
    detectRelations(text, concepts) {
        const relations = [];
        // Simple pattern matching for common relations
        // In production, use dependency parsing
        for (let i = 0; i < concepts.length; i++) {
            for (let j = i + 1; j < concepts.length; j++) {
                const concept1 = concepts[i];
                const concept2 = concepts[j];
                // Check if concepts appear close together (within 5 words)
                const regex = new RegExp(`${concept1}.{0,50}${concept2}`, 'i');
                if (regex.test(text)) {
                    relations.push({
                        from: concept1,
                        to: concept2,
                        type: 'related-to',
                        strength: 0.5,
                    });
                }
            }
        }
        return relations;
    }
    /**
     * Analyze sentiment of text
     */
    analyzeSentiment(text) {
        // Simple sentiment analysis
        // In production, use sentiment analysis library
        const positiveWords = ['good', 'great', 'awesome', 'excellent', 'love', 'like', 'happy', 'tốt', 'hay', 'đỉnh', 'thích', 'vui'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'tệ', 'dở', 'ghét', 'buồn', 'tức'];
        const lowerText = text.toLowerCase();
        let score = 0;
        for (const word of positiveWords) {
            if (lowerText.includes(word))
                score += 0.2;
        }
        for (const word of negativeWords) {
            if (lowerText.includes(word))
                score -= 0.2;
        }
        return Math.max(-1, Math.min(1, score));
    }
    /**
     * Detect user intent
     */
    detectIntent(text) {
        const lowerText = text.toLowerCase();
        // Match against language patterns
        for (const pattern of this.languagePatterns) {
            if (pattern.pattern instanceof RegExp) {
                if (pattern.pattern.test(lowerText)) {
                    return pattern.meaning;
                }
            }
            else {
                // Array of keywords
                if (pattern.pattern.some(kw => lowerText.includes(kw))) {
                    return pattern.meaning;
                }
            }
        }
        return 'unknown';
    }
    /**
     * Calculate confidence in semantic representation
     */
    calculateConfidence(concepts, relations) {
        // More concepts and relations = higher confidence
        const conceptScore = Math.min(1, concepts.length / 5);
        const relationScore = Math.min(1, relations.length / 3);
        return (conceptScore + relationScore) / 2;
    }
    // ==========================================================================
    // Semantic Memory Management
    // ==========================================================================
    /**
     * Get concept from semantic memory
     */
    getSemanticMemory(concept) {
        const node = this.semanticMemory.get(concept);
        if (node) {
            node.lastAccessed = Date.now();
            node.accessCount++;
        }
        return node;
    }
    /**
     * Add or update concept in semantic memory
     */
    addConcept(concept, definition, examples = []) {
        const existing = this.semanticMemory.get(concept);
        if (existing) {
            // Update existing
            existing.definition = definition;
            existing.examples.push(...examples);
            existing.lastAccessed = Date.now();
            existing.accessCount++;
        }
        else {
            // Create new
            this.semanticMemory.set(concept, {
                name: concept,
                definition,
                relatedConcepts: [],
                examples,
                lastAccessed: Date.now(),
                accessCount: 1,
                emotionalValence: 0,
            });
        }
    }
    /**
     * Link two concepts with a relationship
     */
    linkConcepts(concept1, concept2, relationType, strength = 0.5) {
        const node1 = this.semanticMemory.get(concept1);
        const node2 = this.semanticMemory.get(concept2);
        if (!node1 || !node2)
            return;
        // Add bidirectional link
        const existing1 = node1.relatedConcepts.find(r => r.concept === concept2);
        if (existing1) {
            existing1.strength = Math.min(1, existing1.strength + 0.1); // reinforce
        }
        else {
            node1.relatedConcepts.push({ concept: concept2, relationType, strength });
        }
        const existing2 = node2.relatedConcepts.find(r => r.concept === concept1);
        if (existing2) {
            existing2.strength = Math.min(1, existing2.strength + 0.1);
        }
        else {
            node2.relatedConcepts.push({ concept: concept1, relationType, strength });
        }
    }
    /**
     * Activate concepts (increase activation level)
     */
    activateConcepts(concepts) {
        for (const concept of concepts) {
            const current = this.contextWindow.activeConcepts.get(concept) || 0;
            this.contextWindow.activeConcepts.set(concept, Math.min(1, current + 0.3));
        }
    }
    /**
     * Decay concept activation over time
     */
    decayActivation(minutesElapsed) {
        const decay = this.ACTIVATION_DECAY * minutesElapsed;
        for (const [concept, activation] of this.contextWindow.activeConcepts.entries()) {
            const newActivation = activation - decay;
            if (newActivation < this.MIN_ACTIVATION) {
                this.contextWindow.activeConcepts.delete(concept);
            }
            else {
                this.contextWindow.activeConcepts.set(concept, newActivation);
            }
        }
    }
    // ==========================================================================
    // Context Management
    // ==========================================================================
    /**
     * Update conversation context with new message
     */
    updateContext(message) {
        this.contextWindow.messages.push(message);
        // Trim to window size
        if (this.contextWindow.messages.length > this.contextWindow.windowSize) {
            this.contextWindow.messages.shift();
        }
        // Update current topic if needed
        this.updateCurrentTopic(message.concepts);
    }
    /**
     * Get relevant context for a query
     */
    getRelevantContext(query) {
        // For now, return full context
        // In production, filter by relevance to query
        return this.contextWindow;
    }
    /**
     * Get currently active concepts
     */
    getActiveConcepts() {
        return Array.from(this.contextWindow.activeConcepts.keys())
            .sort((a, b) => {
            const aVal = this.contextWindow.activeConcepts.get(a) || 0;
            const bVal = this.contextWindow.activeConcepts.get(b) || 0;
            return bVal - aVal;
        });
    }
    /**
     * Update current topic based on active concepts
     */
    updateCurrentTopic(newConcepts) {
        // Simple heuristic: most activated concept is the topic
        const topConcept = this.getActiveConcepts()[0];
        if (topConcept && topConcept !== this.contextWindow.currentTopic) {
            // Topic changed
            this.contextWindow.topicHistory.push({
                topic: this.contextWindow.currentTopic,
                startTime: this.contextWindow.topicHistory[this.contextWindow.topicHistory.length - 1]?.endTime || Date.now() - 60000,
                endTime: Date.now(),
            });
            this.contextWindow.currentTopic = topConcept;
        }
    }
    /**
     * Clear context window (start fresh conversation)
     */
    clearContext() {
        this.contextWindow.messages = [];
        this.contextWindow.activeConcepts.clear();
        this.contextWindow.currentTopic = 'general';
    }
    // ==========================================================================
    // Language Generation (basic)
    // ==========================================================================
    /**
     * Generate response based on intent and context
     * (This is a simple version; in production, integrate with LLM)
     */
    generateResponse(intent, context) {
        // This is a placeholder
        // In production, this would interface with the LLM
        // or use template-based generation
        return `[Temporal: Detected intent '${intent}' with ${context.activeConcepts.size} active concepts]`;
    }
    // ==========================================================================
    // Initialization
    // ==========================================================================
    /**
     * Initialize basic language patterns
     */
    initializeLanguagePatterns() {
        return [
            { name: 'question', pattern: /^(what|who|where|when|why|how|which|whose|whom)\b/i, meaning: 'question', confidence: 0.9 },
            { name: 'command', pattern: ['please', 'can you', 'could you', 'would you', 'làm', 'tạo', 'viết', 'check'], meaning: 'command', confidence: 0.8 },
            { name: 'greeting', pattern: ['hello', 'hi', 'hey', 'chào', 'xin chào'], meaning: 'greeting', confidence: 0.9 },
            { name: 'thanks', pattern: ['thank', 'thanks', 'cảm ơn', 'cám ơn'], meaning: 'gratitude', confidence: 0.9 },
            { name: 'affirmation', pattern: ['yes', 'yeah', 'yep', 'ok', 'okay', 'sure', 'đúng', 'được', 'ừ'], meaning: 'affirmation', confidence: 0.8 },
            { name: 'negation', pattern: ['no', 'nope', 'not', 'don\'t', 'không', 'chưa'], meaning: 'negation', confidence: 0.8 },
        ];
    }
    /**
     * Initialize basic semantic concepts
     */
    initializeBasicConcepts() {
        // Add some basic concepts
        this.addConcept('code', 'Computer programming and software development', ['write code', 'debug code', 'review code']);
        this.addConcept('bug', 'Software error or defect', ['fix bug', 'found a bug', 'bug report']);
        this.addConcept('deploy', 'Release software to production', ['deploy to production', 'deployment failed']);
        this.addConcept('test', 'Software testing and validation', ['run tests', 'unit test', 'integration test']);
        // Link related concepts
        this.linkConcepts('code', 'bug', 'has-a', 0.7);
        this.linkConcepts('bug', 'test', 'related-to', 0.6);
        this.linkConcepts('code', 'deploy', 'related-to', 0.5);
    }
    // ==========================================================================
    // Introspection & Debugging
    // ==========================================================================
    /**
     * Get current state for debugging
     */
    getState() {
        return {
            semanticMemorySize: this.semanticMemory.size,
            activeConceptsCount: this.contextWindow.activeConcepts.size,
            currentTopic: this.contextWindow.currentTopic,
            contextWindowSize: this.contextWindow.messages.length,
            topActiveConcepts: this.getActiveConcepts().slice(0, 5),
        };
    }
}
exports.TemporalLobe = TemporalLobe;
//# sourceMappingURL=temporal.js.map