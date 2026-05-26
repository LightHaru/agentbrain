/**
 * OpenClaw Plugin Hooks for AgentBrain
 *
 * These hooks integrate AgentBrain into the OpenClaw lifecycle:
 * - pre-response: enrich context before agent responds
 * - post-response: consolidate memory after response
 * - heartbeat: periodic maintenance (decay, reflection)
 * - session-start: load brain state
 */
import { AgentBrainPlugin, MessageContext } from '../index.js';
import { BrainConfig } from '../core/config.js';
/**
 * Initialize the brain plugin (called once at startup)
 */
export declare function initializeBrain(config?: Partial<BrainConfig>): Promise<AgentBrainPlugin>;
/**
 * Pre-response hook: classify message + recall memories
 * Returns enriched context to inject into agent prompt
 */
export declare function preResponseHook(context: MessageContext): Promise<string>;
/**
 * Post-response hook: consolidate new memory from the interaction
 */
export declare function postResponseHook(context: MessageContext, response: string): Promise<void>;
/**
 * Heartbeat hook: periodic maintenance
 */
export declare function heartbeatHook(): Promise<void>;
/**
 * Session start hook: load brain state
 */
export declare function sessionStartHook(sessionId: string): Promise<void>;
/**
 * Get current brain instance (for external access)
 */
export declare function getBrain(): AgentBrainPlugin | null;
//# sourceMappingURL=plugin-hooks.d.ts.map