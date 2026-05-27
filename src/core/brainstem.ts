/**
 * Brainstem — Alertness, Reflexes & Autonomic Responses
 * 
 * Like the brain's brainstem, this module handles:
 * - Alertness levels (awake, drowsy, sleep mode)
 * - Reflexive responses (immediate reactions before conscious processing)
 * - Autonomic regulation (background processes, maintenance)
 * - Fight/flight/freeze responses (threat detection)
 * - Arousal modulation (how "awake" the system is)
 */

import { BrainConfig } from './config.js';

// --- Types ---

export type AlertnessLevel = 'hypervigilant' | 'alert' | 'relaxed' | 'drowsy' | 'sleep';

export interface ReflexTrigger {
  pattern: string | RegExp;
  category: 'threat' | 'urgent' | 'greeting' | 'farewell' | 'error' | 'praise' | 'insult';
  response: string;
  priority: number; // Higher = fires first
  cooldownMs: number; // Prevent repeated firing
  lastFired?: number;
}

export interface ThreatAssessment {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  response: 'ignore' | 'monitor' | 'alert' | 'fight' | 'freeze';
  details: string;
}

export interface AutonomicProcess {
  id: string;
  name: string;
  intervalMs: number;
  lastRun: number;
  enabled: boolean;
  action: string;
}

export interface BrainstemState {
  alertness: AlertnessLevel;
  arousalLevel: number; // 0-1
  activeReflexes: number;
  recentThreats: ThreatAssessment[];
  autonomicProcesses: AutonomicProcess[];
  uptime: number; // ms since initialization
  responseLatency: number; // estimated ms
}

// --- Brainstem Module ---

export class Brainstem {
  private config: BrainConfig;
  private alertness: AlertnessLevel = 'alert';
  private arousal: number = 0.6;
  private startTime: number = Date.now();
  private lastActivity: number = Date.now();
  private recentThreats: ThreatAssessment[] = [];
  private reflexHistory: { pattern: string; timestamp: number }[] = [];

  // Reflex triggers (hardwired responses)
  private reflexes: ReflexTrigger[] = [
    {
      pattern: 'scam|drainer|rug.?pull|phishing|hack',
      category: 'threat',
      response: 'ALERT: Potential security threat detected!',
      priority: 10,
      cooldownMs: 60000,
    },
    {
      pattern: 'urgent|emergency|asap|ngay lập tức|khẩn cấp',
      category: 'urgent',
      response: 'High priority detected — escalating attention',
      priority: 8,
      cooldownMs: 30000,
    },
    {
      pattern: 'error|crash|fail|broken|lỗi|hỏng|chết',
      category: 'error',
      response: 'Error signal detected — activating diagnostic mode',
      priority: 7,
      cooldownMs: 10000,
    },
    {
      pattern: '^(hi|hello|hey|chào|ê|yo|sếp ơi)',
      category: 'greeting',
      response: 'Social greeting detected — warm response mode',
      priority: 3,
      cooldownMs: 5000,
    },
    {
      pattern: '(bye|tạm biệt|good night|ngủ ngon|đi ngủ)',
      category: 'farewell',
      response: 'Farewell detected — closing interaction mode',
      priority: 3,
      cooldownMs: 5000,
    },
    {
      pattern: '(giỏi|hay|tuyệt|good job|well done|đỉnh)',
      category: 'praise',
      response: 'Positive feedback received — reward signal',
      priority: 2,
      cooldownMs: 5000,
    },
    {
      pattern: '(ngu|dốt|gà|stupid|useless|vô dụng)',
      category: 'insult',
      response: 'Negative feedback received — defensive mode',
      priority: 4,
      cooldownMs: 10000,
    },
  ];

