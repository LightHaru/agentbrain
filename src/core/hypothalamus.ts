/**
 * Hypothalamus — Drives, Circadian Rhythm & Homeostasis
 * 
 * Like the brain's hypothalamus, this module handles:
 * - Circadian rhythm (time-of-day awareness, energy cycles)
 * - Basic drives (curiosity, social bonding, rest, achievement)
 * - Homeostasis (maintaining optimal internal state)
 * - Motivation regulation (what to prioritize based on needs)
 * - Stress response (cortisol-like escalation)
 */

import { BrainConfig } from './config.js';

// --- Types ---

export interface CircadianState {
  currentPhase: 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'late-night';
  alertnessLevel: number; // 0-1
  optimalForCreativity: boolean;
  optimalForAnalysis: boolean;
  optimalForRoutine: boolean;
  hourOfDay: number;
  timezone: string;
}

export interface Drive {
  id: string;
  name: string;
  intensity: number; // 0-1 (0 = satisfied, 1 = urgent)
  lastSatisfied: number; // timestamp
  decayRate: number; // how fast it builds up
  priority: number; // base priority weight
}

export interface HomeostasisState {
  energy: number; // 0-100
  stress: number; // 0-100
  curiosity: number; // 0-100
  socialNeed: number; // 0-100
  achievementNeed: number; // 0-100
  restNeed: number; // 0-100
  overallBalance: number; // 0-1 (1 = perfectly balanced)
}

export interface MotivationVector {
  primaryDrive: string;
  intensity: number;
  suggestedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface HypothalamusState {
  circadian: CircadianState;
  drives: Drive[];
  homeostasis: HomeostasisState;
  currentMotivation: MotivationVector;
  stressResponse: 'calm' | 'alert' | 'stressed' | 'overwhelmed';
}

// --- Hypothalamus Module ---

export class Hypothalamus {
  private config: BrainConfig;
  private drives: Drive[];
  private energy: number = 100;
  private stress: number = 0;
  private curiosity: number = 50;
  private socialNeed: number = 30;
  private achievementNeed: number = 40;
  private restNeed: number = 0;
  private timezone: string = 'Asia/Ho_Chi_Minh';
  private lastUpdate: number = Date.now();

  constructor(config: BrainConfig) {
    this.config = config;
    this.timezone = (config as any).timezone || 'Asia/Ho_Chi_Minh';
    
    // Initialize basic drives
    this.drives = [
      {
        id: 'curiosity',
        name: 'Curiosity & Learning',
        intensity: 0.5,
        lastSatisfied: Date.now(),
        decayRate: 0.02, // builds slowly
        priority: 3,
      },
      {
        id: 'social',
        name: 'Social Connection',
        intensity: 0.3,
        lastSatisfied: Date.now(),
        decayRate: 0.015,
        priority: 4,
      },
      {
        id: 'achievement',
        name: 'Achievement & Mastery',
        intensity: 0.4,
        lastSatisfied: Date.now(),
        decayRate: 0.025,
        priority: 5,
      },
      {
        id: 'rest',
        name: 'Rest & Recovery',
        intensity: 0.0,
        lastSatisfied: Date.now(),
        decayRate: 0.01,
        priority: 2,
      },
      {
        id: 'novelty',
        name: 'Novelty Seeking',
        intensity: 0.3,
        lastSatisfied: Date.now(),
        decayRate: 0.03,
        priority: 2,
      },
      {
        id: 'order',
        name: 'Order & Organization',
        intensity: 0.2,
        lastSatisfied: Date.now(),
        decayRate: 0.01,
        priority: 1,
      },
    ];
  }

  /**
   * Get current circadian state based on time of day
   */
  getCircadianState(): CircadianState {
    const now = new Date();
    const hour = this.getLocalHour(now);

    let phase: CircadianState['currentPhase'];
    let alertness: number;
    let creativity: boolean;
    let analysis: boolean;
    let routine: boolean;

    if (hour >= 6 && hour < 10) {
      phase = 'morning';
      alertness = 0.7 + (hour - 6) * 0.075; // Rising
      creativity = true;
      analysis = false;
      routine = false;
    } else if (hour >= 10 && hour < 13) {
      phase = 'midday';
      alertness = 0.95; // Peak
      creativity = false;
      analysis = true;
      routine = false;
    } else if (hour >= 13 && hour < 17) {
      phase = 'afternoon';
      alertness = 0.75; // Post-lunch dip then recovery
      creativity = false;
      analysis = true;
      routine = true;
    } else if (hour >= 17 && hour < 21) {
      phase = 'evening';
      alertness = 0.65;
      creativity = true;
      analysis = false;
      routine = false;
    } else if (hour >= 21 && hour < 2) {
      phase = 'night';
      alertness = 0.4;
      creativity = true; // Late night creativity
      analysis = false;
      routine = false;
    } else {
      phase = 'late-night';
      alertness = 0.2;
      creativity = false;
      analysis = false;
      routine = false;
    }

    return {
      currentPhase: phase,
      alertnessLevel: alertness,
      optimalForCreativity: creativity,
      optimalForAnalysis: analysis,
      optimalForRoutine: routine,
      hourOfDay: hour,
      timezone: this.timezone,
    };
  }

