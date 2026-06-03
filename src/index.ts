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
import { TemporalLobe } from './core/temporal.js';
import { ParietalLobe } from './core/parietal.js';
import { Insula } from './core/insula.js';
import { Metacognition } from './core/metacognition.js';

// Re-export all modules for external use
// Core modules (v1.0)
export { Thalamus } from './core/thalamus.js';
export { Hippocampus } from './core/hippocampus.js';
export { GraphMemory } from './core/graph-memory.js';
export { Amygdala } from './core/amygdala.js';
export { AnteriorCingulate } from './core/cingulate.js';
export { Cerebellum } from './core/cerebellum.js';
export { BasalGanglia } from './core/basal-ganglia.js';
export { PrefrontalCortex } from './core/prefrontal.js';

// Phase 1 modules (v1.5)
export { TemporalLobe } from './core/temporal.js';
export { ParietalLobe } from './core/parietal.js';
export { Insula } from './core/insula.js';
export { WorkingMemory } from './core/working-memory.js';
export { Metacognition } from './core/metacognition.js';

// Phase 2 modules (v0.6.0) — previously missing from the barrel API
export { Hypothalamus } from './core/hypothalamus.js';
export { Brainstem } from './core/brainstem.js';
export { CorpusCallosum } from './core/corpus-callosum.js';
export { GlobalWorkspace } from './core/global-workspace.js';
export { TheoryOfMind } from './core/theory-of-mind.js';

// Phase 3 neurochemistry (v0.5.0)
export { Neurochemistry } from './core/neurochemistry.js';

// Generative affect via cognitive appraisal (v0.8.0)
export { AffectCore } from './core/affect-core.js';
export type { EmotionLabel, DiscreteEmotion, AppraisalInput, AffectState, EmotionVAD, Agency } from './core/affect-core.js';

// Agent-neutral SDK engine (v0.7.0)
export { createBrainEngine } from './engine.js';
export type { BrainEngine, BrainEngineOptions, TurnInput, TurnResult, Clock } from './engine.js';

// Storage & Config
export { BrainFileManager } from './storage/md-writer.js';
export { MemoryStorage } from './storage/memory-storage.js';
export { BrainConfig, defaultConfig } from './core/config.js';

// Integration
export { createOpenClawPlugin } from './integration/openclaw-plugin.js';
export { PriorityEnforcer } from './integration/priority-enforcer.js';
export { ContextInjector } from './integration/context-injector.js';

export interface AgentBrainPlugin {
  name: string;
  version: string;
  config: BrainConfig;
  
  // Core modules (v1.0)
  thalamus: Thalamus;
  hippocampus: Hippocampus;
  fileManager: BrainFileManager;
  
  // Phase 1 modules (v1.5)
  temporal: TemporalLobe;
  parietal: ParietalLobe;
  insula: Insula;
  metacognition: Metacognition;
  
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
  
  // Phase 1 additions
  semanticRepresentation?: any; // From Temporal
  percept?: any; // From Parietal
  userState?: any; // From Insula
  metacognitiveState?: any; // From Metacognition
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
  
  // Core modules (v1.0)
  const thalamus = new Thalamus(config);
  const hippocampus = new Hippocampus(config, fileManager);
  
  // Phase 1 modules (v1.5)
  const temporal = new TemporalLobe(config);
  const parietal = new ParietalLobe(config);
  const insula = new Insula(config);
  const metacognition = new Metacognition(config);

  const plugin: AgentBrainPlugin = {
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

    async initialize(): Promise<void> {
      await fileManager.ensureBrainStructure();
      await hippocampus.initialize();
      console.log('[AgentBrain] Initialized — all modules online');
    },

    async onPreResponse(context: MessageContext): Promise<BrainContext> {
      const startTime = Date.now();
      
      // Step 1: Thalamus classifies and routes
      const classification = thalamus.classify(context);

      // Step 2: Temporal comprehends language & extracts semantics
      const semanticRep = temporal.comprehend(
        context.message,
        { role: 'user', timestamp: Date.now() }
      );

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
      const relevantMemories = await hippocampus.recall(
        semanticRep.concepts.join(' '),
        classification.topic
      );

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
      const brainContext: BrainContext = {
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

    async onPostResponse(context: MessageContext, response: string): Promise<void> {
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

    async onHeartbeat(): Promise<void> {
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
