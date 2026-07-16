/**
 * Domain distillation corpus — Opus-4.8 reasoning distilled for the specific
 * domains Aira works in (crypto/on-chain safety, coding, research, ops,
 * communication). This is the "make her genuinely smarter over time" content:
 * more high-quality thinking frames + real mistakes, measured on held-out
 * probes so only knowledge that generalizes is kept.
 */
import type { DistillationCorpus } from './distillation-corpus.js';
export declare const OPUS_DISTILLATION_DOMAINS: Pick<DistillationCorpus, 'playbooks' | 'commonErrors'>;
//# sourceMappingURL=distillation-corpus-domains.d.ts.map