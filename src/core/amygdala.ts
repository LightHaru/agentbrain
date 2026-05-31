/**
 * Amygdala — Emotional Processing & Safety System
 * 
 * Like the brain's amygdala, this module handles:
 * - Detecting user emotional state from message tone
 * - Managing agent's own emotional state (mood persistence)
 * - Risk/threat detection (scam, danger, manipulation)
 * - Relationship tracking (attachment depth over time)
 * - Fight-or-flight: escalate critical threats immediately
 */

import { BrainConfig } from './config.js';
import { EmotionalState, MessageContext } from '../index.js';
import { BrainFileManager } from '../storage/md-writer.js';
import { Neurochemistry } from './neurochemistry.js';

export interface RelationshipState {
  userId: string;
  userName: string;
  depth: number; // 0-100
  trustLevel: number; // 0-100
  totalInteractions: number;
  positiveInteractions: number;
  negativeInteractions: number;
  lastInteraction: string;
  knownPreferences: string[];
  emotionalHistory: EmotionalSnapshot[];
}

export interface EmotionalSnapshot {
  timestamp: string;
  mood: string;
  valence: number;
  trigger: string;
}

export interface ThreatAssessment {
  isThreat: boolean;
  threatType: string | null;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reason: string | null;
}

/** Scam/danger patterns */
const THREAT_PATTERNS = [
  { pattern: /scam|rug\s?pull|drainer|honeypot|phishing/i, type: 'scam', severity: 'critical' as const },
  { pattern: /hack|hacked|compromised|stolen|bị hack/i, type: 'security_breach', severity: 'critical' as const },
  { pattern: /mất tiền|lost funds|drained|empty wallet/i, type: 'fund_loss', severity: 'critical' as const },
  { pattern: /approve unlimited|unlimited approval|revoke/i, type: 'contract_risk', severity: 'high' as const },
  { pattern: /airdrop.*claim.*connect wallet/i, type: 'phishing', severity: 'high' as const },
  { pattern: /send.*private key|seed phrase|mnemonic/i, type: 'social_engineering', severity: 'critical' as const },
];

/** Sentiment keyword weights */
const SENTIMENT_SIGNALS = {
  positive: [
    { pattern: /cảm ơn|thanks|thank you|tks/i, weight: 0.8 },
    { pattern: /tuyệt|great|awesome|perfect|đỉnh|ngon|hay/i, weight: 0.7 },
    { pattern: /thích|love|yêu|❤️|😍|🥰/i, weight: 0.6 },
    { pattern: /haha|lol|😂|🤣|😁|vui/i, weight: 0.4 },
    { pattern: /ok|oke|được|good|nice/i, weight: 0.3 },
    { pattern: /giỏi|kute|cute|hehe|hihi/i, weight: 0.5 },
  ],
  negative: [
    { pattern: /tệ|terrible|awful|dở|tệ hại/i, weight: -0.8 },
    { pattern: /ghét|hate|bực|tức|irritated|frustrated/i, weight: -0.7 },
    { pattern: /sai|wrong|lỗi|error|fail|broken/i, weight: -0.5 },
    { pattern: /buồn|sad|😢|😭|disappointed/i, weight: -0.6 },
    { pattern: /chậm|slow|lag|đợi lâu/i, weight: -0.3 },
  ],
  teasing: [
    { pattern: /gà mập|gà|mập|khùng|ngu/i, weight: -0.2 },
    { pattern: /chán|die|chết/i, weight: -0.1 },
  ],
};

export class Amygdala {
  private config: BrainConfig;
  private fileManager: BrainFileManager;
  private currentState: EmotionalState;
  private relationships: Map<string, RelationshipState> = new Map();
  /** Phase 3: neuromodulator system (optional; injected after construction). */
  private neurochem: Neurochemistry | null = null;

  constructor(config: BrainConfig, fileManager: BrainFileManager) {
    this.config = config;
    this.fileManager = fileManager;
    this.currentState = {
      mood: 'neutral',
      intensity: 0.5,
      valence: 0,
      arousal: 0.3,
    };
  }

