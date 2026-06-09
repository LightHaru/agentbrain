"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrainEngine = createBrainEngine;
/**
 * AgentBrain Engine — agent-neutral SDK facade (v0.7.0)
 *
 * The OpenClaw plugin (src/plugin/entry.ts) wires the brain into one specific
 * host. This module exposes the SAME cognitive core as a clean, importable
 * engine any external agent (Codex, Claude, a CLI, a test) can drive with a
 * single stable call:
 *
 *   const brain = createBrainEngine();
 *   await brain.init();
 *   const turn = await brain.processTurn({ message, userId });
 *   const state = brain.getState();
 *
 * Design goals (addressing the v0.6.0 audit findings):
 *  - One entrypoint owns orchestration; the caller never wires modules by hand.
 *  - Storage and the clock are injectable adapters (default: in-memory + Date.now).
 *  - processTurn() returns a typed, cloned snapshot — no live internal references.
 */
const config_js_1 = require("./core/config.js");
const memory_storage_js_1 = require("./storage/memory-storage.js");
const thalamus_js_1 = require("./core/thalamus.js");
const hippocampus_js_1 = require("./core/hippocampus.js");
const amygdala_js_1 = require("./core/amygdala.js");
const neurochemistry_js_1 = require("./core/neurochemistry.js");
const hypothalamus_js_1 = require("./core/hypothalamus.js");
const brainstem_js_1 = require("./core/brainstem.js");
const corpus_callosum_js_1 = require("./core/corpus-callosum.js");
const global_workspace_js_1 = require("./core/global-workspace.js");
const theory_of_mind_js_1 = require("./core/theory-of-mind.js");
const affect_core_js_1 = require("./core/affect-core.js");
const SEVERITY_ORDER = ['none', 'low', 'medium', 'high', 'critical'];
const ALL_MODULES = [
    'thalamus', 'hippocampus', 'amygdala', 'neurochemistry',
    'hypothalamus', 'brainstem', 'corpusCallosum', 'globalWorkspace', 'theoryOfMind',
];
/**
 * Create a fully-wired, agent-neutral brain engine.
 * Every module is instantiated and connected internally — the caller just
 * calls init() then processTurn().
 */
