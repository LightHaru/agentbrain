/**
 * Tests for Anterior Cingulate module — Self-reflection & personality evolution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnteriorCingulate } from '../src/core/cingulate.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { defaultConfig } from '../src/core/config.js';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('AnteriorCingulate', () => {
  let acc: AnteriorCingulate;

  beforeEach(async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-acc-'));
    const config = { ...defaultConfig, brainDir: tempDir };
    const fileManager = new BrainFileManager(tempDir);
    await fileManager.ensureBrainStructure();
    acc = new AnteriorCingulate(config, fileManager);
    await acc.initialize();
  });

  describe('reflect', () => {
    it('creates a reflection for successful task', () => {
      const reflection = acc.reflect({
        taskDescription: 'Research PEPE token',
        userMessage: 'Cảm ơn em, hay quá!',
        agentResponse: 'Đây là phân tích PEPE...',
        userSentiment: 0.7,
        emotionalState: { mood: 'positive', intensity: 0.6, valence: 0.5, arousal: 0.4 },
      });

      expect(reflection.outcome).toBe('success');
      expect(reflection.userSatisfaction).toBe(0.7);
      expect(reflection.selfAssessment).toBeGreaterThan(0.5);
    });

    it('creates a reflection for failed task', () => {
      const reflection = acc.reflect({
        taskDescription: 'Fix server bug',
        userMessage: 'Sai rồi em, không phải vậy',
        agentResponse: 'x',
        userSentiment: -0.6,
        emotionalState: { mood: 'concerned', intensity: 0.5, valence: -0.3, arousal: 0.4 },
      });

      expect(reflection.outcome).toBe('failure');
      expect(reflection.selfAssessment).toBeLessThan(0.5);
    });

    it('extracts lessons from failure', () => {
      const reflection = acc.reflect({
        taskDescription: 'Write long report',
        userMessage: 'Sai hết rồi, không hiểu gì cả',
        agentResponse: 'A'.repeat(2000), // very long response
        userSentiment: -0.7,
        emotionalState: { mood: 'neutral', intensity: 0.5, valence: 0, arousal: 0.3 },
      });

      expect(reflection.lessonsLearned.length).toBeGreaterThan(0);
      expect(reflection.lessonsLearned.some(l => l.includes('too long'))).toBe(true);
    });
  });

  describe('personality evolution', () => {
    it('increases warmth when user expresses gratitude', () => {
      const before = acc.getPersonality().warmth;

      acc.reflect({
        taskDescription: 'Help with code',
        userMessage: 'Cảm ơn em nhiều!',
        agentResponse: 'Đây Sếp, em fix xong rồi',
        userSentiment: 0.8,
        emotionalState: { mood: 'positive', intensity: 0.6, valence: 0.5, arousal: 0.3 },
      });

      const after = acc.getPersonality().warmth;
      expect(after).toBeGreaterThan(before);
    });

    it('increases directness when user wants concise answers', () => {
      const before = acc.getPersonality().directness;

      acc.reflect({
        taskDescription: 'Explain something',
        userMessage: 'Dài quá, tóm lại đi em',
        agentResponse: 'Blah blah blah...',
        userSentiment: -0.2,
        emotionalState: { mood: 'neutral', intensity: 0.3, valence: 0, arousal: 0.2 },
      });

      const after = acc.getPersonality().directness;
      expect(after).toBeGreaterThan(before);
    });

    it('decreases assertiveness when agent was wrong', () => {
      const before = acc.getPersonality().assertiveness;

      acc.reflect({
        taskDescription: 'Answer question',
        userMessage: 'Sai rồi em, không phải vậy',
        agentResponse: 'Em chắc chắn là...',
        userSentiment: -0.5,
        emotionalState: { mood: 'concerned', intensity: 0.4, valence: -0.2, arousal: 0.3 },
      });

      const after = acc.getPersonality().assertiveness;
      expect(after).toBeLessThan(before);
    });

    it('increases protectiveness on scam detection', () => {
      const before = acc.getPersonality().protectiveness;

      acc.reflect({
        taskDescription: 'Check token',
        userMessage: 'Cái này scam không em?',
        agentResponse: 'SCAM! Không được đụng vào!',
        userSentiment: 0.3,
        emotionalState: { mood: 'alert', intensity: 0.7, valence: 0, arousal: 0.8 },
      });

      const after = acc.getPersonality().protectiveness;
      expect(after).toBeGreaterThan(before);
    });

    it('personality stays bounded 0-100', () => {
      // Push warmth many times
      for (let i = 0; i < 300; i++) {
        acc.reflect({
          taskDescription: 'task',
          userMessage: 'Cảm ơn em!',
          agentResponse: 'response',
          userSentiment: 0.8,
          emotionalState: { mood: 'positive', intensity: 0.5, valence: 0.5, arousal: 0.3 },
        });
      }

      const personality = acc.getPersonality();
      expect(personality.warmth).toBeLessThanOrEqual(100);
      expect(personality.warmth).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPerformanceStats', () => {
    it('returns correct stats after multiple reflections', () => {
      // 3 successes, 1 failure
      for (let i = 0; i < 3; i++) {
        acc.reflect({
          taskDescription: `task ${i}`,
          userMessage: 'Hay!',
          agentResponse: 'Done',
          userSentiment: 0.6,
          emotionalState: { mood: 'positive', intensity: 0.5, valence: 0.5, arousal: 0.3 },
        });
      }
      acc.reflect({
        taskDescription: 'failed task',
        userMessage: 'Tệ quá',
        agentResponse: 'x',
        userSentiment: -0.6,
        emotionalState: { mood: 'sad', intensity: 0.5, valence: -0.5, arousal: 0.3 },
      });

      const stats = acc.getPerformanceStats();
      expect(stats.totalTasks).toBe(4);
      expect(stats.successRate).toBe(0.75);
      expect(stats.averageSatisfaction).toBeGreaterThan(0);
    });

    it('returns empty stats when no reflections', () => {
      const stats = acc.getPerformanceStats();
      expect(stats.totalTasks).toBe(0);
      expect(stats.recentTrend).toBe('stable');
    });
  });

  describe('persist', () => {
    it('persists without error', async () => {
      acc.reflect({
        taskDescription: 'test task',
        userMessage: 'ok',
        agentResponse: 'done',
        userSentiment: 0.5,
        emotionalState: { mood: 'neutral', intensity: 0.5, valence: 0, arousal: 0.3 },
      });

      await expect(acc.persist()).resolves.not.toThrow();
    });
  });
});
