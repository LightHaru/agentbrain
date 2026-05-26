import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { BrainRegion } from '../types/brain';

interface BrainModelProps {
  regions: BrainRegion[];
  onRegionClick: (region: BrainRegion) => void;
}

export function BrainModel({ regions, onRegionClick }: BrainModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main brain body */}
      <Sphere args={[2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#1a1a2e"
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.4}
          metalness={0.1}
          opacity={0.3}
          transparent
        />
      </Sphere>

      {/* Brain regions */}
      {regions.map((region) => (
        <RegionMarker
          key={region.id}
          region={region}
          onClick={() => onRegionClick(region)}
        />
      ))}
    </group>
  );
}

interface RegionMarkerProps {
  region: BrainRegion;
  onClick: () => void;
}

function RegionMarker({ region, onClick }: RegionMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && region.active) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.5 + 0.5;
      meshRef.current.scale.setScalar(0.3 + pulse * 0.2 * region.activityLevel);
    }
    if (glowRef.current && region.active) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 3) * 0.5 + 0.5;
      glowRef.current.scale.setScalar(1.5 + pulse * 0.5);
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 * pulse * region.activityLevel;
    }
  });

  return (
    <group position={region.position}>
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          color={region.color}
          transparent
          opacity={region.active ? 0.3 : 0}
        />
      </mesh>

      {/* Region marker */}
      <mesh ref={meshRef} onClick={onClick}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color={region.color}
          emissive={region.color}
          emissiveIntensity={region.active ? region.activityLevel : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Neural pathways (when active) */}
      {region.active && (
        <NeuralPathway color={region.color} intensity={region.activityLevel} />
      )}
    </group>
  );
}

function NeuralPathway({ color, intensity }: { color: string; intensity: number }) {
  const lineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.Material | THREE.Material[]>>(null);

  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      pts.push(
        new THREE.Vector3(
          Math.sin(i * 0.3) * 0.5,
          i * 0.1 - 1,
          Math.cos(i * 0.3) * 0.5
        )
      );
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = (Math.sin(state.clock.getElapsedTime() * 4) * 0.5 + 0.5) * intensity;
    }
  });

  return (
    <group>
      <primitive object={new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 })
      )} ref={lineRef} />
    </group>
  );
}
