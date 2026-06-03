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
let interactionCount = 0;
let heartbeatCount = 0;
let lastMessageContext: MessageContext | null = null;
let lastAgentResponse = '';
const latestMessageBySession = new Map<string, MessageContext>();
const latestMessageByRun = new Map<string, MessageContext>();
const MESSAGE_CACHE_LIMIT = 100;
const DEFAULT_PROMPT_INJECTION_TOKENS = 450;
const MIN_PROMPT_INJECTION_TOKENS = 300;

function resolveDir(dir: string): string {
  if (dir.startsWith('~')) return resolve(homedir(), dir.slice(2));
  return resolve(dir);
}

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function readText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value) return '';

  if (Array.isArray(value)) {
    return value.map(readText).filter(Boolean).join('\n');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['text', 'body', 'content', 'message', 'prompt', 'input', 'bodyForAgent', 'transcript']) {
      const text = readText(record[key]);
      if (text) return text;
    }
    for (const key of ['parts', 'blocks', 'messages']) {
      const text = readText(record[key]);
      if (text) return text;
    }
  }

  return '';
}

function extractEventText(event: any): string {
  return compactText(readText(event?.content)
    || readText(event?.bodyForAgent)
    || readText(event?.body)
    || readText(event?.message)
    || readText(event?.input)
    || readText(event?.transcript));
}

function looksLikeSystemPrompt(text: string): boolean {
  const head = text.slice(0, 800).toLowerCase();
  return text.length > 800 && (
    head.includes('knowledge cutoff')
    || head.includes('developer instructions')
    || head.includes('you are codex')
    || head.includes('system prompt')
    || head.includes('current date:')
  );
}

function extractPromptText(event: any): string {
  const prompt = compactText(readText(event?.prompt));
  if (!prompt || looksLikeSystemPrompt(prompt)) return '';
  return prompt;
}

function extractLatestUserMessage(messages: unknown): string {
  if (!Array.isArray(messages)) return '';

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i] as Record<string, unknown> | undefined;
    if (!msg || typeof msg !== 'object') continue;
    const role = String(msg.role || msg.type || (msg.author as any)?.role || '').toLowerCase();
    if (role && !/user|human|owner/.test(role)) continue;
    const text = compactText(readText(msg));
    if (text && !looksLikeSystemPrompt(text)) return text;
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const text = compactText(readText(messages[i]));
    if (text && !looksLikeSystemPrompt(text)) return text;
  }

  return '';
}

function resolveSessionKey(event: any, ctx: any, fallback = ''): string {
  const value = ctx?.sessionKey
    ?? event?.sessionKey
    ?? ctx?.sessionId
    ?? event?.sessionId
    ?? event?.context?.sessionKey
    ?? event?.context?.sessionId
    ?? event?.conversationId
    ?? event?.threadId
    ?? fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
}

