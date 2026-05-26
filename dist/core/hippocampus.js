"use strict";
/**
 * Hippocampus — Memory Formation & Retrieval
 *
 * Like the brain's hippocampus, this module handles:
 * - Creating new memories from interactions
 * - Classifying memories (episodic/semantic/procedural)
 * - Retrieving relevant memories based on context
 * - Memory consolidation (short-term → long-term)
 * - Memory decay (unused memories lose confidence over time)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hippocampus = void 0;
class Hippocampus {
    config;
    fileManager;
    shortTermBuffer = [];
    memories = [];
    heartbeatCount = 0;
    constructor(config, fileManager) {
        this.config = config;
        this.fileManager = fileManager;
    }
    /**
     * Initialize: load existing memories from brain files
     */
    async initialize() {
        this.memories = await this.fileManager.loadMemories();
        console.log(`[Hippocampus] Loaded ${this.memories.length} memories`);
    }
    /**
     * Recall relevant memories for a given query/topic
     */
    async recall(query, topic) {
        const queryLower = query.toLowerCase();
        const scored = this.memories.map(memory => {
            let score = memory.confidence;
            // Keyword match boost
            const words = queryLower.split(/\s+/);
            const matchCount = words.filter(w => memory.content.toLowerCase().includes(w) && w.length > 2).length;
            score += matchCount * 0.1;
            // Topic match boost
            if (memory.tags.includes(topic)) {
                score += 0.2;
            }
            // Recency boost (memories accessed recently score higher)
            const daysSinceAccess = this.daysSince(memory.lastAccessed);
            score += Math.max(0, 0.1 - daysSinceAccess * 0.01);
            // Frequency boost (often-accessed memories are more important)
            score += Math.min(memory.accessCount * 0.02, 0.2);
            return { memory, score };
        });
        // Sort by score, return top N
        scored.sort((a, b) => b.score - a.score);
        const results = scored
            .slice(0, this.config.maxRecallResults)
            .filter(s => s.score > 0.1)
            .map(s => {
            // Update access metadata
            s.memory.accessCount++;
            s.memory.lastAccessed = new Date().toISOString();
            return s.memory;
        });
        return results;
    }
    /**
     * Consolidate a conversation turn into memory
     */
    async consolidate(turn) {
        this.shortTermBuffer.push(turn);
        // Extract memory candidates from the turn
        const candidates = this.extractMemoryCandidates(turn);
        for (const candidate of candidates) {
            if (candidate.importance >= 0.3) {
                const memory = {
                    id: this.generateId(),
                    type: candidate.type,
                    content: candidate.content,
                    timestamp: turn.timestamp,
                    confidence: candidate.importance,
                    accessCount: 0,
                    lastAccessed: turn.timestamp,
                    tags: candidate.tags,
                };
                this.memories.push(memory);
            }
        }
        // Persist if buffer is getting large
        if (this.shortTermBuffer.length >= 5) {
            await this.persist();
            this.shortTermBuffer = [];
        }
    }
    /**
     * Extract potential memories from a conversation turn
     */
    extractMemoryCandidates(turn) {
        const candidates = [];
        const msg = turn.message;
        // Episodic: user made a decision or took an action
        if (/chốt|quyết định|đã làm|xong|done|deployed|published|bought|sold/.test(msg)) {
            candidates.push({
                content: `[${turn.senderName}] ${msg}`,
                type: 'episodic',
                tags: this.extractTags(msg),
                importance: 0.7,
            });
        }
        // Semantic: user shared a fact or preference
        if (/là|thích|ghét|muốn|cần|prefer|always|never|luôn|không bao giờ/.test(msg)) {
            candidates.push({
                content: `[${turn.senderName} preference] ${msg}`,
                type: 'semantic',
                tags: this.extractTags(msg),
                importance: 0.6,
            });
        }
        // Procedural: a workflow or how-to was discussed
        if (/cách|how to|step|bước|workflow|process|quy trình|command|lệnh/.test(msg)) {
            candidates.push({
                content: `[Procedure] ${msg}`,
                type: 'procedural',
                tags: [...this.extractTags(msg), 'howto'],
                importance: 0.5,
            });
        }
        // If nothing matched but message is substantial, store as low-importance episodic
        if (candidates.length === 0 && msg.length > 30) {
            candidates.push({
                content: `[${turn.senderName}] ${msg}`,
                type: 'episodic',
                tags: this.extractTags(msg),
                importance: 0.3,
            });
        }
        return candidates;
    }
    /**
     * Periodic maintenance: decay old memories, prune low-confidence ones
     */
    async maintenance() {
        this.heartbeatCount++;
        if (this.heartbeatCount % this.config.maintenanceInterval !== 0) {
            return; // Only run every N heartbeats
        }
        console.log('[Hippocampus] Running maintenance — decay + prune');
        const now = new Date();
        let pruned = 0;
        this.memories = this.memories.filter(memory => {
            // Apply decay based on time since last access
            const daysSinceAccess = this.daysSince(memory.lastAccessed);
            const decay = daysSinceAccess * this.config.memoryDecayRate;
            memory.confidence = Math.max(0, memory.confidence - decay);
            // Prune if below threshold
            if (memory.confidence < this.config.minMemoryConfidence) {
                pruned++;
                return false;
            }
            return true;
        });
        if (pruned > 0) {
            console.log(`[Hippocampus] Pruned ${pruned} low-confidence memories`);
        }
        await this.persist();
    }
    /**
     * Persist memories to brain files
     */
    async persist() {
        const episodic = this.memories.filter(m => m.type === 'episodic');
        const semantic = this.memories.filter(m => m.type === 'semantic');
        const procedural = this.memories.filter(m => m.type === 'procedural');
        await this.fileManager.writeMemoryFile('episodic', episodic);
        await this.fileManager.writeMemoryFile('semantic', semantic);
        await this.fileManager.writeMemoryFile('procedural', procedural);
    }
    /**
     * Extract topic tags from text
     */
    extractTags(text) {
        const tags = [];
        const lower = text.toLowerCase();
        if (/crypto|token|coin|defi|swap|trade/.test(lower))
            tags.push('crypto');
        if (/code|bug|api|server|deploy/.test(lower))
            tags.push('coding');
        if (/content|blog|seo|article/.test(lower))
            tags.push('content');
        if (/server|vps|nginx|docker/.test(lower))
            tags.push('ops');
        if (/plan|project|build|ship/.test(lower))
            tags.push('project');
        return tags;
    }
    /**
     * Calculate days since a given ISO timestamp
     */
    daysSince(isoTimestamp) {
        const then = new Date(isoTimestamp).getTime();
        const now = Date.now();
        return (now - then) / (1000 * 60 * 60 * 24);
    }
    /**
     * Generate a unique memory ID
     */
    generateId() {
        return `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }
    /**
     * Get memory stats
     */
    getStats() {
        return {
            total: this.memories.length,
            episodic: this.memories.filter(m => m.type === 'episodic').length,
            semantic: this.memories.filter(m => m.type === 'semantic').length,
            procedural: this.memories.filter(m => m.type === 'procedural').length,
        };
    }
}
exports.Hippocampus = Hippocampus;
//# sourceMappingURL=hippocampus.js.map