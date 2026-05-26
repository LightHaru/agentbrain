/**
 * AgentBrain — Brain-inspired cognitive architecture for AI agents
 * 
 * Main entry point. Registers OpenClaw plugin hooks and initializes
 * all brain modules (Thalamus, Hippocampus, Prefrontal, Amygdala,
 * Cerebellum, Basal Ganglia, Anterior Cingulate).
 */

import { Thalamus } from './core/thalamus.js';
import { Hippocampus } from './core/hippocampus.js';
import { BrainFileManager } from './storage/md-writer.js';
import { BrainConfig, defaultConfig } from './core/config.js';

// Re-export all modules for external use
export { Thalamus } from './core/thalamus.js';
export { Hippocampus } from './core/hippocampus.js';
export { Amygdala } from './core/amygdala.js';
export { AnteriorCingulate } from './core/cingulate.js';
export { Cerebellum } from './core/cerebellum.js';
export { BasalGanglia } from './core/basal-ganglia.js';
export { PrefrontalCortex } from './core/prefrontal.js';
export { BrainFileManager } from './storage/md-writer.js';
export { BrainConfig, defaultConfig } from './core/config.js';
export { createOpenClawPlugin } from './integration/openclaw-plugin.js';
export { PriorityEnforcer } from './integration/priority-enforcer.js';
export { ContextInjector } from './integration/context-injector.js';

export interface AgentBrainPlugin {
  name: string;
  version: string;
  config: BrainConfig;
  thalamus: Thalamus;
  hippocampus: Hippocampus;
  fileManager: BrainFileManager;
  initialize(): Promise<void>;
  onPreResponse(context: MessageContext): Promise<BrainContext>;
  onPostResponse(context: MessageContext, response: string): Promise<void>;
  onHeartbeat(): Promise<void>;
  onSessionStart(sessionId: string): Promise<void>;
}

export interface MessageContext {
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export interface BrainContext {
  classification: MessageClassification;
  relevantMemories: Memory[];
  emotionalState: EmotionalState;
  activeSkills: string[];
}

export interface MessageClassification {
  intent: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  topic: string;
  emotionalTone: 'positive' | 'neutral' | 'negative' | 'urgent';
  requiresAction: boolean;
}

export interface Memory {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural';
  content: string;
  timestamp: string;
  confidence: number;
  accessCount: number;
  lastAccessed: string;
  tags: string[];
}

export interface EmotionalState {
  mood: string;
  intensity: number; // 0-1
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to excited)
}

/**
 * Create and initialize the AgentBrain plugin
 */
export function createAgentBrain(userConfig?: Partial<BrainConfig>): AgentBrainPlugin {
  const config = { ...defaultConfig, ...userConfig };
  const fileManager = new BrainFileManager(config.brainDir);
  const thalamus = new Thalamus(config);
  const hippocampus = new Hippocampus(config, fileManager);

  const plugin: AgentBrainPlugin = {
    name: 'agentbrain',
    version: '0.1.0',
    config,
    thalamus,
    hippocampus,
    fileManager,

    async initialize(): Promise<void> {
      await fileManager.ensureBrainStructure();
      await hippocampus.initialize();
      console.log('[AgentBrain] Initialized — all modules online');
    },

    async onPreResponse(context: MessageContext): Promise<BrainContext> {
      // Step 1: Thalamus classifies and routes
      const classification = thalamus.classify(context);

      // Step 2: Hippocampus retrieves relevant memories
      const relevantMemories = await hippocampus.recall(
        context.message,
        classification.topic
      );

      // Step 3: Build brain context for response generation
      const brainContext: BrainContext = {
        classification,
        relevantMemories,
        emotionalState: { mood: 'neutral', intensity: 0.5, valence: 0, arousal: 0.3 },
        activeSkills: [],
      };

      return brainContext;
    },

    async onPostResponse(context: MessageContext, response: string): Promise<void> {
      // Step 5: Hippocampus consolidates new memory
      await hippocampus.consolidate({
        message: context.message,
        response,
        senderId: context.senderId,
        senderName: context.senderName,
        timestamp: context.timestamp,
      });
    },

    async onHeartbeat(): Promise<void> {
      // Periodic maintenance: memory decay, consolidation
      await hippocampus.maintenance();
    },

    async onSessionStart(sessionId: string): Promise<void> {
      // Load brain state for this session
      console.log(`[AgentBrain] Session ${sessionId} started — loading brain state`);
    },
  };

  return plugin;
}

export default createAgentBrain;

// Default export for OpenClaw plugin loader
export { createOpenClawPlugin as plugin } from './integration/openclaw-plugin.js';
