"use strict";
/**
 * OpenClaw Plugin Hooks for AgentBrain
 *
 * These hooks integrate AgentBrain into the OpenClaw lifecycle:
 * - pre-response: enrich context before agent responds
 * - post-response: consolidate memory after response
 * - heartbeat: periodic maintenance (decay, reflection)
 * - session-start: load brain state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBrain = initializeBrain;
exports.preResponseHook = preResponseHook;
exports.postResponseHook = postResponseHook;
exports.heartbeatHook = heartbeatHook;
exports.sessionStartHook = sessionStartHook;
exports.getBrain = getBrain;
const index_js_1 = require("../index.js");
let brain = null;
/**
 * Initialize the brain plugin (called once at startup)
 */
async function initializeBrain(config) {
    brain = (0, index_js_1.createAgentBrain)(config);
    await brain.initialize();
    return brain;
}
/**
 * Pre-response hook: classify message + recall memories
 * Returns enriched context to inject into agent prompt
 */
async function preResponseHook(context) {
    if (!brain)
        throw new Error('[AgentBrain] Not initialized');
    const brainContext = await brain.onPreResponse(context);
    // Format brain context as injectable prompt section
    const lines = ['## Brain Context (AgentBrain)'];
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
async function postResponseHook(context, response) {
    if (!brain)
        return;
    await brain.onPostResponse(context, response);
}
/**
 * Heartbeat hook: periodic maintenance
 */
async function heartbeatHook() {
    if (!brain)
        return;
    await brain.onHeartbeat();
}
/**
 * Session start hook: load brain state
 */
async function sessionStartHook(sessionId) {
    if (!brain)
        return;
    await brain.onSessionStart(sessionId);
}
/**
 * Get current brain instance (for external access)
 */
function getBrain() {
    return brain;
}
//# sourceMappingURL=plugin-hooks.js.map