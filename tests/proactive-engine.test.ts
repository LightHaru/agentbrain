import { describe, it, expect, beforeEach } from 'vitest';
import { ProactiveEngine } from '../src/core/proactive-engine.js';

describe('ProactiveEngine', () => {
  let engine: ProactiveEngine;

  beforeEach(() => {
    engine = new ProactiveEngine();
  });

  describe('checkTriggers', () => {
    it('triggers time-based patterns', () => {
      const suggestions = engine.checkTriggers({
        currentHour: 3,
        lastMessage: 'check something',
      });
      // default-late-night should trigger at hour 3
      const lateNight = suggestions.find(s => s.pattern.id === 'default-late-night');
      expect(lateNight).toBeDefined();
    });

    it('does not trigger outside time window', () => {
      const suggestions = engine.checkTriggers({
        currentHour: 14,
        lastMessage: 'hello',
      });
      const lateNight = suggestions.find(s => s.pattern.id === 'default-late-night');
      expect(lateNight).toBeUndefined();
    });

    it('respects cooldown', () => {
      // First trigger
      engine.checkTriggers({ currentHour: 3, lastMessage: 'test' });
      // Second trigger immediately — should be blocked by cooldown
      const second = engine.checkTriggers({ currentHour: 3, lastMessage: 'test' });
      const lateNight = second.find(s => s.pattern.id === 'default-late-night');
      expect(lateNight).toBeUndefined();
    });

    it('triggers keyword-based patterns', () => {
      engine.learnPattern({
        type: 'routine',
        description: 'User checks PRL price',
        trigger: { kind: 'keyword', keywords: ['giá', 'price', 'PRL'] },
        action: 'Check PRL price on DexScreener',
      });

      const suggestions = engine.checkTriggers({
        currentHour: 14,
        lastMessage: 'giá PRL bao nhiêu',
      });
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('triggers threshold-based patterns', () => {
      const suggestions = engine.checkTriggers({
        currentHour: 14,
        lastMessage: 'check miner',
        metrics: { hashrate_th: 10 },
      });
      const low = suggestions.find(s => s.pattern.id === 'default-hashrate-low');
      expect(low).toBeDefined();
    });

    it('does not trigger threshold when above', () => {
      const suggestions = engine.checkTriggers({
        currentHour: 14,
        lastMessage: 'check miner',
        metrics: { hashrate_th: 20 },
      });
      const low = suggestions.find(s => s.pattern.id === 'default-hashrate-low');
      expect(low).toBeUndefined();
    });
  });

  describe('learnPattern', () => {
    it('creates new pattern', () => {
      const pattern = engine.learnPattern({
        type: 'routine',
        description: 'Morning check',
        trigger: { kind: 'time', hours: [8, 9] },
        action: 'Good morning check',
      });
      expect(pattern.id).toMatch(/^pat-/);
      expect(pattern.confidence).toBe(0.5);
    });

    it('reinforces existing pattern', () => {
      engine.learnPattern({
        type: 'routine',
        description: 'Morning check',
        trigger: { kind: 'time', hours: [8] },
        action: 'Check',
      });
      const second = engine.learnPattern({
        type: 'routine',
        description: 'Morning check',
        trigger: { kind: 'time', hours: [8] },
        action: 'Check',
      });
      expect(second.occurrences).toBe(2);
      expect(second.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('reinforce / weaken', () => {
    it('increases confidence on reinforce', () => {
      const pattern = engine.learnPattern({
        type: 'routine',
        description: 'Test pattern',
        trigger: { kind: 'time', hours: [10] },
        action: 'Test',
      });
      const before = pattern.confidence;
      engine.reinforce(pattern.id);
      expect(pattern.confidence).toBeGreaterThan(before);
    });

    it('decreases confidence on weaken', () => {
      const pattern = engine.learnPattern({
        type: 'routine',
        description: 'Test pattern',
        trigger: { kind: 'time', hours: [10] },
        action: 'Test',
      });
      const before = pattern.confidence;
      engine.weaken(pattern.id);
      expect(pattern.confidence).toBeLessThan(before);
    });
  });

  describe('recordAction + absence trigger', () => {
    it('triggers when action absent too long', () => {
      // default-no-backup triggers when memory_backup absent > 24h
      // Since we never recorded it, it should trigger
      const suggestions = engine.checkTriggers({
        currentHour: 14,
        lastMessage: 'hello',
      });
      const backup = suggestions.find(s => s.pattern.id === 'default-no-backup');
      expect(backup).toBeDefined();
    });

    it('does not trigger after action recorded', () => {
      engine.recordAction('memory_backup', new Date().toISOString());
      const suggestions = engine.checkTriggers({
        currentHour: 14,
        lastMessage: 'hello',
      });
      const backup = suggestions.find(s => s.pattern.id === 'default-no-backup');
      expect(backup).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('returns correct stats', () => {
      engine.learnPattern({
        type: 'opportunity',
        description: 'Custom',
        trigger: { kind: 'keyword', keywords: ['test'] },
        action: 'Do test',
      });
      const stats = engine.getStats();
      expect(stats.total).toBeGreaterThan(4); // 4 defaults + 1 learned
      expect(stats.learned).toBe(1);
    });
  });
});
