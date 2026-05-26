"use strict";
/**
 * AgentBrain — Brain-inspired cognitive architecture for AI agents
 *
 * Main entry point. Registers OpenClaw plugin hooks and initializes
 * all brain modules (Thalamus, Hippocampus, Prefrontal, Amygdala,
 * Cerebellum, Basal Ganglia, Anterior Cingulate).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.ContextInjector = exports.PriorityEnforcer = exports.createOpenClawPlugin = exports.defaultConfig = exports.BrainFileManager = exports.PrefrontalCortex = exports.BasalGanglia = exports.Cerebellum = exports.AnteriorCingulate = exports.Amygdala = exports.Hippocampus = exports.Thalamus = void 0;
exports.createAgentBrain = createAgentBrain;
const thalamus_js_1 = require("./core/thalamus.js");
const hippocampus_js_1 = require("./core/hippocampus.js");
const md_writer_js_1 = require("./storage/md-writer.js");
const config_js_1 = require("./core/config.js");
// Re-export all modules for external use
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
var md_writer_js_2 = require("./storage/md-writer.js");
Object.defineProperty(exports, "BrainFileManager", { enumerable: true, get: function () { return md_writer_js_2.BrainFileManager; } });
var config_js_2 = require("./core/config.js");
Object.defineProperty(exports, "defaultConfig", { enumerable: true, get: function () { return config_js_2.defaultConfig; } });
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
    const thalamus = new thalamus_js_1.Thalamus(config);
    const hippocampus = new hippocampus_js_1.Hippocampus(config, fileManager);
    const plugin = {
        name: 'agentbrain',
        version: '0.1.0',
        config,
        thalamus,
        hippocampus,
        fileManager,
        async initialize() {
            await fileManager.ensureBrainStructure();
            await hippocampus.initialize();
            console.log('[AgentBrain] Initialized — all modules online');
        },
        async onPreResponse(context) {
            // Step 1: Thalamus classifies and routes
            const classification = thalamus.classify(context);
            // Step 2: Hippocampus retrieves relevant memories
            const relevantMemories = await hippocampus.recall(context.message, classification.topic);
            // Step 3: Build brain context for response generation
            const brainContext = {
                classification,
                relevantMemories,
                emotionalState: { mood: 'neutral', intensity: 0.5, valence: 0, arousal: 0.3 },
                activeSkills: [],
            };
            return brainContext;
        },
        async onPostResponse(context, response) {
            // Step 5: Hippocampus consolidates new memory
            await hippocampus.consolidate({
                message: context.message,
                response,
                senderId: context.senderId,
                senderName: context.senderName,
                timestamp: context.timestamp,
            });
        },
        async onHeartbeat() {
            // Periodic maintenance: memory decay, consolidation
            await hippocampus.maintenance();
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