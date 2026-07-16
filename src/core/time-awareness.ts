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
  hour: number;              // 0-23 in target tz
  minute: number;
  buoi: string;              // sáng/trưa/chiều/tối/khuya
  thu: string;               // Thứ Hai..Chủ Nhật
  dateISO: string;           // YYYY-MM-DD in tz
  day: number;               // 1-31
  month: number;             // 1-12
  year: number;
  holiday: string | null;    // e.g. "Quốc khánh 2/9", "Tết Dương lịch"
  /** Compact injectable line. */
  line: string;
}

// ── Buổi (part of day), Vietnamese ─────────────────────────────────────────
export function buoiOf(hour: number): string {
  if (hour >= 5 && hour < 11) return 'sáng';
  if (hour >= 11 && hour < 13) return 'trưa';
  if (hour >= 13 && hour < 18) return 'chiều';
  if (hour >= 18 && hour < 23) return 'tối';
  return 'khuya'; // 23:00–04:59
}

const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// ── Fixed solar-calendar Vietnamese holidays ───────────────────────────────
const SOLAR_HOLIDAYS: Record<string, string> = {
  '01-01': 'Tết Dương lịch',
  '02-14': 'Valentine',
  '03-08': 'Quốc tế Phụ nữ 8/3',
  '04-30': 'Giải phóng miền Nam 30/4',
  '05-01': 'Quốc tế Lao động 1/5',
  '06-01': 'Quốc tế Thiếu nhi 1/6',
  '09-02': 'Quốc khánh 2/9',
  '10-20': 'Phụ nữ Việt Nam 20/10',
  '11-20': 'Nhà giáo Việt Nam 20/11',
  '12-24': 'Đêm Giáng sinh',
  '12-25': 'Giáng sinh',
  '12-31': 'Giao thừa Dương lịch',
};

// ── Tết Nguyên Đán (lunar new year) day-1 solar dates, per year (VN) ────────
// Hardcoded because full lunar conversion is heavy; covers the useful range.
const TET_DAY1: Record<number, string> = {
  2024: '2024-02-10',
  2025: '2025-01-29',
  2026: '2026-02-17',
  2027: '2027-02-06',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-03',
};

export class TimeAwareness {
  private tz: string;
  constructor(timezone = 'Asia/Ho_Chi_Minh') { this.tz = timezone; }

