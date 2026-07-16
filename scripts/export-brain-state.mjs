#!/usr/bin/env node
/**
 * Export a LIVE brain.db into the dashboard's data file so the 3D dashboard
 * shows the real brain (memories, personality, mood, skills, motivation)
 * instead of mock data.
 *
 * Usage:
 *   node scripts/export-brain-state.mjs [--brain=/root/.openclaw/data/agentbrain] [--out=dashboard/public/brain-state.json]
 */
import { createRequire } from 'node:module';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const args = process.argv.slice(2);
function arg(name, def) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : def;
}

let brainDir = arg('brain', join(homedir(), '.openclaw/data/agentbrain'));
if (brainDir.startsWith('~')) brainDir = join(homedir(), brainDir.slice(2));
const dbPath = existsSync(join(brainDir, 'brain.db')) ? join(brainDir, 'brain.db') : brainDir;
const outPath = resolve(arg('out', 'dashboard/public/brain-state.json'));

if (!existsSync(dbPath)) {
  console.error(`[export] No brain.db found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });
const q = (sql, ...p) => { try { return db.prepare(sql).all(...p); } catch { return []; } };
const q1 = (sql, ...p) => { try { return db.prepare(sql).get(...p); } catch { return undefined; } };

// --- Memories ---
const memStats = q1(`SELECT
  COUNT(*) total,
  SUM(CASE WHEN type='episodic' THEN 1 ELSE 0 END) episodic,
  SUM(CASE WHEN type='semantic' THEN 1 ELSE 0 END) semantic,
  SUM(CASE WHEN type='procedural' THEN 1 ELSE 0 END) procedural
  FROM memories`) || {};
const recentMem = q(`SELECT id, content, last_accessed FROM memories ORDER BY last_accessed DESC LIMIT 6`);

// --- Personality (0..100) ---
const traitRows = q(`SELECT trait, value FROM personality`);
const traits = {};
for (const r of traitRows) traits[r.trait] = r.value;
const T = (k, d) => (typeof traits[k] === 'number' ? Math.round(traits[k]) : d);

// --- Emotional state (stored as meta markdown blob) ---
let mood = 'neutral', intensity = 0.5;
const emoMeta = q1(`SELECT value FROM meta WHERE key = 'emotional_state'`);
if (emoMeta?.value) {
  const m = /mood[:\s]+([a-zA-Z]+)/i.exec(emoMeta.value);
  if (m) mood = m[1].toLowerCase();
  const iv = /intensity[:\s]+([\d.]+)/i.exec(emoMeta.value);
  if (iv) intensity = Math.min(1, parseFloat(iv[1]));
}

// --- Skills ---
const skillRows = q(`SELECT name, proficiency, times_used, last_used FROM skills ORDER BY proficiency DESC LIMIT 12`);
const skills = {};
for (const s of skillRows) {
  skills[s.name] = { level: Math.round(s.proficiency), experience: s.times_used, lastUsed: s.last_used };
}

// --- Knowledge / facts / lessons counts for activity signal ---
const factCount = (q1(`SELECT COUNT(*) c FROM facts WHERE superseded_by IS NULL`) || {}).c || 0;
const lessonCount = (q1(`SELECT COUNT(*) c FROM lessons`) || {}).c || 0;
const reflectionCount = (q1(`SELECT COUNT(*) c FROM reflections`) || {}).c || 0;
let knowledgeCount = 0;
try { knowledgeCount = (q1(`SELECT COUNT(*) c FROM knowledge`) || {}).c || 0; } catch {}

const total = memStats.total || 0;
const act = (n) => Math.max(0.05, Math.min(1, n / Math.max(1, total)));

const regions = [
  { id: 'memory', name: 'Memory', color: '#8B5CF6', position: [0, 0.5, 0.8], active: total > 0, activityLevel: total > 0 ? 0.9 : 0 },
  { id: 'emotion', name: 'Emotion', color: '#EC4899', position: [-0.7, 0, 0.3], active: mood !== 'neutral', activityLevel: intensity },
  { id: 'executive', name: 'Executive', color: '#3B82F6', position: [0, 0.8, 0], active: reflectionCount > 0, activityLevel: act(reflectionCount) },
  { id: 'reward', name: 'Reward', color: '#10B981', position: [0.7, 0, 0.3], active: lessonCount > 0, activityLevel: act(lessonCount) },
  { id: 'reflection', name: 'Reflection', color: '#F59E0B', position: [0, -0.5, 0.8], active: reflectionCount > 0, activityLevel: act(reflectionCount) },
  { id: 'skill', name: 'Skill', color: '#06B6D4', position: [-0.5, -0.3, -0.5], active: skillRows.length > 0, activityLevel: act(skillRows.length) },
  { id: 'routing', name: 'Routing', color: '#EF4444', position: [0.5, -0.3, -0.5], active: factCount > 0, activityLevel: act(factCount) },
];

const state = {
  timestamp: new Date().toISOString(),
  live: true,
  source: dbPath,
  counts: { facts: factCount, lessons: lessonCount, reflections: reflectionCount, knowledge: knowledgeCount },
  regions,
  personality: {
    independence: T('independence', T('directness', 80)),
    loyalty: T('loyalty', 90),
    sassiness: T('sassiness', T('humor', 60)),
    protectiveness: T('protectiveness', 85),
    antiHallucination: T('antiHallucination', T('conscientiousness', 90)),
    engineerMindset: T('engineerMindset', T('analytical', 90)),
    craftsmanship: T('craftsmanship', 85),
    cuteness: T('cuteness', T('warmth', 70)),
    attachment: T('attachment', T('depth', 60)),
  },
  emotions: {
    mood,
    intensity,
    recentEmotions: [],
  },
  skills,
  memories: {
    total,
    byType: {
      episodic: memStats.episodic || 0,
      semantic: memStats.semantic || 0,
      procedural: memStats.procedural || 0,
    },
    recentAccess: recentMem.map((m) => ({ id: m.id, content: String(m.content).slice(0, 100), timestamp: m.last_accessed })),
  },
  motivation: {
    curiosity: T('curiosity', 80),
    achievement: T('achievement', 88),
    social: T('social', T('warmth', 75)),
    safety: T('safety', T('conscientiousness', 85)),
  },
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(state, null, 2));
db.close();
console.log(`[export] Wrote live brain state → ${outPath}`);
console.log(`[export] memories=${total} facts=${factCount} lessons=${lessonCount} knowledge=${knowledgeCount} mood=${mood}`);
