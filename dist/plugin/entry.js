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
 * Self-contained: does not import from openclaw/plugin-sdk at compile time.
 * OpenClaw gateway loads this file and calls .register(api).
 */
// Inline definePluginEntry — matches OpenClaw's expected export shape
function definePluginEntry(def) { return def; }
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const thalamus_js_1 = require("../core/thalamus.js");
const hippocampus_js_1 = require("../core/hippocampus.js");
const amygdala_js_1 = require("../core/amygdala.js");
const neurochemistry_js_1 = require("../core/neurochemistry.js");
const cingulate_js_1 = require("../core/cingulate.js");
const cerebellum_js_1 = require("../core/cerebellum.js");
const basal_ganglia_js_1 = require("../core/basal-ganglia.js");
const prefrontal_js_1 = require("../core/prefrontal.js");
const temporal_js_1 = require("../core/temporal.js");
const parietal_js_1 = require("../core/parietal.js");
const insula_js_1 = require("../core/insula.js");
const metacognition_js_1 = require("../core/metacognition.js");
const hypothalamus_js_1 = require("../core/hypothalamus.js");
const brainstem_js_1 = require("../core/brainstem.js");
const corpus_callosum_js_1 = require("../core/corpus-callosum.js");
const global_workspace_js_1 = require("../core/global-workspace.js");
const theory_of_mind_js_1 = require("../core/theory-of-mind.js");
const affect_core_js_1 = require("../core/affect-core.js");
const md_writer_js_1 = require("../storage/md-writer.js");
const sql_adapter_js_1 = require("../storage/sql-adapter.js");
const priority_enforcer_js_1 = require("../integration/priority-enforcer.js");
const context_injector_js_1 = require("../integration/context-injector.js");
const template_manager_js_1 = require("../marketplace/template-manager.js");
const brain_sync_js_1 = require("../marketplace/brain-sync.js");
const config_js_1 = require("../core/config.js");
const knowledge_extractor_js_1 = require("../core/knowledge-extractor.js");
const lesson_learner_js_1 = require("../core/lesson-learner.js");
const personality_influence_js_1 = require("../core/personality-influence.js");
const proactive_engine_js_1 = require("../core/proactive-engine.js");
const feedback_analyzer_js_1 = require("../core/feedback-analyzer.js");
const personality_adjuster_js_1 = require("../core/personality-adjuster.js");
const reasoning_cortex_js_1 = require("../core/reasoning-cortex.js");
const brain_whisper_format_js_1 = require("../integration/brain-whisper-format.js");
// --- State ---
let initialized = false;
let thalamus;
let hippocampus;
let amygdala;
let neurochem;
let cingulate;
let cerebellum;
let basalGanglia;
let prefrontal;
let temporal;
let parietal;
let insula;
let metacognition;
let hypothalamus;
let brainstem;
let corpusCallosum;
let globalWorkspace;
let theoryOfMind;
let affect;
let fileManager;
let storage;
let enforcer;
let injector;
let templateManager;
let brainSync;
let knowledgeExtractor;
let lessonLearner;
let personalityInfluence;
let proactiveEngine;
let feedbackAnalyzer;
let personalityAdjuster;
let reasoningCortex = null;
let interactionCount = 0;
let heartbeatCount = 0;
let lastMessageContext = null;
let lastAgentResponse = '';
const runtimeTurns = new Map();
const processedRuntimeOutputs = new Set();
const pendingWhispers = new Map();
function runtimeTurnKey(event, ctx) {
    return String(event?.runId || ctx?.runId || ctx?.sessionKey || ctx?.sessionId || 'latest');
}
function outputTextFromEvent(event) {
    if (Array.isArray(event?.assistantTexts)) {
        return event.assistantTexts.filter((item) => typeof item === 'string' && item.trim()).join('\n');
    }
    if (typeof event?.lastAssistantMessage === 'string')
        return event.lastAssistantMessage;
    const lastAssistantText = textFromMessage(event?.lastAssistant);
    if (lastAssistantText)
        return lastAssistantText;
    const messagesText = lastAssistantTextFromMessages(event?.messages);
    if (messagesText)
        return messagesText;
    if (typeof event?.text === 'string')
        return event.text;
    if (typeof event?.content === 'string')
        return event.content;
    return '';
}
function lastAssistantTextFromMessages(messages) {
    if (!Array.isArray(messages))
        return '';
    for (let index = messages.length - 1; index >= 0; index--) {
        const item = messages[index]?.message || messages[index];
        if (item?.role !== 'assistant')
            continue;
        const text = textFromMessage(item);
        if (text && !/\[assistant turn failed/i.test(text))
            return text;
    }
    return '';
}
function textFromMessage(message) {
    if (!message)
        return '';
    if (typeof message === 'string')
        return message;
    if (typeof message.text === 'string')
        return message.text;
    if (typeof message.content === 'string')
        return message.content;
    if (Array.isArray(message.content)) {
        return message.content
            .map((part) => typeof part === 'string' ? part : part?.text || part?.content || '')
            .filter((text) => text.trim())
            .join('\n');
    }
    return '';
}
function persistExtractionResult(result) {
    if (!result || !storage)
        return;
    const db = storage.getDatabase();
    for (const correction of result.corrections || []) {
        if (correction?.oldFact?.id && correction?.newFact?.id) {
            db.supersedeFact(correction.oldFact.id, correction.newFact.id, correction.timestamp);
        }
    }
    for (const fact of result.facts || []) {
        db.insertFact({
            id: fact.id,
            subject: fact.subject,
            relation: fact.relation,
            object: fact.object,
            confidence: fact.confidence,
            source: fact.source,
            timestamp: fact.timestamp,
            validFrom: fact.validFrom,
        });
    }
    for (const entity of result.entities || []) {
        db.upsertEntity({
            name: entity.name,
            type: entity.type,
            aliases: entity.aliases || [],
            timestamp: entity.lastSeen || entity.firstSeen || new Date().toISOString(),
        });
    }
}
function loadPersistedKnowledge() {
    if (!storage || !knowledgeExtractor)
        return;
    const db = storage.getDatabase();
    const facts = db.getCurrentFacts().map((row) => ({
        id: row.id,
        subject: row.subject,
        relation: row.relation,
        object: row.object,
        confidence: row.confidence,
        source: row.source,
        timestamp: row.timestamp,
        supersededBy: row.superseded_by || undefined,
        validFrom: row.valid_from || row.timestamp,
        validUntil: row.valid_until || undefined,
    }));
    knowledgeExtractor.loadFacts(facts);
    const entities = db.getEntities().map((row) => ({
        name: row.name,
        type: row.type,
        aliases: safeJsonArray(row.aliases),
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
    }));
    knowledgeExtractor.loadEntities(entities);
}
function safeJsonArray(value) {
    try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function getRelevantFactsContext(message, limit = 5) {
    if (!storage)
        return '';
    const db = storage.getDatabase();
    const facts = db.getCurrentFacts();
    if (!facts.length)
        return '';
    const tokens = new Set(message
        .toLowerCase()
        .split(/[^\p{L}\p{N}_-]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3));
    const scored = facts.map((fact) => {
        const haystack = `${fact.subject} ${fact.relation} ${fact.object}`.toLowerCase();
        let score = 0;
        for (const token of tokens) {
            if (haystack.includes(token))
                score += token.length >= 5 ? 2 : 1;
        }
        if (/mật\s+danh|codename|code\s+name/i.test(`${fact.subject} ${fact.relation}`))
            score += 4;
        return { fact, score };
    });
    const selected = scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || String(b.fact.timestamp).localeCompare(String(a.fact.timestamp)))
        .slice(0, limit)
        .map((item) => `${item.fact.subject} ${item.fact.relation} ${item.fact.object}`);
    if (!selected.length)
        return '';
    return `Relevant facts: ${selected.join(' | ')}`;
}
async function processRuntimeCompletion(event, ctx, config) {
    if (config?.enabled === false)
        return;
    if (!await ensureInitialized(config))
        return;
    const key = runtimeTurnKey(event, ctx);
    if (processedRuntimeOutputs.has(key))
        return;
    const responseText = outputTextFromEvent(event);
    if (!responseText || responseText.length < 5 || /\[assistant turn failed/i.test(responseText))
        return;
    let msgContext = runtimeTurns.get(key) || lastMessageContext;
    const prompt = typeof event?.prompt === 'string' ? event.prompt : '';
    if (!msgContext && prompt) {
        msgContext = {
            message: prompt,
            senderId: ctx?.senderId || 'openclaw-agent',
            senderName: 'User',
            timestamp: new Date().toISOString(),
            sessionId: ctx?.sessionKey || ctx?.sessionId || '',
        };
    }
    if (!msgContext)
        return;
    try {
        await hippocampus.consolidate({
            message: msgContext.message,
            response: responseText,
            senderId: msgContext.senderId,
            senderName: msgContext.senderName,
            timestamp: msgContext.timestamp,
        });
        await hippocampus.flush();
        const knowledge = knowledgeExtractor.extract(msgContext.message, responseText, {
            senderName: msgContext.senderName,
            timestamp: msgContext.timestamp,
            previousFacts: knowledgeExtractor.getActiveFacts(),
        });
        persistExtractionResult(knowledge);
        const lesson = lessonLearner.analyze({
            userMessage: msgContext.message,
            agentResponse: responseText,
            previousAgentResponse: lastAgentResponse,
            senderName: msgContext.senderName,
            timestamp: msgContext.timestamp,
        });
        if (lesson && config?.logging) {
            console.log(`[AgentBrain] Lesson learned: ${lesson.type} - ${lesson.right.slice(0, 60)}`);
        }
        const sentiment = amygdala.detectSentiment(msgContext.message);
        const isToolFailure = /timeout|rate.?limit|api.?error|quota|expired|timed out/i.test(responseText);
        const rewardSignal = isToolFailure ? 0 : sentiment;
        const skill = cerebellum.detectSkill(msgContext.message);
        if (config?.enableSkillTracking !== false && skill) {
            cerebellum.recordSkillUsage(skill, rewardSignal >= 0);
        }
        basalGanglia.processReward({
            timestamp: new Date().toISOString(),
            taskType: skill || 'general',
            signal: rewardSignal,
            source: 'implicit',
            context: msgContext.message.slice(0, 50),
        });
        feedbackAnalyzer.recordAgentReply();
        if (config?.enableReflection !== false) {
            const classification = thalamus.classify(msgContext);
            if (classification.requiresAction || Math.abs(sentiment) > 0.3) {
                cingulate.reflect({
                    taskDescription: msgContext.message.slice(0, 100),
                    userMessage: msgContext.message,
                    agentResponse: responseText,
                    userSentiment: rewardSignal,
                    emotionalState: amygdala.getState(),
                });
            }
        }
        prefrontal.completePlan();
        personalityInfluence.updateTraits(cingulate.getPersonality());
        lastAgentResponse = responseText;
        processedRuntimeOutputs.add(key);
        runtimeTurns.delete(key);
    }
    catch (err) {
        if (config?.logging) {
            console.warn('[AgentBrain] runtime completion processing failed:', err.message);
        }
    }
}
function resolveDir(dir) {
    if (dir.startsWith('~'))
        return (0, node_path_1.resolve)((0, node_os_1.homedir)(), dir.slice(2));
    return (0, node_path_1.resolve)(dir);
}
async function ensureInitialized(config) {
    if (initialized)
        return true;
    // Fallback: if no config passed, use defaults with standard brainDir
    if (!config) {
        config = { enabled: true, brainDir: '~/.openclaw/data/agentbrain' };
    }
    pendingWhispers.clear();
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
            reasoningWhisper: config?.reasoningWhisper ?? config_js_1.defaultConfig.reasoningWhisper,
            advisorModel: config?.advisorModel ?? config_js_1.defaultConfig.advisorModel,
        };
        // SQL storage (primary)
        storage = new sql_adapter_js_1.SqlStorageAdapter(brainDir);
        await storage.ensureBrainStructure();
        // Legacy file manager (for template/sync compatibility)
        fileManager = new md_writer_js_1.BrainFileManager(brainDir);
        thalamus = new thalamus_js_1.Thalamus(brainConfig);
        hippocampus = new hippocampus_js_1.Hippocampus(brainConfig, storage);
        await hippocampus.initialize();
        amygdala = new amygdala_js_1.Amygdala(brainConfig, storage);
        await amygdala.initialize();
        // Phase 3: Neurochemistry — neuromodulators bias mood with real momentum
        neurochem = new neurochemistry_js_1.Neurochemistry(brainConfig, storage);
        await neurochem.initialize();
        amygdala.attachNeurochemistry(neurochem);
        cingulate = new cingulate_js_1.AnteriorCingulate(brainConfig, storage);
        await cingulate.initialize();
        cerebellum = new cerebellum_js_1.Cerebellum(brainConfig, storage);
        await cerebellum.initialize();
        basalGanglia = new basal_ganglia_js_1.BasalGanglia(brainConfig, storage);
        await basalGanglia.initialize();
        prefrontal = new prefrontal_js_1.PrefrontalCortex(brainConfig, storage);
        await prefrontal.initialize();
        // Phase 1 modules (v0.2.0)
        temporal = new temporal_js_1.TemporalLobe(brainConfig);
        parietal = new parietal_js_1.ParietalLobe(brainConfig);
        insula = new insula_js_1.Insula(brainConfig);
        metacognition = new metacognition_js_1.Metacognition(brainConfig);
        reasoningCortex = brainConfig.reasoningWhisper?.enabled === false
            ? null
            : new reasoning_cortex_js_1.ReasoningCortex(brainConfig, hippocampus, temporal);
        // Phase 2 modules (v0.6.0) — now REAL, wired into the pipeline
        hypothalamus = new hypothalamus_js_1.Hypothalamus('Asia/Ho_Chi_Minh');
        brainstem = new brainstem_js_1.Brainstem();
        corpusCallosum = new corpus_callosum_js_1.CorpusCallosum();
        globalWorkspace = new global_workspace_js_1.GlobalWorkspace();
        theoryOfMind = new theory_of_mind_js_1.TheoryOfMind();
        affect = new affect_core_js_1.AffectCore();
        for (const id of ['thalamus', 'hippocampus', 'amygdala', 'neurochemistry', 'cingulate', 'cerebellum', 'basalGanglia', 'prefrontal', 'temporal', 'parietal', 'insula', 'metacognition', 'reasoningCortex', 'hypothalamus', 'brainstem', 'globalWorkspace', 'theoryOfMind', 'affect']) {
            corpusCallosum.register(id);
        }
        enforcer = new priority_enforcer_js_1.PriorityEnforcer();
        injector = new context_injector_js_1.ContextInjector(enforcer);
        templateManager = new template_manager_js_1.TemplateManager(brainDir, fileManager);
        brainSync = new brain_sync_js_1.BrainSync(brainDir);
        // Phase 5 modules (v0.3.0)
        knowledgeExtractor = new knowledge_extractor_js_1.KnowledgeExtractor();
        loadPersistedKnowledge();
        lessonLearner = new lesson_learner_js_1.LessonLearner();
        proactiveEngine = new proactive_engine_js_1.ProactiveEngine();
        feedbackAnalyzer = new feedback_analyzer_js_1.FeedbackAnalyzer();
        personalityAdjuster = new personality_adjuster_js_1.PersonalityAdjuster();
        // Load persisted lessons and patterns from SQL
        const lessonsData = await storage.readFile('learning/lessons.md');
        if (lessonsData) {
            try {
                lessonLearner.loadLessons(JSON.parse(lessonsData));
            }
            catch (e) { }
        }
        const patternsData = await storage.readFile('learning/patterns.md');
        if (patternsData) {
            try {
                proactiveEngine.loadPatterns(JSON.parse(patternsData));
            }
            catch (e) { }
        }
        // PersonalityInfluence from current traits
        const personality = cingulate.getPersonality();
        personalityInfluence = new personality_influence_js_1.PersonalityInfluence({
            warmth: personality.warmth ?? 65,
            directness: personality.directness ?? 75,
            humor: personality.humor ?? 55,
            protectiveness: personality.protectiveness ?? 80,
            curiosity: personality.curiosity ?? 60,
            assertiveness: personality.assertiveness ?? 70,
        });
        initialized = true;
        console.log('[AgentBrain] Plugin v0.4.1 initialized — SQL storage + circadian + source routing + brain whisper online');
        return true;
    }
    catch (err) {
        console.warn('[AgentBrain] Initialization failed:', err.message);
        return false;
    }
}
const _plugin = definePluginEntry({
    id: 'lightharu-agentbrain',
    name: 'AgentBrain',
    description: 'Brain-inspired cognitive architecture. Self-evolving personality, memory, emotions, skill learning.',
    register(api) {
        api.on('before_agent_run', async (event, ctx) => {
            const config = ctx?.pluginConfig;
            if (config?.enabled === false)
                return;
            if (!await ensureInitialized(config))
                return;
            const text = typeof event?.prompt === 'string' ? event.prompt : '';
            if (!text || text.length < 3)
                return;
            const msgContext = {
                message: text,
                senderId: event?.senderId || ctx?.senderId || 'openclaw-agent',
                senderName: event?.senderName || 'User',
                timestamp: new Date().toISOString(),
                sessionId: ctx?.sessionKey || ctx?.sessionId || '',
            };
            const key = runtimeTurnKey(event, ctx);
            runtimeTurns.set(key, msgContext);
            lastMessageContext = msgContext;
            try {
                if (config?.enableEmotions !== false) {
                    amygdala.process(msgContext);
                }
                const classification = thalamus.classify(msgContext);
                if (config?.enablePrefrontal !== false) {
                    prefrontal.plan(classification, text);
                    prefrontal.updateWorkingMemory(`User: ${text.slice(0, 80)}`, 'before_agent_run', 1.0);
                }
                if (config?.enableSkillTracking !== false) {
                    const skill = cerebellum.detectSkill(text);
                    if (skill) {
                        cerebellum.detectPattern(skill, msgContext.timestamp);
                    }
                    cerebellum.detectRelationshipPattern(text, msgContext.timestamp);
                }
                const feedback = feedbackAnalyzer.analyze(text, Date.now());
                if (feedback.sentiment !== 'neutral' || feedback.markers.length > 0) {
                    const rewardValue = feedbackAnalyzer.toRewardSignal(feedback);
                    const skill = cerebellum.detectSkill(text);
                    basalGanglia.processReward({
                        timestamp: feedback.timestamp,
                        taskType: skill || 'general',
                        signal: rewardValue,
                        source: feedback.confidence > 0.7 ? 'explicit' : 'implicit',
                        context: `Feedback: ${feedback.markers.join(', ')} | RT: ${feedback.reactionTimeMs}ms`,
                    });
                }
                interactionCount++;
            }
            catch (err) {
                if (config?.logging) {
                    console.warn('[AgentBrain] before_agent_run processing failed:', err.message);
                }
            }
        }, { priority: 20 });
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
                // Temporal comprehends
                const semanticRep = temporal.comprehend(message, { role: 'user', timestamp: Date.now() });
                // Parietal integrates
                parietal.integrateSensoryInput([{
                        modality: 'text',
                        data: message,
                        timestamp: Date.now(),
                        importance: classification.urgency === 'critical' ? 1.0 : 0.5,
                    }]);
                // Insula models user state
                insula.modelUserState({
                    message,
                    recentInteractions: interactionCount,
                    userSuccessRate: 0.8,
                    timeOfDay: new Date().getHours(),
                });
                // Hippocampus recalls (semantic-enhanced)
                const recallQuery = semanticRep.concepts.length > 0
                    ? semanticRep.concepts.join(' ')
                    : message;
                const relevantMemories = await hippocampus.recall(recallQuery, classification.topic);
                // Amygdala emotion state
                const emotionalState = amygdala.getState();
                const relationship = amygdala.getRelationship(msgContext.senderId);
                let feeling;
                try {
                    const affectState = affect.getState();
                    feeling = {
                        label: affectState.primary.label,
                        intensity: affectState.primary.intensity,
                        valence: affectState.dimensional.valence,
                        arousal: affectState.dimensional.arousal,
                    };
                }
                catch { /* affect state is best-effort */ }
                // Lessons from past corrections
                const relevantLessons = lessonLearner.findRelevantLessons(message);
                const lessonsContext = lessonLearner.formatForInjection(relevantLessons);
                // Personality-driven style directives
                const styleDirectives = personalityInfluence.generateDirectives({
                    timeOfDay: new Date().getHours(),
                    mood: emotionalState.mood,
                    valence: emotionalState.valence,
                    arousal: emotionalState.arousal,
                    recentTopics: [classification.topic],
                    interactionCount,
                    trustLevel: relationship?.trustLevel || 10,
                    lastUserSentiment: amygdala.detectSentiment(message),
                });
                // Proactive suggestions
                const suggestions = proactiveEngine.checkTriggers({
                    currentHour: new Date().getHours(),
                    lastMessage: message,
                });
                const suggestionsContext = suggestions.length > 0
                    ? `Proactive: ${suggestions.map(s => s.message).join(' | ')}`
                    : '';
                const factsContext = getRelevantFactsContext(message);
                const sessionId = ctx?.sessionKey || ctx?.sessionId || msgContext.sessionId || 'default';
                let reasoningWhisper = '';
                try {
                    const previousWhisperId = pendingWhispers.get(sessionId);
                    if (previousWhisperId && reasoningCortex) {
                        const feedbackOutcome = (0, brain_whisper_format_js_1.inferFeedbackOutcome)(message, amygdala.detectSentiment(message));
                        if (feedbackOutcome) {
                            reasoningCortex.recordOutcome(previousWhisperId, feedbackOutcome.success, feedbackOutcome.userSatisfaction);
                        }
                        pendingWhispers.delete(sessionId);
                    }
                    if (reasoningCortex) {
                        const whisper = await reasoningCortex.generateWhisper({
                            userMessage: message,
                            conversationHistory: Array.isArray(event?.messages) ? event.messages : undefined,
                            timeoutSeconds: event?.timeoutSeconds ?? ctx?.timeoutSeconds,
                            contextTokens: event?.contextTokens ?? event?.promptTokens ?? ctx?.contextTokens,
                            elapsedSeconds: event?.elapsedSeconds ?? ctx?.elapsedSeconds,
                        });
                        if (whisper.tokenBudget > 0) {
                            reasoningWhisper = (0, brain_whisper_format_js_1.formatWhisper)(whisper);
                            pendingWhispers.set(sessionId, whisper.whisperId);
                        }
                    }
                }
                catch (error) {
                    if (config?.logging) {
                        console.warn('[AgentBrain] Brain Whisper generation failed:', error.message);
                    }
                }
                // Record action for pattern learning
                proactiveEngine.recordAction(classification.topic || 'general', new Date().toISOString());
                // Build injection context
                const injectionContext = {
                    classification,
                    emotionalState,
                    personality: cingulate.getPersonality(),
                    relationship: relationship || null,
                    relevantMemories,
                    topSkills: cerebellum.getTopSkills(3),
                    activeHabits: cerebellum.getActiveHabits(),
                    workingMemory: prefrontal.getWorkingMemory(),
                    rewardTrend: basalGanglia.getRecentTrend(),
                    feeling,
                    lessonsContext,
                    styleDirectives,
                    suggestionsContext,
                    factsContext,
                    reasoningWhisper,
                };
                // Generate injectable context
                const brainContext = injector.inject(injectionContext, {
                    maxTokens: (0, brain_whisper_format_js_1.getInjectionBudget)(reasoningWhisper, config?.maxInjectionTokens ?? 250),
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
            // Detect heartbeat polls
            if (/heartbeat poll|HEARTBEAT_OK|heartbeat/i.test(text)) {
                heartbeatCount++;
                amygdala.decayToward('neutral', 0.02);
                neurochem.decay(1); // Phase 3: chemicals drift toward baseline (lingering moods)
                hypothalamus.tick(); // Phase 2: drives grow with neglect over time
                brainstem.pump(); // Phase 2: run due autonomic processes
                // AffectCore (v0.8.0): spontaneous emotion from internal state, no input
                try {
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
                }
                catch { /* spontaneous affect is best-effort */ }
                return; // Don't process heartbeat as regular message
            }
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
                // Phase 5: Analyze user message as feedback signal
                const feedback = feedbackAnalyzer.analyze(text, Date.now());
                if (feedback.sentiment !== 'neutral' || feedback.markers.length > 0) {
                    const rewardValue = feedbackAnalyzer.toRewardSignal(feedback);
                    const skill = cerebellum.detectSkill(lastMessageContext?.message || '');
                    basalGanglia.processReward({
                        timestamp: feedback.timestamp,
                        taskType: skill || 'general',
                        signal: rewardValue,
                        source: feedback.confidence > 0.7 ? 'explicit' : 'implicit',
                        context: `Feedback: ${feedback.markers.join(', ')} | RT: ${feedback.reactionTimeMs}ms`,
                    });
                    // Every 10 interactions, adjust personality based on feedback patterns
                    if (interactionCount > 0 && interactionCount % 10 === 0) {
                        const recentReward = basalGanglia.getRecentTrend(10);
                        // Build feedback pattern summary from last 10 interactions
                        const patterns = [];
                        // Simplified: use current markers as signal (real impl would aggregate from history)
                        feedback.markers.forEach(m => {
                            const existing = patterns.find(p => p.marker === m);
                            if (existing)
                                existing.frequency++;
                            else
                                patterns.push({ marker: m, frequency: 1 });
                        });
                        if (patterns.length > 0 || Math.abs(recentReward) > 0.3) {
                            const currentTraits = cingulate.getPersonality();
                            const adjustedTraits = personalityAdjuster.adjust(currentTraits, patterns);
                            // Apply adjusted traits back to cingulate
                            if (JSON.stringify(currentTraits) !== JSON.stringify(adjustedTraits)) {
                                cingulate.updatePersonality(adjustedTraits);
                                personalityInfluence.updateTraits(adjustedTraits);
                                if (config?.logging) {
                                    console.log('[AgentBrain] Personality adjusted based on feedback patterns');
                                }
                            }
                        }
                    }
                }
                // Cerebellum: detect skill pattern
                if (config?.enableSkillTracking !== false) {
                    const skill = cerebellum.detectSkill(text);
                    if (skill) {
                        cerebellum.detectPattern(skill, msgContext.timestamp);
                    }
                    // Also detect relationship patterns
                    cerebellum.detectRelationshipPattern(text, msgContext.timestamp);
                }
                // ─── Phase 2 modules (v0.6.0) — real processing per message ───
                try {
                    const cls = thalamus.classify(msgContext);
                    const sentiment = amygdala.detectSentiment(text);
                    const emo = amygdala.getState();
                    // Hypothalamus: drives respond to topic/sentiment
                    hypothalamus.observe(cls.topic || 'general', sentiment);
                    if (cls.urgency === 'high' || cls.urgency === 'critical') {
                        hypothalamus.registerThreat(cls.urgency);
                        brainstem.recordThreat(cls.urgency, text.slice(0, 60));
                    }
                    brainstem.pump();
                    // Theory of Mind: model this user
                    theoryOfMind.observe(msgContext.senderId, msgContext.senderName, sentiment, cls.topic || 'general');
                    theoryOfMind.noteExpectation(msgContext.senderId, text);
                    // Global Workspace: modules compete for the spotlight
                    globalWorkspace.compete([
                        { source: 'thalamus', content: cls.topic || 'general', salience: cls.urgency === 'critical' ? 1 : cls.urgency === 'high' ? 0.8 : 0.4 },
                        { source: 'amygdala', content: emo.mood, salience: Math.min(1, Math.abs(emo.valence) * emo.arousal) },
                        { source: 'theoryOfMind', content: `user:${msgContext.senderName}`, salience: 0.45 },
                    ]);
                    // Corpus Callosum: real inter-module traffic
                    corpusCallosum.send({ from: 'thalamus', to: 'amygdala', type: 'classification', payload: cls.topic });
                    corpusCallosum.send({ from: 'amygdala', to: 'hypothalamus', type: 'emotion', payload: emo.mood });
                    corpusCallosum.send({ from: 'theoryOfMind', to: 'globalWorkspace', type: 'user-model' });
                    // Conflict check: emotion alarmed but drives calm = mismatch worth noting
                    const hypoStress = hypothalamus.getState().stressResponse;
                    if ((emo.mood === 'alarmed') && hypoStress === 'calm') {
                        corpusCallosum.flagConflict('amygdala', 'hypothalamus', 'emotion alarmed vs drive state calm');
                    }
                    // AffectCore (v0.8.0): GENERATE a discrete emotion via appraisal —
                    // same valence yields different feeling by agency/coping/novelty.
                    try {
                        // BUGFIX (Phase 2): threat must come from a REAL threat assessment of
                        // THIS message, not from the lingering persisted mood. Keying isThreat
                        // off emo.mood === 'alarmed' created a self-feeding loop: once alarmed,
                        // every later neutral message ('Xong chưa', 'Ok em làm đi') was re-scored
                        // as a threat -> anger -> stays alarmed forever.
                        const realThreat = amygdala.assessThreat(text);
                        const isThreat = realThreat.isThreat || cls.urgency === 'critical';
                        const sev = realThreat.severity === 'critical' || cls.urgency === 'critical' ? 1
                            : realThreat.severity === 'high' ? 0.75
                                : realThreat.severity === 'medium' ? 0.5
                                    : realThreat.severity === 'low' ? 0.3
                                        : 0.4;
                        const tomModel = theoryOfMind.getState().currentUserModel;
                        const novelty = Math.max(0, Math.min(1, Math.abs(sentiment - (tomModel?.lastSentiment ?? 0))));
                        affect.appraise({
                            goalCongruence: isThreat ? -sev : sentiment,
                            goalRelevance: isThreat ? 0.9 : 0.4 + Math.abs(sentiment) * 0.5,
                            agency: isThreat ? 'circumstance' : sentiment !== 0 ? 'other' : 'self',
                            copingPotential: isThreat ? 0.7 : 0.6,
                            novelty,
                            certainty: Math.max(0, Math.min(1, 1 - novelty * 0.5)),
                        }, text.slice(0, 50));
                    }
                    catch { /* affect is best-effort */ }
                }
                catch (e) {
                    if (config?.logging)
                        console.warn('[AgentBrain] phase2 processing failed:', e.message);
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
                await hippocampus.flush();
                // Knowledge extraction (structured facts)
                const knowledge = knowledgeExtractor.extract(lastMessageContext.message, responseText, {
                    senderName: lastMessageContext.senderName,
                    timestamp: lastMessageContext.timestamp,
                    previousFacts: knowledgeExtractor.getActiveFacts(),
                });
                persistExtractionResult(knowledge);
                // Lesson learning (detect corrections)
                const lesson = lessonLearner.analyze({
                    userMessage: lastMessageContext.message,
                    agentResponse: responseText,
                    previousAgentResponse: lastAgentResponse,
                    senderName: lastMessageContext.senderName,
                    timestamp: lastMessageContext.timestamp,
                });
                if (lesson && config?.logging) {
                    console.log(`[AgentBrain] Lesson learned: ${lesson.type} — ${lesson.right.slice(0, 60)}`);
                }
                // Detect sentiment for reward
                const sentiment = amygdala.detectSentiment(lastMessageContext.message);
                // Check if response contains tool error indicators
                const toolErrorPatterns = /timeout|rate.?limit|api.?error|quota|expired|timed out/i;
                const isToolFailure = toolErrorPatterns.test(responseText);
                // Use neutral reward for tool failures instead of negative
                const rewardSignal = isToolFailure ? 0 : sentiment;
                // Cerebellum: record skill usage
                if (config?.enableSkillTracking !== false) {
                    const skill = cerebellum.detectSkill(lastMessageContext.message);
                    if (skill) {
                        cerebellum.recordSkillUsage(skill, rewardSignal >= 0);
                    }
                }
                // Basal Ganglia: process reward signal
                const skill = cerebellum.detectSkill(lastMessageContext.message);
                basalGanglia.processReward({
                    timestamp: new Date().toISOString(),
                    taskType: skill || 'general',
                    signal: rewardSignal,
                    source: 'implicit',
                    context: lastMessageContext.message.slice(0, 50),
                });
                // Phase 5: Record agent reply timing for feedback analysis
                feedbackAnalyzer.recordAgentReply();
                // Anterior Cingulate: reflect on significant tasks
                if (config?.enableReflection !== false) {
                    const classification = thalamus.classify(lastMessageContext);
                    if (classification.requiresAction || Math.abs(sentiment) > 0.3) {
                        cingulate.reflect({
                            taskDescription: lastMessageContext.message.slice(0, 100),
                            userMessage: lastMessageContext.message,
                            agentResponse: responseText,
                            userSentiment: rewardSignal,
                            emotionalState: amygdala.getState(),
                        });
                    }
                }
                // Prefrontal: complete plan
                prefrontal.completePlan();
                // Update personality influence with latest traits
                personalityInfluence.updateTraits(cingulate.getPersonality());
                // Track last response for lesson learning
                lastAgentResponse = responseText;
            }
            catch (err) {
                if (config?.logging) {
                    console.warn('[AgentBrain] message_sent processing failed:', err.message);
                }
            }
        }, { priority: 20 });
        // ─── HOOK: agent_end ───
        // Session end: persist all brain state
        api.on('llm_output', async (event, ctx) => {
            const config = ctx?.pluginConfig;
            await processRuntimeCompletion(event, ctx, config);
        }, { priority: 20 });
        api.on('agent_end', async (event, ctx) => {
            const config = ctx?.pluginConfig;
            if (config?.enabled === false)
                return;
            await processRuntimeCompletion(event, ctx, config);
            if (!initialized)
                return;
            try {
                // Persist all module states via SQL adapter
                await amygdala.persist();
                await neurochem.persist();
                await cingulate.persist();
                await cerebellum.persist();
                await basalGanglia.persist();
                await prefrontal.persist();
                await hippocampus.flush();
                // Persist new modules
                const lessons = lessonLearner.getLessons();
                if (lessons.length > 0) {
                    await storage.writeFile('learning/lessons.md', JSON.stringify(lessons, null, 2));
                }
                const patterns = proactiveEngine.getPatterns();
                if (patterns.length > 0) {
                    await storage.writeFile('learning/patterns.md', JSON.stringify(patterns, null, 2));
                }
                const facts = knowledgeExtractor.getActiveFacts();
                if (facts.length > 0) {
                    await storage.writeFile('knowledge/facts.md', JSON.stringify(facts, null, 2));
                }
                if (config?.logging) {
                    console.log(`[AgentBrain] Session ended — brain state persisted (${interactionCount} interactions, ${lessons.length} lessons, ${facts.length} facts)`);
                }
            }
            catch (err) {
                console.warn('[AgentBrain] agent_end persist failed:', err.message);
            }
        }, { priority: 20 });
        // NOTE: OpenClaw has no 'heartbeat' typed hook.
        // Heartbeat detection is handled inside message_received via pattern match.
        // ─── TOOLS ───
        api.registerTool({
            name: 'agentbrain_status',
            description: 'Get AgentBrain status: modules, stats, emotional state, personality',
            parameters: {},
            execute: async (_id, _params, ctx) => {
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
                        // Phase 1 modules (v0.2.0)
                        temporal: true,
                        parietal: true,
                        insula: true,
                        metacognition: true,
                        reasoningCortex: reasoningCortex !== null,
                        // Phase 3 module (v0.5.0) — REAL, wired into amygdala
                        neurochemistry: true,
                        // Phase 2 modules (v0.4.1) — declared so gateway won't override
                        hypothalamus: true,
                        brainstem: true,
                        corpusCallosum: true,
                        globalWorkspace: true,
                        theoryOfMind: true,
                    },
                    emotionalState: amygdala.getState(),
                    neurochemistry: { levels: neurochem.getState(), signal: neurochem.describe() },
                    personality: cingulate.getPersonality(),
                    performanceStats: cingulate.getPerformanceStats(),
                    memoryStats: hippocampus.getStats(),
                    topSkills: cerebellum.getTopSkills(5),
                    activeHabits: cerebellum.getActiveHabits(),
                    rewardTrend: basalGanglia.getRecentTrend(),
                    // Phase 1 module states
                    temporalState: temporal.getState(),
                    parietalState: parietal.getState(),
                    insulaState: insula.getState(),
                    metacognitionState: metacognition.getState(),
                    // Phase 2 modules (v0.6.0) — REAL state from wired modules
                    hypothalamusState: hypothalamus.getState(),
                    brainstemState: brainstem.getState(),
                    corpusCallosumState: corpusCallosum.getState(),
                    globalWorkspaceState: globalWorkspace.getState(),
                    theoryOfMindState: theoryOfMind.getState(),
                    affectState: affect.getState(),
                };
            },
        });
        api.registerTool({
            name: 'agentbrain_personality',
            description: 'Get or view current personality traits (0-100 scale)',
            parameters: {},
            execute: async (_id, _params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                return {
                    traits: cingulate.getPersonality(),
                    performanceStats: cingulate.getPerformanceStats(),
                };
            },
        });
        api.registerTool({
            name: 'agentbrain_emotions',
            description: 'Get current emotional state and relationship data',
            parameters: {
                type: 'object',
                properties: {
                    userId: { type: 'string', description: 'User ID to get relationship for' },
                },
            },
            execute: async (_id, params, ctx) => {
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
        api.registerTool({
            name: 'agentbrain_skills',
            description: 'Get tracked skills and detected habits',
            parameters: {},
            execute: async (_id, _params, ctx) => {
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
        api.registerTool({
            name: 'agentbrain_memories',
            description: 'Query brain memories by topic or keyword',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' },
                    topic: { type: 'string', description: 'Topic filter' },
                },
                required: ['query'],
            },
            execute: async (_id, params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                const memories = await hippocampus.recall(params.query, params.topic || 'general');
                return { memories, stats: hippocampus.getStats() };
            },
        });
        api.registerTool({
            name: 'agentbrain_graph',
            description: 'Inspect AgentBrain memory graph state and optionally recall graph-related memories',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Optional topic or entity to inspect' },
                    topic: { type: 'string', description: 'Optional memory topic filter' },
                },
            },
            execute: async (_id, params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                const query = typeof params?.query === 'string' ? params.query.trim() : '';
                const topic = typeof params?.topic === 'string' && params.topic.trim()
                    ? params.topic.trim()
                    : 'general';
                return {
                    memoryStats: hippocampus.getStats(),
                    temporalState: temporal.getState(),
                    parietalState: parietal.getState(),
                    relatedMemories: query ? await hippocampus.recall(query, topic) : [],
                };
            },
        });
        api.registerTool({
            name: 'agentbrain_reflect',
            description: 'Trigger a manual self-reflection on recent interactions',
            parameters: {
                type: 'object',
                properties: {
                    taskDescription: { type: 'string', description: 'What was the task' },
                    outcome: { type: 'string', enum: ['success', 'partial', 'failure'] },
                },
            },
            execute: async (_id, params, ctx) => {
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
        api.registerTool({
            name: 'agentbrain_template_list',
            description: 'List available brain templates',
            parameters: {},
            execute: async (_id, _params, ctx) => {
                if (!await ensureInitialized(ctx?.pluginConfig)) {
                    return { error: 'AgentBrain not initialized' };
                }
                return { templates: await templateManager.listTemplates() };
            },
        });
        api.registerTool({
            name: 'agentbrain_template_apply',
            description: 'Apply a brain template (resets personality/emotions/skills to template baseline)',
            parameters: {
                type: 'object',
                properties: {
                    templateId: { type: 'string', description: 'Template ID to apply' },
                },
                required: ['templateId'],
            },
            execute: async (_id, params, ctx) => {
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
        api.registerTool({
            name: 'agentbrain_snapshot',
            description: 'Save or list brain state snapshots (backup/restore)',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['save', 'list'], description: 'Action to perform' },
                    label: { type: 'string', description: 'Snapshot label (for save)' },
                },
                required: ['action'],
            },
            execute: async (_id, params, ctx) => {
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
module.exports = _plugin;
//# sourceMappingURL=entry.js.map