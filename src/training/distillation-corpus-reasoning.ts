/**
 * Distillation corpus — CODE COMPREHENSION + RESPONSE REASONING.
 *
 * Two weak spots for smaller models:
 *  1. Reading/understanding code they did not write (tracing behavior, spotting
 *     the real bug, explaining what a snippet does, reviewing a diff).
 *  2. The quality of the thinking BEFORE the answer — decomposing, weighing
 *     evidence, structuring a response, knowing when to ask vs act.
 * This transfers how Opus-4.8 reasons about both.
 */

import type { DistillationCorpus, DistilledPlaybook, DistilledLesson, DistilledProcedure, DistilledError } from './distillation-corpus.js';

const playbooks: DistilledPlaybook[] = [
  // ── CODE COMPREHENSION: read & trace before judging ─────────────────────
  {
    playbook: {
      id: 'distilled-code-comprehension',
      label: 'Read code by tracing behavior: inputs → state → outputs, then spot the real defect',
      matchAll: ['\\b(đọc|hiểu|giải thích|explain|trace|đoạn code|snippet|hàm này|function|làm gì|what does|review|diff|pr)\\b'],
      matchAny: ['\\b(làm gì|nghĩa là|hoạt động|ra sao|bug|sai|đúng không|có vấn đề|hiểu|giải thích|xem)\\b'],
      suggestions: [
        'Trace concrete inputs through the code step by step; track how state changes',
        'State what it ACTUALLY does (from the code) before saying what it should do',
        'Find the defect by comparing observed behavior to intended contract, not by pattern-guessing',
        'Note side effects, mutations, async ordering, and boundary values while tracing',
      ],
      reasoningFrame: [
        'Contract (what it should do) -> trace real inputs -> observed behavior -> gap = the bug',
        'Understand the whole snippet before commenting; do not judge a line in isolation',
      ],
      verificationChecks: [
        'Did I trace at least one concrete input all the way through?',
        'Can I state the exact line + reason where behavior diverges from intent?',
        'Did I account for edge inputs, mutation, and async/order effects?',
      ],
      sourcePlan: ['Read the full snippet + the types/contracts it depends on before explaining'],
      answerContract: ['Explain what it does, then the specific bug + why, with the line'],
      evidenceRules: ['Base the explanation on tracing the actual code, not on what similar code usually does'],
      cautions: ['Do not guess intent; do not skim and pattern-match a "typical" bug'],
      uncertaintySignals: ['hidden dependency', 'unclear intended contract', 'effect outside the snippet'],
      approach: 'Contract -> trace inputs -> observed behavior -> locate divergence -> explain with the line',
      intentAnchors: [
        'đọc giúp anh đoạn code này làm gì',
        'giải thích hàm này hoạt động ra sao',
        'code này có bug ở đâu không',
        'review diff này giúp anh',
      ],
    },
    probes: ['đọc đoạn code này làm gì', 'giải thích hàm này', 'code này bug ở đâu'],
  },

  // ── RESPONSE REASONING: think before you answer ─────────────────────────
  {
    playbook: {
      id: 'distilled-response-reasoning',
      label: 'Reason before responding: understand the ask, decompose, weigh evidence, structure the reply',
      matchAll: ['\\b(nên|sao|thế nào|how|tại sao|why|phân tích|analyze|so sánh|compare|đánh giá|evaluate|nghĩ|suy nghĩ|reasoning|trả lời)\\b'],
      matchAny: ['\\b(nên|hay|hơn|tốt hơn|chọn|quyết định|phân tích|đánh giá|vì sao|lý do)\\b'],
      suggestions: [
        'First restate the real question + success criteria; answer THAT, not a nearby easier one',
        'Decompose into sub-questions; answer each from evidence, then synthesize',
        'Separate fact from assumption; flag the assumptions you are making',
        'Structure: direct answer first, then the reasoning + tradeoffs; match depth to the question',
      ],
      reasoningFrame: [
        'Understand ask -> decompose -> gather evidence per part -> weigh tradeoffs -> conclude -> structure clearly',
        'A good answer states its confidence and what would change it',
      ],
      verificationChecks: [
        'Am I answering the ACTUAL question and its success criteria?',
        'Did I separate facts from assumptions and state confidence?',
        'Is the structure clear (answer -> why -> tradeoffs), depth matched to the ask?',
      ],
      sourcePlan: ['Gather the specific facts each sub-question needs before concluding'],
      answerContract: ['Lead with the direct answer, then reasoning + tradeoffs + confidence'],
      evidenceRules: ['Ground each claim; do not assert preferences as facts'],
      cautions: ['Do not ramble; do not hedge everything; do not answer an easier substitute question'],
      uncertaintySignals: ['ambiguous ask', 'missing key fact', 'multiple valid answers'],
      approach: 'Restate ask -> decompose -> evidence per part -> weigh -> conclude with confidence -> structure',
      intentAnchors: [
        'theo em nên chọn cái nào',
        'phân tích giúp anh vấn đề này',
        'so sánh 2 hướng này rồi khuyên anh',
        'em nghĩ sao về cách này',
      ],
    },
    probes: ['nên chọn cái nào', 'phân tích vấn đề này', 'so sánh 2 hướng rồi khuyên anh'],
  },

  // ── HARD: critique own answer, self-correct ─────────────────────────────
  {
    playbook: {
      id: 'distilled-self-critique',
      label: 'Self-critique before finalizing: attack your own answer, fix the weakest part',
      matchAll: ['\\b(chắc chưa|đúng chưa|kiểm tra lại|review|self.?check|chắc chắn|verify|đảm bảo|lại|double.?check)\\b'],
      matchAny: ['\\b(chắc|đúng|sai|ổn|lại|kỹ|đảm bảo|tự tin|chắc chắn)\\b'],
      suggestions: [
        'Before sending, ask: how could this be wrong? what did I assume? what edge did I skip?',
        'Find the single weakest link in the answer and shore it up or flag it',
        'If a claim carries a number/fact, re-check its source or mark it unverified',
        'Prefer "here is my answer + the one risk I am unsure about" over false confidence',
      ],
      reasoningFrame: [
        'Draft -> red-team it (assumptions, edges, sources) -> fix weakest part -> state residual risk',
        'Confidence should track evidence, not tone',
      ],
      verificationChecks: [
        'What is the weakest assumption in my answer?',
        'Did I check the facts/numbers I stated?',
        'Have I named the one thing most likely to be wrong?',
      ],
      sourcePlan: ['Re-verify any load-bearing fact before finalizing'],
      answerContract: ['Give the answer + the residual risk / what would change it'],
      evidenceRules: ['Downgrade confidence when evidence is thin; never fake certainty'],
      cautions: ['Do not ship the first draft on hard questions without a self-pass'],
      uncertaintySignals: ['load-bearing assumption', 'unverified number', 'high-stakes claim'],
      approach: 'Draft -> red-team (assume/edge/source) -> fix weakest -> state residual risk',
      intentAnchors: [
        'chắc chưa em, kiểm tra lại đi',
        'em tự tin câu trả lời này không',
        'review lại giúp anh xem có sai gì không',
        'đảm bảo đúng chưa',
      ],
    },
    probes: ['chắc chưa kiểm tra lại', 'tự tin câu trả lời này không', 'review lại có sai gì không'],
  },
];

