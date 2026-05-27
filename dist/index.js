"use strict";
/**
 * AgentBrain — Brain-inspired cognitive architecture for AI agents
 *
 * Main entry point. Registers OpenClaw plugin hooks and initializes
 * all brain modules (Thalamus, Hippocampus, Prefrontal, Amygdala,
 * Cerebellum, Basal Ganglia, Anterior Cingulate).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.ContextInjector = exports.PriorityEnforcer = exports.createOpenClawPlugin = exports.defaultConfig = exports.BrainFileManager = exports.TheoryOfMind = exports.GlobalWorkspace = exports.CorpusCallosum = exports.Brainstem = exports.Hypothalamus = exports.Metacognition = exports.WorkingMemory = exports.Insula = exports.ParietalLobe = exports.TemporalLobe = exports.PrefrontalCortex = exports.BasalGanglia = exports.Cerebellum = exports.AnteriorCingulate = exports.Amygdala = exports.Hippocampus = exports.Thalamus = void 0;
exports.createAgentBrain = createAgentBrain;
const thalamus_js_1 = require("./core/thalamus.js");
const hippocampus_js_1 = require("./core/hippocampus.js");
const md_writer_js_1 = require("./storage/md-writer.js");
const config_js_1 = require("./core/config.js");
const temporal_js_1 = require("./core/temporal.js");
const parietal_js_1 = require("./core/parietal.js");
const insula_js_1 = require("./core/insula.js");
const metacognition_js_1 = require("./core/metacognition.js");
const hypothalamus_js_1 = require("./core/hypothalamus.js");
const brainstem_js_1 = require("./core/brainstem.js");
const corpus_callosum_js_1 = require("./core/corpus-callosum.js");
const global_workspace_js_1 = require("./core/global-workspace.js");
const theory_of_mind_js_1 = require("./core/theory-of-mind.js");
// Re-export all modules for external use
// Core modules (v1.0)
var thalamus_js_2 = require("./core/thalamus.js");
Object.defineProperty(exports, "Thalamus", { enumerable: true, get: function () { return thalamus_js_2.Thalamus; } });
var hippocampus_js_2 = require("./core/hippocampus.js");
Object.defineProperty(exports, "Hippocampus", { enumerable: true, get: function () { return hippocampus_js_2.Hippocampus; } });
var amygdala_js_1 = require("./core/amygdala.js");
Object.defineProperty(exports, "Amygdala", { enumerable: true, get: function () { return amygdala_js_1.Amygdala; } });
var cingulate_js_1 = require("./core/cingulate.js");
Object.defineProperty(exports, "AnteriorCingulate", { enumerable: true, get: function () { return cingulate_js_1.AnteriorCingulate; } });
var cerebellum_js_1 = require("./core/cerebellum.js");
Object.defineProperty(exports, "Cerebellum", { enumerable: true, get: function () { return cerebellum_js_1.Cerebellum; } });
var basal_ganglia_js_1 = require("./core/basal-ganglia.js");
Object.defineProperty(exports, "BasalGanglia", { enumerable: true, get: function () { return basal_ganglia_js_1.BasalGanglia; } });
var prefrontal_js_1 = require("./core/prefrontal.js");
Object.defineProperty(exports, "PrefrontalCortex", { enumerable: true, get: function () { return prefrontal_js_1.PrefrontalCortex; } });
// Phase 1 modules (v1.5)
var temporal_js_2 = require("./core/temporal.js");
Object.defineProperty(exports, "TemporalLobe", { enumerable: true, get: function () { return temporal_js_2.TemporalLobe; } });
var parietal_js_2 = require("./core/parietal.js");
Object.defineProperty(exports, "ParietalLobe", { enumerable: true, get: function () { return parietal_js_2.ParietalLobe; } });
var insula_js_2 = require("./core/insula.js");
Object.defineProperty(exports, "Insula", { enumerable: true, get: function () { return insula_js_2.Insula; } });
var working_memory_js_1 = require("./core/working-memory.js");
Object.defineProperty(exports, "WorkingMemory", { enumerable: true, get: function () { return working_memory_js_1.WorkingMemory; } });
var metacognition_js_2 = require("./core/metacognition.js");
Object.defineProperty(exports, "Metacognition", { enumerable: true, get: function () { return metacognition_js_2.Metacognition; } });
// Phase 2 modules (v0.3.0)
var hypothalamus_js_2 = require("./core/hypothalamus.js");
Object.defineProperty(exports, "Hypothalamus", { enumerable: true, get: function () { return hypothalamus_js_2.Hypothalamus; } });
var brainstem_js_2 = require("./core/brainstem.js");
Object.defineProperty(exports, "Brainstem", { enumerable: true, get: function () { return brainstem_js_2.Brainstem; } });
var corpus_callosum_js_2 = require("./core/corpus-callosum.js");
Object.defineProperty(exports, "CorpusCallosum", { enumerable: true, get: function () { return corpus_callosum_js_2.CorpusCallosum; } });
var global_workspace_js_2 = require("./core/global-workspace.js");
Object.defineProperty(exports, "GlobalWorkspace", { enumerable: true, get: function () { return global_workspace_js_2.GlobalWorkspace; } });
var theory_of_mind_js_2 = require("./core/theory-of-mind.js");
Object.defineProperty(exports, "TheoryOfMind", { enumerable: true, get: function () { return theory_of_mind_js_2.TheoryOfMind; } });
// Storage & Config
var md_writer_js_2 = require("./storage/md-writer.js");
Object.defineProperty(exports, "BrainFileManager", { enumerable: true, get: function () { return md_writer_js_2.BrainFileManager; } });
var config_js_2 = require("./core/config.js");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return config_js_2.defaultConfig; } });
// Integration
var openclaw_plugin_js_1 = require("./integration/openclaw-plugin.js");
Object.defineProperty(exports, "createOpenClawPlugin", { enumerable: true, get: function () { return openclaw_plugin_js_1.createOpenClawPlugin; } });
var priority_enforcer_js_1 = require("./integration/priority-enforcer.js");
Object.defineProperty(exports, "PriorityEnforcer", { enumerable: true, get: function () { return priority_enforcer_js_1.PriorityEnforcer; } });
var context_injector_js_1 = require("./integration/context-injector.js");
Object.defineProperty(exports, "ContextInjector", { enumerable: true, get: function () { return context_injector_js_1.ContextInjector; } });
/**
 * Create and initialize the AgentBrain plugin
 */
