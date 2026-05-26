/**
 * AgentBrain — OpenClaw Plugin Entry Point
 *
 * Hooks into OpenClaw lifecycle events:
 * - before_prompt_build: inject brain context into agent prompt
 * - message_received: process incoming message (classify, recall, emotion)
 * - message_sent: consolidate memory, track skills, process reward
 * - agent_end: session reflection + persist brain state
 *
 * Format matches agent-memory-graph plugin pattern.
 */
declare const _default: import("openclaw/plugin-sdk/plugin-entry").PluginDefinition;
export default _default;
//# sourceMappingURL=entry.d.ts.map