/**
 * MemoryStorage — in-memory storage adapter for the agent-neutral SDK.
 *
 * Extends BrainFileManager so it satisfies every module's storage type, but
 * overrides all I/O to live in RAM. This lets an external agent run the brain
 * engine with zero filesystem/sqlite dependency (clean, sandbox-safe, testable).
 *
 * Nothing here touches node:fs. State is kept in plain Maps and discarded when
 * the process exits unless the host explicitly snapshots it via dump()/load().
 */
import { BrainFileManager } from './md-writer.js';
import type { Memory } from '../index.js';

type MemType = 'episodic' | 'semantic' | 'procedural';

export class MemoryStorage extends BrainFileManager {
  private files = new Map<string, string>();
  private memories: Record<MemType, Memory[]> = {
    episodic: [],
    semantic: [],
    procedural: [],
  };

  constructor() {
    // brainDir is never used for real I/O here; pass a marker for clarity.
    super(':memory:');
  }

  // --- lifecycle ---
  async ensureBrainStructure(): Promise<void> {
    // no-op: nothing to create on disk
  }

  // --- memory API used by Hippocampus ---
  async loadMemories(): Promise<Memory[]> {
    return [
      ...this.memories.episodic,
      ...this.memories.semantic,
      ...this.memories.procedural,
    ];
  }

  async writeMemoryFile(type: MemType, memories: Memory[]): Promise<void> {
    this.memories[type] = memories.map((m) => ({ ...m }));
  }

  // --- generic file API used by Amygdala / Neurochemistry ---
  async appendToFile(subPath: string, content: string): Promise<void> {
    const prev = this.files.get(subPath) ?? '';
    this.files.set(subPath, prev ? prev + '\n' + content : content);
  }

  async readFile(subPath: string): Promise<string | null> {
    return this.files.has(subPath) ? this.files.get(subPath)! : null;
  }

  async writeFile(subPath: string, content: string): Promise<void> {
    this.files.set(subPath, content);
  }

  // --- optional host hooks for persistence across restarts ---
  /** Export the full in-memory state so a host can persist/restore it. */
  dump(): { files: Record<string, string>; memories: Record<MemType, Memory[]> } {
    return {
      files: Object.fromEntries(this.files),
      memories: {
        episodic: this.memories.episodic.map((m) => ({ ...m })),
        semantic: this.memories.semantic.map((m) => ({ ...m })),
        procedural: this.memories.procedural.map((m) => ({ ...m })),
      },
    };
  }

  /** Restore state previously produced by dump(). */
  load(state: { files?: Record<string, string>; memories?: Partial<Record<MemType, Memory[]>> }): void {
    if (state.files) {
      this.files = new Map(Object.entries(state.files));
    }
    if (state.memories) {
      for (const t of ['episodic', 'semantic', 'procedural'] as MemType[]) {
        if (state.memories[t]) this.memories[t] = state.memories[t]!.map((m) => ({ ...m }));
      }
    }
  }
}
