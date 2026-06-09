/**
 * Migration: Convert AgentBrain .md storage to SQLite
 *
 * Reads existing .md files and imports into brain.db
 * Run once, then switch storage layer.
 */
export declare function migrateToSqlite(brainDir: string): {
    migrated: Record<string, number>;
    errors: string[];
};
//# sourceMappingURL=migrate-to-sql.d.ts.map