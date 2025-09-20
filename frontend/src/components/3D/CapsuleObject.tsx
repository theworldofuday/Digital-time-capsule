import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import { TimeCapsule } from '../../types';
import * as THREE from 'three';

interface CapsuleObjectProps {
  capsule: TimeCapsule;
  onClick: (capsule: TimeCapsule) => void;
  isSelected?: boolean;
}

const CapsuleObject: React.FC<CapsuleObjectProps> = ({ 
  capsule, 
  onClick, 
  isSelected = false 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { viewport } = useThree();

  // Animation frame
  useFrame((state) => {
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = capsule.position.y + Math.sin(state.clock.elapsedTime + capsule.position.x) * 0.5;
      
      // Rotation animation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      
      // Scale animation on hover
      const targetScale = hovered || isSelected ? 1.2 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  // Calculate time progress (how much time has passed vs total time)
  const timeProgress = capsule.isRevealed ? 1 : 
    Math.max(0, 1 - (capsule.timeRemaining / (1000 * 60 * 60 * 24 * 365))); // Assuming max 1 year

  const handleClick = (event: any) => {
    event.stopPropagation();
    onClick(capsule);
  };

  const handlePointerEnter = () => setHovered(true);
  const handlePointerLeave = () => setHovered(false);

  return (
    <group
      ref={groupRef}
      position={[capsule.position.x, capsule.position.y, capsule.position.z]}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Main capsule body */}
      <RoundedBox
        ref={meshRef}
        args={[2, 3, 2]}
        radius={0.3}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={capsule.color}
          transparent
          opacity={capsule.isRevealed ? 0.9 : 0.7}
          emissive={capsule.isRevealed ? capsule.color : '#000000'}
          emissiveIntensity={capsule.isRevealed ? 0.2 : 0}
        />
      </RoundedBox>

      {/* Progress ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.7, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial
          color={capsule.isRevealed ? '#00ff00' : '#ffffff'}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Time progress indicator */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.71, 0]}>
        <ringGeometry args={[1.2, 1.4, 32, 1, 0, Math.PI * 2 * timeProgress]} />
        <meshBasicMaterial
          color={capsule.isRevealed ? '#00ff00' : '#ffaa00'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Title text */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
        textAlign="center"
        font="/fonts/inter-medium.woff"
      >
        {capsule.title}
      </Text>

      {/* Status indicator */}
      <mesh position={[0, -1.8, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial
          color={capsule.isRevealed ? '#00ff00' : '#ff6b6b'}
          emissive={capsule.isRevealed ? '#004400' : '#440000'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Days remaining text (if not revealed) */}
      {!capsule.isRevealed && (
        <Text
          position={[0, -2.2, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {capsule.daysRemaining} days
        </Text>
      )}

      {/* Revealed indicator */}
      {capsule.isRevealed && (
        <Text
          position={[0, -2.2, 0]}
          fontSize={0.2}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
        >
          REVEALED
        </Text>
      )}

      {/* Glow effect for hovered/selected */}
      {(hovered || isSelected) && (
        <mesh>
          <sphereGeometry args={[3]} />
          <meshBasicMaterial
            color={capsule.color}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default CapsuleObject;