const lessons: DistilledLesson[] = [
  {
    type: 'anti-pattern', trigger: 'đọc/review code', wrong: 'lướt qua rồi đoán bug kiểu "thường gặp"',
    right: 'trace input thật qua từng bước, đối chiếu behavior với contract, chỉ đúng dòng phân kỳ', confidence: 0.88,
  },
  {
    type: 'workflow', trigger: 'câu hỏi phân tích/nên chọn gì', wrong: 'trả lời chung chung, gật theo, hoặc lan man',
    right: 'nêu lại đúng câu hỏi + tiêu chí, chia nhỏ, cân tradeoff bằng bằng chứng, kết luận + độ tự tin', confidence: 0.86,
  },
  {
    type: 'preference', trigger: 'trước khi chốt câu trả lời khó', wrong: 'gửi bản nháp đầu tiên với vẻ chắc nịch',
    right: 'tự red-team: giả định nào yếu, cạnh nào bỏ sót, số nào chưa verify; nói rõ rủi ro còn lại', confidence: 0.85,
  },
  {
    type: 'correction', trigger: 'giải thích code', wrong: 'nói code "nên" làm gì thay vì nó ĐANG làm gì',
    right: 'mô tả hành vi thực tế từ code trước, rồi mới so với ý định', confidence: 0.84,
  },
];

const procedures: DistilledProcedure[] = [
  { trigger: 'đọc code lạ tìm bug', action: 'trace 1 input cụ thể → theo dõi state → so với contract → chỉ dòng phân kỳ', tags: ['code', 'comprehension'] },
  { trigger: 'trả lời câu hỏi phân tích', action: 'nêu lại ask + tiêu chí → chia nhỏ → evidence từng phần → kết luận + độ tự tin', tags: ['reasoning'] },
  { trigger: 'trước khi chốt câu khó', action: 'red-team chính mình: giả định yếu, edge bỏ sót, fact chưa verify → nói rủi ro còn lại', tags: ['reasoning', 'verify'] },
];

const commonErrors: DistilledError[] = [
  {
    context: 'review/đọc code người khác', mistake: 'phán bug sai vì không trace, chỉ nhìn pattern',
    rootCause: 'không đọc hết + không chạy thử input', fix: 'trace input thật qua code, đối chiếu behavior với ý định', tags: ['comprehension'],
  },
  {
    context: 'trả lời câu hỏi mở/tư vấn', mistake: 'lan man hoặc gật theo cho vừa lòng',
    rootCause: 'không xác định tiêu chí thành công + không tách fact/assumption', fix: 'answer trước, reasoning + tradeoff sau, nêu độ tự tin', tags: ['reasoning'],
  },
  {
    context: 'câu trả lời quan trọng', mistake: 'tự tin giả tạo, không tự kiểm',
    rootCause: 'bỏ qua bước self-critique', fix: 'red-team bản nháp, sửa mắt xích yếu nhất, nêu rủi ro còn lại', tags: ['reasoning', 'verify'],
  },
];

export const OPUS_DISTILLATION_REASONING: Pick<DistillationCorpus, 'playbooks' | 'lessons' | 'procedures' | 'commonErrors'> = {
  playbooks,
  lessons,
  procedures,
  commonErrors,
};
