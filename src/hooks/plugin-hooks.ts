/**
 * OpenClaw Plugin Hooks for AgentBrain
 * 
 * These hooks integrate AgentBrain into the OpenClaw lifecycle:
 * - pre-response: enrich context before agent responds
 * - post-response: consolidate memory after response
 * - heartbeat: periodic maintenance (decay, reflection)
 * - session-start: load brain state
 */

import { createAgentBrain, AgentBrainPlugin, MessageContext } from '../index.js';
import { BrainConfig } from '../core/config.js';

let brain: AgentBrainPlugin | null = null;

/**
 * Initialize the brain plugin (called once at startup)
 */
export async function initializeBrain(config?: Partial<BrainConfig>): Promise<AgentBrainPlugin> {
  brain = createAgentBrain(config);
  await brain.initialize();
  return brain;
}

/**
 * Pre-response hook: classify message + recall memories
 * Returns enriched context to inject into agent prompt
 */
export async function preResponseHook(context: MessageContext): Promise<string> {
  if (!brain) throw new Error('[AgentBrain] Not initialized');

  const brainContext = await brain.onPreResponse(context);

  // Format brain context as injectable prompt section
  const lines: string[] = ['## Brain Context (AgentBrain)'];

  // Classification
  lines.push(`Intent: ${brainContext.classification.intent} | Topic: ${brainContext.classification.topic} | Urgency: ${brainContext.classification.urgency} | Tone: ${brainContext.classification.emotionalTone}`);

  // Relevant memories
  if (brainContext.relevantMemories.length > 0) {
    lines.push('');
    lines.push('### Relevant Memories');
    for (const mem of brainContext.relevantMemories.slice(0, 5)) {
      lines.push(`- [${mem.type}] ${mem.content} (confidence: ${mem.confidence.toFixed(2)})`);
    }
  }

  return lines.join('\n');
}

/**
 * Post-response hook: consolidate new memory from the interaction
 */
export async function postResponseHook(context: MessageContext, response: string): Promise<void> {
  if (!brain) return;
  await brain.onPostResponse(context, response);
}

/**
 * Heartbeat hook: periodic maintenance
 */
export async function heartbeatHook(): Promise<void> {
  if (!brain) return;
  await brain.onHeartbeat();
}

/**
 * Session start hook: load brain state
 */
export async function sessionStartHook(sessionId: string): Promise<void> {
  if (!brain) return;
  await brain.onSessionStart(sessionId);
}

/**
 * Get current brain instance (for external access)
 */
export function getBrain(): AgentBrainPlugin | null {
  return brain;
}
