import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeExtractor } from '../src/core/knowledge-extractor.js';

describe('KnowledgeExtractor', () => {
  let extractor: KnowledgeExtractor;

  beforeEach(() => {
    extractor = new KnowledgeExtractor();
  });

  describe('extract', () => {
    it('extracts "X is Y" facts', () => {
      const result = extractor.extract(
        'PRL là token của Pearl Network',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: [] }
      );
      expect(result.facts.length).toBeGreaterThan(0);
      const fact = result.facts.find(f => f.relation === 'is');
      expect(fact).toBeDefined();
      expect(fact!.object).toContain('Pearl Network');
    });

    it('extracts preference facts', () => {
      const result = extractor.extract(
        'Anh thích dùng Cursor hơn VSCode',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: [] }
      );
      expect(result.facts.length).toBeGreaterThan(0);
      const pref = result.facts.find(f => f.relation === 'prefers');
      expect(pref).toBeDefined();
    });

    it('extracts crypto addresses as entities', () => {
      const result = extractor.extract(
        'Ví miner: prl1pze77h93emczf0sxpgwyvzunf0mq5gsw8vter3jffsks44qq99mys0wq6qd',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: [] }
      );
      const addr = result.entities.find(e => e.type === 'address');
      expect(addr).toBeDefined();
      expect(addr!.name).toContain('prl1');
    });

    it('extracts numbers with units', () => {
      const result = extractor.extract(
        'Hashrate đang 18 TH/s, balance 2.5 PRL',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: [] }
      );
      const nums = result.entities.filter(e => e.type === 'number');
      expect(nums.length).toBe(2);
    });

    it('detects corrections (supersedes old facts)', () => {
      // First: establish a fact
      extractor.extract(
        'Giá PRL là $0.80',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T09:00:00Z', previousFacts: [] }
      );

      // Then: new fact contradicts
      const result = extractor.extract(
        'Giá PRL là $1.34',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: extractor.getActiveFacts() }
      );

      expect(result.corrections.length).toBeGreaterThan(0);
    });

    it('does not create duplicate facts', () => {
      const ctx = { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: [] as any[] };
      extractor.extract('PRL là token của Pearl', '', ctx);
      extractor.extract('PRL là token của Pearl', '', ctx);
      
      const facts = extractor.getActiveFacts();
      const prlFacts = facts.filter(f => f.subject.toLowerCase().includes('prl'));
      expect(prlFacts.length).toBe(1);
    });
  });

  describe('queryFacts', () => {
    it('returns facts about a subject', () => {
      extractor.extract(
        'Miner chạy trên RTX 3060',
        '',
        { senderName: 'Sếp', timestamp: '2026-05-28T10:00:00Z', previousFacts: [] }
      );
      const facts = extractor.queryFacts('miner');
      expect(facts.length).toBeGreaterThan(0);
    });
  });
});