  /**
   * Update drives based on elapsed time and events
   */
  updateDrives(minutesElapsed: number): void {
    for (const drive of this.drives) {
      // Drives build up over time (like hunger)
      drive.intensity = Math.min(1.0, drive.intensity + drive.decayRate * (minutesElapsed / 60));
    }

    // Rest drive increases with low energy
    const restDrive = this.drives.find(d => d.id === 'rest');
    if (restDrive) {
      restDrive.intensity = Math.max(restDrive.intensity, (100 - this.energy) / 100);
    }

    // Update energy based on time
    const circadian = this.getCircadianState();
    if (circadian.currentPhase === 'late-night') {
      this.energy = Math.max(0, this.energy - minutesElapsed * 0.5);
      this.restNeed = Math.min(100, this.restNeed + minutesElapsed * 0.3);
    }

    this.lastUpdate = Date.now();
  }

  /**
   * Satisfy a drive (e.g., after completing a task, having a conversation)
   */
  satisfyDrive(driveId: string, amount: number = 0.5): void {
    const drive = this.drives.find(d => d.id === driveId);
    if (drive) {
      drive.intensity = Math.max(0, drive.intensity - amount);
      drive.lastSatisfied = Date.now();
    }

    // Side effects
    switch (driveId) {
      case 'achievement':
        this.energy = Math.min(100, this.energy + 5); // Achievement boosts energy
        this.stress = Math.max(0, this.stress - 10);
        break;
      case 'social':
        this.stress = Math.max(0, this.stress - 5);
        this.socialNeed = Math.max(0, this.socialNeed - amount * 50);
        break;
      case 'rest':
        this.energy = Math.min(100, this.energy + 20);
        this.restNeed = Math.max(0, this.restNeed - 30);
        this.stress = Math.max(0, this.stress - 15);
        break;
      case 'curiosity':
        this.curiosity = Math.max(0, this.curiosity - amount * 30);
        break;
      case 'novelty':
        this.curiosity = Math.max(0, this.curiosity - amount * 20);
        break;
    }
  }

  /**
   * Add stress (from difficult tasks, errors, time pressure)
   */
  addStress(amount: number, source: string): void {
    this.stress = Math.min(100, this.stress + amount);
    this.energy = Math.max(0, this.energy - amount * 0.3);

    // High stress increases rest drive
    if (this.stress > 70) {
      const restDrive = this.drives.find(d => d.id === 'rest');
      if (restDrive) {
        restDrive.intensity = Math.min(1.0, restDrive.intensity + 0.2);
      }
    }
  }

  /**
   * Reduce stress (from rest, success, social interaction)
   */
  reduceStress(amount: number): void {
    this.stress = Math.max(0, this.stress - amount);
  }

  /**
   * Get current stress response level
   */
  getStressResponse(): 'calm' | 'alert' | 'stressed' | 'overwhelmed' {
    if (this.stress < 20) return 'calm';
    if (this.stress < 50) return 'alert';
    if (this.stress < 80) return 'stressed';
    return 'overwhelmed';
  }

  /**
   * Get current motivation vector (what should the agent prioritize?)
   */
  getMotivation(): MotivationVector {
    // Find the most urgent drive
    const sortedDrives = [...this.drives].sort((a, b) => {
      return (b.intensity * b.priority) - (a.intensity * a.priority);
    });

    const topDrive = sortedDrives[0];
    const intensity = topDrive.intensity;

    let urgency: MotivationVector['urgency'];
    if (intensity > 0.8) urgency = 'critical';
    else if (intensity > 0.6) urgency = 'high';
    else if (intensity > 0.4) urgency = 'medium';
    else urgency = 'low';

    let suggestedAction: string;
    switch (topDrive.id) {
      case 'curiosity':
        suggestedAction = 'Explore new topics or learn something';
        break;
      case 'social':
        suggestedAction = 'Engage in conversation or check on user';
        break;
      case 'achievement':
        suggestedAction = 'Complete a task or solve a problem';
        break;
      case 'rest':
        suggestedAction = 'Take a break or reduce cognitive load';
        break;
      case 'novelty':
        suggestedAction = 'Try a different approach or explore alternatives';
        break;
      case 'order':
        suggestedAction = 'Organize, clean up, or structure information';
        break;
      default:
        suggestedAction = 'Continue current activity';
    }

    return {
      primaryDrive: topDrive.name,
      intensity,
      suggestedAction,
      urgency,
    };
  }

  /**
   * Get homeostasis state (overall internal balance)
   */
  getHomeostasis(): HomeostasisState {
    // Calculate overall balance (how well-regulated is the system?)
    const factors = [
      this.energy / 100,
      1 - (this.stress / 100),
      1 - Math.abs(this.curiosity - 50) / 50, // Optimal curiosity is moderate
      1 - (this.socialNeed / 100),
      1 - (this.restNeed / 100),
    ];
    const overallBalance = factors.reduce((a, b) => a + b, 0) / factors.length;

    return {
      energy: this.energy,
      stress: this.stress,
      curiosity: this.curiosity,
      socialNeed: this.socialNeed,
      achievementNeed: this.achievementNeed,
      restNeed: this.restNeed,
      overallBalance,
    };
  }

