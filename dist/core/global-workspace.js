"use strict";
/**
 * Global Workspace — Consciousness & Unified Awareness
 *
 * Based on Global Workspace Theory (Baars, 1988):
 * - Central "stage" where information becomes conscious
 * - Modules compete for access to the workspace
 * - Winner gets broadcast to all modules (becomes "conscious thought")
 * - Limited capacity (can only hold one "thought" at a time)
 * - Integrates information from all brain modules into coherent experience
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalWorkspace = void 0;
// --- Global Workspace Module ---
class GlobalWorkspace {
    config;
    currentFocus = null;
    recentContents = [];
    streamOfConsciousness = [];
    attentionFilter = [];
    consciousnessLevel = 0.7;
    competitionQueue = [];
    competitionsResolved = 0;
    contentCounter = 0;
    constructor(config) {
        this.config = config;
    }
    /**
     * Submit content to compete for conscious awareness
     * Only the most salient content "wins" and becomes the current focus
     */
    submit(content) {
        const id = `gw-${++this.contentCounter}-${Date.now()}`;
        const fullContent = {
            ...content,
            id,
            timestamp: Date.now(),
        };
        this.competitionQueue.push(fullContent);
        return id;
    }
    /**
     * Run competition — most salient content wins access to workspace
     */
    compete() {
        if (this.competitionQueue.length === 0)
            return null;
        // Apply attention filters (boost matching content)
        for (const content of this.competitionQueue) {
            for (const filter of this.attentionFilter) {
                if (content.content.toLowerCase().includes(filter.toLowerCase()) ||
                    content.associations.some(a => a.toLowerCase().includes(filter.toLowerCase()))) {
                    content.salience = Math.min(1.0, content.salience + 0.2);
                }
            }
        }
        // Sort by salience (highest wins)
        this.competitionQueue.sort((a, b) => b.salience - a.salience);
        const winner = this.competitionQueue[0];
        const losers = this.competitionQueue.slice(1);
        // Update workspace
        this.currentFocus = winner;
        this.recentContents.push(winner);
        if (this.recentContents.length > 50) {
            this.recentContents = this.recentContents.slice(-30);
        }
        // Add to stream of consciousness
        this.streamOfConsciousness.push(`[${winner.source}] ${winner.content}`);
        if (this.streamOfConsciousness.length > 100) {
            this.streamOfConsciousness = this.streamOfConsciousness.slice(-50);
        }
        // Clear queue
        this.competitionQueue = [];
        this.competitionsResolved++;
        return {
            winner,
            losers,
            reason: `Salience: ${winner.salience.toFixed(2)} (${winner.source}: ${winner.type})`,
        };
    }
    /**
     * Set attention filters (bias competition toward certain topics)
     */
    setAttentionFilter(filters) {
        this.attentionFilter = filters;
    }
    /**
     * Add an attention filter
     */
    addAttentionFilter(filter) {
        if (!this.attentionFilter.includes(filter)) {
            this.attentionFilter.push(filter);
            // Keep bounded
            if (this.attentionFilter.length > 10) {
                this.attentionFilter = this.attentionFilter.slice(-7);
            }
        }
    }
    /**
     * Remove an attention filter
     */
    removeAttentionFilter(filter) {
        this.attentionFilter = this.attentionFilter.filter(f => f !== filter);
    }
    /**
     * Get current conscious focus
     */
    getCurrentFocus() {
        return this.currentFocus;
    }
    /**
     * Get recent stream of consciousness
     */
    getStream(limit = 10) {
        return this.streamOfConsciousness.slice(-limit);
    }
    /**
     * Get recent conscious contents
     */
    getRecentContents(limit = 5) {
        return this.recentContents.slice(-limit);
    }
    /**
     * Integrate information from multiple modules into a coherent "thought"
     */
    integrate(inputs) {
        // Combine inputs weighted by importance
        const combined = inputs
            .sort((a, b) => b.weight - a.weight)
            .map(i => i.content)
            .join(' → ');
        const sources = inputs.map(i => i.source).join('+');
        const avgWeight = inputs.reduce((sum, i) => sum + i.weight, 0) / inputs.length;
        const integrated = {
            id: `gw-int-${++this.contentCounter}`,
            source: sources,
            content: combined,
            type: 'insight',
            salience: avgWeight,
            timestamp: Date.now(),
            associations: inputs.map(i => i.source),
        };
        // Auto-submit to workspace
        this.currentFocus = integrated;
        this.recentContents.push(integrated);
        this.streamOfConsciousness.push(`[INTEGRATED: ${sources}] ${combined}`);
        return integrated;
    }
    /**
     * Calculate integration score (how well modules are working together)
     */
    getIntegrationScore() {
        if (this.recentContents.length === 0)
            return 0.5;
        // Count unique sources in recent contents
        const recentSources = new Set(this.recentContents.slice(-20).map(c => c.source));
        // More diverse sources = better integration
        const diversityScore = Math.min(1.0, recentSources.size / 7);
        // Check for integrated insights
        const insightCount = this.recentContents
            .slice(-20)
            .filter(c => c.type === 'insight').length;
        const insightScore = Math.min(1.0, insightCount / 5);
        return (diversityScore + insightScore) / 2;
    }
    /**
     * Adjust consciousness level (affected by alertness, cognitive load)
     */
    setConsciousnessLevel(level) {
        this.consciousnessLevel = Math.max(0, Math.min(1, level));
    }
    /**
     * Get consciousness level
     */
    getConsciousnessLevel() {
        return this.consciousnessLevel;
    }
    /**
     * Clear workspace (like "clearing your mind")
     */
    clear() {
        this.currentFocus = null;
        this.competitionQueue = [];
    }
    /**
     * Heartbeat — decay old content, maintain workspace
     */
    heartbeat() {
        // Decay consciousness level slightly if no new input
        if (this.competitionQueue.length === 0 && this.currentFocus) {
            const age = Date.now() - this.currentFocus.timestamp;
            if (age > 60000) { // 1 minute old
                this.consciousnessLevel = Math.max(0.3, this.consciousnessLevel - 0.05);
            }
        }
        // Process any pending competition
        if (this.competitionQueue.length > 0) {
            this.compete();
        }
    }
    /**
     * Get snapshot of current workspace state
     */
    getSnapshot() {
        return {
            currentFocus: this.currentFocus,
            recentContents: this.recentContents.slice(-10),
            streamOfConsciousness: this.streamOfConsciousness.slice(-10),
            attentionFilter: [...this.attentionFilter],
            consciousnessLevel: this.consciousnessLevel,
            integrationScore: this.getIntegrationScore(),
        };
    }
    /**
     * Get full state for status reporting
     */
    getState() {
        return {
            currentFocus: this.currentFocus,
            consciousnessLevel: this.consciousnessLevel,
            streamLength: this.streamOfConsciousness.length,
            recentFocusCount: this.recentContents.length,
            integrationScore: this.getIntegrationScore(),
            attentionFilters: [...this.attentionFilter],
            competitionsResolved: this.competitionsResolved,
        };
    }
}
exports.GlobalWorkspace = GlobalWorkspace;
//# sourceMappingURL=global-workspace.js.map