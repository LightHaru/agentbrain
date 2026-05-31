/**
 * Unit tests for Metacognition module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Metacognition } from '../src/core/metacognition.js';
import { BrainConfig } from '../src/core/config.js';

describe('Metacognition', () => {
  let meta: Metacognition;
  let config: BrainConfig;

  beforeEach(() => {
    config = { agentId: 'test-agent', brainDir: '.test-brain' };
    meta = new Metacognition(config);
  });

  describe('Self-Monitoring', () => {
    it('should monitor thinking process', () => {
      const process = {
        steps: [
          { action: 'Read input', reasoning: 'Need to understand the request', timestamp: Date.now() },
          { action: 'Plan approach', reasoning: 'Break down into steps', timestamp: Date.now() },
          { action: 'Execute', reasoning: 'Implement the solution', timestamp: Date.now() },
        ],
        duration: 5000,
        complexity: 0.5,
        successful: true,
      };

      const state = meta.monitorThinking(process);

      expect(state.confidence).toBeGreaterThan(0);
      expect(state.thinkingQuality).toBeGreaterThan(0);
      expect(state).toHaveProperty('uncertaintyAreas');
      expect(state).toHaveProperty('needsMoreInfo');
    });

    it('should detect high quality thinking', () => {
      const process = {
        steps: [
          { action: 'Step 1', reasoning: 'Clear reasoning for step 1', timestamp: Date.now() },
          { action: 'Step 2', reasoning: 'Clear reasoning for step 2', timestamp: Date.now() },
          { action: 'Step 3', reasoning: 'Clear reasoning for step 3', timestamp: Date.now() },
          { action: 'Step 4', reasoning: 'Clear reasoning for step 4', timestamp: Date.now() },
          { action: 'Step 5', reasoning: 'Clear reasoning for step 5', timestamp: Date.now() },
        ],
        duration: 3000,
        complexity: 0.4,
        successful: true,
      };

      const state = meta.monitorThinking(process);

      expect(state.thinkingQuality).toBeGreaterThan(0.5);
      expect(state.confidence).toBeGreaterThan(0.3);
    });

    it('should detect low quality thinking', () => {
      const process = {
        steps: [
          { action: 'Do something', reasoning: 'Maybe this works', timestamp: Date.now() },
        ],
        duration: 1000,
        complexity: 0.8,
        successful: false,
      };

      const state = meta.monitorThinking(process);

      expect(state.thinkingQuality).toBeLessThan(0.6);
      expect(state.uncertaintyAreas.length).toBeGreaterThan(0);
    });

    it('should detect need for more information', () => {
      const process = {
        steps: [
          { action: 'Analyze', reasoning: 'Need more information to proceed', timestamp: Date.now() },
        ],
        duration: 2000,
        complexity: 0.6,
      };

      const state = meta.monitorThinking(process);

      expect(state.needsMoreInfo).toBe(true);
    });
  });

  describe('Confidence Estimation', () => {
    it('should estimate high confidence', () => {
      const decision = {
        context: 'Choose between two well-known options',
        reasoning: 'Option A is better because it has proven track record, better performance, and lower cost. We have used it successfully in 5 previous projects.',
        dataQuality: 0.9,
        pastPerformance: 0.85,
      };

      const estimate = meta.estimateConfidence(decision);

      expect(estimate.overall).toBeGreaterThan(0.7);
      expect(estimate.uncertaintyFactors.length).toBe(0);
    });

    it('should estimate low confidence', () => {
      const decision = {
        context: 'New technology',
        reasoning: 'Maybe this works',
        dataQuality: 0.3,
        pastPerformance: 0.2,
      };

      const estimate = meta.estimateConfidence(decision);

      expect(estimate.overall).toBeLessThan(0.5);
      expect(estimate.uncertaintyFactors.length).toBeGreaterThan(0);
    });

    it('should provide confidence breakdown', () => {
      const decision = {
        context: 'Test decision',
        reasoning: 'Some reasoning here',
        dataQuality: 0.7,
        pastPerformance: 0.8,
      };

      const estimate = meta.estimateConfidence(decision);

      expect(estimate.breakdown).toHaveProperty('dataQuality');
      expect(estimate.breakdown).toHaveProperty('processQuality');
      expect(estimate.breakdown).toHaveProperty('outcomeClarity');
      expect(estimate.breakdown).toHaveProperty('pastPerformance');
    });
  });

  describe('Strategy Management', () => {
    it('should select appropriate strategy', () => {
      const performance = {
        successRate: 0.8,
        avgDuration: 5000,
        errorRate: 0.2,
        trend: 'stable' as const,
      };

      const strategy = meta.selectStrategy('This is a simple task', performance);

      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('direct');
    });

    it('should select decompose strategy for complex tasks', () => {
      const performance = {
        successRate: 0.6,
        avgDuration: 10000,
        errorRate: 0.4,
        trend: 'stable' as const,
      };

      const strategy = meta.selectStrategy('This is a complex multi-step task', performance);

      expect(strategy).toBeDefined();
      expect(strategy?.name).toBe('decompose');
    });

    it('should adjust strategy when performance declines', () => {
      const performance = {
        successRate: 0.3,
        avgDuration: 8000,
        errorRate: 0.7,
        trend: 'declining' as const,
      };

      // Select initial strategy
      meta.selectStrategy('Some task', performance);

      // Adjust based on poor performance
      const newStrategy = meta.adjustStrategy(performance);

      expect(newStrategy).toBeDefined();
      // Should suggest different strategy
    });

    it('should record strategy outcomes', () => {
      meta.recordStrategyOutcome('direct', true);
      meta.recordStrategyOutcome('direct', true);
      meta.recordStrategyOutcome('direct', false);

      // Success rate should be updated
      const state = meta.getState();
      expect(state).toBeDefined();
    });
  });

  describe('Reflection', () => {
    it('should reflect on successful actions', () => {
      const actions = [
        { action: 'Fix bug A', outcome: 'success' as const, reasoning: 'Added null check' },
        { action: 'Write test B', outcome: 'success' as const, reasoning: 'Good coverage' },
        { action: 'Deploy C', outcome: 'success' as const, reasoning: 'Smooth deployment' },
      ];

      const reflection = meta.reflect(actions);

      expect(reflection.whatWentWell.length).toBe(3);
      expect(reflection.whatWentWrong.length).toBe(0);
      expect(reflection.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should reflect on failed actions', () => {
      const actions = [
        { action: 'Deploy without testing', outcome: 'failure' as const, reasoning: 'Broke production' },
        { action: 'Refactor without tests', outcome: 'failure' as const, reasoning: 'Introduced bugs' },
      ];

      const reflection = meta.reflect(actions);

      expect(reflection.whatWentWrong.length).toBe(2);
      expect(reflection.lessonsLearned.length).toBeGreaterThan(0);
      expect(reflection.adjustments.length).toBeGreaterThan(0);
    });

    it('should reflect on mixed outcomes', () => {
      const actions = [
        { action: 'Task A', outcome: 'success' as const, reasoning: 'Good' },
        { action: 'Task B', outcome: 'failure' as const, reasoning: 'Bad' },
        { action: 'Task C', outcome: 'partial' as const, reasoning: 'OK' },
      ];

      const reflection = meta.reflect(actions);

      expect(reflection.whatWentWell.length).toBeGreaterThan(0);
      expect(reflection.whatWentWrong.length).toBeGreaterThan(0);
    });

    it('should store reflections', () => {
      const actions = [
        { action: 'Test', outcome: 'success' as const, reasoning: 'Good' },
      ];

      meta.reflect(actions);
      meta.reflect(actions);

      const reflections = meta.getReflections();
      expect(reflections.length).toBe(2);
    });

    it('should limit reflection history', () => {
      const actions = [
        { action: 'Test', outcome: 'success' as const, reasoning: 'Good' },
      ];

      // Add many reflections
      for (let i = 0; i < 60; i++) {
        meta.reflect(actions);
      }

      const reflections = meta.getReflections(100);
      expect(reflections.length).toBeLessThanOrEqual(50); // History size limit
    });
  });

  describe('State & Introspection', () => {
    it('should return current state', () => {
      const state = meta.getState();

      expect(state).toHaveProperty('confidence');
      expect(state).toHaveProperty('uncertaintyAreas');
      expect(state).toHaveProperty('thinkingQuality');
      expect(state).toHaveProperty('needsMoreInfo');
      expect(state).toHaveProperty('alternativeStrategies');
      expect(state).toHaveProperty('currentStrategy');
    });

    it('should generate summary', () => {
      const summary = meta.getSummary();

      expect(summary).toContain('Metacognition');
      expect(summary).toContain('Confidence');
      expect(summary).toContain('Quality');
    });
  });
});
