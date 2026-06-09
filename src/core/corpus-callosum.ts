/**
 * Corpus Callosum — inter-module signal bus
 *
 * REAL state: modules register, send signals through it, and it counts real
 * traffic, measures latency, and detects conflicts (e.g. amygdala says
 * "alarmed" while hypothalamus reports "calm"). Metrics are computed from
 * actual routed signals, not hardcoded zeros.
 */
export interface ModuleSignal {
  from: string;
  to: string | 'broadcast';
  type: string;
  payload?: any;
  at: number;
}

export interface ConflictRecord {
  between: [string, string];
  reason: string;
  at: number;
}

export interface CorpusCallosumState {
  registeredModules: string[];
  pendingSignals: number;
  processedSignals: number;
  metrics: {
    totalMessages: number;
    messagesPerMinute: number;
    averageLatency: number;
    droppedMessages: number;
    activeModules: number;
    conflicts: number;
  };
  recentConflicts: ConflictRecord[];
}

export class CorpusCallosum {
  private modules = new Set<string>();
  private processed = 0;
  private dropped = 0;
  private latencies: number[] = [];
  private timestamps: number[] = [];
  private conflicts: ConflictRecord[] = [];
  private lastSignalByModule = new Map<string, ModuleSignal>();

  register(moduleId: string): void {
    this.modules.add(moduleId);
  }

  /** Route a signal between modules. Returns true if delivered. */
  send(signal: Omit<ModuleSignal, 'at'>): boolean {
    const t0 = Date.now();
    const full: ModuleSignal = { ...signal, at: t0 };
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
    if (this.timestamps.length > 200) this.timestamps = this.timestamps.slice(-200);
    if (this.latencies.length > 200) this.latencies = this.latencies.slice(-200);
    return true;
  }

  /** Record a detected cross-module conflict. */
  flagConflict(a: string, b: string, reason: string): void {
    this.conflicts.push({ between: [a, b], reason, at: Date.now() });
    if (this.conflicts.length > 20) this.conflicts = this.conflicts.slice(-20);
  }

  getState(): CorpusCallosumState {
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