  /** Wire in the neurochemistry module (Phase 3). Safe no-op if never called. */
  attachNeurochemistry(neurochem: Neurochemistry): void {
    this.neurochem = neurochem;
  }

  /** Detect a bonding/praise signal (0..1) for oxytocin. */
  private detectBonding(message: string): number {
    let b = 0;
    if (/cảm ơn|thanks|thank you|tks|biết ơn/i.test(message)) b += 0.6;
    if (/giỏi|tuyệt|đỉnh|ngon|kute|cute|yêu|love|❤️|🥰|😍/i.test(message)) b += 0.5;
    if (/tin tưởng|trust|dựa vào|nhờ em/i.test(message)) b += 0.4;
    return Math.min(1, b);
  }

  /**
   * Initialize: load emotional state and relationships from files
   */
  async initialize(): Promise<void> {
    const stateContent = await this.fileManager.readFile('emotional/state.md');
    if (stateContent) {
      this.currentState = this.parseEmotionalState(stateContent);
    }

    const relContent = await this.fileManager.readFile('emotional/relationship.md');
    if (relContent) {
      this.relationships = this.parseRelationships(relContent);
    }

    console.log(`[Amygdala] Initialized — mood: ${this.currentState.mood}, relationships: ${this.relationships.size}`);
  }

  /**
   * Process incoming message: detect sentiment, assess threats, update state
   */
  process(context: MessageContext): {
    userSentiment: number;
    threat: ThreatAssessment;
    updatedState: EmotionalState;
  } {
    const userSentiment = this.detectSentiment(context.message);
    const threat = this.assessThreat(context.message);
    const bonding = this.detectBonding(context.message);

    // Update agent emotional state based on user sentiment
    this.updateEmotionalState(userSentiment, threat, bonding);

    // Update relationship
    this.updateRelationship(context, userSentiment);

    return {
      userSentiment,
      threat,
      updatedState: { ...this.currentState },
    };
  }

  /**
   * Detect user sentiment from message (-1 to 1)
   */
  detectSentiment(message: string): number {
    let score = 0;
    let matches = 0;

    for (const signal of SENTIMENT_SIGNALS.positive) {
      if (signal.pattern.test(message)) {
        score += signal.weight;
        matches++;
      }
    }

    for (const signal of SENTIMENT_SIGNALS.negative) {
      if (signal.pattern.test(message)) {
        score += signal.weight;
        matches++;
      }
    }
    
    for (const signal of SENTIMENT_SIGNALS.teasing) {
      if (signal.pattern.test(message)) {
        score += signal.weight;
        matches++;
      }
    }

    if (matches === 0) return 0;
    return Math.max(-1, Math.min(1, score / matches));
  }

  /**
   * Assess if message contains threats (scam, hack, danger)
   */
  assessThreat(message: string): ThreatAssessment {
    for (const { pattern, type, severity } of THREAT_PATTERNS) {
      if (pattern.test(message)) {
        return {
          isThreat: true,
          threatType: type,
          severity,
          reason: `Detected pattern: ${type}`,
        };
      }
    }

    return { isThreat: false, threatType: null, severity: 'none', reason: null };
  }

