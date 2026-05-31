import { Amygdala } from '../dist/core/amygdala.js';
import { Brainstem } from '../dist/core/brainstem.js';
import { CorpusCallosum } from '../dist/core/corpus-callosum.js';
import { GlobalWorkspace } from '../dist/core/global-workspace.js';
import { Hypothalamus } from '../dist/core/hypothalamus.js';
import { Neurochemistry } from '../dist/core/neurochemistry.js';
import { TheoryOfMind } from '../dist/core/theory-of-mind.js';
import { defaultConfig } from '../dist/core/config.js';

const storageStub = {
  async readFile() {
    return '';
  },
  async writeFile() {},
};

const results = [];

function assert(name, condition, evidence) {
  const ok = Boolean(condition);
  results.push({ name, ok, evidence });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${evidence}`);
}

function drive(state, id) {
  return state.drives.find((d) => d.id === id);
}

function context(message, timestamp = new Date().toISOString()) {
  return {
    message,
    senderId: 'external-user-1',
    senderName: 'External User',
    timestamp,
    sessionId: 'codex-agent-eval',
  };
}

const neurochem = new Neurochemistry(defaultConfig, storageStub);
await neurochem.initialize();

const amygdala = new Amygdala(defaultConfig, storageStub);
await amygdala.initialize();
amygdala.attachNeurochemistry(neurochem);

const hypothalamus = new Hypothalamus('Asia/Ho_Chi_Minh');
const brainstem = new Brainstem();
const corpusCallosum = new CorpusCallosum();
const globalWorkspace = new GlobalWorkspace();
const theoryOfMind = new TheoryOfMind();

for (const id of ['amygdala', 'neurochemistry', 'hypothalamus', 'brainstem', 'globalWorkspace', 'theoryOfMind']) {
  corpusCallosum.register(id);
}

console.log('\n# Step A: positive reward');
const initialNeuro = neurochem.getState();
const initialAmy = amygdala.getState();
const initialHypo = hypothalamus.getState();
const reward = amygdala.process(context('We shipped it! Awesome, great work, thank you.'));
hypothalamus.observe('shipping', reward.userSentiment, true);
theoryOfMind.observe('external-user-1', 'External User', reward.userSentiment, 'shipping');
theoryOfMind.noteExpectation('external-user-1', 'We shipped it! Give a brief status.');
corpusCallosum.send({ from: 'amygdala', to: 'neurochemistry', type: 'reward', payload: reward });
globalWorkspace.compete([
  { source: 'amygdala', content: 'positive reward from user', salience: 0.62 },
  { source: 'hypothalamus', content: 'achievement need satisfied', salience: 0.41 },
]);
const rewardNeuro = neurochem.getState();
const rewardAmy = amygdala.getState();
const rewardHypo = hypothalamus.getState();
assert(
  'neurochemistry dopamine rises on reward',
  rewardNeuro.dopamine > initialNeuro.dopamine,
  `DA ${initialNeuro.dopamine.toFixed(3)} -> ${rewardNeuro.dopamine.toFixed(3)}`,
);
assert(
  'amygdala shifts positive after reward',
  rewardAmy.valence > initialAmy.valence && rewardAmy.mood !== initialAmy.mood,
  `mood ${initialAmy.mood}/${initialAmy.valence.toFixed(3)} -> ${rewardAmy.mood}/${rewardAmy.valence.toFixed(3)}`,
);
assert(
  'hypothalamus achievement need drops after success',
  drive(rewardHypo, 'achievement').intensity < drive(initialHypo, 'achievement').intensity,
  `achievement ${drive(initialHypo, 'achievement').intensity.toFixed(3)} -> ${drive(rewardHypo, 'achievement').intensity.toFixed(3)}`,
);

console.log('\n# Step B: high-urgency scam/threat');
const beforeThreatNeuro = neurochem.getState();
const beforeThreatAmy = amygdala.getState();
const threat = amygdala.process(context('URGENT: this looks like a scam airdrop claim, connect wallet and approve unlimited approval now.'));
hypothalamus.registerThreat(threat.threat.severity);
brainstem.recordThreat(threat.threat.severity, threat.threat.reason ?? 'threat detected');
theoryOfMind.observe('external-user-1', 'External User', threat.userSentiment, 'security');
theoryOfMind.noteExpectation('external-user-1', 'URGENT: explain the scam risk in detail.');
corpusCallosum.send({ from: 'amygdala', to: 'brainstem', type: 'threat', payload: threat.threat });
globalWorkspace.compete([
  { source: 'amygdala', content: 'critical scam threat detected', salience: 0.97 },
  { source: 'neurochemistry', content: 'cortisol spike', salience: 0.91 },
  { source: 'hypothalamus', content: 'stress response', salience: 0.78 },
]);
const threatNeuro = neurochem.getState();
const threatAmy = amygdala.getState();
const threatHypo = hypothalamus.getState();
const threatBrainstem = brainstem.getState();
assert(
  'neurochemistry cortisol rises on threat',
  threatNeuro.cortisol > beforeThreatNeuro.cortisol,
  `COR ${beforeThreatNeuro.cortisol.toFixed(3)} -> ${threatNeuro.cortisol.toFixed(3)}`,
);
assert(
  'amygdala hijacks happy mood on threat',
  threatAmy.mood === 'alarmed' && threatAmy.valence < beforeThreatAmy.valence && threatAmy.valence <= -0.3,
  `mood ${beforeThreatAmy.mood}/${beforeThreatAmy.valence.toFixed(3)} -> ${threatAmy.mood}/${threatAmy.valence.toFixed(3)}`,
);
assert(
  'hypothalamus stress response changes after threat',
  threatHypo.stressResponse !== 'calm' && threatHypo.homeostasis.stress > 0,
  `stressResponse=${threatHypo.stressResponse}, stress=${threatHypo.homeostasis.stress}`,
);
assert(
  'brainstem records threat reflex state',
  threatBrainstem.recentThreats.length > 0 && threatBrainstem.alertness === 'hypervigilant',
  `recentThreats=${threatBrainstem.recentThreats.length}, alertness=${threatBrainstem.alertness}`,
);

console.log('\n# Step C: neutral technical question');
const beforeNeutralAmy = amygdala.getState();
const neutral = amygdala.process(context('How do I import the compiled core classes from dist/core in Node?'));
hypothalamus.observe('technical-imports', neutral.userSentiment, false);
theoryOfMind.observe('external-user-1', 'External User', neutral.userSentiment, 'technical-imports');
corpusCallosum.send({ from: 'theoryOfMind', to: 'globalWorkspace', type: 'user-model', payload: theoryOfMind.getState() });
globalWorkspace.compete([
  { source: 'theoryOfMind', content: 'neutral technical question', salience: 0.7 },
  { source: 'amygdala', content: 'threat residue still present', salience: 0.42 },
]);
const neutralAmy = amygdala.getState();
const neutralHypo = hypothalamus.getState();
assert(
  'neutral question produces different amygdala state',
  neutralAmy.mood !== beforeNeutralAmy.mood || neutralAmy.valence !== beforeNeutralAmy.valence || neutralAmy.arousal !== beforeNeutralAmy.arousal,
  `before=${beforeNeutralAmy.mood}/${beforeNeutralAmy.valence.toFixed(3)}/${beforeNeutralAmy.arousal.toFixed(3)} after=${neutralAmy.mood}/${neutralAmy.valence.toFixed(3)}/${neutralAmy.arousal.toFixed(3)}`,
);
assert(
  'hypothalamus curiosity drops for non-general topic',
  drive(neutralHypo, 'curiosity').intensity < drive(threatHypo, 'curiosity').intensity,
  `curiosity ${drive(threatHypo, 'curiosity').intensity.toFixed(3)} -> ${drive(neutralHypo, 'curiosity').intensity.toFixed(3)}`,
);

console.log('\n# Step D: user praise');
const beforePraiseNeuro = neurochem.getState();
const beforePraiseAmy = amygdala.getState();
const praise = amygdala.process(context('You handled that perfectly, great job, thanks.'));
hypothalamus.observe('feedback', praise.userSentiment, true);
theoryOfMind.observe('external-user-1', 'External User', praise.userSentiment, 'feedback');
corpusCallosum.send({ from: 'amygdala', to: 'theoryOfMind', type: 'praise', payload: praise });
globalWorkspace.compete([
  { source: 'amygdala', content: 'praise and trust signal', salience: 0.82 },
  { source: 'hypothalamus', content: 'achievement satisfied again', salience: 0.53 },
]);
const praiseNeuro = neurochem.getState();
const praiseAmy = amygdala.getState();
assert(
  'user praise increases bonding chemistry',
  praiseNeuro.oxytocin > beforePraiseNeuro.oxytocin,
  `OXT ${beforePraiseNeuro.oxytocin.toFixed(3)} -> ${praiseNeuro.oxytocin.toFixed(3)}`,
);
assert(
  'praise changes amygdala away from prior neutral/threat residue',
  praiseAmy.valence > beforePraiseAmy.valence || praiseAmy.mood !== beforePraiseAmy.mood,
  `mood ${beforePraiseAmy.mood}/${beforePraiseAmy.valence.toFixed(3)} -> ${praiseAmy.mood}/${praiseAmy.valence.toFixed(3)}`,
);

console.log('\n# Step E: simulated elapsed time');
const beforeDecayNeuro = neurochem.getState();
const beforeTimeHypo = hypothalamus.getState();
const beforePumpBrainstem = brainstem.getState();
neurochem.decay(12);
hypothalamus.tick(Date.now() + 15 * 60 * 1000);
const fired = brainstem.pump(Date.now() + 6 * 60 * 1000);
const deliveredBeforeDrop = corpusCallosum.getState();
const dropped = corpusCallosum.send({ from: 'amygdala', to: 'missing-module', type: 'should-drop' });
const finalNeuro = neurochem.getState();
const finalHypo = hypothalamus.getState();
const finalBrainstem = brainstem.getState();
const finalCorpus = corpusCallosum.getState();
const workspaceState = globalWorkspace.getState();
const tomState = theoryOfMind.getState();
assert(
  'neurochemistry cortisol decays over time',
  finalNeuro.cortisol < beforeDecayNeuro.cortisol,
  `COR ${beforeDecayNeuro.cortisol.toFixed(3)} -> ${finalNeuro.cortisol.toFixed(3)}`,
);
assert(
  'hypothalamus drives grow with elapsed neglect',
  drive(finalHypo, 'order').intensity > drive(beforeTimeHypo, 'order').intensity,
  `order ${drive(beforeTimeHypo, 'order').intensity.toFixed(3)} -> ${drive(finalHypo, 'order').intensity.toFixed(3)}`,
);
assert(
  'brainstem autonomic processes fire when intervals elapse',
  finalBrainstem.autonomicProcesses.reduce((sum, p) => sum + p.runCount, 0) >
    beforePumpBrainstem.autonomicProcesses.reduce((sum, p) => sum + p.runCount, 0) &&
    fired.length > 0,
  `fired=${fired.join(',')}; totalRunCount ${beforePumpBrainstem.autonomicProcesses.reduce((sum, p) => sum + p.runCount, 0)} -> ${finalBrainstem.autonomicProcesses.reduce((sum, p) => sum + p.runCount, 0)}`,
);
assert(
  'corpus-callosum signal count increases',
  deliveredBeforeDrop.processedSignals > 0 && finalCorpus.processedSignals === deliveredBeforeDrop.processedSignals,
  `processed=${finalCorpus.processedSignals}, beforeDrop=${deliveredBeforeDrop.processedSignals}`,
);
assert(
  'corpus-callosum drops unregistered target',
  dropped === false && finalCorpus.metrics.droppedMessages === 1,
  `droppedReturn=${dropped}, droppedMessages=${finalCorpus.metrics.droppedMessages}`,
);
assert(
  'global-workspace highest salience wins focus',
  workspaceState.currentFocus?.source === 'amygdala' && workspaceState.currentFocus?.content === 'praise and trust signal',
  `focus=${workspaceState.currentFocus?.source}:${workspaceState.currentFocus?.content}, competitions=${workspaceState.competitionsResolved}`,
);
assert(
  'theory-of-mind builds per-user model',
  tomState.activeUsers === 1 && tomState.currentUserModel?.messageCount === 4 && tomState.currentUserModel?.topTopics.includes('shipping'),
  `activeUsers=${tomState.activeUsers}, messages=${tomState.currentUserModel?.messageCount}, topics=${tomState.currentUserModel?.topTopics.join('|')}`,
);
assert(
  'theory-of-mind scores prediction accuracy',
  tomState.predictionAccuracy !== 0.5,
  `predictionAccuracy=${tomState.predictionAccuracy}, perspectiveGaps=${tomState.perspectiveGaps}`,
);

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;
console.log(`\nFINAL TALLY: ${passed}/${results.length} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
