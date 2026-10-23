import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- Types ---------- */

type PlanetConfig = {
  name: string;
  textureUrl: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  axialTilt: number;
  hasRings?: boolean;
  ringColor?: string;
  ringInner?: number;
  ringOuter?: number;
  emissive?: string;
  emissiveIntensity?: number;
};

/* ---------- Texture URLs (public domain NASA/solar system textures) ---------- */

const TEXTURES = {
  sun: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lava/lavatile.jpg',
  mercury: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury_1024.jpg',
  venus: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_surface_1024.jpg',
  earth: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  mars: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1024.jpg',
  jupiter: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter_1024.jpg',
  saturn: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_1024.jpg',
  saturnRing: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_ring_alpha.png',
  uranus: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus_1024.jpg',
  neptune: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune_1024.jpg',
  moon: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
};

const PLANETS: PlanetConfig[] = [
  { name: 'Mercury', textureUrl: TEXTURES.mercury, radius: 0.38, orbitRadius: 6, orbitSpeed: 0.48, rotationSpeed: 0.004, axialTilt: 0.03 },
  { name: 'Venus', textureUrl: TEXTURES.venus, radius: 0.55, orbitRadius: 8.5, orbitSpeed: 0.35, rotationSpeed: 0.002, axialTilt: 177.4 * (Math.PI / 180) },
  { name: 'Earth', textureUrl: TEXTURES.earth, radius: 0.6, orbitRadius: 12, orbitSpeed: 0.29, rotationSpeed: 0.01, axialTilt: 23.4 * (Math.PI / 180), emissive: '#0a3d80', emissiveIntensity: 0.08 },
  { name: 'Mars', textureUrl: TEXTURES.mars, radius: 0.45, orbitRadius: 16, orbitSpeed: 0.24, rotationSpeed: 0.008, axialTilt: 25.2 * (Math.PI / 180) },
  { name: 'Jupiter', textureUrl: TEXTURES.jupiter, radius: 1.4, orbitRadius: 22, orbitSpeed: 0.13, rotationSpeed: 0.02, axialTilt: 3.1 * (Math.PI / 180) },
  { name: 'Saturn', textureUrl: TEXTURES.saturn, radius: 1.15, orbitRadius: 30, orbitSpeed: 0.097, rotationSpeed: 0.018, axialTilt: 26.7 * (Math.PI / 180), hasRings: true, ringColor: '#c4a979', ringInner: 1.4, ringOuter: 2.3 },
  { name: 'Uranus', textureUrl: TEXTURES.uranus, radius: 0.8, orbitRadius: 38, orbitSpeed: 0.068, rotationSpeed: 0.012, axialTilt: 97.8 * (Math.PI / 180) },
  { name: 'Neptune', textureUrl: TEXTURES.neptune, radius: 0.78, orbitRadius: 45, orbitSpeed: 0.054, rotationSpeed: 0.013, axialTilt: 28.3 * (Math.PI / 180) },
];

/* ---------- Sun ---------- */

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, TEXTURES.sun);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
    if (coronaRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
      coronaRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Glow corona */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[2.75, 32, 32]} />
        <meshBasicMaterial color="#ff9500" transparent opacity={0.25} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.1, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.08} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.04} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      {/* Lighting */}
      <pointLight position={[0, 0, 0]} intensity={4} distance={200} decay={1} color="#fff5e6" />
      <pointLight position={[0, 0, 0]} intensity={2} distance={100} decay={2} color="#ffcc88" />
    </group>
  );
}

/* ---------- Planet ---------- */

function Planet({ config }: { config: PlanetConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, config.textureUrl);
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const angle = startAngle + state.clock.elapsedTime * config.orbitSpeed * 0.15;
      groupRef.current.position.x = Math.cos(angle) * config.orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * config.orbitRadius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += config.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} rotation={[0, 0, config.axialTilt]} castShadow receiveShadow>
        <sphereGeometry args={[config.radius, 48, 48]} />
        <meshStandardMaterial
          map={texture}
          emissive={config.emissive ?? '#000000'}
          emissiveIntensity={config.emissiveIntensity ?? 0}
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
      {config.hasRings && (
        <mesh rotation={[Math.PI / 2 + config.axialTilt, 0, 0]}>
          <ringGeometry args={[config.ringInner ?? 1.4, config.ringOuter ?? 2.3, 128]} />
          <meshStandardMaterial color={config.ringColor ?? '#c4a979'} side={THREE.DoubleSide} transparent opacity={0.7} roughness={1} />
        </mesh>
      )}
    </group>
  );
}

/* ---------- Earth's Moon ---------- */

function Moon() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, TEXTURES.moon);
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const angle = startAngle + state.clock.elapsedTime * 1.2;
      groupRef.current.position.x = Math.cos(angle) * 1.2;
      groupRef.current.position.z = Math.sin(angle) * 1.2;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

/* ---------- Earth with moon ---------- */

function EarthSystem() {
  const config = PLANETS[2]; // Earth
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, config.textureUrl);
  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const angle = startAngle + state.clock.elapsedTime * config.orbitSpeed * 0.15;
      groupRef.current.position.x = Math.cos(angle) * config.orbitRadius;
      groupRef.current.position.z = Math.sin(angle) * config.orbitRadius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += config.rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} rotation={[0, 0, config.axialTilt]} castShadow receiveShadow>
        <sphereGeometry args={[config.radius, 48, 48]} />
        <meshStandardMaterial map={texture} emissive={config.emissive} emissiveIntensity={config.emissiveIntensity} roughness={0.85} metalness={0} />
      </mesh>
      <Moon />
    </group>
  );
}

/* ---------- Orbit ring ---------- */

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
      <lineBasicMaterial color="#444444" transparent opacity={0.15} />
    </line>
  );
}

/* ---------- Scene ---------- */

function Scene() {
  const nonEarthPlanets = PLANETS.filter((_, i) => i !== 2);

  return (
    <>
      <ambientLight intensity={0.08} />
      <Sun />
      {PLANETS.map((planet) => (
        <OrbitRing key={`orbit-${planet.name}`} radius={planet.orbitRadius} />
      ))}
      {nonEarthPlanets.map((planet) => (
        <Planet key={planet.name} config={planet} />
      ))}
      <EarthSystem />
      <Stars radius={300} depth={80} count={8000} factor={6} saturation={0} fade speed={0.3} />
    </>
  );
}

/* ---------- Main component ---------- */

export default function SolarSystem3D() {
  return (
    <div className="h-full w-full bg-black">
      <Canvas
        camera={{ position: [0, 15, 35], fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#000005']} />
        <Scene />
        <OrbitControls
          enablePan
          minDistance={5}
          maxDistance={120}
          autoRotate
          autoRotateSpeed={0.15}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
