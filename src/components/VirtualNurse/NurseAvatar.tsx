import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

interface NurseAvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  emotion: 'neutral' | 'caring' | 'concerned' | 'happy';
}

function NurseCharacter({ isListening, isSpeaking, emotion }: NurseAvatarProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Gentle breathing animation
    meshRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    
    // Slight head movement when listening
    if (isListening) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
    
    // More animated when speaking
    if (isSpeaking) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 4) * 0.15;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 6) * 0.1;
    }
  });

  const getEmotionColor = () => {
    switch (emotion) {
      case 'caring': return '#4ade80'; // green
      case 'concerned': return '#f59e0b'; // amber
      case 'happy': return '#06b6d4'; // cyan
      default: return '#6366f1'; // indigo
    }
  };

  return (
    <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Head */}
      <Sphere args={[0.8, 32, 32]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#fcd34d" />
      </Sphere>
      
      {/* Eyes */}
      <Sphere args={[0.1, 16, 16]} position={[-0.2, 2.2, 0.6]}>
        <meshStandardMaterial color="#1f2937" />
      </Sphere>
      <Sphere args={[0.1, 16, 16]} position={[0.2, 2.2, 0.6]}>
        <meshStandardMaterial color="#1f2937" />
      </Sphere>
      
      {/* Nurse cap */}
      <Box args={[1.2, 0.2, 1.2]} position={[0, 2.8, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      <Box args={[0.3, 0.3, 0.1]} position={[0, 2.9, 0.6]}>
        <meshStandardMaterial color="#dc2626" />
      </Box>
      
      {/* Body */}
      <Box args={[1.2, 2, 0.8]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      
      {/* Status indicator glow */}
      {(isListening || isSpeaking) && (
        <Sphere args={[2, 32, 32]} position={[0, 1, 0]}>
          <meshBasicMaterial 
            color={getEmotionColor()} 
            transparent 
            opacity={0.1}
            wireframe={isListening}
          />
        </Sphere>
      )}
      
      {/* Stethoscope */}
      <Box args={[0.1, 1.5, 0.1]} position={[0.3, 0.5, 0.5]} rotation={[0, 0, 0.3]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      <Sphere args={[0.2, 16, 16]} position={[0.5, -0.5, 0.5]}>
        <meshStandardMaterial color="#374151" />
      </Sphere>
      
      {/* Name tag */}
      <Box args={[0.6, 0.3, 0.05]} position={[0.6, 1.2, 0.45]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      
      {/* Caring hands gesture when speaking */}
      {isSpeaking && (
        <>
          <Box args={[0.3, 0.8, 0.2]} position={[-0.8, 0.2, 0.6]} rotation={[0, 0, -0.3]}>
            <meshStandardMaterial color="#fcd34d" />
          </Box>
          <Box args={[0.3, 0.8, 0.2]} position={[0.8, 0.2, 0.6]} rotation={[0, 0, 0.3]}>
            <meshStandardMaterial color="#fcd34d" />
          </Box>
        </>
      )}
      
      {/* Status text */}
      <Text
        position={[0, -2, 0]}
        fontSize={0.3}
        color={getEmotionColor()}
        anchorX="center"
        anchorY="middle"
      >
        {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready to help"}
      </Text>
      
      {/* Nurse name */}
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.2}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Nurse Amira
      </Text>
    </group>
  );
}

export function NurseAvatar({ isListening, isSpeaking, emotion }: NurseAvatarProps) {
  return (
    <div className="w-full h-96 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-inner">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4ade80" />
        
        <NurseCharacter 
          isListening={isListening} 
          isSpeaking={isSpeaking} 
          emotion={emotion}
        />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}