function resolveRunId(event: any, ctx: any): string {
  const value = ctx?.runId ?? event?.runId ?? event?.context?.runId;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

function rememberCachedMessage(map: Map<string, MessageContext>, key: string, value: MessageContext): void {
  if (!key) return;
  map.set(key, value);
  while (map.size > MESSAGE_CACHE_LIMIT) {
    const oldest = map.keys().next().value;
    if (!oldest) break;
    map.delete(oldest);
  }
}

function rememberMessageContext(messageContext: MessageContext, event: any, ctx: any): void {
  const sessionKey = resolveSessionKey(event, ctx, messageContext.sessionId);
  const runId = resolveRunId(event, ctx);
  rememberCachedMessage(latestMessageBySession, sessionKey, messageContext);
  rememberCachedMessage(latestMessageByRun, runId, messageContext);
  lastMessageContext = messageContext;
}

function getCachedMessageContext(event: any, ctx: any, allowGlobalFallback = false): MessageContext | null {
  const runId = resolveRunId(event, ctx);
  if (runId && latestMessageByRun.has(runId)) return latestMessageByRun.get(runId)!;

  const sessionKey = resolveSessionKey(event, ctx);
  if (sessionKey && latestMessageBySession.has(sessionKey)) return latestMessageBySession.get(sessionKey)!;

  if (allowGlobalFallback && !sessionKey) return lastMessageContext;
  return null;
}

function resolvePromptMessageContext(event: any, ctx: any): MessageContext | null {
  const cachedByRun = resolveRunId(event, ctx)
    ? latestMessageByRun.get(resolveRunId(event, ctx))
    : null;
  const cachedBySession = resolveSessionKey(event, ctx)
    ? latestMessageBySession.get(resolveSessionKey(event, ctx))
    : null;
  const cached = cachedByRun || cachedBySession || (!resolveSessionKey(event, ctx) ? lastMessageContext : null);
  const message = compactText(cachedByRun?.message
    || extractPromptText(event)
    || cached?.message
    || extractLatestUserMessage(event?.messages));

  if (!message || message.length < 3) return null;

  return {
    message,
    senderId: cached?.senderId || event?.senderId || 'unknown',
    senderName: cached?.senderName || event?.senderName || event?.from || 'User',
    timestamp: cached?.timestamp || new Date().toISOString(),
    sessionId: resolveSessionKey(event, ctx, cached?.sessionId || ''),
    metadata: cached?.metadata || event?.metadata,
  };
}

function resolveInjectionTokenBudget(config: any): number {
  const configured = Number(config?.maxInjectionTokens);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_PROMPT_INJECTION_TOKENS;
  return Math.max(MIN_PROMPT_INJECTION_TOKENS, Math.min(800, Math.round(configured)));
}

function resolveGraphRecallDepth(config: any): number {
  const configured = Number(config?.graphRecallDepth);
  if (!Number.isFinite(configured)) return 2;
  return Math.max(0, Math.min(3, Math.round(configured)));
}

async function ensureInitialized(config: any): Promise<boolean> {
  if (initialized) return true;
  // Fallback: if no config passed, use defaults with standard brainDir
  if (!config) {
    config = { enabled: true, brainDir: '~/.openclaw/data/agentbrain' };
  }

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

    // Phase 3: Neurochemistry — neuromodulators bias mood with real momentum
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

    // Phase 2 modules (v0.6.0) — now REAL, wired into the pipeline
    hypothalamus = new Hypothalamus('Asia/Ho_Chi_Minh');
    brainstem = new Brainstem();
    corpusCallosum = new CorpusCallosum();
    globalWorkspace = new GlobalWorkspace();
    theoryOfMind = new TheoryOfMind();
    affect = new AffectCore();
    for (const id of ['thalamus', 'hippocampus', 'amygdala', 'neurochemistry', 'cingulate', 'cerebellum', 'basalGanglia', 'prefrontal', 'temporal', 'parietal', 'insula', 'metacognition', 'hypothalamus', 'brainstem', 'globalWorkspace', 'theoryOfMind', 'affect']) {
      corpusCallosum.register(id);
    }

    enforcer = new PriorityEnforcer();
    injector = new ContextInjector(enforcer);
    templateManager = new TemplateManager(brainDir, fileManager);
    brainSync = new BrainSync(brainDir);

    // Phase 5 modules (v0.3.0)
    knowledgeExtractor = new KnowledgeExtractor();
    lessonLearner = new LessonLearner();
    proactiveEngine = new ProactiveEngine();

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
    console.log('[AgentBrain] Plugin v0.4.1 initialized — SQL storage + circadian + source routing online');
    return true;
  } catch (err: any) {
    console.warn('[AgentBrain] Initialization failed:', err.message);
    return false;
  }
}

