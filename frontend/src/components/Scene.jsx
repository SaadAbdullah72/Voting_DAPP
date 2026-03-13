import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float, MeshTransmissionMaterial, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const GlassOrb = () => {
  const orbRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    orbRef.current.rotation.y = t * 0.2;
    orbRef.current.position.y = Math.sin(t) * 0.1;
  });

  return (
    <Sphere ref={orbRef} args={[1.5, 64, 64]}>
      <MeshTransmissionMaterial
        backside
        backsideThickness={5}
        thickness={2}
        chromaticAberration={0.05}
        anisotropicBlur={1}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={2}
        distortion={0.5}
        distortionScale={0.5}
        temporalDistortion={0.1}
        color="#00d2ff"
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
      />
    </Sphere>
  );
};

const RotatingToken = ({ index, total }) => {
  const meshRef = useRef();
  const radius = 3.5;
  const speed = 0.5;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const angle = (index / total) * Math.PI * 2 + t * speed;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.z = Math.sin(angle) * radius;
    meshRef.current.rotation.y = t * 2;
    meshRef.current.rotation.x = t * 1.5;
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
      <meshStandardMaterial 
        color="#ffd700" 
        metalness={1} 
        roughness={0.1} 
        emissive="#ffd700"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

const Scene = () => {
  const tokens = useMemo(() => Array.from({ length: 5 }), []);

  return (
    <div className="scene-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#9d50bb" />
        
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <GlassOrb />
        </Float>

        {tokens.map((_, i) => (
          <RotatingToken key={i} index={i} total={tokens.length} />
        ))}

        <Environment preset="city" />
        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2.4} far={4.5} />
      </Canvas>
    </div>
  );
};

export default Scene;
