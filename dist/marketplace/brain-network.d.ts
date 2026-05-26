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
export interface AgentNode {
    id: string;
    name: string;
    brainDir: string;
    capabilities: string[];
    sharedTopics: string[];
    lastSeen: string;
}
export interface SharedMemory {
    id: string;
    sourceAgent: string;
    content: string;
    topic: string;
    timestamp: string;
    confidence: number;
    accessControl: 'public' | 'network' | 'private';
}
export interface KnowledgeFeed {
    id: string;
    topic: string;
    sourceAgents: string[];
    subscribers: string[];
    lastUpdate: string;
    items: SharedMemory[];
}
export interface NetworkConfig {
    /** This agent's ID in the network */
    agentId: string;
    /** Topics this agent shares */
    sharedTopics: string[];
    /** Topics this agent subscribes to */
    subscribedTopics: string[];
    /** Known peer agents */
    peers: AgentNode[];
    /** Whether to auto-share high-confidence memories */
    autoShare: boolean;
    /** Minimum confidence to auto-share */
    autoShareThreshold: number;
}
export declare class BrainNetwork {
    private config;
    private sharedMemories;
    private feeds;
    constructor(config?: Partial<NetworkConfig>);
    /**
     * Register this agent in the network
     */
    register(agentId: string, capabilities: string[], sharedTopics: string[]): AgentNode;
    /**
     * Share a memory with the network
     */
    shareMemory(content: string, topic: string, confidence: number): SharedMemory;
    /**
     * Query shared memories by topic
     */
    queryShared(topic: string, limit?: number): SharedMemory[];
    /**
     * Create a knowledge feed for a topic
     */
    createFeed(topic: string): KnowledgeFeed;
    /**
     * Subscribe to a feed
     */
    subscribe(topic: string): boolean;
    /**
     * Get feed updates since last check
     */
    getFeedUpdates(topic: string, since: string): SharedMemory[];
    /**
     * Get network status
     */
    getStatus(): {
        agentId: string;
        peers: number;
        sharedMemories: number;
        feeds: number;
        subscribedTopics: string[];
    };
}
//# sourceMappingURL=brain-network.d.ts.map