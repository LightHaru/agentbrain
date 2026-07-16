/**
 * Noise Filter — Guards memory formation against system/telemetry pollution
 *
 * A "second brain" is only useful if it stores real memories. Without this
 * guard, AgentBrain was ingesting runtime telemetry as if it were said by the
 * user — e.g. model-metadata warnings and token/cost counters ended up stored
 * as `[Technical]` / `[Finding]` memories. Those pollute recall forever.
 *
 * This module centralizes detection of non-conversational content so both the
 * Hippocampus (episodic/semantic/procedural candidates) and the knowledge
 * extractor can drop it before it is ever persisted.
 */
/**
 * Returns true when the text looks like runtime/system/telemetry output rather
 * than genuine conversational content worth remembering.
 */
export declare function isSystemNoise(text: string | undefined | null): boolean;
/**
 * Strips individual noise lines out of a multi-line block, keeping only the
 * lines that carry real signal. Useful when a response mixes a real finding
 * with a trailing telemetry footer.
 */
export declare function stripNoiseLines(text: string): string;
//# sourceMappingURL=noise-filter.d.ts.map