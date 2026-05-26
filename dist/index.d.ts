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