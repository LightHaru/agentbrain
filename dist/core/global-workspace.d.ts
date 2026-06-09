/**
 * Global Workspace — attention competition + conscious focus
 *
 * REAL state: candidate items (from any module) compete by salience; the
 * winner becomes the current focus and enters a bounded stream. Consciousness
 * level and integration score are derived from how much is competing and how
 * coherent the winners are over time — not hardcoded.
 */
export interface WorkspaceCandidate {
    source: string;
    content: string;
    salience: number;
}
export interface FocusItem {
    source: string;
    content: string;
    salience: number;
    at: number;
}
export interface GlobalWorkspaceState {
    currentFocus: FocusItem | null;
    consciousnessLevel: number;
    streamLength: number;
    recentFocusCount: number;
    integrationScore: number;
    attentionFilters: string[];
    competitionsResolved: number;
}
export declare class GlobalWorkspace {
    private stream;
    private competitions;
    private filters;
    private maxStream;
    addFilter(topic: string): void;
    /** Run a competition; highest-salience candidate wins the spotlight. */
    compete(candidates: WorkspaceCandidate[]): FocusItem | null;
    getState(): GlobalWorkspaceState;
}
//# sourceMappingURL=global-workspace.d.ts.map