const _plugin = definePluginEntry({
  id: 'agentbrain',
  name: 'AgentBrain',
  description: 'Brain-inspired cognitive architecture. Self-evolving personality, memory, emotions, skill learning.',

  register(api: any) {
    // ─── HOOK: before_prompt_build ───
    // Inject brain context into every agent prompt
    api.on(
      'before_prompt_build',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig;
        if (config?.enabled === false) return;
        if (config?.promptInjection === false) return;

        if (!await ensureInitialized(config)) return;

        try {
          const msgContext = resolvePromptMessageContext(event, ctx);
          if (!msgContext) return;
          const message = msgContext.message;

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
          const graphRecallDepth = resolveGraphRecallDepth(config);
          const relevantMemories = await hippocampus.recall(recallQuery, {
            topic: classification.topic,
            limit: config?.maxRecallResults ?? defaultConfig.maxRecallResults,
            useVector: false,
            relationshipDepth: graphRecallDepth,
          });
          const graphRecall = graphRecallDepth > 0
            ? hippocampus.recallGraph(recallQuery, graphRecallDepth)
            : null;
          const graphContext = [
            'Current graph memory: AgentBrain uses ~/.openclaw/data/agentbrain/brain.db for entity and relationship recall.',
            'Standalone memory-graph plugin and database are retired; current recall should prefer AgentBrain brain.db.',
            ...(graphRecall?.context || []),
          ];

          // Amygdala emotion state
          const emotionalState = amygdala.getState();
          const relationship = amygdala.getRelationship(msgContext.senderId);

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

          // Record action for pattern learning
          proactiveEngine.recordAction(classification.topic || 'general', new Date().toISOString());

          // Build injection context
          const injectionContext: InjectionContext = {
            currentMessage: message,
            classification,
            emotionalState,
            personality: cingulate.getPersonality(),
            relationship: relationship || null,
            relevantMemories,
            graphContext,
            topSkills: cerebellum.getTopSkills(3),
            activeHabits: cerebellum.getActiveHabits(),
            workingMemory: prefrontal.getWorkingMemory(),
            rewardTrend: basalGanglia.getRecentTrend(),
            lessonsContext,
            styleDirectives,
            suggestionsContext,
          };

          // Generate injectable context
          const brainContext = injector.inject(injectionContext, {
            maxTokens: resolveInjectionTokenBudget(config),
          });

          if (!brainContext || brainContext.length < 20) return;

          if (config?.logging) {
            console.log(`[AgentBrain] Injecting brain context (${brainContext.length} chars)`);
          }

          return { prependSystemContext: brainContext };
        } catch (err: any) {
          console.warn('[AgentBrain] Prompt injection failed:', err.message);
          return;
        }
      },
      { priority: 5 }
    );

    // ─── HOOK: message_received ───
    // Process incoming message: classify, detect emotion, plan
    api.on(
      'message_received',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig ?? event.context?.pluginConfig;
        if (config?.enabled === false) return;
        if (!await ensureInitialized(config)) return;

        const text = extractEventText(event);

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
          senderName: event.senderName || event.from || 'User',
          timestamp: new Date().toISOString(),
          sessionId: resolveSessionKey(event, ctx),
          metadata: event.metadata,
        };

        // Store for before_prompt_build and post-response consolidation.
        rememberMessageContext(msgContext, event, ctx);

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

            // AffectCore (v0.8.0): GENERATE a discrete emotion via appraisal —
            // same valence yields different feeling by agency/coping/novelty.
            try {
              const isThreat = cls.urgency === 'high' || cls.urgency === 'critical' || emo.mood === 'alarmed';
              const sev = cls.urgency === 'critical' ? 1 : cls.urgency === 'high' ? 0.75 : 0.4;
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

    // ─── HOOK: message_sent ───
    // Post-response: consolidate memory, track skills, process reward
    api.on(
      'message_sent',
      async (event: any, ctx: any) => {
        const config = ctx?.pluginConfig ?? event.context?.pluginConfig;
        if (config?.enabled === false) return;
        if (!await ensureInitialized(config)) return;
        const turnMessageContext = getCachedMessageContext(event, ctx, true);
        if (!turnMessageContext) return;

        const responseText = typeof event.content === 'string'
          ? event.content
          : event.content?.text || '';

        if (!responseText || responseText.length < 5) return;

        try {
          // Hippocampus: consolidate memory
          await hippocampus.consolidate({
            message: turnMessageContext.message,
            response: responseText,
            senderId: turnMessageContext.senderId,
            senderName: turnMessageContext.senderName,
            timestamp: turnMessageContext.timestamp,
          });

          // Knowledge extraction (structured facts)
          knowledgeExtractor.extract(turnMessageContext.message, responseText, {
            senderName: turnMessageContext.senderName,
            timestamp: turnMessageContext.timestamp,
            previousFacts: knowledgeExtractor.getActiveFacts(),
          });

          // Lesson learning (detect corrections)
          const lesson = lessonLearner.analyze({
            userMessage: turnMessageContext.message,
            agentResponse: responseText,
            previousAgentResponse: lastAgentResponse,
            senderName: turnMessageContext.senderName,
            timestamp: turnMessageContext.timestamp,
          });
          if (lesson && config?.logging) {
            console.log(`[AgentBrain] Lesson learned: ${lesson.type} — ${lesson.right.slice(0, 60)}`);
          }

          // Detect sentiment for reward
          const sentiment = amygdala.detectSentiment(turnMessageContext.message);
          
          // Check if response contains tool error indicators
          const toolErrorPatterns = /timeout|rate.?limit|api.?error|quota|expired|timed out/i;
          const isToolFailure = toolErrorPatterns.test(responseText);
          
          // Use neutral reward for tool failures instead of negative
          const rewardSignal = isToolFailure ? 0 : sentiment;

          // Cerebellum: record skill usage
          if (config?.enableSkillTracking !== false) {
            const skill = cerebellum.detectSkill(turnMessageContext.message);
            if (skill) {
              cerebellum.recordSkillUsage(skill, rewardSignal >= 0);
            }
          }

          // Basal Ganglia: process reward signal
          const skill = cerebellum.detectSkill(turnMessageContext.message);
          basalGanglia.processReward({
            timestamp: new Date().toISOString(),
            taskType: skill || 'general',
            signal: rewardSignal,
            source: 'implicit',
            context: turnMessageContext.message.slice(0, 50),
          });

          // Anterior Cingulate: reflect on significant tasks
          if (config?.enableReflection !== false) {
            const classification = thalamus.classify(turnMessageContext);
            if (classification.requiresAction || Math.abs(sentiment) > 0.3) {
              cingulate.reflect({
                taskDescription: turnMessageContext.message.slice(0, 100),
                userMessage: turnMessageContext.message,
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

    // ─── HOOK: agent_end ───
    // Session end: persist all brain state
    api.on(
      'agent_end',
      async (_event: any, ctx: any) => {
        const config = ctx?.pluginConfig;
        if (config?.enabled === false) return;
        if (!initialized) return;

        try {
          // Persist all module states via SQL adapter
          await amygdala.persist();
          await neurochem.persist();
          await cingulate.persist();
          await cerebellum.persist();
          await basalGanglia.persist();
          await prefrontal.persist();

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
        } catch (err: any) {
          console.warn('[AgentBrain] agent_end persist failed:', err.message);
        }
      },
      { priority: 20 }
    );

    // NOTE: OpenClaw has no 'heartbeat' typed hook.
    // Heartbeat detection is handled inside message_received via pattern match.

    // ─── TOOLS ───

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
      description: 'Query AgentBrain graph entities and relationships',
      parameters: {
        type: 'object',
        properties: {
          entity: { type: 'string', description: 'Entity name or graph search query' },
          maxHops: { type: 'number', description: 'Relationship traversal depth' },
        },
        required: ['entity'],
      },
      execute: async (_id: string, params: any, ctx: any) => {
        if (!await ensureInitialized(ctx?.pluginConfig)) {
          return { error: 'AgentBrain not initialized' };
        }
        const graph = hippocampus.recallGraph(params.entity, params.maxHops || 1);
        return { graph, stats: hippocampus.getStats() };
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
      },
    });
  },
});

// OpenClaw plugin loader expects module.exports directly
export = _plugin;
