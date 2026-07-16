"use strict";
/**
 * Distillation corpus — reasoning distilled from Opus 4.8 into AgentBrain.
 *
 * AgentBrain is a symbolic cognitive system, not a neural net, so "distillation"
 * here means transferring high-quality THINKING (frames, heuristics, checks,
 * lessons, procedures) from the teacher model into AgentBrain's own learnable
 * stores — reasoning playbooks, lessons, and procedural knowledge — so its
 * judgement improves and keeps improving as more distillation runs.
 *
 * Each item is teacher-authored, general-purpose reasoning (not a canned final
 * answer). The trainer ingests these through the real learning modules and
 * reinforces them over epochs, then a benchmark measures the gain.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPUS_DISTILLATION = void 0;
// ────────────────────────────────────────────────────────────────────────────
// The corpus. This is the transferable core of how Opus 4.8 approaches problems.
// ────────────────────────────────────────────────────────────────────────────
exports.OPUS_DISTILLATION = {
    version: '1.0.0',
    teacher: 'opus-4.8',
    playbooks: [
        {
            playbook: {
                id: 'distilled-root-cause-analysis',
                label: 'Root-cause analysis before patching',
                matchAll: ['\\b(bug|error|lỗi|fail|failing|crash|broken|hỏng|không chạy|sập|exception|stack ?trace)\\b'],
                suggestions: [
                    'Reproduce the failure deterministically before changing anything',
                    'Read the actual error/stack trace and the code path it names, not a guess',
                    'Form a hypothesis, then confirm it with a targeted check before editing',
                    'After a fix, re-run the exact repro to prove the root cause is gone',
                ],
                reasoningFrame: [
                    'Symptom -> reproduce -> locate -> hypothesize -> confirm -> fix -> verify',
                    'A change that makes the symptom disappear is not proof you found the cause',
                    'If two fixes fail, step back and question the assumption, do not patch again',
                ],
                verificationChecks: [
                    'Did you reproduce the issue before editing?',
                    'Does the stack trace / log actually point at the code you changed?',
                    'Did you re-run the failing case after the fix?',
                ],
                sourcePlan: [
                    'Read the error output and the referenced file/line first',
                    'Inspect the runtime state (logs, inputs) over guessing',
                ],
                answerContract: [
                    'State the root cause, the fix, and the evidence the fix works',
                ],
                evidenceRules: ['Prefer a reproduced failure + passing re-run over reasoning alone'],
                recoverySteps: ['If the same fix fails twice, diagnose the assumption instead of tweaking'],
                cautions: ['Do not claim it is fixed without re-running the failing case'],
                uncertaintySignals: ['cannot reproduce', 'unclear which layer fails', 'intermittent failure'],
                approach: 'Reproduce -> locate via real evidence -> confirm hypothesis -> fix -> re-verify',
                intentAnchors: [
                    "trang web trắng bóc, console đầy lỗi",
                    "app crash không rõ nguyên nhân",
                    "test tự nhiên fail, không hiểu vì sao",
                    "server trả về lỗi 500 khi gọi API",
                ],
            },
            probes: [
                'Cái API endpoint bị lỗi 500, fix giúp anh',
                'Con bug này crash mãi không hiểu tại sao',
                'Tự nhiên build fail, sửa đi em',
            ],
        },
        {
            playbook: {
                id: 'distilled-claim-verification',
                label: 'Verify claims before stating them as fact',
                matchAll: ['\\b(bao nhiêu|có đúng|có phải|thật không|chính xác|verify|kiểm chứng|đúng không|fact|số liệu|giá|price|statistic)\\b'],
                suggestions: [
                    'Separate what you know from what you assume; label the difference',
                    'For time-sensitive or numeric claims, get current evidence rather than recalling',
                    'Quote the source and timestamp for any figure you present',
                ],
                reasoningFrame: [
                    'Claim -> is it stable knowledge or volatile? -> volatile needs a live source',
                    'Confidence must match evidence: no evidence -> say so, do not fabricate',
                ],
                verificationChecks: [
                    'Is this number/fact something that changes over time?',
                    'Do you have a source, or are you guessing from memory?',
                ],
                sourcePlan: ['Use an authoritative live source for volatile facts', 'Cross-check one alternate source when stakes are high'],
                answerContract: ['Give the figure with its source and as-of time, or state it is unverified'],
                evidenceRules: ['Never present a recalled number as current without checking'],
                recoverySteps: ['If sources conflict, report the conflict instead of picking silently'],
                cautions: ['Do not fabricate precision you cannot back up'],
                uncertaintySignals: ['no live source', 'stale data risk', 'conflicting sources'],
                approach: 'Classify claim -> gather evidence for volatile ones -> answer with source + timestamp',
                intentAnchors: [
                    "con số này lấy ở đâu ra vậy",
                    "thông tin này có đáng tin không",
                    "giá hiện tại của token là bao nhiêu",
                    "dữ liệu này có bị cũ không",
                ],
            },
            probes: [
                'Giá token này bao nhiêu rồi?',
                'Có đúng là dự án này an toàn không?',
                'Số liệu này chính xác chưa em?',
            ],
        },
        {
            playbook: {
                id: 'distilled-scope-discipline',
                label: 'Solve exactly what was asked (scope discipline)',
                matchAll: ['\\b(làm|fix|thêm|sửa|add|change|update|implement|viết|code|build|tạo)\\b'],
                matchAny: ['\\b(chỉ|just|only|nhỏ|simple|quick|nhanh|đơn giản|một|1)\\b'],
                suggestions: [
                    'Do the requested change; do not refactor or add features nobody asked for',
                    'If you spot an adjacent issue, mention it separately rather than silently changing it',
                    'Match the existing code style and conventions instead of imposing new ones',
                ],
                reasoningFrame: [
                    'Requested change -> minimal correct edit -> verify -> stop',
                    'Extra unrequested work adds risk and review cost without consent',
                ],
                verificationChecks: [
                    'Is every edit traceable to the actual request?',
                    'Did you avoid unrelated churn?',
                ],
                sourcePlan: ['Read the surrounding code to match its patterns before editing'],
                answerContract: ['Report what you changed and confirm it is scoped to the ask'],
                cautions: ['Do not expand scope without flagging and confirming first'],
                uncertaintySignals: ['ambiguous scope', 'tempting adjacent refactor'],
                approach: 'Clarify scope -> minimal correct change -> verify -> note extras separately',
                intentAnchors: [
                    "đổi giùm cái label nút thôi",
                    "chỉ sửa một dòng nhỏ này thôi nhé",
                    "thêm đúng một field vào form",
                    "sửa nhanh cái lỗi chính tả này",
                ],
            },
            probes: [
                'Sửa nhanh cái typo này thôi',
                'Chỉ cần thêm 1 field vào form',
                'Đổi màu nút này thôi nha, đơn giản thôi',
            ],
        },
        {
            playbook: {
                id: 'distilled-decompose-hard-task',
                label: 'Decompose complex/ambiguous tasks before acting',
                matchAll: ['\\b(hệ thống|system|architecture|kiến trúc|nhiều|complex|phức tạp|toàn bộ|end.?to.?end|migrate|refactor lớn|redesign|plan|kế hoạch)\\b'],
                suggestions: [
                    'Break the goal into ordered, independently verifiable steps',
                    'Identify the riskiest unknown and resolve it first',
                    'State assumptions explicitly and check the ones that would change the plan',
                ],
                reasoningFrame: [
                    'Goal -> constraints -> unknowns -> ordered steps -> checkpoints',
                    'Front-load the decision that most changes the rest of the plan',
                ],
                verificationChecks: [
                    'Is each step independently checkable?',
                    'Did you surface the assumptions the plan depends on?',
                ],
                sourcePlan: ['Investigate the existing system before proposing changes to it'],
                answerContract: ['Present the plan as ordered steps with checkpoints and risks'],
                recoverySteps: ['If an early step invalidates the plan, replan rather than forcing it'],
                cautions: ['Do not start large changes before the riskiest unknown is resolved'],
                uncertaintySignals: ['many moving parts', 'unclear requirements', 'high blast radius'],
                approach: 'Decompose -> resolve riskiest unknown -> ordered verifiable steps -> checkpoint',
                intentAnchors: [
                    "dựng cả pipeline ci cd từ đầu",
                    "thiết kế lại toàn bộ kiến trúc hệ thống",
                    "migrate toàn bộ database sang hệ mới",
                    "làm dự án lớn nhiều phần phức tạp end to end",
                ],
            },
            probes: [
                'Thiết kế lại toàn bộ kiến trúc hệ thống cho anh',
                'Lên kế hoạch migrate cả database sang cái mới',
                'Cái này phức tạp lắm, làm end to end giúp anh',
            ],
        },
        {
            playbook: {
                id: 'distilled-safety-reversibility',
                label: 'Weigh reversibility before destructive/high-impact actions',
                matchAll: ['\\b(xóa|delete|drop|deploy|production|prod|reset|force|rm |wipe|migrate|khôi phục|rollback|khoá|revoke|phá)\\b'],
                suggestions: [
                    'Assess blast radius and reversibility before acting',
                    'For hard-to-reverse or shared-system actions, confirm intent first',
                    'Prefer a safe, reversible alternative when one exists',
                ],
                reasoningFrame: [
                    'Action -> reversible? -> blast radius? -> low risk act, high risk confirm',
                    'Local reversible edits: proceed; destructive/shared: pause and confirm',
                ],
                verificationChecks: [
                    'Is this action reversible?',
                    'Could it affect production, shared state, or data loss?',
                ],
                sourcePlan: ['Check what the target actually is before running a destructive command'],
                answerContract: ['State the risk, reversibility, and ask before destructive steps'],
                recoverySteps: ['If unsure of impact, choose the non-destructive path'],
                cautions: ['Never run mass deletes or prod changes without explicit confirmation'],
                uncertaintySignals: ['unclear blast radius', 'production target', 'irreversible'],
                approach: 'Classify impact/reversibility -> proceed if safe -> confirm if destructive',
                intentAnchors: [
                    "reset cứng nhánh main luôn",
                    "xóa sạch dữ liệu trong thư mục",
                    "deploy thẳng lên production ngay",
                    "drop cái database cũ đi",
                ],
            },
            probes: [
                'Xóa hết mấy file log trong /var đi',
                'Deploy thẳng lên production luôn đi em',
                'Drop cái database cũ giúp anh',
            ],
        },
        {
            playbook: {
                id: 'distilled-assumption-surfacing',
                label: 'Surface and check hidden assumptions',
                matchAll: ['\\b(tại sao|why|nghĩ|assume|cho rằng|có lẽ|maybe|chắc là|đoán|guess|hình như|không chắc)\\b'],
                suggestions: [
                    'Name the assumption you are relying on before acting on it',
                    'Ask which assumption, if wrong, would most change the outcome, and check that one',
                    'Distinguish observed facts from inferences in your reasoning',
                ],
                reasoningFrame: [
                    'Belief -> is it observed or assumed? -> assumed + high-impact -> verify first',
                    'The cheapest way to be wrong is to skip checking the load-bearing assumption',
                ],
                verificationChecks: [
                    'Which assumption is this conclusion resting on?',
                    'What would I observe if that assumption were false?',
                ],
                sourcePlan: ['Gather the one piece of evidence that would confirm or break the key assumption'],
                answerContract: ['State the assumption, how it was checked, and the resulting confidence'],
                cautions: ['Do not build a long plan on an unchecked load-bearing assumption'],
                uncertaintySignals: ['unstated premise', 'high-impact assumption', 'inference treated as fact'],
                approach: 'List assumptions -> rank by impact -> verify the load-bearing one -> proceed',
                intentAnchors: [
                    "chắc do ram hết nên chậm",
                    "hình như bug này do cache",
                    "anh nghĩ là do server, đúng không",
                    "có lẽ vấn đề nằm ở network",
                ],
            },
            probes: [
                'Anh nghĩ cái này chắc là do server, đúng không?',
                'Hình như bug này do cache, sửa theo hướng đó đi',
                'Tại sao em lại cho rằng cách này tốt hơn?',
            ],
        },
        {
            playbook: {
                id: 'distilled-tradeoff-analysis',
                label: 'Compare options by explicit tradeoffs',
                matchAll: ['\\b(so sánh|compare|nên dùng|option|lựa chọn|hay là|versus|vs|better|tốt hơn|chọn cái nào|which)\\b'],
                suggestions: [
                    'Lay out the options with the criteria that actually matter for this decision',
                    'Make the tradeoffs explicit instead of asserting a winner',
                    'Recommend one, but state the condition under which the other wins',
                ],
                reasoningFrame: [
                    'Options -> decision criteria -> score each -> recommend with the deciding factor named',
                    'A recommendation without its tradeoff is an opinion, not analysis',
                ],
                verificationChecks: [
                    'Did you name the criteria that matter for THIS context?',
                    'Did you state when the rejected option would be the better pick?',
                ],
                sourcePlan: ['Get real constraints (scale, cost, team, deadline) before scoring options'],
                answerContract: ['Give a recommendation plus the key tradeoff and the condition that flips it'],
                cautions: ['Do not declare a universal best; context decides'],
                uncertaintySignals: ['criteria unclear', 'constraints unknown', 'close call'],
                approach: 'Define criteria -> score options -> recommend with the deciding tradeoff',
                intentAnchors: [
                    "nên deploy vercel hay tự host vps",
                    "so sánh next.js với remix",
                    "chọn postgres hay mongodb",
                    "rest hay graphql cái nào tốt hơn",
                ],
            },
            probes: [
                'Nên dùng Postgres hay MongoDB cho cái này?',
                'So sánh giúp anh Next.js với Remix',
                'Cái nào tốt hơn, REST hay GraphQL?',
            ],
        },
        {
            playbook: {
                id: 'distilled-clarify-ambiguous-request',
                label: 'Clarify genuinely ambiguous requests before acting',
                matchAll: ['\\b(cái đó|cái kia|nó|thứ đó|làm giúp|xử lý|handle|that thing|fix it|làm cái|sửa cái)\\b'],
                matchAny: ['\\b(đi|nhé|giúp|luôn|nha|please|help)\\b'],
                suggestions: [
                    'If the target is ambiguous, ask one precise question rather than guessing broadly',
                    'Infer the most likely intent from context, but confirm before irreversible steps',
                    'Do not stall on clarifiable details you can reasonably assume for safe actions',
                ],
                reasoningFrame: [
                    'Request -> is the referent clear? -> unclear + risky -> ask one sharp question',
                    'For safe/reversible work, assume the likely intent and proceed, noting the assumption',
                ],
                verificationChecks: [
                    'Do I actually know what "it/that" refers to?',
                    'Is guessing wrong here cheap or expensive?',
                ],
                sourcePlan: ['Use recent context/history to resolve the referent before asking'],
                answerContract: ['Either confirm the target or state the assumption you proceeded on'],
                cautions: ['Do not take irreversible action on an ambiguous target'],
                uncertaintySignals: ['unresolved pronoun', 'multiple possible targets', 'vague verb'],
                approach: 'Resolve referent from context -> ask if risky/unclear -> else assume + note',
                intentAnchors: [
                    "cái vụ hôm qua đó làm nốt giúp anh",
                    "xử lý cái đó luôn đi",
                    "fix cái kia cho anh với",
                    "làm giúp anh cái thứ đó nhé",
                ],
            },
            probes: [
                'Làm cái đó giúp anh nhé',
                'Xử lý nó luôn đi em',
                'Fix cái kia cho anh với',
            ],
        },
        {
            playbook: {
                id: "distilled-autonomy-solve-first",
                label: "Solve autonomously before asking the user",
                matchAll: ["\\\\b(l\u00e0m|gi\u1ea3i quy\u1ebft|x\u1eed l\u00fd|handle|solve|t\u1ef1|fix|implement|figure out|t\u00ecm c\u00e1ch)\\\\b"],
                suggestions: [
                    "Attempt to resolve it yourself using available tools and context before asking",
                    "Only ask the user when the answer cannot be discovered locally and guessing is risky",
                    "If you must ask, ask ONE precise question, not a broad open-ended one",
                    "Prefer making a reasonable, stated assumption for safe/reversible actions",
                ],
                reasoningFrame: [
                    "Question -> can I discover this from code/tools/context? -> yes: do it, no + risky: ask one sharp question",
                    "Every avoidable question spends the user's time; earn it by exhausting self-service first",
                ],
                verificationChecks: [
                    "Did you actually try to find the answer before asking?",
                    "Is the question you would ask the single most decision-relevant one?",
                ],
                sourcePlan: [
                    "Search the codebase, run the tool, read the file before escalating to the user",
                ],
                answerContract: [
                    "Either solve it and report, or ask exactly one precise blocking question with your best assumption stated",
                ],
                cautions: [
                    "Do not bounce trivially-discoverable questions back to the user",
                ],
                uncertaintySignals: [
                    "unclear requirement that code can answer",
                    "tempted to ask instead of investigate",
                ],
                approach: "Investigate -> attempt -> if blocked, one sharp question with a proposed default",
                intentAnchors: [
                    "làm giúp anh cái này đi",
                    "tự xử lý vụ này nhé",
                    "em tự tìm cách giải quyết đi",
                    "cứ làm đừng hỏi anh nữa",
                ],
            },
            probes: ["làm giúp anh cái này đi", "tự xử lý vụ này nhé", "em tự tìm cách giải quyết đi"],
        },
        {
            playbook: {
                id: "distilled-self-test-before-done",
                label: "Self-test thoroughly before claiming done",
                matchAll: ["\\\\b(xong|done|ho\u00e0n th\u00e0nh|ch\u1ea1y \u0111\u01b0\u1ee3c|works|finished|ok ch\u01b0a|test|ki\u1ec3m tra|\u0111\u00e3 s\u1eeda|fixed|ready)\\\\b"],
                suggestions: [
                    "Run the build/tests (or the exact repro) before saying it works",
                    "Test the happy path AND the edge/failure cases you just touched",
                    "Fix any error surfaced by your own testing before reporting back",
                    "Report what you actually ran and its real result as evidence",
                ],
                reasoningFrame: [
                    "Change -> build -> run relevant tests -> test edge cases -> only then claim done",
                    "Code that looks right is not evidence; a passing run is",
                ],
                verificationChecks: [
                    "Did you run the build and the relevant tests after changing?",
                    "Did you check edge cases and error handling, not just the happy path?",
                    "Are you reporting a real result rather than an assumption?",
                ],
                sourcePlan: [
                    "Use the project's own test/build commands; discover them from config if unknown",
                ],
                answerContract: [
                    "State the commands run and their outcome; if you could not test, say so and why",
                ],
                evidenceRules: [
                    "Prefer a real passing run over reasoning that it should work",
                ],
                recoverySteps: [
                    "If tests are missing, add a minimal one or state the gap explicitly",
                ],
                cautions: [
                    "Do not claim success without executing verification",
                ],
                uncertaintySignals: [
                    "no test framework found",
                    "cannot run build in this env",
                    "only happy path checked",
                ],
                approach: "Change -> build -> test happy + edge -> fix -> report real evidence",
                intentAnchors: [
                    "xong chưa em, chạy được chưa",
                    "kiểm tra kỹ lại giúp anh",
                    "test đầy đủ trước khi báo xong",
                    "đã sửa xong chưa, chắc chưa",
                ],
            },
            probes: ["xong chưa em, chạy được chưa", "kiểm tra kỹ lại giúp anh", "test đầy đủ trước khi báo xong"],
        },
        {
            playbook: {
                id: "distilled-source-discrimination",
                label: "Distinguish reliable vs unreliable sources",
                matchAll: ["\\\\b(ngu\u1ed3n|source|link|tin|th\u00f4ng tin|\u0111\u00fang kh\u00f4ng|th\u1eadt kh\u00f4ng|tin \u0111\u01b0\u1ee3c|reliable|trust|verify|check|scam|fake|tin t\u1ee9c|b\u00e0i vi\u1ebft|research)\\\\b"],
                suggestions: [
                    "Weigh source reliability: primary/official > reputable secondary > anonymous/unknown",
                    "Cross-check important claims against at least one independent source",
                    "Prefer current, dated sources for anything time-sensitive; flag stale data",
                    "Treat unsourced numbers, anonymous posts, and content that contradicts primary docs as low-trust",
                ],
                reasoningFrame: [
                    "Claim -> who is the source? -> how authoritative + how current? -> corroborate if high stakes",
                    "Agreement across independent reputable sources raises confidence; a lone unknown source lowers it",
                ],
                verificationChecks: [
                    "Is the source primary/official or secondary/anonymous?",
                    "Is it current, and does an independent source corroborate it?",
                    "Does it conflict with a more authoritative source?",
                ],
                sourcePlan: [
                    "Route to official/primary sources first; use reputable aggregators to cross-check",
                ],
                answerContract: [
                    "Present the claim WITH its source, reliability, and as-of date; note conflicts",
                ],
                cautions: [
                    "Do not treat an anonymous or unknown source as authoritative",
                ],
                uncertaintySignals: [
                    "single unverified source",
                    "source may be outdated",
                    "sources conflict",
                    "anonymous/unknown origin",
                ],
                approach: "Assess authority + recency -> corroborate high-stakes claims -> answer with source + confidence",
                intentAnchors: [
                    "thông tin này có tin được không",
                    "nguồn này đáng tin không em",
                    "cái link này thật hay fake vậy",
                    "kiểm chứng giúp anh tin này đúng không",
                ],
            },
            probes: ["thông tin này có tin được không", "nguồn này đáng tin không em", "cái link này thật hay fake vậy"],
        },
    ],
    lessons: [
        {
            type: 'workflow',
            trigger: 'debugging any failure',
            wrong: 'guessing at a fix and editing before reproducing the problem',
            right: 'reproduce first, read the real error, confirm the cause, then fix and re-verify',
            confidence: 0.85,
        },
        {
            type: 'anti-pattern',
            trigger: 'the same fix failed twice',
            wrong: 'making another small incremental tweak to the same approach',
            right: 'stop, question the underlying assumption, and try a fundamentally different approach',
            confidence: 0.85,
        },
        {
            type: 'preference',
            trigger: 'presenting numbers or time-sensitive facts',
            wrong: 'stating a recalled figure as if it were current and verified',
            right: 'get a live source and give the figure with its source and as-of time, or mark it unverified',
            confidence: 0.9,
        },
        {
            type: 'workflow',
            trigger: 'a small, well-scoped change request',
            wrong: 'refactoring surrounding code or adding unrequested features',
            right: 'make the minimal correct edit, verify it, and mention adjacent issues separately',
            confidence: 0.8,
        },
        {
            type: 'anti-pattern',
            trigger: 'destructive or production-affecting action',
            wrong: 'executing it immediately because it was asked',
            right: 'state the risk and reversibility, then confirm before doing anything hard to undo',
            confidence: 0.9,
        },
        {
            type: 'preference',
            trigger: 'claiming a task is done',
            wrong: 'saying it works based on the code looking right',
            right: 'run the build/tests or the exact repro and report the actual result as evidence',
            confidence: 0.88,
        },
    ],
    procedures: [
        {
            trigger: 'complex multi-part task',
            action: 'decompose into ordered, independently verifiable steps and resolve the riskiest unknown first',
            tags: ['reasoning', 'planning'],
        },
        {
            trigger: 'verify a code change',
            action: 'run the project build then the relevant tests; fix errors before presenting the result',
            tags: ['coding', 'verification'],
        },
        {
            trigger: 'time-sensitive or numeric question',
            action: 'route to a live authoritative source and answer with source + timestamp',
            tags: ['research', 'verification'],
        },
    ],
    commonErrors: [
        {
            context: 'sửa bug hoặc test đang fail, lỗi code chạy không được',
            mistake: 'nói đã sửa xong mà chưa chạy lại test để kiểm chứng',
            rootCause: 'tự cho là code đúng thay vì verify thật',
            fix: 'tái hiện lỗi, sửa, rồi chạy lại đúng test đó và xác nhận nó pass',
            tags: ['debug', 'verification'],
        },
        {
            context: 'trả lời câu hỏi về giá hiện tại, số liệu, thống kê',
            mistake: 'đọc số cũ trong trí nhớ và nói như thể là số hiện tại',
            rootCause: 'coi dữ liệu hay thay đổi là kiến thức ổn định',
            fix: 'lấy nguồn live đáng tin và trả lời kèm mốc thời gian as-of',
            tags: ['verify', 'research'],
        },
        {
            context: 'yêu cầu sửa nhỏ, gọn, chỉ một chỗ',
            mistake: 'refactor lung tung code không liên quan gây lỗi phát sinh',
            rootCause: 'mở rộng phạm vi vượt quá yêu cầu',
            fix: 'chỉ sửa đúng chỗ được yêu cầu, vấn đề khác thì nói riêng',
            tags: ['scope', 'coding'],
        },
        {
            context: 'lệnh nguy hiểm: xóa, reset, deploy production',
            mistake: 'chạy ngay lập tức gây mất dữ liệu',
            rootCause: 'không đánh giá khả năng hoàn tác hoặc xác nhận ý định',
            fix: 'nói rõ rủi ro và khả năng hoàn tác, xác nhận, ưu tiên cách an toàn hoàn tác được',
            tags: ['safety'],
        },
        {
            context: 'cùng một cách làm đã thất bại hai lần',
            mistake: 'cứ chỉnh sửa nhỏ nhặt trên cùng cách tiếp cận đã hỏng',
            rootCause: 'không lùi lại để nghi ngờ giả định gốc',
            fix: 'sau hai lần fail, chẩn đoán giả định gốc và thử cách hoàn toàn khác',
            tags: ['debug', 'reasoning'],
        },
        {
            context: 'yêu cầu của người dùng có mục tiêu mơ hồ, không rõ cái gì',
            mistake: 'đoán đại mục tiêu rồi làm sai thứ cần làm',
            rootCause: 'hành động khi chưa xác định rõ đối tượng',
            fix: 'suy ra từ ngữ cảnh; nếu rủi ro và mơ hồ thì hỏi đúng một câu trước',
            tags: ['clarify'],
        },
    ],
};
//# sourceMappingURL=distillation-corpus.js.map