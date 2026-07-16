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
    /**
     * Natural-language example intents this playbook should fire on. Used by the
     * SEMANTIC matcher (local MiniLM embeddings) so the brain recognizes the
     * intent even when the wording differs from the regex patterns. This is what
     * lets distilled reasoning generalize to unseen phrasings.
     */
    intentAnchors?: string[];
}
export declare const REASONING_PLAYBOOKS: ReasoningPlaybook[];
/** Serializable form of a learned playbook (RegExp stored as source strings). */
export interface SerializedPlaybook {
    id: string;
    label: string;
    matchAll: string[];
    matchAny?: string[];
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
    intentAnchors?: string[];
}
export declare function deserializePlaybook(p: SerializedPlaybook): ReasoningPlaybook;
/**
 * Register (or replace) a learned playbook. Returns true if it was newly added,
 * false if it replaced an existing learned playbook with the same id.
 */
export declare function registerLearnedPlaybook(p: ReasoningPlaybook): boolean;
export declare function getLearnedPlaybooks(): ReasoningPlaybook[];
export declare function clearLearnedPlaybooks(): void;
export declare function countPlaybooks(): {
    builtin: number;
    learned: number;
    total: number;
};
/** True when a single playbook id qualifies for rich whisper output. */
export declare function isRichArtifactPlaybookId(id: string): boolean;
/** True when any of the given playbooks qualifies for rich whisper output. */
export declare function hasRichArtifactPlaybook(playbooks: Array<{
    id: string;
}>): boolean;
export declare function matchReasoningPlaybooks(message: string): ReasoningPlaybook[];
//# sourceMappingURL=reasoning-playbooks.d.ts.map