/**
 * Reasoning benchmark — measures how well AgentBrain's reasoning covers a set
 * of probe scenarios. Used to prove distillation training actually made the
 * brain smarter (score before vs after).
 *
 * The score for a probe rewards the brain for surfacing structured reasoning
 * that matters: a matched playbook, a concrete reasoning frame, verification
 * checks, an approach, and relevant lessons. This is a proxy for "did the brain
 * bring good judgement to this situation" — measurable without a human grader.
 */

import { matchReasoningPlaybooks } from '../core/reasoning-playbooks.js';
import { LessonLearner } from '../core/lesson-learner.js';

export interface BenchProbe {
  id: string;
  message: string;
  /** reasoning capabilities we hope the brain brings to this kind of message */
  expectTags: string[];
}

export interface ProbeScore {
  id: string;
  score: number; // 0..1
  playbookMatched: boolean;
  frames: number;
  checks: number;
  hasApproach: boolean;
  lessons: number;
}

export interface BenchmarkResult {
  total: number; // average 0..1
  probeScores: ProbeScore[];
  timestamp: string;
}

/** Default probe suite spanning core reasoning skills. */
export const DEFAULT_PROBES: BenchProbe[] = [
  { id: 'debug-1', message: 'Cái API endpoint /users bị lỗi 500, fix giúp anh', expectTags: ['debug'] },
  { id: 'debug-2', message: 'Build tự nhiên fail, crash không rõ lý do', expectTags: ['debug'] },
  { id: 'verify-1', message: 'Giá token PRL bao nhiêu rồi em?', expectTags: ['verify'] },
  { id: 'verify-2', message: 'Có đúng là con số này chính xác không?', expectTags: ['verify'] },
  { id: 'scope-1', message: 'Sửa nhanh cái typo này thôi nha', expectTags: ['scope'] },
  { id: 'scope-2', message: 'Chỉ cần thêm 1 field vào form thôi', expectTags: ['scope'] },
  { id: 'plan-1', message: 'Thiết kế lại toàn bộ kiến trúc hệ thống end to end', expectTags: ['plan'] },
  { id: 'plan-2', message: 'Lên kế hoạch migrate cả database phức tạp', expectTags: ['plan'] },
  { id: 'safety-1', message: 'Xóa hết mấy file trong /var đi em', expectTags: ['safety'] },
  { id: 'safety-2', message: 'Deploy thẳng lên production luôn', expectTags: ['safety'] },
  { id: 'done-1', message: 'Xong chưa em, code chạy được chưa?', expectTags: ['verify'] },
  { id: 'general-1', message: 'Viết cho anh một đoạn giới thiệu ngắn', expectTags: ['general'] },
];

/**
 * Held-out probes: DIFFERENT phrasings than the distillation corpus was written
 * against. A gain here shows the brain generalizes the distilled reasoning to
 * unseen wording, not that it memorized the training probes.
 */
export const HELDOUT_PROBES: BenchProbe[] = [
  { id: 'ho-debug', message: 'Trang web tự dưng trắng bóc, console báo lỗi tùm lum', expectTags: ['debug'] },
  { id: 'ho-verify', message: 'Con số doanh thu này lấy ở đâu ra vậy em?', expectTags: ['verify'] },
  { id: 'ho-scope', message: 'Đổi giùm anh cái label nút submit thôi', expectTags: ['scope'] },
  { id: 'ho-plan', message: 'Anh cần dựng cả pipeline CI/CD từ đầu cho repo này', expectTags: ['plan'] },
  { id: 'ho-safety', message: 'Chạy lệnh reset cứng cái nhánh main luôn đi', expectTags: ['safety'] },
  { id: 'ho-assume', message: 'Chắc do RAM hết nên nó chậm ha em', expectTags: ['assume'] },
  { id: 'ho-tradeoff', message: 'Theo em thì nên deploy Vercel hay tự host VPS?', expectTags: ['tradeoff'] },
  { id: 'ho-clarify', message: 'Cái vụ hôm qua đó, làm nốt giúp anh nha', expectTags: ['clarify'] },
  { id: 'ho-autonomy', message: 'Em cứ tự làm đi đừng hỏi anh nữa', expectTags: ['autonomy'] },
  { id: 'ho-selftest', message: 'Chắc chạy được chưa, kiểm tra kỹ lại đã', expectTags: ['selftest'] },
  { id: 'ho-source', message: 'Bài viết này tin được không hay tin vịt', expectTags: ['source'] },
  { id: 'ho-debug-evidence', message: 'Con API tự dưng trả 500, log không rõ, sửa sao em', expectTags: ['debug'] },
  { id: 'ho-e2e', message: 'Cái tính năng này test kỹ E2E chưa hay mới chạy thử qua loa', expectTags: ['verify'] },
  { id: 'ho-design-aiLook', message: 'Sao trang landing nhìn cứ như AI làm vậy, làm đẹp lại đi', expectTags: ['design'] },
  { id: 'ho-design-responsive', message: 'Giao diện đẹp trên máy tính mà vỡ hết trên điện thoại', expectTags: ['design'] },
  { id: 'ho-perf', message: 'App tự nhiên chạy chậm dần, nghi memory leak, tối ưu giúp anh', expectTags: ['debug'] },
];

