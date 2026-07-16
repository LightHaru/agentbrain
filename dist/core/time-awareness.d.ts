/**
 * TimeAwareness — give Aira a human-like sense of time.
 *
 * A person always knows roughly what time it is, what part of the day, what day
 * of the week, whether today is special (a holiday / Tết), and — crucially —
 * *when* a message arrived relative to now ("this came at 1:30am, now it's 8am,
 * Sếp probably just woke up"). AgentBrain had a circadian phase but never
 * surfaced any of this to Aira.
 *
 * This module is timezone-aware (default Asia/Ho_Chi_Minh) and language-aware
 * (Vietnamese output). It provides:
 *   - nowContext(): current hour, buổi, thứ, ngày, holiday/Tết note.
 *   - describeTimestamp(): when a past message was sent (hôm nay/hôm qua/hôm
 *     kia, buổi, giờ) relative to now.
 *   - inferGap(): a natural inference about the gap between two messages
 *     (e.g. overnight gap + morning => "chắc Sếp mới ngủ dậy").
 */
export interface NowContext {
    hour: number;
    minute: number;
    buoi: string;
    thu: string;
    dateISO: string;
    day: number;
    month: number;
    year: number;
    holiday: string | null;
    /** Compact injectable line. */
    line: string;
}
export declare function buoiOf(hour: number): string;
export declare class TimeAwareness {
    private tz;
    constructor(timezone?: string);
    /** Extract tz-local calendar parts from an epoch ms. */
    private parts;
    /** Detect a holiday/Tết note for a given tz-local date. */
    private holidayFor;
    /** Current-time context for injection. */
    nowContext(nowMs?: number): NowContext;
    /**
     * Describe WHEN a past message was sent, relative to now.
     * e.g. "lúc 01:30 sáng hôm nay", "chiều hôm qua lúc 15:20".
     */
    describeTimestamp(tsISO: string, nowMs?: number): string;
    /** Whole-calendar-day difference (now - msg) in tz-local days. */
    private calendarDayDiff;
    /**
     * Infer a natural, human note about the gap between a PREVIOUS message and the
     * CURRENT one. Returns '' when the gap is unremarkable.
     */
    inferGap(prevISO: string, nowMs?: number): string;
}
//# sourceMappingURL=time-awareness.d.ts.map