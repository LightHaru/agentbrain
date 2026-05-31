/**
 * Unit tests for Working Memory module
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkingMemory } from '../src/core/working-memory.js';

describe('WorkingMemory', () => {
  let wm: WorkingMemory;

  beforeEach(() => {
    wm = new WorkingMemory(7); // Default capacity
  });

  describe('Basic Operations', () => {
    it('should add item to working memory', () => {
      const result = wm.add({
        content: 'Test item',
        type: 'fact',
        importance: 0.8,
        decayRate: 0.5,
      });
      
      expect(result).toBe(true);
      expect(wm.getAll().length).toBe(1);
    });

    it('should respect capacity limit', () => {
      // Add 7 items (at capacity)
      for (let i = 0; i < 7; i++) {
        wm.add({
          content: `Item ${i}`,
          type: 'fact',
          importance: 0.5,
          decayRate: 0.5,
        });
      }
      
      expect(wm.getAll().length).toBe(7);
      
      // Try to add 8th item (should remove lowest activation)
      const result = wm.add({
        content: 'Item 8',
        type: 'fact',
        importance: 0.9,
        decayRate: 0.5,
      });
      
      expect(result).toBe(true);
      expect(wm.getAll().length).toBe(7); // Still at capacity
    });

    it('should get item by ID', () => {
      wm.add({
        content: 'Test',
        type: 'goal',
        importance: 0.7,
        decayRate: 0.5,
      });
      
      const items = wm.getAll();
      const item = wm.get(items[0].id);
      
      expect(item).toBeDefined();
      expect(item?.content).toBe('Test');
    });

    it('should get items by type', () => {
      wm.add({ content: 'Goal 1', type: 'goal', importance: 0.8, decayRate: 0.5 });
      wm.add({ content: 'Fact 1', type: 'fact', importance: 0.6, decayRate: 0.5 });
      wm.add({ content: 'Goal 2', type: 'goal', importance: 0.7, decayRate: 0.5 });
      
      const goals = wm.getByType('goal');
      expect(goals.length).toBe(2);
      expect(goals.every(g => g.type === 'goal')).toBe(true);
    });

    it('should remove item', () => {
      wm.add({ content: 'Test', type: 'fact', importance: 0.5, decayRate: 0.5 });
      const items = wm.getAll();
      
      const removed = wm.remove(items[0].id);
      expect(removed).toBe(true);
      expect(wm.getAll().length).toBe(0);
    });

    it('should clear all items', () => {
      wm.add({ content: 'Item 1', type: 'fact', importance: 0.5, decayRate: 0.5 });
      wm.add({ content: 'Item 2', type: 'fact', importance: 0.5, decayRate: 0.5 });
      
      wm.clear();
      expect(wm.getAll().length).toBe(0);
    });
  });

  describe('Refresh & Decay', () => {
    it('should refresh item activation', () => {
      wm.add({ content: 'Test', type: 'fact', importance: 0.5, decayRate: 0.5 });
      const items = wm.getAll();
      const itemId = items[0].id;
      const initialActivation = items[0].activation;
      
      // Decay first to bring activation down
      wm.decay(10);
      const afterDecay = wm.getAll().find(i => i.id === itemId)?.activation || 0;
      expect(afterDecay).toBeLessThan(initialActivation);
      
      // Refresh
      wm.refresh(itemId);
      const afterRefresh = wm.getAll().find(i => i.id === itemId)?.activation || 0;
      expect(afterRefresh).toBeGreaterThan(afterDecay);
    });

    it('should decay items over time', () => {
      wm.add({ content: 'Test', type: 'fact', importance: 0.5, decayRate: 1.0 });
      const items = wm.getAll();
      const initialActivation = items[0].activation;
      
      wm.decay(10); // 10 minutes
      
      const afterDecay = wm.get(items[0].id)?.activation || 0;
      expect(afterDecay).toBeLessThan(initialActivation);
    });

    it('should remove items with low activation', () => {
      wm.add({ content: 'Test', type: 'fact', importance: 0.1, decayRate: 1.0 });
      
      // Heavy decay
      wm.decay(100);
      
      expect(wm.getAll().length).toBe(0); // Should be removed
    });
  });

  describe('Cognitive Load', () => {
    it('should calculate cognitive load', () => {
      const load1 = wm.getCognitiveLoad();
      expect(load1).toBe(0); // Empty
      
      // Add items
      for (let i = 0; i < 5; i++) {
        wm.add({
          content: `Item ${i}`,
          type: 'fact',
          importance: 0.8,
          decayRate: 0.5,
        });
      }
      
      const load2 = wm.getCognitiveLoad();
      expect(load2).toBeGreaterThan(load1);
      expect(load2).toBeLessThanOrEqual(1);
    });

    it('should detect overload', () => {
      expect(wm.isOverloaded()).toBe(false);
      
      // Fill to capacity with high importance items
      for (let i = 0; i < 7; i++) {
        wm.add({
          content: `Item ${i}`,
          type: 'fact',
          importance: 0.9,
          decayRate: 0.5,
        });
      }
      
      expect(wm.isOverloaded()).toBe(true);
    });

    it('should report available capacity', () => {
      expect(wm.getAvailableCapacity()).toBe(7);
      
      wm.add({ content: 'Test', type: 'fact', importance: 0.5, decayRate: 0.5 });
      expect(wm.getAvailableCapacity()).toBe(6);
    });
  });

  describe('Chunking', () => {
    it('should chunk related items', () => {
      wm.add({ content: 'Item 1', type: 'fact', importance: 0.5, decayRate: 0.5 });
      wm.add({ content: 'Item 2', type: 'fact', importance: 0.5, decayRate: 0.5 });
      wm.add({ content: 'Item 3', type: 'fact', importance: 0.5, decayRate: 0.5 });
      
      const items = wm.getAll();
      const ids = items.map(i => i.id);
      
      const result = wm.chunk(ids, 'Combined items');
      
      expect(result).toBeDefined();
      expect(result?.spaceSaved).toBe(2); // 3 items → 1 chunk = 2 saved
      expect(wm.getAll().length).toBe(1); // Only chunk remains
    });

    it('should not chunk single item', () => {
      wm.add({ content: 'Item 1', type: 'fact', importance: 0.5, decayRate: 0.5 });
      
      const items = wm.getAll();
      const result = wm.chunk([items[0].id], 'Single item');
      
      expect(result).toBeNull();
    });
  });

  describe('Rehearsal', () => {
    it('should rehearse high-importance items', () => {
      wm.add({ content: 'Important', type: 'goal', importance: 0.9, decayRate: 0.5 });
      wm.add({ content: 'Not important', type: 'fact', importance: 0.3, decayRate: 0.5 });
      
      // Decay first
      wm.decay(5);
      
      const items = wm.getAll();
      const importantBefore = items.find(i => i.content === 'Important')?.activation || 0;
      
      // Rehearse
      wm.rehearse();
      
      const itemsAfter = wm.getAll();
      const importantAfter = itemsAfter.find(i => i.content === 'Important')?.activation || 0;
      
      expect(importantAfter).toBeGreaterThan(importantBefore);
    });
  });

  describe('State & Capacity', () => {
    it('should return current state', () => {
      const state = wm.getState();
      
      expect(state).toHaveProperty('items');
      expect(state).toHaveProperty('capacity');
      expect(state).toHaveProperty('cognitiveLoad');
      expect(state).toHaveProperty('isOverloaded');
    });

    it('should set capacity', () => {
      wm.setCapacity(5);
      expect(wm.getAvailableCapacity()).toBe(5);
      
      // Add 7 items
      for (let i = 0; i < 7; i++) {
        wm.add({
          content: `Item ${i}`,
          type: 'fact',
          importance: 0.5,
          decayRate: 0.5,
        });
      }
      
      // Should only keep 5 (capacity limit)
      expect(wm.getAll().length).toBe(5);
    });

    it('should generate summary', () => {
      const summary = wm.getSummary();
      expect(summary).toContain('Working Memory');
      expect(summary).toContain('0/7 items');
    });
  });
});
