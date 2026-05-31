import { MemorySummary, SkillProficiency, MotivationScores, EmotionalState } from '../types/brain';

interface StatsProps {
  memories: MemorySummary;
  skills: SkillProficiency;
  motivation: MotivationScores;
  emotions: EmotionalState;
  isDark: boolean;
}

export function StatsPanel({ memories, skills, motivation, emotions, isDark }: StatsProps) {
  const topSkills = Object.entries(skills)
    .sort((a, b) => b[1].level - a[1].level)
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Memory Stats */}
      <div className={`p-4 rounded-lg ${isDark ? 'glass' : 'glass-light'}`}>
        <h3 className="text-sm font-semibold mb-3 text-purple-400">Memory System</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Memories</span>
            <span className="font-mono font-bold">{memories.total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Episodic</span>
            <span className="font-mono">{memories.byType.episodic}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Semantic</span>
            <span className="font-mono">{memories.byType.semantic}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Procedural</span>
            <span className="font-mono">{memories.byType.procedural}</span>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className={`p-4 rounded-lg ${isDark ? 'glass' : 'glass-light'}`}>
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">Top Skills</h3>
        <div className="space-y-3">
          {topSkills.map(([name, skill]) => (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1">
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{name}</span>
                <span className="font-mono font-bold">{skill.level}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivation */}
      <div className={`p-4 rounded-lg ${isDark ? 'glass' : 'glass-light'}`}>
        <h3 className="text-sm font-semibold mb-3 text-green-400">Motivation</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Curiosity</span>
            <span className="font-mono">{motivation.curiosity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Achievement</span>
            <span className="font-mono">{motivation.achievement}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Social</span>
            <span className="font-mono">{motivation.social}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Safety</span>
            <span className="font-mono">{motivation.safety}</span>
          </div>
        </div>
      </div>

      {/* Emotional State */}
      <div className={`p-4 rounded-lg ${isDark ? 'glass' : 'glass-light'}`}>
        <h3 className="text-sm font-semibold mb-3 text-pink-400">Current Mood</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl capitalize">{emotions.mood}</span>
            <span className="text-sm font-mono">{(emotions.intensity * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${emotions.intensity * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