function createBrainEngine(options = {}) {
    const config = { ...config_js_1.defaultConfig, ...(options.config ?? {}) };
    const clock = options.clock ?? (() => Date.now());
    const timezone = options.timezone ?? 'Asia/Ho_Chi_Minh';
    const storage = options.storage ?? new memory_storage_js_1.MemoryStorage();
    // Wire the cognitive core.
    const thalamus = new thalamus_js_1.Thalamus(config);
    const hippocampus = new hippocampus_js_1.Hippocampus(config, storage);
    const neurochem = new neurochemistry_js_1.Neurochemistry(config, storage);
    const amygdala = new amygdala_js_1.Amygdala(config, storage);
    amygdala.attachNeurochemistry(neurochem);
    const hypothalamus = new hypothalamus_js_1.Hypothalamus(timezone, clock());
    const brainstem = new brainstem_js_1.Brainstem(clock());
    const corpusCallosum = new corpus_callosum_js_1.CorpusCallosum();
    const globalWorkspace = new global_workspace_js_1.GlobalWorkspace();
    const theoryOfMind = new theory_of_mind_js_1.TheoryOfMind();
    const affect = new affect_core_js_1.AffectCore();
    for (const id of ALL_MODULES)
        corpusCallosum.register(id);
    let initialized = false;
    const clampUnit = (n) => Math.max(0, Math.min(1, n));
    function severityToDrive(s) {
        return s === 'none' ? null : s;
    }
    const engine = {
        version: '0.7.0',
        storage,
        async init() {
            if (initialized)
                return;
            await storage.ensureBrainStructure();
            await neurochem.initialize();
            await amygdala.initialize?.();
            await hippocampus.initialize();
            initialized = true;
        },
        async processTurn(input) {
            if (!initialized)
                await engine.init();
            const now = clock();
            const ctx = {
                message: input.message,
                senderId: input.userId,
                senderName: input.userName ?? 'User',
                timestamp: input.timestamp ?? new Date(now).toISOString(),
                sessionId: input.sessionId ?? 'sdk',
            };
            // 1. Thalamus classifies.
            const classification = thalamus.classify(ctx);
            // 2. Amygdala processes sentiment + threat (drives neurochemistry internally).
            const amy = amygdala.process(ctx);
            // 3. Hypothalamus: satisfy drives from the interaction; register threat stress.
            hypothalamus.observe(classification.topic, amy.userSentiment, input.taskSucceeded);
            const driveSeverity = severityToDrive(amy.threat.severity);
            if (driveSeverity)
                hypothalamus.registerThreat(driveSeverity);
            // 4. Brainstem reflex on real threats.
            if (amy.threat.isThreat) {
                brainstem.recordThreat(amy.threat.severity, amy.threat.reason ?? 'threat detected');
            }
            // 5. Theory of mind: update the per-user model.
            theoryOfMind.observe(input.userId, input.userName ?? 'User', amy.userSentiment, classification.topic);
            // 6. Corpus callosum: route a couple of real inter-module signals.
            corpusCallosum.send({ from: 'amygdala', to: 'neurochemistry', type: 'affect', payload: { sentiment: amy.userSentiment } });
            if (amy.threat.isThreat) {
                corpusCallosum.send({ from: 'amygdala', to: 'brainstem', type: 'threat', payload: amy.threat });
            }
            // 7. Hippocampus recalls, then consolidates this turn.
            const relevantMemories = await hippocampus.recall(input.message, classification.topic);
            // 8. Global workspace: salience competition picks conscious focus.
            const emo = amygdala.getState();
            const candidates = [
                { source: 'amygdala', content: emo.mood, salience: Math.min(1, 0.3 + Math.abs(emo.valence) * 0.7) },
                { source: 'thalamus', content: classification.topic, salience: classification.urgency === 'critical' ? 0.95 : classification.urgency === 'high' ? 0.7 : 0.4 },
            ];
            if (amy.threat.isThreat) {
                candidates.push({ source: 'amygdala', content: `threat:${amy.threat.threatType}`, salience: 0.99 });
            }
            globalWorkspace.compete(candidates);
            await hippocampus.consolidate({
                message: input.message,
                response: '',
                senderId: input.userId,
                senderName: input.userName ?? 'User',
                timestamp: ctx.timestamp,
            });
            const neuro = neurochem.getState();
            const neuroSignal = neurochem.describe();
            const focus = globalWorkspace.getState().currentFocus;
            // 9. AffectCore: generate a discrete emotion by appraising the situation
            //    against the agent's goals, agency, coping and novelty — not keywords.
            const hypo = hypothalamus.getState();
            const sev = amy.threat.severity;
            const threatWeight = sev === 'critical' ? 1 : sev === 'high' ? 0.75 : sev === 'medium' ? 0.5 : sev === 'low' ? 0.3 : 0;
            // coping: anti-scam paladin can handle most threats (trust its own response),
            // but raw fund-loss / breach already happened => lower coping.
            const alreadyHappened = amy.threat.threatType === 'fund_loss' || amy.threat.threatType === 'security_breach';
            const coping = amy.threat.isThreat ? (alreadyHappened ? 0.3 : 0.7) : 0.6;
            const tomState = theoryOfMind.getState();
            const novelty = clampUnit(Math.abs(amy.userSentiment - (tomState.currentUserModel?.lastSentiment ?? 0)));
            const appraisal = {
                goalCongruence: amy.threat.isThreat ? -threatWeight : amy.userSentiment,
                goalRelevance: amy.threat.isThreat ? 0.9 : 0.4 + Math.abs(amy.userSentiment) * 0.5,
                agency: (amy.threat.isThreat ? 'circumstance' : amy.userSentiment !== 0 ? 'other' : 'self'),
                copingPotential: coping,
                novelty,
                certainty: clampUnit(1 - novelty * 0.5),
            };
            const feeling = affect.appraise(appraisal, input.message.slice(0, 50));
            const affectVAD = affect.getState().dimensional;
            return {
                classification: { ...classification },
                userSentiment: amy.userSentiment,
                threat: {
                    isThreat: amy.threat.isThreat,
                    severity: amy.threat.severity,
                    threatType: amy.threat.threatType,
                    reason: amy.threat.reason,
                },
                emotionalState: { ...emo },
                feeling: {
                    label: feeling.label,
                    intensity: feeling.intensity,
                    valence: affectVAD.valence,
                    arousal: affectVAD.arousal,
                    dominance: affectVAD.dominance,
                },
                neurochemistry: {
                    dopamine: neuro.dopamine,
                    serotonin: neuro.serotonin,
                    cortisol: neuro.cortisol,
                    oxytocin: neuro.oxytocin,
                    signal: neuroSignal,
                },
                relevantMemories: relevantMemories.map((m) => ({ ...m })),
                focus: focus ? { source: focus.source, content: focus.content, salience: focus.salience } : null,
            };
        },
        tick(now = clock()) {
            hypothalamus.tick(now);
            const fired = brainstem.pump(now);
            neurochem.decay(1);
            // Spontaneous affect: generate emotion from internal state alone (no input).
            const h = hypothalamus.getState();
            const n = neurochem.getState();
            const drives = h.drives;
            const drivePressure = drives.length ? drives.reduce((s, d) => s + d.intensity, 0) / drives.length : 0;
            const curiosityDrive = drives.find((d) => d.id === 'curiosity')?.intensity ?? 0;
            affect.tick({
                drivePressure,
                curiosityDrive,
                stress: h.homeostasis.stress / 100,
                serotonin: n.serotonin,
                dopamine: n.dopamine,
                circadianAlertness: h.circadian.alertnessLevel,
            });
            return { autonomicFired: fired };
        },
        getState() {
            // Each module's getState already returns fresh objects; structuredClone
            // guarantees the snapshot is fully detached from internal state.
            return structuredClone({
                version: engine.version,
                initialized,
                emotionalState: amygdala.getState(),
                neurochemistry: neurochem.getState(),
                hypothalamus: hypothalamus.getState(),
                brainstem: brainstem.getState(),
                corpusCallosum: corpusCallosum.getState(),
                globalWorkspace: globalWorkspace.getState(),
                theoryOfMind: theoryOfMind.getState(),
                affect: affect.getState(),
            });
        },
    };
    return engine;
}
exports.default = createBrainEngine;
//# sourceMappingURL=engine.js.map