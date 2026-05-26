import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BrainModel } from './BrainModel';
import { BrainRegion } from '../types/brain';

interface BrainSceneProps {
  regions: BrainRegion[];
  onRegionClick: (region: BrainRegion) => void;
}

export function BrainScene({ regions, onRegionClick }: BrainSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          autoRotate={false}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
        <pointLight position={[0, 10, -10]} intensity={0.5} color="#EC4899" />
        
        {/* Brain model */}
        <BrainModel regions={regions} onRegionClick={onRegionClick} />
      </Canvas>
    </div>
  );
}
