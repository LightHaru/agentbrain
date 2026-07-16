import { describe, it, expect } from 'vitest';
import { TimeAwareness, buoiOf } from '../src/core/time-awareness.js';

const ta = new TimeAwareness('Asia/Ho_Chi_Minh');
// A helper to make an epoch ms for a given VN local wall-clock time.
// VN is UTC+7, so subtract 7h to get the UTC instant.
const vn = (y: number, mo: number, d: number, h: number, mi = 0) =>
  Date.UTC(y, mo - 1, d, h - 7, mi);

describe('buoiOf', () => {
  it('maps hours to Vietnamese parts of day', () => {
    expect(buoiOf(7)).toBe('sáng');
    expect(buoiOf(12)).toBe('trưa');
    expect(buoiOf(15)).toBe('chiều');
    expect(buoiOf(20)).toBe('tối');
    expect(buoiOf(1)).toBe('khuya');
    expect(buoiOf(23)).toBe('khuya');
  });
});

describe('TimeAwareness.nowContext', () => {
  it('reports hour, buổi, thứ, date in VN timezone', () => {
    const ctx = ta.nowContext(vn(2026, 7, 13, 8, 30)); // Mon 13/07/2026 08:30 VN
    expect(ctx.hour).toBe(8);
    expect(ctx.minute).toBe(30);
    expect(ctx.buoi).toBe('sáng');
    expect(ctx.thu).toBe('Thứ Hai');
    expect(ctx.day).toBe(13);
    expect(ctx.month).toBe(7);
    expect(ctx.line).toContain('08:30 sáng');
    expect(ctx.line).toContain('13/7/2026');
  });

  it('detects a fixed solar holiday (Quốc khánh 2/9)', () => {
    const ctx = ta.nowContext(vn(2026, 9, 2, 10, 0));
    expect(ctx.holiday).toContain('Quốc khánh');
    expect(ctx.line).toContain('Quốc khánh');
  });

  it('detects Tết Nguyên Đán day 1 (2026-02-17)', () => {
    const ctx = ta.nowContext(vn(2026, 2, 17, 9, 0));
    expect(ctx.holiday).toContain('Mùng 1 Tết');
  });

  it('flags late-night hours', () => {
    const ctx = ta.nowContext(vn(2026, 7, 13, 1, 30));
    expect(ctx.buoi).toBe('khuya');
    expect(ctx.line.toLowerCase()).toContain('khuya');
  });
});

describe('TimeAwareness.describeTimestamp', () => {
  const now = vn(2026, 7, 13, 8, 0); // Mon morning
  it('describes a message from earlier today', () => {
    const d = ta.describeTimestamp(new Date(vn(2026, 7, 13, 1, 30)).toISOString(), now);
    expect(d).toContain('01:30');
    expect(d).toContain('khuya');
    expect(d).toContain('hôm nay');
  });
  it('describes a message from yesterday', () => {
    const d = ta.describeTimestamp(new Date(vn(2026, 7, 12, 20, 0)).toISOString(), now);
    expect(d).toContain('hôm qua');
    expect(d).toContain('tối');
  });
  it('describes a message from hôm kia', () => {
    const d = ta.describeTimestamp(new Date(vn(2026, 7, 11, 15, 0)).toISOString(), now);
    expect(d).toContain('hôm kia');
  });
});

describe('TimeAwareness.inferGap', () => {
  it('infers "mới ngủ dậy" for overnight → morning gap', () => {
    const now = vn(2026, 7, 13, 8, 0);
    const prev = new Date(vn(2026, 7, 13, 1, 30)).toISOString();
    const g = ta.inferGap(prev, now);
    expect(g.toLowerCase()).toContain('mới ngủ dậy');
  });

  it('infers multi-day silence', () => {
    const now = vn(2026, 7, 13, 10, 0);
    const prev = new Date(vn(2026, 7, 10, 10, 0)).toISOString();
    const g = ta.inferGap(prev, now);
    expect(g).toContain('ngày');
  });

  it('returns empty for a short, unremarkable gap', () => {
    const now = vn(2026, 7, 13, 10, 30);
    const prev = new Date(vn(2026, 7, 13, 10, 20)).toISOString();
    expect(ta.inferGap(prev, now)).toBe('');
  });
});
