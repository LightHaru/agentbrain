"use strict";
/**
 * BrainDatabase — SQLite storage layer for AgentBrain
 *
 * Replaces Markdown file storage with proper SQL:
 * - Atomic writes, no corruption
 * - Fast queries with indexes
 * - UNIQUE constraints prevent duplicates
 * - vec0 extension ready for embeddings
 * - Easy delete/update/query
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrainDatabase = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
// ============================================================================
// Database
// ============================================================================
class BrainDatabase {
    db;
    dbPath;
    constructor(dbPath) {
        this.dbPath = dbPath;
        const dir = (0, node_path_1.dirname)(dbPath);
        if (!(0, node_fs_1.existsSync)(dir)) {
            (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        }
        this.db = new better_sqlite3_1.default(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.initialize();
    }
    // ==========================================================================
    // Schema
    // ==========================================================================
    initialize() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('episodic', 'semantic', 'procedural')),
        content TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.5,
        access_count INTEGER NOT NULL DEFAULT 0,
        last_accessed TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        embedding BLOB
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_hash ON memories(content_hash);
      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_confidence ON memories(confidence);
      CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);

      CREATE TABLE IF NOT EXISTS facts (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        relation TEXT NOT NULL,
        object TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.7,
        source TEXT NOT NULL DEFAULT 'inferred',
        timestamp TEXT NOT NULL,
        superseded_by TEXT,
        valid_from TEXT NOT NULL DEFAULT '',
        valid_until TEXT DEFAULT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_facts_subject ON facts(subject);
      CREATE INDEX IF NOT EXISTS idx_facts_relation ON facts(relation);
      CREATE INDEX IF NOT EXISTS idx_facts_active ON facts(superseded_by) WHERE superseded_by IS NULL;
      CREATE INDEX IF NOT EXISTS idx_facts_temporal ON facts(valid_from, valid_until);

      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        aliases TEXT NOT NULL DEFAULT '[]',
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);

      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        trigger_text TEXT NOT NULL,
        wrong TEXT NOT NULL,
        correct TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.5,
        occurrences INTEGER NOT NULL DEFAULT 1,
        timestamp TEXT NOT NULL,
        last_applied TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);
      CREATE INDEX IF NOT EXISTS idx_lessons_confidence ON lessons(confidence);

      CREATE TABLE IF NOT EXISTS patterns (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        trigger_json TEXT NOT NULL,
        action TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.5,
        occurrences INTEGER NOT NULL DEFAULT 1,
        last_triggered TEXT NOT NULL DEFAULT '',
        cooldown_ms INTEGER NOT NULL DEFAULT 14400000
      );

      CREATE TABLE IF NOT EXISTS relationships (
        user_id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        depth REAL NOT NULL DEFAULT 0,
        trust_level REAL NOT NULL DEFAULT 10,
        total_interactions INTEGER NOT NULL DEFAULT 0,
        positive_interactions INTEGER NOT NULL DEFAULT 0,
        negative_interactions INTEGER NOT NULL DEFAULT 0,
        last_interaction TEXT NOT NULL,
        preferences TEXT NOT NULL DEFAULT '[]',
        emotional_history TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS personality (
        trait TEXT PRIMARY KEY,
        value REAL NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reflections (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        task_description TEXT NOT NULL,
        outcome TEXT NOT NULL CHECK(outcome IN ('success', 'partial', 'failure')),
        user_satisfaction REAL NOT NULL DEFAULT 0,
        self_assessment REAL NOT NULL DEFAULT 0.5,
        lessons_learned TEXT NOT NULL DEFAULT '[]',
        adjustments TEXT NOT NULL DEFAULT '[]'
      );
      CREATE INDEX IF NOT EXISTS idx_reflections_timestamp ON reflections(timestamp);
      CREATE INDEX IF NOT EXISTS idx_reflections_outcome ON reflections(outcome);

      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        proficiency REAL NOT NULL DEFAULT 0,
        times_used INTEGER NOT NULL DEFAULT 0,
        last_used TEXT NOT NULL,
        successes INTEGER NOT NULL DEFAULT 0,
        failures INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        action TEXT NOT NULL,
        frequency INTEGER NOT NULL DEFAULT 1,
        confidence REAL NOT NULL DEFAULT 0.5,
        first_seen TEXT NOT NULL,
        last_seen TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- FTS5 virtual table for BM25 search
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        tags,
        content='memories',
        content_rowid='rowid'
      );

      -- Triggers to keep FTS5 in sync
      CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, content, tags) VALUES (new.rowid, new.content, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = old.rowid;
        INSERT INTO memories_fts(rowid, content, tags) VALUES (new.rowid, new.content, new.tags);
      END;
    `);
        console.log('[BrainDB] Schema initialized');
    }
    // ==========================================================================
    // Memories
    // ==========================================================================
    insertMemory(memory) {
        const hash = this.hashContent(memory.content);
        try {
            this.db.prepare(`
        INSERT OR IGNORE INTO memories (id, type, content, content_hash, timestamp, confidence, access_count, last_accessed, tags)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
      `).run(memory.id, memory.type, memory.content, hash, memory.timestamp, memory.confidence, memory.timestamp, JSON.stringify(memory.tags));
            return true;
        }
        catch (e) {
            if (e.code === 'SQLITE_CONSTRAINT_UNIQUE')
                return false; // duplicate
            throw e;
        }
    }
    getMemories(type, limit = 100) {
        if (type) {
            return this.db.prepare('SELECT * FROM memories WHERE type = ? ORDER BY timestamp DESC LIMIT ?').all(type, limit);
        }
        return this.db.prepare('SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?').all(limit);
    }
    getAllMemories() {
        return this.db.prepare('SELECT * FROM memories ORDER BY timestamp DESC').all();
    }
    searchMemories(query, limit = 10) {
        // Simple LIKE search — vector search handled by VectorMemory module
        const pattern = `%${query}%`;
        return this.db.prepare(`
      SELECT * FROM memories WHERE content LIKE ? ORDER BY confidence DESC, timestamp DESC LIMIT ?
    `).all(pattern, limit);
    }
    /**
     * BM25 full-text search using FTS5
     * Returns memories ranked by BM25 relevance score
     */
    bm25Search(query, limit = 10) {
        const ftsQuery = this.toFts5Query(query);
        if (!ftsQuery) {
            return [];
        }
        try {
            const results = this.db.prepare(`
        SELECT m.*, bm25(memories_fts) as bm25_score
        FROM memories_fts
        JOIN memories m ON memories_fts.rowid = m.rowid
        WHERE memories_fts MATCH ?
        ORDER BY bm25_score
        LIMIT ?
      `).all(ftsQuery, limit);
            return results;
        }
        catch (e) {
            // Fallback to LIKE search if FTS5 query fails
            console.warn('[BrainDB] FTS5 query failed, falling back to LIKE:', e.message);
            return this.searchMemories(query, limit).map(m => ({ ...m, bm25_score: 0 }));
        }
    }
    updateMemoryAccess(id) {
        this.db.prepare(`
      UPDATE memories SET access_count = access_count + 1, last_accessed = ? WHERE id = ?
    `).run(new Date().toISOString(), id);
    }
    deleteMemory(id) {
        this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    }
    deleteMemoriesByContent(contentPattern) {
        const result = this.db.prepare('DELETE FROM memories WHERE content LIKE ?').run(`%${contentPattern}%`);
        return result.changes;
    }
    getMemoryStats() {
        const row = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type='episodic' THEN 1 ELSE 0 END) as episodic,
        SUM(CASE WHEN type='semantic' THEN 1 ELSE 0 END) as semantic,
        SUM(CASE WHEN type='procedural' THEN 1 ELSE 0 END) as procedural
      FROM memories
    `).get();
        return { total: row.total, episodic: row.episodic, semantic: row.semantic, procedural: row.procedural };
    }
    // ==========================================================================
    // Facts
    // ==========================================================================
    insertFact(fact) {
        const validFrom = fact.validFrom || fact.timestamp;
        this.db.prepare(`
      INSERT OR REPLACE INTO facts (id, subject, relation, object, confidence, source, timestamp, valid_from)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fact.id, fact.subject, fact.relation, fact.object, fact.confidence, fact.source, fact.timestamp, validFrom);
    }
    getActiveFacts(subject) {
        if (subject) {
            return this.db.prepare(`
        SELECT * FROM facts WHERE superseded_by IS NULL AND (subject LIKE ? OR object LIKE ?) ORDER BY timestamp DESC
      `).all(`%${subject}%`, `%${subject}%`);
        }
        return this.db.prepare('SELECT * FROM facts WHERE superseded_by IS NULL ORDER BY timestamp DESC').all();
    }
    /**
     * Get facts valid at a specific point in time
     */
    getFactsAt(timestamp, subject) {
        if (subject) {
            return this.db.prepare(`
        SELECT * FROM facts 
        WHERE (valid_from <= ? OR valid_from = '') 
          AND (valid_until IS NULL OR valid_until > ?)
          AND (subject LIKE ? OR object LIKE ?)
        ORDER BY timestamp DESC
      `).all(timestamp, timestamp, `%${subject}%`, `%${subject}%`);
        }
        return this.db.prepare(`
      SELECT * FROM facts 
      WHERE (valid_from <= ? OR valid_from = '') 
        AND (valid_until IS NULL OR valid_until > ?)
      ORDER BY timestamp DESC
    `).all(timestamp, timestamp);
    }
    /**
     * Get currently valid facts (valid_until IS NULL)
     */
    getCurrentFacts(subject) {
        if (subject) {
            return this.db.prepare(`
        SELECT * FROM facts 
        WHERE valid_until IS NULL 
          AND (subject LIKE ? OR object LIKE ?)
        ORDER BY timestamp DESC
      `).all(`%${subject}%`, `%${subject}%`);
        }
        return this.db.prepare(`
      SELECT * FROM facts WHERE valid_until IS NULL ORDER BY timestamp DESC
    `).all();
    }
    supersedeFact(oldFactId, newFactId, timestamp) {
        const now = timestamp || new Date().toISOString();
        this.db.prepare('UPDATE facts SET superseded_by = ?, valid_until = ? WHERE id = ?').run(newFactId, now, oldFactId);
    }
    // ==========================================================================
    // Entities
    // ==========================================================================
    upsertEntity(entity) {
        const id = `ent-${this.hashContent(entity.name).slice(0, 12)}`;
        this.db.prepare(`
      INSERT INTO entities (id, name, type, aliases, first_seen, last_seen)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_seen = ?, type = ?
    `).run(id, entity.name, entity.type, JSON.stringify(entity.aliases || []), entity.timestamp, entity.timestamp, entity.timestamp, entity.type);
    }
    getEntities(type) {
        if (type) {
            return this.db.prepare('SELECT * FROM entities WHERE type = ? ORDER BY last_seen DESC').all(type);
        }
        return this.db.prepare('SELECT * FROM entities ORDER BY last_seen DESC').all();
    }
    // ==========================================================================
    // Lessons
    // ==========================================================================
    insertLesson(lesson) {
        this.db.prepare(`
      INSERT OR REPLACE INTO lessons (id, type, trigger_text, wrong, correct, confidence, occurrences, timestamp, last_applied, source)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(lesson.id, lesson.type, lesson.trigger, lesson.wrong, lesson.right, lesson.confidence, lesson.timestamp, lesson.timestamp, lesson.source);
    }
    reinforceLesson(id) {
        this.db.prepare(`
      UPDATE lessons SET occurrences = occurrences + 1, confidence = MIN(1.0, confidence + 0.1), last_applied = ? WHERE id = ?
    `).run(new Date().toISOString(), id);
    }
    getLessons(minConfidence = 0) {
        return this.db.prepare('SELECT * FROM lessons WHERE confidence >= ? ORDER BY confidence DESC').all(minConfidence);
    }
    // ==========================================================================
    // Patterns
    // ==========================================================================
    upsertPattern(pattern) {
        this.db.prepare(`
      INSERT INTO patterns (id, type, description, trigger_json, action, confidence, occurrences, cooldown_ms)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET confidence = MIN(1.0, confidence + 0.05), occurrences = occurrences + 1
    `).run(pattern.id, pattern.type, pattern.description, JSON.stringify(pattern.trigger), pattern.action, pattern.confidence, pattern.cooldownMs);
    }
    getPatterns() {
        return this.db.prepare('SELECT * FROM patterns ORDER BY confidence DESC').all();
    }
    updatePatternTriggered(id) {
        this.db.prepare('UPDATE patterns SET last_triggered = ? WHERE id = ?').run(new Date().toISOString(), id);
    }
    // ==========================================================================
    // Relationships
    // ==========================================================================
    upsertRelationship(rel) {
        const existing = this.db.prepare('SELECT * FROM relationships WHERE user_id = ?').get(rel.user_id);
        if (existing) {
            const updates = [];
            const values = [];
            for (const [key, val] of Object.entries(rel)) {
                if (key !== 'user_id' && val !== undefined) {
                    updates.push(`${key} = ?`);
                    values.push(val);
                }
            }
            if (updates.length > 0) {
                values.push(rel.user_id);
                this.db.prepare(`UPDATE relationships SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
            }
        }
        else {
            this.db.prepare(`
        INSERT INTO relationships (user_id, user_name, depth, trust_level, total_interactions, positive_interactions, negative_interactions, last_interaction, preferences, emotional_history)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(rel.user_id, rel.user_name || 'Unknown', rel.depth || 0, rel.trust_level || 10, rel.total_interactions || 0, rel.positive_interactions || 0, rel.negative_interactions || 0, rel.last_interaction || new Date().toISOString(), rel.preferences || '[]', rel.emotional_history || '[]');
        }
    }
    getRelationship(userId) {
        return this.db.prepare('SELECT * FROM relationships WHERE user_id = ?').get(userId);
    }
    getAllRelationships() {
        return this.db.prepare('SELECT * FROM relationships ORDER BY total_interactions DESC').all();
    }
    // ==========================================================================
    // Personality
    // ==========================================================================
    setTrait(trait, value) {
        this.db.prepare(`
      INSERT INTO personality (trait, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(trait) DO UPDATE SET value = ?, updated_at = ?
    `).run(trait, value, new Date().toISOString(), value, new Date().toISOString());
    }
    getTraits() {
        const rows = this.db.prepare('SELECT trait, value FROM personality').all();
        const traits = {};
        for (const row of rows) {
            traits[row.trait] = row.value;
        }
        return traits;
    }
    // ==========================================================================
    // Reflections
    // ==========================================================================
    insertReflection(ref) {
        this.db.prepare(`
      INSERT OR REPLACE INTO reflections (id, timestamp, task_description, outcome, user_satisfaction, self_assessment, lessons_learned, adjustments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ref.id, ref.timestamp, ref.task, ref.outcome, ref.satisfaction, ref.selfAssessment, JSON.stringify(ref.lessons), JSON.stringify(ref.adjustments));
    }
    getReflections(limit = 50) {
        return this.db.prepare('SELECT * FROM reflections ORDER BY timestamp DESC LIMIT ?').all(limit);
    }
    getReflectionStats() {
        const row = this.db.prepare(`
      SELECT COUNT(*) as total,
        AVG(CASE WHEN outcome='success' THEN 1.0 WHEN outcome='partial' THEN 0.5 ELSE 0.0 END) as success_rate,
        AVG(user_satisfaction) as avg_satisfaction
      FROM reflections
    `).get();
        return { total: row.total || 0, successRate: row.success_rate || 0, avgSatisfaction: row.avg_satisfaction || 0 };
    }
    // ==========================================================================
    // Skills
    // ==========================================================================
    upsertSkill(skill) {
        this.db.prepare(`
      INSERT INTO skills (id, name, category, proficiency, times_used, last_used, successes, failures)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET proficiency = ?, times_used = ?, last_used = ?, successes = ?, failures = ?
    `).run(skill.id, skill.name, skill.category, skill.proficiency, skill.timesUsed, skill.lastUsed, skill.successes, skill.failures, skill.proficiency, skill.timesUsed, skill.lastUsed, skill.successes, skill.failures);
    }
    getSkills() {
        return this.db.prepare('SELECT * FROM skills ORDER BY proficiency DESC').all();
    }
    // ==========================================================================
    // Habits
    // ==========================================================================
    upsertHabit(habit) {
        this.db.prepare(`
      INSERT INTO habits (id, pattern, action, frequency, confidence, first_seen, last_seen, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET frequency = ?, confidence = ?, last_seen = ?, active = ?
    `).run(habit.id, habit.pattern, habit.action, habit.frequency, habit.confidence, habit.firstSeen, habit.lastSeen, habit.active ? 1 : 0, habit.frequency, habit.confidence, habit.lastSeen, habit.active ? 1 : 0);
    }
    getActiveHabits() {
        return this.db.prepare('SELECT * FROM habits WHERE active = 1 ORDER BY confidence DESC').all();
    }
    // ==========================================================================
    // Meta
    // ==========================================================================
    setMeta(key, value) {
        this.db.prepare(`
      INSERT INTO meta (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `).run(key, value, new Date().toISOString(), value, new Date().toISOString());
    }
    getMeta(key) {
        const row = this.db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
        return row?.value;
    }
    // ==========================================================================
    // Utilities
    // ==========================================================================
    hashContent(content) {
        return (0, node_crypto_1.createHash)('sha256').update(content.trim().toLowerCase()).digest('hex').slice(0, 32);
    }
    toFts5Query(query) {
        const tokens = query
            .normalize('NFKC')
            .match(/[\p{L}\p{N}_]+/gu);
        if (!tokens) {
            return '';
        }
        const uniqueTokens = Array.from(new Set(tokens
            .map(token => token.replace(/"/g, '').trim())
            .filter(token => token.length >= 2)
            .slice(0, 16)));
        return uniqueTokens.map(token => `"${token}"`).join(' OR ');
    }
    close() {
        this.db.close();
    }
    getDbPath() {
        return this.dbPath;
    }
    /**
     * Run raw SQL (for advanced queries)
     */
    raw(sql, params = []) {
        const statement = this.db.prepare(sql);
        return statement.reader ? statement.all(...params) : statement.run(...params);
    }
    /**
     * Transaction wrapper
     */
    transaction(fn) {
        return this.db.transaction(fn)();
    }
}
exports.BrainDatabase = BrainDatabase;
//# sourceMappingURL=brain-db.js.map