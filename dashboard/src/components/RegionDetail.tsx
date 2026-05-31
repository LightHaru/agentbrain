
import { BrainRegion } from '../types/brain';

interface RegionDetailProps {
  region: BrainRegion | null;
  onClose: () => void;
  isDark: boolean;
}

export function RegionDetail({ region, onClose, isDark }: RegionDetailProps) {
  if (!region) return null;

  const regionInfo: Record<string, { description: string; functions: string[] }> = {
    memory: {
      description: 'Stores and retrieves episodic, semantic, and procedural memories. Manages long-term knowledge and recent interactions.',
      functions: ['Memory consolidation', 'Recall optimization', 'Context retrieval', 'Knowledge graph management']
    },
    emotion: {
      description: 'Processes emotional states, relationship dynamics, and affective responses to interactions.',
      functions: ['Mood tracking', 'Relationship management', 'Empathy modeling', 'Emotional regulation']
    },
    executive: {
      description: 'Handles decision-making, task prioritization, and goal management. The control center of the brain.',
      functions: ['Task routing', 'Priority management', 'Decision logging', 'Goal tracking']
    },
    reward: {
      description: 'Manages motivation, reinforcement learning, and feedback processing.',
      functions: ['Reward calculation', 'Motivation scoring', 'Feedback integration', 'Behavior reinforcement']
    },
    reflection: {
      description: 'Enables meta-cognition, self-improvement, and learning from past experiences.',
      functions: ['Performance analysis', 'Growth tracking', 'Pattern recognition', 'Self-improvement']
    },
    skill: {
      description: 'Tracks skill proficiency, experience accumulation, and capability development.',
      functions: ['Skill leveling', 'Experience tracking', 'Capability assessment', 'Learning curves']
    },
    routing: {
      description: 'Determines which cognitive modules to activate for each task and manages information flow.',
      functions: ['Module selection', 'Information routing', 'Load balancing', 'Context switching']
    }
  };

  const info = regionInfo[region.id] || { description: 'Unknown region', functions: [] };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-lg w-full rounded-xl p-6 ${isDark ? 'glass' : 'glass-light bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: region.color }}
            />
            <h2 className="text-2xl font-bold">{region.name} Region</h2>
          </div>
          <button
            onClick={onClose}
            className={`text-2xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: region.color }}>
              Description
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {info.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: region.color }}>
              Core Functions
            </h3>
            <ul className="space-y-1">
              {info.functions.map((func, i) => (
                <li key={i} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  • {func}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: region.color }}>
              Current Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Active</span>
                <span className="font-mono">{region.active ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Activity Level</span>
                <span className="font-mono">{(region.activityLevel * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${region.activityLevel * 100}%`,
                    backgroundColor: region.color
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
