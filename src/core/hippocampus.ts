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

import { BrainConfig } from './config.js';
import { Memory } from '../index.js';
import { BrainFileManager } from '../storage/md-writer.js';

export interface ConversationTurn {
  message: string;
  response: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

export interface MemoryCandidate {
  content: string;
  type: 'episodic' | 'semantic' | 'procedural';
  tags: string[];
  importance: number; // 0-1
}

export class Hippocampus {
  private config: BrainConfig;
  private fileManager: BrainFileManager;
  private shortTermBuffer: ConversationTurn[] = [];
  private memories: Memory[] = [];
  private heartbeatCount: number = 0;

  constructor(config: BrainConfig, fileManager: BrainFileManager) {
    this.config = config;
    this.fileManager = fileManager;
  }

  /**
   * Initialize: load existing memories from brain files
   */
  async initialize(): Promise<void> {
    this.memories = await this.fileManager.loadMemories();
    console.log(`[Hippocampus] Loaded ${this.memories.length} memories`);
  }

  /**
   * Recall relevant memories for a given query/topic
   */
  async recall(query: string, topic: string): Promise<Memory[]> {
    const queryLower = query.toLowerCase();
    const scored = this.memories.map(memory => {
      let score = memory.confidence;

      // Keyword match boost
      const words = queryLower.split(/\s+/);
      const matchCount = words.filter(w => 
        memory.content.toLowerCase().includes(w) && w.length > 2
      ).length;
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
  async consolidate(turn: ConversationTurn): Promise<void> {
    this.shortTermBuffer.push(turn);

    // Extract memory candidates from the turn
    const candidates = this.extractMemoryCandidates(turn);

    for (const candidate of candidates) {
      if (candidate.importance >= 0.3) {
        const memory: Memory = {
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
    if (this.shortTermBuffer.length >= 3) {
      await this.persist();
      this.shortTermBuffer = [];
    }
  }

  /**
   * Extract potential memories from a conversation turn
   */
  private extractMemoryCandidates(turn: ConversationTurn): MemoryCandidate[] {
    const candidates: MemoryCandidate[] = [];
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

    // Episodic: emotional messages (teasing, praising, angry)
    if (/gà mập|gà|kute|cute|giỏi|đỉnh|ngon|hay|tuyệt|khùng|ngu|dở|chán|tệ|ghét|yêu|thương/.test(msg)) {
      candidates.push({
        content: `[${turn.senderName}] ${msg}`,
        type: 'episodic',
        tags: [...this.extractTags(msg), 'emotional'],
        importance: 0.6,
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

    // Semantic: nicknames/pet names used repeatedly
    const nicknameMatch = msg.match(/gà mập|gà|em yêu|baby|bé|cutie|kute/);
    if (nicknameMatch) {
      candidates.push({
        content: `[${turn.senderName} calls agent: ${nicknameMatch[0]}]`,
        type: 'semantic',
        tags: ['nickname', 'relationship'],
        importance: 0.5,
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

    // Procedural: technical decisions/configs
    if (/config|setting|setup|install|deploy|build|api|token|key/.test(msg)) {
      candidates.push({
        content: `[Technical decision] ${msg}`,
        type: 'procedural',
        tags: [...this.extractTags(msg), 'technical'],
        importance: 0.5,
      });
    }

    // Strong sentiment messages → episodic
    const sentiment = this.detectStrongSentiment(msg);
    if (Math.abs(sentiment) > 0.4) {
      candidates.push({
        content: `[${turn.senderName}] ${msg}`,
        type: 'episodic',
        tags: [...this.extractTags(msg), sentiment > 0 ? 'positive' : 'negative'],
        importance: 0.6,
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
  async maintenance(): Promise<void> {
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
  private async persist(): Promise<void> {
    const episodic = this.memories.filter(m => m.type === 'episodic');
    const semantic = this.memories.filter(m => m.type === 'semantic');
    const procedural = this.memories.filter(m => m.type === 'procedural');

    await this.fileManager.writeMemoryFile('episodic', episodic);
    await this.fileManager.writeMemoryFile('semantic', semantic);
    await this.fileManager.writeMemoryFile('procedural', procedural);
  }

  /**
   * Detect strong sentiment for memory importance
   */
  private detectStrongSentiment(message: string): number {
    let score = 0;
    
    // Positive
    if (/đỉnh|giỏi|kute|cute|hay|tuyệt|ngon|ổn|ok.*rồi|good|nice|great|hehe|hihi|❤/i.test(message)) {
      score += 0.5;
    }
    
    // Negative/teasing
    if (/gà mập|gà|mập|khùng|ngu|dở|chán|tệ|fail|die|chết/i.test(message)) {
      score -= 0.3;
    }
    
    return score;
  }

  /**
   * Extract topic tags from text
   */
  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    if (/crypto|token|coin|defi|swap|trade/.test(lower)) tags.push('crypto');
    if (/code|bug|api|server|deploy/.test(lower)) tags.push('coding');
    if (/content|blog|seo|article/.test(lower)) tags.push('content');
    if (/server|vps|nginx|docker/.test(lower)) tags.push('ops');
    if (/plan|project|build|ship/.test(lower)) tags.push('project');

    return tags;
  }

  /**
   * Calculate days since a given ISO timestamp
   */
  private daysSince(isoTimestamp: string): number {
    const then = new Date(isoTimestamp).getTime();
    const now = Date.now();
    return (now - then) / (1000 * 60 * 60 * 24);
  }

  /**
   * Generate a unique memory ID
   */
  private generateId(): string {
    return `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Get memory stats
   */
  getStats(): { total: number; episodic: number; semantic: number; procedural: number } {
    return {
      total: this.memories.length,
      episodic: this.memories.filter(m => m.type === 'episodic').length,
      semantic: this.memories.filter(m => m.type === 'semantic').length,
      procedural: this.memories.filter(m => m.type === 'procedural').length,
    };
  }
}
