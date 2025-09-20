import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { TimeCapsule } from '../../types';
import CapsuleObject from './CapsuleObject';
import ParticleField from './ParticleField';

interface Scene3DProps {
  capsules: TimeCapsule[];
  onCapsuleClick: (capsule: TimeCapsule) => void;
  selectedCapsuleId?: string;
  enableControls?: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({
  capsules,
  onCapsuleClick,
  selectedCapsuleId,
  enableControls = true
}) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ 
          position: [0, 0, 30], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
          
          {/* Environment */}
          <Environment preset="night" />
          <Stars
            radius={300}
            depth={60}
            count={1000}
            factor={7}
            saturation={0.5}
            fade
            speed={0.5}
          />
          
          {/* Particle field */}
          <ParticleField count={2000} color="#ffffff" />
          
          {/* Time capsules */}
          {capsules.map((capsule) => (
            <CapsuleObject
              key={capsule.id}
              capsule={capsule}
              onClick={onCapsuleClick}
              isSelected={capsule.id === selectedCapsuleId}
            />
          ))}
          
          {/* Controls */}
          {enableControls && (
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={10}
              maxDistance={100}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
              autoRotate={false}
              autoRotateSpeed={0.5}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3D;