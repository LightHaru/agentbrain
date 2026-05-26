/**
 * AgentBrain Configuration
 */
export interface BrainConfig {
    /** Directory where brain state files are stored */
    brainDir: string;
    /** Maximum memories to retrieve per recall */
    maxRecallResults: number;
    /** Memory decay rate per day (0-1, higher = faster decay) */
    memoryDecayRate: number;
    /** Minimum confidence to keep a memory (below this = pruned) */
    minMemoryConfidence: number;
    /** Enable self-reflection after each significant task */
    enableReflection: boolean;
    /** Enable emotional state tracking */
    enableEmotions: boolean;
    /** Enable skill/habit detection */
    enableSkillTracking: boolean;
    /** How often to run maintenance (in heartbeats) */
    maintenanceInterval: number;
    /** SQLite database path for structured data */
    dbPath: string;
}
export declare const defaultConfig: BrainConfig;
//# sourceMappingURL=config.d.ts.map