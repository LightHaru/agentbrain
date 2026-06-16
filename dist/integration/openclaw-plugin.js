"use strict";
/**
 * OpenClaw Plugin Entry Point
 *
 * This is the main integration layer that connects AgentBrain
 * to OpenClaw's plugin lifecycle. It registers hooks and manages
 * the brain's lifecycle within the gateway.
 *
 * Installation: `openclaw plugins install ./agentbrain`
 *
 * Hook points:
 * - onSessionStart: Load brain state for session
 * - onPreResponse: Enrich prompt with brain context
 * - onPostResponse: Consolidate memory, update emotions, track skills
 * - onHeartbeat: Periodic maintenance (decay, reflection, persist)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenClawPlugin = createOpenClawPlugin;
const index_js_1 = require("../index.js");
const config_js_1 = require("../core/config.js");
const amygdala_js_1 = require("../core/amygdala.js");
const cingulate_js_1 = require("../core/cingulate.js");
const cerebellum_js_1 = require("../core/cerebellum.js");
const basal_ganglia_js_1 = require("../core/basal-ganglia.js");
const prefrontal_js_1 = require("../core/prefrontal.js");
const priority_enforcer_js_1 = require("./priority-enforcer.js");
const context_injector_js_1 = require("./context-injector.js");
const md_writer_js_1 = require("../storage/md-writer.js");
const sql_adapter_js_1 = require("../storage/sql-adapter.js");
const knowledge_extractor_js_1 = require("../core/knowledge-extractor.js");
const lesson_learner_js_1 = require("../core/lesson-learner.js");
const personality_influence_js_1 = require("../core/personality-influence.js");
const proactive_engine_js_1 = require("../core/proactive-engine.js");
const reasoning_cortex_js_1 = require("../core/reasoning-cortex.js");
const brain_whisper_format_js_1 = require("./brain-whisper-format.js");
/**
 * Create the OpenClaw plugin instance
 */
