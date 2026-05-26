export interface BrainRegion {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  active: boolean;
  activityLevel: number;
}

export interface BrainState {
  timestamp: string;
  regions: BrainRegion[];
  personality: PersonalityTraits;
  emotions: EmotionalState;
  skills: SkillProficiency;
  memories: MemorySummary;
  motivation: MotivationScores;
}

export interface PersonalityTraits {
  independence: number;
  loyalty: number;
  sassiness: number;
  protectiveness: number;
  antiHallucination: number;
  engineerMindset: number;
  craftsmanship: number;
  cuteness: number;
  attachment: number;
}

export interface EmotionalState {
  mood: string;
  intensity: number;
  recentEmotions: Array<{
    emotion: string;
    timestamp: string;
    trigger: string;
  }>;
}

export interface SkillProficiency {
  [skillName: string]: {
    level: number;
    experience: number;
    lastUsed: string;
  };
}

export interface MemorySummary {
  total: number;
  byType: {
    episodic: number;
    semantic: number;
    procedural: number;
  };
  recentAccess: Array<{
    id: string;
    content: string;
    timestamp: string;
  }>;
}

export interface MotivationScores {
  curiosity: number;
  achievement: number;
  social: number;
  safety: number;
}

export interface TimelinePoint {
  timestamp: string;
  event: string;
  region: string;
}
