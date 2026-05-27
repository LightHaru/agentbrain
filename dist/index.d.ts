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
import { Hypothalamus } from './core/hypothalamus.js';
import { Brainstem } from './core/brainstem.js';
import { CorpusCallosum } from './core/corpus-callosum.js';
import { GlobalWorkspace } from './core/global-workspace.js';
import { TheoryOfMind } from './core/theory-of-mind.js';
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
    temporal: TemporalLobe;
    parietal: ParietalLobe;
    insula: Insula;
    metacognition: Metacognition;
    hypothalamus: Hypothalamus;
    brainstem: Brainstem;
    corpusCallosum: CorpusCallosum;
    globalWorkspace: GlobalWorkspace;
    theoryOfMind: TheoryOfMind;
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