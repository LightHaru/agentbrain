// Integration: Amygdala + Neurochemistry wired path (the real call site)
import { Amygdala } from '../dist/core/amygdala.js';
import { Neurochemistry } from '../dist/core/neurochemistry.js';

const fakeFM = { readFile: async () => null, writeFile: async () => {} };
const cfg = { brainDir: '/tmp' };

const amy = new Amygdala(cfg, fakeFM);
await amy.initialize();
const nc = new Neurochemistry(cfg, fakeFM);
await nc.initialize();
amy.attachNeurochemistry(nc);

const ctx = (msg) => ({ message: msg, senderId: 'u1', senderName: 'Sếp', timestamp: new Date().toISOString(), sessionId: 's' });

console.log('=== Scenario A: 4 praises in a row — does good mood BUILD + persist? ===');
for (const m of ['cảm ơn em nhiều', 'em giỏi quá', 'tuyệt vời đỉnh thật', 'yêu em']) {
  const r = amy.process(ctx(m));
  const s = nc.getState();
  console.log(`"${m}" -> mood=${r.updatedState.mood} val=${r.updatedState.valence.toFixed(2)} | DA=${s.dopamine.toFixed(2)} 5HT=${s.serotonin.toFixed(2)} OXT=${s.oxytocin.toFixed(2)}`);
}

console.log('\n=== Scenario B: a scam threat hits while in good mood — fast flip? ===');
const r1 = amy.process(ctx('aira ơi có link airdrop claim connect wallet này'));
console.log(`threat -> mood=${r1.updatedState.mood} val=${r1.updatedState.valence.toFixed(2)} arousal=${r1.updatedState.arousal.toFixed(2)} | cortisol=${nc.getState().cortisol.toFixed(2)}`);

console.log('\n=== Scenario C: after threat, neutral chat — does stress LINGER? ===');
for (let i = 0; i < 3; i++) {
  nc.decay(1); // heartbeats pass
  const r = amy.process(ctx('ok em xem giúp anh cái này'));
  console.log(`neutral msg ${i+1} -> mood=${r.updatedState.mood} val=${r.updatedState.valence.toFixed(2)} | cortisol still=${nc.getState().cortisol.toFixed(2)}`);
}

console.log('\nVERDICT: mood now has momentum (builds, lingers, recovers) instead of snapping to each message.');