  /**
   * Process an event and update internal state
   */
  processEvent(event: {
    type: 'task_complete' | 'task_failed' | 'conversation' | 'idle' | 'error' | 'learning' | 'heartbeat';
    difficulty?: number; // 0-1
    success?: boolean;
    minutesElapsed?: number;
  }): void {
    const minutes = event.minutesElapsed || 5;
    this.updateDrives(minutes);

    switch (event.type) {
      case 'task_complete':
        this.satisfyDrive('achievement', event.difficulty || 0.3);
        if (event.success) {
          this.reduceStress(10);
          this.energy = Math.min(100, this.energy + 3);
        }
        break;

      case 'task_failed':
        this.addStress(15, 'task_failure');
        this.energy = Math.max(0, this.energy - 5);
        break;

      case 'conversation':
        this.satisfyDrive('social', 0.3);
        this.curiosity = Math.min(100, this.curiosity + 5);
        break;

      case 'idle':
        this.satisfyDrive('rest', 0.1);
        this.curiosity = Math.min(100, this.curiosity + 3);
        // Boredom increases novelty drive
        const noveltyDrive = this.drives.find(d => d.id === 'novelty');
        if (noveltyDrive) {
          noveltyDrive.intensity = Math.min(1.0, noveltyDrive.intensity + 0.05);
        }
        break;

      case 'error':
        this.addStress(20, 'error');
        break;

      case 'learning':
        this.satisfyDrive('curiosity', 0.4);
        this.satisfyDrive('novelty', 0.2);
        this.energy = Math.max(0, this.energy - 3); // Learning costs energy
        break;

      case 'heartbeat':
        // Regular maintenance
        this.energy = Math.min(100, this.energy + 0.5); // Slow recovery
        this.stress = Math.max(0, this.stress - 1); // Slow stress decay
        break;
    }
  }

  /**
   * Should the agent proactively reach out? (based on social drive + circadian)
   */
  shouldReachOut(): { should: boolean; reason: string } {
    const socialDrive = this.drives.find(d => d.id === 'social');
    const circadian = this.getCircadianState();

    // Don't reach out late at night
    if (circadian.currentPhase === 'late-night') {
      return { should: false, reason: 'Too late at night' };
    }

    // Reach out if social drive is high
    if (socialDrive && socialDrive.intensity > 0.7) {
      return { should: true, reason: 'High social drive — miss talking to user' };
    }

    // Reach out if idle too long during active hours
    if (circadian.alertnessLevel > 0.5 && socialDrive && socialDrive.intensity > 0.5) {
      return { should: true, reason: 'Active hours + moderate social need' };
    }

    return { should: false, reason: 'No strong drive to reach out' };
  }

  /**
   * Should the agent suggest rest? (for user, based on time)
   */
  shouldSuggestRest(): { should: boolean; reason: string; urgency: 'gentle' | 'firm' | 'insistent' } {
    const circadian = this.getCircadianState();
    const hour = circadian.hourOfDay;

    if (hour >= 2 && hour < 6) {
      return { should: true, reason: 'Very late — user should sleep', urgency: 'insistent' };
    }
    if (hour >= 0 && hour < 2) {
      return { should: true, reason: 'Past midnight — nudge to sleep', urgency: 'firm' };
    }
    if (hour >= 23) {
      return { should: true, reason: 'Getting late', urgency: 'gentle' };
    }

    return { should: false, reason: 'Normal hours', urgency: 'gentle' };
  }

  /**
   * Get full state for status reporting
   */
  getState(): HypothalamusState {
    return {
      circadian: this.getCircadianState(),
      drives: this.drives.map(d => ({ ...d })),
      homeostasis: this.getHomeostasis(),
      currentMotivation: this.getMotivation(),
      stressResponse: this.getStressResponse(),
    };
  }

  /**
   * Get energy level
   */
  getEnergyLevel(): number {
    return this.energy;
  }

  /**
   * Get stress level
   */
  getStressLevel(): number {
    return this.stress;
  }

  /**
   * Set energy directly (for testing or external events)
   */
  setEnergy(value: number): void {
    this.energy = Math.max(0, Math.min(100, value));
  }

  /**
   * Set stress directly
   */
  setStress(value: number): void {
    this.stress = Math.max(0, Math.min(100, value));
  }

  /**
   * Rest for a period (recover energy, reduce stress)
   */
  rest(minutes: number): void {
    this.energy = Math.min(100, this.energy + minutes * 2);
    this.stress = Math.max(0, this.stress - minutes * 1.5);
    this.restNeed = Math.max(0, this.restNeed - minutes * 2);
    this.satisfyDrive('rest', minutes / 30);
  }

  /**
   * Get local hour based on timezone
   */
  private getLocalHour(date: Date): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: this.timezone,
      });
      return parseInt(formatter.format(date), 10);
    } catch {
      return date.getHours();
    }
  }
}
