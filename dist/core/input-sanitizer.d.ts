/**
 * InputSanitizer — clean a user message before it is remembered.
 *
 * The runtime hands the plugin the FULLY-BUILT prompt (event.prompt), which
 * contains far more than what the user actually typed:
 *   - AgentBrain's own injected "## Brain State (auto-injected)" block;
 *   - retry/system prefixes like "[Retry after the previous model attempt…]";
 *   - "Conversation info (untrusted metadata): { … }" envelopes;
 *   - injected skill / memory / whisper sections.
 *
 * Storing that verbatim poisons memory: the brain ends up "remembering" its own
 * injected context as if the user said it (self-pollution), and recall quality
 * collapses. This module extracts the genuine user turn and redacts secrets so
 * credentials never become durable memories.
 */
export interface SanitizeResult {
    /** The cleaned user message safe to remember. */
    clean: string;
    /** True if an injected/system block was removed. */
    strippedInjection: boolean;
    /** True if any secret was redacted. */
    redactedSecret: boolean;
}
/**
 * Extract the genuine, secret-free user message from a possibly prompt-wrapped
 * string. Returns '' when nothing meaningful survives (caller should skip it).
 */
export declare function sanitizeUserMessage(raw: string | undefined | null): SanitizeResult;
/**
 * Redact secrets only, without stripping injected/system sections. Use this for
 * the agent's OWN response (which may legitimately contain markdown headers we
 * do not want to treat as injection markers).
 */
export declare function redactSecrets(raw: string | undefined | null): {
    clean: string;
    redactedSecret: boolean;
};
//# sourceMappingURL=input-sanitizer.d.ts.map