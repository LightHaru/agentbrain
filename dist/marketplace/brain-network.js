"use strict";
/**
 * Multi-Agent Brain Networking — Phase 6
 *
 * Allows multiple agents to share knowledge selectively.
 * Each agent maintains its own brain but can:
 * - Share specific memories with other agents
 * - Subscribe to knowledge feeds from other agents
 * - Collaborate on shared tasks with shared context
 *
 * Privacy-first: nothing is shared without explicit configuration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrainNetwork = void 0;
const DEFAULT_NETWORK_CONFIG = {
    agentId: 'default-agent',
    sharedTopics: [],
    subscribedTopics: [],
    peers: [],
    autoShare: false,
    autoShareThreshold: 0.8,
};
class BrainNetwork {
    config;
    sharedMemories = [];
    feeds = new Map();
    constructor(config) {
        this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
    }
    /**
     * Register this agent in the network
     */
    register(agentId, capabilities, sharedTopics) {
        const node = {
            id: agentId,
            name: agentId,
            brainDir: '',
            capabilities,
            sharedTopics,
            lastSeen: new Date().toISOString(),
        };
        this.config.agentId = agentId;
        this.config.sharedTopics = sharedTopics;
        return node;
    }
    /**
     * Share a memory with the network
     */
    shareMemory(content, topic, confidence) {
        const shared = {
            id: `shared-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            sourceAgent: this.config.agentId,
            content,
            topic,
            timestamp: new Date().toISOString(),
            confidence,
            accessControl: 'network',
        };
        this.sharedMemories.push(shared);
        // Add to relevant feed
        const feed = this.feeds.get(topic);
        if (feed) {
            feed.items.push(shared);
            feed.lastUpdate = shared.timestamp;
        }
        return shared;
    }
    /**
     * Query shared memories by topic
     */
    queryShared(topic, limit = 10) {
        return this.sharedMemories
            .filter(m => m.topic === topic && m.accessControl !== 'private')
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }
    /**
     * Create a knowledge feed for a topic
     */
    createFeed(topic) {
        const feed = {
            id: `feed-${topic}`,
            topic,
            sourceAgents: [this.config.agentId],
            subscribers: [],
            lastUpdate: new Date().toISOString(),
            items: [],
        };
        this.feeds.set(topic, feed);
        return feed;
    }
    /**
     * Subscribe to a feed
     */
    subscribe(topic) {
        const feed = this.feeds.get(topic);
        if (!feed)
            return false;
        if (!feed.subscribers.includes(this.config.agentId)) {
            feed.subscribers.push(this.config.agentId);
        }
        if (!this.config.subscribedTopics.includes(topic)) {
            this.config.subscribedTopics.push(topic);
        }
        return true;
    }
    /**
     * Get feed updates since last check
     */
    getFeedUpdates(topic, since) {
        const feed = this.feeds.get(topic);
        if (!feed)
            return [];
        return feed.items.filter(item => item.timestamp > since && item.sourceAgent !== this.config.agentId);
    }
    /**
     * Get network status
     */
    getStatus() {
        return {
            agentId: this.config.agentId,
            peers: this.config.peers.length,
            sharedMemories: this.sharedMemories.length,
            feeds: this.feeds.size,
            subscribedTopics: this.config.subscribedTopics,
        };
    }
}
exports.BrainNetwork = BrainNetwork;
//# sourceMappingURL=brain-network.js.map