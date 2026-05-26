/**
 * BrainFileManager — Markdown file storage for brain state
 *
 * All brain state is stored as human-readable Markdown files.
 * This makes it git-friendly, inspectable, and editable by users.
 */
import { Memory } from '../index.js';
export declare class BrainFileManager {
    private brainDir;
    constructor(brainDir: string);
    /**
     * Ensure all brain directories exist
     */
    ensureBrainStructure(): Promise<void>;
    /**
     * Load all memories from brain/memory/ files
     */
    loadMemories(): Promise<Memory[]>;
    /**
     * Write memories of a specific type to their file
     */
    writeMemoryFile(type: 'episodic' | 'semantic' | 'procedural', memories: Memory[]): Promise<void>;
    /**
     * Append to a brain file (for logs, reflections, etc.)
     */
    appendToFile(subPath: string, content: string): Promise<void>;
    /**
     * Read a brain file
     */
    readFile(subPath: string): Promise<string | null>;
    /**
     * Write/overwrite a brain file
     */
    writeFile(subPath: string, content: string): Promise<void>;
    private parseMemoryFile;
    private formatMemoryFile;
    private initialPersonalityTemplate;
}
//# sourceMappingURL=md-writer.d.ts.map