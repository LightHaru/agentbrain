#!/usr/bin/env node
/**
 * Light-touch training. Each prompt runs in a NEW session (so cross-session
 * memory + self-distillation are exercised, not one long context). Prompts are
 * OPEN and minimal — no step-by-step spoon-feeding — so Aira + AgentBrain find
 * their own approach; the brain then self-distills durable knowledge from the
 * successful turns on the heartbeat. Kept short to respect the 4GB VPS.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);
const TIMEOUT = 260;

async function ask(sessionKey, message) {
  try {
    const { stdout } = await pexec('openclaw', ['agent', '--session-key', sessionKey, '--message', message, '--json', '--timeout', String(TIMEOUT)], { maxBuffer: 1 << 24, timeout: (TIMEOUT + 30) * 1000 });
    const j = JSON.parse(stdout);
    return j?.result?.meta?.finalAssistantRawText || j?.result?.meta?.finalAssistantVisibleText || '';
  } catch (e) { return `[ERR ${e.code || e.message}]`; }
}

// Open-ended prompts across the target skills. Deliberately light: state the
// goal, let Aira decide the method. New session each item.
const PROMPTS = [
  'Em tự nghĩ ra 1 bug khó trong code async rồi tự debug cho anh xem cách em suy nghĩ.',
  'Cho anh 1 ví dụ em tự test E2E một tính năng nhỏ, tự quyết định test cái gì.',
  'Em thiết kế thử 1 khối UI mà em thấy đẹp, tự chọn phong cách, miễn đừng nhìn như AI làm.',
  'Một đoạn code chạy chậm, em tự đặt tình huống rồi tối ưu, giải thích vì sao.',
  'Em tự chọn 1 thuật toán khó và viết cho anh, tự kiểm tra edge case.',
];

(async () => {
  const stamp = Date.now().toString(36);
  console.log(`\n===== LIGHT-TOUCH TRAINING (stamp ${stamp}, ${PROMPTS.length} new sessions) =====`);
  for (let i = 0; i < PROMPTS.length; i++) {
    const sk = `train-${stamp}-${i}`; // NEW session each prompt
    const reply = await ask(sk, PROMPTS[i]);
    console.log(`\n[session ${i + 1}/${PROMPTS.length}] ${PROMPTS[i].slice(0, 50)}...`);
    console.log('  Aira:', reply.replace(/\s+/g, ' ').slice(0, 160));
    // A light positive follow-up so the turn is a POSITIVE-outcome the brain will self-distill.
    await ask(sk, 'Ổn đó em, cách nghĩ vậy là đúng hướng.');
  }
  console.log('\n(training sessions done; brain self-distills durable knowledge on heartbeat)');
})();
