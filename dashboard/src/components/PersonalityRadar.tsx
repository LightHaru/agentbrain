import { PersonalityTraits } from '../types/brain';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PersonalityRadarProps {
  traits: PersonalityTraits;
  isDark: boolean;
}

export function PersonalityRadar({ traits, isDark }: PersonalityRadarProps) {
  const data = [
    { trait: 'Independence', value: traits.independence },
    { trait: 'Loyalty', value: traits.loyalty },
    { trait: 'Sassiness', value: traits.sassiness },
    { trait: 'Protectiveness', value: traits.protectiveness },
    { trait: 'Anti-Hallucination', value: traits.antiHallucination },
    { trait: 'Engineer Mindset', value: traits.engineerMindset },
    { trait: 'Craftsmanship', value: traits.craftsmanship },
    { trait: 'Cuteness', value: traits.cuteness },
    { trait: 'Attachment', value: traits.attachment }
  ];

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke={isDark ? '#374151' : '#d1d5db'} />
          <PolarAngleAxis
            dataKey="trait"
            tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: isDark ? '#6b7280' : '#6b7280' }}
          />
          <Radar
            name="Personality"
            dataKey="value"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
