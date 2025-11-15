"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type CircularParticlesProps = {
  audioLevel: number;
  className?: string;
  height?: string;
};

export function CircularParticles({ audioLevel, className = "", height = "h-64" }: CircularParticlesProps) {
  return (
    <div className={`${height} w-full rounded-lg overflow-hidden relative ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true }}>
        <CircularParticlesPoints audioLevel={audioLevel} />
      </Canvas>
    </div>
  );
}

// Circular Particle Component with Multiple Layers
function CircularParticlesPoints({ audioLevel }: { audioLevel: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRefs = useRef<THREE.Points[]>([]);
  
  // Create multiple layers of circular particles
  const layers = useMemo(() => {
    const layerConfigs = [
      { count: 150, radius: 1.2, color: "#ffffff" },
      { count: 200, radius: 1.8, color: "#e0e0e0" },
      { count: 250, radius: 2.4, color: "#c0c0c0" },
      { count: 180, radius: 3.0, color: "#a0a0a0" },
    ];

    return layerConfigs.map((config, layerIndex) => {
      const temp: Array<{ angle: number; radius: number; originalRadius: number; layerIndex: number }> = [];
      const posArray = new Float32Array(config.count * 3);

      for (let i = 0; i < config.count; i++) {
        const angle = (i / config.count) * Math.PI * 2;
        const baseRadius = config.radius;
        temp.push({ angle, radius: baseRadius, originalRadius: baseRadius, layerIndex });
        
        const x = Math.cos(angle) * baseRadius;
        const y = Math.sin(angle) * baseRadius;
        const z = layerIndex * 0.1; // Slight depth separation
        
        posArray[i * 3] = x;
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = z;
      }

      return {
        particles: temp,
        positions: posArray,
        color: config.color,
        radius: config.radius,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // React to audio level - particles move outward/inward based on voice
    const audioReaction = audioLevel * 1.2; // Amplify the reaction
    
    // Update each layer
    layers.forEach((layer, layerIdx) => {
      const particlesRef = particlesRefs.current[layerIdx];
      if (!particlesRef) return;

      // Update particle positions for this layer
      layer.particles.forEach((particle, i) => {
        // Add subtle rotation (different speed per layer)
        const rotationSpeed = 0.1 + layerIdx * 0.05;
        const angle = particle.angle + time * rotationSpeed;
        
        // Radius varies with audio level and adds wave effect
        const wave = Math.sin(particle.angle * 3 + time * (2 + layerIdx * 0.5)) * 0.2;
        const currentRadius = layer.radius + audioReaction * (1 + layerIdx * 0.2) + wave;
        
        const x = Math.cos(angle) * currentRadius;
        const y = Math.sin(angle) * currentRadius;
        const z = layerIdx * 0.1 + Math.sin(particle.angle * 2 + time) * audioReaction * 0.3;
        
        layer.positions[i * 3] = x;
        layer.positions[i * 3 + 1] = y;
        layer.positions[i * 3 + 2] = z;
      });

      // Update geometry for this layer
      const geom = particlesRef.geometry as THREE.BufferGeometry | undefined;
      if (geom?.attributes?.position) {
        (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }
    });

    // Rotate the entire group slowly
    if (groupRef.current) {
      groupRef.current.rotation.z = time * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, idx) => (
        <points 
          key={idx}
          ref={(el) => {
            if (el) particlesRefs.current[idx] = el;
          }}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[layer.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial 
            color={layer.color} 
            size={0.04 + idx * 0.01} 
            sizeAttenuation={true}
            transparent
            opacity={0.7 - idx * 0.1}
          />
        </points>
      ))}
    </group>
  );
}

