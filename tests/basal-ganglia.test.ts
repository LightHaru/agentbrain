/**
 * Tests for Basal Ganglia module — Reward & Motivation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BasalGanglia } from '../src/core/basal-ganglia.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { defaultConfig } from '../src/core/config.js';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('BasalGanglia', () => {
  let bg: BasalGanglia;

  beforeEach(async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-bg-'));
    const config = { ...defaultConfig, brainDir: tempDir };
    const fileManager = new BrainFileManager(tempDir);
    await fileManager.ensureBrainStructure();
    bg = new BasalGanglia(config, fileManager);
    await bg.initialize();
  });

  describe('processReward', () => {
    it('stores reward signal', () => {
      bg.processReward({
        timestamp: new Date().toISOString(),
        taskType: 'research',
        signal: 0.8,
        source: 'explicit',
        context: 'User said thanks',
      });

      const motivation = bg.getMotivation('research');
      expect(motivation).toBeGreaterThan(0.5);
    });

    it('negative reward decreases motivation', () => {
      // First give positive
      bg.processReward({
        timestamp: new Date().toISOString(),
        taskType: 'code-writing',
        signal: 0.5,
        source: 'explicit',
        context: 'OK result',
      });

      const before = bg.getMotivation('code-writing');

      // Then negative
      bg.processReward({
        timestamp: new Date().toISOString(),
        taskType: 'code-writing',
        signal: -0.8,
        source: 'explicit',
        context: 'User complained',
      });

      const after = bg.getMotivation('code-writing');
      expect(after).toBeLessThan(before);
    });
  });

  describe('getMotivation', () => {
    it('returns 0.5 for unknown task types', () => {
      expect(bg.getMotivation('unknown-task')).toBe(0.5);
    });

    it('returns higher motivation for consistently positive tasks', () => {
      for (let i = 0; i < 5; i++) {
        bg.processReward({
          timestamp: new Date().toISOString(),
          taskType: 'research',
          signal: 0.8,
          source: 'explicit',
          context: 'Great work',
        });
      }

      for (let i = 0; i < 5; i++) {
        bg.processReward({
          timestamp: new Date().toISOString(),
          taskType: 'content-writing',
          signal: -0.3,
          source: 'implicit',
          context: 'User ignored result',
        });
      }

      expect(bg.getMotivation('research')).toBeGreaterThan(bg.getMotivation('content-writing'));
    });
  });

  describe('getMotivationRanking', () => {
    it('returns profiles sorted by motivation', () => {
      bg.processReward({ timestamp: new Date().toISOString(), taskType: 'research', signal: 0.9, source: 'explicit', context: '' });
      bg.processReward({ timestamp: new Date().toISOString(), taskType: 'coding', signal: 0.5, source: 'explicit', context: '' });
      bg.processReward({ timestamp: new Date().toISOString(), taskType: 'ops', signal: -0.5, source: 'explicit', context: '' });

      const ranking = bg.getMotivationRanking();
      expect(ranking.length).toBe(3);
      expect(ranking[0].taskType).toBe('research');
      expect(ranking[0].motivation).toBeGreaterThan(ranking[2].motivation);
    });
  });

  describe('getRecentTrend', () => {
    it('returns 0 with no history', () => {
      expect(bg.getRecentTrend()).toBe(0);
    });

    it('returns positive trend for positive signals', () => {
      for (let i = 0; i < 5; i++) {
        bg.processReward({ timestamp: new Date().toISOString(), taskType: 'any', signal: 0.7, source: 'explicit', context: '' });
      }
      expect(bg.getRecentTrend()).toBeGreaterThan(0.5);
    });

    it('returns negative trend for negative signals', () => {
      for (let i = 0; i < 5; i++) {
        bg.processReward({ timestamp: new Date().toISOString(), taskType: 'any', signal: -0.6, source: 'explicit', context: '' });
      }
      expect(bg.getRecentTrend()).toBeLessThan(-0.3);
    });
  });

  describe('getBehaviorScore', () => {
    it('returns 0 for unknown behaviors', () => {
      expect(bg.getBehaviorScore('unknown')).toBe(0);
    });

    it('returns positive score for reinforced behaviors', () => {
      bg.processReward({ timestamp: new Date().toISOString(), taskType: 'research', signal: 0.8, source: 'explicit', context: '' });
      bg.processReward({ timestamp: new Date().toISOString(), taskType: 'research', signal: 0.6, source: 'explicit', context: '' });
      expect(bg.getBehaviorScore('research')).toBeGreaterThan(0);
    });
  });

  describe('persist', () => {
    it('persists without error', async () => {
      bg.processReward({ timestamp: new Date().toISOString(), taskType: 'test', signal: 0.5, source: 'explicit', context: 'test' });
      await expect(bg.persist()).resolves.not.toThrow();
    });
  });
});
