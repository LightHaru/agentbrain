import { describe, it, expect } from 'vitest';
import {
  expandQuery,
  collectSynonyms,
  sharesSynonym,
  synonymsForToken,
} from '../src/core/synonym-expander.js';

describe('synonym-expander', () => {
  describe('expandQuery', () => {
    it('adds domain synonyms while keeping the original query verbatim', () => {
      const out = expandQuery('anh đang ở timezone nào');
      expect(out).toContain('anh đang ở timezone nào');
      expect(out.toLowerCase()).toContain('múi giờ');
    });

    it('bridges Vietnamese storage phrasing to database terms', () => {
      const out = expandQuery('app lưu dữ liệu ở đâu').toLowerCase();
      expect(out).toContain('database');
    });

    it('returns the query untouched when nothing matches', () => {
      const q = 'kể một câu chuyện vui vẻ ngẫu nhiên';
      expect(expandQuery(q)).toBe(q);
    });
  });

  describe('collectSynonyms', () => {
    it('excludes terms already present in the text', () => {
      const syns = collectSynonyms('dùng database gì');
      // "database" is present, so it should not be re-added
      expect(syns.has('database')).toBe(false);
      // but its group-mates should be offered
      expect(syns.has('postgresql') || syns.has('pg') || syns.has('db')).toBe(true);
    });
  });

  describe('sharesSynonym', () => {
    it('links a query and memory through a multi-word synonym', () => {
      expect(sharesSynonym('app lưu dữ liệu ở đâu', 'Dự án dùng PostgreSQL làm database')).toBe(true);
    });

    it('links timezone query to Vietnamese múi giờ memory', () => {
      expect(sharesSynonym('anh đang ở timezone nào', 'Sếp ở múi giờ Asia/Ho_Chi_Minh')).toBe(true);
    });

    it('does not link unrelated query and memory', () => {
      expect(sharesSynonym('buổi sáng uống gì', 'Dự án dùng PostgreSQL')).toBe(false);
    });
  });

  describe('synonymsForToken', () => {
    it('returns single-word group members, no multi-word phrases or tiny tokens', () => {
      const syns = synonymsForToken('postgresql');
      expect(syns).toContain('postgres');
      // multi-word phrases and <=2-char tokens (e.g. "pg") are excluded to
      // avoid noisy lexical matches
      expect(syns.every((s) => !s.includes(' ') && s.length > 2)).toBe(true);
    });

    it('returns empty for an unknown token', () => {
      expect(synonymsForToken('zzzznotathing')).toEqual([]);
    });
  });
});
