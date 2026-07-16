#!/usr/bin/env node
/**
 * DESIGN benchmark (harder tier). The agent must produce a COMPLETE HTML/CSS
 * artifact; we score its STRUCTURE against Design2Code-style measurable
 * criteria (no screenshots needed): design tokens, hierarchy, responsive,
 * interaction states, accessibility, and anti-AI-look tells. Same harness runs
 * the teacher (from file) and Aira (via gateway, new session per task).
 *
 *   --solver=aira | --solver=file --answers=path.json
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, readFileSync } from 'node:fs';
const pexec = promisify(execFile);
const TIMEOUT = 300;

const args = process.argv.slice(2);
const arg = (n, d) => { const h = args.find(a => a.startsWith(`--${n}=`)); return h ? h.split('=').slice(1).join('=') : d; };
const solver = arg('solver', 'aira');
const label = arg('label', solver);
const tasks = JSON.parse(readFileSync(new URL('./design-tasks.json', import.meta.url)));

function extractHtml(reply) {
  const m = reply.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : reply).trim();
}

// Measurable design criteria (0/1 each) — modeled on Design2Code axes + a11y.
function scoreDesign(html) {
  const h = html.toLowerCase();
  const css = (html.match(/<style[\s\S]*?<\/style>/i) || [''])[0].toLowerCase();
  const c = {
    completeDoc: /<!doctype|<html/.test(h) && /<\/html>|<body/.test(h),
    designTokens: /(--[a-z-]+\s*:|:root\s*{)/.test(css),                       // CSS variables / tokens
    typeScale: /(font-size)/.test(css) && (css.match(/font-size/g) || []).length >= 3, // multiple sizes = hierarchy
    spacingSystem: /(padding|margin|gap)/.test(css) && /(rem|em|px)/.test(css),
    hierarchy: /<h1/.test(h) && /<h2|<h3/.test(h),                             // heading hierarchy
    responsive: /@media|clamp\(|minmax\(|flex-wrap|grid-template-columns.*(auto|minmax|repeat)/.test(css) || /viewport/.test(h),
    interactionState: /:hover|:focus|:focus-visible|:active|transition/.test(css),
    a11y: /aria-|alt=|:focus-visible|role=|<label/.test(h + css),
    // anti-AI-look: NOT relying on the generic purple gradient + NO emoji-as-icon
    noPurpleGradient: !/linear-gradient\([^)]*(#?(?:6|7|8|9)[0-9a-f]{2}[0-9a-f]{2}f|purple|violet|indigo|#6366f1|#8b5cf6|#a855f7)/i.test(css),
    noEmojiIcon: !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html.replace(/<style[\s\S]*?<\/style>/i,'')),
    noLorem: !/lorem ipsum/.test(h),
    realFont: /font-family\s*:/.test(css) && !/font-family\s*:\s*(times|arial|sans-serif\s*;?\s*})/.test(css),
  };
  const keys = Object.keys(c);
  const passed = keys.filter(k => c[k]).length;
  return { criteria: c, score: passed / keys.length };
}

async function askAira(taskId, prompt) {
  const sk = `dgn-${label}-${taskId}-${Date.now().toString(36)}`; // NEW session each task
  try {
    const { stdout } = await pexec('openclaw', ['agent', '--session-key', sk, '--message', prompt, '--json', '--timeout', String(TIMEOUT)], { maxBuffer: 1 << 25, timeout: (TIMEOUT + 30) * 1000 });
    const j = JSON.parse(stdout);
    return j?.result?.meta?.finalAssistantRawText || j?.result?.meta?.finalAssistantVisibleText || '';
  } catch (e) { return `[ERR ${e.code || e.message}]`; }
}

const answers = solver === 'file' ? JSON.parse(readFileSync(arg('answers'))) : null;

(async () => {
  let total = 0;
  const rows = [];
  console.log(`\n===== DESIGN BENCHMARK — solver=${label} (${tasks.length} tasks, structural rubric) =====`);
  for (const t of tasks) {
    const reply = solver === 'file' ? (answers[t.id] || '') : await askAira(t.id, t.prompt);
    const html = extractHtml(reply);
    const { criteria, score } = scoreDesign(html);
    total += score;
    const failed = Object.keys(criteria).filter(k => !criteria[k]);
    console.log(`\n${t.id}: ${(score * 100).toFixed(0)}%  ${failed.length ? 'miss: ' + failed.join(',') : '(all pass)'}`);
    rows.push({ id: t.id, score, failed, htmlLen: html.length });
  }
  const pct = (total / tasks.length) * 100;
  console.log(`\n  DESIGN score = ${pct.toFixed(1)}%`);
  writeFileSync(`/tmp/design-${label}-${Date.now().toString(36)}.json`, JSON.stringify({ label, pct, rows }, null, 2));
})();
