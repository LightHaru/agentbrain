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

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface BrainSnapshot {
  version: string;
  timestamp: string;
  brainDir: string;
  files: Record<string, string>; // relative path → content
  metadata: {
    totalMemories: number;
    totalSkills: number;
    totalReflections: number;
    personality: Record<string, number>;
    mood: string;
    interactionCount: number;
  };
}

export interface BrainDiff {
  added: string[];
  removed: string[];
  modified: Array<{
    path: string;
    before: string;
    after: string;
  }>;
}

export class BrainSync {
  private brainDir: string;
  private snapshotsDir: string;

  constructor(brainDir: string) {
    this.brainDir = brainDir;
    this.snapshotsDir = join(brainDir, '..', 'snapshots');
  }

  /**
   * Export current brain state as a JSON snapshot
   */
  async export(): Promise<BrainSnapshot> {
    const files: Record<string, string> = {};
    await this.collectFiles(this.brainDir, '', files);

    const snapshot: BrainSnapshot = {
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
  async saveSnapshot(label?: string): Promise<string> {
    const snapshot = await this.export();
    const filename = `snapshot-${label || Date.now()}.json`;

    if (!existsSync(this.snapshotsDir)) {
      await mkdir(this.snapshotsDir, { recursive: true });
    }

    const filePath = join(this.snapshotsDir, filename);
    await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

    console.log(`[BrainSync] Snapshot saved: ${filePath}`);
    return filePath;
  }

  /**
   * List available snapshots
   */
  async listSnapshots(): Promise<Array<{ filename: string; timestamp: string; size: number }>> {
    if (!existsSync(this.snapshotsDir)) return [];

    const files = await readdir(this.snapshotsDir);
    const snapshots: Array<{ filename: string; timestamp: string; size: number }> = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await readFile(join(this.snapshotsDir, file), 'utf-8');
        const snapshot: BrainSnapshot = JSON.parse(content);
        snapshots.push({
          filename: file,
          timestamp: snapshot.timestamp,
          size: content.length,
        });
      } catch { /* skip invalid */ }
    }

    return snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Restore brain state from a snapshot
   */
  async restore(snapshot: BrainSnapshot): Promise<void> {
    for (const [relativePath, content] of Object.entries(snapshot.files)) {
      const fullPath = join(this.brainDir, relativePath);
      const dir = dirname(fullPath);

      if (dir && dir !== '.' && !existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(fullPath, content, 'utf-8');
    }

    console.log(`[BrainSync] Restored from snapshot (${Object.keys(snapshot.files).length} files)`);
  }

  /**
   * Load a snapshot from file
   */
  async loadSnapshot(filename: string): Promise<BrainSnapshot> {
    const filePath = join(this.snapshotsDir, filename);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Diff two snapshots
   */
  diff(before: BrainSnapshot, after: BrainSnapshot): BrainDiff {
    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ path: string; before: string; after: string }> = [];

    // Find added and modified
    for (const [path, content] of Object.entries(after.files)) {
      if (!(path in before.files)) {
        added.push(path);
      } else if (before.files[path] !== content) {
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

  private async collectFiles(dir: string, prefix: string, result: Record<string, string>): Promise<void> {
    if (!existsSync(dir)) return;

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await this.collectFiles(join(dir, entry.name), relativePath, result);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = await readFile(join(dir, entry.name), 'utf-8');
        result[relativePath] = content;
      }
    }
  }

  private extractMetadata(files: Record<string, string>): BrainSnapshot['metadata'] {
    let totalMemories = 0;
    let totalSkills = 0;
    let totalReflections = 0;
    const personality: Record<string, number> = {};
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
          if (match) personality[match[1].toLowerCase()] = parseFloat(match[2]);
        }
      }
      if (path === 'emotional/state.md') {
        const moodMatch = content.match(/Mood: (.+)/);
        if (moodMatch) mood = moodMatch[1];
      }
      if (path.includes('feedback_log')) {
        interactionCount += (content.match(/^[✓✗○]/gm) || []).length;
      }
    }

    return { totalMemories, totalSkills, totalReflections, personality, mood, interactionCount };
  }
}