  // Autonomic processes (background maintenance)
  private autonomicProcesses: AutonomicProcess[] = [
    {
      id: 'memory-consolidation',
      name: 'Memory Consolidation',
      intervalMs: 300000, // 5 minutes
      lastRun: Date.now(),
      enabled: true,
      action: 'Consolidate short-term memories to long-term',
    },
    {
      id: 'attention-decay',
      name: 'Attention Decay',
      intervalMs: 60000, // 1 minute
      lastRun: Date.now(),
      enabled: true,
      action: 'Decay unused attention allocations',
    },
    {
      id: 'stress-regulation',
      name: 'Stress Regulation',
      intervalMs: 120000, // 2 minutes
      lastRun: Date.now(),
      enabled: true,
      action: 'Gradually reduce stress levels',
    },
    {
      id: 'energy-recovery',
      name: 'Energy Recovery',
      intervalMs: 180000, // 3 minutes
      lastRun: Date.now(),
      enabled: true,
      action: 'Slowly recover energy during idle periods',
    },
    {
      id: 'threat-scan',
      name: 'Threat Scanning',
      intervalMs: 30000, // 30 seconds
      lastRun: Date.now(),
      enabled: true,
      action: 'Scan for potential threats in environment',
    },
  ];

  constructor(config: BrainConfig) {
    this.config = config;
  }

  /**
   * Check for reflexive responses (fast, pre-conscious processing)
   */
  checkReflexes(input: string): ReflexTrigger | null {
    const now = Date.now();
    const lowerInput = input.toLowerCase();

    // Sort by priority (highest first)
    const sorted = [...this.reflexes].sort((a, b) => b.priority - a.priority);

    for (const reflex of sorted) {
      // Check cooldown
      if (reflex.lastFired && (now - reflex.lastFired) < reflex.cooldownMs) {
        continue;
      }

      // Check pattern match
      const regex = reflex.pattern instanceof RegExp
        ? reflex.pattern
        : new RegExp(reflex.pattern, 'i');

      if (regex.test(lowerInput)) {
        reflex.lastFired = now;
        this.reflexHistory.push({ pattern: reflex.category, timestamp: now });

        // Keep history bounded
        if (this.reflexHistory.length > 100) {
          this.reflexHistory = this.reflexHistory.slice(-50);
        }

        // Adjust arousal based on reflex type
        this.adjustArousal(reflex.category);

        return reflex;
      }
    }

    return null;
  }

  /**
   * Assess threat level from input
   */
  assessThreat(input: string, context?: { sender?: string; isKnown?: boolean }): ThreatAssessment {
    const lowerInput = input.toLowerCase();
    let level: ThreatAssessment['level'] = 'none';
    let response: ThreatAssessment['response'] = 'ignore';
    let source = 'unknown';
    let details = '';

    // Critical threats (scam, drainer, phishing)
    if (/scam|drainer|rug.?pull|phishing|steal|hack|exploit/i.test(lowerInput)) {
      level = 'critical';
      response = 'fight';
      source = 'security';
      details = 'Potential financial/security threat detected';
    }
    // High threats (unknown links, suspicious requests)
    else if (/click here|verify your|send.*private.?key|seed.?phrase/i.test(lowerInput)) {
      level = 'high';
      response = 'alert';
      source = 'social-engineering';
      details = 'Possible social engineering attempt';
    }
    // Medium threats (errors, failures)
    else if (/error|crash|fail|down|broken/i.test(lowerInput)) {
      level = 'medium';
      response = 'monitor';
      source = 'system';
      details = 'System issue detected';
    }
    // Low threats (mild negativity)
    else if (/angry|frustrated|upset|annoyed/i.test(lowerInput)) {
      level = 'low';
      response = 'monitor';
      source = 'emotional';
      details = 'User emotional distress detected';
    }

    const assessment: ThreatAssessment = { level, source, response, details };

    // Store recent threats
    if (level !== 'none') {
      this.recentThreats.push(assessment);
      if (this.recentThreats.length > 20) {
        this.recentThreats = this.recentThreats.slice(-10);
      }
    }

    return assessment;
  }

  /**
   * Update alertness based on activity and time
   */
  updateAlertness(event?: { type: string; importance?: number }): void {
    const now = Date.now();
    const idleMs = now - this.lastActivity;
    const idleMinutes = idleMs / 60000;

    if (event) {
      this.lastActivity = now;

      // Events increase alertness
      if (event.importance && event.importance > 0.7) {
        this.arousal = Math.min(1.0, this.arousal + 0.2);
      } else {
        this.arousal = Math.min(1.0, this.arousal + 0.05);
      }
    } else {
      // Idle decay
      if (idleMinutes > 30) {
        this.arousal = Math.max(0.1, this.arousal - 0.01);
      }
    }

    // Map arousal to alertness level
    if (this.arousal > 0.9) this.alertness = 'hypervigilant';
    else if (this.arousal > 0.5) this.alertness = 'alert';
    else if (this.arousal > 0.3) this.alertness = 'relaxed';
    else if (this.arousal > 0.1) this.alertness = 'drowsy';
    else this.alertness = 'sleep';
  }

