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
import { BrainFileManager } from '../storage/md-writer.js';
export interface BrainTemplate {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    createdAt: string;
    tags: string[];
    personality: Record<string, number>;
    emotionalBaseline: {
        mood: string;
        valence: number;
        arousal: number;
    };
    skills: Array<{
        name: string;
        proficiency: number;
    }>;
    communicationStyle: {
        defaultTone: string;
        preferredLength: 'concise' | 'moderate' | 'detailed';
        emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
    };
    constraints: string[];
}
export interface TemplateManifest {
    templates: TemplateEntry[];
    lastUpdated: string;
}
export interface TemplateEntry {
    id: string;
    name: string;
    description: string;
    author: string;
    tags: string[];
    downloads: number;
    rating: number;
    filePath: string;
}
export declare class TemplateManager {
    private brainDir;
    private templatesDir;
    private fileManager;
    constructor(brainDir: string, fileManager: BrainFileManager);
    /**
     * List all available templates (builtin + user-installed)
     */
    listTemplates(): Promise<TemplateEntry[]>;
    /**
     * Get a template by ID
     */
    getTemplate(id: string): Promise<BrainTemplate | null>;
    /**
     * Apply a template to the current brain
     * This resets personality and emotional baseline to template values
     */
    applyTemplate(template: BrainTemplate): Promise<void>;
    /**
     * Export current brain state as a template
     */
    exportAsTemplate(name: string, description: string, author: string, tags: string[]): Promise<BrainTemplate>;
    private formatPersonalityFromTemplate;
    private formatEmotionalFromTemplate;
    private formatSkillsFromTemplate;
    private parsePersonalityValues;
    private parseEmotionalValues;
    private parseSkillValues;
}
//# sourceMappingURL=template-manager.d.ts.map