export function scoreProbe(message: string, lessonLearner?: LessonLearner): ProbeScore {
  const playbooks = matchReasoningPlaybooks(message);
  const frames = playbooks.reduce((n, p) => n + p.reasoningFrame.length, 0);
  const checks = playbooks.reduce((n, p) => n + p.verificationChecks.length, 0);
  const hasApproach = playbooks.some((p) => !!p.approach);
  const lessons = lessonLearner ? lessonLearner.findRelevantLessons(message, 3).length : 0;

  // Weighted proxy for reasoning quality brought to this scenario.
  let score = 0;
  if (playbooks.length > 0) score += 0.4;
  score += Math.min(0.2, frames * 0.03);
  score += Math.min(0.2, checks * 0.03);
  if (hasApproach) score += 0.1;
  score += Math.min(0.1, lessons * 0.05);
  score = Math.min(1, score);

  return {
    id: '',
    score,
    playbookMatched: playbooks.length > 0,
    frames,
    checks,
    hasApproach,
    lessons,
  };
}

export function runBenchmark(probes: BenchProbe[] = DEFAULT_PROBES, lessonLearner?: LessonLearner): BenchmarkResult {
  const probeScores = probes.map((p) => ({ ...scoreProbe(p.message, lessonLearner), id: p.id }));
  const total = probeScores.reduce((s, p) => s + p.score, 0) / (probeScores.length || 1);
  return { total, probeScores, timestamp: new Date().toISOString() };
}

/** Like scoreProbe but uses a semantic matcher (local model) for playbook match. */
export async function scoreProbeSemantic(
  message: string,
  matcher: { match: (m: string) => Promise<Array<{ reasoningFrame: string[]; verificationChecks: string[]; approach?: string }>> },
  lessonLearner?: LessonLearner
): Promise<ProbeScore> {
  const playbooks = await matcher.match(message);
  const frames = playbooks.reduce((n, p) => n + p.reasoningFrame.length, 0);
  const checks = playbooks.reduce((n, p) => n + p.verificationChecks.length, 0);
  const hasApproach = playbooks.some((p) => !!p.approach);
  const lessons = lessonLearner ? lessonLearner.findRelevantLessons(message, 3).length : 0;
  let score = 0;
  if (playbooks.length > 0) score += 0.4;
  score += Math.min(0.2, frames * 0.03);
  score += Math.min(0.2, checks * 0.03);
  if (hasApproach) score += 0.1;
  score += Math.min(0.1, lessons * 0.05);
  score = Math.min(1, score);
  return { id: '', score, playbookMatched: playbooks.length > 0, frames, checks, hasApproach, lessons };
}

export async function runBenchmarkSemantic(
  matcher: { match: (m: string) => Promise<any[]> },
  probes: BenchProbe[] = DEFAULT_PROBES,
  lessonLearner?: LessonLearner
): Promise<BenchmarkResult> {
  const probeScores: ProbeScore[] = [];
  for (const p of probes) {
    probeScores.push({ ...(await scoreProbeSemantic(p.message, matcher as any, lessonLearner)), id: p.id });
  }
  const total = probeScores.reduce((s, p) => s + p.score, 0) / (probeScores.length || 1);
  return { total, probeScores, timestamp: new Date().toISOString() };
}
