"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brainstem = void 0;
const THREAT_WINDOW_MS = 5 * 60 * 1000; // 5 min relevance window
class Brainstem {
    startTime = Date.now();
    threats = [];
    processes;
    baseArousal = 0.4;
    constructor(now = Date.now()) {
        this.startTime = now;
        this.processes = [
            { id: 'memory-consolidation', name: 'Memory Consolidation', intervalMs: 300000, lastRun: now, enabled: true, action: 'Consolidate short-term memories to long-term', runCount: 0 },
            { id: 'attention-decay', name: 'Attention Decay', intervalMs: 60000, lastRun: now, enabled: true, action: 'Decay unused attention allocations', runCount: 0 },
            { id: 'stress-regulation', name: 'Stress Regulation', intervalMs: 120000, lastRun: now, enabled: true, action: 'Gradually reduce stress levels', runCount: 0 },
            { id: 'energy-recovery', name: 'Energy Recovery', intervalMs: 180000, lastRun: now, enabled: true, action: 'Slowly recover energy during idle periods', runCount: 0 },
            { id: 'threat-scan', name: 'Threat Scanning', intervalMs: 30000, lastRun: now, enabled: true, action: 'Scan for potential threats in environment', runCount: 0 },
        ];
    }
    /** Advance autonomic processes whose interval has elapsed. Returns ids that fired. */
    pump(now = Date.now()) {
        const fired = [];
        for (const p of this.processes) {
            if (!p.enabled)
                continue;
            while (now - p.lastRun >= p.intervalMs) {
                p.lastRun += p.intervalMs;
                p.runCount++;
                fired.push(p.id);
            }
        }
        return fired;
    }
    recordThreat(severity, note = '') {
        this.threats.push({ severity, at: Date.now(), note: note.slice(0, 80) });
        // bump arousal immediately
        const bump = { low: 0.1, medium: 0.2, high: 0.4, critical: 0.5 }[severity] ?? 0;
        this.baseArousal = Math.min(1, this.baseArousal + bump);
    }
    recentThreats(now = Date.now()) {
        return this.threats.filter((t) => now - t.at <= THREAT_WINDOW_MS);
    }
    getState() {
        const now = Date.now();
        this.pump(now);
        // arousal relaxes toward base 0.4 between threats
        this.baseArousal = Math.max(0.4, this.baseArousal - 0.02);
        const recent = this.recentThreats(now);
        const maxSeverity = recent.reduce((m, t) => {
            const rank = { low: 1, medium: 2, high: 3, critical: 4 }[t.severity];
            return Math.max(m, rank);
        }, 0);
        const arousal = Math.min(1, this.baseArousal + maxSeverity * 0.12);
        const alertness = maxSeverity >= 3 ? 'hypervigilant' : arousal >= 0.55 ? 'alert' : arousal >= 0.35 ? 'calm' : 'drowsy';
        // prune old threats (keep last 20)
        if (this.threats.length > 20)
            this.threats = this.threats.slice(-20);
        return {
            alertness,
            arousalLevel: Number(arousal.toFixed(2)),
            activeReflexes: this.processes.filter((p) => p.enabled).length + recent.length,
            recentThreats: recent,
            autonomicProcesses: this.processes.map((p) => ({ ...p })),
            uptime: now - this.startTime,
            responseLatency: maxSeverity >= 3 ? 40 : 100, // faster reflexes under threat
        };
    }
}
exports.Brainstem = Brainstem;
//# sourceMappingURL=brainstem.js.map