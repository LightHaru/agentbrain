/**
 * AgentBrain Engine — agent-neutral SDK facade (v0.7.0)
 *
 * The OpenClaw plugin (src/plugin/entry.ts) wires the brain into one specific
 * host. This module exposes the SAME cognitive core as a clean, importable
 * engine any external agent (Codex, Claude, a CLI, a test) can drive with a
 * single stable call:
 *
 *   const brain = createBrainEngine();
 *   await brain.init();
 *   const turn = await brain.processTurn({ message, userId });
 *   const state = brain.getState();
 *
 * Design goals (addressing the v0.6.0 audit findings):
 *  - One entrypoint owns orchestration; the caller never wires modules by hand.
 *  - Storage and the clock are injectable adapters (default: in-memory + Date.now).
 *  - processTurn() returns a typed, cloned snapshot — no live internal references.
 */
import { BrainConfig, defaultConfig } from './core/config.js';
import { BrainFileManager } from './storage/md-writer.js';
import { MemoryStorage } from './storage/memory-storage.js';
import { Thalamus } from './core/thalamus.js';
import { Hippocampus } from './core/hippocampus.js';
import { Amygdala } from './core/amygdala.js';
import { Neurochemistry } from './core/neurochemistry.js';
import { Hypothalamus } from './core/hypothalamus.js';
import { Brainstem } from './core/brainstem.js';
import { CorpusCallosum } from './core/corpus-callosum.js';
import { GlobalWorkspace } from './core/global-workspace.js';
import { TheoryOfMind } from './core/theory-of-mind.js';
import type { MessageContext, MessageClassification, Memory } from './index.js';

/** A clock the host can override (e.g. for deterministic tests / time travel). */
export type Clock = () => number;

export interface BrainEngineOptions {
  config?: Partial<BrainConfig>;
  /** Storage adapter. Defaults to in-memory (no filesystem). Pass a
   *  BrainFileManager / SqlStorageAdapter for persistence. */
  storage?: BrainFileManager;
  /** Injectable clock; defaults to Date.now. */
  clock?: Clock;
  /** IANA timezone for circadian/hypothalamus. Default Asia/Ho_Chi_Minh. */
  timezone?: string;
}

export interface TurnInput {
  message: string;
  userId: string;
  userName?: string;
  sessionId?: string;
  /** Optional explicit success signal for the prior task (feeds drives). */
  taskSucceeded?: boolean;
  timestamp?: string;
}

export interface TurnResult {
  classification: MessageClassification;
  userSentiment: number;
  threat: {
    isThreat: boolean;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    threatType: string | null;
    reason: string | null;
  };
  emotionalState: { mood: string; intensity: number; valence: number; arousal: number };
  neurochemistry: { dopamine: number; serotonin: number; cortisol: number; oxytocin: number; signal: string };
  relevantMemories: Memory[];
  focus: { source: string; content: string; salience: number } | null;
}

const SEVERITY_ORDER = ['none', 'low', 'medium', 'high', 'critical'] as const;

export interface BrainEngine {
  readonly version: string;
  init(): Promise<void>;
  processTurn(input: TurnInput): Promise<TurnResult>;
  /** Advance time-based subsystems (drives grow, autonomic processes fire,
   *  neurochemistry decays). Call on a heartbeat/interval. */
  tick(now?: number): { autonomicFired: string[] };
  /** Full typed snapshot of every subsystem. Always a deep copy. */
  getState(): Record<string, unknown>;
  /** Direct access to the storage adapter (e.g. MemoryStorage.dump()). */
  readonly storage: BrainFileManager;
}

const ALL_MODULES = [
  'thalamus', 'hippocampus', 'amygdala', 'neurochemistry',
  'hypothalamus', 'brainstem', 'corpusCallosum', 'globalWorkspace', 'theoryOfMind',
];

/**
 * Create a fully-wired, agent-neutral brain engine.
 * Every module is instantiated and connected internally — the caller just
 * calls init() then processTurn().
 */