  /** Extract tz-local calendar parts from an epoch ms. */
  private parts(ms: number): { hour: number; minute: number; y: number; mo: number; d: number; dow: number } {
    const dt = new Date(ms);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: this.tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short',
    });
    const map: Record<string, string> = {};
    for (const p of fmt.formatToParts(dt)) map[p.type] = p.value;
    const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    let hour = parseInt(map.hour, 10);
    if (hour === 24) hour = 0; // some ICU emit 24 at midnight
    return {
      hour,
      minute: parseInt(map.minute, 10),
      y: parseInt(map.year, 10),
      mo: parseInt(map.month, 10),
      d: parseInt(map.day, 10),
      dow: dowMap[map.weekday] ?? 0,
    };
  }

  /** Detect a holiday/Tết note for a given tz-local date. */
  private holidayFor(y: number, mo: number, d: number): string | null {
    const key = `${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (SOLAR_HOLIDAYS[key]) return SOLAR_HOLIDAYS[key];

    const tet = TET_DAY1[y];
    if (tet) {
      const [ty, tm, td] = tet.split('-').map(Number);
      // Tết window: 30 tháng Chạp (day before) .. mùng 3 (day1 + 2).
      const day1 = Date.UTC(ty, tm - 1, td);
      const cur = Date.UTC(y, mo - 1, d);
      const diffDays = Math.round((cur - day1) / 86400000);
      if (diffDays === -1) return 'Giao thừa (30 Tết)';
      if (diffDays === 0) return 'Mùng 1 Tết Nguyên Đán';
      if (diffDays === 1) return 'Mùng 2 Tết';
      if (diffDays === 2) return 'Mùng 3 Tết';
      if (diffDays >= 3 && diffDays <= 6) return `Tết Nguyên Đán (mùng ${diffDays + 1})`;
      if (diffDays >= -7 && diffDays <= -2) return 'Cận Tết (sắp Tết)';
    }
    return null;
  }

  /** Current-time context for injection. */
  nowContext(nowMs: number = Date.now()): NowContext {
    const p = this.parts(nowMs);
    const buoi = buoiOf(p.hour);
    const thu = THU[p.dow];
    const holiday = this.holidayFor(p.y, p.mo, p.d);
    const dateISO = `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
    const hhmm = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
    let line = `🕐 Bây giờ: ${hhmm} ${buoi}, ${thu} ngày ${p.d}/${p.mo}/${p.y}`;
    if (holiday) line += ` — hôm nay là ${holiday}`;
    if (p.hour >= 0 && p.hour < 5) line += ' (đang khuya, giờ này Sếp thường ngủ)';
    return {
      hour: p.hour, minute: p.minute, buoi, thu,
      dateISO, day: p.d, month: p.mo, year: p.y, holiday, line,
    };
  }

  /**
   * Describe WHEN a past message was sent, relative to now.
   * e.g. "lúc 01:30 sáng hôm nay", "chiều hôm qua lúc 15:20".
   */
  describeTimestamp(tsISO: string, nowMs: number = Date.now()): string {
    const t = Date.parse(tsISO);
    if (Number.isNaN(t)) return '';
    const mp = this.parts(t);
    const np = this.parts(nowMs);
    const buoi = buoiOf(mp.hour);
    const hhmm = `${String(mp.hour).padStart(2, '0')}:${String(mp.minute).padStart(2, '0')}`;

    const dayDiff = this.calendarDayDiff(mp, np);
    let when: string;
    if (dayDiff === 0) when = 'hôm nay';
    else if (dayDiff === 1) when = 'hôm qua';
    else if (dayDiff === 2) when = 'hôm kia';
    else if (dayDiff > 2 && dayDiff <= 6) when = `${dayDiff} ngày trước`;
    else when = `ngày ${mp.d}/${mp.mo}`;

    return `lúc ${hhmm} ${buoi} ${when}`;
  }

  /** Whole-calendar-day difference (now - msg) in tz-local days. */
  private calendarDayDiff(msg: { y: number; mo: number; d: number }, now: { y: number; mo: number; d: number }): number {
    const a = Date.UTC(msg.y, msg.mo - 1, msg.d);
    const b = Date.UTC(now.y, now.mo - 1, now.d);
    return Math.round((b - a) / 86400000);
  }

  /**
   * Infer a natural, human note about the gap between a PREVIOUS message and the
   * CURRENT one. Returns '' when the gap is unremarkable.
   */
  inferGap(prevISO: string, nowMs: number = Date.now()): string {
    const prev = Date.parse(prevISO);
    if (Number.isNaN(prev)) return '';
    const gapMin = (nowMs - prev) / 60000;
    if (gapMin < 0) return '';

    const pp = this.parts(prev);
    const np = this.parts(nowMs);
    const dayDiff = this.calendarDayDiff(pp, np);

    // Overnight gap: previous late-night/khuya, now morning => likely just woke.
    const prevLate = pp.hour >= 23 || pp.hour < 5;
    const nowMorning = np.hour >= 5 && np.hour < 11;
    if (gapMin >= 180 && prevLate && nowMorning) {
      return `Tin trước Sếp nhắn lúc ${String(pp.hour).padStart(2, '0')}:${String(pp.minute).padStart(2, '0')} khuya, giờ đã sáng — chắc Sếp mới ngủ dậy, chào hỏi nhẹ nhàng phù hợp buổi sáng.`;
    }
    // Long silence (days).
    if (dayDiff >= 2) {
      return `Đã ${dayDiff} ngày kể từ tin trước — hỏi thăm nhẹ, đừng cho là mạch chat cũ còn nguyên.`;
    }
    // Same-day long gap across meal/rest boundaries.
    if (gapMin >= 60) {
      const hrs = Math.round(gapMin / 60);
      const nb = buoiOf(np.hour);
      return `Cách tin trước ~${hrs} tiếng (giờ là buổi ${nb}) — có thể Sếp vừa làm việc khác xong quay lại.`;
    }
    return '';
  }
}
