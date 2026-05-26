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

import { createAgentBrain, AgentBrainPlugin, MessageContext, BrainContext } from '../index.js';
import { BrainConfig, defaultConfig } from '../core/config.js';
import { Amygdala } from '../core/amygdala.js';
import { AnteriorCingulate } from '../core/cingulate.js';
import { Cerebellum } from '../core/cerebellum.js';
import { BasalGanglia } from '../core/basal-ganglia.js';
import { PrefrontalCortex } from '../core/prefrontal.js';
import { PriorityEnforcer } from './priority-enforcer.js';
import { ContextInjector, InjectionContext } from './context-injector.js';
import { BrainFileManager } from '../storage/md-writer.js';

export interface OpenClawPluginManifest {
  name: string;
  version: string;
  description: string;
  hooks: string[];
  config: Record<string, unknown>;
}

export interface OpenClawHookContext {
  sessionId: string;
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  channel: string;
  metadata?: Record<string, unknown>;
}

export interface OpenClawPluginInstance {
  manifest: OpenClawPluginManifest;
  initialize(config?: Partial<BrainConfig>): Promise<void>;
  onSessionStart(context: { sessionId: string }): Promise<void>;
  onPreResponse(context: OpenClawHookContext): Promise<string>;
  onPostResponse(context: OpenClawHookContext, response: string): Promise<void>;
  onHeartbeat(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): BrainStatus;
}

export interface BrainStatus {
  initialized: boolean;
  modules: {
    thalamus: boolean;
    hippocampus: boolean;
    amygdala: boolean;
    cingulate: boolean;
    cerebellum: boolean;
    basalGanglia: boolean;
    prefrontal: boolean;
  };
  stats: {
    memories: number;
    reflections: number;
    skills: number;
    habits: number;
    decisions: number;
    interactions: number;
  };
  emotionalState: {
    mood: string;
    valence: number;
    arousal: number;
  };
  uptime: number;
}

/**
 * Create the OpenClaw plugin instance
 */
