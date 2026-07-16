#!/usr/bin/env node
/**
 * HumanEval-style pass@1 harness (executable). For each task: get a solution,
 * extract the Python function, run it against HIDDEN unit tests in a fresh
 * subprocess, and score pass@1 = fraction of tasks whose tests all pass.
 * This is exactly how HumanEval scores (execute vs unit tests, not string match).
 *
 *   --solver=aira        drive real `openclaw agent` (new session per task)
 *   --solver=file --answers=path.json   score pre-captured answers {id: code}
 *   --brain=on|off       (aira) note only; toggle is done via config externally
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const pexec = promisify(execFile);
const TIMEOUT = 260;

const args = process.argv.slice(2);
const arg = (n, d) => { const h = args.find(a => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const solver = arg('solver', 'aira');
const tasksFile = arg('tasks', 'humaneval-lite.json');
const tasks = JSON.parse(readFileSync(new URL('./' + tasksFile, import.meta.url)));
const label = arg('label', solver);

function extractCode(reply) {
  // Prefer fenced python block; else any fenced block; else raw text.
  const fence = reply.match(/```(?:python|py)?\s*([\s\S]*?)```/i);
  let code = fence ? fence[1] : reply;
  return code.trim();
}

function runTests(code, entry, tests) {
  const dir = mkdtempSync(join(tmpdir(), 'he-'));
  try {
    const prog = `${code}\n\n# --- hidden tests ---\n${tests}\nprint("__ALL_PASS__")\n`;
    writeFileSync(join(dir, 'sol.py'), prog);
    return new Promise((resolve) => {
      execFile('python3', [join(dir, 'sol.py')], { timeout: 15000 }, (err, stdout, stderr) => {
        rmSync(dir, { recursive: true, force: true });
        if (stdout.includes('__ALL_PASS__')) resolve({ pass: true });
        else resolve({ pass: false, err: (stderr || stdout || String(err)).split('\n').filter(Boolean).slice(-2).join(' ').slice(0, 160) });
      });
    });
  } catch (e) {
    rmSync(dir, { recursive: true, force: true });
    return Promise.resolve({ pass: false, err: String(e).slice(0, 160) });
  }
}

async function askAira(taskId, prompt) {
  const sessionKey = `he-${label}-${taskId}-${Date.now().toString(36)}`; // NEW session each task
  const msg = `${prompt}\n\nChỉ trả về code Python trong 1 block \`\`\`python\`\`\`, không giải thích dài.`;
  try {
    const { stdout } = await pexec('openclaw', ['agent', '--session-key', sessionKey, '--message', msg, '--json', '--timeout', String(TIMEOUT)], { maxBuffer: 1 << 24, timeout: (TIMEOUT + 30) * 1000 });
    const j = JSON.parse(stdout);
    return j?.result?.meta?.finalAssistantRawText || j?.result?.meta?.finalAssistantVisibleText || '';
  } catch (e) { return `[ERR ${e.code || e.message}]`; }
}

const answers = solver === 'file' ? JSON.parse(readFileSync(arg('answers'))) : null;

(async () => {
  let passed = 0;
  const rows = [];
  console.log(`\n===== HumanEval-lite pass@1 — solver=${label} (${tasks.length} tasks) =====`);
  for (const t of tasks) {
    let reply;
    if (solver === 'file') reply = '```python\n' + (answers[t.id] || '') + '\n```';
    else reply = await askAira(t.id, t.prompt);
    const code = extractCode(reply);
    const res = await runTests(code, t.entry, t.tests);
    if (res.pass) passed++;
    console.log(`  ${res.pass ? 'PASS ✅' : 'FAIL ❌'} ${t.id}${res.pass ? '' : '  — ' + (res.err || '')}`);
    rows.push({ id: t.id, pass: res.pass, code });
  }
  const pct = (passed / tasks.length) * 100;
  console.log(`\n  pass@1 = ${passed}/${tasks.length} = ${pct.toFixed(1)}%`);
  writeFileSync(`/tmp/humaneval-${label}-${Date.now().toString(36)}.json`, JSON.stringify({ label, pct, rows }, null, 2));
})();
