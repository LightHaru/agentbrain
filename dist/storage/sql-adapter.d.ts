/**
 * SQL Storage Adapter — Makes BrainDatabase compatible with existing module interfaces
 *
 * Modules currently call fileManager.loadMemories(), fileManager.writeFile(), etc.
 * This adapter wraps BrainDatabase to provide the same interface,
 * so we can swap storage without rewriting every module.
 */
import { BrainDatabase } from './brain-db.js';
export interface Memory {
    id: string;
    type: 'episodic' | 'semantic' | 'procedural';
    content: string;
    timestamp: string;
    confidence: number;
    accessCount: number;
    lastAccessed: string;
    tags: string[];
}
/**
 * Drop-in replacement for BrainFileManager that uses SQLite
 */
export declare class SqlStorageAdapter {
    private db;
    private brainDir;
    constructor(brainDir: string);
    getDatabase(): BrainDatabase;
    loadMemories(): Promise<Memory[]>;
    writeMemoryFile(type: string, memories: Memory[]): Promise<void>;
    readFile(path: string): Promise<string | null>;
    writeFile(path: string, content: string): Promise<void>;
    ensureBrainStructure(): Promise<void>;
    close(): void;
    private buildEmotionalStateFile;
    private buildRelationshipFile;
    private buildPersonalityFile;
    private buildReflectionsFile;
    private buildSkillsFile;
    private buildHabitsFile;
    private parseAndSaveEmotionalState;
    private parseAndSaveRelationships;
    private parseAndSavePersonality;
    private parseAndSaveSkills;
    private parseAndSaveHabits;
}
//# sourceMappingURL=sql-adapter.d.ts.map