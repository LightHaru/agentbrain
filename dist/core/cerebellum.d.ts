/**
 * Cerebellum — Skill & Habit Learning Engine
 *
 * Like the brain's cerebellum, this module handles:
 * - Detecting repeated patterns in user requests
 * - Tracking skill proficiency (what agent is good/bad at)
 * - Auto-creating shortcuts for frequent workflows
 * - Habit formation: if X happens N times → automate
 */
import { BrainConfig } from './config.js';
import { BrainFileManager } from '../storage/md-writer.js';
export interface Skill {
    id: string;
    name: string;
    category: string;
    proficiency: number;
    timesUsed: number;
    lastUsed: string;
    successRate: number;
    successes: number;
    failures: number;
}
export interface Habit {
    id: string;
    pattern: string;
    action: string;
    frequency: number;
    confidence: number;
    firstSeen: string;
    lastSeen: string;
    active: boolean;
}
export interface PatternMatch {
    pattern: string;
    category: string;
    count: number;
}
export declare class Cerebellum {
    private config;
    private fileManager;
    private skills;
    private habits;
    private recentPatterns;
    constructor(config: BrainConfig, fileManager: BrainFileManager);
    /**
     * Initialize: load skills and habits from files
     */
    initialize(): Promise<void>;
    /**
     * Detect which skill is being used in this interaction
     */
    detectSkill(message: string): string | null;
    /**
     * Record skill usage after a task
     */
    recordSkillUsage(skillName: string, success: boolean): void;
    /**
     * Detect patterns/habits from repeated requests
     */
    detectPattern(message: string, timestamp: string): Habit | null;
    /**
     * Detect relationship patterns (nicknames, greetings, time-of-day)
     */
    detectRelationshipPattern(message: string, timestamp: string): Habit | null;
    /**
     * Get top skills by proficiency
     */
    getTopSkills(n?: number): Skill[];
    /**
     * Get active habits
     */
    getActiveHabits(): Habit[];
    /**
     * Get skill by name
     */
    getSkill(name: string): Skill | undefined;
    /**
     * Get all skills
     */
    getAllSkills(): Skill[];
    /**
     * Persist skills and habits to files
     */
    persist(): Promise<void>;
    private formatSkills;
    private formatHabits;
    private parseSkills;
    private parseHabits;
}
//# sourceMappingURL=cerebellum.d.ts.map