export function createBrainEngine(options: BrainEngineOptions = {}): BrainEngine {
  const config: BrainConfig = { ...defaultConfig, ...(options.config ?? {}) };
  const clock: Clock = options.clock ?? (() => Date.now());
  const timezone = options.timezone ?? 'Asia/Ho_Chi_Minh';
  const storage = options.storage ?? new MemoryStorage();

  // Wire the cognitive core.
  const thalamus = new Thalamus(config);
  const hippocampus = new Hippocampus(config, storage);
  const neurochem = new Neurochemistry(config, storage);
  const amygdala = new Amygdala(config, storage);
  amygdala.attachNeurochemistry(neurochem);
  const hypothalamus = new Hypothalamus(timezone, clock());
  const brainstem = new Brainstem(clock());
  const corpusCallosum = new CorpusCallosum();
  const globalWorkspace = new GlobalWorkspace();
  const theoryOfMind = new TheoryOfMind();

  for (const id of ALL_MODULES) corpusCallosum.register(id);

  let initialized = false;

  function severityToDrive(s: TurnResult['threat']['severity']): 'low' | 'medium' | 'high' | 'critical' | null {
    return s === 'none' ? null : s;
  }

  const engine: BrainEngine = {
    version: '0.7.0',
    storage,

    async init(): Promise<void> {
      if (initialized) return;
      await storage.ensureBrainStructure();
      await neurochem.initialize();
      await amygdala.initialize?.();
      await hippocampus.initialize();
      initialized = true;
    },

    async processTurn(input: TurnInput): Promise<TurnResult> {
      if (!initialized) await engine.init();
      const now = clock();
      const ctx: MessageContext = {
        message: input.message,
        senderId: input.userId,
        senderName: input.userName ?? 'User',
        timestamp: input.timestamp ?? new Date(now).toISOString(),
        sessionId: input.sessionId ?? 'sdk',
      };

      // 1. Thalamus classifies.
      const classification = thalamus.classify(ctx);

      // 2. Amygdala processes sentiment + threat (drives neurochemistry internally).
      const amy = amygdala.process(ctx);

      // 3. Hypothalamus: satisfy drives from the interaction; register threat stress.
      hypothalamus.observe(classification.topic, amy.userSentiment, input.taskSucceeded);
      const driveSeverity = severityToDrive(amy.threat.severity);
      if (driveSeverity) hypothalamus.registerThreat(driveSeverity);

      // 4. Brainstem reflex on real threats.
      if (amy.threat.isThreat) {
        brainstem.recordThreat(amy.threat.severity as any, amy.threat.reason ?? 'threat detected');
      }

      // 5. Theory of mind: update the per-user model.
      theoryOfMind.observe(input.userId, input.userName ?? 'User', amy.userSentiment, classification.topic);

      // 6. Corpus callosum: route a couple of real inter-module signals.
      corpusCallosum.send({ from: 'amygdala', to: 'neurochemistry', type: 'affect', payload: { sentiment: amy.userSentiment } });
      if (amy.threat.isThreat) {
        corpusCallosum.send({ from: 'amygdala', to: 'brainstem', type: 'threat', payload: amy.threat });
      }

      // 7. Hippocampus recalls, then consolidates this turn.
      const relevantMemories = await hippocampus.recall(input.message, classification.topic);

      // 8. Global workspace: salience competition picks conscious focus.
      const emo = amygdala.getState();
      const candidates = [
        { source: 'amygdala', content: emo.mood, salience: Math.min(1, 0.3 + Math.abs(emo.valence) * 0.7) },
        { source: 'thalamus', content: classification.topic, salience: classification.urgency === 'critical' ? 0.95 : classification.urgency === 'high' ? 0.7 : 0.4 },
      ];
      if (amy.threat.isThreat) {
        candidates.push({ source: 'amygdala', content: `threat:${amy.threat.threatType}`, salience: 0.99 });
      }
      globalWorkspace.compete(candidates);

      await hippocampus.consolidate({
        message: input.message,
        response: '',
        senderId: input.userId,
        senderName: input.userName ?? 'User',
        timestamp: ctx.timestamp,
      });

      const neuro = neurochem.getState();
      const neuroSignal = neurochem.describe();
      const focus = globalWorkspace.getState().currentFocus;

      return {
        classification: { ...classification },
        userSentiment: amy.userSentiment,
        threat: {
          isThreat: amy.threat.isThreat,
          severity: amy.threat.severity,
          threatType: amy.threat.threatType,
          reason: amy.threat.reason,
        },
        emotionalState: { ...emo },
        neurochemistry: {
          dopamine: neuro.dopamine,
          serotonin: neuro.serotonin,
          cortisol: neuro.cortisol,
          oxytocin: neuro.oxytocin,
          signal: neuroSignal,
        },
        relevantMemories: relevantMemories.map((m) => ({ ...m })),
        focus: focus ? { source: focus.source, content: focus.content, salience: focus.salience } : null,
      };
    },

    tick(now = clock()): { autonomicFired: string[] } {
      hypothalamus.tick(now);
      const fired = brainstem.pump(now);
      neurochem.decay(1);
      return { autonomicFired: fired };
    },

    getState(): Record<string, unknown> {
      // Each module's getState already returns fresh objects; structuredClone
      // guarantees the snapshot is fully detached from internal state.
      return structuredClone({
        version: engine.version,
        initialized,
        emotionalState: amygdala.getState(),
        neurochemistry: neurochem.getState(),
        hypothalamus: hypothalamus.getState(),
        brainstem: brainstem.getState(),
        corpusCallosum: corpusCallosum.getState(),
        globalWorkspace: globalWorkspace.getState(),
        theoryOfMind: theoryOfMind.getState(),
      });
    },
  };

  return engine;
}

export default createBrainEngine;
