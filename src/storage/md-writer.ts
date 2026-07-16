/**
 * BrainFileManager — Markdown file storage for brain state
 * 
 * All brain state is stored as human-readable Markdown files.
 * This makes it git-friendly, inspectable, and editable by users.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Memory } from '../index.js';

const BRAIN_DIRS = [
  'memory',
  'emotional',
  'skills',
  'reward',
  'executive',
  'reflection',
];

export class BrainFileManager {
  private brainDir: string;

  constructor(brainDir: string) {
    this.brainDir = brainDir;
  }

  /**
   * Ensure all brain directories exist
   */
  async ensureBrainStructure(): Promise<void> {
    for (const dir of BRAIN_DIRS) {
      const path = join(this.brainDir, dir);
      if (!existsSync(path)) {
        await mkdir(path, { recursive: true });
      }
    }

    // Create initial personality.md if not exists
    const personalityPath = join(this.brainDir, 'personality.md');
    if (!existsSync(personalityPath)) {
      await writeFile(personalityPath, this.initialPersonalityTemplate());
    }

    console.log(`[BrainFileManager] Brain structure ready at ${this.brainDir}`);
  }

  /**
   * Load all memories from brain/memory/ files
   */
  async loadMemories(): Promise<Memory[]> {
    const memories: Memory[] = [];
    const types: Array<'episodic' | 'semantic' | 'procedural'> = [
      'episodic', 'semantic', 'procedural'
    ];

    for (const type of types) {
      const filePath = join(this.brainDir, 'memory', `${type}.md`);
      if (existsSync(filePath)) {
        const content = await readFile(filePath, 'utf-8');
        const parsed = this.parseMemoryFile(content, type);
        memories.push(...parsed);
      }
    }

    return memories;
  }

  /**
   * Write memories of a specific type to their file
   */
  async writeMemoryFile(type: 'episodic' | 'semantic' | 'procedural', memories: Memory[]): Promise<void> {
    const filePath = join(this.brainDir, 'memory', `${type}.md`);
    const content = this.formatMemoryFile(type, memories);
    await writeFile(filePath, content, 'utf-8');
  }

  /**
   * Delete is handled implicitly for the markdown backend: memories are fully
   * rewritten by writeMemoryFile, so a removed memory simply won't be written
   * back. This no-op keeps the storage interface uniform with SqlStorageAdapter.
   */
  async deleteMemory(_id: string): Promise<void> {
    // no-op: markdown files are rewritten wholesale on persist()
  }

  /**
   * Append to a brain file (for logs, reflections, etc.)
   */
  async appendToFile(subPath: string, content: string): Promise<void> {
    const filePath = join(this.brainDir, subPath);
    let existing = '';
    if (existsSync(filePath)) {
      existing = await readFile(filePath, 'utf-8');
    }
    await writeFile(filePath, existing + '\n' + content, 'utf-8');
  }

  /**
   * Read a brain file
   */
  async readFile(subPath: string): Promise<string | null> {
    const filePath = join(this.brainDir, subPath);
    if (!existsSync(filePath)) return null;
    return readFile(filePath, 'utf-8');
  }

  /**
   * Write/overwrite a brain file
   */
  async writeFile(subPath: string, content: string): Promise<void> {
    const filePath = join(this.brainDir, subPath);
    const dir = dirname(filePath);
    if (dir && dir !== '.' && !existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(filePath, content, 'utf-8');
  }

  // --- Private helpers ---

  private parseMemoryFile(content: string, type: Memory['type']): Memory[] {
    const memories: Memory[] = [];
    const blocks = content.split('\n---\n');

    for (const block of blocks) {
      if (!block.trim()) continue;

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

  private formatMemoryFile(type: string, memories: Memory[]): string {
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

  private initialPersonalityTemplate(): string {
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
