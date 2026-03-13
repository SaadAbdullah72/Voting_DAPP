import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Float, MeshTransmissionMaterial, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

const GlassOrb = () => {
  const orbRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    orbRef.current.rotation.y = t * 0.15;
    orbRef.current.position.y = Math.sin(t * 0.5) * 0.15;
  });

  return (
    // Reduced segments from 64 to 32 for mobile performance
    <Sphere ref={orbRef} args={[1.5, 32, 32]}>
      <MeshTransmissionMaterial
        backside
        backsideThickness={2}
        thickness={1}
        chromaticAberration={0.03}
        anisotropicBlur={0.5}
        clearcoat={0.5}
        clearcoatRoughness={0.1}
        envMapIntensity={1.5}
        distortion={0.3}
        distortionScale={0.3}
        temporalDistortion={0.05}
        color="#00d2ff"
        attenuationDistance={1}
        attenuationColor="#ffffff"
      />
    </Sphere>
  );
};

const VoteToken = ({ index, total }) => {
  const meshRef = useRef();
  const radius = 3.2;
  const speed = 0.4;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const angle = (index / total) * Math.PI * 2 + t * speed;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.z = Math.sin(angle) * radius;
    meshRef.current.position.y = Math.sin(t + index) * 0.2;
    meshRef.current.rotation.y = angle + Math.PI / 2;
  });

  return (
    <group ref={meshRef}>
      {/* Shield-like Token for Voting Relevance */}
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 6]} />
        <meshStandardMaterial 
          color="#ffd700" 
          metalness={1} 
          roughness={0.2} 
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.15}
        color="black"
        font="https://fonts.gstatic.com/s/outfit/v6/QGYvz_kZ_jt9lt6E086l.woff"
        anchorX="center"
        anchorY="middle"
      >
        VOTE
      </Text>
    </group>
  );
};

const Scene = () => {
  const tokens = useMemo(() => Array.from({ length: 4 }), []);

  return (
    <div className="scene-container" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 0, 
      pointerEvents: 'none',
      background: 'transparent'
    }}>
      {/* Adjusted dpr and gl for performance */}
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }} 
        dpr={[1, 1.5]}
        gl={{ 
          alpha: true, 
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#00d2ff" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#9d50bb" />
        
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <GlassOrb />
        </Float>

        {tokens.map((_, i) => (
          <VoteToken key={i} index={i} total={tokens.length} />
        ))}

        <Environment preset="city" />
        <ContactShadows position={[0, -3.5, 0]} opacity={0.3} scale={20} blur={3} far={4.5} />
      </Canvas>
    </div>
  );
};

export default Scene;
