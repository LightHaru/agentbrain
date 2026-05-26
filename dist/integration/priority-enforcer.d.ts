/**
 * Priority Hierarchy Enforcer
 *
 * Ensures brain-generated context never overrides core identity files.
 * Priority: SOUL > AGENTS > USER > brain personality > brain emotion > brain memory > brain skills
 *
 * If brain data conflicts with higher-priority sources, the higher source wins.
 */
export interface PrioritySource {
    level: number;
    name: string;
    type: 'core' | 'brain';
}
export declare const PRIORITY_HIERARCHY: PrioritySource[];
export interface ConflictResolution {
    hasConflict: boolean;
    winner: string;
    loser: string;
    reason: string;
}
export interface BrainDirective {
    source: string;
    directive: string;
    trait?: string;
    value?: number;
}
export interface CoreConstraint {
    source: string;
    constraint: string;
    keywords: string[];
}
export declare class PriorityEnforcer {
    private constraints;
    constructor();
    /**
     * Check if a brain directive conflicts with core constraints
     * Returns resolution: which source wins
     */
    checkConflict(brainDirective: BrainDirective): ConflictResolution;
    /**
     * Filter brain context to remove anything that conflicts with core
     */
    filterBrainContext(brainLines: string[]): string[];
    /**
     * Validate personality trait bounds
     * Brain can adjust traits but cannot push them to extremes that violate SOUL
     */
    validateTraitBounds(trait: string, value: number): number;
    /**
     * Get priority level for a source
     */
    private getLevel;
    /**
     * Check if a brain directive might conflict with a core constraint
     */
    private mightConflict;
    /**
     * Determine if a directive contradicts a constraint
     */
    private isContradiction;
    /**
     * Check if a single line violates a constraint
     */
    private lineViolatesConstraint;
    /**
     * Get all active constraints (for debugging/transparency)
     */
    getConstraints(): CoreConstraint[];
    /**
     * Add a custom constraint (from user configuration)
     */
    addConstraint(constraint: CoreConstraint): void;
}
//# sourceMappingURL=priority-enforcer.d.ts.map