export function createOpenClawPlugin(userConfig?: Partial<BrainConfig>): OpenClawPluginInstance {
  const config: BrainConfig = { ...defaultConfig, ...userConfig };
  const fileManager = new BrainFileManager(config.brainDir);

  // Core modules (from Phase 1-3)
  let brain: AgentBrainPlugin;
  let amygdala: Amygdala;
  let cingulate: AnteriorCingulate;
  let cerebellum: Cerebellum;
  let basalGanglia: BasalGanglia;
  let prefrontal: PrefrontalCortex;

  // Phase 4 modules
  const enforcer = new PriorityEnforcer();
  const injector = new ContextInjector(enforcer);

  let initialized = false;
  let interactionCount = 0;
  let startTime = Date.now();

  const manifest: OpenClawPluginManifest = {
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
    },
  };

  const plugin: OpenClawPluginInstance = {
    manifest,

    async initialize(overrideConfig?: Partial<BrainConfig>): Promise<void> {
      const finalConfig = { ...config, ...overrideConfig };

      // Initialize file structure
      await fileManager.ensureBrainStructure();

      // Initialize core brain (Thalamus + Hippocampus)
      brain = createAgentBrain(finalConfig);
      await brain.initialize();

      // Initialize Phase 2 modules
      amygdala = new Amygdala(finalConfig, fileManager);
      await amygdala.initialize();

      cingulate = new AnteriorCingulate(finalConfig, fileManager);
      await cingulate.initialize();

      // Initialize Phase 3 modules
      cerebellum = new Cerebellum(finalConfig, fileManager);
      await cerebellum.initialize();

      basalGanglia = new BasalGanglia(finalConfig, fileManager);
      await basalGanglia.initialize();

      // Initialize Phase 4 module
      prefrontal = new PrefrontalCortex(finalConfig, fileManager);
      await prefrontal.initialize();

      initialized = true;
      startTime = Date.now();
      console.log('[AgentBrain:OpenClaw] All modules initialized — brain is online');
    },

    async onSessionStart(context: { sessionId: string }): Promise<void> {
      if (!initialized) return;
      console.log(`[AgentBrain:OpenClaw] Session ${context.sessionId} — loading brain state`);
      // Brain state is already loaded during initialize
      // Future: per-session brain state isolation
    },

    async onPreResponse(context: OpenClawHookContext): Promise<string> {
      if (!initialized) return '';

      const msgContext: MessageContext = {
        message: context.message,
        senderId: context.senderId,
        senderName: context.senderName,
        timestamp: context.timestamp,
        sessionId: context.sessionId,
        metadata: context.metadata,
      };

      // Step 1: Thalamus classifies
      const classification = brain.thalamus.classify(msgContext);

      // Step 2: Hippocampus recalls
      const relevantMemories = await brain.hippocampus.recall(
        context.message,
        classification.topic
      );

      // Step 3: Amygdala processes emotion + threat
      const emotionalResult = amygdala.process(msgContext);

      // Step 4: Prefrontal plans
      const plan = prefrontal.plan(classification, context.message);

      // Step 5: Cerebellum detects skill
      const detectedSkill = cerebellum.detectSkill(context.message);
      if (detectedSkill) {
        cerebellum.detectPattern(detectedSkill, context.timestamp);
      }

      // Step 6: Update working memory with current context
      prefrontal.updateWorkingMemory(
        `User asked: ${context.message.slice(0, 80)}`,
        'current_turn',
        1.0
      );

      // Step 7: Build injection context
      const injectionContext: InjectionContext = {
        classification,
        emotionalState: emotionalResult.updatedState,
        personality: cingulate.getPersonality(),
        relationship: amygdala.getRelationship(context.senderId) || null,
        relevantMemories,
        topSkills: cerebellum.getTopSkills(3),
        activeHabits: cerebellum.getActiveHabits(),
        workingMemory: prefrontal.getWorkingMemory(),
        rewardTrend: basalGanglia.getRecentTrend(),
      };

      // Step 8: Generate injectable context (with priority enforcement)
      const brainContext = injector.inject(injectionContext);

      interactionCount++;
      return brainContext;
    },

    async onPostResponse(context: OpenClawHookContext, response: string): Promise<void> {
      if (!initialized) return;

      const msgContext: MessageContext = {
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

      // Step 2: Detect user sentiment for reward signal
      const sentiment = amygdala.detectSentiment(context.message);

      // Step 3: Cerebellum records skill usage
      const skill = cerebellum.detectSkill(context.message);
      if (skill) {
        const success = sentiment >= 0; // positive or neutral = success
        cerebellum.recordSkillUsage(skill, success);
      }

      // Step 4: Basal Ganglia processes reward
      basalGanglia.processReward({
        timestamp: context.timestamp,
        taskType: skill || 'general',
        signal: sentiment,
        source: sentiment !== 0 ? 'implicit' : 'implicit',
        context: context.message.slice(0, 50),
      });

      // Step 5: Anterior Cingulate reflects (only on significant tasks)
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

      // Step 6: Prefrontal completes plan
      prefrontal.completePlan();
    },

    async onHeartbeat(): Promise<void> {
      if (!initialized) return;

      // Memory maintenance (decay + prune)
      await brain.onHeartbeat();

      // Persist all module states periodically
      await amygdala.persist();
      await cingulate.persist();
      await cerebellum.persist();
      await basalGanglia.persist();
      await prefrontal.persist();

      console.log(`[AgentBrain:OpenClaw] Heartbeat — ${interactionCount} interactions processed`);
    },

    async shutdown(): Promise<void> {
      if (!initialized) return;

      // Final persist before shutdown
      await amygdala.persist();
      await cingulate.persist();
      await cerebellum.persist();
      await basalGanglia.persist();
      await prefrontal.persist();

      initialized = false;
      console.log('[AgentBrain:OpenClaw] Shutdown complete — brain state persisted');
    },

    getStatus(): BrainStatus {
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
export default createOpenClawPlugin;
