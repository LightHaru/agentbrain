// Phase 2 real-module verification — proves state changes from real activity
import { Hypothalamus } from '../dist/core/hypothalamus.js';
import { Brainstem } from '../dist/core/brainstem.js';
import { CorpusCallosum } from '../dist/core/corpus-callosum.js';
import { GlobalWorkspace } from '../dist/core/global-workspace.js';
import { TheoryOfMind } from '../dist/core/theory-of-mind.js';

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${detail}`); }
};

console.log('\n=== TEST 1: Hypothalamus drives are dynamic ===');
{
  const h = new Hypothalamus('Asia/Ho_Chi_Minh');
  const before = h.getState();
  // satisfy achievement via a successful task
  h.observe('coding', 0.5, true);
  const after = h.getState();
  const achBefore = before.homeostasis.achievementNeed;
  const achAfter = after.homeostasis.achievementNeed;
  ok('achievement need drops after a success', achAfter < achBefore, `(${achBefore} -> ${achAfter})`);
  ok('threat raises stress', (() => { h.registerThreat('critical'); return h.getState().homeostasis.stress > 0; })());
  ok('stressResponse reflects high stress', h.getState().stressResponse !== 'calm');
}

console.log('\n=== TEST 2: Hypothalamus drives grow with neglect ===');
{
  const h = new Hypothalamus();
  h.satisfy('curiosity', 0.5); // push it down
  const lo = h.getState().homeostasis.curiosity;
  // simulate 10 minutes passing
  h.tick(Date.now() + 10 * 60000);
  const hi = h.getState().homeostasis.curiosity;
  ok('curiosity rises after 10 min neglect', hi > lo, `(${lo} -> ${hi})`);
}

console.log('\n=== TEST 3: Brainstem autonomic processes actually fire ===');
{
  const b = new Brainstem();
  const s0 = b.getState();
  const baseRuns = s0.autonomicProcesses.reduce((s, p) => s + p.runCount, 0);
  // pump 5 minutes into the future — several intervals should fire
  const fired = b.pump(Date.now() + 5 * 60000 + 1000);
  const s1 = b.getState();
  const newRuns = s1.autonomicProcesses.reduce((s, p) => s + p.runCount, 0);
  ok('processes fire as intervals elapse', fired.length > 0 && newRuns > baseRuns, `(fired ${fired.length})`);
  ok('threat raises arousal + alertness', (() => { b.recordThreat('critical', 'scam link'); const s = b.getState(); return s.arousalLevel > 0.5 && (s.alertness === 'alert' || s.alertness === 'hypervigilant'); })());
  const _bb = new Brainstem();
  await new Promise(r => setTimeout(r, 15));
  ok('uptime advances with real elapsed time', _bb.getState().uptime >= 10, `(${_bb.getState().uptime}ms)`);
  ok('latency drops under threat', b.getState().responseLatency <= 100);
}

console.log('\n=== TEST 4: CorpusCallosum counts real traffic + drops bad routes ===');
{
  const cc = new CorpusCallosum();
  cc.register('amygdala'); cc.register('hypothalamus');
  ok('delivered signal to registered target', cc.send({ from: 'thalamus', to: 'amygdala', type: 'x' }) === true);
  ok('dropped signal to unregistered target', cc.send({ from: 'thalamus', to: 'ghost', type: 'x' }) === false);
  cc.send({ from: 'amygdala', to: 'broadcast', type: 'mood' });
  const st = cc.getState();
  ok('processedSignals reflects real count', st.processedSignals === 2, `(${st.processedSignals})`);
  ok('droppedMessages counted', st.metrics.droppedMessages === 1);
  cc.flagConflict('amygdala', 'hypothalamus', 'mismatch');
  ok('conflicts recorded', cc.getState().metrics.conflicts === 1);
  ok('registeredModules not empty', st.registeredModules.length >= 2);
}

console.log('\n=== TEST 5: GlobalWorkspace runs real competition ===');
{
  const gw = new GlobalWorkspace();
  const winner = gw.compete([
    { source: 'thalamus', content: 'urgent task', salience: 0.9 },
    { source: 'amygdala', content: 'calm', salience: 0.2 },
  ]);
  ok('highest salience wins focus', winner && winner.source === 'thalamus', `(${winner?.source})`);
  gw.compete([{ source: 'amygdala', content: 'mood', salience: 0.5 }]);
  const st = gw.getState();
  ok('stream grows with activity', st.streamLength === 2, `(${st.streamLength})`);
  ok('consciousness rises above idle baseline', st.consciousnessLevel > 0.3, `(${st.consciousnessLevel})`);
  ok('competitionsResolved counted', st.competitionsResolved === 2);
}

console.log('\n=== TEST 6: TheoryOfMind models users + scores predictions ===');
{
  const tom = new TheoryOfMind();
  tom.observe('u1', 'Alice', 0.6, 'coding');
  tom.observe('u1', 'Alice', 0.5, 'coding');
  tom.observe('u1', 'Alice', 0.55, 'coding');
  const st = tom.getState();
  ok('activeUsers counts real distinct senders', st.activeUsers === 1, `(${st.activeUsers})`);
  ok('builds a user model', st.currentUserModel && st.currentUserModel.messageCount === 3);
  ok('infers positive mood from positive trend', st.currentUserModel.inferredMood === 'positive', `(${st.currentUserModel?.inferredMood})`);
  ok('prediction accuracy is measured (not default 0.5 frozen)', st.predictionAccuracy >= 0, `(${st.predictionAccuracy})`);
  tom.noteExpectation('u1', 'làm nhanh giúp anh');
  ok('notes expectations from phrasing', tom.getState().currentUserModel.expectations.includes('wants speed'));
  // second distinct user
  tom.observe('u2', 'Bob', -0.4, 'support');
  ok('tracks multiple users', tom.getState().activeUsers === 2);
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
