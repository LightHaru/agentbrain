"use strict";
/**
 * AgentBrain — OpenClaw Plugin Entry Point
 *
 * Hooks into OpenClaw lifecycle events:
 * - before_prompt_build: inject brain context into agent prompt
 * - message_received: process incoming message (classify, recall, emotion)
 * - message_sent: consolidate memory, track skills, process reward
 * - agent_end: session reflection + persist brain state
 *
 * Format matches agent-memory-graph plugin pattern.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_entry_1 = require("openclaw/plugin-sdk/plugin-entry");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const thalamus_js_1 = require("../core/thalamus.js");
const hippocampus_js_1 = require("../core/hippocampus.js");
const amygdala_js_1 = require("../core/amygdala.js");
const cingulate_js_1 = require("../core/cingulate.js");
const cerebellum_js_1 = require("../core/cerebellum.js");
const basal_ganglia_js_1 = require("../core/basal-ganglia.js");
const prefrontal_js_1 = require("../core/prefrontal.js");
const md_writer_js_1 = require("../storage/md-writer.js");
const priority_enforcer_js_1 = require("../integration/priority-enforcer.js");
const context_injector_js_1 = require("../integration/context-injector.js");
const template_manager_js_1 = require("../marketplace/template-manager.js");
const brain_sync_js_1 = require("../marketplace/brain-sync.js");
const config_js_1 = require("../core/config.js");
// --- State ---
let initialized = false;
let thalamus;
let hippocampus;
let amygdala;
let cingulate;
let cerebellum;
let basalGanglia;
let prefrontal;
let fileManager;
let enforcer;
let injector;
let templateManager;
let brainSync;
let interactionCount = 0;
let heartbeatCount = 0;
let lastMessageContext = null;
function resolveDir(dir) {
    if (dir.startsWith('~'))
        return (0, node_path_1.resolve)((0, node_os_1.homedir)(), dir.slice(2));
    return (0, node_path_1.resolve)(dir);
}
async function ensureInitialized(config) {
    if (initialized)
        return true;
    try {
        const brainDir = resolveDir(config?.brainDir || '~/.openclaw/data/agentbrain');
        const brainConfig = {
            ...config_js_1.defaultConfig,
            brainDir,
            maxRecallResults: config?.maxRecallResults ?? config_js_1.defaultConfig.maxRecallResults,
            memoryDecayRate: config?.memoryDecayRate ?? config_js_1.defaultConfig.memoryDecayRate,
            minMemoryConfidence: config?.minMemoryConfidence ?? config_js_1.defaultConfig.minMemoryConfidence,
            enableReflection: config?.enableReflection ?? config_js_1.defaultConfig.enableReflection,
            enableEmotions: config?.enableEmotions ?? config_js_1.defaultConfig.enableEmotions,
            enableSkillTracking: config?.enableSkillTracking ?? config_js_1.defaultConfig.enableSkillTracking,
            maintenanceInterval: config?.maintenanceInterval ?? config_js_1.defaultConfig.maintenanceInterval,
        };
        fileManager = new md_writer_js_1.BrainFileManager(brainDir);
        await fileManager.ensureBrainStructure();
        thalamus = new thalamus_js_1.Thalamus(brainConfig);
        hippocampus = new hippocampus_js_1.Hippocampus(brainConfig, fileManager);
        await hippocampus.initialize();
        amygdala = new amygdala_js_1.Amygdala(brainConfig, fileManager);
        await amygdala.initialize();
        cingulate = new cingulate_js_1.AnteriorCingulate(brainConfig, fileManager);
        await cingulate.initialize();
        cerebellum = new cerebellum_js_1.Cerebellum(brainConfig, fileManager);
        await cerebellum.initialize();
        basalGanglia = new basal_ganglia_js_1.BasalGanglia(brainConfig, fileManager);
        await basalGanglia.initialize();
        prefrontal = new prefrontal_js_1.PrefrontalCortex(brainConfig, fileManager);
        await prefrontal.initialize();
        enforcer = new priority_enforcer_js_1.PriorityEnforcer();
        injector = new context_injector_js_1.ContextInjector(enforcer);
        templateManager = new template_manager_js_1.TemplateManager(brainDir, fileManager);
        brainSync = new brain_sync_js_1.BrainSync(brainDir);
        initialized = true;
        console.log('[AgentBrain] Plugin initialized — all 7 modules online');
        return true;
    }
    catch (err) {
        console.warn('[AgentBrain] Initialization failed:', err.message);
        return false;
    }
}
exports.default = (0, plugin_entry_1.definePluginEntry)({
    id: 'agentbrain',
    name: 'AgentBrain',
    description: 'Brain-inspired cognitive architecture. Self-evolving personality, memory, emotions, skill learning.',
    register(api) {
        // ─── HOOK: before_prompt_build ───
        // Inject brain context into every agent prompt
        api.on('before_prompt_build', async (event, ctx) => {
            const config = ctx?.pluginConfig;
            if (config?.enabled === false)
                return;
            if (config?.promptInjection === false)
                return;
            if (!await ensureInitialized(config))
                return;
            try {
                // Use last message context if available
                const message = event.prompt?.slice(0, 200) || '';
                if (!message)
                    return;
                const msgContext = {
                    message,
                    senderId: lastMessageContext?.senderId || 'unknown',
                    senderName: lastMessageContext?.senderName || 'User',
                    timestamp: new Date().toISOString(),
                    sessionId: ctx?.sessionKey || '',
                };
                // Thalamus classifies
                const classification = thalamus.classify(msgContext);
                // Hippocampus recalls
                const relevantMemories = await hippocampus.recall(message, classification.topic);
                // Build injection context
                const injectionContext = {
                    classification,
                    emotionalState: amygdala.getState(),
                    personality: cingulate.getPersonality(),
                    relationship: amygdala.getRelationship(msgContext.senderId) || null,
                    relevantMemories,
                    topSkills: cerebellum.getTopSkills(3),
                    activeHabits: cerebellum.getActiveHabits(),
                    workingMemory: prefrontal.getWorkingMemory(),
                    rewardTrend: basalGanglia.getRecentTrend(),
                };
                // Generate injectable context
                const brainContext = injector.inject(injectionContext, {
                    maxTokens: config?.maxInjectionTokens ?? 250,
                });
                if (!brainContext || brainContext.length < 20)
                    return;
                if (config?.logging) {
                    console.log(`[AgentBrain] Injecting brain context (${brainContext.length} chars)`);
                }
                return { appendContext: brainContext };
            }
            catch (err) {
                console.warn('[AgentBrain] Prompt injection failed:', err.message);
                return;
            }
        }, { priority: 20 } // after memory-graph (priority 10)
        );
        // ─── HOOK: message_received ───
        // Process incoming message: classify, detect emotion, plan
        api.on('message_received', async (event) => {
            const config = event.context?.pluginConfig;
            if (config?.enabled === false)
                return;
            if (!await ensureInitialized(config))
                return;
            const text = typeof event.content === 'string'
                ? event.content
                : event.content?.text || event.content?.body || '';
            if (!text || text.length < 3)
                return;
            const msgContext = {
                message: text,
                senderId: event.senderId || 'unknown',
                senderName: event.senderName || 'User',
                timestamp: new Date().toISOString(),
                sessionId: event.sessionKey || '',
            };
            // Store for before_prompt_build
            lastMessageContext = msgContext;
            try {
                // Amygdala: process emotion + threat detection
                if (config?.enableEmotions !== false) {
                    amygdala.process(msgContext);
                }
                // Prefrontal: plan response
                if (config?.enablePrefrontal !== false) {
                    const classification = thalamus.classify(msgContext);
                    prefrontal.plan(classification, text);
                    prefrontal.updateWorkingMemory(`User: ${text.slice(0, 80)}`, 'message_received', 1.0);
                }
                // Cerebellum: detect skill pattern
                if (config?.enableSkillTracking !== false) {
                    const skill = cerebellum.detectSkill(text);
                    if (skill) {
                        cerebellum.detectPattern(skill, msgContext.timestamp);
                    }
                }
                interactionCount++;
            }
            catch (err) {
                if (config?.logging) {
                    console.warn('[AgentBrain] message_received processing failed:', err.message);
                }
            }
        }, { priority: 20 });
        // ─── HOOK: message_sent ───
        // Post-response: consolidate memory, track skills, process reward
        api.on('message_sent', async (event) => {
            const config = event.context?.pluginConfig;
            if (config?.enabled === false)
                return;
            if (!await ensureInitialized(config))
                return;
            if (!lastMessageContext)
                return;
            const responseText = typeof event.content === 'string'
                ? event.content
                : event.content?.text || '';
            if (!responseText || responseText.length < 5)
                return;
            try {
                // Hippocampus: consolidate memory
                await hippocampus.consolidate({
                    message: lastMessageContext.message,
                    response: responseText,
                    senderId: lastMessageContext.senderId,
                    senderName: lastMessageContext.senderName,
                    timestamp: lastMessageContext.timestamp,
                });
                // Detect sentiment for reward
                const sentiment = amygdala.detectSentiment(lastMessageContext.message);
                // Cerebellum: record skill usage
                if (config?.enableSkillTracking !== false) {
                    const skill = cerebellum.detectSkill(lastMessageContext.message);
                    if (skill) {
                        cerebellum.recordSkillUsage(skill, sentiment >= 0);
                    }
                }
                // Basal Ganglia: process reward signal
                const skill = cerebellum.detectSkill(lastMessageContext.message);
                basalGanglia.processReward({
                    timestamp: new Date().toISOString(),
                    taskType: skill || 'general',
                    signal: sentiment,
                    source: 'implicit',
                    context: lastMessageContext.message.slice(0, 50),
                });
                // Anterior Cingulate: reflect on significant tasks
                if (config?.enableReflection !== false) {
                    const classification = thalamus.classify(lastMessageContext);
                    if (classification.requiresAction || Math.abs(sentiment) > 0.3) {
                        cingulate.reflect({
                            taskDescription: lastMessageContext.message.slice(0, 100),
                            userMessage: lastMessageContext.message,
                            agentResponse: responseText,
                            userSentiment: sentiment,
                            emotionalState: amygdala.getState(),
                        });
                    }
                }
                // Prefrontal: complete plan
                prefrontal.completePlan();
            }
            catch (err) {
                if (config?.logging) {
                    console.warn('[AgentBrain] message_sent processing failed:', err.message);
                }
            }
        }, { priority: 20 });
        // ─── HOOK: agent_end ───
        // Session end: persist all brain state
        api.on('agent_end', async (_event, ctx) => {
            const config = ctx?.pluginConfig;
            if (config?.enabled === false)
                return;
            if (!initialized)
                return;
            try {
                // Persist all module states
                await amygdala.persist();
                await cingulate.persist();
                await cerebellum.persist();
                await basalGanglia.persist();
                await prefrontal.persist();
                if (config?.logging) {
                    console.log(`[AgentBrain] Session ended — brain state persisted (${interactionCount} interactions)`);
                }
            }
            catch (err) {
                console.warn('[AgentBrain] agent_end persist failed:', err.message);
            }
        }, { priority: 20 });
        // ─── TOOLS ───
        api.registerTool('agentbrain_status', {
            description: 'Get AgentBrain status: modules, stats, emotional state, personality',
            parameters: {},
            handler: async (_params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                return {
                    initialized,
                    interactionCount,
                    heartbeatCount,
                    modules: {
                        thalamus: true,
                        hippocampus: true,
                        amygdala: true,
                        cingulate: true,
                        cerebellum: true,
                        basalGanglia: true,
                        prefrontal: true,
                    },
                    emotionalState: amygdala.getState(),
                    personality: cingulate.getPersonality(),
                    performanceStats: cingulate.getPerformanceStats(),
                    memoryStats: hippocampus.getStats(),
                    topSkills: cerebellum.getTopSkills(5),
                    activeHabits: cerebellum.getActiveHabits(),
                    rewardTrend: basalGanglia.getRecentTrend(),
                };
            },
        });
        api.registerTool('agentbrain_personality', {
            description: 'Get or view current personality traits (0-100 scale)',
            parameters: {},
            handler: async (_params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                return {
                    traits: cingulate.getPersonality(),
                    performanceStats: cingulate.getPerformanceStats(),
                };
            },
        });
        api.registerTool('agentbrain_emotions', {
            description: 'Get current emotional state and relationship data',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'User ID to get relationship for' },
                },
            },
            handler: async (params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                const result = { emotionalState: amygdala.getState() };
                if (params?.userId) {
                    result.relationship = amygdala.getRelationship(params.userId);
                }
                return result;
            },
        });
        api.registerTool('agentbrain_skills', {
            description: 'Get tracked skills and detected habits',
            parameters: {},
            handler: async (_params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                return {
                    skills: cerebellum.getAllSkills(),
                    habits: cerebellum.getActiveHabits(),
                    motivationRanking: basalGanglia.getMotivationRanking(),
                };
            },
        });
        api.registerTool('agentbrain_memories', {
            description: 'Query brain memories by topic or keyword',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' },
                    topic: { type: 'string', description: 'Topic filter' },
                },
                required: ['query'],
            },
            handler: async (params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                const memories = await hippocampus.recall(params.query, params.topic || 'general');
                return { memories, stats: hippocampus.getStats() };
            },
        });
        api.registerTool('agentbrain_reflect', {
            description: 'Trigger a manual self-reflection on recent interactions',
            parameters: {
                type: 'object',
                properties: {
                    taskDescription: { type: 'string', description: 'What was the task' },
                    outcome: { type: 'string', enum: ['success', 'partial', 'failure'] },
                },
            },
            handler: async (params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                const reflection = cingulate.reflect({
                    taskDescription: params?.taskDescription || 'Manual reflection',
                    userMessage: '',
                    agentResponse: '',
                    userSentiment: params?.outcome === 'success' ? 0.5 : params?.outcome === 'failure' ? -0.5 : 0,
                    emotionalState: amygdala.getState(),
                });
                await cingulate.persist();
                return reflection;
            },
        });
        api.registerTool('agentbrain_template_list', {
            description: 'List available brain templates',
            parameters: {},
            handler: async (_params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                return { templates: await templateManager.listTemplates() };
            },
        });
        api.registerTool('agentbrain_template_apply', {
            description: 'Apply a brain template (resets personality/emotions/skills to template baseline)',
            parameters: {
                type: 'object',
                properties: {
                    templateId: { type: 'string', description: 'Template ID to apply' },
                },
                required: ['templateId'],
            },
            handler: async (params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                const template = await templateManager.getTemplate(params.templateId);
                if (!template)
                    return { error: `Template not found: ${params.templateId}` };
                await templateManager.applyTemplate(template);
                return { success: true, applied: template.name };
            },
        });
        api.registerTool('agentbrain_snapshot', {
            description: 'Save or list brain state snapshots (backup/restore)',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['save', 'list'], description: 'Action to perform' },
                    label: { type: 'string', description: 'Snapshot label (for save)' },
                },
                required: ['action'],
            },
            handler: async (params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                if (params.action === 'save') {
                    const path = await brainSync.saveSnapshot(params.label);
                    return { success: true, path };
                }
                if (params.action === 'list') {
                    return { snapshots: await brainSync.listSnapshots() };
                }
                return { error: 'Unknown action' };
            },
        });
    },
});
//# sourceMappingURL=entry.js.map