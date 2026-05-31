// Phase 3 verification — does neurochemistry give emotion real momentum?
import { Neurochemistry } from '../dist/core/neurochemistry.js';

// minimal fake file manager (no disk)
const fakeFM = { readFile: async () => null, writeFile: async () => {} };
const cfg = { brainDir: '/tmp' };

function bar(v) { const n = Math.round(v * 20); return '█'.repeat(n) + '·'.repeat(20 - n); }

const nc = new Neurochemistry(cfg, fakeFM);
await nc.initialize();

console.log('\n=== TEST 1: Praise spikes dopamine + oxytocin, lifts valence ===');
let s0 = nc.getState();
console.log('baseline      DA', bar(s0.dopamine), s0.dopamine.toFixed(2), '| OXT', bar(s0.oxytocin), s0.oxytocin.toFixed(2));
nc.applyEvent(0.8, false, 'none', 0.8); // strong praise
let m1 = nc.modulate();
let s1 = nc.getState();
console.log('after praise  DA', bar(s1.dopamine), s1.dopamine.toFixed(2), '| OXT', bar(s1.oxytocin), s1.oxytocin.toFixed(2));
console.log('valenceBias:', m1.valenceBias.toFixed(3), '(should be > 0)', m1.valenceBias > 0 ? 'PASS' : 'FAIL');

console.log('\n=== TEST 2: Threat spikes cortisol, suppresses valence, raises arousal, lowers inertia ===');
const nc2 = new Neurochemistry(cfg, fakeFM); await nc2.initialize();
nc2.applyEvent(-0.6, true, 'critical', 0);
let m2 = nc2.modulate();
let s2 = nc2.getState();
console.log('cortisol', bar(s2.cortisol), s2.cortisol.toFixed(2));
console.log('valenceBias:', m2.valenceBias.toFixed(3), '(should be < 0)', m2.valenceBias < 0 ? 'PASS' : 'FAIL');
console.log('arousalBias:', m2.arousalBias.toFixed(3), '(should be > 0)', m2.arousalBias > 0 ? 'PASS' : 'FAIL');
console.log('inertia under stress:', m2.inertia.toFixed(3), '(should be < 0.6 = more reactive)', m2.inertia < 0.6 ? 'PASS' : 'FAIL');

console.log('\n=== TEST 3: Stress LINGERS (cortisol decays slower per-step than dopamine) ===');
// Isolate each chemical on its own instance so nothing blunts the other.
const ncDA = new Neurochemistry(cfg, fakeFM); await ncDA.initialize();
ncDA.applyEvent(0.9, false, 'none', 0); // pure praise -> dopamine up, no threat
const daB = ncDA.getState().dopamine;
ncDA.decay(3);
const daA = ncDA.getState().dopamine;
const daProp = (daB - daA) / Math.max(0.01, daB - 0.4); // fraction of distance-to-baseline closed

const ncCOR = new Neurochemistry(cfg, fakeFM); await ncCOR.initialize();
ncCOR.applyEvent(0, true, 'critical', 0); // pure threat -> cortisol up
const corB = ncCOR.getState().cortisol;
ncCOR.decay(3);
const corA = ncCOR.getState().cortisol;
const corProp = (corB - corA) / Math.max(0.01, corB - 0.2);

console.log('dopamine closed', daProp.toFixed(2), 'of gap in 3 hb | cortisol closed', corProp.toFixed(2));
console.log('dopamine decays a larger fraction (faster) than cortisol?', daProp > corProp ? 'PASS (stress lingers)' : 'FAIL');

console.log('\n=== TEST 4: Sustained positivity builds a higher mood FLOOR (serotonin) ===');
const nc4 = new Neurochemistry(cfg, fakeFM); await nc4.initialize();
const seroStart = nc4.getState().serotonin;
for (let i = 0; i < 8; i++) { nc4.applyEvent(0.6, false, 'none', 0.3); nc4.decay(1); }
const seroEnd = nc4.getState().serotonin;
console.log('serotonin', seroStart.toFixed(2), '->', seroEnd.toFixed(2), seroEnd > seroStart ? 'PASS (floor raised)' : 'FAIL');
const mEnd = nc4.modulate();
console.log('inertia after good streak:', mEnd.inertia.toFixed(3), '(should be > 0.6 = more stable)', mEnd.inertia > 0.6 ? 'PASS' : 'FAIL');

console.log('\n=== TEST 5: Decay returns everything toward baseline (no runaway) ===');
const nc5 = new Neurochemistry(cfg, fakeFM); await nc5.initialize();
nc5.applyEvent(1, true, 'critical', 1); // max everything
nc5.decay(40); // long idle
const rest = nc5.getState();
const nearBaseline = Math.abs(rest.dopamine - 0.4) < 0.05 && Math.abs(rest.cortisol - 0.2) < 0.05;
console.log('after 40 idle heartbeats:', JSON.stringify(Object.fromEntries(Object.entries(rest).map(([k,v])=>[k,+v.toFixed(2)]))));
console.log('returned to baseline?', nearBaseline ? 'PASS' : 'FAIL');
console.log('signal:', nc5.describe());
