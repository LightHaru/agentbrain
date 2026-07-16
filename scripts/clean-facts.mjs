#!/usr/bin/env node
/**
 * One-time / periodic cleanup: remove rambling, question-like, multi-line facts
 * that the older loose extractor captured. These pollute the injected context
 * and make Aira distrust real facts. Uses the same predicate as runtime.
 * Usage: node scripts/clean-facts.mjs [--brain=/root/.openclaw/data/agentbrain] [--dry]
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const args = process.argv.slice(2);
const arg = (n, d) => { const h = args.find(a => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const dry = args.includes('--dry');
let brainDir = arg('brain', join(homedir(), '.openclaw/data/agentbrain'));
const dbPath = existsSync(join(brainDir, 'brain.db')) ? join(brainDir, 'brain.db') : brainDir;

function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function isCleanFact(f) {
  const subj = String(f.subject || '').trim(), obj = String(f.object || '').trim();
  if (!subj || !obj) return false;
  if (/\n/.test(subj) || /\n/.test(obj)) return false;
  if (subj.length > 42 || obj.length > 60) return false;
  if (subj.split(/\s+/).length > 7) return false;
  if (/[?？]|khong\s*em|duoc\s+khong|vay\s+ha|nhi$/i.test(norm(subj))) return false;
  return true;
}

const db = new Database(dbPath);
const rows = db.prepare('SELECT id, subject, relation, object FROM facts').all();
const junk = rows.filter(r => !isCleanFact(r));
console.log(`Total facts: ${rows.length} | junk: ${junk.length}`);
for (const j of junk.slice(0, 20)) console.log(`  ✗ [${j.subject}] ${j.relation} [${j.object}]`.replace(/\n/g, ' ').slice(0, 120));
if (!dry && junk.length) {
  const del = db.prepare('DELETE FROM facts WHERE id = ?');
  const tx = db.transaction((ids) => { for (const id of ids) del.run(id); });
  tx(junk.map(j => j.id));
  console.log(`\nDeleted ${junk.length} junk facts. Remaining: ${rows.length - junk.length}`);
} else if (dry) {
  console.log('\n(dry run — nothing deleted)');
}
db.close();
