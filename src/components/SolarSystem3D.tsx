import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- Planet configuration ---------- */

type PlanetConfig = {
  name: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  emissive?: string;
};

const PLANETS: PlanetConfig[] = [
  { name: 'Mercury', color: '#8c7853', radius: 0.35, orbitRadius: 4, orbitSpeed: 0.8 },
  { name: 'Venus', color: '#e8b87d', radius: 0.55, orbitRadius: 6.5, orbitSpeed: 0.5 },
  { name: 'Earth', color: '#2b7fff', radius: 0.6, orbitRadius: 9.5, orbitSpeed: 0.35, emissive: '#0a3d80' },
  { name: 'Mars', color: '#cd5c3c', radius: 0.45, orbitRadius: 13, orbitSpeed: 0.25 },
];

/* ---------- Sun ---------- */

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial
          color="#ffdd00"
          emissive="#ff9500"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      {/* Inner glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Point light at sun position */}
      <pointLight position={[0, 0, 0]} intensity={3} distance={60} decay={1.5} color="#ffd966" />
    </group>
  );
}

/* ---------- Orbiting Planet ---------- */

function Planet({ config }: { config: PlanetConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Random starting angle so planets aren't aligned
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const angle = startAngle + state.clock.elapsedTime * config.orbitSpeed * 0.3;
      groupRef.current.position.x = Math.cos(angle) * config.orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * config.orbitRadius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[config.radius, 32, 32]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive ?? '#000000'}
          emissiveIntensity={config.emissive ? 0.15 : 0}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ---------- Orbit ring visualization ---------- */

function OrbitRing({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(128);
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(p.x, 0, p.y)),
    );
    return geo;
  }, [radius]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#00f0ff" transparent opacity={0.12} />
    </line>
  );
}

/* ---------- Main scene ---------- */

function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <Sun />
      {PLANETS.map((planet) => (
        <group key={planet.name}>
          <OrbitRing radius={planet.orbitRadius} />
          <Planet config={planet} />
        </group>
      ))}
      <Stars
        radius={80}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
    </>
  );
}

/* ---------- Exported component ---------- */

export default function SolarSystem3D() {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 12, 20], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={40}
          autoRotate
          autoRotateSpeed={0.3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
