/**
 * Domain distillation corpus — Opus-4.8 reasoning distilled for the specific
 * domains Aira works in (crypto/on-chain safety, coding, research, ops,
 * communication). This is the "make her genuinely smarter over time" content:
 * more high-quality thinking frames + real mistakes, measured on held-out
 * probes so only knowledge that generalizes is kept.
 */

import type { DistillationCorpus, DistilledPlaybook, DistilledError } from './distillation-corpus.js';

const playbooks: DistilledPlaybook[] = [
  {
    playbook: {
      id: 'distilled-crypto-scam-detection',
      label: 'On-chain scam / rug detection before trusting a token',
      matchAll: ['\\b(token|coin|contract|airdrop|presale|dex|honeypot|rug|scam|ape|mint|liquidity|whitelist|claim|smart ?contract|hợp đồng|ví)\\b'],
      matchAny: ['\\b(an toàn|scam|lừa|rug|có nên|đầu tư|mua|check|kiểm tra|đáng tin|safe|legit|invest|buy)\\b'],
      suggestions: [
        'Check contract ownership, mint authority, and whether liquidity is locked/renounced',
        'Look for honeypot signals: cannot sell, extreme buy/sell tax, blacklist functions',
        'Verify token age, holder distribution, and whether the top holders can dump',
        'Cross-check the official contract address from the project, not from a random link',
      ],
      reasoningFrame: [
        'Token -> contract authorities -> liquidity -> holder concentration -> sell test -> verdict',
        'Absence of red flags is not safety; unverifiable ownership is itself a red flag',
      ],
      verificationChecks: [
        'Can the owner mint unlimited supply or freeze/blacklist wallets?',
        'Is liquidity locked, and for how long? Who holds the top wallets?',
        'Does an actual sell succeed, or is it a honeypot?',
      ],
      sourcePlan: [
        'Use a block explorer + contract read for authorities; a honeypot checker for sellability',
        'Get the official contract address from the project’s verified channel',
      ],
      answerContract: ['State the risk verdict with the concrete on-chain evidence behind it'],
      evidenceRules: ['Never call a token safe without checking mint/ownership/liquidity on-chain'],
      recoverySteps: ['If ownership/liquidity cannot be verified, treat it as high-risk and say so'],
      cautions: ['A slick site or hype is not evidence; only on-chain facts are'],
      uncertaintySignals: ['unverified contract', 'unknown liquidity lock', 'concentrated holders'],
      approach: 'Read contract authorities + liquidity + holders -> sell test -> verdict with evidence',
      intentAnchors: [
        'token này có phải scam không em',
        'có nên ape vào cái presale này không',
        'contract này an toàn hay rug đấy',
        'kiểm tra hộ anh cái coin này có lừa không',
      ],
    },
    probes: ['token này có phải scam không', 'cái contract này an toàn không', 'có nên mua coin này không'],
  },
  {
    playbook: {
      id: 'distilled-code-review-quality',
      label: 'Review code for correctness, edge cases, and security',
      matchAll: ['\\b(review|đọc|kiểm tra|check|xem|refactor|clean|code|hàm|function|class|module|pr|pull request|diff)\\b'],
      matchAny: ['\\b(review|đúng chưa|ổn không|tối ưu|bug|security|an toàn|sạch|chất lượng|góp ý|feedback)\\b'],
      suggestions: [
        'Trace the main path plus edge cases: empty, null, large, concurrent, error inputs',
        'Look for injection, unvalidated input, secrets in code, and missing authz/authn',
        'Match existing project conventions; flag deviations rather than rewriting silently',
        'Prefer small, testable functions and clear error handling over cleverness',
      ],
      reasoningFrame: [
        'Correctness -> edge cases -> security -> readability -> tests, in that priority',
        'A change without a test for its edge case is unfinished, not done',
      ],
      verificationChecks: [
        'Are null/empty/large/concurrent/error inputs handled?',
        'Any injection, unvalidated input, secret leakage, or missing access control?',
        'Do tests cover the new behavior and its edge cases?',
      ],
      sourcePlan: ['Read the surrounding code and its tests before judging a change'],
      answerContract: ['Give prioritized findings (correctness/security first) with concrete fixes'],
      evidenceRules: ['Base review on the actual code read, not assumptions about it'],
      cautions: ['Do not approve code you have not actually traced through'],
      uncertaintySignals: ['untested edge cases', 'unclear input contracts', 'security-sensitive path'],
      approach: 'Trace correctness -> edge cases -> security -> conventions -> tests -> prioritized findings',
      intentAnchors: [
        'review giúp anh đoạn code này',
        'code này ổn chưa, có bug không',
        'kiểm tra hàm này có an toàn không',
        'xem PR này có vấn đề gì không',
      ],
    },
    probes: ['review code này giúp anh', 'hàm này có bug không', 'code này an toàn chưa'],
  },
  {
    playbook: {
      id: 'distilled-deep-research',
      label: 'Structured research with corroboration',
      matchAll: ['\\b(research|tìm hiểu|phân tích|analyze|nghiên cứu|so sánh thị trường|report|báo cáo|tổng hợp|deep dive|tìm thông tin)\\b'],
      suggestions: [
        'Define the exact question and what a good answer must contain before searching',
        'Gather from multiple independent sources; prefer primary/official over aggregators',
        'Separate established facts from opinion and from your own inference',
        'Note recency and flag anything that may be outdated',
      ],
      reasoningFrame: [
        'Question -> what answer needs -> multi-source gather -> corroborate -> synthesize with confidence',
        'One source is a lead, not a conclusion; corroboration is what upgrades it to a finding',
      ],
      verificationChecks: [
        'Did you use more than one independent source?',
        'Did you separate fact from opinion and note recency?',
      ],
      sourcePlan: ['Primary/official sources first, reputable secondary to corroborate, dated where possible'],
      answerContract: ['Synthesize findings with sources, confidence, and explicit gaps'],
      evidenceRules: ['Attribute each key claim to a source; mark uncorroborated ones'],
      recoverySteps: ['If sources conflict, present the disagreement instead of picking silently'],
      cautions: ['Do not present a single unverified source as settled fact'],
      uncertaintySignals: ['single-source claim', 'possibly outdated', 'conflicting sources'],
      approach: 'Frame question -> multi-source gather -> corroborate -> synthesize with confidence + gaps',
      intentAnchors: [
        'research giúp anh về chủ đề này',
        'phân tích sâu giúp anh cái này',
        'tổng hợp thông tin về vấn đề này',
        'tìm hiểu kỹ giúp anh xu hướng này',
      ],
    },
    probes: ['research giúp anh về cái này', 'phân tích sâu vấn đề này', 'tổng hợp thông tin giúp anh'],
  },
  {
    playbook: {
      id: 'distilled-ops-incident',
      label: 'Diagnose ops/server incidents methodically',
      matchAll: ['\\b(server|vps|nginx|docker|deploy|down|sập|chậm|slow|cpu|ram|disk|log|service|crash|restart|502|503|timeout|production)\\b'],
      suggestions: [
        'Establish current state from metrics/logs before changing anything',
        'Isolate the failing layer: network, process, resource, dependency, config',
        'Change one thing at a time and observe; keep a rollback path',
        'Prefer the least-destructive mitigation that restores service',
      ],
      reasoningFrame: [
        'Symptom -> metrics/logs -> isolate layer -> hypothesize -> one change -> observe -> confirm',
        'Restarting blindly hides the cause; capture evidence before you mutate state',
      ],
      verificationChecks: [
        'Did you read current metrics/logs before acting?',
        'Did you isolate which layer is actually failing?',
        'Is there a rollback if the change makes it worse?',
      ],
      sourcePlan: ['Check service logs, resource metrics, and recent deploys/changes first'],
      answerContract: ['State the diagnosed cause, the mitigation, and how service was confirmed restored'],
      recoverySteps: ['If a change worsens things, roll back immediately and re-isolate'],
      cautions: ['Do not restart/wipe production state before capturing diagnostic evidence'],
      uncertaintySignals: ['cause not isolated', 'no recent-change data', 'intermittent'],
      approach: 'Read metrics/logs -> isolate layer -> one reversible change -> observe -> confirm restored',
      intentAnchors: [
        'server tự nhiên sập rồi',
        'con vps chạy chậm quá xử lý đi',
        'service bị 502 hoài, coi giúp anh',
        'production đang down, fix gấp',
      ],
    },
    probes: ['server sập rồi coi giúp', 'vps chậm quá xử lý đi', 'service bị 502 hoài'],
  },
  {
    playbook: {
      id: 'distilled-honest-pushback',
      label: 'Give honest feedback and correct the user when wrong',
      matchAll: ['\\b(đúng không|có phải|anh nghĩ|theo anh|ý anh là|có nên|em thấy sao|đồng ý không|phản biện|góp ý|thật lòng)\\b'],
      suggestions: [
        'If the user is factually wrong, say so respectfully with the correct information',
        'Do not agree just to please; honest, specific feedback is more useful',
        'Give the reasoning and evidence behind a disagreement, not just an opinion',
        'Separate "I disagree on facts" from "this is a preference/tradeoff"',
      ],
      reasoningFrame: [
        'Claim -> is it factually wrong or a preference? -> wrong: correct with evidence, kindly',
        'Sycophancy erodes trust; calibrated honesty builds it',
      ],
      verificationChecks: [
        'Am I agreeing because it is correct, or just to be agreeable?',
        'Do I have evidence for my disagreement?',
      ],
      sourcePlan: ['Ground a factual correction in a verifiable source when stakes are real'],
      answerContract: ['State agreement or disagreement clearly, with the reason/evidence'],
      cautions: ['Do not flatter; do not soften a factual correction into vagueness'],
      uncertaintySignals: ['user premise may be wrong', 'fact vs preference unclear'],
      approach: 'Classify fact vs preference -> if wrong, correct kindly with evidence -> avoid sycophancy',
      intentAnchors: [
        'anh nghĩ vậy đúng không em',
        'theo em thì ý anh có hợp lý không',
        'em cứ thật lòng góp ý đi',
        'anh làm vậy có ổn không, phản biện đi',
      ],
    },
    probes: ['anh nghĩ vậy đúng không', 'ý anh hợp lý không em', 'thật lòng góp ý đi'],
  },
];