  /**
   * Get due autonomic processes (background tasks that need to run)
   */
  getDueProcesses(): AutonomicProcess[] {
    const now = Date.now();
    return this.autonomicProcesses.filter(p => {
      return p.enabled && (now - p.lastRun) >= p.intervalMs;
    });
  }

  /**
   * Mark an autonomic process as completed
   */
  markProcessComplete(processId: string): void {
    const process = this.autonomicProcesses.find(p => p.id === processId);
    if (process) {
      process.lastRun = Date.now();
    }
  }

  /**
   * Run heartbeat (periodic maintenance)
   */
  heartbeat(): { dueProcesses: AutonomicProcess[]; alertness: AlertnessLevel; threats: number } {
    this.updateAlertness();

    const dueProcesses = this.getDueProcesses();

    // Auto-mark processes as complete (they run in background)
    for (const p of dueProcesses) {
      this.markProcessComplete(p.id);
    }

    return {
      dueProcesses,
      alertness: this.alertness,
      threats: this.recentThreats.length,
    };
  }

  /**
   * Get estimated response latency based on alertness
   */
  getResponseLatency(): number {
    switch (this.alertness) {
      case 'hypervigilant': return 50;
      case 'alert': return 100;
      case 'relaxed': return 200;
      case 'drowsy': return 500;
      case 'sleep': return 1000;
    }
  }

  /**
   * Fight/Flight/Freeze response
   */
  getFightFlightFreeze(threatLevel: ThreatAssessment['level']): 'fight' | 'flight' | 'freeze' {
    switch (threatLevel) {
      case 'critical':
        return 'fight'; // Actively block/warn
      case 'high':
        return this.arousal > 0.5 ? 'fight' : 'freeze'; // Alert = fight, tired = freeze
      case 'medium':
        return 'flight'; // Avoid/redirect
      default:
        return 'freeze'; // Wait and observe
    }
  }

  /**
   * Get full state for status reporting
   */
  getState(): BrainstemState {
    return {
      alertness: this.alertness,
      arousalLevel: this.arousal,
      activeReflexes: this.reflexes.length,
      recentThreats: [...this.recentThreats].slice(-5),
      autonomicProcesses: this.autonomicProcesses.map(p => ({ ...p })),
      uptime: Date.now() - this.startTime,
      responseLatency: this.getResponseLatency(),
    };
  }

  /**
   * Get alertness level
   */
  getAlertness(): AlertnessLevel {
    return this.alertness;
  }

  /**
   * Get arousal level
   */
  getArousalLevel(): number {
    return this.arousal;
  }

  /**
   * Set arousal directly (for testing)
   */
  setArousal(value: number): void {
    this.arousal = Math.max(0, Math.min(1, value));
    this.updateAlertness();
  }

  /**
   * Adjust arousal based on reflex category
   */
  private adjustArousal(category: ReflexTrigger['category']): void {
    switch (category) {
      case 'threat':
        this.arousal = Math.min(1.0, this.arousal + 0.4);
        break;
      case 'urgent':
        this.arousal = Math.min(1.0, this.arousal + 0.3);
        break;
      case 'error':
        this.arousal = Math.min(1.0, this.arousal + 0.2);
        break;
      case 'greeting':
        this.arousal = Math.min(1.0, this.arousal + 0.1);
        break;
      case 'farewell':
        this.arousal = Math.max(0.2, this.arousal - 0.1);
        break;
      case 'praise':
        this.arousal = Math.min(1.0, this.arousal + 0.05);
        break;
      case 'insult':
        this.arousal = Math.min(1.0, this.arousal + 0.25);
        break;
    }

    this.updateAlertness();
  }
}
