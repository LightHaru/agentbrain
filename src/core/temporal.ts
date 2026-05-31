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

import { BrainConfig } from './config.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SemanticRepresentation {
  /** Core concepts extracted from text */
  concepts: string[];
  
  /** Relationships between concepts */
  relations: Array<{
    from: string;
    to: string;
    type: 'is-a' | 'has-a' | 'related-to' | 'causes' | 'opposite-of';
    strength: number; // 0-1
  }>;
  
  /** Overall sentiment (-1 to 1) */
  sentiment: number;
  
  /** Detected intent */
  intent: string;
  
  /** Confidence in this representation */
  confidence: number;
}

export interface ConceptNode {
  /** Concept name/identifier */
  name: string;
  
  /** Human-readable definition */
  definition: string;
  
  /** Related concepts with connection strength */
  relatedConcepts: Array<{
    concept: string;
    relationType: string;
    strength: number; // 0-1, decays over time if not reinforced
  }>;
  
  /** Example usages */
  examples: string[];
  
  /** Last time this concept was accessed */
  lastAccessed: number;
  
  /** How many times accessed (for importance) */
  accessCount: number;
  
  /** Emotional valence associated with this concept */
  emotionalValence: number; // -1 to 1
}

export interface ContextWindow {
  /** Recent messages in conversation */
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    concepts: string[]; // extracted concepts
  }>;
  
  /** Currently active concepts (mentioned recently) */
  activeConcepts: Map<string, number>; // concept -> activation level (0-1)
  
  /** Current conversation topic */
  currentTopic: string;
  
  /** Previous topics in this conversation */
  topicHistory: Array<{ topic: string; startTime: number; endTime: number }>;
  
  /** Maximum messages to keep in window */
  windowSize: number;
}

export interface LanguagePattern {
  /** Pattern name */
  name: string;
  
  /** Regex or keyword pattern */
  pattern: RegExp | string[];
  
  /** What this pattern indicates */
  meaning: string;
  
  /** Confidence when matched */
  confidence: number;
}

// ============================================================================
// Temporal Lobe Class
// ============================================================================

export class TemporalLobe {
  private config: BrainConfig;
  
  /** Semantic memory: concept graph */
  private semanticMemory: Map<string, ConceptNode>;
  
  /** Current conversation context */
  private contextWindow: ContextWindow;
  
  /** Language patterns for comprehension */
  private languagePatterns: LanguagePattern[];
  
  /** Concept activation decay rate (per minute) */
  private readonly ACTIVATION_DECAY = 0.1;
  
  /** Minimum activation to keep in active concepts */
  private readonly MIN_ACTIVATION = 0.1;

  constructor(config: BrainConfig) {
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
  comprehend(text: string, context?: { role: string; timestamp: number }): SemanticRepresentation {
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
        role: context.role as 'user' | 'assistant' | 'system',
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
  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];
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
  private detectRelations(text: string, concepts: string[]): SemanticRepresentation['relations'] {
    const relations: SemanticRepresentation['relations'] = [];
    
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
  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis
    // In production, use sentiment analysis library
    
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'love', 'like', 'happy', 'tốt', 'hay', 'đỉnh', 'thích', 'vui'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'tệ', 'dở', 'ghét', 'buồn', 'tức'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    for (const word of positiveWords) {
      if (lowerText.includes(word)) score += 0.2;
    }
    
    for (const word of negativeWords) {
      if (lowerText.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  /**
   * Detect user intent
   */
  private detectIntent(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Match against language patterns
    for (const pattern of this.languagePatterns) {
      if (pattern.pattern instanceof RegExp) {
        if (pattern.pattern.test(lowerText)) {
          return pattern.meaning;
        }
      } else {
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
  private calculateConfidence(concepts: string[], relations: SemanticRepresentation['relations']): number {
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
  getSemanticMemory(concept: string): ConceptNode | undefined {
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
  addConcept(concept: string, definition: string, examples: string[] = []): void {
    const existing = this.semanticMemory.get(concept);
    
    if (existing) {
      // Update existing
      existing.definition = definition;
      existing.examples.push(...examples);
      existing.lastAccessed = Date.now();
      existing.accessCount++;
    } else {
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
  linkConcepts(concept1: string, concept2: string, relationType: string, strength: number = 0.5): void {
    const node1 = this.semanticMemory.get(concept1);
    const node2 = this.semanticMemory.get(concept2);
    
    if (!node1 || !node2) return;
    
    // Add bidirectional link
    const existing1 = node1.relatedConcepts.find(r => r.concept === concept2);
    if (existing1) {
      existing1.strength = Math.min(1, existing1.strength + 0.1); // reinforce
    } else {
      node1.relatedConcepts.push({ concept: concept2, relationType, strength });
    }
    
    const existing2 = node2.relatedConcepts.find(r => r.concept === concept1);
    if (existing2) {
      existing2.strength = Math.min(1, existing2.strength + 0.1);
    } else {
      node2.relatedConcepts.push({ concept: concept1, relationType, strength });
    }
  }

  /**
   * Activate concepts (increase activation level)
   */
  private activateConcepts(concepts: string[]): void {
    for (const concept of concepts) {
      const current = this.contextWindow.activeConcepts.get(concept) || 0;
      this.contextWindow.activeConcepts.set(concept, Math.min(1, current + 0.3));
    }
  }

  /**
   * Decay concept activation over time
   */
  decayActivation(minutesElapsed: number): void {
    const decay = this.ACTIVATION_DECAY * minutesElapsed;
    
    for (const [concept, activation] of this.contextWindow.activeConcepts.entries()) {
      const newActivation = activation - decay;
      
      if (newActivation < this.MIN_ACTIVATION) {
        this.contextWindow.activeConcepts.delete(concept);
      } else {
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
  updateContext(message: ContextWindow['messages'][0]): void {
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
  getRelevantContext(query: string): ContextWindow {
    // For now, return full context
    // In production, filter by relevance to query
    return this.contextWindow;
  }

  /**
   * Get currently active concepts
   */
  getActiveConcepts(): string[] {
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
  private updateCurrentTopic(newConcepts: string[]): void {
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
  clearContext(): void {
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
  generateResponse(intent: string, context: ContextWindow): string {
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
  private initializeLanguagePatterns(): LanguagePattern[] {
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
  private initializeBasicConcepts(): void {
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
