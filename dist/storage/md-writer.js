"use strict";
/**
 * BrainFileManager — Markdown file storage for brain state
 *
 * All brain state is stored as human-readable Markdown files.
 * This makes it git-friendly, inspectable, and editable by users.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrainFileManager = void 0;
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const BRAIN_DIRS = [
    'memory',
    'emotional',
    'skills',
    'reward',
    'executive',
    'reflection',
];
class BrainFileManager {
    brainDir;
    constructor(brainDir) {
        this.brainDir = brainDir;
    }
    /**
     * Ensure all brain directories exist
     */
    async ensureBrainStructure() {
        for (const dir of BRAIN_DIRS) {
            const path = (0, node_path_1.join)(this.brainDir, dir);
            if (!(0, node_fs_1.existsSync)(path)) {
                await (0, promises_1.mkdir)(path, { recursive: true });
            }
        }
        // Create initial personality.md if not exists
        const personalityPath = (0, node_path_1.join)(this.brainDir, 'personality.md');
        if (!(0, node_fs_1.existsSync)(personalityPath)) {
            await (0, promises_1.writeFile)(personalityPath, this.initialPersonalityTemplate());
        }
        console.log(`[BrainFileManager] Brain structure ready at ${this.brainDir}`);
    }
    /**
     * Load all memories from brain/memory/ files
     */
    async loadMemories() {
        const memories = [];
        const types = [
            'episodic', 'semantic', 'procedural'
        ];
        for (const type of types) {
            const filePath = (0, node_path_1.join)(this.brainDir, 'memory', `${type}.md`);
            if ((0, node_fs_1.existsSync)(filePath)) {
                const content = await (0, promises_1.readFile)(filePath, 'utf-8');
                const parsed = this.parseMemoryFile(content, type);
                memories.push(...parsed);
            }
        }
        return memories;
    }
    /**
     * Write memories of a specific type to their file
     */
    async writeMemoryFile(type, memories) {
        const filePath = (0, node_path_1.join)(this.brainDir, 'memory', `${type}.md`);
        const content = this.formatMemoryFile(type, memories);
        await (0, promises_1.writeFile)(filePath, content, 'utf-8');
    }
    /**
     * Append to a brain file (for logs, reflections, etc.)
     */
    async appendToFile(subPath, content) {
        const filePath = (0, node_path_1.join)(this.brainDir, subPath);
        let existing = '';
        if ((0, node_fs_1.existsSync)(filePath)) {
            existing = await (0, promises_1.readFile)(filePath, 'utf-8');
        }
        await (0, promises_1.writeFile)(filePath, existing + '\n' + content, 'utf-8');
    }
    /**
     * Read a brain file
     */
    async readFile(subPath) {
        const filePath = (0, node_path_1.join)(this.brainDir, subPath);
        if (!(0, node_fs_1.existsSync)(filePath))
            return null;
        return (0, promises_1.readFile)(filePath, 'utf-8');
    }
    /**
     * Write/overwrite a brain file
     */
    async writeFile(subPath, content) {
        const filePath = (0, node_path_1.join)(this.brainDir, subPath);
        const dir = filePath.substring(0, filePath.lastIndexOf('/'));
        if (!(0, node_fs_1.existsSync)(dir)) {
            await (0, promises_1.mkdir)(dir, { recursive: true });
        }
        await (0, promises_1.writeFile)(filePath, content, 'utf-8');
    }
    // --- Private helpers ---
    parseMemoryFile(content, type) {
        const memories = [];
        const blocks = content.split('\n---\n');
        for (const block of blocks) {
            if (!block.trim())
                continue;
            const idMatch = block.match(/^id: (.+)$/m);
            const contentMatch = block.match(/^content: (.+)$/m);
            const timestampMatch = block.match(/^timestamp: (.+)$/m);
            const confidenceMatch = block.match(/^confidence: (.+)$/m);
            const accessCountMatch = block.match(/^accessCount: (.+)$/m);
            const lastAccessedMatch = block.match(/^lastAccessed: (.+)$/m);
            const tagsMatch = block.match(/^tags: (.+)$/m);
            if (idMatch && contentMatch) {
                memories.push({
                    id: idMatch[1],
                    type,
                    content: contentMatch[1],
                    timestamp: timestampMatch?.[1] || new Date().toISOString(),
                    confidence: parseFloat(confidenceMatch?.[1] || '0.5'),
                    accessCount: parseInt(accessCountMatch?.[1] || '0', 10),
                    lastAccessed: lastAccessedMatch?.[1] || new Date().toISOString(),
                    tags: tagsMatch?.[1]?.split(',').map(t => t.trim()) || [],
                });
            }
        }
        return memories;
    }
    formatMemoryFile(type, memories) {
        const header = `# ${type.charAt(0).toUpperCase() + type.slice(1)} Memory\n`;
        const subheader = `> Auto-managed by AgentBrain Hippocampus. Last updated: ${new Date().toISOString()}\n\n`;
        const blocks = memories.map(m => [
            `id: ${m.id}`,
            `content: ${m.content}`,
            `timestamp: ${m.timestamp}`,
            `confidence: ${m.confidence.toFixed(3)}`,
            `accessCount: ${m.accessCount}`,
            `lastAccessed: ${m.lastAccessed}`,
            `tags: ${m.tags.join(', ')}`,
        ].join('\n'));
        return header + subheader + blocks.join('\n---\n') + '\n';
    }
    initialPersonalityTemplate() {
        return `# Personality State
> Auto-managed by AgentBrain. Evolves over time based on interactions.
> Created: ${new Date().toISOString()}

## Core Traits (0-100)
- Warmth: 50
- Assertiveness: 50
- Curiosity: 50
- Humor: 50
- Patience: 50
- Directness: 50
- Protectiveness: 50
- Independence: 50

## Formed Opinions
(None yet — will form through interactions)

## Communication Style
- Default tone: neutral
- Preferred length: adaptive
- Emoji usage: moderate

## Relationship
- Depth: 0 (new)
- Trust level: 0
- Interactions: 0
- Known preferences: (none yet)
`;
    }
}
exports.BrainFileManager = BrainFileManager;
//# sourceMappingURL=md-writer.js.map