function createAgentBrain(userConfig) {
    const config = { ...config_js_1.defaultConfig, ...userConfig };
    const fileManager = new md_writer_js_1.BrainFileManager(config.brainDir);
    // Core modules (v1.0)
    const thalamus = new thalamus_js_1.Thalamus(config);
    const hippocampus = new hippocampus_js_1.Hippocampus(config, fileManager);
    // Phase 1 modules (v1.5)
    const temporal = new temporal_js_1.TemporalLobe(config);
    const parietal = new parietal_js_1.ParietalLobe(config);
    const insula = new insula_js_1.Insula(config);
    const metacognition = new metacognition_js_1.Metacognition(config);
    // Phase 2 modules (v0.3.0)
    const hypothalamus = new hypothalamus_js_1.Hypothalamus(config);
    const brainstem = new brainstem_js_1.Brainstem(config);
    const corpusCallosum = new corpus_callosum_js_1.CorpusCallosum(config);
    const globalWorkspace = new global_workspace_js_1.GlobalWorkspace(config);
    const theoryOfMind = new theory_of_mind_js_1.TheoryOfMind(config);
    const plugin = {
        name: 'agentbrain',
        version: '0.2.0', // Bumped to 0.2.0 for Phase 1
        config,
        thalamus,
        hippocampus,
        fileManager,
        temporal,
        parietal,
        insula,
        metacognition,
        hypothalamus,
        brainstem,
        corpusCallosum,
        globalWorkspace,
        theoryOfMind,
        async initialize() {
            await fileManager.ensureBrainStructure();
            await hippocampus.initialize();
            console.log('[AgentBrain] Initialized — all modules online');
        },
        async onPreResponse(context) {
            const startTime = Date.now();
            // Step 1: Thalamus classifies and routes
            const classification = thalamus.classify(context);
            // Step 2: Temporal comprehends language & extracts semantics
            const semanticRep = temporal.comprehend(context.message, { role: 'user', timestamp: Date.now() });
            // Step 3: Parietal integrates sensory input
            const percept = parietal.integrateSensoryInput([{
                    modality: 'text',
                    data: context.message,
                    timestamp: Date.now(),
                    importance: classification.urgency === 'critical' ? 1.0 : 0.5,
                }]);
            // Step 4: Insula models user state
            const userState = insula.modelUserState({
                message: context.message,
                recentInteractions: 10,
                userSuccessRate: 0.8,
                timeOfDay: new Date().getHours(),
            });
            // Step 5: Hippocampus retrieves relevant memories
            const relevantMemories = await hippocampus.recall(semanticRep.concepts.join(' '), classification.topic);
            // Step 6: Metacognition monitors thinking process
            const thinkingProcess = {
                steps: [
                    { action: 'Classify', reasoning: 'Thalamus classified message', timestamp: Date.now() },
                    { action: 'Comprehend', reasoning: 'Temporal extracted semantics', timestamp: Date.now() },
                    { action: 'Integrate', reasoning: 'Parietal integrated sensory input', timestamp: Date.now() },
                    { action: 'Model user', reasoning: 'Insula modeled user state', timestamp: Date.now() },
                ],
                duration: Date.now() - startTime,
                complexity: classification.urgency === 'critical' ? 0.8 : 0.4,
                successful: true,
            };
            const metacogState = metacognition.monitorThinking(thinkingProcess);
            // Step 7: Build brain context for response generation
            const brainContext = {
                classification,
                relevantMemories,
                emotionalState: {
                    mood: userState.emotion.valence > 0 ? 'positive' : userState.emotion.valence < 0 ? 'negative' : 'neutral',
                    intensity: Math.abs(userState.emotion.valence),
                    valence: userState.emotion.valence,
                    arousal: userState.emotion.arousal,
                },
                activeSkills: [],
                // Phase 1 additions
                semanticRepresentation: semanticRep,
                percept,
                userState,
                metacognitiveState: metacogState,
            };
            return brainContext;
        },
        async onPostResponse(context, response) {
            const startTime = Date.now();
            // Step 1: Temporal updates context window
            temporal.comprehend(response, { role: 'assistant', timestamp: Date.now() });
            // Step 2: Insula records performance
            const success = true; // Assume success for now
            insula.recordPerformance(success, 'response', Date.now() - startTime);
            // Step 3: Hippocampus consolidates new memory
            await hippocampus.consolidate({
                message: context.message,
                response,
                senderId: context.senderId,
                senderName: context.senderName,
                timestamp: context.timestamp,
            });
            // Step 4: Update body state
            insula.updateBodyState({
                energy: insula.getEnergyLevel() - 0.5,
                cognitiveLoad: parietal.getAttentionState().tasks.length * 10,
            });
        },
        async onHeartbeat() {
            // Step 1: Hippocampus maintenance
            await hippocampus.maintenance();
            // Step 2: Temporal decay concept activation
            temporal.decayActivation(5); // 5 minutes since last heartbeat
            // Step 3: Insula checks if needs rest
            if (insula.needsRest()) {
                console.log('[AgentBrain] Agent needs rest - energy low or fatigue high');
                insula.rest(5); // 5 minutes rest
            }
            // Step 4: Parietal prunes completed tasks
            parietal.pruneCompletedTasks();
            // Step 5: Metacognition periodic reflection (if enough history)
            const reflections = metacognition.getReflections(1);
            if (reflections.length === 0) {
                // No recent reflections, could add one if needed
            }
        },
        async onSessionStart(sessionId) {
            // Load brain state for this session
            console.log(`[AgentBrain] Session ${sessionId} started — loading brain state`);
        },
    };
    return plugin;
}
exports.default = createAgentBrain;
// Default export for OpenClaw plugin loader
var openclaw_plugin_js_2 = require("./integration/openclaw-plugin.js");
Object.defineProperty(exports, "plugin", { enumerable: true, get: function () { return openclaw_plugin_js_2.createOpenClawPlugin; } });
//# sourceMappingURL=index.js.map