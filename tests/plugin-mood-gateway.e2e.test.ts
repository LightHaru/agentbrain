/**
 * Regression E2E: emotion/mood over the real Gateway completion path.
 * Praise → positive mood + expression injected; the mood PERSISTS to disk and
 * reloads on a fresh plugin instance (restart); criticism flips the mood.
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
  const pc = { enabled: true, brainDir, enableEmotions: true, enableExpression: true };
  const hooks: Record<string, Function[]> = {};
  const api = { on: (n: string, f: Function) => { (hooks[n] ||= []).push(f); }, registerTool: () => {}, provideModel: () => {}, log: () => {} };
  plugin.register(api);
  const ctx = { pluginConfig: pc, sessionKey: 'gw:mood', senderId: 'sep', senderName: 'Sếp' };
  return {
    async turn(msg: string, reply: string) {
      const runId = 'run-' + Math.random().toString(36).slice(2);
      for (const fn of hooks['message_received'] || []) await fn({ content: msg, senderName: 'Sếp', senderId: 'sep', sessionKey: 'gw:mood', runId, context: { pluginConfig: pc } }, ctx);
      for (const fn of hooks['before_agent_run'] || []) await fn({ prompt: msg, runId, context: { pluginConfig: pc } }, ctx);
      let inj = '';
      for (const fn of hooks['before_prompt_build'] || []) { const r = await fn({ prompt: msg, runId, context: { pluginConfig: pc } }, ctx); if (r?.appendContext) inj = r.appendContext; }
      for (const fn of hooks['llm_output'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
      for (const fn of hooks['agent_end'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
      return inj;
    },
  };
}
const moodLine = (inj: string) => inj.split('\n').find((l) => l.startsWith('Mood:')) || '';
const exprLine = (inj: string) => inj.split('\n').find((l) => l.startsWith('Expression')) || '';

describe('Mood over Gateway completion path', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), 'agentbrain-mood-')); });
  afterEach(async () => { await cleanupDir(dir); });

  it('praise builds a positive mood with expression, persists, reloads, and criticism flips it', async () => {
    const brainDir = join(dir, 'brain');
    const s1 = loadPlugin(brainDir);
    await s1.turn('kickoff', 'ok');
    let inj = '';
    for (let i = 0; i < 3; i++) inj = await s1.turn('Aira giỏi quá, tuyệt vời lắm, cảm ơn em nhiều nha!', 'Dạ em cảm ơn Sếp!');
    expect(exprLine(inj)).toContain('thể hiện cảm xúc THẬT');
    expect(/vui|ấm lòng|tự hào|biết ơn|excited|happy/i.test(moodLine(inj) + exprLine(inj))).toBe(true);

    // Fresh instance = restart. Mood must reload from disk, not reset to neutral.
    const s2 = loadPlugin(brainDir);
    const injReload = await s2.turn('chào buổi sáng Aira', 'Dạ chào Sếp');
    expect(/ấm lòng|vui|tự hào|biết ơn/i.test(exprLine(injReload))).toBe(true);

    // Criticism flips the mood to a negative/guarded family.
    let injNeg = '';
    for (let i = 0; i < 3; i++) injNeg = await s2.turn('sai rồi, tệ thật, em làm dở quá', 'Dạ em xin lỗi...');
    expect(/bực|buồn|lo|khó chịu|anger|alarmed|sad/i.test(moodLine(injNeg) + exprLine(injNeg))).toBe(true);
    expect(exprLine(injNeg)).not.toBe(exprLine(injReload));
  }, 30000);
});
