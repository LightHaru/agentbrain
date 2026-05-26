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
import { BrainConfig } from '../core/config.js';
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
    onSessionStart(context: {
        sessionId: string;
    }): Promise<void>;
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
export declare function createOpenClawPlugin(userConfig?: Partial<BrainConfig>): OpenClawPluginInstance;
/**
 * Default export for OpenClaw plugin loader
 */
export default createOpenClawPlugin;
//# sourceMappingURL=openclaw-plugin.d.ts.map