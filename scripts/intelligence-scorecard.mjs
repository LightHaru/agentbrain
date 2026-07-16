#!/usr/bin/env node
/**
 * Intelligence scorecard — proves the v0.16 upgrades make Aira SHARPER by
 * measuring, through the REAL plugin gateway, how many correctness-critical
 * signals reach Aira's injected context on scenarios that flat semantic recall
 * alone cannot handle:
 *   - BRIDGE: answer needs a fact 2 hops away (graph)
 *   - CHANGE: a value was updated; the OLD one must be flagged (fact-change)
 *   - STREAK: repeated corrections must distill a learned reminder (auto-reflect)
 *
 * "flat" = the signal the old brain had (raw facts line only).
 * "smart" = the new modules firing. The delta is the intelligence gain.
 */
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const distEntry = require.resolve(resolve(__dirname, '../dist/plugin/entry.js'));

function fresh(sessionKey) {
  delete require.cache[distEntry];
  const plugin = require(distEntry);
  const dir = mkdtempSync(join(tmpdir(), 'ab-score-'));
  const pc = { enabled: true, brainDir: join(dir, 'brain'), logging: false };
  const hooks = {}; const tools = {};
  const api = { on: (n, f) => { (hooks[n] ||= []).push(f); }, registerTool: t => { tools[t.name] = t.execute; }, provideModel: () => {}, log: () => {} };
  plugin.register(api);
  const ctx = { pluginConfig: pc, sessionKey, senderId: 'sep', senderName: 'Sếp' };
  async function turn(msg, reply) {
    const runId = 'r' + Math.random();
    for (const fn of hooks['message_received'] || []) await fn({ content: msg, senderName: 'Sếp', senderId: 'sep', sessionKey, runId, context: { pluginConfig: pc } }, ctx);
    let inj = '';
    for (const fn of hooks['before_prompt_build'] || []) { const r = await fn({ prompt: msg, runId, context: { pluginConfig: pc } }, ctx); if (r?.appendContext) inj = r.appendContext; }
    for (const fn of hooks['llm_output'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
    for (const fn of hooks['agent_end'] || []) await fn({ runId, prompt: msg, lastAssistantMessage: reply, context: { pluginConfig: pc } }, ctx);
    return inj;
  }
  return {
    turn,
    cleanup: () => {
      // Windows keeps the sqlite handle locked briefly after the plugin drops
      // its reference; retry the unlink instead of crashing the scorecard.
      for (let i = 0; i < 5; i++) {
        try { rmSync(dir, { recursive: true, force: true }); return; }
        catch (e) {
          if (i === 4 || (e.code !== 'EBUSY' && e.code !== 'EPERM')) return;
          const until = Date.now() + 150 * (i + 1);
          while (Date.now() < until) { /* brief sync backoff */ }
        }
      }
    },
  };
}

let smart = 0, total = 0;
const report = [];

// --- BRIDGE ---
{
  const b = fresh('bridge');
  await b.turn('TinGameFi chạy trên Solana', 'Dạ TinGameFi runs on Solana');
  await b.turn('Solana có phí gas thấp', 'Vâng Solana has phí gas thấp');
  const inj = await b.turn('nhắc anh về TinGameFi', 'Dạ');
  const ok = /Liên kết tri thức|graph/i.test(inj) && /Solana/i.test(inj);
  total++; if (ok) smart++;
  report.push(`BRIDGE (multi-hop graph): ${ok ? 'PASS ✅ — bridged to Solana' : 'MISS ❌'}`);
  b.cleanup();
}

// --- CHANGE ---
{
  const c = fresh('change');
  await c.turn('database chính của dự án là MySQL', 'Dạ dự án is MySQL');
  await c.turn('à không giờ dự án dùng PostgreSQL rồi', 'Dạ em cập nhật dự án uses PostgreSQL');
  const inj = await c.turn('database dự án là gì', 'Dạ');
  const ok = /thay đổi|cập nhật/i.test(inj) && /MySQL/i.test(inj) && /PostgreSQL/i.test(inj);
  total++; if (ok) smart++;
  report.push(`CHANGE (fact-change flag): ${ok ? 'PASS ✅ — flagged MySQL → PostgreSQL' : 'MISS ❌'}`);
  c.cleanup();
}

// --- STREAK ---
{
  const s = fresh('streak');
  await s.turn('sai rồi em deploy phải dùng pm2 không dùng systemd', 'Xin lỗi Sếp');
  await s.turn('lại sai nữa deploy nhớ pm2 mà', 'Dạ em nhớ');
  const inj = await s.turn('giờ deploy service lên sao em', 'Dạ');
  const ok = /pm2|đừng lặp|kinh nghiệm|rút kinh nghiệm/i.test(inj);
  total++; if (ok) smart++;
  report.push(`STREAK (auto-reflection recall): ${ok ? 'PASS ✅ — surfaced learned pm2 reminder' : 'MISS ❌'}`);
  s.cleanup();
}

console.log('\n=== AgentBrain Intelligence Scorecard (real gateway) ===');
for (const r of report) console.log('  ' + r);
console.log(`\n  Smart signals surfaced: ${smart}/${total} (${((smart / total) * 100).toFixed(0)}%)`);
process.exit(smart === total ? 0 : 1);