function createOpenClawPlugin(userConfig) {
    const config = { ...config_js_1.defaultConfig, ...userConfig };
    const fileManager = new md_writer_js_1.BrainFileManager(config.brainDir);
    // Use SQL storage adapter (drop-in replacement for fileManager)
    const sqlAdapter = new sql_adapter_js_1.SqlStorageAdapter(config.brainDir);
    // Use sqlAdapter as the primary storage, fileManager as fallback for legacy
    const storage = sqlAdapter; // implements same interface
    // Core modules (from Phase 1-3)
    let brain;
    let amygdala;
    let cingulate;
    let cerebellum;
    let basalGanglia;
    let prefrontal;
    // Phase 4 modules
    const enforcer = new priority_enforcer_js_1.PriorityEnforcer();
    const injector = new context_injector_js_1.ContextInjector(enforcer);
    // Phase 5 modules (new)
    const knowledgeExtractor = new knowledge_extractor_js_1.KnowledgeExtractor();
    const lessonLearner = new lesson_learner_js_1.LessonLearner();
    let personalityInfluence;
    const proactiveEngine = new proactive_engine_js_1.ProactiveEngine();
    let reasoningCortex = null;
    let initialized = false;
    let interactionCount = 0;
    let startTime = Date.now();
    let lastAgentResponse = '';
    const pendingWhispers = new Map();
    const manifest = {
        name: 'agentbrain',
        version: '0.2.0',
        description: 'Brain-inspired cognitive architecture — self-evolving personality, memory, emotions, and learning',
        hooks: ['onSessionStart', 'onPreResponse', 'onPostResponse', 'onHeartbeat'],
        config: {
            brainDir: config.brainDir,
            maxRecallResults: config.maxRecallResults,
            memoryDecayRate: config.memoryDecayRate,
            enableReflection: config.enableReflection,
            enableEmotions: config.enableEmotions,
            enableSkillTracking: config.enableSkillTracking,
            reasoningWhisper: config.reasoningWhisper,
            advisorModel: config.advisorModel,
        },
    };
    const plugin = {
        manifest,
        async initialize(overrideConfig) {
            const finalConfig = { ...config, ...overrideConfig };
            pendingWhispers.clear();
            // Initialize file structure
            await storage.ensureBrainStructure();
            // Initialize core brain (Thalamus + Hippocampus)
            brain = (0, index_js_1.createAgentBrain)(finalConfig);
            await brain.initialize();
            // Initialize Phase 2 modules
            amygdala = new amygdala_js_1.Amygdala(finalConfig, storage);
            await amygdala.initialize();
            cingulate = new cingulate_js_1.AnteriorCingulate(finalConfig, storage);
            await cingulate.initialize();
            // Initialize Phase 3 modules
            cerebellum = new cerebellum_js_1.Cerebellum(finalConfig, storage);
            await cerebellum.initialize();
            basalGanglia = new basal_ganglia_js_1.BasalGanglia(finalConfig, storage);
            await basalGanglia.initialize();
            // Initialize Phase 4 module
            prefrontal = new prefrontal_js_1.PrefrontalCortex(finalConfig, storage);
            await prefrontal.initialize();
            // Initialize Phase 5 modules
            const personality = cingulate.getPersonality();
            personalityInfluence = new personality_influence_js_1.PersonalityInfluence({
                warmth: personality.warmth ?? 65,
                directness: personality.directness ?? 75,
                humor: personality.humor ?? 55,
                protectiveness: personality.protectiveness ?? 80,
                curiosity: personality.curiosity ?? 60,
                assertiveness: personality.assertiveness ?? 70,
            });
            reasoningCortex = finalConfig.reasoningWhisper?.enabled === false
                ? null
                : new reasoning_cortex_js_1.ReasoningCortex(finalConfig, brain.hippocampus, brain.temporal);
            // Load persisted lessons and patterns
            const lessonsData = await storage.readFile('learning/lessons.md');
            if (lessonsData) {
                try {
                    const parsed = JSON.parse(lessonsData);
                    lessonLearner.loadLessons(parsed);
                }
                catch (e) { /* ignore parse errors */ }
            }
            const patternsData = await storage.readFile('learning/patterns.md');
            if (patternsData) {
                try {
                    const parsed = JSON.parse(patternsData);
                    proactiveEngine.loadPatterns(parsed);
                }
                catch (e) { /* ignore parse errors */ }
            }
            initialized = true;
            startTime = Date.now();
            console.log('[AgentBrain:OpenClaw] All modules initialized — brain is online');
        },
        async onSessionStart(context) {
            if (!initialized)
                return;
            console.log(`[AgentBrain:OpenClaw] Session ${context.sessionId} — loading brain state`);
            // Brain state is already loaded during initialize
            // Future: per-session brain state isolation
        },
        async onPreResponse(context) {
            if (!initialized)
                return '';
            const msgContext = {
                message: context.message,
                senderId: context.senderId,
                senderName: context.senderName,
                timestamp: context.timestamp,
                sessionId: context.sessionId,
                metadata: context.metadata,
            };
            // Step 1: Thalamus classifies
            const classification = brain.thalamus.classify(msgContext);
            // Step 2: Temporal comprehends language & extracts semantics
            const semanticRep = brain.temporal.comprehend(context.message, { role: 'user', timestamp: Date.now() });
            // Step 3: Parietal integrates sensory input
            brain.parietal.integrateSensoryInput([{
                    modality: 'text',
                    data: context.message,
                    timestamp: Date.now(),
                    importance: classification.urgency === 'critical' ? 1.0 : 0.5,
                }]);
            // Step 4: Insula models user state
            brain.insula.modelUserState({
                message: context.message,
                recentInteractions: interactionCount,
                userSuccessRate: 0.8,
                timeOfDay: new Date().getHours(),
            });
            // Step 5: Hippocampus recalls (use semantic concepts for better recall)
            const recallQuery = semanticRep.concepts.length > 0
                ? semanticRep.concepts.join(' ')
                : context.message;
            const relevantMemories = await brain.hippocampus.recall(recallQuery, classification.topic);
            // Step 6: Amygdala processes emotion + threat
            const emotionalResult = amygdala.process(msgContext);
            // Step 7: Prefrontal plans
            const plan = prefrontal.plan(classification, context.message);
            // Step 8: Cerebellum detects skill
            const detectedSkill = cerebellum.detectSkill(context.message);
            if (detectedSkill) {
                cerebellum.detectPattern(detectedSkill, context.timestamp);
            }
            // Step 6: Update working memory with current context
            prefrontal.updateWorkingMemory(`User: ${context.message.slice(0, 80)}`, 'current_turn', 1.0);
            // Step 9: Find relevant lessons (from past corrections)
            const relevantLessons = lessonLearner.findRelevantLessons(context.message);
            const lessonsContext = lessonLearner.formatForInjection(relevantLessons);
            // Step 10: Generate personality-driven style directives
            const relationship = amygdala.getRelationship(context.senderId);
            const styleDirectives = personalityInfluence.generateDirectives({
                timeOfDay: new Date().getHours(),
                mood: emotionalResult.updatedState.mood,
                valence: emotionalResult.updatedState.valence,
                arousal: emotionalResult.updatedState.arousal,
                recentTopics: [classification.topic],
                interactionCount,
                trustLevel: relationship?.trustLevel || 10,
                lastUserSentiment: amygdala.detectSentiment(context.message),
            });
            // Step 11: Check proactive suggestions
            const suggestions = proactiveEngine.checkTriggers({
                currentHour: new Date().getHours(),
                lastMessage: context.message,
            });
            const suggestionsContext = suggestions.length > 0
                ? `Proactive: ${suggestions.map(s => s.message).join(' | ')}`
                : '';
            // Step 12: Generate Brain Whisper
            let reasoningWhisper = '';
            try {
                const previousWhisperId = pendingWhispers.get(context.sessionId);
                if (previousWhisperId && reasoningCortex) {
                    const feedbackOutcome = (0, brain_whisper_format_js_1.inferFeedbackOutcome)(context.message, amygdala.detectSentiment(context.message));
                    if (feedbackOutcome) {
                        reasoningCortex.recordOutcome(previousWhisperId, feedbackOutcome.success, feedbackOutcome.userSatisfaction);
                    }
                    pendingWhispers.delete(context.sessionId);
                }
                if (reasoningCortex) {
                    const whisper = await reasoningCortex.generateWhisper({
                        userMessage: context.message,
                        conversationHistory: undefined,
                        timeoutSeconds: context.timeoutSeconds,
                        contextTokens: context.contextTokens,
                        elapsedSeconds: context.elapsedSeconds,
                    });
                    if (whisper.tokenBudget > 0) {
                        reasoningWhisper = (0, brain_whisper_format_js_1.formatWhisper)(whisper);
                        pendingWhispers.set(context.sessionId, whisper.whisperId);
                    }
                }
            }
            catch (error) {
                console.error('[AgentBrain] ReasoningCortex error:', error);
            }
            // Step 13: Record action for pattern learning
            proactiveEngine.recordAction(classification.topic || 'general', context.timestamp);
            // Step 14: Build injection context
            const injectionContext = {
                classification,
                emotionalState: emotionalResult.updatedState,
                personality: cingulate.getPersonality(),
                relationship: relationship || null,
                relevantMemories,
                topSkills: cerebellum.getTopSkills(3),
                activeHabits: cerebellum.getActiveHabits(),
                workingMemory: prefrontal.getWorkingMemory(),
                rewardTrend: basalGanglia.getRecentTrend(),
                // New fields
                lessonsContext,
                styleDirectives,
                suggestionsContext,
                reasoningWhisper,
            };
            // Step 15: Generate injectable context (with priority enforcement)
            const brainContext = injector.inject(injectionContext, {
                maxTokens: (0, brain_whisper_format_js_1.getInjectionBudget)(reasoningWhisper),
            });
            interactionCount++;
            return brainContext;
        },
        async onPostResponse(context, response) {
            if (!initialized)
                return;
            const msgContext = {
                message: context.message,
                senderId: context.senderId,
                senderName: context.senderName,
                timestamp: context.timestamp,
                sessionId: context.sessionId,
            };
            // Step 1: Hippocampus consolidates memory
            await brain.hippocampus.consolidate({
                message: context.message,
                response,
                senderId: context.senderId,
                senderName: context.senderName,
                timestamp: context.timestamp,
            });
            // Step 2: Knowledge extraction (structured facts)
            knowledgeExtractor.extract(context.message, response, {
                senderName: context.senderName,
                timestamp: context.timestamp,
                previousFacts: knowledgeExtractor.getActiveFacts(),
            });
            // Step 3: Lesson learning (detect corrections)
            const lesson = lessonLearner.analyze({
                userMessage: context.message,
                agentResponse: response,
                previousAgentResponse: lastAgentResponse,
                senderName: context.senderName,
                timestamp: context.timestamp,
            });
            if (lesson) {
                console.log(`[AgentBrain] Lesson learned: ${lesson.type} — ${lesson.right.slice(0, 60)}`);
            }
            // Step 4: Detect user sentiment for reward signal
            const sentiment = amygdala.detectSentiment(context.message);
            // Step 5: Cerebellum records skill usage
            const skill = cerebellum.detectSkill(context.message);
            if (skill) {
                const success = sentiment >= 0;
                cerebellum.recordSkillUsage(skill, success);
            }
            // Step 6: Basal Ganglia processes reward
            basalGanglia.processReward({
                timestamp: context.timestamp,
                taskType: skill || 'general',
                signal: sentiment,
                source: 'implicit',
                context: context.message.slice(0, 50),
            });
            // Step 7: Anterior Cingulate reflects (only on significant tasks)
            const classification = brain.thalamus.classify(msgContext);
            if (classification.requiresAction || Math.abs(sentiment) > 0.3) {
                cingulate.reflect({
                    taskDescription: context.message.slice(0, 100),
                    userMessage: context.message,
                    agentResponse: response,
                    userSentiment: sentiment,
                    emotionalState: amygdala.getState(),
                });
            }
            // Step 8: Prefrontal completes plan
            prefrontal.completePlan();
            // Step 9: Update personality influence with latest traits
            personalityInfluence.updateTraits(cingulate.getPersonality());
            // Track last response for lesson learning context
            lastAgentResponse = response;
        },
        async onHeartbeat() {
            if (!initialized)
                return;
            // Memory maintenance (decay + prune)
            await brain.onHeartbeat();
            // Persist all module states periodically
            await amygdala.persist();
            await cingulate.persist();
            await cerebellum.persist();
            await basalGanglia.persist();
            await prefrontal.persist();
            // Persist lessons and patterns
            const lessons = lessonLearner.getLessons();
            if (lessons.length > 0) {
                await storage.writeFile('learning/lessons.md', JSON.stringify(lessons, null, 2));
            }
            const patterns = proactiveEngine.getPatterns();
            if (patterns.length > 0) {
                await storage.writeFile('learning/patterns.md', JSON.stringify(patterns, null, 2));
            }
            // Persist knowledge facts
            const facts = knowledgeExtractor.getActiveFacts();
            if (facts.length > 0) {
                await storage.writeFile('knowledge/facts.md', JSON.stringify(facts, null, 2));
            }
            console.log(`[AgentBrain:OpenClaw] Heartbeat — ${interactionCount} interactions, ${lessons.length} lessons, ${facts.length} facts`);
        },
        async shutdown() {
            if (!initialized)
                return;
            // Final persist before shutdown
            await amygdala.persist();
            await cingulate.persist();
            await cerebellum.persist();
            await basalGanglia.persist();
            await prefrontal.persist();
            // Persist new modules
            await storage.writeFile('learning/lessons.md', JSON.stringify(lessonLearner.getLessons(), null, 2));
            await storage.writeFile('learning/patterns.md', JSON.stringify(proactiveEngine.getPatterns(), null, 2));
            await storage.writeFile('knowledge/facts.md', JSON.stringify(knowledgeExtractor.getActiveFacts(), null, 2));
            await storage.writeFile('knowledge/entities.md', JSON.stringify(knowledgeExtractor.getEntities(), null, 2));
            // Shutdown hippocampus (closes vector DB)
            await brain.hippocampus.shutdown();
            if (typeof storage.close === 'function') {
                storage.close();
            }
            pendingWhispers.clear();
            initialized = false;
            console.log('[AgentBrain:OpenClaw] Shutdown complete — brain state persisted');
        },
        getStatus() {
            return {
                initialized,
                modules: {
                    thalamus: initialized,
                    hippocampus: initialized,
                    amygdala: initialized,
                    cingulate: initialized,
                    cerebellum: initialized,
                    basalGanglia: initialized,
                    prefrontal: initialized,
                },
                stats: {
                    memories: initialized ? brain.hippocampus.getStats().total : 0,
                    reflections: initialized ? cingulate.getPerformanceStats().totalTasks : 0,
                    skills: initialized ? cerebellum.getAllSkills().length : 0,
                    habits: initialized ? cerebellum.getActiveHabits().length : 0,
                    decisions: 0, // TODO: expose from prefrontal
                    interactions: interactionCount,
                },
                emotionalState: initialized
                    ? amygdala.getState()
                    : { mood: 'offline', valence: 0, arousal: 0 },
                uptime: Date.now() - startTime,
            };
        },
    };
    return plugin;
}
/**
 * Default export for OpenClaw plugin loader
 */
exports.default = createOpenClawPlugin;
//# sourceMappingURL=openclaw-plugin.js.map