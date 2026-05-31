/**
 * Tests for Thalamus module — Context classification & routing
 */

import { describe, it, expect } from 'vitest';
import { Thalamus } from '../src/core/thalamus.js';
import { defaultConfig } from '../src/core/config.js';
import { MessageContext } from '../src/index.js';

function makeContext(message: string): MessageContext {
  return {
    message,
    senderId: 'test-user',
    senderName: 'TestUser',
    timestamp: new Date().toISOString(),
    sessionId: 'test-session',
  };
}

describe('Thalamus', () => {
  const thalamus = new Thalamus(defaultConfig);

  describe('classify — intent detection', () => {
    it('detects questions', () => {
      const result = thalamus.classify(makeContext('Cái này là gì vậy?'));
      expect(result.intent).toBe('question');
    });

    it('detects action requests', () => {
      const result = thalamus.classify(makeContext('Làm cho anh cái dashboard'));
      expect(result.intent).toBe('action_request');
    });

    it('detects research requests', () => {
      const result = thalamus.classify(makeContext('Tìm hiểu giúp anh con PEPE'));
      expect(result.intent).toBe('research');
    });

    it('detects confirmations', () => {
      const result = thalamus.classify(makeContext('Ok chốt đi'));
      expect(result.intent).toBe('confirmation');
    });

    it('detects gratitude', () => {
      const result = thalamus.classify(makeContext('Cảm ơn em'));
      expect(result.intent).toBe('gratitude');
    });

    it('defaults to statement', () => {
      const result = thalamus.classify(makeContext('Trời hôm nay đẹp'));
      expect(result.intent).toBe('statement');
    });
  });

  describe('classify — urgency detection', () => {
    it('detects critical urgency (scam)', () => {
      const result = thalamus.classify(makeContext('Bị hack ví rồi!'));
      expect(result.urgency).toBe('critical');
    });

    it('detects high urgency (bug)', () => {
      const result = thalamus.classify(makeContext('Server bị crash rồi'));
      expect(result.urgency).toBe('high');
    });

    it('detects medium urgency (help)', () => {
      const result = thalamus.classify(makeContext('Giúp anh check cái này'));
      expect(result.urgency).toBe('medium');
    });

    it('defaults to low urgency', () => {
      const result = thalamus.classify(makeContext('Hôm nay ăn gì'));
      expect(result.urgency).toBe('low');
    });
  });

  describe('classify — topic detection', () => {
    it('detects crypto topic', () => {
      const result = thalamus.classify(makeContext('Long PEPE token leverage x20'));
      expect(result.topic).toBe('crypto');
    });

    it('detects coding topic', () => {
      const result = thalamus.classify(makeContext('Fix bug API endpoint'));
      expect(result.topic).toBe('coding');
    });

    it('detects content topic', () => {
      const result = thalamus.classify(makeContext('Viết bài blog về GameFi'));
      expect(result.topic).toBe('content');
    });

    it('detects casual topic', () => {
      const result = thalamus.classify(makeContext('Chào em, haha'));
      expect(result.topic).toBe('casual');
    });

    it('defaults to general', () => {
      const result = thalamus.classify(makeContext('abc xyz'));
      expect(result.topic).toBe('general');
    });
  });

  describe('classify — emotional tone', () => {
    it('detects positive tone', () => {
      const result = thalamus.classify(makeContext('Hay quá cảm ơn em'));
      expect(result.emotionalTone).toBe('positive');
    });

    it('detects negative tone', () => {
      const result = thalamus.classify(makeContext('Tệ quá, sai hết rồi'));
      expect(result.emotionalTone).toBe('negative');
    });

    it('detects urgent tone', () => {
      const result = thalamus.classify(makeContext('Gấp lắm!!! Làm ngay'));
      expect(result.emotionalTone).toBe('urgent');
    });

    it('defaults to neutral', () => {
      const result = thalamus.classify(makeContext('Cho anh xem cái kia'));
      expect(result.emotionalTone).toBe('neutral');
    });
  });

  describe('routeToModules', () => {
    it('always includes hippocampus', () => {
      const classification = thalamus.classify(makeContext('hello'));
      const modules = thalamus.routeToModules(classification);
      expect(modules).toContain('hippocampus');
    });

    it('includes amygdala for critical urgency', () => {
      const classification = thalamus.classify(makeContext('Bị scam rồi!'));
      const modules = thalamus.routeToModules(classification);
      expect(modules).toContain('amygdala');
    });

    it('includes prefrontal for action requests', () => {
      const classification = thalamus.classify(makeContext('Build cho anh cái app'));
      const modules = thalamus.routeToModules(classification);
      expect(modules).toContain('prefrontal');
    });

    it('includes cerebellum for action requests', () => {
      const classification = thalamus.classify(makeContext('Deploy cái server'));
      const modules = thalamus.routeToModules(classification);
      expect(modules).toContain('cerebellum');
    });
  });
});