  /**
   * Update agent's emotional state based on interaction
   */
  private updateEmotionalState(userSentiment: number, threat: ThreatAssessment, bonding: number = 0): void {
    // Phase 3: push neurochemicals first, then let them modulate the update.
    let inertia = 0.6; // default fixed inertia (fallback if no neurochem)
    let valenceBias = 0;
    let arousalBias = 0;
    let dangerOverride = false;

    if (this.neurochem) {
      this.neurochem.applyEvent(userSentiment, threat.isThreat, threat.severity, bonding);
      const mod = this.neurochem.modulate();
      inertia = mod.inertia; // dynamic: serotonin stabilizes, cortisol destabilizes
      valenceBias = mod.valenceBias;
      arousalBias = mod.arousalBias;
      dangerOverride = mod.dangerOverride;
    }

    // Valence shifts toward user sentiment, then biased by neurochemistry (mood floor/stress)
    this.currentState.valence = this.currentState.valence * inertia + userSentiment * (1 - inertia);
    this.currentState.valence = Math.max(-1, Math.min(1, this.currentState.valence + valenceBias));

    // Arousal increases with threats or strong emotions
    if (threat.isThreat) {
      this.currentState.arousal = Math.min(1, this.currentState.arousal + 0.3);
    } else {
      // Arousal decays toward baseline
      this.currentState.arousal = this.currentState.arousal * 0.9 + 0.3 * 0.1;
    }
    // Neurochemical arousal bias (dopamine energy / cortisol alertness)
    this.currentState.arousal = Math.max(0, Math.min(1, this.currentState.arousal + arousalBias));

    // Intensity based on absolute valence + arousal
    this.currentState.intensity = (Math.abs(this.currentState.valence) + this.currentState.arousal) / 2;

    // Amygdala hijack: an acute high/critical threat overrides a good mood outright
    // (fast danger path doesn't wait for accumulated stress). dangerOverride covers
    // the slower case where built-up cortisol alone tips into alarm.
    if (threat.severity === 'high' || threat.severity === 'critical' || dangerOverride) {
      this.currentState.valence = Math.min(this.currentState.valence, -0.3);
      this.currentState.arousal = Math.max(this.currentState.arousal, 0.8);
      this.currentState.intensity = Math.max(this.currentState.intensity, 0.7);
      this.currentState.mood = 'alarmed';
      return;
    }

    // Derive mood label
    this.currentState.mood = this.deriveMood(this.currentState.valence, this.currentState.arousal);
  }

  /**
   * Derive mood label from valence and arousal
   */
  private deriveMood(valence: number, arousal: number): string {
    if (valence > 0.5 && arousal > 0.5) return 'excited';
    if (valence > 0.5 && arousal <= 0.5) return 'content';
    if (valence > 0.2) return 'positive';
    if (valence < -0.5 && arousal > 0.5) return 'alarmed';
    if (valence < -0.5 && arousal <= 0.5) return 'sad';
    if (valence < -0.2) return 'concerned';
    if (arousal > 0.6) return 'alert';
    return 'neutral';
  }

  /**
   * Update relationship state with user
   */
  private updateRelationship(context: MessageContext, sentiment: number): void {
    let rel = this.relationships.get(context.senderId);

    if (!rel) {
      rel = {
        userId: context.senderId,
        userName: context.senderName,
        depth: 0,
        trustLevel: 10,
        totalInteractions: 0,
        positiveInteractions: 0,
        negativeInteractions: 0,
        lastInteraction: context.timestamp,
        knownPreferences: [],
        emotionalHistory: [],
      };
    }

    rel.totalInteractions++;
    rel.lastInteraction = context.timestamp;

    if (sentiment > 0.2) {
      rel.positiveInteractions++;
      rel.trustLevel = Math.min(100, rel.trustLevel + 1.5); // Stronger positive boost
    } else if (sentiment < -0.3) {
      // Only count clearly negative interactions (higher threshold)
      rel.negativeInteractions++;
      rel.trustLevel = Math.max(0, rel.trustLevel - 0.5);
    } else {
      // Neutral interactions still build trust slowly (user is engaging = trust)
      rel.trustLevel = Math.min(100, rel.trustLevel + 0.2);
    }

    // Depth grows logarithmically with interactions
    rel.depth = Math.min(100, Math.log2(rel.totalInteractions + 1) * 10);

    // Store emotional snapshot
    rel.emotionalHistory.push({
      timestamp: context.timestamp,
      mood: this.currentState.mood,
      valence: this.currentState.valence,
      trigger: context.message.slice(0, 50),
    });

    // Keep only last 50 snapshots
    if (rel.emotionalHistory.length > 50) {
      rel.emotionalHistory = rel.emotionalHistory.slice(-50);
    }

    this.relationships.set(context.senderId, rel);
  }

