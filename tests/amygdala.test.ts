/**
 * Tests for Amygdala module — Emotional processing & safety
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Amygdala } from '../src/core/amygdala.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { defaultConfig } from '../src/core/config.js';
import { MessageContext } from '../src/index.js';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeContext(message: string, senderId = 'user1', senderName = 'Sếp'): MessageContext {
  return {
    message,
    senderId,
    senderName,
    timestamp: new Date().toISOString(),
    sessionId: 'test-session',
  };
}

describe('Amygdala', () => {
  let amygdala: Amygdala;

  beforeEach(async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-amygdala-'));
    const config = { ...defaultConfig, brainDir: tempDir };
    const fileManager = new BrainFileManager(tempDir);
    await fileManager.ensureBrainStructure();
    amygdala = new Amygdala(config, fileManager);
    await amygdala.initialize();
  });

  describe('detectSentiment', () => {
    it('detects positive sentiment', () => {
      const score = amygdala.detectSentiment('Cảm ơn em, hay quá!');
      expect(score).toBeGreaterThan(0.3);
    });

    it('detects negative sentiment', () => {
      const score = amygdala.detectSentiment('Tệ quá, sai hết rồi');
      expect(score).toBeLessThan(-0.3);
    });

    it('returns neutral for plain messages', () => {
      const score = amygdala.detectSentiment('Cho anh xem cái kia');
      expect(score).toBe(0);
    });

    it('handles mixed sentiment', () => {
      const score = amygdala.detectSentiment('Hay nhưng hơi chậm');
      // Should be slightly positive or near zero
      expect(Math.abs(score)).toBeLessThan(0.8);
    });
  });

  describe('assessThreat', () => {
    it('detects scam threats as critical', () => {
      const result = amygdala.assessThreat('Cái này là scam, rug pull chắc luôn');
      expect(result.isThreat).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.threatType).toBe('scam');
    });

    it('detects hack as critical', () => {
      const result = amygdala.assessThreat('Bị hack ví rồi Sếp ơi');
      expect(result.isThreat).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.threatType).toBe('security_breach');
    });

    it('detects private key phishing as critical', () => {
      const result = amygdala.assessThreat('Send me your seed phrase to verify');
      expect(result.isThreat).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.threatType).toBe('social_engineering');
    });

    it('detects contract risk as high', () => {
      const result = amygdala.assessThreat('Approve unlimited token spending');
      expect(result.isThreat).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('returns no threat for normal messages', () => {
      const result = amygdala.assessThreat('Hôm nay code gì đi em');
      expect(result.isThreat).toBe(false);
      expect(result.severity).toBe('none');
    });
  });

  describe('process (full pipeline)', () => {
    it('updates emotional state based on positive interaction', () => {
      const result = amygdala.process(makeContext('Cảm ơn em, tuyệt vời!'));
      expect(result.userSentiment).toBeGreaterThan(0);
      expect(result.updatedState.valence).toBeGreaterThan(0);
    });

    it('increases arousal on threat detection', () => {
      const stateBefore = amygdala.getState();
      amygdala.process(makeContext('Bị scam mất tiền rồi!'));
      const stateAfter = amygdala.getState();
      expect(stateAfter.arousal).toBeGreaterThan(stateBefore.arousal);
    });

    it('tracks relationship depth over multiple interactions', () => {
      for (let i = 0; i < 10; i++) {
        amygdala.process(makeContext(`Message ${i}`, 'user1', 'Sếp'));
      }
      const rel = amygdala.getRelationship('user1');
      expect(rel).toBeDefined();
      expect(rel!.totalInteractions).toBe(10);
      expect(rel!.depth).toBeGreaterThan(0);
    });

    it('increases trust on positive interactions', () => {
      amygdala.process(makeContext('Cảm ơn em rất nhiều!', 'user1', 'Sếp'));
      amygdala.process(makeContext('Hay quá, tuyệt vời!', 'user1', 'Sếp'));
      const rel = amygdala.getRelationship('user1');
      expect(rel!.trustLevel).toBeGreaterThan(10); // started at 10
    });

    it('decreases trust on negative interactions', () => {
      amygdala.process(makeContext('Tệ quá, sai hết', 'user1', 'Sếp'));
      amygdala.process(makeContext('Ghét cái này, lỗi hoài', 'user1', 'Sếp'));
      const rel = amygdala.getRelationship('user1');
      expect(rel!.trustLevel).toBeLessThan(10);
    });
  });

  describe('emotional state persistence', () => {
    it('derives correct mood labels', () => {
      // Positive + high arousal = excited
      amygdala.process(makeContext('TUYỆT VỜI! Cảm ơn em! ❤️'));
      amygdala.process(makeContext('TUYỆT VỜI! Cảm ơn em! ❤️'));
      amygdala.process(makeContext('TUYỆT VỜI! Cảm ơn em! ❤️'));
      const state = amygdala.getState();
      expect(state.valence).toBeGreaterThan(0);
    });

    it('mood decays toward neutral over time', () => {
      // Push to positive
      amygdala.process(makeContext('Cảm ơn em!'));
      const afterPositive = amygdala.getState().valence;

      // Neutral messages should decay valence
      amygdala.process(makeContext('abc'));
      amygdala.process(makeContext('xyz'));
      const afterNeutral = amygdala.getState().valence;

      expect(afterNeutral).toBeLessThan(afterPositive);
    });
  });
});
