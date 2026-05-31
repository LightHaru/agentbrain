import { BrainState, BrainRegion } from '../types/brain';

const BRAIN_REGIONS: BrainRegion[] = [
  { id: 'memory', name: 'Memory', color: '#8B5CF6', position: [0, 0.5, 0.8], active: false, activityLevel: 0 },
  { id: 'emotion', name: 'Emotion', color: '#EC4899', position: [-0.7, 0, 0.3], active: false, activityLevel: 0 },
  { id: 'executive', name: 'Executive', color: '#3B82F6', position: [0, 0.8, 0], active: false, activityLevel: 0 },
  { id: 'reward', name: 'Reward', color: '#10B981', position: [0.7, 0, 0.3], active: false, activityLevel: 0 },
  { id: 'reflection', name: 'Reflection', color: '#F59E0B', position: [0, -0.5, 0.8], active: false, activityLevel: 0 },
  { id: 'skill', name: 'Skill', color: '#06B6D4', position: [-0.5, -0.3, -0.5], active: false, activityLevel: 0 },
  { id: 'routing', name: 'Routing', color: '#EF4444', position: [0.5, -0.3, -0.5], active: false, activityLevel: 0 }
];

export async function fetchBrainState(_brainPath: string = '../brain'): Promise<BrainState> {
  // Mock data for now - in production this would read from brain files
  const mockState: BrainState = {
    timestamp: new Date().toISOString(),
    regions: BRAIN_REGIONS.map(r => ({
      ...r,
      active: Math.random() > 0.7,
      activityLevel: Math.random()
    })),
    personality: {
      independence: 90,
      loyalty: 95,
      sassiness: 90,
      protectiveness: 90,
      antiHallucination: 100,
      engineerMindset: 95,
      craftsmanship: 90,
      cuteness: 85,
      attachment: 80
    },
    emotions: {
      mood: 'focused',
      intensity: 0.7,
      recentEmotions: [
        { emotion: 'curious', timestamp: new Date(Date.now() - 3600000).toISOString(), trigger: 'New task received' },
        { emotion: 'satisfied', timestamp: new Date(Date.now() - 7200000).toISOString(), trigger: 'Task completed successfully' }
      ]
    },
    skills: {
      'Problem Solving': { level: 95, experience: 1250, lastUsed: new Date().toISOString() },
      'Code Engineering': { level: 95, experience: 1180, lastUsed: new Date(Date.now() - 3600000).toISOString() },
      'Research': { level: 90, experience: 980, lastUsed: new Date(Date.now() - 7200000).toISOString() },
      'Communication': { level: 85, experience: 850, lastUsed: new Date().toISOString() }
    },
    memories: {
      total: 1247,
      byType: {
        episodic: 523,
        semantic: 612,
        procedural: 112
      },
      recentAccess: [
        { id: 'mem_001', content: 'Sếp prefers concise responses', timestamp: new Date().toISOString() },
        { id: 'mem_002', content: 'AgentBrain project structure', timestamp: new Date(Date.now() - 1800000).toISOString() }
      ]
    },
    motivation: {
      curiosity: 85,
      achievement: 92,
      social: 78,
      safety: 88
    }
  };

  return mockState;
}

export async function fetchTimelineData() {
  // Mock timeline data
  return [
    { timestamp: new Date(Date.now() - 86400000).toISOString(), event: 'Project initialized', region: 'executive' },
    { timestamp: new Date(Date.now() - 43200000).toISOString(), event: 'Memory system activated', region: 'memory' },
    { timestamp: new Date(Date.now() - 21600000).toISOString(), event: 'Skill proficiency updated', region: 'skill' },
    { timestamp: new Date().toISOString(), event: 'Dashboard visualization started', region: 'executive' }
  ];
}
