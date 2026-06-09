"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorpusCallosum = void 0;
class CorpusCallosum {
    modules = new Set();
    processed = 0;
    dropped = 0;
    latencies = [];
    timestamps = [];
    conflicts = [];
    lastSignalByModule = new Map();
    register(moduleId) {
        this.modules.add(moduleId);
    }
    /** Route a signal between modules. Returns true if delivered. */
    send(signal) {
        const t0 = Date.now();
        const full = { ...signal, at: t0 };
        // a signal to an unregistered specific target is dropped
        if (signal.to !== 'broadcast' && !this.modules.has(signal.to)) {
            this.dropped++;
            return false;
        }
        this.modules.add(signal.from);
        this.lastSignalByModule.set(signal.from, full);
        this.processed++;
        this.timestamps.push(t0);
        this.latencies.push(Math.max(0, Date.now() - t0));
        if (this.timestamps.length > 200)
            this.timestamps = this.timestamps.slice(-200);
        if (this.latencies.length > 200)
            this.latencies = this.latencies.slice(-200);
        return true;
    }
    /** Record a detected cross-module conflict. */
    flagConflict(a, b, reason) {
        this.conflicts.push({ between: [a, b], reason, at: Date.now() });
        if (this.conflicts.length > 20)
            this.conflicts = this.conflicts.slice(-20);
    }
    getState() {
        const now = Date.now();
        const windowMs = 60000;
        const recentMsgs = this.timestamps.filter((t) => now - t <= windowMs).length;
        const avgLatency = this.latencies.length
            ? Number((this.latencies.reduce((s, n) => s + n, 0) / this.latencies.length).toFixed(2))
            : 0;
        const recentConflicts = this.conflicts.filter((c) => now - c.at <= 5 * windowMs);
        return {
            registeredModules: Array.from(this.modules).sort(),
            pendingSignals: 0,
            processedSignals: this.processed,
            metrics: {
                totalMessages: this.processed,
                messagesPerMinute: recentMsgs,
                averageLatency: avgLatency,
                droppedMessages: this.dropped,
                activeModules: this.modules.size,
                conflicts: this.conflicts.length,
            },
            recentConflicts,
        };
    }
}
exports.CorpusCallosum = CorpusCallosum;
//# sourceMappingURL=corpus-callosum.js.map