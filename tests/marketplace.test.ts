/**
 * Tests for Phase 6: Marketplace & Scale
 * - TemplateManager
 * - BrainSync
 * - BrainNetwork
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateManager } from '../src/marketplace/template-manager.js';
import { BrainSync } from '../src/marketplace/brain-sync.js';
import { BrainNetwork } from '../src/marketplace/brain-network.js';
import { BrainFileManager } from '../src/storage/md-writer.js';
import { join } from 'node:path';
import { rm, mkdir, writeFile } from 'node:fs/promises';

const TEST_BRAIN_DIR = join(import.meta.dirname || '.', '../.test-brain-phase6');

describe('TemplateManager', () => {
  let manager: TemplateManager;
  let fileManager: BrainFileManager;

  beforeEach(async () => {
    try { await rm(TEST_BRAIN_DIR, { recursive: true }); } catch { /* ok */ }
    await mkdir(TEST_BRAIN_DIR, { recursive: true });
    await mkdir(join(TEST_BRAIN_DIR, 'emotional'), { recursive: true });
    await mkdir(join(TEST_BRAIN_DIR, 'skills'), { recursive: true });

    fileManager = new BrainFileManager(TEST_BRAIN_DIR);
    manager = new TemplateManager(TEST_BRAIN_DIR, fileManager);
  });

  it('should list builtin templates', async () => {
    const templates = await manager.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(4);
    expect(templates.some(t => t.id === 'professional-assistant')).toBe(true);
    expect(templates.some(t => t.id === 'creative-partner')).toBe(true);
    expect(templates.some(t => t.id === 'code-reviewer')).toBe(true);
    expect(templates.some(t => t.id === 'research-analyst')).toBe(true);
  });

  it('should get a template by ID', async () => {
    const template = await manager.getTemplate('code-reviewer');
    expect(template).not.toBeNull();
    expect(template!.name).toBe('Code Reviewer');
    expect(template!.personality.directness).toBe(90);
  });

  it('should return null for unknown template', async () => {
    const template = await manager.getTemplate('nonexistent');
    expect(template).toBeNull();
  });

  it('should apply a template to brain', async () => {
    const template = await manager.getTemplate('creative-partner');
    expect(template).not.toBeNull();

    await manager.applyTemplate(template!);

    // Verify personality was written
    const personalityContent = await fileManager.readFile('personality.md');
    expect(personalityContent).toContain('Curiosity: 90');
    expect(personalityContent).toContain('Humor: 75');
    expect(personalityContent).toContain('Creative Partner');
  });

  it('should export current brain as template', async () => {
    // Write some brain state first
    await fileManager.writeFile('personality.md', `# Personality State
## Core Traits (0-100)
- Warmth: 70
- Directness: 80
- Curiosity: 65
`);
    await fileManager.writeFile('emotional/state.md', `# Emotional State
## Current State
- Mood: content
- Valence: 0.3
- Arousal: 0.2
`);
    await fileManager.writeFile('skills/proficiency.md', `# Skill Proficiency
## code-writing
- Proficiency: ████████████████░░░░ 80/100
`);

    const exported = await manager.exportAsTemplate(
      'My Custom Brain',
      'A custom brain template',
      'TestUser',
      ['custom', 'test']
    );

    expect(exported.id).toBe('my-custom-brain');
    expect(exported.name).toBe('My Custom Brain');
    expect(exported.personality.warmth).toBe(70);
    expect(exported.personality.directness).toBe(80);
  });
});

