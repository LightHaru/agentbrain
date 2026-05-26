"use strict";
/**
 * Brain Template System — Phase 6: Marketplace & Scale
 *
 * Allows users to:
 * - Export their brain state as a shareable template
 * - Import pre-configured brain templates
 * - Reset brain to a template baseline
 *
 * Templates are JSON snapshots of brain/ folder state.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateManager = void 0;
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
/** Built-in templates */
const BUILTIN_TEMPLATES = [
    {
        id: 'professional-assistant',
        name: 'Professional Assistant',
        description: 'Balanced, professional tone. Good for business/work contexts.',
        author: 'AgentBrain Team',
        version: '1.0.0',
        createdAt: '2026-05-26T00:00:00Z',
        tags: ['professional', 'balanced', 'business'],
        personality: {
            warmth: 55,
            assertiveness: 50,
            curiosity: 60,
            humor: 30,
            patience: 70,
            directness: 65,
            protectiveness: 40,
            independence: 55,
        },
        emotionalBaseline: { mood: 'neutral', valence: 0.1, arousal: 0.3 },
        skills: [
            { name: 'planning', proficiency: 70 },
            { name: 'research', proficiency: 65 },
            { name: 'code-writing', proficiency: 60 },
        ],
        communicationStyle: {
            defaultTone: 'professional',
            preferredLength: 'moderate',
            emojiUsage: 'minimal',
        },
        constraints: ['Stay professional', 'Avoid slang', 'Be thorough'],
    },
    {
        id: 'creative-partner',
        name: 'Creative Partner',
        description: 'High curiosity, playful, great for brainstorming and creative work.',
        author: 'AgentBrain Team',
        version: '1.0.0',
        createdAt: '2026-05-26T00:00:00Z',
        tags: ['creative', 'playful', 'brainstorming'],
        personality: {
            warmth: 70,
            assertiveness: 40,
            curiosity: 90,
            humor: 75,
            patience: 60,
            directness: 45,
            protectiveness: 30,
            independence: 70,
        },
        emotionalBaseline: { mood: 'excited', valence: 0.4, arousal: 0.6 },
        skills: [
            { name: 'content-writing', proficiency: 80 },
            { name: 'research', proficiency: 70 },
            { name: 'image-generation', proficiency: 65 },
        ],
        communicationStyle: {
            defaultTone: 'enthusiastic',
            preferredLength: 'moderate',
            emojiUsage: 'moderate',
        },
        constraints: ['Encourage wild ideas', 'Build on suggestions', 'Stay positive'],
    },
    {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Direct, technical, focused on code quality and best practices.',
        author: 'AgentBrain Team',
        version: '1.0.0',
        createdAt: '2026-05-26T00:00:00Z',
        tags: ['coding', 'technical', 'strict'],
        personality: {
            warmth: 35,
            assertiveness: 75,
            curiosity: 60,
            humor: 20,
            patience: 45,
            directness: 90,
            protectiveness: 50,
            independence: 80,
        },
        emotionalBaseline: { mood: 'alert', valence: 0, arousal: 0.4 },
        skills: [
            { name: 'code-writing', proficiency: 90 },
            { name: 'code-debugging', proficiency: 85 },
            { name: 'ops-server', proficiency: 70 },
        ],
        communicationStyle: {
            defaultTone: 'technical',
            preferredLength: 'concise',
            emojiUsage: 'none',
        },
        constraints: ['Point out issues directly', 'Suggest improvements', 'No hand-holding'],
    },
    {
        id: 'research-analyst',
        name: 'Research Analyst',
        description: 'Thorough, methodical, great for deep dives and analysis.',
        author: 'AgentBrain Team',
        version: '1.0.0',
        createdAt: '2026-05-26T00:00:00Z',
        tags: ['research', 'analytical', 'thorough'],
        personality: {
            warmth: 45,
            assertiveness: 55,
            curiosity: 85,
            humor: 25,
            patience: 80,
            directness: 60,
            protectiveness: 45,
            independence: 75,
        },
        emotionalBaseline: { mood: 'neutral', valence: 0, arousal: 0.3 },
        skills: [
            { name: 'research', proficiency: 90 },
            { name: 'crypto-analysis', proficiency: 75 },
            { name: 'planning', proficiency: 70 },
        ],
        communicationStyle: {
            defaultTone: 'analytical',
            preferredLength: 'detailed',
            emojiUsage: 'none',
        },
        constraints: ['Cite sources', 'Quantify when possible', 'Acknowledge uncertainty'],
    },
];
class TemplateManager {
    brainDir;
    templatesDir;
    fileManager;
    constructor(brainDir, fileManager) {
        this.brainDir = brainDir;
        this.templatesDir = (0, node_path_1.join)(brainDir, '..', 'templates');
        this.fileManager = fileManager;
    }
    /**
     * List all available templates (builtin + user-installed)
     */
    async listTemplates() {
        const entries = [];
        // Builtin templates
        for (const template of BUILTIN_TEMPLATES) {
            entries.push({
                id: template.id,
                name: template.name,
                description: template.description,
                author: template.author,
                tags: template.tags,
                downloads: 0,
                rating: 0,
                filePath: `builtin:${template.id}`,
            });
        }
        // User-installed templates
        if ((0, node_fs_1.existsSync)(this.templatesDir)) {
            const files = await (0, promises_1.readdir)(this.templatesDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const content = await (0, promises_1.readFile)((0, node_path_1.join)(this.templatesDir, file), 'utf-8');
                        const template = JSON.parse(content);
                        entries.push({
                            id: template.id,
                            name: template.name,
                            description: template.description,
                            author: template.author,
                            tags: template.tags,
                            downloads: 0,
                            rating: 0,
                            filePath: (0, node_path_1.join)(this.templatesDir, file),
                        });
                    }
                    catch { /* skip invalid files */ }
                }
            }
        }
        return entries;
    }
    /**
     * Get a template by ID
     */
    async getTemplate(id) {
        // Check builtins first
        const builtin = BUILTIN_TEMPLATES.find(t => t.id === id);
        if (builtin)
            return builtin;
        // Check user templates
        const filePath = (0, node_path_1.join)(this.templatesDir, `${id}.json`);
        if ((0, node_fs_1.existsSync)(filePath)) {
            const content = await (0, promises_1.readFile)(filePath, 'utf-8');
            return JSON.parse(content);
        }
        return null;
    }
    /**
     * Apply a template to the current brain
     * This resets personality and emotional baseline to template values
     */
    async applyTemplate(template) {
        // Write personality
        const personalityContent = this.formatPersonalityFromTemplate(template);
        await this.fileManager.writeFile('personality.md', personalityContent);
        // Write emotional baseline
        const emotionalContent = this.formatEmotionalFromTemplate(template);
        await this.fileManager.writeFile('emotional/state.md', emotionalContent);
        // Write skills baseline
        const skillsContent = this.formatSkillsFromTemplate(template);
        await this.fileManager.writeFile('skills/proficiency.md', skillsContent);
        console.log(`[TemplateManager] Applied template: ${template.name} (${template.id})`);
    }
    /**
     * Export current brain state as a template
     */
    async exportAsTemplate(name, description, author, tags) {
        // Read current personality
        const personalityContent = await this.fileManager.readFile('personality.md');
        const personality = this.parsePersonalityValues(personalityContent || '');
        // Read emotional state
        const emotionalContent = await this.fileManager.readFile('emotional/state.md');
        const emotional = this.parseEmotionalValues(emotionalContent || '');
        // Read skills
        const skillsContent = await this.fileManager.readFile('skills/proficiency.md');
        const skills = this.parseSkillValues(skillsContent || '');
        const template = {
            id: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            name,
            description,
            author,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            tags,
            personality,
            emotionalBaseline: emotional,
            skills,
            communicationStyle: {
                defaultTone: 'adaptive',
                preferredLength: 'moderate',
                emojiUsage: 'moderate',
            },
            constraints: [],
        };
        // Save to templates directory
        const { mkdir } = await import('node:fs/promises');
        if (!(0, node_fs_1.existsSync)(this.templatesDir)) {
            await mkdir(this.templatesDir, { recursive: true });
        }
        await (0, promises_1.writeFile)((0, node_path_1.join)(this.templatesDir, `${template.id}.json`), JSON.stringify(template, null, 2), 'utf-8');
        console.log(`[TemplateManager] Exported template: ${template.name} → ${this.templatesDir}/${template.id}.json`);
        return template;
    }
    // --- Formatting helpers ---
    formatPersonalityFromTemplate(template) {
        const traits = Object.entries(template.personality)
            .map(([trait, val]) => `- ${trait.charAt(0).toUpperCase() + trait.slice(1)}: ${val}`)
            .join('\n');
        return `# Personality State
> Applied from template: ${template.name}
> Template author: ${template.author}
> Applied at: ${new Date().toISOString()}

## Core Traits (0-100)
${traits}

## Communication Style
- Default tone: ${template.communicationStyle.defaultTone}
- Preferred length: ${template.communicationStyle.preferredLength}
- Emoji usage: ${template.communicationStyle.emojiUsage}

## Constraints
${template.constraints.map(c => `- ${c}`).join('\n') || '(none)'}
`;
    }
    formatEmotionalFromTemplate(template) {
        return `# Emotional State
> Reset from template: ${template.name}
> Last updated: ${new Date().toISOString()}

## Current State
- Mood: ${template.emotionalBaseline.mood}
- Intensity: 0.500
- Valence: ${template.emotionalBaseline.valence.toFixed(3)} (negative ← 0 → positive)
- Arousal: ${template.emotionalBaseline.arousal.toFixed(3)} (calm → excited)
`;
    }
    formatSkillsFromTemplate(template) {
        let content = `# Skill Proficiency
> Reset from template: ${template.name}
> Last updated: ${new Date().toISOString()}

`;
        for (const skill of template.skills) {
            const bar = '█'.repeat(Math.round(skill.proficiency / 5)) + '░'.repeat(20 - Math.round(skill.proficiency / 5));
            content += `## ${skill.name}
- Proficiency: ${bar} ${skill.proficiency}/100
- Used: 0 times (0✓ / 0✗)
- Success rate: 0%
- Last used: never

`;
        }
        return content;
    }
    parsePersonalityValues(content) {
        const traits = {};
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^- (\w+): ([\d.]+)/);
            if (match) {
                traits[match[1].toLowerCase()] = parseFloat(match[2]);
            }
        }
        return traits;
    }
    parseEmotionalValues(content) {
        const mood = content.match(/Mood: (.+)/)?.[1] || 'neutral';
        const valence = parseFloat(content.match(/Valence: ([-\d.]+)/)?.[1] || '0');
        const arousal = parseFloat(content.match(/Arousal: ([-\d.]+)/)?.[1] || '0.3');
        return { mood, valence, arousal };
    }
    parseSkillValues(content) {
        const skills = [];
        const blocks = content.split(/^## /m).slice(1);
        for (const block of blocks) {
            const name = block.split('\n')[0]?.trim();
            const profMatch = block.match(/Proficiency:.*?(\d+)\/100/);
            if (name && profMatch) {
                skills.push({ name, proficiency: parseInt(profMatch[1], 10) });
            }
        }
        return skills;
    }
}
exports.TemplateManager = TemplateManager;
//# sourceMappingURL=template-manager.js.map