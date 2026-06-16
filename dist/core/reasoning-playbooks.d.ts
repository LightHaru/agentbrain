/**
 * Structured ReasoningCortex training playbooks.
 *
 * These are not final answers. They teach AgentBrain how to route Aira toward
 * reliable evidence for recurring tasks while leaving OpenClaw/Aira in charge.
 */
export interface ReasoningPlaybook {
    id: string;
    label: string;
    matchAll: RegExp[];
    matchAny?: RegExp[];
    suggestions: string[];
    reasoningFrame: string[];
    verificationChecks: string[];
    sourcePlan: string[];
    answerContract: string[];
    evidenceRules?: string[];
    recoverySteps?: string[];
    cautions: string[];
    uncertaintySignals: string[];
    approach?: string;
}
export declare const REASONING_PLAYBOOKS: ReasoningPlaybook[];
export declare function matchReasoningPlaybooks(message: string): ReasoningPlaybook[];
//# sourceMappingURL=reasoning-playbooks.d.ts.map