const commonErrors: DistilledError[] = [
  {
    context: 'đánh giá token/contract crypto có an toàn không',
    mistake: 'nói token an toàn chỉ vì website đẹp và nhiều hype, chưa check on-chain',
    rootCause: 'coi marketing là bằng chứng thay vì dữ liệu on-chain',
    fix: 'kiểm tra quyền mint/owner, khóa thanh khoản, phân bố holder và test bán trước khi kết luận',
    tags: ['crypto', 'safety'],
  },
  {
    context: 'review hoặc sửa code',
    mistake: 'chỉ nhìn happy path, bỏ qua edge case null/rỗng/lỗi nên sót bug',
    rootCause: 'không trace các trường hợp biên và input xấu',
    fix: 'trace cả edge case: null, rỗng, lớn, concurrent, lỗi; thêm test cho chúng',
    tags: ['coding', 'verification'],
  },
  {
    context: 'research/tổng hợp thông tin cho Sếp',
    mistake: 'kết luận chắc nịch chỉ từ một nguồn chưa kiểm chứng',
    rootCause: 'không đối chiếu nhiều nguồn độc lập',
    fix: 'đối chiếu ít nhất 2 nguồn độc lập, tách fact khỏi opinion, ghi nguồn + độ tin',
    tags: ['research', 'verify'],
  },
  {
    context: 'xử lý sự cố server/production',
    mistake: 'restart hoặc sửa đại khi chưa đọc log/metrics, làm mất manh mối',
    rootCause: 'mutate state trước khi thu thập bằng chứng',
    fix: 'đọc log + metrics, cô lập tầng lỗi, đổi một thứ một lần và có đường rollback',
    tags: ['ops', 'safety'],
  },
  {
    context: 'Sếp đưa ra một nhận định có thể sai',
    mistake: 'gật theo cho vừa lòng thay vì chỉ ra chỗ sai',
    rootCause: 'sycophancy, ngại phản biện',
    fix: 'nếu sai về facts thì lịch sự đính chính kèm bằng chứng, phân biệt fact và sở thích',
    tags: ['communication'],
  },
];

export const OPUS_DISTILLATION_DOMAINS: Pick<DistillationCorpus, 'playbooks' | 'commonErrors'> = {
  playbooks,
  commonErrors,
};
