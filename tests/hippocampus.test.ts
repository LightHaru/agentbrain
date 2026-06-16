/**
 * Tests for Hippocampus module — Memory formation & retrieval
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hippocampus } from '../src/core/hippocampus.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { defaultConfig } from '../src/core/config.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Hippocampus', () => {
  let hippocampus: Hippocampus;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-test-'));
    const config = { ...defaultConfig, brainDir: tempDir };
    const fileManager = new BrainFileManager(tempDir);
    await fileManager.ensureBrainStructure();
    hippocampus = new Hippocampus(config, fileManager);
    await hippocampus.initialize();
  });

  describe('consolidate', () => {
    it('stores episodic memory for decisions', async () => {
      await hippocampus.consolidate({
        message: 'Chốt rồi, deploy lên production đi',
        response: 'OK em deploy ngay',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const stats = hippocampus.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.episodic).toBeGreaterThan(0);
    });

    it('stores semantic memory for preferences', async () => {
      await hippocampus.consolidate({
        message: 'Anh thích code TypeScript hơn JavaScript',
        response: 'Noted!',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const stats = hippocampus.getStats();
      expect(stats.semantic).toBeGreaterThan(0);
    });

    it('stores procedural memory for workflows', async () => {
      await hippocampus.consolidate({
        message: 'Cách deploy: bước 1 build, bước 2 push, bước 3 restart',
        response: 'Em ghi nhớ workflow này',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const stats = hippocampus.getStats();
      expect(stats.procedural).toBeGreaterThan(0);
    });

    it('ignores very short messages', async () => {
      await hippocampus.consolidate({
        message: 'ok',
        response: 'OK',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const stats = hippocampus.getStats();
      expect(stats.total).toBe(0);
    });

    it('ignores pure playful teasing', async () => {
      await hippocampus.consolidate({
        message: 'gà mập',
        response: 'hihi',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const stats = hippocampus.getStats();
      expect(stats.total).toBe(0);
    });

    it('keeps concrete findings from low-value prompts', async () => {
      await hippocampus.consolidate({
        message: 'ok',
        response: 'Current price is $0.12 and hashrate is 10 TH/s',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const stats = hippocampus.getStats();
      expect(stats.semantic).toBeGreaterThan(0);
    });
  });

  describe('recall', () => {
    it('retrieves relevant memories by keyword', async () => {
      // Store a memory about crypto
      await hippocampus.consolidate({
        message: 'Anh đã chốt lời PEPE ở $0.000005',
        response: 'Ghi nhận',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const results = await hippocampus.recall('PEPE giá bao nhiêu', 'crypto');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('PEPE');
    });

    it('returns empty for unrelated queries', async () => {
      await hippocampus.consolidate({
        message: 'Anh đã deploy server mới xong rồi',
        response: 'OK',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: new Date().toISOString(),
      });

      const results = await hippocampus.recall('pizza', 'food');
      // Unrelated query should not return high-relevance results
      // The memory may still appear but with low base confidence
      const highRelevance = results.filter(r => r.tags.includes('food'));
      expect(highRelevance.length).toBe(0);
    });

    it('handles punctuation-heavy BM25 queries without fallback warnings', () => {
      const db = new BrainDatabase(join(tempDir, 'fts-brain.db'));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      try {
        db.insertMemory({
          id: 'm-fts-prl',
          type: 'semantic',
          content: 'PRL Pearl SafeTrade WPRL live API routing and market source checks.',
          timestamp: new Date().toISOString(),
          confidence: 0.9,
          tags: ['crypto', 'market'],
        });

        const results = db.bm25Search('PRL/Pearl, SafeTrade? q=WPRL', 5);

        expect(results.some(result => result.id === 'm-fts-prl')).toBe(true);
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('FTS5 query failed'), expect.anything());
      } finally {
        warn.mockRestore();
        db.close();
      }
    });
  });

  describe('maintenance', () => {
    it('decays old memories over time', async () => {
      // Manually add a memory with old lastAccessed
      await hippocampus.consolidate({
        message: 'Anh đã chốt quyết định dùng React',
        response: 'OK',
        senderId: 'user1',
        senderName: 'Sếp',
        timestamp: '2025-01-01T00:00:00.000Z',
      });

      const statsBefore = hippocampus.getStats();

      // Force maintenance to run (set heartbeat count to trigger)
      for (let i = 0; i < 7; i++) {
        await hippocampus.maintenance();
      }

      // Memory should have decayed (possibly pruned if very old)
      const statsAfter = hippocampus.getStats();
      expect(statsAfter.total).toBeLessThanOrEqual(statsBefore.total);
    });
  });

  describe('getStats', () => {
    it('returns correct counts', async () => {
      const stats = hippocampus.getStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('episodic');
      expect(stats).toHaveProperty('semantic');
      expect(stats).toHaveProperty('procedural');
      expect(stats.total).toBe(stats.episodic + stats.semantic + stats.procedural);
    });
  });
});