describe('BrainSync', () => {
  let sync: BrainSync;

  beforeEach(async () => {
    try { await rm(TEST_BRAIN_DIR, { recursive: true }); } catch { /* ok */ }
    await mkdir(TEST_BRAIN_DIR, { recursive: true });
    await mkdir(join(TEST_BRAIN_DIR, 'memory'), { recursive: true });
    await mkdir(join(TEST_BRAIN_DIR, 'emotional'), { recursive: true });

    // Write some test brain files
    await writeFile(join(TEST_BRAIN_DIR, 'personality.md'), '# Personality\n- Warmth: 60\n', 'utf-8');
    await writeFile(join(TEST_BRAIN_DIR, 'memory', 'episodic.md'), '# Episodic\nid: mem-1\ncontent: test memory\n', 'utf-8');
    await writeFile(join(TEST_BRAIN_DIR, 'emotional', 'state.md'), '# State\n- Mood: content\n', 'utf-8');

    sync = new BrainSync(TEST_BRAIN_DIR);
  });

  it('should export brain state as snapshot', async () => {
    const snapshot = await sync.export();

    expect(snapshot.version).toBe('1.0.0');
    expect(snapshot.timestamp).toBeDefined();
    expect(Object.keys(snapshot.files).length).toBeGreaterThanOrEqual(3);
    expect(snapshot.files['personality.md']).toContain('Warmth: 60');
    expect(snapshot.files['memory/episodic.md']).toContain('test memory');
  });

  it('should save and list snapshots', async () => {
    const filePath = await sync.saveSnapshot('test-v1');
    expect(filePath).toContain('snapshot-test-v1.json');

    const list = await sync.listSnapshots();
    expect(list.length).toBe(1);
    expect(list[0].filename).toBe('snapshot-test-v1.json');
  });

  it('should restore from snapshot', async () => {
    const snapshot = await sync.export();

    // Modify a file
    await writeFile(join(TEST_BRAIN_DIR, 'personality.md'), '# Modified\n- Warmth: 99\n', 'utf-8');

    // Restore
    await sync.restore(snapshot);

    // Verify restored
    const { readFile: rf } = await import('node:fs/promises');
    const content = await rf(join(TEST_BRAIN_DIR, 'personality.md'), 'utf-8');
    expect(content).toContain('Warmth: 60');
  });

  it('should diff two snapshots', async () => {
    const before = await sync.export();

    // Modify
    await writeFile(join(TEST_BRAIN_DIR, 'personality.md'), '# Modified\n- Warmth: 99\n', 'utf-8');
    await writeFile(join(TEST_BRAIN_DIR, 'memory', 'semantic.md'), '# New file\n', 'utf-8');

    const after = await sync.export();
    const diff = sync.diff(before, after);

    expect(diff.modified.length).toBeGreaterThanOrEqual(1);
    expect(diff.added).toContain('memory/semantic.md');
  });
});

describe('BrainNetwork', () => {
  let network: BrainNetwork;

  beforeEach(() => {
    network = new BrainNetwork({ agentId: 'aira-001' });
  });

  it('should register an agent', () => {
    const node = network.register('aira-001', ['research', 'coding'], ['crypto', 'tech']);
    expect(node.id).toBe('aira-001');
    expect(node.capabilities).toContain('research');
    expect(node.sharedTopics).toContain('crypto');
  });

  it('should share a memory', () => {
    const shared = network.shareMemory('SOL is at $178', 'crypto', 0.9);
    expect(shared.sourceAgent).toBe('aira-001');
    expect(shared.topic).toBe('crypto');
    expect(shared.confidence).toBe(0.9);
  });

  it('should query shared memories by topic', () => {
    network.shareMemory('SOL at $178', 'crypto', 0.9);
    network.shareMemory('BTC at $105k', 'crypto', 0.8);
    network.shareMemory('React 19 released', 'tech', 0.7);

    const cryptoMemories = network.queryShared('crypto');
    expect(cryptoMemories.length).toBe(2);
    expect(cryptoMemories[0].confidence).toBeGreaterThanOrEqual(cryptoMemories[1].confidence);

    const techMemories = network.queryShared('tech');
    expect(techMemories.length).toBe(1);
  });

  it('should create and subscribe to feeds', () => {
    const feed = network.createFeed('crypto-alerts');
    expect(feed.topic).toBe('crypto-alerts');

    const subscribed = network.subscribe('crypto-alerts');
    expect(subscribed).toBe(true);

    const notFound = network.subscribe('nonexistent');
    expect(notFound).toBe(false);
  });

  it('should get network status', () => {
    network.shareMemory('test', 'general', 0.5);
    network.createFeed('alerts');

    const status = network.getStatus();
    expect(status.agentId).toBe('aira-001');
    expect(status.sharedMemories).toBe(1);
    expect(status.feeds).toBe(1);
  });
});
