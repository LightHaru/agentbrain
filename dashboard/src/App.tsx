import { useState, useEffect } from 'react';
import { BrainScene } from './components/BrainScene';
import { PersonalityRadar } from './components/PersonalityRadar';
import { StatsPanel } from './components/StatsPanel';
import { RegionDetail } from './components/RegionDetail';
import { fetchBrainState } from './api/brain';
import { BrainState, BrainRegion } from './types/brain';
import './styles/index.css';

function App() {
  const [brainState, setBrainState] = useState<BrainState | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<BrainRegion | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrainState();
    const interval = setInterval(loadBrainState, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function loadBrainState() {
    try {
      const state = await fetchBrainState();
      setBrainState(state);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load brain state:', error);
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading brain state...</p>
        </div>
      </div>
    );
  }

  if (!brainState) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Failed to load brain state</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-gray-800 glass' : 'border-gray-200 bg-white'} sticky top-0 z-40`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">AgentBrain Dashboard</h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Real-time cognitive visualization
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsDark(!isDark)}
            className={`px-4 py-2 rounded-lg ${isDark ? 'glass hover:bg-white/10' : 'glass-light hover:bg-black/10'} transition-colors`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: 3D Brain */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-xl overflow-hidden ${isDark ? 'glass' : 'glass-light bg-white'}`}>
              <div className="h-[500px]">
                <BrainScene
                  regions={brainState.regions}
                  onRegionClick={setSelectedRegion}
                />
              </div>
            </div>

            {/* Personality Radar */}
            <div className={`rounded-xl p-6 ${isDark ? 'glass' : 'glass-light bg-white'}`}>
              <h2 className="text-lg font-bold mb-4">Personality Traits</h2>
              <div className="h-[400px]">
                <PersonalityRadar traits={brainState.personality} isDark={isDark} />
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="space-y-6">
            <StatsPanel
              memories={brainState.memories}
              skills={brainState.skills}
              motivation={brainState.motivation}
              emotions={brainState.emotions}
              isDark={isDark}
            />
          </div>
        </div>
      </main>

      {/* Region Detail Modal */}
      <RegionDetail
        region={selectedRegion}
        onClose={() => setSelectedRegion(null)}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
