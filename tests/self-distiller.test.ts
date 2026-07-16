/**
 * SelfDistiller tests — brain learns durable knowledge from its own SUCCESSFUL
 * conversations, ignores low-value / negative turns, dedups, and watermarks.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { KnowledgeStore } from '../src/core/knowledge-store.js';
import { ConversationLog } from '../src/core/conversation-log.js';
import { SelfDistiller } from '../src/training/self-distiller.js';

function memStore() {
  const m = new Map<string, string>();
  return { m, async readFile(p: string) { return m.get(p) ?? null; }, async writeFile(p: string, c: string) { m.set(p, c); } };
}

describe('SelfDistiller', () => {
  let dir: string, db: BrainDatabase, ks: KnowledgeStore, log: ConversationLog;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'agentbrain-sd-'));
    db = new BrainDatabase(join(dir, 'brain.db'));
    ks = new KnowledgeStore(db, null);
    log = new ConversationLog(db, null);
  });
  afterEach(async () => { db.close(); await rm(dir, { recursive: true, force: true }); });

  it('learns a preference from a POSITIVE turn', async () => {
    await log.record({ userMessage: 'nhớ là anh luôn thích dùng krouter làm provider mặc định', agentResponse: 'Dạ', sentiment: 0.8, timestamp: '2026-07-09T10:00:00Z' });
    const sd = new SelfDistiller(ks, log, memStore());
    const rep = await sd.run();
    expect(rep.learned).toBeGreaterThan(0);
    const items = ks.getAll('lesson');
    expect(items.some((i) => i.content.includes('krouter'))).toBe(true);
  });

  it('IGNORES negative-outcome turns (those are the error ledger job)', async () => {
    await log.record({ userMessage: 'anh thích dùng cách này nhưng em làm sai rồi', agentResponse: 'xin lỗi', sentiment: -0.6, timestamp: '2026-07-09T10:00:00Z' });
    const sd = new SelfDistiller(ks, log, memStore());
    const rep = await sd.run();
    expect(rep.learned).toBe(0);
  });

  it('IGNORES ephemeral chatter', async () => {
    await log.record({ userMessage: 'ok em', agentResponse: 'dạ', sentiment: 0.5, timestamp: '2026-07-09T10:00:00Z' });
    await log.record({ userMessage: 'haha vui ghê', agentResponse: 'hihi', sentiment: 0.7, timestamp: '2026-07-09T10:01:00Z' });
    const sd = new SelfDistiller(ks, log, memStore());
    const rep = await sd.run();
    expect(rep.learned).toBe(0);
  });

  it('dedups + watermarks: a second run over the same chat learns nothing new', async () => {
    await log.record({ userMessage: 'từ giờ luôn deploy bằng pm2 nhé, đừng dùng systemd', agentResponse: 'Dạ', sentiment: 0.7, timestamp: '2026-07-09T10:00:00Z' });
    const store = memStore();
    const first = await new SelfDistiller(ks, log, store).run();
    expect(first.learned).toBeGreaterThan(0);
    const second = await new SelfDistiller(ks, log, store).run();
    expect(second.learned).toBe(0); // watermark advanced; nothing new
  });

  it('learned knowledge is retrievable by semantic-less keyword search', async () => {
    await log.record({ userMessage: 'nhớ là repo chính của tingamefi là github.com/tingamefi/core', agentResponse: 'Dạ', sentiment: 0.6, timestamp: '2026-07-09T10:00:00Z' });
    await new SelfDistiller(ks, log, memStore()).run();
    const hits = await ks.search('repo chính tingamefi ở đâu', { limit: 3 });
    expect(hits.length).toBeGreaterThan(0);
  });
});
