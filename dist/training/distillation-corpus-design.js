"use strict";
/**
 * Distillation corpus — DESIGN & graphics craft (anti "vibe-code" / anti
 * "AI-looking" UI).
 *
 * Smaller models tend to produce generic, obviously-AI interfaces: default
 * system fonts, purple gradients, emoji headers, even spacing, no hierarchy,
 * lorem-ipsum. This transfers how a strong designer/engineer reasons about a UI
 * so Aira ships work that looks intentionally designed, not machine-generated.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPUS_DISTILLATION_DESIGN = void 0;
const playbooks = [
    // ── FOUNDATIONS: visual system before pixels ────────────────────────────
    {
        playbook: {
            id: 'distilled-design-visual-system',
            label: 'Design a visual system first: type scale, spacing, color, hierarchy',
            matchAll: ['\\b(thiết kế|design|giao diện|ui|ux|landing|website|trang web|frontend|css|layout|bố cục|màu|font|chữ|đẹp|designer)\\b'],
            matchAny: ['\\b(đẹp|chuyên nghiệp|professional|xịn|clean|hiện đại|modern|sang|thẩm mỹ|nhìn|làm sao|nên)\\b'],
            suggestions: [
                'Establish tokens first as CSS variables in :root (colors, spacing scale, radii, type scale ~1.25, shadows); reuse them, no magic numbers',
                'Pick ONE good typeface pairing (e.g. Inter/Geist + a serif accent); never leave default Times/Arial',
                'Create clear hierarchy: one dominant focal point, then secondary, then tertiary — not everything equal',
                'Use a real accent color with intent + neutral grays; avoid the default purple-blue AI gradient',
                'Bake accessibility in: semantic tags, alt on images, aria-label on icon-only controls, visible :focus-visible, <label> for inputs',
            ],
            reasoningFrame: [
                'System (type/space/color) -> layout grid -> hierarchy -> component polish -> motion',
                'Consistency and restraint read as "designed"; randomness and defaults read as "generated"',
            ],
            verificationChecks: [
                'Is there a defined type scale and consistent spacing rhythm (8px grid)?',
                'Is it accessible: alt text, aria-label on icon buttons, :focus-visible, <label> on inputs, semantic landmarks?',
                'Is there ONE clear focal point and a deliberate visual hierarchy?',
                'Does the palette have intent (1 accent + neutrals), good contrast (WCAG AA)?',
                'Did I avoid default fonts, generic purple gradients, and emoji-as-icons?',
            ],
            sourcePlan: ['Look at real references (Linear, Stripe, Vercel, Apple) for the target vibe, adapt not copy'],
            answerContract: [
                'State the design tokens/decisions, then implement them consistently',
                'MUST ship accessibility in the code itself: aria-label on every icon-only control, visible :focus-visible ring on all interactive elements, <label> (or aria-label) on every input, alt on images, semantic landmarks (header/nav/main/footer)',
            ],
            evidenceRules: ['Judge by rendering it, not by imagining it; inspect desktop + mobile'],
            cautions: ['No lorem ipsum in a deliverable; no centered-everything; no 10 competing colors'],
            uncertaintySignals: ['no brand direction', 'unclear audience', 'content not final'],
            approach: 'Tokens (type/space/color) -> grid -> hierarchy -> components -> subtle motion -> render + inspect',
            intentAnchors: [
                'thiết kế landing page cho đẹp',
                'làm UI này nhìn chuyên nghiệp hơn',
                'giao diện sao cho đẹp không bị xấu',
                'design lại trang này cho xịn',
            ],
        },
        probes: ['thiết kế landing đẹp', 'làm UI chuyên nghiệp hơn', 'design trang cho xịn'],
    },
    // ── ANTI AI-LOOK: what makes UI look machine-generated ──────────────────
    {
        playbook: {
            id: 'distilled-design-anti-ai-look',
            label: 'Avoid the AI/vibe-code look: kill generic tells, add intentional detail',
            matchAll: ['\\b(ui|giao diện|design|thiết kế|landing|website|trang|frontend|css|nhìn|looks?|vibe|ai)\\b'],
            matchAny: ['\\b(ai|vibe|generic|chung chung|sinh ra|máy|template|nhạt|xấu|đẹp|thật|authentic|tự nhiên)\\b'],
            suggestions: [
                'Remove the tells: default system font, purple→blue gradient hero, emoji section headers, perfectly even everything',
                'Add intentional imperfection + specificity: real copy, real numbers, brand voice, asymmetry with purpose',
                'Use real iconography (Lucide/Phosphor), not emoji; real imagery/illustration, not stock-y placeholders',
                'Give depth: layered shadows with intent, subtle borders, considered whitespace — not flat sameness',
            ],
            reasoningFrame: [
                'Ask: which parts look generated? replace each with a specific, intentional choice',
                'Designed = opinionated details + consistency; generated = safe defaults + uniform blandness',
            ],
            verificationChecks: [
                'Any default fonts, emoji headers, or the stock purple gradient left?',
                'Is the copy specific and real, or placeholder-generic?',
                'Is there a deliberate focal point and rhythm, or uniform even blandness?',
                'Do icons/images look chosen, not auto-filled?',
            ],
            sourcePlan: ['Render it and critique like a designer: what screams "AI made this"? fix those first'],
            answerContract: ['List the AI-tells found and the intentional replacements made'],
            evidenceRules: ['Verify by viewing the rendered result on desktop and mobile widths'],
            cautions: ['Do not ship the first generic pass; iterate on the tells'],
            uncertaintySignals: ['no reference/brand', 'placeholder content', 'unclear tone'],
            approach: 'Render -> spot AI-tells (font/gradient/emoji/uniformity) -> replace with intentional detail -> re-render',
            intentAnchors: [
                'sao nhìn nó cứ như AI làm vậy',
                'trang này nhìn generic quá làm đẹp lại',
                'làm cho nó bớt kiểu vibe code đi',
                'UI nhìn nghiệp dư quá em',
            ],
        },
        probes: ['nhìn như AI làm quá', 'trang generic quá làm đẹp lại', 'bớt vibe code đi'],
    },
    // ── LAYOUT & RESPONSIVE craft ───────────────────────────────────────────
    {
        playbook: {
            id: 'distilled-design-layout-responsive',
            label: 'Layout craft: grid, alignment, responsive, and real content states',
            matchAll: ['\\b(layout|bố cục|responsive|mobile|desktop|grid|căn|align|khoảng cách|spacing|component|section|trang)\\b'],
            matchAny: ['\\b(mobile|điện thoại|responsive|căn|lệch|đều|khoảng cách|đẹp|gọn|sắp xếp)\\b'],
            suggestions: [
                'Use a real grid + alignment; nothing should be off by a few px or accidentally centered',
                'Design mobile AND desktop; test at 375px, 768px, 1440px — not just one width',
                'Handle real content states: long text, empty, loading, error — not just the ideal case',
                'Respect whitespace and line-length (~60-75 chars); do not cram or stretch full-bleed text',
            ],
            reasoningFrame: [
                'Grid -> alignment -> breakpoints -> content states -> spacing rhythm',
                'A layout that only looks right at one width with ideal content is not done',
            ],
            verificationChecks: [
                'Does it hold up at mobile / tablet / desktop widths?',
                'Is it accessible: semantic tags, alt text, aria-label on icon controls, visible :focus-visible, <label> on inputs?',
                'Is everything aligned to the grid (no stray px, no accidental centering)?',
                'Are long/empty/loading/error states handled?',
                'Is line-length and whitespace comfortable to read?',
            ],
            sourcePlan: ['Render at multiple widths and with realistic + edge content'],
            answerContract: ['Report the breakpoints checked and content states handled'],
            evidenceRules: ['Confirm responsiveness by actually rendering at each width'],
            cautions: ['Do not hardcode pixel widths that break on mobile; avoid overflow'],
            uncertaintySignals: ['unknown content length', 'no design at mobile', 'dynamic data'],
            approach: 'Grid -> align -> breakpoints (375/768/1440) -> content states -> spacing -> render each',
            intentAnchors: [
                'làm responsive cho mobile với',
                'bố cục bị lệch căn lại giúp anh',
                'trang vỡ trên điện thoại',
                'sắp xếp layout cho gọn đẹp',
            ],
        },
        probes: ['làm responsive mobile', 'bố cục bị lệch căn lại', 'trang vỡ trên điện thoại'],
    },
    // ── HARD: motion, micro-interactions, brand feel ────────────────────────
    {
        playbook: {
            id: 'distilled-design-motion-polish',
            label: 'Polish: purposeful motion, micro-interactions, and cohesive brand feel',
            matchAll: ['\\b(animation|motion|hiệu ứng|chuyển động|transition|hover|micro.?interaction|polish|tinh chỉnh|mượt|brand|thương hiệu)\\b'],
            matchAny: ['\\b(mượt|smooth|đẹp|xịn|cao cấp|premium|sống động|tinh tế|chuyên nghiệp)\\b'],
            suggestions: [
                'Motion must have purpose: guide attention, show state, give feedback — never decoration for its own sake',
                'Keep it fast + subtle: 150-250ms, ease-out for enter; respect prefers-reduced-motion',
                'Add micro-interactions on real affordances: hover, focus, active, loading, success/error',
                'Keep a cohesive feel: one motion language + one visual language across the whole product',
            ],
            reasoningFrame: [
                'Purpose -> timing/easing -> consistency -> accessibility (reduced-motion, focus)',
                'Premium feel = restraint + consistency + responsiveness to the user, not more effects',
            ],
            verificationChecks: [
                'Does each animation serve a purpose (attention/state/feedback)?',
                'Is timing subtle (150-250ms) and does it respect reduced-motion?',
                'Are hover/focus/active/loading/error states all designed?',
                'Is the motion + visual language consistent across screens?',
            ],
            sourcePlan: ['Reference best-in-class (Linear, Stripe) for restraint; render and feel the interaction'],
            answerContract: ['Describe the interactions added and their purpose + timing'],
            evidenceRules: ['Judge motion by actually running it, including on reduced-motion'],
            cautions: ['No janky, slow, or gratuitous animation; no motion that blocks input'],
            uncertaintySignals: ['unclear brand feel', 'performance budget unknown', 'accessibility needs'],
            approach: 'Purpose -> subtle timing/easing -> all interaction states -> consistency -> a11y -> test live',
            intentAnchors: [
                'thêm hiệu ứng cho mượt mà',
                'làm micro-interaction cho xịn',
                'trang nhìn cao cấp premium hơn',
                'animation hover cho đẹp',
            ],
        },
        probes: ['thêm hiệu ứng mượt mà', 'micro-interaction cho xịn', 'trang premium hơn'],
    },
    // ── HARD: design critique + implementing tokens in real CSS ─────────────
    {
        playbook: {
            id: 'distilled-design-critique',
            label: 'Critique a UI like a senior designer: name the problem, the principle, the fix',
            matchAll: ['\\b(chê|góp ý|critique|đánh giá|review|nhận xét|ui|giao diện|design|xấu|chưa đẹp|feedback)\\b'],
            matchAny: ['\\b(sao|chỗ nào|tại sao|xấu|chưa|cải thiện|đẹp hơn|vấn đề|nhận xét)\\b'],
            suggestions: [
                'For each issue name: the symptom, the design principle it breaks, and the concrete fix',
                'Prioritize: hierarchy + spacing + contrast problems before decorative ones',
                'Check alignment to a grid, consistent spacing scale, and a single clear focal point',
                'Judge contrast/legibility and touch-target sizes, not just aesthetics',
            ],
            reasoningFrame: [
                'Symptom -> broken principle (hierarchy/contrast/spacing/consistency) -> concrete fix',
                'Critique must be actionable and prioritized, not vague taste',
            ],
            verificationChecks: [
                'Did I tie each critique to a named principle + a concrete fix?',
                'Did I prioritize structural issues (hierarchy/spacing/contrast) first?',
                'Is legibility/contrast/touch-size actually checked?',
            ],
            sourcePlan: ['Look at the real rendered UI; reference solid examples for the fix'],
            answerContract: ['Prioritized list: symptom -> principle -> fix'],
            evidenceRules: ['Base critique on what is actually rendered, not assumptions'],
            cautions: ['No vague "make it pop"; every note must be actionable'],
            uncertaintySignals: ['no brand context', 'unclear audience', 'partial screenshot'],
            approach: 'Symptom -> broken principle -> concrete fix, prioritized structural-first',
            intentAnchors: [
                'chê giúp anh giao diện này',
                'góp ý cái UI này chỗ nào chưa đẹp',
                'design này có vấn đề gì',
                'nhận xét trang này đi',
            ],
        },
        probes: ['chê giao diện này', 'góp ý UI chỗ nào chưa đẹp', 'design này vấn đề gì'],
    },
    {
        playbook: {
            id: 'distilled-design-tokens-in-code',
            label: 'Implement design as tokens + component states, not one-off magic values',
            matchAll: ['\\b(css|tailwind|component|style|token|biến|variable|theme|dark mode|state|hover|focus|disabled)\\b'],
            matchAny: ['\\b(làm sao|nên|đẹp|nhất quán|maintain|scale|state|theme|dark)\\b'],
            suggestions: [
                'Define tokens (CSS vars / theme): colors, spacing scale, radii, shadows, type — reuse them, no magic numbers',
                'Fluid type + spacing with clamp(min, preferred, max): e.g. font-size: clamp(1rem, 0.83rem + 0.9vw, 1.33rem); scale via a ratio (1.25 Major Third / 1.333 Perfect Fourth) on an 8px grid',
                'Implement ALL states per component: default, hover, focus-visible, active, disabled, loading, error, empty',
                'Support theming (light/dark) via tokens; ensure contrast holds in both',
                'Keep components composable + consistent; do not hardcode a color in twenty places',
            ],
            reasoningFrame: [
                'Tokens -> components consuming tokens -> every interaction/content state -> theming',
                'Consistency comes from shared tokens; ad-hoc values are how UIs drift ugly',
            ],
            verificationChecks: [
                'Are values from CSS variable tokens in :root (a scale), not magic numbers?',
                'Is it accessible: aria-label on icon controls, visible :focus-visible, <label> on inputs, alt text, semantic tags?',
                'Are all states (hover/focus/active/disabled/loading/error/empty) handled?',
                'Does it work + keep contrast in light and dark?',
            ],
            sourcePlan: ['Check the existing theme/tokens and reuse them; render each state'],
            answerContract: [
                'Show tokens + a component that consumes them across states',
                'MUST include a11y in the delivered code: :focus-visible on interactive elements, aria-label on icon-only buttons, <label> on inputs, WCAG AA contrast in both themes',
            ],
            evidenceRules: ['Verify states by rendering them, including focus-visible for a11y'],
            cautions: ['No hardcoded hex scattered around; no missing focus state'],
            uncertaintySignals: ['no design system', 'unclear theme needs', 'a11y requirements'],
            approach: 'Tokens -> token-consuming components -> all states -> theming -> render/verify',
            intentAnchors: [
                'viết CSS/component cho nhất quán dễ maintain',
                'làm dark mode cho trang',
                'component này thiếu state hover focus',
                'set up design token thế nào',
            ],
        },
        probes: ['CSS component nhất quán dễ maintain', 'làm dark mode', 'set up design token'],
    },
    {
        playbook: {
            id: 'distilled-design-a11y-implementation',
            label: 'Ship accessibility IN the markup: ARIA roles, focus states, labels (not as an afterthought)',
            matchAll: ['\\b(html|css|ui|component|form|button|modal|dialog|tab|menu|accordion|dropdown|input|nav|landing|page|trang|giao diện|frontend|accessible|a11y|aria)\\b'],
            matchAny: ['\\b(làm|build|tạo|viết|create|design|thiết kế|đẹp|accessible|a11y|aria|screen reader|keyboard|focus)\\b'],
            suggestions: [
                'Icon-only buttons MUST have aria-label (e.g. <button aria-label="Close">✕</button>); text buttons do not need one',
                'Every interactive element needs a VISIBLE :focus-visible style (outline/ring) — never remove focus outlines without a replacement',
                'Every form input needs a <label for> or aria-label; group related inputs with <fieldset>/<legend>',
                'Use semantic landmarks: <header> <nav> <main> <footer>, one <h1>, then <h2>/<h3> in order — do not skip heading levels',
                'Images need alt (empty alt="" for decorative); interactive SVG icons need role="img"+aria-label or aria-hidden if decorative',
                'ARIA APG widget contracts — Dialog: role="dialog" aria-modal + labelledby, Esc closes, focus trapped/returned; Tabs: role=tablist/tab/tabpanel + Arrow keys; Accordion/Disclosure: button + aria-expanded + aria-controls, Enter/Space toggles; Menu button: aria-haspopup + aria-expanded, Arrow keys + Esc',
            ],
            reasoningFrame: [
                'Accessibility is written INTO the markup at build time, not checked at the end',
                'Semantic HTML first (button/label/nav/main); ARIA only to fill gaps native elements cannot express',
                'Keyboard + screen-reader path must work: name, role, state, and focus for every control',
            ],
            verificationChecks: [
                'Does EVERY icon-only control have an aria-label, and is there a visible :focus-visible on all interactives?',
                'Are inputs labelled, headings ordered (one h1, no skipped levels), landmarks present?',
                'Do interactive widgets follow the ARIA APG role/keyboard contract (dialog/tabs/accordion/menu)?',
                'Is text contrast WCAG AA (4.5:1 normal, 3:1 large) in every theme?',
            ],
            sourcePlan: [
                'Follow the WAI-ARIA Authoring Practices Guide patterns: https://www.w3.org/WAI/ARIA/apg/patterns/',
                'Prefer a battle-tested primitive lib (Radix UI / React Aria) that bakes in APG behavior over hand-rolling ARIA',
            ],
            answerContract: [
                'The delivered code MUST already contain: aria-label on icon-only controls, visible :focus-visible, labelled inputs, semantic landmarks, alt text',
                'If a component is a dialog/tabs/accordion/menu, its ARIA roles + keyboard handling MUST be implemented, not just described',
            ],
            evidenceRules: [
                'A design is NOT accessible just because it looks fine; verify names/roles/states exist in the DOM',
                'Removing an outline without a visible replacement is an accessibility regression, not a style choice',
            ],
            cautions: [
                'Do not use div/span with onclick as a button — use <button> or add role+tabindex+key handlers',
                'Do not rely on color alone to convey state (error/success) — pair with icon/text',
                'Placeholder is not a label',
            ],
            uncertaintySignals: ['no keyboard spec', 'custom widget without a known ARIA pattern', 'unclear screen-reader target'],
            approach: 'Semantic HTML → labels/landmarks → focus-visible → ARIA APG pattern for custom widgets → contrast check',
            intentAnchors: [
                'làm cái form/modal này cho accessible',
                'thêm aria cho component',
                'trang này có accessible không, thiếu gì',
                'build a keyboard + screen-reader friendly UI',
            ],
        },
        probes: ['làm modal accessible', 'thêm aria cho component', 'UI này thiếu a11y gì'],
    },
];
const lessons = [
    {
        type: 'anti-pattern', trigger: 'thiết kế UI', wrong: 'font mặc định + gradient tím-xanh + emoji làm tiêu đề + mọi thứ căn giữa đều tăm tắp',
        right: 'type scale + lưới 8px + 1 accent + neutrals, phân cấp rõ, icon thật (Lucide), copy thật', confidence: 0.9,
    },
    {
        type: 'correction', trigger: 'làm landing/trang', wrong: 'ship bản đầu tiên generic rồi báo xong',
        right: 'render ra, tự soi "chỗ nào nhìn như AI", thay bằng lựa chọn có chủ đích, render lại desktop+mobile', confidence: 0.88,
    },
    {
        type: 'anti-pattern', trigger: 'nội dung demo', wrong: 'để lorem ipsum / số liệu bịa',
        right: 'dùng copy thật, số thật, giọng thương hiệu cụ thể', confidence: 0.85,
    },
    {
        type: 'workflow', trigger: 'giao diện', wrong: 'chỉ làm đẹp ở 1 width lý tưởng',
        right: 'test 375/768/1440 + trạng thái nội dung dài/rỗng/loading/lỗi', confidence: 0.86,
    },
    {
        type: 'preference', trigger: 'hiệu ứng/animation', wrong: 'thêm animation loè loẹt cho vui',
        right: 'motion có mục đích, 150-250ms, ease-out, tôn trọng prefers-reduced-motion', confidence: 0.82,
    },
    {
        type: 'anti-pattern', trigger: 'bố cục layout', wrong: 'căn giữa mọi thứ, spacing đều tăm tắp 40/80/120, không điểm nhấn',
        right: 'focal point bất đối xứng (hero lệch 60/40), rhythm spacing có chủ đích, CTA không nhất thiết center', confidence: 0.83,
    },
    {
        type: 'anti-pattern', trigger: 'icon-only button', wrong: '<button>✕</button> không có nhãn — screen reader đọc rỗng',
        right: '<button aria-label="Đóng">✕</button>; icon SVG trang trí thì aria-hidden="true"', confidence: 0.9,
    },
    {
        type: 'correction', trigger: 'bỏ outline focus cho đẹp', wrong: 'outline: none mà không thay gì — mất dấu focus cho người dùng bàn phím',
        right: 'giữ :focus-visible với ring/outline rõ ràng (VD outline: 2px solid + offset)', confidence: 0.9,
    },
    {
        type: 'workflow', trigger: 'typography responsive', wrong: 'đặt font-size px cứng cho từng breakpoint',
        right: 'font-size: clamp(min, preferred+vw, max) theo type scale 1.25/1.333, fully fluid không cần media query', confidence: 0.84,
    },
];
const procedures = [
    { trigger: 'bắt đầu thiết kế UI', action: 'định nghĩa tokens (type scale, spacing 8px, palette 1 accent + neutrals) trước khi code', tags: ['design', 'ui'] },
    { trigger: 'trước khi nói UI xong', action: 'render desktop + mobile, tự soi AI-tells, kiểm tra contrast WCAG AA', tags: ['design', 'verify'] },
    { trigger: 'chống nhìn như AI', action: 'bỏ font mặc định/gradient tím/emoji-header/đều tăm tắp → thay bằng chi tiết có chủ đích', tags: ['design'] },
    { trigger: 'làm responsive', action: 'test 375/768/1440px + nội dung dài/rỗng/loading/lỗi', tags: ['design', 'responsive'] },
    { trigger: 'thêm control tương tác', action: 'gắn aria-label cho icon button, giữ :focus-visible, <label> cho input trước khi coi là xong', tags: ['design', 'a11y'] },
    { trigger: 'làm widget dialog/tabs/accordion/menu', action: 'áp đúng ARIA APG pattern (role + aria-expanded/controls + keyboard) hoặc dùng Radix/React Aria', tags: ['design', 'a11y'] },
    { trigger: 'set type scale', action: 'dùng clamp() + ratio 1.25/1.333 trên lưới 8px cho fluid typography', tags: ['design'] },
];
const commonErrors = [
    {
        context: 'thiết kế giao diện', mistake: 'ra UI nhìn phát biết ngay là AI làm (generic, nhạt)',
        rootCause: 'dùng toàn default: font hệ thống, gradient tím, emoji, spacing đều, không phân cấp',
        fix: 'xây visual system + phân cấp + icon/asset thật + copy thật + chi tiết có chủ đích', tags: ['design'],
    },
    {
        context: 'làm trang web', mistake: 'chỉ đẹp trên desktop, mobile vỡ',
        rootCause: 'không thiết kế responsive + không test nhiều width', fix: 'thiết kế mobile-first, test 375/768/1440', tags: ['design', 'responsive'],
    },
    {
        context: 'màu sắc & tương phản', mistake: 'chữ xám nhạt trên nền trắng, không đọc được',
        rootCause: 'không kiểm tra contrast', fix: 'đảm bảo WCAG AA (4.5:1 cho text thường), test bằng công cụ contrast', tags: ['design', 'a11y'],
    },
    {
        context: 'accessibility trong code', mistake: 'giao UI không có aria-label/label/focus-visible — chỉ mô tả a11y chứ không viết vào code',
        rootCause: 'coi a11y là bước kiểm tra cuối thay vì viết vào markup ngay từ đầu',
        fix: 'viết aria-label cho icon button, :focus-visible, <label> cho input, landmark semantic NGAY trong code giao đi', tags: ['design', 'a11y'],
    },
    {
        context: 'custom widget', mistake: 'dùng <div onclick> làm nút bấm — không focus/keyboard được',
        rootCause: 'không dùng element semantic',
        fix: 'dùng <button>, hoặc thêm role+tabindex=0+xử lý Enter/Space nếu buộc phải div', tags: ['design', 'a11y'],
    },
];
exports.OPUS_DISTILLATION_DESIGN = {
    playbooks,
    lessons,
    procedures,
    commonErrors,
};
//# sourceMappingURL=distillation-corpus-design.js.map