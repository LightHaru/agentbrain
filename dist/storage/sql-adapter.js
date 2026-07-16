"use strict";
/**
 * SQL Storage Adapter — Makes BrainDatabase compatible with existing module interfaces
 *
 * Modules currently call fileManager.loadMemories(), fileManager.writeFile(), etc.
 * This adapter wraps BrainDatabase to provide the same interface,
 * so we can swap storage without rewriting every module.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlStorageAdapter = void 0;
const brain_db_js_1 = require("./brain-db.js");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
/**
 * Drop-in replacement for BrainFileManager that uses SQLite
 */
class SqlStorageAdapter {
    db;
    brainDir;
    constructor(brainDir) {
        this.brainDir = brainDir;
        const dbPath = (0, node_path_1.join)(brainDir, 'brain.db');
        this.db = new brain_db_js_1.BrainDatabase(dbPath);
    }
    getDatabase() {
        return this.db;
    }
    // ==========================================================================
    // Memory interface (used by Hippocampus)
    // ==========================================================================
    async loadMemories() {
        const rows = this.db.getAllMemories();
        return rows.map(row => ({
            id: row.id,
            type: row.type,
            content: row.content,
            timestamp: row.timestamp,
            confidence: row.confidence,
            accessCount: row.access_count,
            lastAccessed: row.last_accessed,
            tags: JSON.parse(row.tags || '[]'),
        }));
    }
    /**
     * Delete a memory permanently from the SQL store (and its FTS row via trigger).
     */
    async deleteMemory(id) {
        this.db.deleteMemory(id);
    }
    async writeMemoryFile(type, memories) {
        // Batch insert/update — use transaction for speed
        this.db.transaction(() => {
            for (const mem of memories) {
                this.db.insertMemory({
                    id: mem.id,
                    type: mem.type,
                    content: mem.content,
                    timestamp: mem.timestamp,
                    confidence: mem.confidence,
                    tags: mem.tags,
                });
                // Update access count if changed
                if (mem.accessCount > 0) {
                    this.db.raw('UPDATE memories SET access_count = ?, last_accessed = ? WHERE id = ?', [mem.accessCount, mem.lastAccessed, mem.id]);
                }
            }
        });
    }
    // ==========================================================================
    // Generic file interface (used by Amygdala, Cingulate, Cerebellum, etc.)
    // ==========================================================================
    async readFile(path) {
        // Map known paths to SQL queries
        if (path === 'emotional/state.md') {
            return this.buildEmotionalStateFile();
        }
        if (path === 'emotional/relationship.md') {
            return this.buildRelationshipFile();
        }
        if (path === 'personality.md') {
            return this.buildPersonalityFile();
        }
        if (path === 'reflection/daily.md') {
            return this.buildReflectionsFile();
        }
        if (path === 'skills/proficiency.md') {
            return this.buildSkillsFile();
        }
        if (path === 'skills/habits.md') {
            return this.buildHabitsFile();
        }
        if (path === 'learning/lessons.md') {
            const lessons = this.db.getLessons();
            return lessons.length > 0 ? JSON.stringify(lessons.map(l => ({
                id: l.id,
                type: l.type,
                trigger: l.trigger_text,
                wrong: l.wrong,
                right: l.correct,
                confidence: l.confidence,
                occurrences: l.occurrences,
                timestamp: l.timestamp,
                lastApplied: l.last_applied,
                source: l.source,
            }))) : null;
        }
        if (path === 'learning/patterns.md') {
            const patterns = this.db.getPatterns();
            return patterns.length > 0 ? JSON.stringify(patterns.map(p => ({
                id: p.id,
                type: p.type,
                description: p.description,
                trigger: JSON.parse(p.trigger_json),
                action: p.action,
                confidence: p.confidence,
                occurrences: p.occurrences,
                lastTriggered: p.last_triggered,
                cooldownMs: p.cooldown_ms,
            }))) : null;
        }
        // Fallback: check meta table
        const value = this.db.getMeta(`file:${path}`);
        return value || null;
    }
    async writeFile(path, content) {
        // Map known paths to SQL writes
        if (path === 'emotional/state.md') {
            this.parseAndSaveEmotionalState(content);
            return;
        }
        if (path === 'emotional/relationship.md') {
            this.parseAndSaveRelationships(content);
            return;
        }
        if (path === 'personality.md') {
            this.parseAndSavePersonality(content);
            return;
        }
        if (path === 'reflection/daily.md') {
            // Store raw for now — reflections are complex
            this.db.setMeta(`file:${path}`, content);
            return;
        }
        if (path === 'reflection/growth.md') {
            this.db.setMeta(`file:${path}`, content);
            return;
        }
        if (path === 'skills/proficiency.md') {
            this.parseAndSaveSkills(content);
            return;
        }
        if (path === 'skills/habits.md') {
            this.parseAndSaveHabits(content);
            return;
        }
        if (path === 'learning/lessons.md') {
            try {
                const lessons = JSON.parse(content);
                for (const l of lessons) {
                    this.db.insertLesson({
                        id: l.id, type: l.type, trigger: l.trigger,
                        wrong: l.wrong, right: l.right, confidence: l.confidence,
                        timestamp: l.timestamp, source: l.source || '',
                    });
                }
            }
            catch (e) { /* store raw */
                this.db.setMeta(`file:${path}`, content);
            }
            return;
        }
        if (path === 'learning/patterns.md') {
            try {
                const patterns = JSON.parse(content);
                for (const p of patterns) {
                    this.db.upsertPattern({
                        id: p.id, type: p.type, description: p.description,
                        trigger: p.trigger, action: p.action,
                        confidence: p.confidence, cooldownMs: p.cooldownMs || 14400000,
                    });
                }
            }
            catch (e) {
                this.db.setMeta(`file:${path}`, content);
            }
            return;
        }
        if (path.startsWith('knowledge/')) {
            this.db.setMeta(`file:${path}`, content);
            return;
        }
        // Fallback: store in meta
        this.db.setMeta(`file:${path}`, content);
    }
    async ensureBrainStructure() {
        // SQLite handles this — no directories needed
        // But keep brainDir for vector.db compatibility
        if (!(0, node_fs_1.existsSync)(this.brainDir)) {
            (0, node_fs_1.mkdirSync)(this.brainDir, { recursive: true });
        }
    }
    // ==========================================================================
    // Shutdown
    // ==========================================================================
    close() {
        this.db.close();
    }
    // ==========================================================================
    // Private: Build .md-compatible strings from SQL (for modules that parse them)
    // ==========================================================================
    buildEmotionalStateFile() {
        const state = this.db.getMeta('emotional_state');
        return state || '# Emotional State\nMood: neutral\nValence: 0.0\nArousal: 0.3\nIntensity: 0.2';
    }
    buildRelationshipFile() {
        const rels = this.db.getAllRelationships();
        if (rels.length === 0)
            return '';
        let content = '# Relationships\n> Auto-managed by AgentBrain Amygdala\n\n';
        for (const rel of rels) {
            content += `## ${rel.user_name} (${rel.user_id})\n`;
            content += `- Depth: ${rel.depth.toFixed(1)}/100\n`;
            content += `- Trust: ${rel.trust_level.toFixed(1)}/100\n`;
            content += `- Interactions: ${rel.total_interactions} (${rel.positive_interactions}+ / ${rel.negative_interactions}-)\n`;
            content += `- Last: ${rel.last_interaction}\n`;
            content += `- Preferences: (none yet)\n\n`;
        }
        return content;
    }
    buildPersonalityFile() {
        const traits = this.db.getTraits();
        let content = '# Personality State\n> Auto-managed by AgentBrain\n\n## Core Traits (0-100)\n';
        for (const [trait, value] of Object.entries(traits)) {
            content += `- ${trait.charAt(0).toUpperCase() + trait.slice(1)}: ${value.toFixed(1)}\n`;
        }
        return content;
    }
    buildReflectionsFile() {
        const stored = this.db.getMeta('file:reflection/daily.md');
        return stored || '';
    }
    buildSkillsFile() {
        const skills = this.db.getSkills();
        if (skills.length === 0)
            return '';
        let content = '# Skills\n> Auto-managed by AgentBrain Cerebellum\n\n';
        for (const s of skills) {
            content += `### ${s.name}\n`;
            content += `- Category: ${s.category}\n`;
            content += `- Proficiency: ${s.proficiency}\n`;
            content += `- Used: ${s.times_used}\n`;
            content += `- Last: ${s.last_used}\n`;
            content += `- Success: ${s.successes}/${s.times_used}\n\n`;
        }
        return content;
    }
    buildHabitsFile() {
        const habits = this.db.getActiveHabits();
        if (habits.length === 0)
            return '';
        let content = '# Habits\n> Auto-managed by AgentBrain Cerebellum\n\n';
        for (const h of habits) {
            content += `### ${h.pattern}\n`;
            content += `- Action: ${h.action}\n`;
            content += `- Frequency: ${h.frequency}\n`;
            content += `- Confidence: ${h.confidence}\n`;
            content += `- First: ${h.first_seen}\n`;
            content += `- Last: ${h.last_seen}\n\n`;
        }
        return content;
    }
    // ==========================================================================
    // Private: Parse .md format and save to SQL (for modules that write .md)
    // ==========================================================================
    parseAndSaveEmotionalState(content) {
        this.db.setMeta('emotional_state', content);
    }
    parseAndSaveRelationships(content) {
        const lines = content.split('\n');
        let current = null;
        for (const line of lines) {
            const headerMatch = line.match(/^## (.+?) \((.+?)\)/);
            if (headerMatch) {
                if (current?.user_id)
                    this.db.upsertRelationship(current);
                current = { user_id: headerMatch[2], user_name: headerMatch[1] };
            }
            else if (current) {
                const m = line.match(/^- Depth:\s*([\d.]+)/);
                if (m)
                    current.depth = parseFloat(m[1]);
                const t = line.match(/^- Trust:\s*([\d.]+)/);
                if (t)
                    current.trust_level = parseFloat(t[1]);
                const i = line.match(/^- Interactions:\s*(\d+)\s*\((\d+)\+\s*\/\s*(\d+)-\)/);
                if (i) {
                    current.total_interactions = parseInt(i[1]);
                    current.positive_interactions = parseInt(i[2]);
                    current.negative_interactions = parseInt(i[3]);
                }
                const l = line.match(/^- Last:\s*(.+)/);
                if (l)
                    current.last_interaction = l[1].trim();
            }
        }
        if (current?.user_id)
            this.db.upsertRelationship(current);
    }
    parseAndSavePersonality(content) {
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^- (\w+):\s*([\d.]+)/);
            if (match) {
                this.db.setTrait(match[1].toLowerCase(), parseFloat(match[2]));
            }
        }
    }
    parseAndSaveSkills(content) {
        const lines = content.split('\n');
        let current = {};
        for (const line of lines) {
            const nameMatch = line.match(/^### (.+)/);
            if (nameMatch) {
                if (current.name) {
                    this.db.upsertSkill({
                        id: `skill-${current.name}`,
                        name: current.name,
                        category: current.category || 'general',
                        proficiency: current.proficiency || 0,
                        timesUsed: current.timesUsed || 0,
                        lastUsed: current.lastUsed || new Date().toISOString(),
                        successes: current.successes || 0,
                        failures: current.failures || 0,
                    });
                }
                current = { name: nameMatch[1].trim() };
            }
            const p = line.match(/^- Proficiency:\s*([\d.]+)/);
            if (p)
                current.proficiency = parseFloat(p[1]);
            const u = line.match(/^- Used:\s*(\d+)/);
            if (u)
                current.timesUsed = parseInt(u[1]);
            const l = line.match(/^- Last:\s*(.+)/);
            if (l)
                current.lastUsed = l[1].trim();
            const s = line.match(/^- Success:\s*(\d+)\/(\d+)/);
            if (s) {
                current.successes = parseInt(s[1]);
                current.failures = parseInt(s[2]) - parseInt(s[1]);
            }
            const c = line.match(/^- Category:\s*(.+)/);
            if (c)
                current.category = c[1].trim();
        }
        if (current.name) {
            this.db.upsertSkill({
                id: `skill-${current.name}`, name: current.name,
                category: current.category || 'general', proficiency: current.proficiency || 0,
                timesUsed: current.timesUsed || 0, lastUsed: current.lastUsed || new Date().toISOString(),
                successes: current.successes || 0, failures: current.failures || 0,
            });
        }
    }
    parseAndSaveHabits(content) {
        const lines = content.split('\n');
        let current = {};
        let idx = 0;
        for (const line of lines) {
            const nameMatch = line.match(/^### (.+)/);
            if (nameMatch) {
                if (current.pattern) {
                    this.db.upsertHabit({
                        id: `habit-${idx}`, pattern: current.pattern,
                        action: current.action || '', frequency: current.frequency || 1,
                        confidence: current.confidence || 0.5,
                        firstSeen: current.firstSeen || new Date().toISOString(),
                        lastSeen: current.lastSeen || new Date().toISOString(),
                        active: true,
                    });
                    idx++;
                }
                current = { pattern: nameMatch[1].trim() };
            }
            const a = line.match(/^- Action:\s*(.+)/);
            if (a)
                current.action = a[1].trim();
            const f = line.match(/^- Frequency:\s*(\d+)/);
            if (f)
                current.frequency = parseInt(f[1]);
            const c = line.match(/^- Confidence:\s*([\d.]+)/);
            if (c)
                current.confidence = parseFloat(c[1]);
            const fs = line.match(/^- First:\s*(.+)/);
            if (fs)
                current.firstSeen = fs[1].trim();
            const ls = line.match(/^- Last:\s*(.+)/);
            if (ls)
                current.lastSeen = ls[1].trim();
        }
        if (current.pattern) {
            this.db.upsertHabit({
                id: `habit-${idx}`, pattern: current.pattern,
                action: current.action || '', frequency: current.frequency || 1,
                confidence: current.confidence || 0.5,
                firstSeen: current.firstSeen || new Date().toISOString(),
                lastSeen: current.lastSeen || new Date().toISOString(),
                active: true,
            });
        }
    }
}
exports.SqlStorageAdapter = SqlStorageAdapter;
//# sourceMappingURL=sql-adapter.js.map