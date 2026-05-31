/**
 * Global Workspace — attention competition + conscious focus
 *
 * REAL state: candidate items (from any module) compete by salience; the
 * winner becomes the current focus and enters a bounded stream. Consciousness
 * level and integration score are derived from how much is competing and how
 * coherent the winners are over time — not hardcoded.
 */
export interface WorkspaceCandidate {
  source: string;
  content: string;
  salience: number; // 0..1
}

export interface FocusItem {
  source: string;
  content: string;
  salience: number;
  at: number;
}

export interface GlobalWorkspaceState {
  currentFocus: FocusItem | null;
  consciousnessLevel: number;
  streamLength: number;
  recentFocusCount: number;
  integrationScore: number;
  attentionFilters: string[];
  competitionsResolved: number;
}

export class GlobalWorkspace {
  private stream: FocusItem[] = [];
  private competitions = 0;
  private filters = new Set<string>();
  private maxStream = 50;

  addFilter(topic: string): void {
    this.filters.add(topic);
  }

  /** Run a competition; highest-salience candidate wins the spotlight. */
  compete(candidates: WorkspaceCandidate[]): FocusItem | null {
    const live = candidates.filter((c) => !this.filters.has(c.source) && c.salience > 0);
    if (live.length === 0) return null;
    this.competitions++;
    const winner = live.reduce((a, b) => (b.salience > a.salience ? b : a));
    const item: FocusItem = { source: winner.source, content: winner.content.slice(0, 120), salience: winner.salience, at: Date.now() };
    this.stream.push(item);
    if (this.stream.length > this.maxStream) this.stream = this.stream.slice(-this.maxStream);
    return item;
  }

  getState(): GlobalWorkspaceState {
    const now = Date.now();
    const recent = this.stream.filter((f) => now - f.at <= 5 * 60000);
    const currentFocus = this.stream.length ? this.stream[this.stream.length - 1] : null;

    // Consciousness scales with recent activity (0.3 idle .. ~0.9 busy)
    const consciousnessLevel = Number(Math.min(0.95, 0.3 + recent.length * 0.06).toFixed(2));

    // Integration = coherence of recent foci (share from the dominant source)
    let integrationScore = 0.5;
    if (recent.length >= 2) {
      const counts = new Map<string, number>();
      for (const f of recent) counts.set(f.source, (counts.get(f.source) ?? 0) + 1);
      const dominant = Math.max(...counts.values());
      integrationScore = Number((dominant / recent.length).toFixed(2));
    }

    return {
      currentFocus,
      consciousnessLevel,
      streamLength: this.stream.length,
      recentFocusCount: recent.length,
      integrationScore,
      attentionFilters: Array.from(this.filters),
      competitionsResolved: this.competitions,
    };
  }
}
