/**
 * FactChangeTracker — surfaces "this fact CHANGED" to Aira.
 *
 * The brain already supersedes an old fact when a conflicting new one arrives
 * (KnowledgeExtractor.detectCorrections + db.supersedeFact). But it did that
 * SILENTLY: only current facts were injected, so Aira had no signal that a
 * value used to be different and was updated. That matters because Aira might
 * still have the old value in the running conversation and blend them.
 *
 * This tracker looks at recently-superseded facts relevant to the current
 * message and injects a compact reminder: "X đã đổi: <old> → <new>, dùng giá
 * trị mới". Graphiti/Zep call this temporal invalidation; here it is a cheap,
 * local, deterministic note.
 */
import type { BrainDatabase } from '../storage/brain-db.js';
export interface FactChange {
    subject: string;
    relation: string;
    oldValue: string;
    newValue: string;
    changedAt: string;
}
export declare class FactChangeTracker {
    private db;
    constructor(db: BrainDatabase);
    /**
     * Recent fact changes relevant to `query` (shares a token with subject/object).
     * Only returns changes where a current replacement value actually exists and
     * differs from the old value.
     */
    relevantChanges(query: string, opts?: {
        sinceMs?: number;
        limit?: number;
    }): FactChange[];
    formatForInjection(changes: FactChange[]): string;
}
//# sourceMappingURL=fact-change-tracker.d.ts.map