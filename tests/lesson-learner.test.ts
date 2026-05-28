import { describe, it, expect, beforeEach } from 'vitest';
import { LessonLearner } from '../src/core/lesson-learner.js';

describe('LessonLearner', () => {
  let learner: LessonLearner;

  beforeEach(() => {
    learner = new LessonLearner();
  });

  describe('analyze', () => {
    it('detects explicit correction (Vietnamese)', () => {
      const lesson = learner.analyze({
        userMessage: 'Sai rồi, không phải CoinGecko mà là DexScreener',
        agentResponse: 'Đã tìm trên DexScreener',
        previousAgentResponse: 'Em check CoinGecko...',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });
      expect(lesson).not.toBeNull();
      expect(lesson!.type).toBe('correction');
      expect(lesson!.right).toContain('DexScreener');
    });

    it('detects "đừng X" anti-pattern', () => {
      const lesson = learner.analyze({
        userMessage: 'Đừng hỏi lại nữa, cứ làm đi',
        agentResponse: 'OK em làm',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });
      expect(lesson).not.toBeNull();
      expect(lesson!.type).toBe('anti-pattern');
    });

    it('detects preference (lần sau)', () => {
      const lesson = learner.analyze({
        userMessage: 'Lần sau phải check DexScreener trước khi thử CoinGecko',
        agentResponse: 'OK',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });
      expect(lesson).not.toBeNull();
      expect(lesson!.type).toBe('preference');
    });

    it('detects frustration signal', () => {
      const lesson = learner.analyze({
        userMessage: 'Gà quá, nói rồi mà không nhớ',
        agentResponse: 'Em xin lỗi',
        previousAgentResponse: 'Em check CoinGecko...',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });
      expect(lesson).not.toBeNull();
    });

    it('reinforces existing lesson on repeat', () => {
      learner.analyze({
        userMessage: 'Đừng dùng CoinGecko cho coin mới',
        agentResponse: 'OK',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });

      const second = learner.analyze({
        userMessage: 'Đừng dùng CoinGecko, bảo rồi mà',
        agentResponse: 'OK',
        senderName: 'Sếp',
        timestamp: '2026-05-28T11:00:00Z',
      });

      expect(second).not.toBeNull();
      expect(second!.occurrences).toBe(2);
      expect(second!.confidence).toBeGreaterThan(0.6);
    });

    it('returns null for neutral messages', () => {
      const lesson = learner.analyze({
        userMessage: 'Check miner',
        agentResponse: 'OK checking',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });
      expect(lesson).toBeNull();
    });
  });

  describe('findRelevantLessons', () => {
    it('finds lessons matching query', () => {
      learner.analyze({
        userMessage: 'Đừng dùng CoinGecko cho coin mới, dùng DexScreener',
        agentResponse: 'OK',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });

      const matches = learner.findRelevantLessons('CoinGecko coin DexScreener');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('formatForInjection', () => {
    it('formats lessons as readable context', () => {
      learner.analyze({
        userMessage: 'Sai rồi, không phải CoinGecko mà là DexScreener',
        agentResponse: '',
        senderName: 'Sếp',
        timestamp: '2026-05-28T10:00:00Z',
      });

      const matches = learner.findRelevantLessons('CoinGecko DexScreener');
      const formatted = learner.formatForInjection(matches);
      expect(formatted).toContain('Lesson');
    });
  });
});
