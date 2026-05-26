/**
 * Brain Sync — Cloud backup & restore for brain state
 *
 * Phase 6: Provides local export/import functionality.
 * Cloud sync API will be added when backend is ready.
 *
 * Features:
 * - Export brain state as a single JSON archive
 * - Import/restore from archive
 * - Diff two brain states
 * - Versioned snapshots (local)
 */
export interface BrainSnapshot {
    version: string;
    timestamp: string;
    brainDir: string;
    files: Record<string, string>;
    metadata: {
        totalMemories: number;
        totalSkills: number;
        totalReflections: number;
        personality: Record<string, number>;
        mood: string;
        interactionCount: number;
    };
}
export interface BrainDiff {
    added: string[];
    removed: string[];
    modified: Array<{
        path: string;
        before: string;
        after: string;
    }>;
}
export declare class BrainSync {
    private brainDir;
    private snapshotsDir;
    constructor(brainDir: string);
    /**
     * Export current brain state as a JSON snapshot
     */
    export(): Promise<BrainSnapshot>;
    /**
     * Save snapshot to disk
     */
    saveSnapshot(label?: string): Promise<string>;
    /**
     * List available snapshots
     */
    listSnapshots(): Promise<Array<{
        filename: string;
        timestamp: string;
        size: number;
    }>>;
    /**
     * Restore brain state from a snapshot
     */
    restore(snapshot: BrainSnapshot): Promise<void>;
    /**
     * Load a snapshot from file
     */
    loadSnapshot(filename: string): Promise<BrainSnapshot>;
    /**
     * Diff two snapshots
     */
    diff(before: BrainSnapshot, after: BrainSnapshot): BrainDiff;
    private collectFiles;
    private extractMetadata;
}
//# sourceMappingURL=brain-sync.d.ts.map