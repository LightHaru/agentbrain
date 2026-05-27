/**
 * Global Workspace — Consciousness & Unified Awareness
 *
 * Based on Global Workspace Theory (Baars, 1988):
 * - Central "stage" where information becomes conscious
 * - Modules compete for access to the workspace
 * - Winner gets broadcast to all modules (becomes "conscious thought")
 * - Limited capacity (can only hold one "thought" at a time)
 * - Integrates information from all brain modules into coherent experience
 */
import { BrainConfig } from './config.js';
export interface ConsciousContent {
    id: string;
    source: string;
    content: string;
    type: 'perception' | 'memory' | 'emotion' | 'plan' | 'reflection' | 'insight' | 'alert';
    salience: number;
    timestamp: number;
    associations: string[];
    metadata?: Record<string, any>;
}
export interface WorkspaceSnapshot {
    currentFocus: ConsciousContent | null;
    recentContents: ConsciousContent[];
    streamOfConsciousness: string[];
    attentionFilter: string[];
    consciousnessLevel: number;
    integrationScore: number;
}
export interface CompetitionResult {
    winner: ConsciousContent;
    losers: ConsciousContent[];
    reason: string;
}
export interface GlobalWorkspaceState {
    currentFocus: ConsciousContent | null;
    consciousnessLevel: number;
    streamLength: number;
    recentFocusCount: number;
    integrationScore: number;
    attentionFilters: string[];
    competitionsResolved: number;
}
export declare class GlobalWorkspace {
    private config;
    private currentFocus;
    private recentContents;
    private streamOfConsciousness;
    private attentionFilter;
    private consciousnessLevel;
    private competitionQueue;
    private competitionsResolved;
    private contentCounter;
    constructor(config: BrainConfig);
    /**
     * Submit content to compete for conscious awareness
     * Only the most salient content "wins" and becomes the current focus
     */
    submit(content: Omit<ConsciousContent, 'id' | 'timestamp'>): string;
    /**
     * Run competition — most salient content wins access to workspace
     */
    compete(): CompetitionResult | null;
    /**
     * Set attention filters (bias competition toward certain topics)
     */
    setAttentionFilter(filters: string[]): void;
    /**
     * Add an attention filter
     */
    addAttentionFilter(filter: string): void;
    /**
     * Remove an attention filter
     */
    removeAttentionFilter(filter: string): void;
    /**
     * Get current conscious focus
     */
    getCurrentFocus(): ConsciousContent | null;
    /**
     * Get recent stream of consciousness
     */
    getStream(limit?: number): string[];
    /**
     * Get recent conscious contents
     */
    getRecentContents(limit?: number): ConsciousContent[];
    /**
     * Integrate information from multiple modules into a coherent "thought"
     */
    integrate(inputs: {
        source: string;
        content: string;
        weight: number;
    }[]): ConsciousContent;
    /**
     * Calculate integration score (how well modules are working together)
     */
    getIntegrationScore(): number;
    /**
     * Adjust consciousness level (affected by alertness, cognitive load)
     */
    setConsciousnessLevel(level: number): void;
    /**
     * Get consciousness level
     */
    getConsciousnessLevel(): number;
    /**
     * Clear workspace (like "clearing your mind")
     */
    clear(): void;
    /**
     * Heartbeat — decay old content, maintain workspace
     */
    heartbeat(): void;
    /**
     * Get snapshot of current workspace state
     */
    getSnapshot(): WorkspaceSnapshot;
    /**
     * Get full state for status reporting
     */
    getState(): GlobalWorkspaceState;
}
//# sourceMappingURL=global-workspace.d.ts.map