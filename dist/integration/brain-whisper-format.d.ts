import type { BrainWhisper } from '../core/reasoning-cortex.js';
/**
 * Format Brain Whisper for private prompt injection.
 */
export declare function formatWhisper(whisper: BrainWhisper): string;
export declare function inferFeedbackOutcome(message: string, sentiment: number): {
    success: boolean;
    userSatisfaction: number;
} | null;
export declare function getInjectionBudget(reasoningWhisper: string, baseTokens?: number): number;
//# sourceMappingURL=brain-whisper-format.d.ts.map