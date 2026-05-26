/**
 * Tests for Cerebellum module — Skill & Habit Learning
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cerebellum } from '../src/core/cerebellum.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { defaultConfig } from '../src/core/config.js';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Cerebellum', () => {
  let cerebellum: Cerebellum;

  beforeEach(async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-cerebellum-'));
    const config = { ...defaultConfig, brainDir: tempDir };
    const fileManager = new BrainFileManager(tempDir);
    await fileManager.ensureBrainStructure();
    cerebellum = new Cerebellum(config, fileManager);
    await cerebellum.initialize();
  });

  describe('detectSkill', () => {
    it('detects crypto-analysis skill', () => {
      expect(cerebellum.detectSkill('Phân tích con PEPE giúp anh')).toBe('crypto-analysis');
    });

    it('detects code-writing skill', () => {
      expect(cerebellum.detectSkill('Build cho anh cái app dashboard')).toBe('code-writing');
    });

    it('detects code-debugging skill', () => {
      expect(cerebellum.detectSkill('Fix bug API endpoint')).toBe('code-debugging');
    });

    it('detects content-writing skill', () => {
      expect(cerebellum.detectSkill('Viết bài blog về GameFi')).toBe('content-writing');
    });

    it('detects research skill', () => {
      expect(cerebellum.detectSkill('Tìm hiểu giúp anh dự án này')).toBe('research');
    });

    it('detects ops-server skill', () => {
      expect(cerebellum.detectSkill('Deploy cái server mới')).toBe('ops-server');
    });

    it('returns null for unrecognized messages', () => {
      expect(cerebellum.detectSkill('hello')).toBeNull();
    });
  });

  describe('recordSkillUsage', () => {
    it('creates new skill on first usage', () => {
      cerebellum.recordSkillUsage('crypto-analysis', true);
      const skill = cerebellum.getSkill('crypto-analysis');
      expect(skill).toBeDefined();
      expect(skill!.timesUsed).toBe(1);
      expect(skill!.successes).toBe(1);
    });

    it('increases proficiency on success', () => {
      cerebellum.recordSkillUsage('research', true);
      const after1 = cerebellum.getSkill('research')!.proficiency;
      cerebellum.recordSkillUsage('research', true);
      const after2 = cerebellum.getSkill('research')!.proficiency;
      expect(after2).toBeGreaterThan(after1);
    });

    it('decreases proficiency on failure', () => {
      cerebellum.recordSkillUsage('code-writing', true);
      cerebellum.recordSkillUsage('code-writing', true);
      const before = cerebellum.getSkill('code-writing')!.proficiency;
      cerebellum.recordSkillUsage('code-writing', false);
      const after = cerebellum.getSkill('code-writing')!.proficiency;
      expect(after).toBeLessThan(before);
    });

    it('tracks success rate correctly', () => {
      cerebellum.recordSkillUsage('research', true);
      cerebellum.recordSkillUsage('research', true);
      cerebellum.recordSkillUsage('research', false);
      const skill = cerebellum.getSkill('research')!;
      expect(skill.successRate).toBeCloseTo(2 / 3);
    });

    it('proficiency stays bounded 0-100', () => {
      for (let i = 0; i < 200; i++) {
        cerebellum.recordSkillUsage('crypto-analysis', true);
      }
      expect(cerebellum.getSkill('crypto-analysis')!.proficiency).toBeLessThanOrEqual(100);
    });
  });

  describe('detectPattern / habits', () => {
    it('does not create habit before threshold', () => {
      for (let i = 0; i < 4; i++) {
        const result = cerebellum.detectPattern('Phân tích token', new Date().toISOString());
        expect(result).toBeNull();
      }
    });

    it('creates habit after 5 occurrences', () => {
      let habit = null;
      for (let i = 0; i < 6; i++) {
        habit = cerebellum.detectPattern('Phân tích token XYZ', new Date().toISOString());
      }
      expect(habit).not.toBeNull();
      expect(habit!.pattern).toBe('crypto-analysis');
      expect(habit!.active).toBe(true);
    });

    it('increases confidence with more occurrences', () => {
      for (let i = 0; i < 5; i++) {
        cerebellum.detectPattern('Check price token', new Date().toISOString());
      }
      const habit5 = cerebellum.detectPattern('Check price token', new Date().toISOString());

      for (let i = 0; i < 4; i++) {
        cerebellum.detectPattern('Check price token', new Date().toISOString());
      }
      const habit10 = cerebellum.detectPattern('Phân tích chart', new Date().toISOString());

      // habit10 should have higher confidence (more occurrences of crypto-analysis)
      expect(habit10!.confidence).toBeGreaterThanOrEqual(habit5!.confidence);
    });
  });

  describe('getTopSkills', () => {
    it('returns skills sorted by proficiency', () => {
      // Build up different skills
      for (let i = 0; i < 10; i++) cerebellum.recordSkillUsage('research', true);
      for (let i = 0; i < 5; i++) cerebellum.recordSkillUsage('code-writing', true);
      for (let i = 0; i < 2; i++) cerebellum.recordSkillUsage('ops-server', true);

      const top = cerebellum.getTopSkills(3);
      expect(top.length).toBe(3);
      expect(top[0].name).toBe('research'); // most used = highest proficiency
      expect(top[0].proficiency).toBeGreaterThan(top[1].proficiency);
    });
  });

  describe('persist', () => {
    it('persists without error', async () => {
      cerebellum.recordSkillUsage('research', true);
      cerebellum.detectPattern('Tìm hiểu dự án', new Date().toISOString());
      await expect(cerebellum.persist()).resolves.not.toThrow();
    });
  });
});
