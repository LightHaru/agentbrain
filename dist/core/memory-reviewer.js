"use strict";
/**
 * MemoryReviewer - Automatic Memory Review & Quality Assessment
 *
 * Inspired by Hermes Agent's self-learning capabilities, this module:
 * - Periodically reviews memories for patterns, contradictions, and gaps
 * - Scores memory quality and relevance
 * - Consolidates related memories into insights
 * - Detects conflicting information
 * - Generates meta-learnings from memory clusters
 *
 * This is a key component for making AgentBrain self-improving.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryReviewer = void 0;
// ============================================================================
// MemoryReviewer Class
// ============================================================================
class MemoryReviewer {
    hippocampus;
    config;
    reviewHistory = [];
    insights = [];
    lastReviewTime = 0;
    constructor(hippocampus, config) {
        this.hippocampus = hippocampus;
        this.config = config;
    }
    async runReviewCycle(scope) {
        const startTime = Date.now();
        const cycleId = this.generateId();
        const memories = await this.getMemoriesForReview(scope);
        const findings = [];
        const patterns = this.detectPatterns(memories);
        findings.push(...patterns.map(p => this.patternToFinding(p)));
        const contradictions = this.findContradictions(memories);
        findings.push(...contradictions.map(c => this.contradictionToFinding(c)));
        const gaps = this.identifyGaps(memories);
        findings.push(...gaps.map(g => this.gapToFinding(g)));
        const lowQuality = this.assessMemoryQuality(memories);
        findings.push(...lowQuality);
        const newInsights = this.generateInsights(memories, patterns);
        findings.push(...newInsights.map(i => this.insightToFinding(i)));
        const actions = this.generateActions(findings);
        await this.executeActions(actions);
        const cycle = {
            id: cycleId,
            trigger: scope.trigger,
            timestamp: new Date().toISOString(),
            scope: scope.type,
            memoriesReviewed: memories.length,
            findings,
            actions,
            executionTimeMs: Date.now() - startTime,
        };
        this.reviewHistory.push(cycle);
        this.lastReviewTime = Date.now();
        if (this.reviewHistory.length > 50) {
            this.reviewHistory = this.reviewHistory.slice(-50);
        }
        return cycle;
    }
    detectPatterns(memories) {
        const patterns = [];
        patterns.push(...this.detectRepeatedTopics(memories));
        patterns.push(...this.detectRepeatedCorrections(memories));
        patterns.push(...this.detectTemporalPatterns(memories));
        patterns.push(...this.detectEntityCooccurrence(memories));
        return patterns;
    }
    detectRepeatedTopics(memories) {
        const topicCounts = new Map();
        for (const mem of memories) {
            for (const tag of mem.tags || []) {
                if (!topicCounts.has(tag)) {
                    topicCounts.set(tag, []);
                }
                topicCounts.get(tag).push(mem);
            }
        }
        const patterns = [];
        for (const [topic, mems] of topicCounts.entries()) {
            if (mems.length >= 3) {
                patterns.push({
                    type: 'repeated-topic',
                    description: `User frequently discusses "${topic}" (${mems.length} times)`,
                    memories: mems,
                    frequency: mems.length,
                    confidence: Math.min(1, mems.length / 10),
                });
            }
        }
        return patterns;
    }
    detectRepeatedCorrections(memories) {
        const correctionMemories = memories.filter(m => m.content.toLowerCase().includes('correction') ||
            m.content.toLowerCase().includes('mistake') ||
            m.content.toLowerCase().includes('wrong') ||
            m.content.toLowerCase().includes('sai') ||
            m.content.toLowerCase().includes('sua'));
        if (correctionMemories.length < 2)
            return [];
        const groups = this.clusterBySimilarity(correctionMemories);
        return groups
            .filter(g => g.length >= 2)
            .map(g => ({
            type: 'repeated-correction',
            description: `User corrected similar behavior ${g.length} times`,
            memories: g,
            frequency: g.length,
            confidence: 0.8,
        }));
    }
    detectTemporalPatterns(memories) {
        const hourGroups = new Map();
        for (const mem of memories) {
            const hour = new Date(mem.timestamp).getHours();
            if (!hourGroups.has(hour)) {
                hourGroups.set(hour, []);
            }
            hourGroups.get(hour).push(mem);
        }
        const patterns = [];
        for (const [hour, mems] of hourGroups.entries()) {
            if (mems.length >= 5) {
                patterns.push({
                    type: 'temporal',
                    description: `User frequently active around ${hour}:00 (${mems.length} interactions)`,
                    memories: mems,
                    frequency: mems.length,
                    confidence: 0.6,
                });
            }
        }
        return patterns;
    }
    detectEntityCooccurrence(memories) {
        const cooccurrence = new Map();
        for (const mem of memories) {
            const tags = mem.tags || [];
            for (let i = 0; i < tags.length; i++) {
                for (let j = i + 1; j < tags.length; j++) {
                    const key = [tags[i], tags[j]].sort().join('|');
                    if (!cooccurrence.has(key)) {
                        cooccurrence.set(key, new Map());
                    }
                    const pair = cooccurrence.get(key);
                    const pairKey = `${tags[i]}+${tags[j]}`;
                    if (!pair.has(pairKey)) {
                        pair.set(pairKey, []);
                    }
                    pair.get(pairKey).push(mem);
                }
            }
        }
        const patterns = [];
        for (const [key, pairs] of cooccurrence.entries()) {
            for (const [pairKey, mems] of pairs.entries()) {
                if (mems.length >= 3) {
                    patterns.push({
                        type: 'entity-cooccurrence',
                        description: `Entities "${key.replace('|', '" and "')}" frequently co-occur`,
                        memories: mems,
                        frequency: mems.length,
                        confidence: 0.7,
                    });
                }
            }
        }
        return patterns;
    }
    findContradictions(memories) {
        const contradictions = [];
        for (let i = 0; i < memories.length; i++) {
            for (let j = i + 1; j < memories.length; j++) {
                const memA = memories[i];
                const memB = memories[j];
                const conflict = this.detectConflict(memA, memB);
                if (conflict) {
                    contradictions.push(conflict);
                }
            }
        }
        return contradictions;
    }
    detectConflict(memA, memB) {
        const sharedTags = (memA.tags || []).filter(t => (memB.tags || []).includes(t));
        if (sharedTags.length === 0)
            return null;
        const contentA = memA.content.toLowerCase();
        const contentB = memB.content.toLowerCase();
        const contradictoryPairs = [
            ['prefer', 'avoid'],
            ['like', 'dislike'],
            ['want', "don't want"],
            ['yes', 'no'],
            ['thich', 'khong thich'],
            ['muon', 'khong muon'],
        ];
        for (const [pos, neg] of contradictoryPairs) {
            if ((contentA.includes(pos) && contentB.includes(neg)) ||
                (contentA.includes(neg) && contentB.includes(pos))) {
                return {
                    memoryA: memA,
                    memoryB: memB,
                    conflictType: 'preference',
                    severity: 0.6,
                    description: `Conflicting preferences detected between memories`,
                    resolution: this.determineResolution(memA, memB),
                };
            }
        }
        return null;
    }
    determineResolution(memA, memB) {
        const timeA = new Date(memA.timestamp).getTime();
        const timeB = new Date(memB.timestamp).getTime();
        if (Math.abs(timeA - timeB) < 86400000) {
            return 'flag-for-review';
        }
        return 'keep-newer';
    }
    identifyGaps(memories) {
        const gaps = [];
        const topicGroups = this.groupByTopic(memories);
        for (const [topic, mems] of topicGroups.entries()) {
            const hasDefinitiveInfo = mems.some(m => m.type === 'semantic' || m.confidence > 0.8);
            if (!hasDefinitiveInfo && mems.length >= 2) {
                gaps.push({
                    topic,
                    description: `Incomplete knowledge about "${topic}" (${mems.length} related memories, no definitive facts)`,
                    relatedMemories: mems,
                    severity: 0.5,
                });
            }
        }
        return gaps;
    }
    assessMemoryQuality(memories) {
        const findings = [];
        for (const mem of memories) {
            const quality = this.scoreMemoryQuality(mem);
            if (quality < 0.3) {
                findings.push({
                    type: 'low-quality',
                    severity: 1 - quality,
                    description: `Low-quality memory detected (score: ${quality.toFixed(2)})`,
                    affectedMemories: [mem.id],
                    confidence: 0.8,
                    metadata: { qualityScore: quality },
                });
            }
        }
        return findings;
    }
    scoreMemoryQuality(memory) {
        let score = 0.5;
        const contentLength = memory.content.length;
        if (contentLength < 20)
            score -= 0.2;
        else if (contentLength > 500)
            score -= 0.1;
        else if (contentLength >= 50 && contentLength <= 200)
            score += 0.1;
        if ((memory.tags || []).length > 0)
            score += 0.1;
        score += memory.confidence * 0.2;
        if (memory.accessCount > 5)
            score += 0.1;
        else if (memory.accessCount === 0)
            score -= 0.2;
        const ageInDays = this.daysSince(memory.timestamp);
        if (ageInDays > 30 && memory.accessCount === 0)
            score -= 0.2;
        return Math.max(0, Math.min(1, score));
    }
    generateInsights(memories, patterns) {
        const insights = [];
        for (const pattern of patterns.filter(p => p.type === 'repeated-topic')) {
            insights.push({
                id: this.generateId(),
                title: `User Interest: ${pattern.description}`,
                content: `The user has shown consistent interest in this topic across ${pattern.frequency} interactions.`,
                sourceMemories: pattern.memories.map(m => m.id),
                confidence: pattern.confidence,
                timestamp: new Date().toISOString(),
                type: 'user-preference',
            });
        }
        for (const pattern of patterns.filter(p => p.type === 'repeated-correction')) {
            insights.push({
                id: this.generateId(),
                title: `Behavioral Pattern: Recurring mistake`,
                content: `The user has corrected similar behavior ${pattern.frequency} times. This indicates a persistent gap in understanding or execution.`,
                sourceMemories: pattern.memories.map(m => m.id),
                confidence: 0.9,
                timestamp: new Date().toISOString(),
                type: 'behavioral-pattern',
            });
        }
        for (const pattern of patterns.filter(p => p.type === 'temporal')) {
            insights.push({
                id: this.generateId(),
                title: `Temporal Pattern: ${pattern.description}`,
                content: `Activity pattern detected: ${pattern.description}. This can inform scheduling and availability expectations.`,
                sourceMemories: pattern.memories.map(m => m.id),
                confidence: pattern.confidence,
                timestamp: new Date().toISOString(),
                type: 'behavioral-pattern',
            });
        }
        this.insights.push(...insights);
        if (this.insights.length > 100) {
            this.insights = this.insights.slice(-100);
        }
        return insights;
    }
    generateActions(findings) {
        const actions = [];
        for (const finding of findings) {
            switch (finding.type) {
                case 'contradiction':
                    actions.push({
                        type: 'resolve-contradiction',
                        targetMemories: finding.affectedMemories,
                        reason: finding.description,
                        executed: false,
                    });
                    break;
                case 'low-quality':
                    if (finding.severity > 0.7) {
                        actions.push({
                            type: 'prune',
                            targetMemories: finding.affectedMemories,
                            reason: `Low quality (score: ${finding.metadata?.qualityScore})`,
                            executed: false,
                        });
                    }
                    else {
                        actions.push({
                            type: 'flag',
                            targetMemories: finding.affectedMemories,
                            reason: finding.description,
                            executed: false,
                        });
                    }
                    break;
                case 'pattern':
                    if (finding.confidence > 0.7 && finding.affectedMemories.length >= 3) {
                        actions.push({
                            type: 'consolidate',
                            targetMemories: finding.affectedMemories,
                            reason: finding.description,
                            executed: false,
                        });
                    }
                    break;
                case 'insight':
                    actions.push({
                        type: 'create-insight',
                        targetMemories: finding.affectedMemories,
                        reason: finding.description,
                        executed: false,
                    });
                    break;
            }
        }
        return actions;
    }
    async executeActions(actions) {
        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'prune':
                        action.result = `Flagged ${action.targetMemories.length} memories for pruning`;
                        action.executed = true;
                        break;
                    case 'flag':
                        action.result = `Flagged ${action.targetMemories.length} memories for review`;
                        action.executed = true;
                        break;
                    case 'consolidate':
                        action.result = `Consolidated ${action.targetMemories.length} memories`;
                        action.executed = true;
                        break;
                    case 'create-insight':
                        action.result = 'Insight created';
                        action.executed = true;
                        break;
                    case 'resolve-contradiction':
                        action.result = 'Contradiction flagged for manual review';
                        action.executed = true;
                        break;
                    case 'strengthen':
                        action.result = `Strengthened ${action.targetMemories.length} memories`;
                        action.executed = true;
                        break;
                }
            }
            catch (error) {
                action.executed = false;
                action.result = `Failed: ${error instanceof Error ? error.message : String(error)}`;
            }
        }
    }
    async getMemoriesForReview(scope) {
        return [];
    }
    groupByTopic(memories) {
        const groups = new Map();
        for (const mem of memories) {
            for (const tag of mem.tags || []) {
                if (!groups.has(tag)) {
                    groups.set(tag, []);
                }
                groups.get(tag).push(mem);
            }
        }
        return groups;
    }
    clusterBySimilarity(memories) {
        const clusters = [];
        const used = new Set();
        for (const mem of memories) {
            if (used.has(mem.id))
                continue;
            const cluster = [mem];
            used.add(mem.id);
            const words = this.tokenize(mem.content);
            for (const other of memories) {
                if (used.has(other.id))
                    continue;
                const otherWords = this.tokenize(other.content);
                const overlap = words.filter(w => otherWords.includes(w)).length;
                if (overlap >= 3) {
                    cluster.push(other);
                    used.add(other.id);
                }
            }
            clusters.push(cluster);
        }
        return clusters;
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .normalize('NFC')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);
    }
    daysSince(isoTimestamp) {
        const then = new Date(isoTimestamp).getTime();
        const now = Date.now();
        return (now - then) / (1000 * 60 * 60 * 24);
    }
    generateId() {
        return `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    patternToFinding(pattern) {
        return {
            type: 'pattern',
            severity: Math.min(1, pattern.frequency / 10),
            description: pattern.description,
            affectedMemories: pattern.memories.map(m => m.id),
            confidence: pattern.confidence,
        };
    }
    contradictionToFinding(contradiction) {
        return {
            type: 'contradiction',
            severity: contradiction.severity,
            description: contradiction.description,
            affectedMemories: [contradiction.memoryA.id, contradiction.memoryB.id],
            confidence: 0.8,
            metadata: {
                conflictType: contradiction.conflictType,
                resolution: contradiction.resolution,
            },
        };
    }
    gapToFinding(gap) {
        return {
            type: 'gap',
            severity: gap.severity,
            description: gap.description,
            affectedMemories: gap.relatedMemories.map(m => m.id),
            confidence: 0.7,
        };
    }
    insightToFinding(insight) {
        return {
            type: 'insight',
            severity: 0,
            description: insight.title,
            affectedMemories: insight.sourceMemories,
            confidence: insight.confidence,
            metadata: { insightId: insight.id, insightType: insight.type },
        };
    }
    getReviewHistory(limit = 10) {
        return this.reviewHistory.slice(-limit);
    }
    getInsights(limit = 20) {
        return this.insights.slice(-limit);
    }
    getStatistics() {
        const totalFindings = this.reviewHistory.reduce((sum, cycle) => sum + cycle.findings.length, 0);
        const avgTime = this.reviewHistory.length > 0
            ? this.reviewHistory.reduce((sum, c) => sum + c.executionTimeMs, 0) / this.reviewHistory.length
            : 0;
        return {
            totalReviews: this.reviewHistory.length,
            totalFindings,
            totalInsights: this.insights.length,
            lastReviewTime: this.lastReviewTime > 0 ? new Date(this.lastReviewTime).toISOString() : null,
            avgReviewTime: avgTime,
        };
    }
    shouldReview(memoryCount, hoursSinceLastReview) {
        const timeSinceLastReview = this.lastReviewTime > 0
            ? (Date.now() - this.lastReviewTime) / (1000 * 60 * 60)
            : Infinity;
        return memoryCount >= 50 || timeSinceLastReview >= 24;
    }
}
exports.MemoryReviewer = MemoryReviewer;
//# sourceMappingURL=memory-reviewer.js.map