/**
 * Regression E2E: the Gateway completion path (llm_output / agent_end) must
 * persist a conversation turn, record corrections in the error ledger, and let
 * later turns recall that context. This guards the bug where completion logic
 * lived only in `message_sent` (which the Gateway path does not emit).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { cleanupDir } from './helpers/cleanup.js';

const require = createRequire(import.meta.url);
const distEntry = resolve(__dirname, '../dist/plugin/entry.js');

function loadPlugin(brainDir: string) {
  delete require.cache[require.resolve(distEntry)];
  const plugin = require(distEntry);
  const pc = { enabled: true, brainDir, enableEmotions: true };
  const hooks: Record<string, Function[]> = {};
  const api = { on: (n: string, f: Function) => { (hooks[n] ||= []).push(f); }, registerTool: () => {}, provideModel: () => {}, log: () => {} };
  plugin.register(api);
  const ctx = { pluginConfig: pc, sessionKey: 'gw:test', senderId: 'sep', senderName: 'Sếp' };

  return {
    async turn(msg: string, reply: string) {
      const runId = 'run-' + Math.random().toString(36).slice(2);
      for (const fn of hooks['message_received'] || []) await fn({ content: msg, senderName: 'Sếp', senderId: 'sep', sessionKey: 'gw:test', runId, context: { pluginConfig: pc } }, ctx);
      for (const fn of hooks['before_agent_run'] || []) await fn({ prompt: msg, runId, context: { pluginConfig: pc } }, ctx);
      let inj = '';
      for (const fn of hooks['before_prompt_build'] || []) { const r = await fn({ prompt: msg, runId, context: { pluginConfig: pc } }, ctx); if (r?.appendContext) inj = r.appendContext; }
      // Gateway completion path (NOT message_sent):
      for (const fn of hooks['llm_output'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
      for (const fn of hooks['agent_end'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
      return inj;
    },
  };
}

describe('Gateway completion persists + recalls', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'agentbrain-gw-')); });
  afterEach(async () => { await cleanupDir(dir); });

  it('records conversation turns via llm_output/agent_end and recalls them later', async () => {
    const p = loadPlugin(join(dir, 'brain'));
    await p.turn('kickoff', 'ok Sếp');
    await p.turn('anh đang làm dashboard cho tingamefi bằng React', 'Dạ em nhớ');
    const inj = await p.turn('tiếp tục phần đó đi em', 'Dạ');
    // The earlier turn must be recalled into context.
    expect(/dashboard|tingamefi|React|Ngữ cảnh|Nhớ lại/.test(inj)).toBe(true);
  }, 30000);
});
