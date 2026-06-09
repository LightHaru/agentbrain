"use strict";
/**
 * Migration: Convert AgentBrain .md storage to SQLite
 *
 * Reads existing .md files and imports into brain.db
 * Run once, then switch storage layer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToSqlite = migrateToSqlite;
const brain_db_js_1 = require("./brain-db.js");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function migrateToSqlite(brainDir) {
    const dbPath = (0, node_path_1.join)(brainDir, 'brain.db');
    const db = new brain_db_js_1.BrainDatabase(dbPath);
    const migrated = {};
    const errors = [];
    // 1. Migrate memories
    for (const type of ['episodic', 'semantic', 'procedural']) {
        const filePath = (0, node_path_1.join)(brainDir, 'memory', `${type}.md`);
        if (!(0, node_fs_1.existsSync)(filePath))
            continue;
        const content = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
        const blocks = parseMemoryBlocks(content);
        let count = 0;
        for (const block of blocks) {
            const inserted = db.insertMemory({
                id: block.id || `mem-migrated-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                type,
                content: block.content,
                timestamp: block.timestamp || new Date().toISOString(),
                confidence: block.confidence || 0.5,
                tags: block.tags || [],
            });
            if (inserted)
                count++;
        }
        migrated[`memories_${type}`] = count;
    }
    // 2. Migrate personality
    const personalityPath = (0, node_path_1.join)(brainDir, 'personality.md');
    if ((0, node_fs_1.existsSync)(personalityPath)) {
        const content = (0, node_fs_1.readFileSync)(personalityPath, 'utf-8');
        const traits = parsePersonality(content);
        let count = 0;
        for (const [trait, value] of Object.entries(traits)) {
            db.setTrait(trait, value);
            count++;
        }
        migrated['personality'] = count;
    }
    // 3. Migrate relationships
    const relPath = (0, node_path_1.join)(brainDir, 'emotional', 'relationship.md');
    if ((0, node_fs_1.existsSync)(relPath)) {
        const content = (0, node_fs_1.readFileSync)(relPath, 'utf-8');
        const rels = parseRelationships(content);
        let count = 0;
        for (const rel of rels) {
            db.upsertRelationship(rel);
            count++;
        }
        migrated['relationships'] = count;
    }
    // 4. Migrate skills
    const skillsPath = (0, node_path_1.join)(brainDir, 'skills', 'proficiency.md');
    if ((0, node_fs_1.existsSync)(skillsPath)) {
        const content = (0, node_fs_1.readFileSync)(skillsPath, 'utf-8');
        const skills = parseSkills(content);
        let count = 0;
        for (const skill of skills) {
            db.upsertSkill(skill);
            count++;
        }
        migrated['skills'] = count;
    }
    // 5. Migrate habits
    const habitsPath = (0, node_path_1.join)(brainDir, 'skills', 'habits.md');
    if ((0, node_fs_1.existsSync)(habitsPath)) {
        const content = (0, node_fs_1.readFileSync)(habitsPath, 'utf-8');
        const habits = parseHabits(content);
        let count = 0;
        for (const habit of habits) {
            db.upsertHabit(habit);
            count++;
        }
        migrated['habits'] = count;
    }
    // 6. Migrate lessons (if JSON file exists from new module)
    const lessonsPath = (0, node_path_1.join)(brainDir, 'learning', 'lessons.md');
    if ((0, node_fs_1.existsSync)(lessonsPath)) {
        try {
            const content = (0, node_fs_1.readFileSync)(lessonsPath, 'utf-8');
            const lessons = JSON.parse(content);
            let count = 0;
            for (const lesson of lessons) {
                db.insertLesson({
                    id: lesson.id,
                    type: lesson.type,
                    trigger: lesson.trigger,
                    wrong: lesson.wrong,
                    right: lesson.right,
                    confidence: lesson.confidence,
                    timestamp: lesson.timestamp,
                    source: lesson.source || '',
                });
                count++;
            }
            migrated['lessons'] = count;
        }
        catch (e) {
            errors.push(`lessons: ${e}`);
        }
    }
    // 7. Migrate patterns
    const patternsPath = (0, node_path_1.join)(brainDir, 'learning', 'patterns.md');
    if ((0, node_fs_1.existsSync)(patternsPath)) {
        try {
            const content = (0, node_fs_1.readFileSync)(patternsPath, 'utf-8');
            const patterns = JSON.parse(content);
            let count = 0;
            for (const p of patterns) {
                db.upsertPattern({
                    id: p.id,
                    type: p.type,
                    description: p.description,
                    trigger: p.trigger,
                    action: p.action,
                    confidence: p.confidence,
                    cooldownMs: p.cooldownMs || 14400000,
                });
                count++;
            }
            migrated['patterns'] = count;
        }
        catch (e) {
            errors.push(`patterns: ${e}`);
        }
    }
    db.close();
    return { migrated, errors };
}
function parseMemoryBlocks(content) {
    const blocks = [];
    const lines = content.split('\n');
    let current = {};
    for (const line of lines) {
        if (line.startsWith('id: ')) {
            if (current.id && current.content) {
                blocks.push(current);
            }
            current = { id: line.slice(4).trim() };
        }
        else if (line.startsWith('content: ')) {
            current.content = line.slice(9).trim();
        }
        else if (line.startsWith('timestamp: ')) {
            current.timestamp = line.slice(11).trim();
        }
        else if (line.startsWith('confidence: ')) {
            current.confidence = parseFloat(line.slice(12).trim()) || 0.5;
        }
        else if (line.startsWith('tags: ')) {
            current.tags = line.slice(6).trim().split(',').map(t => t.trim()).filter(Boolean);
        }
    }
    // Last block
    if (current.id && current.content) {
        blocks.push(current);
    }
    return blocks;
}
function parsePersonality(content) {
    const traits = {};
    const lines = content.split('\n');
    for (const line of lines) {
        const match = line.match(/^- (\w+):\s*([\d.]+)/);
        if (match) {
            traits[match[1].toLowerCase()] = parseFloat(match[2]);
        }
    }
    return traits;
}
function parseRelationships(content) {
    const rels = [];
    const lines = content.split('\n');
    let current = null;
    for (const line of lines) {
        const headerMatch = line.match(/^## (.+?) \((\d+)\)/);
        if (headerMatch) {
            if (current)
                rels.push(current);
            current = { user_id: headerMatch[2], user_name: headerMatch[1] };
        }
        else if (current) {
            const depthMatch = line.match(/^- Depth:\s*([\d.]+)/);
            if (depthMatch)
                current.depth = parseFloat(depthMatch[1]);
            const trustMatch = line.match(/^- Trust:\s*([\d.]+)/);
            if (trustMatch)
                current.trust_level = parseFloat(trustMatch[1]);
            const interMatch = line.match(/^- Interactions:\s*(\d+)\s*\((\d+)\+\s*\/\s*(\d+)-\)/);
            if (interMatch) {
                current.total_interactions = parseInt(interMatch[1]);
                current.positive_interactions = parseInt(interMatch[2]);
                current.negative_interactions = parseInt(interMatch[3]);
            }
            const lastMatch = line.match(/^- Last:\s*(.+)/);
            if (lastMatch)
                current.last_interaction = lastMatch[1].trim();
        }
    }
    if (current)
        rels.push(current);
    return rels;
}
function parseSkills(content) {
    const skills = [];
    const lines = content.split('\n');
    let current = {};
    for (const line of lines) {
        const idMatch = line.match(/^### (.+)/);
        if (idMatch) {
            if (current.id)
                skills.push(current);
            const name = idMatch[1].trim();
            current = { id: `skill-${name}`, name, category: 'general' };
        }
        const profMatch = line.match(/^- Proficiency:\s*([\d.]+)/);
        if (profMatch)
            current.proficiency = parseFloat(profMatch[1]);
        const usedMatch = line.match(/^- Used:\s*(\d+)/);
        if (usedMatch)
            current.timesUsed = parseInt(usedMatch[1]);
        const lastMatch = line.match(/^- Last:\s*(.+)/);
        if (lastMatch)
            current.lastUsed = lastMatch[1].trim();
        const successMatch = line.match(/^- Success:\s*(\d+)\/(\d+)/);
        if (successMatch) {
            current.successes = parseInt(successMatch[1]);
            current.failures = parseInt(successMatch[2]) - parseInt(successMatch[1]);
        }
        const catMatch = line.match(/^- Category:\s*(.+)/);
        if (catMatch)
            current.category = catMatch[1].trim();
    }
    if (current.id)
        skills.push(current);
    return skills;
}
function parseHabits(content) {
    const habits = [];
    const lines = content.split('\n');
    let current = {};
    for (const line of lines) {
        const idMatch = line.match(/^### (.+)/);
        if (idMatch) {
            if (current.id)
                habits.push(current);
            current = { id: `habit-${habits.length}`, pattern: idMatch[1].trim(), active: true };
        }
        const freqMatch = line.match(/^- Frequency:\s*(\d+)/);
        if (freqMatch)
            current.frequency = parseInt(freqMatch[1]);
        const confMatch = line.match(/^- Confidence:\s*([\d.]+)/);
        if (confMatch)
            current.confidence = parseFloat(confMatch[1]);
        const actionMatch = line.match(/^- Action:\s*(.+)/);
        if (actionMatch)
            current.action = actionMatch[1].trim();
        const firstMatch = line.match(/^- First:\s*(.+)/);
        if (firstMatch)
            current.firstSeen = firstMatch[1].trim();
        const lastMatch = line.match(/^- Last:\s*(.+)/);
        if (lastMatch)
            current.lastSeen = lastMatch[1].trim();
    }
    if (current.id)
        habits.push(current);
    return habits;
}
//# sourceMappingURL=migrate-to-sql.js.map