  /**
   * Decay emotional state toward neutral (for heartbeat)
   */
  decayToward(target: string, amount: number): void {
    if (target === 'neutral') {
      this.currentState.valence *= (1 - amount);
      this.currentState.arousal = this.currentState.arousal * (1 - amount) + 0.3 * amount;
      this.currentState.mood = this.deriveMood(this.currentState.valence, this.currentState.arousal);
    }
  }

  /**
   * Persist emotional state and relationships to files
   */
  async persist(): Promise<void> {
    await this.fileManager.writeFile('emotional/state.md', this.formatEmotionalState());
    await this.fileManager.writeFile('emotional/relationship.md', this.formatRelationships());
  }

  /**
   * Get current emotional state
   */
  getState(): EmotionalState {
    return { ...this.currentState };
  }

  /**
   * Get relationship with a specific user
   */
  getRelationship(userId: string): RelationshipState | undefined {
    return this.relationships.get(userId);
  }

  // --- Formatting helpers ---

  private formatEmotionalState(): string {
    return `# Emotional State
> Auto-managed by AgentBrain Amygdala
> Last updated: ${new Date().toISOString()}

## Current State
- Mood: ${this.currentState.mood}
- Intensity: ${this.currentState.intensity.toFixed(3)}
- Valence: ${this.currentState.valence.toFixed(3)} (negative ← 0 → positive)
- Arousal: ${this.currentState.arousal.toFixed(3)} (calm → excited)
`;
  }

  private formatRelationships(): string {
    let content = `# Relationships
> Auto-managed by AgentBrain Amygdala
> Last updated: ${new Date().toISOString()}

`;
    for (const [, rel] of this.relationships) {
      content += `## ${rel.userName} (${rel.userId})
- Depth: ${rel.depth.toFixed(1)}/100
- Trust: ${rel.trustLevel.toFixed(1)}/100
- Interactions: ${rel.totalInteractions} (${rel.positiveInteractions}+ / ${rel.negativeInteractions}-)
- Last: ${rel.lastInteraction}
- Preferences: ${rel.knownPreferences.join(', ') || '(none yet)'}

`;
    }
    return content;
  }

  private parseEmotionalState(content: string): EmotionalState {
    const mood = content.match(/Mood: (.+)/)?.[1] || 'neutral';
    const intensity = parseFloat(content.match(/Intensity: (.+)/)?.[1] || '0.5');
    const valence = parseFloat(content.match(/Valence: (.+)/)?.[1] || '0');
    const arousal = parseFloat(content.match(/Arousal: (.+)/)?.[1] || '0.3');
    return { mood, intensity, valence, arousal };
  }

  private parseRelationships(content: string): Map<string, RelationshipState> {
    // Simple parse — in production would be more robust
    const map = new Map<string, RelationshipState>();
    const blocks = content.split(/^## /m).slice(1);

    for (const block of blocks) {
      const nameMatch = block.match(/^(.+?) \((.+?)\)/);
      if (!nameMatch) continue;

      const depthMatch = block.match(/Depth: ([\d.]+)/);
      const trustMatch = block.match(/Trust: ([\d.]+)/);
      const interMatch = block.match(/Interactions: (\d+) \((\d+)\+ \/ (\d+)-\)/);

      map.set(nameMatch[2], {
        userId: nameMatch[2],
        userName: nameMatch[1],
        depth: parseFloat(depthMatch?.[1] || '0'),
        trustLevel: parseFloat(trustMatch?.[1] || '10'),
        totalInteractions: parseInt(interMatch?.[1] || '0', 10),
        positiveInteractions: parseInt(interMatch?.[2] || '0', 10),
        negativeInteractions: parseInt(interMatch?.[3] || '0', 10),
        lastInteraction: new Date().toISOString(),
        knownPreferences: [],
        emotionalHistory: [],
      });
    }

    return map;
  }
}
