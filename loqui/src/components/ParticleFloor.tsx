"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ParticleFloorProps = {
  asBackground?: boolean;
  tiltDeg?: number;
  yawDeg?: number;
  color?: string;
  background?: string;
};

export default function ParticleFloorLanding({
  asBackground = true,
  tiltDeg = 50,
  yawDeg = 35,
  color = "white",
  background = "black",
}: ParticleFloorProps) {
  const containerClass = asBackground
    ? "fixed inset-0 -z-10"
    : "w-full h-screen relative";

  return (
    <div className={`${containerClass} transition-colors duration-700`}>
      <Canvas className={asBackground ? "pointer-events-none" : ""} camera={{ position: [0, 6, 12], fov: 45 }}>
        <color attach="background" args={[background]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <ParticleFloorPoints
          tiltDeg={tiltDeg}
          yawDeg={yawDeg}
          color={color}
        />
      </Canvas>
    </div>
  );
}

function ParticleFloorPoints({
  tiltDeg,
  yawDeg,
  color,
}: {
  tiltDeg: number;
  yawDeg: number;
  color: string;
}) {
  const waveIntensity = 1; // Fixed wave intensity
  const pointsRef = useRef<THREE.Points | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const targetYawRadRef = useRef(0);
  const targetPitchRadRef = useRef(0);
  const targetRollRadRef = useRef(0);
  const targetColorRef = useRef(new THREE.Color(color));
  const currentColorRef = useRef(new THREE.Color(color));

  // Create a grid of particles
  const particles = useMemo(() => {
    const temp: Array<{ position: THREE.Vector3; originalX: number; originalZ: number }> = [];
    const size = 100; // Size of the grid
    const density = 0.5; // Density of particles

    for (let x = 0; x < size; x += density) {
      for (let z = 0; z < size; z += density) {
        const position = new THREE.Vector3(
          x - size / 2, // Center the grid
          0, // Start at y=0
          z - size / 2 // Center the grid
        );
        temp.push({ position, originalX: position.x, originalZ: position.z });
      }
    }
    return temp;
  }, []);

  // Create positions array for the BufferGeometry
  const positions = useMemo(() => {
    return new Float32Array(particles.length * 3);
  }, [particles]);

  // Animation
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Scroll-driven rotation targets (snappy but damped) - NO time-based spin
    const hasWindow = typeof window !== "undefined";
    const hasDoc = typeof document !== "undefined";
    const scrollTop = hasWindow ? window.scrollY : 0;
    const viewportH = hasWindow ? window.innerHeight : 1;
    const docH = hasDoc ? document.documentElement.scrollHeight : 1;
    const maxScroll = Math.max(1, docH - viewportH);
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));

    const basePitch = (tiltDeg * Math.PI) / 180;
    const baseYaw = (yawDeg * Math.PI) / 180;
    const baseRoll = 0;

    const maxPitchDeltaRad = Math.PI / 3;  // +/- 60°
    const maxYawDeltaRad = Math.PI / 2;   // +/- 90° (side view)
    const maxRollDeltaRad = Math.PI / 4;  // +/- 45°

    // Rotation depends ONLY on scroll position (fixed rotation path)
    targetPitchRadRef.current = basePitch + Math.sin(progress * Math.PI) * maxPitchDeltaRad;
    targetYawRadRef.current = baseYaw + (progress - 0.5) * 2 * maxYawDeltaRad;
    targetRollRadRef.current = baseRoll + Math.cos(progress * Math.PI * 1.5) * maxRollDeltaRad;

    // Smooth color transition
    targetColorRef.current.set(color);
    currentColorRef.current.lerp(targetColorRef.current, 0.05); // Smooth interpolation

    particles.forEach((particle, i) => {
      // Wave animation runs continuously (time-based)
      const waveX = Math.sin(particle.originalX * 0.3 + time * 2) * 0.2 * waveIntensity;
      const waveZ = Math.cos(particle.originalZ * 0.2 + time * 1.5) * 0.2 * waveIntensity;

      // Update particle position with wave
      particle.position.y = waveX + waveZ;

      // Update the positions array (no per-vertex rotation; handled by group transform)
      positions[i * 3] = particle.originalX;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.originalZ;
    });

    // Dampen group rotation towards targets for a snappy feel
    if (groupRef.current) {
      const damping = 0.15; // higher = snappier

      const cx = groupRef.current.rotation.x;
      const cy = groupRef.current.rotation.y;
      const cz = groupRef.current.rotation.z;

      const tx = targetPitchRadRef.current;
      const ty = targetYawRadRef.current;
      const tz = targetRollRadRef.current;

      groupRef.current.rotation.x = cx + (tx - cx) * damping;
      groupRef.current.rotation.y = cy + (ty - cy) * damping;
      groupRef.current.rotation.z = cz + (tz - cz) * damping;
    }

    // Update the geometry
    const geom = pointsRef.current?.geometry as THREE.BufferGeometry | undefined;
    if (geom?.attributes?.position) {
      (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    // Update material color smoothly
    const material = pointsRef.current?.material as THREE.PointsMaterial | undefined;
    if (material) {
      material.color.copy(currentColorRef.current);
    }
  });

  const tiltRad = (tiltDeg * Math.PI) / 180;
  const yawRad = (yawDeg * Math.PI) / 180;

  return (
    <group ref={groupRef} rotation={[tiltRad, yawRad, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.1} sizeAttenuation={true} />
      </points>
    </group>
  );
}


