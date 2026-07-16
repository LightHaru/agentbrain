/**
 * Semantic Playbook Matcher — makes AgentBrain understand INTENT, not keywords.
 *
 * The regex matcher in reasoning-playbooks.ts is precise but brittle: a slightly
 * different phrasing ("trang web trắng bóc, console báo lỗi") misses the debug
 * playbook even though it clearly IS a debugging situation. This matcher uses
 * the local MiniLM embedding model (already running on CPU for memory recall)
 * to compare the user's message against each playbook's `intentAnchors` by
 * cosine similarity. Anything above a threshold is treated as a match.
 *
 * Effect: distilled reasoning generalizes to unseen wording → higher held-out
 * benchmark → the brain is genuinely smarter, powered by a local model, no API.
 *
 * It layers ON TOP of regex (union of both), never replaces it, and degrades
 * gracefully to regex-only if the model isn't loaded.
 */
import { EmbeddingEngine } from './embedding-engine.js';
import { type ReasoningPlaybook } from './reasoning-playbooks.js';
export interface SemanticMatchOptions {
    /** cosine threshold above which an anchor counts as a match (0..1). */
    threshold?: number;
    /** cap how many playbooks the semantic pass can add. */
    maxAdd?: number;
}
export declare class SemanticPlaybookMatcher {
    private engine;
    private threshold;
    private maxAdd;
    /** cache: playbookId -> anchor embeddings */
    private anchorCache;
    private ready;
    constructor(engine: EmbeddingEngine, opts?: SemanticMatchOptions);
    /** True once the model is loaded and anchors are embedded. */
    isReady(): boolean;
    /** Pre-embed all playbook intent anchors. Safe to call repeatedly. */
    warmup(playbooks?: ReasoningPlaybook[]): Promise<boolean>;
    /**
     * Return the union of regex matches + semantic matches for a message.
     * Falls back to regex-only if the model isn't ready.
     */
    match(message: string, playbooks?: ReasoningPlaybook[]): Promise<ReasoningPlaybook[]>;
    /** Score a single message against a playbook's anchors (for diagnostics/tests). */
    bestScore(message: string, playbookId: string): Promise<number>;
}
export declare function allPlaybooks(): ReasoningPlaybook[];
//# sourceMappingURL=semantic-playbook-matcher.d.ts.map