/**
 * AgentBrain Configuration
 */

export interface BrainConfig {
  /** Directory where brain state files are stored */
  brainDir: string;

  /** Maximum memories to retrieve per recall */
  maxRecallResults: number;

  /** Memory decay rate per day (0-1, higher = faster decay) */
  memoryDecayRate: number;

  /** Minimum confidence to keep a memory (below this = pruned) */
  minMemoryConfidence: number;

  /** Enable self-reflection after each significant task */
  enableReflection: boolean;

  /** Enable emotional state tracking */
  enableEmotions: boolean;

  /** Enable expressive delivery (kaomoji/tone/energy) so emotion shows in voice */
  enableExpression?: boolean;

  /** Enable skill/habit detection */
  enableSkillTracking: boolean;

  /** How often to run maintenance (in heartbeats) */
  maintenanceInterval: number;

  /** SQLite database path for structured data */
  dbPath: string;

  /** Enable debug logging for memory recall */
  debug?: boolean;

  /** Reasoning Whisper configuration (Phase 6) */
  reasoningWhisper?: {
    /** Enable reasoning whisper hints */
    enabled: boolean;
    /** Max tokens for whisper injection */
    maxTokens: number;
  };

  /** Optional lightweight advisor model. It critiques/checks only; Aira stays primary. */
  advisorModel?: {
    enabled: boolean;
    provider: string;
    model: string;
    role: 'verifier-only';
    maxTokens: number;
  };

  /** Freshness TTL (seconds) for volatile data. When a recalled price/market
   *  memory is older than this, Aira is told to re-search instead of reusing it. */
  volatileTtlSeconds?: {
    price?: number;
    market?: number;
    balance?: number;
  };
}

export const defaultConfig: BrainConfig = {
  brainDir: './brain',
  maxRecallResults: 10,
  memoryDecayRate: 0.01,
  minMemoryConfidence: 0.4,
  enableReflection: true,
  enableEmotions: true,
  enableExpression: true,
  enableSkillTracking: true,
  maintenanceInterval: 6, // every 6 heartbeats
  dbPath: './brain/agentbrain.db',
  reasoningWhisper: {
    enabled: true,
    maxTokens: 700,
  },
  advisorModel: {
    enabled: true,
    provider: 'qwen',
    model: 'Qwen3-4B',
    role: 'verifier-only',
    maxTokens: 256,
  },
  volatileTtlSeconds: {
    price: 300,   // 5 minutes — re-search prices older than this
    market: 300,
    balance: 900,
  },
};
