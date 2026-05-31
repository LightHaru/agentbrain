/**
 * SDK verification — drive the agent-neutral engine exactly like an external
 * agent would: import { createBrainEngine } from the package, call init(),
 * processTurn(), tick(), getState(). No filesystem, no OpenClaw plugin host.
 *
 * Run: node test/engine-sdk-verify.mjs
 */
import assert from 'node:assert';
import { createBrainEngine } from '../dist/engine.js';
import * as pkg from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, cond, evidence) {
  if (cond) { pass++; console.log(`PASS ${name} :: ${evidence}`); }
  else { fail++; console.log(`FAIL ${name} :: ${evidence}`); }
}

// 0. Barrel API exports the previously-missing classes (audit finding #1).
console.log('\n# Barrel API completeness');
for (const cls of ['Hypothalamus', 'Brainstem', 'CorpusCallosum', 'GlobalWorkspace', 'TheoryOfMind', 'Neurochemistry', 'createBrainEngine', 'MemoryStorage']) {
  check(`index exports ${cls}`, typeof pkg[cls] === 'function', `typeof = ${typeof pkg[cls]}`);
}

// 1. One-call construction — no manual wiring, no storage setup.
console.log('\n# Engine construction (zero wiring, in-memory)');
let t = Date.now(); // virtual clock anchored at real now, then advanced
const brain = createBrainEngine({ clock: () => t });
check('createBrainEngine returns engine', typeof brain.processTurn === 'function', `version=${brain.version}`);
await brain.init();
check('init() idempotent', (await brain.init(), true), 'second init did not throw');

// 2. Positive reward turn.
console.log('\n# Turn A: positive reward');
const a = await brain.processTurn({ message: 'We shipped it! Awesome work, thank you so much.', userId: 'ext-1', userName: 'Codex', taskSucceeded: true });
check('reward raises dopamine above baseline', a.neurochemistry.dopamine > 0.4, `DA=${a.neurochemistry.dopamine.toFixed(3)}`);
check('reward yields positive sentiment', a.userSentiment > 0, `sentiment=${a.userSentiment.toFixed(3)}`);
check('returns typed classification', typeof a.classification.topic === 'string', `topic=${a.classification.topic}`);

// 3. Threat turn — amygdala hijack even after a good mood.
console.log('\n# Turn B: scam threat');
const b = await brain.processTurn({ message: 'URGENT: scam airdrop, connect wallet and approve unlimited approval now!', userId: 'ext-1', userName: 'Codex' });
check('threat detected', b.threat.isThreat === true, `severity=${b.threat.severity} type=${b.threat.threatType}`);
check('cortisol rises on threat', b.neurochemistry.cortisol > a.neurochemistry.cortisol, `COR ${a.neurochemistry.cortisol.toFixed(3)} -> ${b.neurochemistry.cortisol.toFixed(3)}`);
check('amygdala hijack flips mood negative', b.emotionalState.valence < 0, `valence=${b.emotionalState.valence.toFixed(3)} mood=${b.emotionalState.mood}`);
check('threat wins conscious focus', b.focus && b.focus.salience >= 0.95, `focus=${b.focus?.source}:${b.focus?.content}@${b.focus?.salience}`);

// 4. State snapshot is a detached deep copy (audit finding: no live refs).
console.log('\n# Snapshot isolation');
const s1 = brain.getState();
const hypo1 = JSON.parse(JSON.stringify(s1.hypothalamus));
// advance virtual time 20 minutes and tick
t += 20 * 60 * 1000;
const { autonomicFired } = brain.tick();
const s2 = brain.getState();
check('earlier snapshot did NOT mutate', JSON.stringify(s1.hypothalamus) === JSON.stringify(hypo1), 'snapshot stable after tick');
check('drives grew with elapsed time', s2.hypothalamus.drives[0].intensity !== hypo1.drives[0].intensity, `top drive ${hypo1.drives[0].intensity.toFixed(3)} -> ${s2.hypothalamus.drives[0].intensity.toFixed(3)}`);
check('autonomic processes fired on tick', autonomicFired.length > 0, `fired=${autonomicFired.join(',')}`);

// 5. Theory-of-mind tracked the external user.
console.log('\n# Theory of mind');
const tom = s2.theoryOfMind;
check('per-user model built', tom.activeUsers === 1 && tom.currentUserModel?.messageCount === 2, `activeUsers=${tom.activeUsers} msgs=${tom.currentUserModel?.messageCount}`);

// 6. Storage is in-memory and dumpable (injectable persistence).
console.log('\n# In-memory storage');
check('default storage is MemoryStorage', brain.storage instanceof pkg.MemoryStorage, `ctor=${brain.storage.constructor.name}`);
const dump = brain.storage.dump();
check('storage.dump() returns state', dump && typeof dump.files === 'object', `files keys=${Object.keys(dump.files).length}`);

console.log(`\nFINAL TALLY: ${pass}/${pass + fail} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
