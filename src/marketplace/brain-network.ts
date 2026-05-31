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

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  agentId: 'default-agent',
  sharedTopics: [],
  subscribedTopics: [],
  peers: [],
  autoShare: false,
  autoShareThreshold: 0.8,
};

export class BrainNetwork {
  private config: NetworkConfig;
  private sharedMemories: SharedMemory[] = [];
  private feeds: Map<string, KnowledgeFeed> = new Map();

  constructor(config?: Partial<NetworkConfig>) {
    this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
  }

  /**
   * Register this agent in the network
   */
  register(agentId: string, capabilities: string[], sharedTopics: string[]): AgentNode {
    const node: AgentNode = {
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
  shareMemory(content: string, topic: string, confidence: number): SharedMemory {
    const shared: SharedMemory = {
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
  queryShared(topic: string, limit: number = 10): SharedMemory[] {
    return this.sharedMemories
      .filter(m => m.topic === topic && m.accessControl !== 'private')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Create a knowledge feed for a topic
   */
  createFeed(topic: string): KnowledgeFeed {
    const feed: KnowledgeFeed = {
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
  subscribe(topic: string): boolean {
    const feed = this.feeds.get(topic);
    if (!feed) return false;

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
  getFeedUpdates(topic: string, since: string): SharedMemory[] {
    const feed = this.feeds.get(topic);
    if (!feed) return [];

    return feed.items.filter(item =>
      item.timestamp > since && item.sourceAgent !== this.config.agentId
    );
  }

  /**
   * Get network status
   */
  getStatus(): {
    agentId: string;
    peers: number;
    sharedMemories: number;
    feeds: number;
    subscribedTopics: string[];
  } {
    return {
      agentId: this.config.agentId,
      peers: this.config.peers.length,
      sharedMemories: this.sharedMemories.length,
      feeds: this.feeds.size,
      subscribedTopics: this.config.subscribedTopics,
    };
  }
}
