/**
 * Unit tests for Temporal Lobe module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemporalLobe } from '../src/core/temporal.js';
import { BrainConfig } from '../src/core/config.js';

describe('TemporalLobe', () => {
  let temporal: TemporalLobe;
  let config: BrainConfig;

  beforeEach(() => {
    config = { agentId: 'test-agent', brainDir: '.test-brain' };
    temporal = new TemporalLobe(config);
  });

  describe('Language Comprehension', () => {
    it('should extract concepts from text', () => {
      const result = temporal.comprehend('Fix the bug in the code', { role: 'user', timestamp: Date.now() });
      
      expect(result.concepts).toContain('bug');
      expect(result.concepts).toContain('code');
      expect(result.concepts.length).toBeGreaterThan(0);
    });

    it('should detect positive sentiment', () => {
      const result = temporal.comprehend('This is great! I love it!', { role: 'user', timestamp: Date.now() });
      
      expect(result.sentiment).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const result = temporal.comprehend('This is terrible and I hate it', { role: 'user', timestamp: Date.now() });
      
      expect(result.sentiment).toBeLessThan(0);
    });

    it('should detect question intent', () => {
      const result = temporal.comprehend('What is the weather today?', { role: 'user', timestamp: Date.now() });
      
      expect(result.intent).toBe('question');
    });

    it('should detect command intent', () => {
      const result = temporal.comprehend('Please create a new file', { role: 'user', timestamp: Date.now() });
      
      expect(result.intent).toBe('command');
    });

    it('should calculate confidence', () => {
      const result = temporal.comprehend('Fix bug in code', { role: 'user', timestamp: Date.now() });
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Semantic Memory', () => {
    it('should add concept to semantic memory', () => {
      temporal.addConcept('testing', 'Software testing and validation', ['unit test', 'integration test']);
      
      const concept = temporal.getSemanticMemory('testing');
      expect(concept).toBeDefined();
      expect(concept?.name).toBe('testing');
      expect(concept?.definition).toBe('Software testing and validation');
    });

    it('should link concepts', () => {
      temporal.addConcept('code', 'Programming code', []);
      temporal.addConcept('bug', 'Software error', []);
      
      temporal.linkConcepts('code', 'bug', 'has-a', 0.7);
      
      const code = temporal.getSemanticMemory('code');
      expect(code?.relatedConcepts.some(r => r.concept === 'bug')).toBe(true);
    });

    it('should update access count', () => {
      temporal.addConcept('test', 'Testing', []);
      
      const before = temporal.getSemanticMemory('test');
      const accessCount1 = before?.accessCount || 0;
      
      temporal.getSemanticMemory('test');
      
      const after = temporal.getSemanticMemory('test');
      const accessCount2 = after?.accessCount || 0;
      
      expect(accessCount2).toBeGreaterThan(accessCount1);
    });
  });

  describe('Context Management', () => {
    it('should update context window', () => {
      temporal.comprehend('Hello', { role: 'user', timestamp: Date.now() });
      temporal.comprehend('How are you?', { role: 'user', timestamp: Date.now() });
      
      const context = temporal.getRelevantContext('');
      expect(context.messages.length).toBe(2);
    });

    it('should track active concepts', () => {
      temporal.comprehend('Fix the bug in the code', { role: 'user', timestamp: Date.now() });
      
      const activeConcepts = temporal.getActiveConcepts();
      expect(activeConcepts.length).toBeGreaterThan(0);
    });

    it('should decay concept activation', () => {
      temporal.comprehend('Fix bug', { role: 'user', timestamp: Date.now() });
      
      const before = temporal.getActiveConcepts().length;
      
      // Simulate 10 minutes passing
      temporal.decayActivation(10);
      
      const after = temporal.getActiveConcepts().length;
      expect(after).toBeLessThanOrEqual(before);
    });

    it('should clear context', () => {
      temporal.comprehend('Hello', { role: 'user', timestamp: Date.now() });
      temporal.clearContext();
      
      const context = temporal.getRelevantContext('');
      expect(context.messages.length).toBe(0);
    });
  });

  describe('State Introspection', () => {
    it('should return current state', () => {
      const state = temporal.getState();
      
      expect(state).toHaveProperty('semanticMemorySize');
      expect(state).toHaveProperty('activeConceptsCount');
      expect(state).toHaveProperty('currentTopic');
      expect(state).toHaveProperty('contextWindowSize');
    });
  });
});
