/**
 * E2E for the v0.16 intelligence upgrades, driven through the REAL built plugin
 * gateway (message_received → before_prompt_build → llm_output → agent_end):
 *   1. MemoryGraph bridge recall — connected facts surfaced across a link.
 *   2. FactChangeTracker — a changed (superseded) value is flagged / current wins.
 *   3. AutoReflector — a rough streak distills a "do differently" lesson that is
 *      then recalled into Aira's context.
 *
 * Proves the new modules are wired into the live injection/learning paths.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { cleanupDir } from './helpers/cleanup.js';

const require = createRequire(import.meta.url);
const distEntry = resolve(__dirname, '../dist/plugin/entry.js');

function loadPlugin(brainDir: string, sessionKey = 'gw:v016') {
  delete require.cache[require.resolve(distEntry)];
  const plugin = require(distEntry);
  const pc: any = { enabled: true, brainDir, enableEmotions: true, logging: false };
  const hooks: Record<string, Function[]> = {};
  const tools: Record<string, Function> = {};
  const api = {
    on: (n: string, f: Function) => { (hooks[n] ||= []).push(f); },
    registerTool: (t: any) => { tools[t.name] = t.execute; },
    provideModel: () => {}, log: () => {},
  };
  plugin.register(api);
  const ctx = { pluginConfig: pc, sessionKey, senderId: 'sep', senderName: 'Sếp' };

  return {
    async turn(msg: string, reply: string) {
      const runId = 'run-' + Math.random().toString(36).slice(2);
      for (const fn of hooks['message_received'] || []) await fn({ content: msg, senderName: 'Sếp', senderId: 'sep', sessionKey, runId, context: { pluginConfig: pc } }, ctx);
      let inj = '';
      for (const fn of hooks['before_prompt_build'] || []) { const r = await fn({ prompt: msg, runId, context: { pluginConfig: pc } }, ctx); if (r?.appendContext) inj = r.appendContext; }
      for (const fn of hooks['llm_output'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
      for (const fn of hooks['agent_end'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
      return inj;
    },
    tool(name: string, params: any = {}) { return tools[name]?.('id', params, ctx); },
  };
}

describe('v0.16 upgrades E2E (real gateway)', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'agentbrain-v016-')); });
  afterEach(async () => { await cleanupDir(dir); });

  it('MemoryGraph: builds a real graph and bridges facts across a link', async () => {
    const p = loadPlugin(join(dir, 'brain'));
    await p.turn('TinGameFi chạy trên Solana nha em', 'Dạ em nhớ TinGameFi runs on Solana');
    await p.turn('Solana có phí gas thấp lắm', 'Vâng Solana has phí gas thấp');
    await p.turn('nhắc lại giúp anh về TinGameFi với', 'Dạ');

    const graph = await p.tool('agentbrain_graph', { query: 'TinGameFi' });
    expect(graph.graph.nodes).toBeGreaterThanOrEqual(2);
    expect(graph.graph.edges).toBeGreaterThanOrEqual(1);
    // The connected facts for TinGameFi should reach Solana via the graph.
    expect(graph.connectedFacts.join(' ')).toMatch(/Solana/i);
  }, 40000);

  it('FactChangeTracker: the current (updated) value wins over the old one', async () => {
    const p = loadPlugin(join(dir, 'brain'), 'gw:factchange');
    await p.turn('database chính của dự án là MySQL', 'Dạ, dự án is MySQL');
    await p.turn('à không, giờ dự án dùng PostgreSQL rồi', 'Dạ em cập nhật: dự án uses PostgreSQL');
    const inj = await p.turn('database của dự án là gì em', 'Dạ');
    // The change note must fire: old → new, telling Aira to use the NEW value.
    expect(/thay đổi|cập nhật/.test(inj)).toBe(true);
    expect(/MySQL/i.test(inj)).toBe(true);
    expect(/PostgreSQL/i.test(inj)).toBe(true);
    expect(inj).toMatch(/→/);
  }, 40000);

  it('AutoReflector: a correction streak distills a lesson recalled later', async () => {
    const p = loadPlugin(join(dir, 'brain'), 'gw:reflect');
    await p.turn('sai rồi em, deploy phải dùng pm2 không dùng systemd', 'Xin lỗi Sếp, em nhầm');
    await p.turn('lại sai nữa, deploy nhớ dùng pm2 mà', 'Dạ em nhớ pm2 rồi');
    // Ask again about deploy — the brain should surface a learned reminder
    // (from error ledger and/or the distilled auto-reflection lesson).
    const inj = await p.turn('giờ deploy service này lên thế nào em', 'Dạ');
    expect(/pm2|đừng lặp|kinh nghiệm|rút kinh nghiệm|systemd/i.test(inj)).toBe(true);
  }, 40000);
});
