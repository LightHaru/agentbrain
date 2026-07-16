"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUserMessage = sanitizeUserMessage;
exports.redactSecrets = redactSecrets;
// Markers that begin an INJECTED / SYSTEM section. Everything from the first
// occurrence onward is not user-authored and must be cut before remembering.
const INJECTION_CUT_MARKERS = [
    /## Brain State \(AgentBrain/i,
    /### Brain Whisper/i,
    /\n#{1,6}\s*(Relevant memories|Retrieved knowledge|Tri thức liên quan|Ngữ cảnh gần đây)/i,
    /\n<injected[- ]context/i,
    /\n\[AgentBrain\]/i,
];
// Leading system/retry prefixes to strip (they wrap the real message).
const LEADING_PREFIXES = [
    /^\s*\[Retry after the previous model attempt[^\]]*\]\s*/i,
    /^\s*\[System[^\]]*\]\s*/i,
    /^\s*\[assistant turn failed[^\]]*\]\s*/i,
];
// Secret patterns → redacted so credentials never enter durable memory.
const SECRET_PATTERNS = [
    { re: /AKIA[0-9A-Z]{16}/g, label: '[REDACTED_AWS_ACCESS_KEY]' },
    { re: /ASIA[0-9A-Z]{16}/g, label: '[REDACTED_AWS_TEMP_KEY]' },
    // AWS secret access key line (40-char base64-ish following "secret … key")
    // AWS secret key may sit on the same line (key: VALUE) or the next line.
    { re: /(secret\s*access\s*key\s*[:=]?\s*\n?\s*)[A-Za-z0-9/+=]{40}/gi, label: '$1[REDACTED_AWS_SECRET]' },
    { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, label: '[REDACTED_PRIVATE_KEY]' },
    { re: /gh[pousr]_[A-Za-z0-9]{20,}/g, label: '[REDACTED_GITHUB_TOKEN]' },
    { re: /xox[baprs]-[A-Za-z0-9-]{10,}/g, label: '[REDACTED_SLACK_TOKEN]' },
    { re: /sk-[A-Za-z0-9]{20,}/g, label: '[REDACTED_API_KEY]' },
    { re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, label: '[REDACTED_JWT]' },
    // Seed phrases are handled conservatively elsewhere; avoid false positives here.
];
/**
 * Extract the genuine, secret-free user message from a possibly prompt-wrapped
 * string. Returns '' when nothing meaningful survives (caller should skip it).
 */
function sanitizeUserMessage(raw) {
    const empty = { clean: '', strippedInjection: false, redactedSecret: false };
    if (!raw)
        return empty;
    let text = raw;
    let strippedInjection = false;
    // 1) Cut everything from the first injected/system marker onward.
    let cutAt = text.length;
    for (const m of INJECTION_CUT_MARKERS) {
        const match = m.exec(text);
        if (match && match.index < cutAt)
            cutAt = match.index;
    }
    if (cutAt < text.length) {
        text = text.slice(0, cutAt);
        strippedInjection = true;
    }
    // 2) Unwrap the OpenClaw runtime envelope. The real prompt wraps the current
    //    message with "Sender (untrusted metadata): {json}" and a
    //    "Conversation context (untrusted, chronological, ...):" block whose lines
    //    are history entries prefixed like "#49794 <date> KL:" or
    //    "#session:<id> <date> OpenClaw:". The genuine current message is the
    //    trailing text AFTER the last history line. We extract only that.
    if (/Sender \(untrusted metadata\)|Conversation context \(untrusted|Conversation info \(untrusted metadata\)/i.test(text)) {
        strippedInjection = true;
        const lines = text.split('\n');
        // Index of the last history line (starts with "#<digits>" or "#session:").
        let lastHist = -1;
        for (let i = 0; i < lines.length; i++) {
            if (/^\s*#(\d+|session:)/i.test(lines[i]))
                lastHist = i;
        }
        if (lastHist >= 0) {
            const tail = lines.slice(lastHist + 1).join('\n').trim();
            // If the last history line itself carries the current message inline (no
            // trailing prose), fall back to the text after the final ":" on it.
            text = tail || (lines[lastHist].replace(/^\s*#\S+\s+.*?:\s*/, '').trim());
        }
        else {
            // No history lines — strip the metadata/context headers + any JSON block.
            text = text
                .replace(/Sender \(untrusted metadata\):\s*/i, '')
                .replace(/Conversation (context|info) \(untrusted[^)]*\):\s*/i, '')
                .replace(/```json[\s\S]*?```/gi, '')
                .replace(/```[\s\S]*?```/g, '')
                .trim();
        }
    }
    // 3) Strip leading system/retry prefixes (repeatedly, they can stack).
    let changed = true;
    while (changed) {
        changed = false;
        for (const p of LEADING_PREFIXES) {
            const next = text.replace(p, '');
            if (next !== text) {
                text = next;
                changed = true;
                strippedInjection = true;
            }
        }
    }
    // 4) Redact secrets.
    let redactedSecret = false;
    for (const { re, label } of SECRET_PATTERNS) {
        if (re.test(text)) {
            redactedSecret = true;
            text = text.replace(re, label);
        }
        re.lastIndex = 0;
    }
    return { clean: text.trim(), strippedInjection, redactedSecret };
}
/**
 * Redact secrets only, without stripping injected/system sections. Use this for
 * the agent's OWN response (which may legitimately contain markdown headers we
 * do not want to treat as injection markers).
 */
function redactSecrets(raw) {
    if (!raw)
        return { clean: '', redactedSecret: false };
    let text = raw;
    let redactedSecret = false;
    for (const { re, label } of SECRET_PATTERNS) {
        if (re.test(text)) {
            redactedSecret = true;
            text = text.replace(re, label);
        }
        re.lastIndex = 0;
    }
    return { clean: text, redactedSecret };
}
//# sourceMappingURL=input-sanitizer.js.map