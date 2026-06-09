"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalWorkspace = void 0;
class GlobalWorkspace {
    stream = [];
    competitions = 0;
    filters = new Set();
    maxStream = 50;
    addFilter(topic) {
        this.filters.add(topic);
    }
    /** Run a competition; highest-salience candidate wins the spotlight. */
    compete(candidates) {
        const live = candidates.filter((c) => !this.filters.has(c.source) && c.salience > 0);
        if (live.length === 0)
            return null;
        this.competitions++;
        const winner = live.reduce((a, b) => (b.salience > a.salience ? b : a));
        const item = { source: winner.source, content: winner.content.slice(0, 120), salience: winner.salience, at: Date.now() };
        this.stream.push(item);
        if (this.stream.length > this.maxStream)
            this.stream = this.stream.slice(-this.maxStream);
        return item;
    }
    getState() {
        const now = Date.now();
        const recent = this.stream.filter((f) => now - f.at <= 5 * 60000);
        const currentFocus = this.stream.length ? this.stream[this.stream.length - 1] : null;
        // Consciousness scales with recent activity (0.3 idle .. ~0.9 busy)
        const consciousnessLevel = Number(Math.min(0.95, 0.3 + recent.length * 0.06).toFixed(2));
        // Integration = coherence of recent foci (share from the dominant source)
        let integrationScore = 0.5;
        if (recent.length >= 2) {
            const counts = new Map();
            for (const f of recent)
                counts.set(f.source, (counts.get(f.source) ?? 0) + 1);
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
exports.GlobalWorkspace = GlobalWorkspace;
//# sourceMappingURL=global-workspace.js.map