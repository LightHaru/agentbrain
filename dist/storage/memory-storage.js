"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorage = void 0;
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
const md_writer_js_1 = require("./md-writer.js");
class MemoryStorage extends md_writer_js_1.BrainFileManager {
    files = new Map();
    memories = {
        episodic: [],
        semantic: [],
        procedural: [],
    };
    constructor() {
        // brainDir is never used for real I/O here; pass a marker for clarity.
        super(':memory:');
    }
    // --- lifecycle ---
    async ensureBrainStructure() {
        // no-op: nothing to create on disk
    }
    // --- memory API used by Hippocampus ---
    async loadMemories() {
        return [
            ...this.memories.episodic,
            ...this.memories.semantic,
            ...this.memories.procedural,
        ];
    }
    async writeMemoryFile(type, memories) {
        this.memories[type] = memories.map((m) => ({ ...m }));
    }
    // --- generic file API used by Amygdala / Neurochemistry ---
    async appendToFile(subPath, content) {
        const prev = this.files.get(subPath) ?? '';
        this.files.set(subPath, prev ? prev + '\n' + content : content);
    }
    async readFile(subPath) {
        return this.files.has(subPath) ? this.files.get(subPath) : null;
    }
    async writeFile(subPath, content) {
        this.files.set(subPath, content);
    }
    // --- optional host hooks for persistence across restarts ---
    /** Export the full in-memory state so a host can persist/restore it. */
    dump() {
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
    load(state) {
        if (state.files) {
            this.files = new Map(Object.entries(state.files));
        }
        if (state.memories) {
            for (const t of ['episodic', 'semantic', 'procedural']) {
                if (state.memories[t])
                    this.memories[t] = state.memories[t].map((m) => ({ ...m }));
            }
        }
    }
}
exports.MemoryStorage = MemoryStorage;
//# sourceMappingURL=memory-storage.js.map