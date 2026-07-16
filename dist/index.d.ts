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
import { BrainConfig } from './core/config.js';
import { TemporalLobe } from './core/temporal.js';
import { ParietalLobe } from './core/parietal.js';
import { Insula } from './core/insula.js';
import { Metacognition } from './core/metacognition.js';
export { Thalamus } from './core/thalamus.js';
export { Hippocampus } from './core/hippocampus.js';
export { Amygdala } from './core/amygdala.js';
export { AnteriorCingulate } from './core/cingulate.js';
export { Cerebellum } from './core/cerebellum.js';
export { BasalGanglia } from './core/basal-ganglia.js';
export { PrefrontalCortex } from './core/prefrontal.js';
export { TemporalLobe } from './core/temporal.js';
export { ParietalLobe } from './core/parietal.js';
export { Insula } from './core/insula.js';
export { WorkingMemory } from './core/working-memory.js';
export { Metacognition } from './core/metacognition.js';
export { Hypothalamus } from './core/hypothalamus.js';
export { Brainstem } from './core/brainstem.js';
export { CorpusCallosum } from './core/corpus-callosum.js';
export { GlobalWorkspace } from './core/global-workspace.js';
export { TheoryOfMind } from './core/theory-of-mind.js';
export { Neurochemistry } from './core/neurochemistry.js';
export { AffectCore } from './core/affect-core.js';
export type { EmotionLabel, DiscreteEmotion, AppraisalInput, AffectState, EmotionVAD, Agency } from './core/affect-core.js';
export { createBrainEngine } from './engine.js';
export type { BrainEngine, BrainEngineOptions, TurnInput, TurnResult, Clock } from './engine.js';
export { BrainFileManager } from './storage/md-writer.js';
export { MemoryStorage } from './storage/memory-storage.js';
export { BrainConfig, defaultConfig } from './core/config.js';
export { EmbeddingService, getEmbeddingService, l2normalize, cosineSim, EMBED_MODEL_ID, EMBED_DIM } from './core/embedding-service.js';
export { SelfDistiller } from './training/self-distiller.js';
export type { SelfDistillReport } from './training/self-distiller.js';
export { KnowledgeStore } from './core/knowledge-store.js';
export type { KnowledgeItem, KnowledgeKind, SearchHit } from './core/knowledge-store.js';
export { ConversationLog } from './core/conversation-log.js';
export type { ConversationTurnRow } from './core/conversation-log.js';
export { ErrorLedger } from './core/error-ledger.js';
export type { ErrorEntry } from './core/error-ledger.js';
export { SemanticPlaybookMatcher } from './core/semantic-playbook-matcher.js';
export { DistillationTrainer } from './training/distillation-trainer.js';
export type { TrainingRunReport, EpochReport, TrainerStore } from './training/distillation-trainer.js';
export { OPUS_DISTILLATION } from './training/distillation-corpus.js';
export { runBenchmark, DEFAULT_PROBES } from './training/benchmark.js';
export { registerLearnedPlaybook, getLearnedPlaybooks, countPlaybooks, clearLearnedPlaybooks, } from './core/reasoning-playbooks.js';
export { createOpenClawPlugin } from './integration/openclaw-plugin.js';
export { PriorityEnforcer } from './integration/priority-enforcer.js';
export { ContextInjector } from './integration/context-injector.js';
export { SearchAdvisor } from './core/search-advisor.js';
export type { SearchAdvice, SearchUrgency } from './core/search-advisor.js';
export { RelevanceCritic } from './core/relevance-critic.js';
export { MemoryGraph } from './core/memory-graph.js';
export { FactChangeTracker } from './core/fact-change-tracker.js';
export * as ForgettingCurve from './core/forgetting-curve.js';
export { AutoReflector } from './core/auto-reflector.js';
export type { ReflectionSignal, AutoReflection } from './core/auto-reflector.js';
export type { FactChange } from './core/fact-change-tracker.js';
export type { GraphNode, GraphEdge, ConnectedResult } from './core/memory-graph.js';
export { runRecallEval, GOLDEN_RECALL_CORPUS } from './training/recall-eval.js';
export type { RecallProbe, RecallEvalResult, GoldenEntry } from './training/recall-eval.js';
export { sanitizeUserMessage, redactSecrets } from './core/input-sanitizer.js';
export { FreshnessGuard, DEFAULT_FRESHNESS } from './core/freshness-guard.js';
export { SourceVerifier } from './core/source-verifier.js';
export { TimeAwareness, buoiOf } from './core/time-awareness.js';
export type { NowContext } from './core/time-awareness.js';
export type { VerifyAdvice, EntityKind } from './core/source-verifier.js';
export type { FreshnessVerdict, FreshnessConfig, VolatileKind } from './core/freshness-guard.js';
export type { SanitizeResult } from './core/input-sanitizer.js';
export type { CritiqueResult, CritiqueOptions } from './core/relevance-critic.js';
export interface AgentBrainPlugin {
    name: string;
    version: string;
    config: BrainConfig;
    thalamus: Thalamus;
    hippocampus: Hippocampus;
    fileManager: BrainFileManager;
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
    semanticRepresentation?: any;
    percept?: any;
    userState?: any;
    metacognitiveState?: any;
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
    intensity: number;
    valence: number;
    arousal: number;
}
/**
 * Create and initialize the AgentBrain plugin
 */
export declare function createAgentBrain(userConfig?: Partial<BrainConfig>): AgentBrainPlugin;
export default createAgentBrain;
export { createOpenClawPlugin as plugin } from './integration/openclaw-plugin.js';
//# sourceMappingURL=index.d.ts.map