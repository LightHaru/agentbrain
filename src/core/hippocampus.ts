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
import { SqlStorageAdapter } from '../storage/sql-adapter.js';
import { VectorMemory } from './vector-memory.js';
import { QueryAnalyzer, QueryContext } from './query-analyzer.js';

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
  private fileManager: BrainFileManager | SqlStorageAdapter;
  private shortTermBuffer: ConversationTurn[] = [];
  private memories: Memory[] = [];
  private heartbeatCount: number = 0;
  private vectorMemory: VectorMemory;
  private queryAnalyzer: QueryAnalyzer;

  constructor(config: BrainConfig, fileManager: BrainFileManager | SqlStorageAdapter) {
    this.config = config;
    this.fileManager = fileManager;
    
    // Get BrainDatabase instance if using SqlStorageAdapter
    const brainDb = fileManager instanceof SqlStorageAdapter ? fileManager.getDatabase() : undefined;
    
    this.vectorMemory = new VectorMemory({
      dbPath: `${config.brainDir}/vector.db`,
      dims: 768,
      maxResults: config.maxRecallResults,
      minSimilarity: 0.5,
    }, brainDb);

    this.queryAnalyzer = new QueryAnalyzer();
  }

  /**
   * Initialize: load existing memories from brain files
   */
  async initialize(): Promise<void> {
    this.memories = await this.fileManager.loadMemories();
    await this.vectorMemory.initialize();
    // Index any unindexed memories
    const indexed = await this.vectorMemory.indexAll(this.memories);
    console.log(`[Hippocampus] Loaded ${this.memories.length} memories, indexed ${indexed} new vectors`);
  }

  /**
   * Recall relevant memories using context-aware retrieval
   * Phase 4 enhancement: query understanding + smart filtering + dynamic limit
   */
  async recall(query: string, topic: string): Promise<Memory[]> {
    const queryContext = await this.queryAnalyzer.analyze(query, topic);

    if (this.config.debug) {
      console.log('[Hippocampus] Query context:', this.queryAnalyzer.formatDebug(queryContext));
    }

    const candidates = this.filterCandidates(queryContext);

    if (this.config.debug) {
      console.log(`[Hippocampus] Filtered candidates: ${candidates.length}/${this.memories.length}`);
    }

    // Primary: vector-based semantic recall on filtered candidates
    const vectorResults = await this.vectorMemory.recall(query, candidates, topic);

    if (vectorResults.length > 0) {
      // Update access metadata only for high-scoring results
      for (const result of vectorResults) {
        if (result.similarity > 0.5) {
          result.memory.accessCount++;
          result.memory.lastAccessed = new Date().toISOString();
          result.memory.confidence = Math.min(1, result.memory.confidence + 0.02);
        }
      }

      const limit = this.queryAnalyzer.getMemoryLimit(queryContext);
      return vectorResults.slice(0, limit).map(r => r.memory);
    }

    // Fallback: keyword-based recall (for when vector search returns nothing)
    return this.keywordRecall(query, topic);
  }

  /**
   * Filter candidate memories based on query context
   */
  private filterCandidates(queryContext: QueryContext): Memory[] {
    let candidates = this.memories;

    if (queryContext.filters.memoryTypes && queryContext.filters.memoryTypes.length > 0) {
      candidates = candidates.filter(m => queryContext.filters.memoryTypes!.includes(m.type));
    }

    if (queryContext.taskType) {
      candidates = candidates.filter(m =>
        m.tags.includes(queryContext.taskType!) ||
        m.type === 'procedural'
      );
    }

    if (queryContext.entities.length > 0) {
      const withEntities = candidates.filter(m => {
        const memLower = m.content.toLowerCase();
        return queryContext.entities.some(e => memLower.includes(e.toLowerCase()));
      });

      if (withEntities.length > 0) {
        candidates = withEntities;
      }
    }

    if (queryContext.filters.minConfidence) {
      candidates = candidates.filter(m => m.confidence >= queryContext.filters.minConfidence!);
    }

    if (candidates.length === 0) {
      if (this.config.debug) {
        console.log('[Hippocampus] Filters too aggressive, falling back to all memories');
      }
      candidates = this.memories;
    }

    return candidates;
  }

  /**
   * Fallback keyword-based recall
   */
  private keywordRecall(query: string, topic: string): Memory[] {
    const queryLower = query.toLowerCase();
    const scored = this.memories.map(memory => {
      let score = memory.confidence;

      const words = queryLower.split(/\s+/);
      const matchCount = words.filter(w => 
        memory.content.toLowerCase().includes(w) && w.length > 2
      ).length;
      score += matchCount * 0.1;

      const topicMatch = memory.tags.includes(topic);
      if (topicMatch) score += 0.2;

      const daysSinceAccess = this.daysSince(memory.lastAccessed);
      score += Math.max(0, 0.1 - daysSinceAccess * 0.01);

      return { memory, score, matchCount, topicMatch };
    });

    scored.sort((a, b) => b.score - a.score);
    const recalled = scored
      .slice(0, this.config.maxRecallResults)
      .filter(s => s.score > 0.3 && (s.matchCount > 0 || s.topicMatch))
      .map(s => s.memory);

    for (const memory of recalled) {
      memory.accessCount++;
      memory.lastAccessed = new Date().toISOString();
      memory.confidence = Math.min(1, memory.confidence + 0.01);
    }

    return recalled;
  }

  /**
   * Consolidate a conversation turn into memory
   */
  async consolidate(turn: ConversationTurn): Promise<void> {
    this.shortTermBuffer.push(turn);

    // Extract memory candidates from the turn
    const candidates = this.extractMemoryCandidates(turn);

    // Dedup candidates: keep highest importance per unique content
    const dedupMap = new Map<string, MemoryCandidate>();
    for (const candidate of candidates) {
      if (candidate.importance < 0.3) continue;
      const key = candidate.content.toLowerCase().trim();
      const existing = dedupMap.get(key);
      if (!existing || candidate.importance > existing.importance) {
        // Merge tags from both if existing
        if (existing) {
          const mergedTags = [...new Set([...existing.tags, ...candidate.tags])];
          candidate.tags = mergedTags;
        }
        dedupMap.set(key, candidate);
      }
    }

    for (const candidate of dedupMap.values()) {
      // Check if similar memory already exists (prevent cross-session duplicates)
      const isDuplicate = this.memories.some(m =>
        m.content.toLowerCase().trim() === candidate.content.toLowerCase().trim()
      );
      if (isDuplicate) continue;

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
      // Index new memory into vector store
      await this.vectorMemory.indexMemory(memory);
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
    const resp = turn.response;

    if (this.isLowValueMessage(msg)) {
      if (resp && /price|\$[\d.]+|hashrate|online|offline|balance|paid|lãi|lỗ/i.test(resp)) {
        const keyLine = resp.split('\n').find(l => /\$[\d.]+|\d+.*TH\/s|PRL\/ngày/i.test(l));
        if (keyLine) {
          candidates.push({
            content: `[Finding] ${keyLine.slice(0, 200)}`,
            type: 'semantic',
            tags: [...this.extractTags(resp), 'finding'],
            importance: 0.6,
          });
        }
      }
      return candidates;
    }

    // Episodic: user made a decision or took an action
    if (/chốt|quyết định|đã làm|xong|done|deployed|published|bought|sold/i.test(msg)) {
      candidates.push({
        content: `[Decision] ${turn.senderName}: ${msg.slice(0, 200)}`,
        type: 'episodic',
        tags: [...this.extractTags(msg), 'decision'],
        importance: 0.7,
      });
    }

    // Episodic: emotional messages (teasing, praising, angry) — only strong ones
    if (/giỏi|đỉnh|ngon|tuyệt|khùng|ngu|dở|chán|tệ|ghét|yêu|thương/i.test(msg)) {
      candidates.push({
        content: `[Emotion] ${turn.senderName}: ${msg.slice(0, 150)}`,
        type: 'episodic',
        tags: [...this.extractTags(msg), 'emotional'],
        importance: 0.5,
      });
    }

    // Semantic: user shared a fact, preference, or identity info
    if (/là|thích|ghét|muốn|cần|prefer|always|never|luôn|không bao giờ|anh.*dùng|em.*dùng/i.test(msg)) {
      // Extract the actual fact, not just raw message
      candidates.push({
        content: `[Fact] ${turn.senderName}: ${msg.slice(0, 200)}`,
        type: 'semantic',
        tags: [...this.extractTags(msg), 'preference'],
        importance: 0.7,
      });
    }

    // Semantic: numbers, prices, addresses, technical specs mentioned
    if (/\$[\d.]+|\d+\s*(TH\/s|GH\/s|PRL|USD|USDT|GB|TB)|0x[a-fA-F0-9]{10,}|prl1[a-z0-9]{20,}/i.test(msg)) {
      candidates.push({
        content: `[Data] ${turn.senderName}: ${msg.slice(0, 200)}`,
        type: 'semantic',
        tags: [...this.extractTags(msg), 'data', 'numbers'],
        importance: 0.6,
      });
    }

    // Semantic: extract facts from agent response (key findings)
    if (resp && /giá.*\$|hashrate|online|offline|balance|paid|lãi|lỗ/i.test(resp)) {
      // Extract the key finding line
      const keyLine = resp.split('\n').find(l => /\$[\d.]+|\d+.*TH\/s|PRL\/ngày/i.test(l));
      if (keyLine) {
        candidates.push({
          content: `[Finding] ${keyLine.slice(0, 200)}`,
          type: 'semantic',
          tags: [...this.extractTags(resp), 'finding'],
          importance: 0.6,
        });
      }
    }

    // Procedural: a workflow or how-to was discussed
    if (/cách|how to|step|bước|workflow|process|quy trình|command|lệnh/i.test(msg)) {
      candidates.push({
        content: `[Procedure] ${msg.slice(0, 200)}`,
        type: 'procedural',
        tags: [...this.extractTags(msg), 'howto'],
        importance: 0.5,
      });
    }

    // Procedural: technical decisions/configs
    if (/config|setting|setup|install|deploy|build|api|token|key|bridge|swap|mine/i.test(msg)) {
      candidates.push({
        content: `[Technical] ${turn.senderName}: ${msg.slice(0, 200)}`,
        type: 'procedural',
        tags: [...this.extractTags(msg), 'technical'],
        importance: 0.5,
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
      const accessProtection = Math.min(0.8, memory.accessCount * 0.05);
      const decay = daysSinceAccess * this.config.memoryDecayRate * (1 - accessProtection);
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
   * Skip chat noise unless it contains durable data.
   */
  private isLowValueMessage(message: string): boolean {
    const text = message.trim();
    if (/\$[\d.]+|\d+\s*(TH\/s|GH\/s|PRL|USD|USDT|GB|TB|ETH|SOL|BTC)|0x[a-fA-F0-9]{10,}|prl1[a-z0-9]{20,}/i.test(text)) {
      return false;
    }
    if (text.length < 12) return true;
    if (/^[\/!]/.test(text)) return true;
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 2) return true;
    if (/^(gm|gn|hi|hello|chào|alo+|ê+|ơi+|aira+|em+|anh+)[\s!?.]*$/i.test(text)) return true;
    if (/^(gà|mập|gà mập|baka|đụt|đần)[\s!?.]*$/i.test(text)) return true;
    return false;
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
  getStats(): { total: number; episodic: number; semantic: number; procedural: number; vectorIndexed: number } {
    const vectorStats = this.vectorMemory.getStats();
    return {
      total: this.memories.length,
      episodic: this.memories.filter(m => m.type === 'episodic').length,
      semantic: this.memories.filter(m => m.type === 'semantic').length,
      procedural: this.memories.filter(m => m.type === 'procedural').length,
      vectorIndexed: vectorStats.indexed,
    };
  }

  /**
   * Flush buffered memories without closing the vector store.
   */
  async flush(): Promise<void> {
    await this.persist();
  }

  /**
   * Shutdown: close vector DB
   */
  async shutdown(): Promise<void> {
    await this.persist();
    this.vectorMemory.shutdown();
  }
}
