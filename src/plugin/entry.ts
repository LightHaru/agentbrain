/**
 * AgentBrain â€” OpenClaw Plugin Entry Point
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

// Inline definePluginEntry â€” matches OpenClaw's expected export shape
function definePluginEntry(def: any) { return def; }
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { Thalamus } from '../core/thalamus.js';
import { Hippocampus } from '../core/hippocampus.js';
import { Amygdala } from '../core/amygdala.js';
import { Neurochemistry } from '../core/neurochemistry.js';
import { AnteriorCingulate } from '../core/cingulate.js';
import { Cerebellum } from '../core/cerebellum.js';
import { BasalGanglia } from '../core/basal-ganglia.js';
import { PrefrontalCortex } from '../core/prefrontal.js';
import { TemporalLobe } from '../core/temporal.js';
import { ParietalLobe } from '../core/parietal.js';
import { Insula } from '../core/insula.js';
import { Metacognition } from '../core/metacognition.js';
import { Hypothalamus } from '../core/hypothalamus.js';
import { Brainstem } from '../core/brainstem.js';
import { CorpusCallosum } from '../core/corpus-callosum.js';
import { GlobalWorkspace } from '../core/global-workspace.js';
import { TheoryOfMind } from '../core/theory-of-mind.js';
import { AffectCore } from '../core/affect-core.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { SqlStorageAdapter } from '../storage/sql-adapter.js';
import { PriorityEnforcer } from '../integration/priority-enforcer.js';
import { ContextInjector, InjectionContext } from '../integration/context-injector.js';
import { TemplateManager } from '../marketplace/template-manager.js';
import { BrainSync } from '../marketplace/brain-sync.js';
import { BrainConfig, defaultConfig } from '../core/config.js';
import { getCurrentCircadianPhase } from '../core/circadian.js';
import { MessageContext } from '../index.js';
import { KnowledgeExtractor } from '../core/knowledge-extractor.js';
import { LessonLearner } from '../core/lesson-learner.js';
import { PersonalityInfluence } from '../core/personality-influence.js';
import { ProactiveEngine } from '../core/proactive-engine.js';
import { FeedbackAnalyzer } from '../core/feedback-analyzer.js';
import { PersonalityAdjuster } from '../core/personality-adjuster.js';
import { MemoryReviewer } from '../core/memory-reviewer.js';
import { OutcomeTracker } from '../core/outcome-tracker.js';
import { ReviewScheduler, createDefaultScheduleConfig } from '../core/review-scheduler.js';
import { ReasoningCortex } from '../core/reasoning-cortex.js';
import { formatWhisper, getInjectionBudget, inferFeedbackOutcome } from '../integration/brain-whisper-format.js';

// --- State ---
let initialized = false;
let thalamus: Thalamus;
let hippocampus: Hippocampus;
let amygdala: Amygdala;
let neurochem: Neurochemistry;
let cingulate: AnteriorCingulate;
let cerebellum: Cerebellum;
let basalGanglia: BasalGanglia;
let prefrontal: PrefrontalCortex;
let temporal: TemporalLobe;
let parietal: ParietalLobe;
let insula: Insula;
let metacognition: Metacognition;
let hypothalamus: Hypothalamus;
let brainstem: Brainstem;
let corpusCallosum: CorpusCallosum;
let globalWorkspace: GlobalWorkspace;
let theoryOfMind: TheoryOfMind;
let affect: AffectCore;
let fileManager: BrainFileManager;
let storage: SqlStorageAdapter;
let enforcer: PriorityEnforcer;
let injector: ContextInjector;
let templateManager: TemplateManager;
let brainSync: BrainSync;
let knowledgeExtractor: KnowledgeExtractor;
let lessonLearner: LessonLearner;
let personalityInfluence: PersonalityInfluence;
let proactiveEngine: ProactiveEngine;
let feedbackAnalyzer: FeedbackAnalyzer;
let personalityAdjuster: PersonalityAdjuster;
let memoryReviewer: MemoryReviewer | null = null;
let outcomeTracker: OutcomeTracker | null = null;
let reviewScheduler: ReviewScheduler | null = null;
let reasoningCortex: ReasoningCortex | null = null;
let interactionCount = 0;
let heartbeatCount = 0;
let lastMessageContext: MessageContext | null = null;
let lastAgentResponse = '';
const runtimeTurns = new Map<string, MessageContext>();
const processedRuntimeOutputs = new Set<string>();
const pendingWhispers = new Map<string, string>();

function runtimeTurnKey(event: any, ctx: any): string {
  return String(event?.runId || ctx?.runId || ctx?.sessionKey || ctx?.sessionId || 'latest');
}

function outputTextFromEvent(event: any): string {
  if (Array.isArray(event?.assistantTexts)) {
    return event.assistantTexts.filter((item: any) => typeof item === 'string' && item.trim()).join('\n');
  }
  if (typeof event?.lastAssistantMessage === 'string') return event.lastAssistantMessage;
  const lastAssistantText = textFromMessage(event?.lastAssistant);
  if (lastAssistantText) return lastAssistantText;
  const messagesText = lastAssistantTextFromMessages(event?.messages);
  if (messagesText) return messagesText;
  if (typeof event?.text === 'string') return event.text;
  if (typeof event?.content === 'string') return event.content;
  return '';
}

function lastAssistantTextFromMessages(messages: any): string {
  if (!Array.isArray(messages)) return '';
  for (let index = messages.length - 1; index >= 0; index--) {
    const item = messages[index]?.message || messages[index];
    if (item?.role !== 'assistant') continue;
    const text = textFromMessage(item);
    if (text && !/\[assistant turn failed/i.test(text)) return text;
  }
  return '';
}

function textFromMessage(message: any): string {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (typeof message.text === 'string') return message.text;
  if (typeof message.content === 'string') return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((part: any) => typeof part === 'string' ? part : part?.text || part?.content || '')
      .filter((text: string) => text.trim())
      .join('\n');
  }
  return '';
}

function persistExtractionResult(result: any): void {
  if (!result || !storage) return;
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

function loadPersistedKnowledge(): void {
  if (!storage || !knowledgeExtractor) return;
  const db = storage.getDatabase();
  const facts = db.getCurrentFacts().map((row: any) => ({
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
  knowledgeExtractor.loadFacts(facts as any);

  const entities = db.getEntities().map((row: any) => ({
    name: row.name,
    type: row.type,
    aliases: safeJsonArray(row.aliases),
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  }));
  knowledgeExtractor.loadEntities(entities as any);
}

function safeJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getRelevantFactsContext(message: string, limit = 5): string {
  if (!storage) return '';
  const db = storage.getDatabase();
  const facts = db.getCurrentFacts();
  if (!facts.length) return '';

  const tokens = new Set(
    message
      .toLowerCase()
      .split(/[^\p{L}\p{N}_-]+/u)
      .map((token: string) => token.trim())
      .filter((token: string) => token.length >= 3)
  );

  const scored = facts.map((fact: any) => {
    const haystack = `${fact.subject} ${fact.relation} ${fact.object}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += token.length >= 5 ? 2 : 1;
    }
    if (/máº­t\s+danh|codename|code\s+name/i.test(`${fact.subject} ${fact.relation}`)) score += 4;
    return { fact, score };
  });

  const selected = scored
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score || String(b.fact.timestamp).localeCompare(String(a.fact.timestamp)))
    .slice(0, limit)
    .map((item: any) => `${item.fact.subject} ${item.fact.relation} ${item.fact.object}`);

  if (!selected.length) return '';
  return `Relevant facts: ${selected.join(' | ')}`;
}

async function processRuntimeCompletion(event: any, ctx: any, config: any): Promise<void> {
  if (config?.enabled === false) return;
  if (!await ensureInitialized(config)) return;

  const key = runtimeTurnKey(event, ctx);
  if (processedRuntimeOutputs.has(key)) return;

  const responseText = outputTextFromEvent(event);
  if (!responseText || responseText.length < 5 || /\[assistant turn failed/i.test(responseText)) return;

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
  if (!msgContext) return;

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
  } catch (err: any) {
    if (config?.logging) {
      console.warn('[AgentBrain] runtime completion processing failed:', err.message);
    }
  }
}

function resolveDir(dir: string): string {
  if (dir.startsWith('~')) return resolve(homedir(), dir.slice(2));
  return resolve(dir);
}

async function ensureInitialized(config: any): Promise<boolean> {
  if (initialized) return true;
  // Fallback: if no config passed, use defaults with standard brainDir
  if (!config) {
    config = { enabled: true, brainDir: '~/.openclaw/data/agentbrain' };
  }
  pendingWhispers.clear();

  try {
    const brainDir = resolveDir(config?.brainDir || '~/.openclaw/data/agentbrain');
    const brainConfig: BrainConfig = {
      ...defaultConfig,
      brainDir,
      maxRecallResults: config?.maxRecallResults ?? defaultConfig.maxRecallResults,
      memoryDecayRate: config?.memoryDecayRate ?? defaultConfig.memoryDecayRate,
      minMemoryConfidence: config?.minMemoryConfidence ?? defaultConfig.minMemoryConfidence,
      enableReflection: config?.enableReflection ?? defaultConfig.enableReflection,
      enableEmotions: config?.enableEmotions ?? defaultConfig.enableEmotions,
      enableSkillTracking: config?.enableSkillTracking ?? defaultConfig.enableSkillTracking,
      maintenanceInterval: config?.maintenanceInterval ?? defaultConfig.maintenanceInterval,
      reasoningWhisper: config?.reasoningWhisper ?? defaultConfig.reasoningWhisper,
      advisorModel: config?.advisorModel ?? defaultConfig.advisorModel,
    };

    // SQL storage (primary)
    storage = new SqlStorageAdapter(brainDir);
    await storage.ensureBrainStructure();

    // Legacy file manager (for template/sync compatibility)
    fileManager = new BrainFileManager(brainDir);

    thalamus = new Thalamus(brainConfig);
    hippocampus = new Hippocampus(brainConfig, storage as any);
    await hippocampus.initialize();

    amygdala = new Amygdala(brainConfig, storage as any);
    await amygdala.initialize();

    // Phase 3: Neurochemistry â€” neuromodulators bias mood with real momentum
    neurochem = new Neurochemistry(brainConfig, storage as any);
    await neurochem.initialize();
    amygdala.attachNeurochemistry(neurochem);

    cingulate = new AnteriorCingulate(brainConfig, storage as any);
    await cingulate.initialize();

    cerebellum = new Cerebellum(brainConfig, storage as any);
    await cerebellum.initialize();

    basalGanglia = new BasalGanglia(brainConfig, storage as any);
    await basalGanglia.initialize();

    prefrontal = new PrefrontalCortex(brainConfig, storage as any);
    await prefrontal.initialize();

    // Phase 1 modules (v0.2.0)
    temporal = new TemporalLobe(brainConfig);
    parietal = new ParietalLobe(brainConfig);
    insula = new Insula(brainConfig);
    metacognition = new Metacognition(brainConfig);
    reasoningCortex = brainConfig.reasoningWhisper?.enabled === false
      ? null
      : new ReasoningCortex(brainConfig, hippocampus, temporal);

    // Phase 2 modules (v0.6.0) â€” now REAL, wired into the pipeline
    hypothalamus = new Hypothalamus('Asia/Ho_Chi_Minh');
    brainstem = new Brainstem();
    corpusCallosum = new CorpusCallosum();
    globalWorkspace = new GlobalWorkspace();
    theoryOfMind = new TheoryOfMind();
    affect = new AffectCore();
    for (const id of ['thalamus', 'hippocampus', 'amygdala', 'neurochemistry', 'cingulate', 'cerebellum', 'basalGanglia', 'prefrontal', 'temporal', 'parietal', 'insula', 'metacognition', 'reasoningCortex', 'hypothalamus', 'brainstem', 'globalWorkspace', 'theoryOfMind', 'affect']) {
      corpusCallosum.register(id);
    }

    enforcer = new PriorityEnforcer();
    injector = new ContextInjector(enforcer);
    templateManager = new TemplateManager(brainDir, fileManager);
    brainSync = new BrainSync(brainDir);

    // Phase 5 modules (v0.3.0)
    knowledgeExtractor = new KnowledgeExtractor();
    loadPersistedKnowledge();
    lessonLearner = new LessonLearner();
    proactiveEngine = new ProactiveEngine();
    feedbackAnalyzer = new FeedbackAnalyzer();
    personalityAdjuster = new PersonalityAdjuster();

    // Load persisted lessons and patterns from SQL
    const lessonsData = await storage.readFile('learning/lessons.md');
    if (lessonsData) {
      try { lessonLearner.loadLessons(JSON.parse(lessonsData)); } catch (e) {}
    }
    const patternsData = await storage.readFile('learning/patterns.md');
    if (patternsData) {
      try { proactiveEngine.loadPatterns(JSON.parse(patternsData)); } catch (e) {}
    }

    // PersonalityInfluence from current traits
    const personality = cingulate.getPersonality();
    personalityInfluence = new PersonalityInfluence({
      warmth: personality.warmth ?? 65,
      directness: personality.directness ?? 75,
      humor: personality.humor ?? 55,
      protectiveness: personality.protectiveness ?? 80,
      curiosity: personality.curiosity ?? 60,
      assertiveness: personality.assertiveness ?? 70,
    });

    initialized = true;
    console.log('[AgentBrain] Plugin v0.4.1 initialized â€” SQL storage + circadian + source routing + brain whisper online');
    return true;
  } catch (err: any) {
    console.warn('[AgentBrain] Initialization failed:', err.message);
    return false;
  }
}

const _plugin = definePluginEntry({
  id: 'lightharu-agentbrain',
  name: 'AgentBrain',
  description: 'Brain-inspired cognitive architecture. Self-evolving personality, memory, emotions, skill learning.',

  register(api: any) {
    api.on(
      'before_agent_run',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig;
        if (config?.enabled === false) return;
        if (!await ensureInitialized(config)) return;

        const text = typeof event?.prompt === 'string' ? event.prompt : '';
        if (!text || text.length < 3) return;

        const msgContext: MessageContext = {
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
            prefrontal.updateWorkingMemory(
              `User: ${text.slice(0, 80)}`,
              'before_agent_run',
              1.0
            );
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
        } catch (err: any) {
          if (config?.logging) {
            console.warn('[AgentBrain] before_agent_run processing failed:', err.message);
          }
        }
      },
      { priority: 20 }
    );

    // â”€â”€â”€ HOOK: before_prompt_build â”€â”€â”€
    // Inject brain context into every agent prompt
    api.on(
      'before_prompt_build',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig;
        if (config?.enabled === false) return;
        if (config?.promptInjection === false) return;

        if (!await ensureInitialized(config)) return;

        try {
          // Use last message context if available
          const message = event.prompt?.slice(0, 200) || '';
          if (!message) return;

          const msgContext: MessageContext = {
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
          let feeling: { label: string; intensity: number; valence: number; arousal: number } | undefined;
          try {
            const affectState = affect.getState();
            feeling = {
              label: affectState.primary.label,
              intensity: affectState.primary.intensity,
              valence: affectState.dimensional.valence,
              arousal: affectState.dimensional.arousal,
            };
          } catch { /* affect state is best-effort */ }

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
              const feedbackOutcome = inferFeedbackOutcome(
                message,
                amygdala.detectSentiment(message)
              );
              if (feedbackOutcome) {
                reasoningCortex.recordOutcome(
                  previousWhisperId,
                  feedbackOutcome.success,
                  feedbackOutcome.userSatisfaction
                );
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
                reasoningWhisper = formatWhisper(whisper);
                pendingWhispers.set(sessionId, whisper.whisperId);
              }
            }
          } catch (error: any) {
            if (config?.logging) {
              console.warn('[AgentBrain] Brain Whisper generation failed:', error.message);
            }
          }

          // Record action for pattern learning
          proactiveEngine.recordAction(classification.topic || 'general', new Date().toISOString());

          // Build injection context
          const injectionContext: InjectionContext = {
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
            maxTokens: getInjectionBudget(reasoningWhisper, config?.maxInjectionTokens ?? 250),
          });

          if (!brainContext || brainContext.length < 20) return;

          if (config?.logging) {
            console.log(`[AgentBrain] Injecting brain context (${brainContext.length} chars)`);
          }

          return { appendContext: brainContext };
        } catch (err: any) {
          console.warn('[AgentBrain] Prompt injection failed:', err.message);
          return;
        }
      },
      { priority: 20 } // after memory-graph (priority 10)
    );

    // â”€â”€â”€ HOOK: message_received â”€â”€â”€
    // Process incoming message: classify, detect emotion, plan
    api.on(
      'message_received',
      async (event: any) => {
        const config = event.context?.pluginConfig;
        if (config?.enabled === false) return;
        if (!await ensureInitialized(config)) return;

        const text = typeof event.content === 'string'
          ? event.content
          : event.content?.text || event.content?.body || '';

        if (!text || text.length < 3) return;

        // Detect heartbeat polls
        if (/heartbeat poll|HEARTBEAT_OK|heartbeat/i.test(text)) {
          heartbeatCount++;
          amygdala.decayToward('neutral', 0.02);
          neurochem.decay(1); // Phase 3: chemicals drift toward baseline (lingering moods)
          hypothalamus.tick(); // Phase 2: drives grow with neglect over time
          brainstem.pump();    // Phase 2: run due autonomic processes
          // AffectCore (v0.8.0): spontaneous emotion from internal state, no input
          try {
            const h = hypothalamus.getState();
            const n = neurochem.getState();
            const drives = h.drives;
            const drivePressure = drives.length ? drives.reduce((s: number, d: any) => s + d.intensity, 0) / drives.length : 0;
            const curiosityDrive = drives.find((d: any) => d.id === 'curiosity')?.intensity ?? 0;
            affect.tick({
              drivePressure,
              curiosityDrive,
              stress: h.homeostasis.stress / 100,
              serotonin: n.serotonin,
              dopamine: n.dopamine,
              circadianAlertness: h.circadian.alertnessLevel,
            });
          } catch { /* spontaneous affect is best-effort */ }
          return; // Don't process heartbeat as regular message
        }

        const msgContext: MessageContext = {
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
            prefrontal.updateWorkingMemory(
              `User: ${text.slice(0, 80)}`,
              'message_received',
              1.0
            );
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
              const patterns: { marker: string; frequency: number }[] = [];
              // Simplified: use current markers as signal (real impl would aggregate from history)
              feedback.markers.forEach(m => {
                const existing = patterns.find(p => p.marker === m);
                if (existing) existing.frequency++;
                else patterns.push({ marker: m, frequency: 1 });
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

          // â”€â”€â”€ Phase 2 modules (v0.6.0) â€” real processing per message â”€â”€â”€
          try {
            const cls = thalamus.classify(msgContext);
            const sentiment = amygdala.detectSentiment(text);
            const emo = amygdala.getState();

            // Hypothalamus: drives respond to topic/sentiment
            hypothalamus.observe(cls.topic || 'general', sentiment);
            if (cls.urgency === 'high' || cls.urgency === 'critical') {
              hypothalamus.registerThreat(cls.urgency as any);
              brainstem.recordThreat(cls.urgency as any, text.slice(0, 60));
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

            // AffectCore (v0.8.0): GENERATE a discrete emotion via appraisal â€”
            // same valence yields different feeling by agency/coping/novelty.
            try {
              // BUGFIX (Phase 2): threat must come from a REAL threat assessment of
              // THIS message, not from the lingering persisted mood. Keying isThreat
              // off emo.mood === 'alarmed' created a self-feeding loop: once alarmed,
              // every later neutral message ('Xong chÆ°a', 'Ok em lÃ m Ä‘i') was re-scored
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
            } catch { /* affect is best-effort */ }
          } catch (e: any) {
            if (config?.logging) console.warn('[AgentBrain] phase2 processing failed:', e.message);
          }

          interactionCount++;
        } catch (err: any) {
          if (config?.logging) {
            console.warn('[AgentBrain] message_received processing failed:', err.message);
          }
        }
      },
      { priority: 20 }
    );

    // â”€â”€â”€ HOOK: message_sent â”€â”€â”€
    // Post-response: consolidate memory, track skills, process reward
    api.on(
      'message_sent',
      async (event: any) => {
        const config = event.context?.pluginConfig;
        if (config?.enabled === false) return;
        if (!await ensureInitialized(config)) return;
        if (!lastMessageContext) return;

        const responseText = typeof event.content === 'string'
          ? event.content
          : event.content?.text || '';

        if (!responseText || responseText.length < 5) return;

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
            console.log(`[AgentBrain] Lesson learned: ${lesson.type} â€” ${lesson.right.slice(0, 60)}`);
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
        } catch (err: any) {
          if (config?.logging) {
            console.warn('[AgentBrain] message_sent processing failed:', err.message);
          }
        }
      },
      { priority: 20 }
    );

    // â”€â”€â”€ HOOK: agent_end â”€â”€â”€
    // Session end: persist all brain state
    api.on(
      'llm_output',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig;
        await processRuntimeCompletion(event, ctx, config);
      },
      { priority: 20 }
    );

    api.on(
      'agent_end',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig;
        if (config?.enabled === false) return;
        await processRuntimeCompletion(event, ctx, config);
        if (!initialized) return;

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
            console.log(`[AgentBrain] Session ended â€” brain state persisted (${interactionCount} interactions, ${lessons.length} lessons, ${facts.length} facts)`);
          }
        } catch (err: any) {
          console.warn('[AgentBrain] agent_end persist failed:', err.message);
        }
      },
      { priority: 20 }
    );

    // NOTE: OpenClaw has no 'heartbeat' typed hook.
    // Heartbeat detection is handled inside message_received via pattern match.

    // â”€â”€â”€ TOOLS â”€â”€â”€

    api.registerTool({
      name: 'agentbrain_status',
      description: 'Get AgentBrain status: modules, stats, emotional state, personality',
      parameters: {},
      execute: async (_id: string, _params: any, ctx: any) => {
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
            // Phase 3 module (v0.5.0) â€” REAL, wired into amygdala
            neurochemistry: true,
            // Phase 2 modules (v0.4.1) â€” declared so gateway won't override
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
          // Phase 2 modules (v0.6.0) â€” REAL state from wired modules
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
      execute: async (_id: string, _params: any, ctx: any) => {
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
      execute: async (_id: string, params: any, ctx: any) => {
        if (!await ensureInitialized(ctx?.pluginConfig)) {
          return { error: 'AgentBrain not initialized' };
        }
        const result: any = { emotionalState: amygdala.getState() };
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
      execute: async (_id: string, _params: any, ctx: any) => {
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
      execute: async (_id: string, params: any, ctx: any) => {
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
      execute: async (_id: string, params: any, ctx: any) => {
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
      execute: async (_id: string, params: any, ctx: any) => {
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
      execute: async (_id: string, _params: any, ctx: any) => {
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
      execute: async (_id: string, params: any, ctx: any) => {
        if (!await ensureInitialized(ctx?.pluginConfig)) {
          return { error: 'AgentBrain not initialized' };
        }
        const template = await templateManager.getTemplate(params.templateId);
        if (!template) return { error: `Template not found: ${params.templateId}` };
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
      execute: async (_id: string, params: any, ctx: any) => {
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
   
      }
    });
    // Memory Review Tool
    api.registerTool({
      name: 'agentbrain_review_memories',
      description: 'Trigger a memory review cycle to analyze patterns, detect contradictions, and generate insights',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['recent', 'all', 'topic-specific'],
            description: 'Scope of memories to review',
          },
          topic: {
            type: 'string',
            description: 'Topic to focus on (for topic-specific reviews)',
          },
        },
      },
      execute: async (_id: string, params: any, ctx: any) => {
        if (!await ensureInitialized(ctx?.pluginConfig)) {
          return { error: 'AgentBrain not initialized' };
        }
        
        const scope = {
          type: params.scope || 'recent',
          trigger: 'manual' as const,
          topic: params.topic,
        };
        
        if (!memoryReviewer) return { error: 'Learning system not initialized' };
        const cycle = await (memoryReviewer as MemoryReviewer).runReviewCycle(scope);
        
        return {
          reviewId: cycle.id,
          memoriesReviewed: cycle.memoriesReviewed,
          findingsCount: cycle.findings.length,
          actionsCount: cycle.actions.length,
          executionTimeMs: cycle.executionTimeMs,
          findings: cycle.findings.slice(0, 10),
          insights: cycle.findings.filter((f: any) => f.type === 'insight').length,
        };
      },
    });

    // Learning Statistics Tool
    api.registerTool({
      name: 'agentbrain_learning_stats',
      description: 'Get statistics about learning performance, strategy effectiveness, and improvement trends',
      parameters: {},
      execute: async (_id: string, _params: any, ctx: any) => {
        if (!await ensureInitialized(ctx?.pluginConfig)) {
          return { error: 'AgentBrain not initialized' };
        }
        
        if (!outcomeTracker || !memoryReviewer) return { error: 'Learning system not initialized' };
        const stats = (outcomeTracker as OutcomeTracker).getStatistics();
        const reviewStats = (memoryReviewer as MemoryReviewer).getStatistics();
        const schedulerStatus = reviewScheduler ? (reviewScheduler as ReviewScheduler).getStatus() : null;
        
        return {
          learning: {
            totalTurns: stats.totalTurns,
            successRate: `${(stats.successRate * 100).toFixed(1)}%`,
            avgReward: stats.avgReward.toFixed(2),
            trend: stats.recentTrend,
            avgResponseTime: `${stats.avgResponseTime.toFixed(0)}ms`,
            confidenceAccuracy: `${(stats.avgConfidenceAccuracy * 100).toFixed(1)}%`,
          },
          strategies: stats.strategyPerformance.map((s: any) => ({
            name: s.strategyName,
            successRate: `${(s.successRate * 100).toFixed(1)}%`,
            timesUsed: s.timesUsed,
            avgReward: s.avgReward.toFixed(2),
          })),
          memoryReview: {
            totalReviews: reviewStats.totalReviews,
            totalFindings: reviewStats.totalFindings,
            totalInsights: reviewStats.totalInsights,
            lastReview: reviewStats.lastReviewTime,
            avgReviewTime: `${reviewStats.avgReviewTime.toFixed(0)}ms`,
          },
          scheduler: schedulerStatus,
          metaLearnings: stats.metaLearnings.slice(0, 5),
        };
      },
    });

    // Insights Tool
    api.registerTool({
      name: 'agentbrain_insights',
      description: 'Get insights generated from memory analysis and learning patterns',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of insights to retrieve',
            default: 20,
          },
        },
      },
      execute: async (_id: string, params: any, ctx: any) => {
        if (!await ensureInitialized(ctx?.pluginConfig)) {
          return { error: 'AgentBrain not initialized' };
        }
        
        if (!memoryReviewer || !outcomeTracker) return { error: 'Learning system not initialized' };
        const limit = params.limit || 20;
        const insights = (memoryReviewer as MemoryReviewer).getInsights(limit);
        const metaLearnings = (outcomeTracker as OutcomeTracker).getMetaLearnings();
        
        return {
          memoryInsights: insights.map((i: any) => ({
            id: i.id,
            title: i.title,
            content: i.content,
            type: i.type,
            confidence: `${(i.confidence * 100).toFixed(0)}%`,
            timestamp: i.timestamp,
            sourceMemories: i.sourceMemories.length,
          })),
          metaLearnings: metaLearnings.map((ml: any) => ({
            id: ml.id,
            title: ml.title,
            description: ml.description,
            type: ml.type,
            confidence: `${(ml.confidence * 100).toFixed(0)}%`,
            applied: ml.applied,
            timestamp: ml.timestamp,
          })),
        };
      },
    });
  },
});

// OpenClaw plugin loader expects module.exports directly
export = _plugin;









