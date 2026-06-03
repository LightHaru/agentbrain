import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { BrainDatabase } from '../src/storage/brain-db.js';
import { GraphMemory } from '../src/core/graph-memory.js';
import { Hippocampus } from '../src/core/hippocampus.js';
import { SqlStorageAdapter } from '../src/storage/sql-adapter.js';
import { defaultConfig } from '../src/core/config.js';

describe('GraphMemory integration', () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()!;
      await rm(dir, { recursive: true, force: true });
    }
  });

  async function tempDir(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'agentbrain-graph-test-'));
    tempDirs.push(dir);
    return dir;
  }

  it('stores entities and traverses relationships in brain.db', async () => {
    const dir = await tempDir();
    const db = new BrainDatabase(join(dir, 'brain.db'));
    const graph = new GraphMemory(db);

    graph.rememberKnowledge({
      timestamp: '2026-06-02T10:00:00Z',
      entities: [
        { name: 'AgentBrain', type: 'tool', aliases: [], firstSeen: '2026-06-02T10:00:00Z', lastSeen: '2026-06-02T10:00:00Z' },
        { name: 'memory-graph', type: 'tool', aliases: [], firstSeen: '2026-06-02T10:00:00Z', lastSeen: '2026-06-02T10:00:00Z' },
      ],
      relationships: [
        { from: 'AgentBrain', to: 'memory-graph', type: 'uses', confidence: 0.9, source: 'user_stated', fromType: 'tool', toType: 'tool' },
      ],
    });

    const stats = graph.getStats();
    expect(stats.entities).toBe(2);
    expect(stats.relationships).toBe(1);

    const recalled = graph.recallEntity('AgentBrain', 1);
    expect(recalled.entities.map(hit => hit.entity.name)).toContain('memory-graph');
    expect(recalled.context.join('\n')).toContain('AgentBrain --uses--> memory-graph');

    db.close();
  });

  it('lets Hippocampus consolidate extracted knowledge into graph recall', async () => {
    const dir = await tempDir();
    const storage = new SqlStorageAdapter(dir);
    const hippocampus = new Hippocampus({ ...defaultConfig, brainDir: dir }, storage);
    await hippocampus.initialize();

    await hippocampus.consolidate({
      message: 'AgentBrain dùng memory-graph để recall quan hệ',
      response: 'Em sẽ gộp graph vào brain.db',
      senderId: 'user1',
      senderName: 'Sếp',
      timestamp: '2026-06-02T10:00:00Z',
    });

    const graph = hippocampus.recallGraph('AgentBrain', 1);
    expect(graph).not.toBeNull();
    expect(graph!.context.join('\n')).toContain('AgentBrain --uses--> memory-graph');

    await hippocampus.shutdown();
    storage.close();
  });
});
