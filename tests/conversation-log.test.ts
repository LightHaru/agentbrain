/**
 * ConversationLog tests — daily chat stored durably, recallable for context.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { ConversationLog } from '../src/core/conversation-log.js';

describe('ConversationLog', () => {
  let dir: string;
  let db: BrainDatabase;
  let log: ConversationLog;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'agentbrain-conv-'));
    db = new BrainDatabase(join(dir, 'brain.db'));
    log = new ConversationLog(db, null, 100); // keyword fallback, small cap
  });
  afterEach(async () => {
    db.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('records turns and returns them in chronological order', async () => {
    await log.record({ sessionId: 's1', userMessage: 'câu một', agentResponse: 'đáp một', timestamp: '2026-07-09T10:00:00Z' });
    await log.record({ sessionId: 's1', userMessage: 'câu hai', agentResponse: 'đáp hai', timestamp: '2026-07-09T10:01:00Z' });
    const recent = log.recent(5, 's1');
    expect(recent.length).toBe(2);
    expect(recent[0].userMessage).toBe('câu một');
    expect(recent[1].userMessage).toBe('câu hai');
  });

  it('does not double-log an identical consecutive turn', async () => {
    await log.record({ sessionId: 's1', userMessage: 'trùng', agentResponse: 'x' });
    await log.record({ sessionId: 's1', userMessage: 'trùng', agentResponse: 'x' });
    expect(log.size()).toBe(1);
  });

  it('recalls a past turn by keyword (nhớ lại)', async () => {
    await log.record({ userMessage: 'anh thích dùng krouter làm provider mặc định', agentResponse: 'ok Sếp' });
    await log.record({ userMessage: 'trời hôm nay đẹp', agentResponse: 'dạ' });
    const hits = await log.recall('provider krouter mặc định', 3);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].turn.userMessage).toContain('krouter');
  });

  it('builds an injectable context block with recent turns', async () => {
    await log.record({ sessionId: 's1', userMessage: 'đang build AgentBrain', agentResponse: 'ok' });
    const ctx = await log.buildContext('tiếp tục build', { recent: 3, relevant: 2, sessionId: 's1' });
    expect(ctx).toContain('Ngữ cảnh gần đây');
    expect(ctx).toContain('AgentBrain');
  });

  it('trims to the rolling cap (anti-bloat)', async () => {
    const small = new ConversationLog(db, null, 5);
    for (let i = 0; i < 12; i++) {
      await small.record({ userMessage: `m${i}`, agentResponse: `r${i}`, timestamp: `2026-07-09T10:${String(i).padStart(2, '0')}:00Z` });
    }
    expect(small.size()).toBeLessThanOrEqual(5);
  });
});
