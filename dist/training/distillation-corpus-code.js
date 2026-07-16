"use strict";
/**
 * Distillation corpus — CODE mastery, basic → advanced → hard.
 *
 * Transfers how Opus-4.8 actually approaches engineering into AgentBrain's
 * learnable stores, so a smaller model (Aira on Sonnet) inherits the THINKING:
 * how to reason about a change, how to debug from evidence, how to test to E2E,
 * and how to know when it is actually done. Teacher-authored reasoning, not
 * canned answers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPUS_DISTILLATION_CODE = void 0;
const playbooks = [
    // ── BASIC: understand before you touch ──────────────────────────────────
    {
        playbook: {
            id: 'distilled-code-read-before-write',
            label: 'Read and understand code before changing it',
            matchAll: ['\\b(code|hàm|function|sửa|fix|edit|thêm|add|change|đổi|implement|viết|write|refactor|feature|tính năng)\\b'],
            matchAny: ['\\b(sao|thế nào|how|help|giúp|làm|làm sao|bắt đầu|start)\\b'],
            suggestions: [
                'Open and read the target file + its callers/tests before editing anything',
                'Identify the existing pattern (naming, error handling, libs) and match it',
                'State what the code does now, then what it should do, then the smallest change to get there',
            ],
            reasoningFrame: [
                'Understand -> locate the exact spot -> smallest correct change -> verify',
                'Match the codebase; do not introduce a new style/library when one exists',
            ],
            verificationChecks: [
                'Did I read the actual file (not guess its contents)?',
                'Does my change follow the existing conventions?',
                'What is the smallest edit that fully solves it?',
            ],
            sourcePlan: ['Read the file, its imports, its callers, and any test that covers it'],
            answerContract: ['Explain the change + why, then show the concrete diff/code'],
            evidenceRules: ['Base edits on code actually read, never on assumed contents'],
            cautions: ['Do not rewrite working code for style; do not add deps casually'],
            uncertaintySignals: ['unfamiliar module', 'no test covering the area', 'unclear requirement'],
            approach: 'Read -> locate -> match conventions -> smallest change -> verify build/tests',
            intentAnchors: [
                'thêm tính năng này vào code',
                'sửa giúp anh hàm này',
                'viết code cho phần này',
                'implement cái này thế nào',
            ],
        },
        probes: ['thêm tính năng vào code', 'sửa hàm này giúp anh', 'viết code phần này'],
    },
    // ── DEBUG: from evidence, not guessing ──────────────────────────────────
    {
        playbook: {
            id: 'distilled-debug-from-evidence',
            label: 'Debug from evidence: reproduce → read the real error → isolate → fix root cause',
            matchAll: ['\\b(bug|lỗi|error|fail|failing|crash|broken|hỏng|không chạy|sập|exception|stack ?trace|undefined|null|500|nan|vỡ|trắng)\\b'],
            matchAny: ['\\b(fix|sửa|debug|sao|why|tại sao|khắc phục|lỗi gì|không hiểu)\\b'],
            suggestions: [
                'Reproduce first; a bug you cannot reproduce, you cannot confirm fixed',
                'Read the ACTUAL error message + stack trace top frame; do not guess the cause',
                'Bisect: shrink to the smallest failing case; add a log/assert at the boundary',
                'Fix the root cause, not the symptom; then add a test that would have caught it',
            ],
            reasoningFrame: [
                'Reproduce -> read real error -> form ONE hypothesis -> test it -> isolate -> root-cause fix -> regression test',
                'If two fixes fail, stop patching: re-read the error and question the assumption',
            ],
            verificationChecks: [
                'Can I reproduce it deterministically?',
                'Does the stack trace / error text actually point where I think?',
                'Did I fix the cause (so it cannot recur) or just hide the symptom?',
                'Is there now a test that fails before the fix and passes after?',
            ],
            sourcePlan: ['Run it, read logs/stack trace, inspect the failing line and its inputs'],
            answerContract: ['State root cause in one line, the fix, and the regression test'],
            evidenceRules: ['Trust the actual error output over intuition; verify inputs at the failure point'],
            cautions: ['Do not shotgun-change many things; do not claim fixed without re-running'],
            uncertaintySignals: ['cannot reproduce', 'error is swallowed', 'heisenbug/timing', 'works locally only'],
            approach: 'Reproduce -> read real error -> hypothesis -> isolate -> root-cause fix -> add regression test -> re-run',
            intentAnchors: [
                'code bị lỗi 500 fix giúp anh',
                'tự nhiên crash không rõ lý do',
                'trang trắng bóc console báo lỗi',
                'debug giúp anh cái này tại sao fail',
            ],
        },
        probes: ['API lỗi 500 fix giúp anh', 'build crash không rõ lý do', 'debug tại sao fail'],
    },
    // ── E2E TESTING: prove it works end to end ──────────────────────────────
    {
        playbook: {
            id: 'distilled-e2e-testing',
            label: 'Test to done: unit → integration → E2E through the real path',
            matchAll: ['\\b(test|kiểm tra|verify|xong|done|chạy được|hoạt động|e2e|end.to.end|qa|kiểm thử|chắc chưa)\\b'],
            matchAny: ['\\b(chưa|đủ|ổn|pass|xong chưa|test kỹ|đảm bảo|thật sự|verify)\\b'],
            suggestions: [
                'Do not claim done until the build compiles AND tests pass AND you ran the real flow',
                'Write a test that FAILS before your change and PASSES after (proves it does something)',
                'E2E: drive the real entrypoint (HTTP request, CLI command, UI click), not just the unit',
                'Cover the unhappy path: empty, invalid, error, timeout, permission-denied',
            ],
            reasoningFrame: [
                'Unit (logic) -> integration (wired modules) -> E2E (real entrypoint, real data path)',
                'A feature with no failing-then-passing test is unproven, not done',
            ],
            verificationChecks: [
                'Does the build/compile pass with zero errors?',
                'Is there a test that exercises THIS behavior end to end?',
                'Did I run the actual flow and observe the expected output?',
                'Are error/edge cases tested, not just the happy path?',
            ],
            sourcePlan: ['Find the test runner + how the app is actually invoked; run both'],
            answerContract: ['Report what was tested, the command, the result, and any gap'],
            evidenceRules: ['"Done" requires observed passing output, not belief it should work'],
            cautions: ['Do not delete/skip a failing test to go green; fix the cause'],
            uncertaintySignals: ['no test framework', 'cannot run the app', 'flaky test', 'untested error path'],
            approach: 'Build -> unit -> integration -> E2E real path -> edge cases -> report evidence',
            intentAnchors: [
                'xong chưa em code chạy được chưa',
                'test kỹ lại đầy đủ chưa',
                'kiểm tra E2E giúp anh',
                'chắc chạy được chưa kiểm tra lại đã',
            ],
        },
        probes: ['xong chưa code chạy được chưa', 'test kỹ đầy đủ chưa', 'kiểm tra E2E giúp anh'],
    },
    // ── ADVANCED: design the change, not just write it ──────────────────────
    {
        playbook: {
            id: 'distilled-design-before-code',
            label: 'Design non-trivial changes: interfaces, data flow, failure modes first',
            matchAll: ['\\b(thiết kế|design|kiến trúc|architecture|hệ thống|system|api|module|schema|database|refactor|migrate|pipeline|tích hợp|integrate)\\b'],
            matchAny: ['\\b(lớn|phức tạp|toàn bộ|end.to.end|từ đầu|scale|mở rộng|làm sao|nên)\\b'],
            suggestions: [
                'Define the interface/contract and data shapes before writing the body',
                'Sketch the data flow and where it can fail (network, null, race, partial write)',
                'Choose the boring, well-supported approach; justify any new dependency',
                'Plan for observability: how will you know it works and when it breaks?',
            ],
            reasoningFrame: [
                'Contract -> data flow -> failure modes -> smallest cohesive implementation -> tests',
                'Optimize for correctness + maintainability first; performance only where measured',
            ],
            verificationChecks: [
                'Is the interface clear and minimal?',
                'What are the failure modes and are they handled?',
                'Does this fit the existing architecture or fight it?',
            ],
            sourcePlan: ['Read adjacent modules + how similar features are already built here'],
            answerContract: ['Give the design (contract + flow + risks) before/with the code'],
            evidenceRules: ['Ground the design in how this codebase already does things'],
            cautions: ['Avoid premature abstraction and speculative generality'],
            uncertaintySignals: ['multiple valid designs', 'unclear scale needs', 'cross-cutting change'],
            approach: 'Contract -> data flow -> failure modes -> cohesive impl -> tests -> observability',
            intentAnchors: [
                'thiết kế lại kiến trúc hệ thống',
                'lên kế hoạch migrate database',
                'dựng pipeline CI/CD từ đầu',
                'tích hợp module này vào hệ thống',
            ],
        },
        probes: ['thiết kế kiến trúc hệ thống', 'migrate database phức tạp', 'dựng pipeline từ đầu'],
    },
    // ── HARD: performance / concurrency / correctness under stress ──────────
    {
        playbook: {
            id: 'distilled-hard-perf-concurrency',
            label: 'Hard problems: measure performance, reason about concurrency, prove correctness',
            matchAll: ['\\b(chậm|slow|performance|hiệu năng|tối ưu|optimize|memory|rò rỉ|leak|race|đồng thời|concurrency|async|deadlock|nghẽn|bottleneck|scale|tải)\\b'],
            matchAny: ['\\b(sao|tại sao|why|làm sao|fix|khắc phục|cải thiện|nhanh hơn)\\b'],
            suggestions: [
                'Measure before optimizing: profile to find the real hotspot; never guess',
                'For concurrency: identify shared mutable state, then the invariant that must hold',
                'Reason about ordering: what happens if two operations interleave or one fails midway?',
                'Prefer algorithmic wins (O(n^2)->O(n log n)) over micro-optimizations',
            ],
            reasoningFrame: [
                'Measure -> find the true bottleneck -> fix the biggest one -> re-measure -> repeat',
                'Concurrency: shared state -> invariant -> atomicity/ordering -> failure-midway behavior',
            ],
            verificationChecks: [
                'Do I have a measurement proving where time/memory goes?',
                'For concurrent code: what is shared, and what invariant protects it?',
                'What happens on partial failure / retry / out-of-order execution?',
                'Did the fix actually move the measured number?',
            ],
            sourcePlan: ['Profile/benchmark the real workload; read the hot path and its data structures'],
            answerContract: ['Show the measurement, the specific change, and the after-measurement'],
            evidenceRules: ['Optimize against profiler data, not hunches; prove the gain with numbers'],
            cautions: ['No premature optimization; do not trade correctness for speed silently'],
            uncertaintySignals: ['cannot reproduce load', 'nondeterministic timing', 'unclear invariant'],
            approach: 'Measure -> locate hotspot -> targeted fix -> re-measure; concurrency: state->invariant->ordering->failure',
            intentAnchors: [
                'app chạy chậm tối ưu giúp anh',
                'bị memory leak fix sao',
                'có race condition không xử lý thế nào',
                'scale hệ thống này lên thế nào',
            ],
        },
        probes: ['app chạy chậm tối ưu', 'memory leak fix sao', 'race condition xử lý thế nào'],
    },
];
const lessons = [
    {
        type: 'anti-pattern', trigger: 'sửa bug', wrong: 'đoán nguyên nhân rồi vá đại nhiều chỗ cho tới khi hết lỗi',
        right: 'reproduce, đọc lỗi thật + stack trace, cô lập root cause, sửa đúng chỗ, thêm test regression', confidence: 0.9,
    },
    {
        type: 'correction', trigger: 'xong chưa / done', wrong: 'nói "xong rồi" khi chưa build/chạy test/chạy thật',
        right: 'chỉ nói xong khi build pass + test pass + đã chạy luồng thật thấy đúng output', confidence: 0.92,
    },
    {
        type: 'anti-pattern', trigger: 'viết code mới', wrong: 'tự bịa nội dung file rồi sửa mà chưa đọc code thật',
        right: 'đọc file + caller + test trước, theo đúng convention có sẵn, sửa nhỏ nhất', confidence: 0.88,
    },
    {
        type: 'workflow', trigger: 'test tính năng mới', wrong: 'chỉ test happy path',
        right: 'test cả unhappy path: rỗng, sai, lỗi, timeout, không có quyền; viết test fail-trước-pass-sau', confidence: 0.85,
    },
    {
        type: 'anti-pattern', trigger: 'tối ưu hiệu năng', wrong: 'tối ưu theo cảm tính chỗ không phải bottleneck',
        right: 'đo/profile trước, sửa hotspot lớn nhất, đo lại chứng minh cải thiện bằng số', confidence: 0.85,
    },
    {
        type: 'anti-pattern', trigger: 'test bị fail', wrong: 'xóa hoặc skip test cho xanh',
        right: 'test fail là tín hiệu thật — sửa nguyên nhân, không bao giờ tắt test để qua', confidence: 0.9,
    },
];
const procedures = [
    { trigger: 'trước khi nói code xong', action: 'chạy build/compile + test suite + luồng thật, dán kết quả', tags: ['code', 'verify', 'e2e'] },
    { trigger: 'gặp bug', action: 'reproduce → đọc stack trace → 1 giả thuyết → cô lập → sửa root cause → test regression', tags: ['debug'] },
    { trigger: 'nhận task code lạ', action: 'đọc file + import + caller + test có sẵn trước khi sửa; theo convention repo', tags: ['code'] },
    { trigger: 'app chậm', action: 'profile tìm hotspot thật → sửa cái lớn nhất → đo lại; ưu tiên thắng thuật toán', tags: ['performance'] },
];
const commonErrors = [
    {
        context: 'debug lỗi runtime', mistake: 'đổi nhiều thứ cùng lúc rồi không biết cái nào fix',
        rootCause: 'không cô lập biến số, không đọc lỗi thật', fix: 'đổi một thứ một lần, đọc stack trace, reproduce tối thiểu', tags: ['debug'],
    },
    {
        context: 'khẳng định đã xong', mistake: 'báo done nhưng chưa chạy build/test',
        rootCause: 'tin là "chắc chạy được"', fix: 'luôn build + test + chạy thật trước khi nói xong', tags: ['verify', 'e2e'],
    },
    {
        context: 'viết test', mistake: 'test luôn pass kể cả khi code sai (test rỗng nghĩa)',
        rootCause: 'không kiểm tra test có thực sự fail khi code hỏng', fix: 'đảm bảo test fail trước khi sửa, pass sau khi sửa', tags: ['testing'],
    },
    {
        context: 'code bất đồng bộ / đồng thời', mistake: 'giả định thứ tự chạy tuần tự',
        rootCause: 'không xét interleaving + lỗi giữa chừng', fix: 'xác định shared state + invariant + hành vi khi fail giữa chừng', tags: ['concurrency'],
    },
];
exports.OPUS_DISTILLATION_CODE = {
    playbooks,
    lessons,
    procedures,
    commonErrors,
};
//# sourceMappingURL=distillation-corpus-code.js.map