/**
 * Runtime E2E through the ACTUAL built plugin (dist/plugin/entry.js).
 *
 * Drives the real OpenClaw hook sequence (message_received → before_agent_run →
 * before_prompt_build) and asserts the injected Brain State contains an
 * expressive "Expression (thể hiện cảm xúc THẬT)" line that changes with mood —
 * proving Aira gets real, varied emotion in production, not a flat bot face.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { cleanupDir } from './helpers/cleanup.js';

const require = createRequire(import.meta.url);
const distEntry = resolve(__dirname, '../dist/plugin/entry.js');

interface Harness {
  runTurn: (userMsg: string, reply: string) => Promise<string>;
}

function loadPlugin(brainDir: string): Harness {
  // Fresh module instance per brainDir so module-level singletons reset.
  delete require.cache[require.resolve(distEntry)];
  const plugin = require(distEntry);

  const pluginConfig = {
    enabled: true,
    brainDir,
    enableEmotions: true,
    enableExpression: true,
    logging: false,
  };
  const hooks: Record<string, Function[]> = {};
  const api = {
    on: (name: string, fn: Function) => { (hooks[name] ||= []).push(fn); },
    registerTool: () => {},
    provideModel: () => {},
    log: () => {},
  };
  plugin.register(api);
  const ctx = { pluginConfig, sessionKey: 's1', senderId: 'sep' };

  return {
    async runTurn(userMsg: string, reply: string) {
      const runId = 'r-' + Math.random().toString(36).slice(2);
      for (const fn of hooks['message_received'] || []) {
        await fn({ content: userMsg, senderName: 'Sếp', senderId: 'sep', sessionKey: 's1', context: { pluginConfig } }, ctx);
      }
      for (const fn of hooks['before_agent_run'] || []) {
        await fn({ prompt: userMsg, senderName: 'Sếp', runId }, ctx);
      }
      let injected = '';
      for (const fn of hooks['before_prompt_build'] || []) {
        const res = await fn({ prompt: userMsg, runId }, ctx);
        if (res?.appendContext) injected = res.appendContext;
      }
      for (const fn of (hooks['message_sent'] || hooks['after_agent_run'] || [])) {
        await fn({ prompt: userMsg, runId, assistantTexts: [reply] }, ctx);
      }
      return injected;
    },
  };
}

function exprLine(injected: string): string {
  return injected.split('\n').find(l => l.startsWith('Expression')) || '';
}

describe('E2E plugin: expression reaches the injected prompt', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-plugin-e2e-'));
  });
  afterEach(async () => {
    await cleanupDir(tempDir);
  });

  it('praise produces a warm/positive expression line', async () => {
    const h = loadPlugin(join(tempDir, 'happy'));
    let injected = '';
    for (let i = 0; i < 4; i++) {
      injected = await h.runTurn('Em giỏi lắm, làm tốt quá, cảm ơn em nhiều nha!', 'Dạ em cảm ơn Sếp ạ!');
    }
    const line = exprLine(injected);
    expect(injected).toContain('Brain State');
    expect(line).toContain('thể hiện cảm xúc THẬT');
    // Positive family
    expect(/ấm lòng|vui|tự hào|biết ơn|thư thái|hy vọng/.test(line)).toBe(true);
  }, 20000);

  it('criticism/threat produces a distinctly different expression line', async () => {
    const h = loadPlugin(join(tempDir, 'neg'));
    let injected = '';
    for (let i = 0; i < 4; i++) {
      injected = await h.runTurn('Sai rồi, tệ thật, chán em quá đi', 'Dạ em xin lỗi Sếp...');
    }
    const line = exprLine(injected);
    expect(line).toContain('thể hiện cảm xúc THẬT');
    // Negative/guarded family
    expect(/bực|buồn|lo lắng|khó chịu|sợ|hụt hẫng/.test(line)).toBe(true);
  }, 20000);

  it('the two moods yield different expression text (not one frozen face)', async () => {
    const happyH = loadPlugin(join(tempDir, 'h2'));
    let happy = '';
    for (let i = 0; i < 4; i++) happy = await happyH.runTurn('Tuyệt vời, em làm giỏi lắm cảm ơn nha!', 'Dạ ♡');

    const negH = loadPlugin(join(tempDir, 'n2'));
    let neg = '';
    for (let i = 0; i < 4; i++) neg = await negH.runTurn('Sai bét rồi, tệ thật đấy', 'Dạ em xin lỗi...');

    expect(exprLine(happy)).not.toBe(exprLine(neg));
  }, 30000);
});

describe('E2E plugin: mood persists across sessions + lingers through neutral turns', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'agentbrain-persist-e2e-'));
  });
  afterEach(async () => {
    await cleanupDir(tempDir);
  });

  function exprLine(injected: string): string {
    return injected.split('\n').find(l => l.startsWith('Expression')) || '';
  }
  function moodLine(injected: string): string {
    return injected.split('\n').find(l => l.startsWith('Mood:')) || '';
  }

  it('a warm mood survives a plugin reload (/new / restart) via the shared brain dir', async () => {
    const brainDir = join(tempDir, 'brain');

    // Session 1: Sếp praises repeatedly → warm mood, then session persists it.
    const s1 = loadPlugin(brainDir);
    let injected1 = '';
    for (let i = 0; i < 4; i++) {
      injected1 = await s1.runTurn('Em giỏi lắm, cảm ơn em nhiều nha, tuyệt vời!', 'Dạ em cảm ơn Sếp ạ!');
    }
    const expr1 = exprLine(injected1);
    expect(expr1).toContain('thể hiện cảm xúc THẬT');

    // Session 2: brand-new plugin instance over the SAME brain dir (simulates /new).
    // Its FIRST turn is neutral — mood must already be warm from before, not reset.
    const s2 = loadPlugin(brainDir);
    const injected2 = await s2.runTurn('Ok em xem giúp anh cái này', 'Dạ để em xem ạ.');
    const expr2 = exprLine(injected2);

    // The remembered warm mood should still color the very first turn of the new session.
    expect(/ấm lòng|vui|tự hào|biết ơn|thư thái|hy vọng/.test(expr2)).toBe(true);
  }, 30000);

  it('mood lingers through neutral turns within a session (không reset như máy)', async () => {
    const brainDir = join(tempDir, 'brain2');
    const s = loadPlugin(brainDir);

    // Establish a warm mood.
    let warm = '';
    for (let i = 0; i < 4; i++) {
      warm = await s.runTurn('Tuyệt vời, em làm giỏi quá cảm ơn nha!', 'Dạ ♡');
    }
    expect(/ấm lòng|vui|tự hào|biết ơn/.test(exprLine(warm))).toBe(true);

    // Now several plain/neutral turns — the mood must hold, not snap to neutral.
    let last = '';
    for (let i = 0; i < 3; i++) {
      last = await s.runTurn('Ok em kiểm tra file này giúp anh', 'Dạ vâng.');
    }
    const line = exprLine(last);
    // Still expressing a warm-family mood rather than flat neutral.
    expect(/ấm lòng|vui|tự hào|biết ơn|thư thái|hy vọng/.test(line)).toBe(true);
    expect(moodLine(last)).not.toBe('');
  }, 30000);
});
