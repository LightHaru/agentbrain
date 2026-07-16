"use strict";
/**
 * AgentBrain — Brain-inspired cognitive architecture for AI agents
 *
 * Main entry point. Registers OpenClaw plugin hooks and initializes
 * all brain modules (Thalamus, Hippocampus, Prefrontal, Amygdala,
 * Cerebellum, Basal Ganglia, Anterior Cingulate).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgettingCurve = exports.FactChangeTracker = exports.MemoryGraph = exports.RelevanceCritic = exports.SearchAdvisor = exports.ContextInjector = exports.PriorityEnforcer = exports.createOpenClawPlugin = exports.clearLearnedPlaybooks = exports.countPlaybooks = exports.getLearnedPlaybooks = exports.registerLearnedPlaybook = exports.DEFAULT_PROBES = exports.runBenchmark = exports.OPUS_DISTILLATION = exports.DistillationTrainer = exports.SemanticPlaybookMatcher = exports.ErrorLedger = exports.ConversationLog = exports.KnowledgeStore = exports.SelfDistiller = exports.EMBED_DIM = exports.EMBED_MODEL_ID = exports.cosineSim = exports.l2normalize = exports.getEmbeddingService = exports.EmbeddingService = exports.defaultConfig = exports.MemoryStorage = exports.BrainFileManager = exports.createBrainEngine = exports.AffectCore = exports.Neurochemistry = exports.TheoryOfMind = exports.GlobalWorkspace = exports.CorpusCallosum = exports.Brainstem = exports.Hypothalamus = exports.Metacognition = exports.WorkingMemory = exports.Insula = exports.ParietalLobe = exports.TemporalLobe = exports.PrefrontalCortex = exports.BasalGanglia = exports.Cerebellum = exports.AnteriorCingulate = exports.Amygdala = exports.Hippocampus = exports.Thalamus = void 0;
exports.plugin = exports.buoiOf = exports.TimeAwareness = exports.SourceVerifier = exports.DEFAULT_FRESHNESS = exports.FreshnessGuard = exports.redactSecrets = exports.sanitizeUserMessage = exports.GOLDEN_RECALL_CORPUS = exports.runRecallEval = exports.AutoReflector = void 0;
exports.createAgentBrain = createAgentBrain;
const thalamus_js_1 = require("./core/thalamus.js");
const hippocampus_js_1 = require("./core/hippocampus.js");
const md_writer_js_1 = require("./storage/md-writer.js");
const config_js_1 = require("./core/config.js");
const temporal_js_1 = require("./core/temporal.js");
const parietal_js_1 = require("./core/parietal.js");
const insula_js_1 = require("./core/insula.js");
const metacognition_js_1 = require("./core/metacognition.js");
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
// Phase 2 modules (v0.6.0) — previously missing from the barrel API
var hypothalamus_js_1 = require("./core/hypothalamus.js");
Object.defineProperty(exports, "Hypothalamus", { enumerable: true, get: function () { return hypothalamus_js_1.Hypothalamus; } });
var brainstem_js_1 = require("./core/brainstem.js");
Object.defineProperty(exports, "Brainstem", { enumerable: true, get: function () { return brainstem_js_1.Brainstem; } });
var corpus_callosum_js_1 = require("./core/corpus-callosum.js");
Object.defineProperty(exports, "CorpusCallosum", { enumerable: true, get: function () { return corpus_callosum_js_1.CorpusCallosum; } });
var global_workspace_js_1 = require("./core/global-workspace.js");
Object.defineProperty(exports, "GlobalWorkspace", { enumerable: true, get: function () { return global_workspace_js_1.GlobalWorkspace; } });
var theory_of_mind_js_1 = require("./core/theory-of-mind.js");
Object.defineProperty(exports, "TheoryOfMind", { enumerable: true, get: function () { return theory_of_mind_js_1.TheoryOfMind; } });
// Phase 3 neurochemistry (v0.5.0)
var neurochemistry_js_1 = require("./core/neurochemistry.js");
Object.defineProperty(exports, "Neurochemistry", { enumerable: true, get: function () { return neurochemistry_js_1.Neurochemistry; } });
// Generative affect via cognitive appraisal (v0.8.0)
var affect_core_js_1 = require("./core/affect-core.js");
Object.defineProperty(exports, "AffectCore", { enumerable: true, get: function () { return affect_core_js_1.AffectCore; } });
// Agent-neutral SDK engine (v0.7.0)
var engine_js_1 = require("./engine.js");
Object.defineProperty(exports, "createBrainEngine", { enumerable: true, get: function () { return engine_js_1.createBrainEngine; } });
// Storage & Config
var md_writer_js_2 = require("./storage/md-writer.js");
Object.defineProperty(exports, "BrainFileManager", { enumerable: true, get: function () { return md_writer_js_2.BrainFileManager; } });
var memory_storage_js_1 = require("./storage/memory-storage.js");
Object.defineProperty(exports, "MemoryStorage", { enumerable: true, get: function () { return memory_storage_js_1.MemoryStorage; } });
var config_js_2 = require("./core/config.js");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return config_js_2.defaultConfig; } });
// Unified embedding service (v0.14.0) — store vectors "like people do"
var embedding_service_js_1 = require("./core/embedding-service.js");
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return embedding_service_js_1.EmbeddingService; } });
Object.defineProperty(exports, "getEmbeddingService", { enumerable: true, get: function () { return embedding_service_js_1.getEmbeddingService; } });
Object.defineProperty(exports, "l2normalize", { enumerable: true, get: function () { return embedding_service_js_1.l2normalize; } });
Object.defineProperty(exports, "cosineSim", { enumerable: true, get: function () { return embedding_service_js_1.cosineSim; } });
Object.defineProperty(exports, "EMBED_MODEL_ID", { enumerable: true, get: function () { return embedding_service_js_1.EMBED_MODEL_ID; } });
Object.defineProperty(exports, "EMBED_DIM", { enumerable: true, get: function () { return embedding_service_js_1.EMBED_DIM; } });
// Self-distillation (v0.15.0) — learn from own successful conversations
var self_distiller_js_1 = require("./training/self-distiller.js");
Object.defineProperty(exports, "SelfDistiller", { enumerable: true, get: function () { return self_distiller_js_1.SelfDistiller; } });
// Knowledge storage + conversation memory (v0.14.0)
var knowledge_store_js_1 = require("./core/knowledge-store.js");
Object.defineProperty(exports, "KnowledgeStore", { enumerable: true, get: function () { return knowledge_store_js_1.KnowledgeStore; } });
var conversation_log_js_1 = require("./core/conversation-log.js");
Object.defineProperty(exports, "ConversationLog", { enumerable: true, get: function () { return conversation_log_js_1.ConversationLog; } });
// Learning-over-time modules (v0.13.0)
var error_ledger_js_1 = require("./core/error-ledger.js");
Object.defineProperty(exports, "ErrorLedger", { enumerable: true, get: function () { return error_ledger_js_1.ErrorLedger; } });
var semantic_playbook_matcher_js_1 = require("./core/semantic-playbook-matcher.js");
Object.defineProperty(exports, "SemanticPlaybookMatcher", { enumerable: true, get: function () { return semantic_playbook_matcher_js_1.SemanticPlaybookMatcher; } });
// Training / distillation (v0.13.0)
var distillation_trainer_js_1 = require("./training/distillation-trainer.js");
Object.defineProperty(exports, "DistillationTrainer", { enumerable: true, get: function () { return distillation_trainer_js_1.DistillationTrainer; } });
var distillation_corpus_js_1 = require("./training/distillation-corpus.js");
Object.defineProperty(exports, "OPUS_DISTILLATION", { enumerable: true, get: function () { return distillation_corpus_js_1.OPUS_DISTILLATION; } });
var benchmark_js_1 = require("./training/benchmark.js");
Object.defineProperty(exports, "runBenchmark", { enumerable: true, get: function () { return benchmark_js_1.runBenchmark; } });
Object.defineProperty(exports, "DEFAULT_PROBES", { enumerable: true, get: function () { return benchmark_js_1.DEFAULT_PROBES; } });
var reasoning_playbooks_js_1 = require("./core/reasoning-playbooks.js");
Object.defineProperty(exports, "registerLearnedPlaybook", { enumerable: true, get: function () { return reasoning_playbooks_js_1.registerLearnedPlaybook; } });
Object.defineProperty(exports, "getLearnedPlaybooks", { enumerable: true, get: function () { return reasoning_playbooks_js_1.getLearnedPlaybooks; } });
Object.defineProperty(exports, "countPlaybooks", { enumerable: true, get: function () { return reasoning_playbooks_js_1.countPlaybooks; } });
Object.defineProperty(exports, "clearLearnedPlaybooks", { enumerable: true, get: function () { return reasoning_playbooks_js_1.clearLearnedPlaybooks; } });
// Integration
var openclaw_plugin_js_1 = require("./integration/openclaw-plugin.js");
Object.defineProperty(exports, "createOpenClawPlugin", { enumerable: true, get: function () { return openclaw_plugin_js_1.createOpenClawPlugin; } });
var priority_enforcer_js_1 = require("./integration/priority-enforcer.js");
Object.defineProperty(exports, "PriorityEnforcer", { enumerable: true, get: function () { return priority_enforcer_js_1.PriorityEnforcer; } });
var context_injector_js_1 = require("./integration/context-injector.js");
Object.defineProperty(exports, "ContextInjector", { enumerable: true, get: function () { return context_injector_js_1.ContextInjector; } });
// Adaptive-RAG upgrades (v0.15.2)
var search_advisor_js_1 = require("./core/search-advisor.js");
Object.defineProperty(exports, "SearchAdvisor", { enumerable: true, get: function () { return search_advisor_js_1.SearchAdvisor; } });
var relevance_critic_js_1 = require("./core/relevance-critic.js");
Object.defineProperty(exports, "RelevanceCritic", { enumerable: true, get: function () { return relevance_critic_js_1.RelevanceCritic; } });
var memory_graph_js_1 = require("./core/memory-graph.js");
Object.defineProperty(exports, "MemoryGraph", { enumerable: true, get: function () { return memory_graph_js_1.MemoryGraph; } });
var fact_change_tracker_js_1 = require("./core/fact-change-tracker.js");
Object.defineProperty(exports, "FactChangeTracker", { enumerable: true, get: function () { return fact_change_tracker_js_1.FactChangeTracker; } });
exports.ForgettingCurve = __importStar(require("./core/forgetting-curve.js"));
var auto_reflector_js_1 = require("./core/auto-reflector.js");
Object.defineProperty(exports, "AutoReflector", { enumerable: true, get: function () { return auto_reflector_js_1.AutoReflector; } });
var recall_eval_js_1 = require("./training/recall-eval.js");
Object.defineProperty(exports, "runRecallEval", { enumerable: true, get: function () { return recall_eval_js_1.runRecallEval; } });
Object.defineProperty(exports, "GOLDEN_RECALL_CORPUS", { enumerable: true, get: function () { return recall_eval_js_1.GOLDEN_RECALL_CORPUS; } });
var input_sanitizer_js_1 = require("./core/input-sanitizer.js");
Object.defineProperty(exports, "sanitizeUserMessage", { enumerable: true, get: function () { return input_sanitizer_js_1.sanitizeUserMessage; } });
Object.defineProperty(exports, "redactSecrets", { enumerable: true, get: function () { return input_sanitizer_js_1.redactSecrets; } });
var freshness_guard_js_1 = require("./core/freshness-guard.js");
Object.defineProperty(exports, "FreshnessGuard", { enumerable: true, get: function () { return freshness_guard_js_1.FreshnessGuard; } });
Object.defineProperty(exports, "DEFAULT_FRESHNESS", { enumerable: true, get: function () { return freshness_guard_js_1.DEFAULT_FRESHNESS; } });
var source_verifier_js_1 = require("./core/source-verifier.js");
Object.defineProperty(exports, "SourceVerifier", { enumerable: true, get: function () { return source_verifier_js_1.SourceVerifier; } });
var time_awareness_js_1 = require("./core/time-awareness.js");
Object.defineProperty(exports, "TimeAwareness", { enumerable: true, get: function () { return time_awareness_js_1.TimeAwareness; } });
Object.defineProperty(exports, "buoiOf", { enumerable: true, get: function () { return time_awareness_js_1.buoiOf; } });
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