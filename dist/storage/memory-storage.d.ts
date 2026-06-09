/**
 * MemoryStorage — in-memory storage adapter for the agent-neutral SDK.
 *
 * Extends BrainFileManager so it satisfies every module's storage type, but
 * overrides all I/O to live in RAM. This lets an external agent run the brain
 * engine with zero filesystem/sqlite dependency (clean, sandbox-safe, testable).
 *
 * Nothing here touches node:fs. State is kept in plain Maps and discarded when
 * the process exits unless the host explicitly snapshots it via dump()/load().
 */
import { BrainFileManager } from './md-writer.js';
import type { Memory } from '../index.js';
type MemType = 'episodic' | 'semantic' | 'procedural';
export declare class MemoryStorage extends BrainFileManager {
    private files;
    private memories;
    constructor();
    ensureBrainStructure(): Promise<void>;
    loadMemories(): Promise<Memory[]>;
    writeMemoryFile(type: MemType, memories: Memory[]): Promise<void>;
    appendToFile(subPath: string, content: string): Promise<void>;
    readFile(subPath: string): Promise<string | null>;
    writeFile(subPath: string, content: string): Promise<void>;
    /** Export the full in-memory state so a host can persist/restore it. */
    dump(): {
        files: Record<string, string>;
        memories: Record<MemType, Memory[]>;
    };
    /** Restore state previously produced by dump(). */
    load(state: {
        files?: Record<string, string>;
        memories?: Partial<Record<MemType, Memory[]>>;
    }): void;
}
export {};
//# sourceMappingURL=memory-storage.d.ts.map