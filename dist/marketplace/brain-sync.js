"use strict";
/**
 * Brain Sync — Cloud backup & restore for brain state
 *
 * Phase 6: Provides local export/import functionality.
 * Cloud sync API will be added when backend is ready.
 *
 * Features:
 * - Export brain state as a single JSON archive
 * - Import/restore from archive
 * - Diff two brain states
 * - Versioned snapshots (local)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrainSync = void 0;
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class BrainSync {
    brainDir;
    snapshotsDir;
    constructor(brainDir) {
        this.brainDir = brainDir;
        this.snapshotsDir = (0, node_path_1.join)(brainDir, '..', 'snapshots');
    }
    /**
     * Export current brain state as a JSON snapshot
     */
    async export() {
        const files = {};
        await this.collectFiles(this.brainDir, '', files);
        const snapshot = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            brainDir: this.brainDir,
            files,
            metadata: this.extractMetadata(files),
        };
        return snapshot;
    }
    /**
     * Save snapshot to disk
     */
    async saveSnapshot(label) {
        const snapshot = await this.export();
        const filename = `snapshot-${label || Date.now()}.json`;
        if (!(0, node_fs_1.existsSync)(this.snapshotsDir)) {
            await (0, promises_1.mkdir)(this.snapshotsDir, { recursive: true });
        }
        const filePath = (0, node_path_1.join)(this.snapshotsDir, filename);
        await (0, promises_1.writeFile)(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
        console.log(`[BrainSync] Snapshot saved: ${filePath}`);
        return filePath;
    }
    /**
     * List available snapshots
     */
    async listSnapshots() {
        if (!(0, node_fs_1.existsSync)(this.snapshotsDir))
            return [];
        const files = await (0, promises_1.readdir)(this.snapshotsDir);
        const snapshots = [];
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            try {
                const content = await (0, promises_1.readFile)((0, node_path_1.join)(this.snapshotsDir, file), 'utf-8');
                const snapshot = JSON.parse(content);
                snapshots.push({
                    filename: file,
                    timestamp: snapshot.timestamp,
                    size: content.length,
                });
            }
            catch { /* skip invalid */ }
        }
        return snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    /**
     * Restore brain state from a snapshot
     */
    async restore(snapshot) {
        for (const [relativePath, content] of Object.entries(snapshot.files)) {
            const fullPath = (0, node_path_1.join)(this.brainDir, relativePath);
            const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
            if (!(0, node_fs_1.existsSync)(dir)) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
            }
            await (0, promises_1.writeFile)(fullPath, content, 'utf-8');
        }
        console.log(`[BrainSync] Restored from snapshot (${Object.keys(snapshot.files).length} files)`);
    }
    /**
     * Load a snapshot from file
     */
    async loadSnapshot(filename) {
        const filePath = (0, node_path_1.join)(this.snapshotsDir, filename);
        const content = await (0, promises_1.readFile)(filePath, 'utf-8');
        return JSON.parse(content);
    }
    /**
     * Diff two snapshots
     */
    diff(before, after) {
        const added = [];
        const removed = [];
        const modified = [];
        // Find added and modified
        for (const [path, content] of Object.entries(after.files)) {
            if (!(path in before.files)) {
                added.push(path);
            }
            else if (before.files[path] !== content) {
                modified.push({
                    path,
                    before: before.files[path],
                    after: content,
                });
            }
        }
        // Find removed
        for (const path of Object.keys(before.files)) {
            if (!(path in after.files)) {
                removed.push(path);
            }
        }
        return { added, removed, modified };
    }
    // --- Internal ---
    async collectFiles(dir, prefix, result) {
        if (!(0, node_fs_1.existsSync)(dir))
            return;
        const entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        for (const entry of entries) {
            const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                await this.collectFiles((0, node_path_1.join)(dir, entry.name), relativePath, result);
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                const content = await (0, promises_1.readFile)((0, node_path_1.join)(dir, entry.name), 'utf-8');
                result[relativePath] = content;
            }
        }
    }
    extractMetadata(files) {
        let totalMemories = 0;
        let totalSkills = 0;
        let totalReflections = 0;
        const personality = {};
        let mood = 'unknown';
        let interactionCount = 0;
        // Count memories
        for (const [path, content] of Object.entries(files)) {
            if (path.startsWith('memory/')) {
                totalMemories += (content.match(/^id: /gm) || []).length;
            }
            if (path === 'skills/proficiency.md') {
                totalSkills += (content.match(/^## /gm) || []).length;
            }
            if (path === 'reflection/daily.md') {
                totalReflections += (content.match(/^### /gm) || []).length;
            }
            if (path === 'personality.md') {
                const lines = content.split('\n');
                for (const line of lines) {
                    const match = line.match(/^- (\w+): ([\d.]+)/);
                    if (match)
                        personality[match[1].toLowerCase()] = parseFloat(match[2]);
                }
            }
            if (path === 'emotional/state.md') {
                const moodMatch = content.match(/Mood: (.+)/);
                if (moodMatch)
                    mood = moodMatch[1];
            }
            if (path.includes('feedback_log')) {
                interactionCount += (content.match(/^[✓✗○]/gm) || []).length;
            }
        }
        return { totalMemories, totalSkills, totalReflections, personality, mood, interactionCount };
    }
}
exports.BrainSync = BrainSync;
//# sourceMappingURL=brain-sync.js.map