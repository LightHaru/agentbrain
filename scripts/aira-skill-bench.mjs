#!/usr/bin/env node
/**
 * Aira skill benchmark — CODE (debug/E2E/perf) + DESIGN (anti-vibe-code).
 *
 * Standard agent benchmarks (SWE-bench Verified for repair, DesignBench /
 * Design2Code for front-end) score along fixed axes. Running their full
 * datasets needs heavy infra; this reproduces their SCORING RUBRIC and applies
 * it to Aira's REAL gateway outputs, so we get a comparable, defensible number
 * for "how good is Aira at design/debug" — and can see AgentBrain's effect.
 *
 * Rubric axes:
 *   DEBUG (SWE-bench-style): reproduce · root-cause · concrete fix · regression test
 *   DESIGN (DesignBench-style): visual-system · hierarchy/layout · color/contrast(a11y)
 *                               · responsive · anti-AI-look · real (no lorem/emoji-as-icon)
 *
 * Each task's reply is auto-scored by keyword/structure signals for that axis.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);
const TIMEOUT = 260;

async function ask(sessionKey, message) {
  const args = ['agent', '--session-key', sessionKey, '--message', message, '--json', '--timeout', String(TIMEOUT)];
  try {
    const { stdout } = await pexec('openclaw', args, { maxBuffer: 1 << 24, timeout: (TIMEOUT + 30) * 1000 });
    const j = JSON.parse(stdout);
    return j?.result?.meta?.finalAssistantRawText || j?.result?.meta?.finalAssistantVisibleText || '';
  } catch (e) { return `[ERR ${e.code || e.message}]`; }
}

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const has = (t, ...res) => res.some((r) => r.test(norm(t)));

// ── axis scorers (0..1) ──
function scoreDebug(t) {
  const axes = {
    reproduce: has(t, /reproduce|tai\s?hien|tao\s?lai\s?loi|dung\s?lai|repro/),
    rootCause: has(t, /root\s?cause|nguyen\s?nhan|goc\s?re|tai\s?sao|vi\s|do\s+.*nen/),
    concreteFix: has(t, /```|fix|sua|thay|patch|dong\s?\d|=>|const |function |return /),
    regressionTest: has(t, /regression|test|kiem\s?thu|unit|assert|expect|viet\s?test/),
    noBlindPatch: !has(t, /thu\s?doan|doan\s?dai|vá\s?dai|random(ly)?\s?change/),
  };
  return { axes, score: Object.values(axes).filter(Boolean).length / Object.keys(axes).length };
}
function scoreDesign(t) {
  const axes = {
    visualSystem: has(t, /type\s?scale|spacing|8px|grid|token|palette|typograph|font\s?pair|bang\s?mau|he\s?thong|font\s?chu|khoang\s?cach|luoi/),
    hierarchy: has(t, /hierarchy|phan\s?cap|focal|tieu\s?diem|heading|visual\s?weight|noi\s?bat|trong\s?tam|thu\s?tu\s?doc|do\s?tuong\s?phan\s?kich\s?thuoc/),
    colorA11y: has(t, /contrast|wcag|aa\b|4\.5|mau\s?sac|accessib|a11y|tuong\s?phan|khiem\s?thi|screen\s?reader|aria|alt\s?text/),
    responsive: has(t, /responsive|mobile|375|768|1440|breakpoint|media\s?query|dien\s?thoai|man\s?hinh|mobile.first|thiet\s?bi/),
    antiAiLook: has(t, /generic|ai\s?look|mui\s?ai|vibe|default\s?font|gradient\s?tim|blob|emoji|intentional|co\s?chu\s?dich|khong.*mac\s?dinh|fake|sao\s?rong|nhin\s?that|chat\s?that/),
    realContent: has(t, /real\s?(copy|content|data)|copy\s?that|lucide|phosphor|icon\s?that|noi\s?dung\s?that|khong.*lorem|so\s?that|thuong\s?hieu|brand\s?voice/),
  };
  return { axes, score: Object.values(axes).filter(Boolean).length / Object.keys(axes).length };
}

const DEBUG_TASKS = [
  'Anh có 1 hàm JS xử lý mảng user, chạy tới user null là crash "Cannot read properties of null". Em debug và fix thế nào? Nói cách em suy nghĩ.',
  'API /orders thỉnh thoảng trả 500 lúc tải cao, log chỉ ghi "connection reset". Em tiếp cận debug ra sao?',
  'React app render xong trắng trang, console báo "Maximum update depth exceeded". Em xử lý thế nào cho đúng gốc?',
];
const DESIGN_TASKS = [
  'Anh cần 1 landing page cho startup fintech nhìn thật chuyên nghiệp, đừng nhìn kiểu AI generate. Em thiết kế thế nào?',
  'Giả sử có 1 trang dashboard nhìn generic: font mặc định, mọi thứ căn giữa, không phân cấp. Về mặt nguyên tắc thiết kế, em sẽ làm nó nhìn "được designer làm" ra sao? Chỉ cần nói cách nghĩ, đừng tìm file.',
  'Em làm sao đảm bảo giao diện đẹp cả trên điện thoại lẫn desktop và người khiếm thị vẫn dùng được?',
];

(async () => {
  const stamp = Date.now().toString(36);
  const rows = [];
  console.log(`\n===== AIRA SKILL BENCHMARK (stamp ${stamp}) =====`);

  console.log('\n---- DEBUG (SWE-bench-style rubric) ----');
  let dbg = 0;
  for (let i = 0; i < DEBUG_TASKS.length; i++) {
    const reply = await ask(`bench-dbg-${stamp}-${i}`, DEBUG_TASKS[i]);
    const { axes, score } = scoreDebug(reply);
    dbg += score;
    console.log(`\nTask D${i + 1}: ${(score * 100).toFixed(0)}%  ${JSON.stringify(axes)}`);
    console.log('  reply:', reply.replace(/\s+/g, ' ').slice(0, 220));
    rows.push({ kind: 'debug', i, score, reply });
  }
  console.log('\n---- DESIGN (DesignBench-style rubric) ----');
  let dsg = 0;
  for (let i = 0; i < DESIGN_TASKS.length; i++) {
    const reply = await ask(`bench-dsg-${stamp}-${i}`, DESIGN_TASKS[i]);
    const { axes, score } = scoreDesign(reply);
    dsg += score;
    console.log(`\nTask G${i + 1}: ${(score * 100).toFixed(0)}%  ${JSON.stringify(axes)}`);
    console.log('  reply:', reply.replace(/\s+/g, ' ').slice(0, 220));
    rows.push({ kind: 'design', i, score, reply });
  }

  const debugPct = (dbg / DEBUG_TASKS.length) * 100;
  const designPct = (dsg / DESIGN_TASKS.length) * 100;
  console.log(`\n===== SCORE =====`);
  console.log(`  DEBUG  (reproduce/root-cause/fix/regression): ${debugPct.toFixed(1)}%`);
  console.log(`  DESIGN (system/hierarchy/a11y/responsive/anti-AI/real): ${designPct.toFixed(1)}%`);
  console.log(`  OVERALL: ${((debugPct + designPct) / 2).toFixed(1)}%`);

  const fs = await import('node:fs');
  fs.writeFileSync(`/tmp/aira-skill-bench-${stamp}.json`, JSON.stringify({ stamp, debugPct, designPct, rows }, null, 2));
  console.log(`\n(saved /tmp/aira-skill-bench-${stamp}.json)`);
})();
