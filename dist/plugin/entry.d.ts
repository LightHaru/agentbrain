/**
 * AgentBrain â€” OpenClaw Plugin Entry Point
 *
 * Hooks into OpenClaw lifecycle events:
 * - before_prompt_build: inject brain context into agent prompt
 * - message_received: process incoming message (classify, recall, emotion)
 * - message_sent: consolidate memory, track skills, process reward
 * - agent_end: session reflection + persist brain state
 *
 * Self-contained: does not import from openclaw/plugin-sdk at compile time.
 * OpenClaw gateway loads this file and calls .register(api).
 */
declare const _plugin: any;
export = _plugin;
//# sourceMappingURL=entry.d.ts.map