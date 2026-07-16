"use strict";
/**
 * AutoReflector — self-triggered reflection after a rough patch.
 *
 * The user asked that Aira "biết tự test lại", "nhớ lỗi đã mắc và cách sửa", and
 * think like a person instead of asking again and again. Manual reflection
 * (agentbrain_reflect tool) and per-turn cingulate.reflect already exist, but
 * nothing FIRES when a session accumulates several corrections/failures in a
 * row — exactly when a human would stop and think "why do I keep getting this
 * wrong?".
 *
 * This tracker watches turn signals per session. When negative signals cross a
 * threshold within a window, it emits a consolidated reflection: the recurring
 * theme, the corrections, and a distilled "do differently next time" lesson.
 * The plugin then persists that lesson (KnowledgeStore + a strong reminder), so
 * the brain genuinely learns from a bad streak instead of repeating it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoReflector = void 0;
const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'em', 'anh', 'sếp',
    'của', 'và', 'có', 'được', 'là', 'thì', 'cho', 'một', 'các', 'này', 'đó', 'ơi', 'nha', 'nhé', 'bị', 'rồi',
    'không', 'sao', 'gì', 'đi', 'ạ', 'với', 'mà', 'như', 'vậy', 'em', 'ê',
    'sai', 'phải', 'lại', 'nữa', 'quá', 'tệ', 'đúng', 'làm', 'cái', 'vẫn', 'chưa', 'ơi',
]);
function keywords(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP.has(w));
}
class AutoReflector {
    sessions = new Map();
    windowSize;
    negThreshold;
    correctionThreshold;
    constructor(opts = {}) {
        this.windowSize = opts.windowSize ?? 6;
        this.negThreshold = opts.negThreshold ?? 3;
        this.correctionThreshold = opts.correctionThreshold ?? 2;
    }
    /**
     * Record a turn's signal. Returns an AutoReflection when the session just
     * crossed the "rough patch" threshold (else null). One reflection per streak.
     */
    record(signal) {
        let st = this.sessions.get(signal.sessionId);
        if (!st) {
            st = { signals: [], lastReflectedAt: 0 };
            this.sessions.set(signal.sessionId, st);
        }
        st.signals.push(signal);
        // Look only at the recent window since the last reflection.
        const start = Math.max(st.lastReflectedAt, st.signals.length - this.windowSize);
        const recent = st.signals.slice(start);
        const negatives = recent.filter((s) => s.sentiment < -0.2);
        const corrections = recent.filter((s) => s.correction);
        if (negatives.length >= this.negThreshold || corrections.length >= this.correctionThreshold) {
            st.lastReflectedAt = st.signals.length; // reset streak
            return this.buildReflection(signal.sessionId, recent, negatives.length, corrections);
        }
        return null;
    }
    buildReflection(sessionId, recent, negativeCount, corrections) {
        // Recurring theme = most frequent keyword across the rough turns.
        const freq = new Map();
        for (const s of recent) {
            for (const w of keywords(s.userMessage))
                freq.set(w, (freq.get(w) || 0) + 1);
        }
        const theme = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'chủ đề gần đây';
        const correctionTexts = corrections
            .map((c) => c.fix || c.userMessage)
            .filter(Boolean)
            .map((t) => t.slice(0, 100));
        const fixes = corrections.map((c) => c.fix).filter(Boolean);
        const lesson = fixes.length > 0
            ? `Về "${theme}": Sếp đã sửa ${corrections.length} lần — nhớ áp dụng: ${fixes.join('; ').slice(0, 200)}. Kiểm tra kỹ + search trước khi trả lời phần này.`
            : `Về "${theme}": có ${negativeCount} lượt Sếp không hài lòng liên tiếp. Dừng lại, xem lại giả định, xác minh nguồn và tự test trước khi trả lời tiếp.`;
        return {
            sessionId,
            theme,
            correctionCount: corrections.length,
            negativeCount,
            lesson,
            corrections: correctionTexts,
            timestamp: new Date().toISOString(),
        };
    }
    /** Clear a session's tracked signals (e.g. on /new or /reset). */
    reset(sessionId) {
        this.sessions.delete(sessionId);
    }
    formatForInjection(reflection) {
        return `🔁 Tự rút kinh nghiệm (streak): ${reflection.lesson}`;
    }
}
exports.AutoReflector = AutoReflector;
//# sourceMappingURL=auto-reflector.js.map