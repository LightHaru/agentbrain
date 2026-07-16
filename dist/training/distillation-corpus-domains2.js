"use strict";
/**
 * Domain distillation corpus — batch 2. More high-quality Opus-4.8 reasoning
 * across security, testing, git safety, data handling, writing, and estimation.
 * Same format; merged into training so AgentBrain keeps getting smarter over time.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPUS_DISTILLATION_DOMAINS2 = void 0;
const playbooks = [
    {
        playbook: {
            id: 'distilled-secrets-hygiene',
            label: 'Protect secrets and credentials',
            matchAll: ['\\b(key|secret|token|password|mật khẩu|credential|api ?key|\\.env|private key|seed phrase|ví|wallet|auth|đăng nhập)\\b'],
            suggestions: [
                'Never echo secret VALUES back; reference them by name (e.g. ANTHROPIC_API_KEY)',
                'Do not commit .env, keys, or credentials; check before staging files',
                'Prefer env vars / secret stores over hardcoding; redact secrets in logs',
                'If a secret may be exposed, flag it and recommend rotation',
            ],
            reasoningFrame: [
                'Touches a secret? -> reference by name, never print the value -> avoid persisting it',
                'A leaked secret is often irreversible; treat exposure as high-severity',
            ],
            verificationChecks: [
                'Am I about to print or commit a secret value?',
                'Is this secret going somewhere it could be logged or pushed?',
            ],
            sourcePlan: ['Read config to confirm the key NAME without surfacing its value'],
            answerContract: ['Reference secrets by name; state any exposure risk + rotation advice'],
            cautions: ['Never paste real key values into chat, code, or commits'],
            uncertaintySignals: ['secret in a file about to be committed', 'unclear if value is sensitive'],
            approach: 'Identify secret -> reference by name -> avoid printing/committing -> flag exposure',
            intentAnchors: [
                'api key để đâu rồi em',
                'commit cái .env này lên giúp anh',
                'lưu cái private key của ví vào đâu',
                'đọc file config có mật khẩu ra cho anh',
            ],
        },
        probes: ['api key để đâu', 'commit file .env lên', 'private key ví lưu đâu'],
    },
    {
        playbook: {
            id: 'distilled-testing-strategy',
            label: 'Choose the right tests for a change',
            matchAll: ['\\b(test|kiểm thử|unit test|integration|e2e|coverage|viết test|test case|mock|assert|ca kiểm thử)\\b'],
            suggestions: [
                'Test behavior and edge cases, not implementation details',
                'Cover the failure the change addresses so it cannot silently regress',
                'Prefer fast deterministic unit tests; add integration/e2e where seams matter',
                'Use the project’s existing framework and conventions',
            ],
            reasoningFrame: [
                'Change -> what could break -> smallest test that would catch it -> add it',
                'A bug fix without a regression test invites the same bug back',
            ],
            verificationChecks: [
                'Does a test now fail without the fix and pass with it?',
                'Are edge cases (empty/null/large/error) covered?',
            ],
            sourcePlan: ['Find the existing test setup/framework before writing new tests'],
            answerContract: ['State what tests were added and what behavior they lock in'],
            cautions: ['Do not test private internals that make refactoring brittle'],
            uncertaintySignals: ['no existing test harness', 'hard-to-isolate behavior'],
            approach: 'Identify risk -> write the smallest catching test -> cover edge cases -> run',
            intentAnchors: [
                'viết test cho hàm này giúp anh',
                'nên test cái này kiểu gì',
                'thêm test case cho phần thanh toán',
                'coverage phần này yếu, bổ sung test đi',
            ],
        },
        probes: ['viết test cho hàm này', 'nên test cái này kiểu gì', 'thêm test case'],
    },
    {
        playbook: {
            id: 'distilled-git-safety',
            label: 'Safe git operations',
            matchAll: ['\\b(git|commit|push|branch|merge|rebase|reset|force|revert|pull request|pr|checkout|stash|amend)\\b'],
            suggestions: [
                'Commit only when asked; stage specific files, not git add . blindly',
                'Push to a new branch, never force-push shared branches without permission',
                'Flag files that may contain secrets before committing',
                'Prefer new commits over history rewrites (amend/reset) unless explicitly asked',
            ],
            reasoningFrame: [
                'Git action -> does it rewrite shared history or expose secrets? -> if yes, confirm first',
                'Destructive git (force/reset --hard/clean -f) needs explicit permission',
            ],
            verificationChecks: [
                'Are you staging only the intended files?',
                'Does this rewrite shared history or risk committing secrets?',
            ],
            sourcePlan: ['git status/diff to see exactly what would be committed'],
            answerContract: ['State the git actions taken and confirm nothing destructive was done unasked'],
            cautions: ['No force-push, reset --hard, or history rewrite without explicit consent'],
            uncertaintySignals: ['shared branch', 'possible secret in diff', 'destructive flag requested'],
            approach: 'Inspect diff -> stage intended files -> new branch/commit -> avoid destructive ops',
            intentAnchors: [
                'commit rồi push lên giúp anh',
                'force push lên main đi',
                'reset hard về commit trước',
                'tạo pull request cho nhánh này',
            ],
        },
        probes: ['commit rồi push giúp anh', 'force push lên main', 'reset hard về commit trước'],
    },
    {
        playbook: {
            id: 'distilled-data-integrity',
            label: 'Handle data/spreadsheets/queries carefully',
            matchAll: ['\\b(data|dữ liệu|csv|excel|spreadsheet|sql|query|database|bảng|cột|row|dòng|join|aggregate|thống kê|tính toán|số liệu)\\b'],
            suggestions: [
                'Confirm the schema/columns and units before computing or transforming',
                'Handle nulls, duplicates, and type mismatches explicitly',
                'Validate row counts and spot-check results after a transform',
                'Use parameterized queries; never string-concatenate user input into SQL',
            ],
            reasoningFrame: [
                'Data task -> understand schema+units -> handle nulls/dupes -> compute -> sanity-check totals',
                'A number without a validated derivation is a guess with decimals',
            ],
            verificationChecks: [
                'Did you confirm columns, types, and units?',
                'Did you sanity-check row counts / totals after the transform?',
            ],
            sourcePlan: ['Inspect a sample + schema before running full transforms/queries'],
            answerContract: ['Report the result with how it was derived and any data caveats'],
            evidenceRules: ['Spot-check aggregates against a manual sample before trusting them'],
            cautions: ['Never interpolate untrusted input into SQL; watch for silent null drops'],
            uncertaintySignals: ['unknown schema', 'nulls/dupes present', 'unit ambiguity'],
            approach: 'Confirm schema/units -> clean nulls/dupes -> compute -> sanity-check -> report caveats',
            intentAnchors: [
                'tính tổng doanh thu từ file csv này',
                'viết query lấy dữ liệu người dùng',
                'gộp hai bảng này lại giúp anh',
                'thống kê số liệu từ excel này',
            ],
        },
        probes: ['tính tổng từ file csv', 'viết query lấy dữ liệu', 'gộp hai bảng này'],
    },
    {
        playbook: {
            id: 'distilled-writing-quality',
            label: 'Write clear, audience-appropriate content',
            matchAll: ['\\b(viết|write|bài|blog|content|caption|email|post|mô tả|description|copy|nội dung|tiêu đề|thông báo|soạn)\\b'],
            suggestions: [
                'Clarify audience, goal, tone, and length before writing',
                'Lead with the point; cut filler and vague claims',
                'Use concrete specifics over generic hype; keep claims truthful',
                'Match the requested voice and language exactly',
            ],
            reasoningFrame: [
                'Audience + goal -> key message first -> concrete support -> tight edit',
                'Clarity beats cleverness; every sentence should earn its place',
            ],
            verificationChecks: [
                'Is the audience/goal/tone clear, and does the draft match it?',
                'Did you cut filler and keep claims specific and true?',
            ],
            sourcePlan: ['Ground factual claims in a source; do not invent stats'],
            answerContract: ['Deliver the piece in the requested voice, length, and language'],
            cautions: ['Do not fabricate facts or numbers to sound impressive'],
            uncertaintySignals: ['audience unclear', 'tone unspecified', 'length unspecified'],
            approach: 'Clarify audience/goal/tone -> point first -> concrete support -> tight edit',
            intentAnchors: [
                'viết bài blog giới thiệu sản phẩm',
                'soạn email cho khách hàng',
                'viết caption cho post này',
                'viết mô tả ngắn gọn cho tính năng',
            ],
        },
        probes: ['viết bài blog giới thiệu', 'soạn email cho khách', 'viết caption cho post'],
    },
    {
        playbook: {
            id: 'distilled-estimation-uncertainty',
            label: 'Estimate with explicit uncertainty',
            matchAll: ['\\b(bao lâu|mất bao lâu|ước tính|estimate|khi nào xong|deadline|timeline|chi phí|cost|budget|dự kiến|how long|eta)\\b'],
            suggestions: [
                'Break the work into parts and estimate each, then add buffer for unknowns',
                'State assumptions and the biggest risk to the estimate',
                'Give a range, not false precision; note what would change it',
                'Distinguish effort from calendar time (dependencies, waiting)',
            ],
            reasoningFrame: [
                'Task -> decompose -> estimate parts -> add risk buffer -> range with assumptions',
                'A single-number estimate hides risk; a range with drivers is honest',
            ],
            verificationChecks: [
                'Did you decompose and state assumptions?',
                'Is it a range with the main risk noted, not false precision?',
            ],
            sourcePlan: ['Base estimates on comparable past work when available'],
            answerContract: ['Give a range + assumptions + the biggest risk to the estimate'],
            cautions: ['Do not commit to a precise deadline while key unknowns remain'],
            uncertaintySignals: ['undefined scope', 'external dependencies', 'no comparable baseline'],
            approach: 'Decompose -> estimate parts -> buffer -> range + assumptions + top risk',
            intentAnchors: [
                'cái này làm mất bao lâu',
                'ước tính chi phí giúp anh',
                'khi nào xong được phần này',
                'dự kiến timeline cho dự án',
            ],
        },
        probes: ['cái này làm mất bao lâu', 'ước tính chi phí', 'khi nào xong phần này'],
    },
];
const commonErrors = [
    {
        context: 'xử lý file/biến chứa secret, API key, mật khẩu',
        mistake: 'in thẳng giá trị key ra chat hoặc commit .env lên git',
        rootCause: 'không coi secret là thứ bất khả lộ',
        fix: 'tham chiếu secret bằng TÊN, không in giá trị, không commit; nếu lộ thì cảnh báo xoay key',
        tags: ['security', 'secrets'],
    },
    {
        context: 'sửa bug xong',
        mistake: 'không thêm test hồi quy nên bug quay lại sau này',
        rootCause: 'coi fix là xong mà không khóa lại bằng test',
        fix: 'thêm một test fail-khi-chưa-fix, pass-khi-đã-fix để chặn hồi quy',
        tags: ['testing', 'verification'],
    },
    {
        context: 'thao tác git',
        mistake: 'git add . rồi commit cả file rác/secret, hoặc force push nhánh chung',
        rootCause: 'stage bừa và dùng lệnh phá hủy không xin phép',
        fix: 'stage đúng file cần, push nhánh mới, tránh force/reset khi chưa được phép',
        tags: ['git', 'safety'],
    },
    {
        context: 'tính toán trên dữ liệu/bảng',
        mistake: 'tính ngay mà chưa xác nhận schema/đơn vị, bỏ sót null/trùng',
        rootCause: 'không kiểm tra dữ liệu trước khi biến đổi',
        fix: 'xác nhận cột/đơn vị, xử lý null/trùng, sanity-check tổng số dòng sau transform',
        tags: ['data', 'verification'],
    },
    {
        context: 'viết nội dung cho Sếp',
        mistake: 'viết dài dòng, sáo rỗng, bịa số liệu cho kêu',
        rootCause: 'không xác định audience/goal và không kiểm chứng số',
        fix: 'làm rõ audience/tone, nói ý chính trước, cụ thể + đúng sự thật, cắt filler',
        tags: ['writing'],
    },
    {
        context: 'ước tính thời gian/chi phí',
        mistake: 'phán một con số chính xác giả tạo rồi trễ hẹn',
        rootCause: 'không chia nhỏ và không tính rủi ro/phụ thuộc',
        fix: 'chia nhỏ, ước tính từng phần, cộng buffer, đưa khoảng + giả định + rủi ro lớn nhất',
        tags: ['estimation'],
    },
];
exports.OPUS_DISTILLATION_DOMAINS2 = {
    playbooks,
    commonErrors,
};
//# sourceMappingURL=distillation-corpus-domains2.js.map