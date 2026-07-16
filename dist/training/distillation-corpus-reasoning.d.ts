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
import type { DistillationCorpus } from './distillation-corpus.js';
export declare const OPUS_DISTILLATION_REASONING: Pick<DistillationCorpus, 'playbooks' | 'lessons' | 'procedures' | 'commonErrors'>;
//# sourceMappingURL=distillation-corpus-reasoning.d.ts.map