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

// Patterns that identify content produced by the runtime/UI rather than by a
// human or the agent's own reasoning. Matching ANY of these marks the text as
// noise that must never become a durable memory.
const SYSTEM_NOISE_PATTERNS: RegExp[] = [
  // Model / provider metadata warnings
  /model metadata (for|not found)/i,
  /defaulting to fallback metadata/i,
  /falling back to (default|fallback)/i,
  /unknown model|unsupported model/i,

  // Token accounting & cost meters (UI telemetry)
  /\bTokens?:\s*[\d.,]+\s*[kKmM]?\s*(in|out)\b/i,
  /\b[\d.,]+\s*[kKmM]?\s*(tokens?)\b.*\b(in|out|used|remaining)\b/i,
  /\bcost:\s*\$?[\d.,]+/i,
  /💵|🧮/,

  // Rate limit / quota / retry plumbing surfaced as status lines
  /\b(rate.?limit|quota).*(reset|remaining|exceeded)\b/i,
  /\bretry(ing)?\b.*\b(in|after)\b.*\b\d+\s*(ms|s|sec|seconds)\b/i,

  // Generic runtime status / diagnostics
  /assistant turn failed/i,
  /\[(debug|trace|telemetry|metrics|usage)\]/i,
  /^\s*(warning|error|info|debug|trace):\s/i,
  /context (window )?(full|exceeded|compacted|compressed)/i,
  /\bsession (started|resumed|expired|ended)\b/i,
  /\bheartbeat\b/i,

  // Progress bars / spinners / ANSI noise
  /[▏▎▍▌▋▊▉█░▒▓]/,
  /\x1b\[[0-9;]*m/,
];

// Standalone warning glyphs that, combined with metadata/telemetry wording,
// strongly signal a system line.
const WARNING_GLYPH = /[⚠️❗✖✗✘]/;

/**
 * Returns true when the text looks like runtime/system/telemetry output rather
 * than genuine conversational content worth remembering.
 */
export function isSystemNoise(text: string | undefined | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  for (const pattern of SYSTEM_NOISE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // A warning glyph plus metadata/config wording (but no real sentence) is noise.
  if (WARNING_GLYPH.test(trimmed) && /metadata|fallback|config|schema|provider/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Strips individual noise lines out of a multi-line block, keeping only the
 * lines that carry real signal. Useful when a response mixes a real finding
 * with a trailing telemetry footer.
 */
export function stripNoiseLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => line.trim() && !isSystemNoise(line))
    .join('\n')
    .trim();
}
