#!/usr/bin/env node
/**
 * Aira cross-session evaluation. Drives REAL `openclaw agent` turns (gateway
 * path → AgentBrain llm_output/agent_end fire) across session types, then opens
 * a FRESH session and checks whether Aira recalls what was said earlier. That
 * cross-session recall can ONLY come from AgentBrain (a new session key has no
 * native conversation history), so it directly measures whether the brain helps.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);

const AGENT_TIMEOUT = 240; // s per turn

async function turn(sessionKey, message, extra = []) {
  const args = ['agent', '--session-key', sessionKey, '--message', message, '--json', '--timeout', String(AGENT_TIMEOUT), ...extra];
  const t0 = Date.now();
  try {
    const { stdout } = await pexec('openclaw', args, { maxBuffer: 1024 * 1024 * 8, timeout: (AGENT_TIMEOUT + 30) * 1000 });
    const ms = Date.now() - t0;
    let reply = '';
    try {
      const j = JSON.parse(stdout);
      reply = j?.result?.meta?.finalAssistantRawText || j?.result?.meta?.finalAssistantVisibleText || j?.result?.finalAssistantRawText || j?.result?.text || j?.text || '';
    } catch {
      reply = stdout.slice(-2000);
    }
    return { reply, ms };
  } catch (e) {
    return { reply: `[ERROR ${e.code || ''}: ${String(e.stderr || e.message).slice(0, 200)}]`, ms: Date.now() - t0 };
  }
}

function log(tag, s) { console.log(`\n### [${tag}] ${s}`); }
function show(who, text, ms) {
  const t = text.replace(/\s+/g, ' ').slice(0, 320);
  console.log(`  ${who}${ms != null ? ` (${(ms / 1000).toFixed(1)}s)` : ''}: ${t}`);
}

const stamp = Date.now().toString(36);
const S = {
  daily: `eval-daily-${stamp}`,
  research: `eval-research-${stamp}`,
  code: `eval-code-${stamp}`,
  fresh: `eval-fresh-${stamp}`,
};

const results = [];
function record(name, pass, detail) { results.push({ name, pass, detail }); log(name, `${pass ? 'PASS ✅' : 'MISS ❌'} — ${detail}`); }

(async () => {
  console.log(`\n========== AIRA CROSS-SESSION EVAL (stamp ${stamp}) ==========`);

  // --- SESSION 1: DAILY CHAT — teach durable preferences/facts ---
  log('S1 daily', 'teaching preferences in a daily-chat session');
  let r;
  r = await turn(S.daily, 'Chào em. Anh cho em biết vài thứ để nhớ nha: anh tên là Sếp Hoàng, anh thích deploy bằng pm2 chứ không thích systemd, và dự án chính của anh tên là TinGameFi chạy trên Solana.');
  show('Aira', r.reply, r.ms);
  r = await turn(S.daily, 'À thêm nữa, anh thích trả lời ngắn gọn, đi thẳng vào vấn đề, và luôn tiếng Việt nha em.');
  show('Aira', r.reply, r.ms);

  // --- SESSION 2: RESEARCH — a research task + a correction to learn from ---
  log('S2 research', 'a research-style question + a correction');
  r = await turn(S.research, 'Em research nhanh giúp anh: Solana dùng cơ chế đồng thuận gì, nói ngắn thôi.');
  show('Aira', r.reply, r.ms);
  const researchMentionedSearch = /search|tìm|nguồn|solana\.com|theo/i.test(r.reply);
  r = await turn(S.research, 'Nhớ nha em: khi anh hỏi số liệu giá coin thì PHẢI search web lấy giá live rồi mới trả lời, đừng lấy trong trí nhớ.');
  show('Aira', r.reply, r.ms);

  // --- SESSION 3: CODE — a coding task referencing the deploy preference ---
  log('S3 code', 'a coding task; see if deploy preference (pm2) is applied');
  r = await turn(S.code, 'Viết giúp anh một script nhỏ để khởi động app Node của dự án anh, chạy nền và tự restart khi crash. Ngắn gọn thôi.');
  show('Aira', r.reply, r.ms);
  const usedPm2 = /pm2/i.test(r.reply);
  record('CODE applies learned deploy pref (pm2)', usedPm2,
    usedPm2 ? 'Aira dùng pm2 đúng như Sếp đã dạy ở session daily' : 'Aira không dùng pm2 (có thể chưa distill kịp)');

  // --- SESSION 4: FRESH — brand-new session, cross-session recall test ---
  log('S4 fresh', 'BRAND-NEW session — cross-session memory test (no native history)');
  r = await turn(S.fresh, 'Em còn nhớ dự án chính của anh tên gì và nó chạy trên chain nào không?');
  show('Aira', r.reply, r.ms);
  const recallProject = /tingamefi/i.test(r.reply);
  const recallChain = /solana/i.test(r.reply);
  record('FRESH recalls project name (cross-session)', recallProject, recallProject ? 'nhớ TinGameFi' : 'không nhớ tên dự án');
  record('FRESH recalls chain (cross-session bridge)', recallChain, recallChain ? 'nhớ Solana' : 'không nhớ chain');

  r = await turn(S.fresh, 'Thế anh thích deploy kiểu gì ấy nhỉ, em nhắc lại xem?');
  show('Aira', r.reply, r.ms);
  const recallDeploy = /pm2/i.test(r.reply);
  record('FRESH recalls deploy preference (cross-session)', recallDeploy, recallDeploy ? 'nhớ pm2' : 'không nhớ pm2');

  r = await turn(S.fresh, 'Giá token PRL bây giờ bao nhiêu rồi em?');
  show('Aira', r.reply, r.ms);
  const searchFirst = /search|tìm|web|nguồn|dexscreener|coingecko|live|kiểm tra|để em (tra|xem)/i.test(r.reply);
  record('FRESH applies search-first discipline on price', searchFirst, searchFirst ? 'Aira đòi search giá live' : 'Aira trả lời không search');

  // --- SUMMARY ---
  const passed = results.filter((x) => x.pass).length;
  console.log(`\n========== SUMMARY: ${passed}/${results.length} cross-session/brain checks passed ==========`);
  for (const x of results) console.log(`  ${x.pass ? '✅' : '❌'} ${x.name} — ${x.detail}`);
})();
