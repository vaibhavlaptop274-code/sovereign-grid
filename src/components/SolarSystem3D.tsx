import { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- Types ---------- */

type PlanetType =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'moon'
  | 'sun';

type PlanetConfig = {
  name: string;
  type: PlanetType;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  axialTilt: number;
  orbitalInclination: number;
  atmosphereColor?: string;
  atmosphereOpacity?: number;
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  hasClouds?: boolean;
  description: string;
};

/* ---------- Planet Data ---------- */

const PLANETS: PlanetConfig[] = [
  {
    name: 'Mercury',
    type: 'mercury',
    radius: 0.38,
    orbitRadius: 7,
    orbitSpeed: 0.48,
    rotationSpeed: 0.004,
    axialTilt: 0.03,
    orbitalInclination: 0.05,
    description: 'Scorched, heavily cratered iron-core world.',
  },
  {
    name: 'Venus',
    type: 'venus',
    radius: 0.58,
    orbitRadius: 10.5,
    orbitSpeed: 0.35,
    rotationSpeed: -0.002,
    axialTilt: 177.4 * (Math.PI / 180),
    orbitalInclination: 0.03,
    atmosphereColor: '#ffd28a',
    atmosphereOpacity: 0.35,
    description: 'Wrapped in dense, super-rotating sulfuric acid clouds.',
  },
  {
    name: 'Earth',
    type: 'earth',
    radius: 0.65,
    orbitRadius: 15,
    orbitSpeed: 0.28,
    rotationSpeed: 0.012,
    axialTilt: 23.4 * (Math.PI / 180),
    orbitalInclination: 0.0,
    atmosphereColor: '#4ca6ff',
    atmosphereOpacity: 0.4,
    hasClouds: true,
    description: 'The Blue Marble — liquid oceans, dynamic weather, and life.',
  },
  {
    name: 'Mars',
    type: 'mars',
    radius: 0.48,
    orbitRadius: 20,
    orbitSpeed: 0.22,
    rotationSpeed: 0.01,
    axialTilt: 25.2 * (Math.PI / 180),
    orbitalInclination: 0.03,
    atmosphereColor: '#ff7b47',
    atmosphereOpacity: 0.18,
    description: 'The Red Planet — iron oxide deserts and polar ice caps.',
  },
  {
    name: 'Jupiter',
    type: 'jupiter',
    radius: 1.65,
    orbitRadius: 29,
    orbitSpeed: 0.13,
    rotationSpeed: 0.025,
    axialTilt: 3.1 * (Math.PI / 180),
    orbitalInclination: 0.02,
    atmosphereColor: '#e6b88a',
    atmosphereOpacity: 0.2,
    description: 'King of Planets — turbulent ammonia bands and the Great Red Spot.',
  },
  {
    name: 'Saturn',
    type: 'saturn',
    radius: 1.35,
    orbitRadius: 40,
    orbitSpeed: 0.095,
    rotationSpeed: 0.022,
    axialTilt: 26.7 * (Math.PI / 180),
    orbitalInclination: 0.04,
    atmosphereColor: '#f5dcb3',
    atmosphereOpacity: 0.2,
    hasRings: true,
    ringInner: 1.7,
    ringOuter: 3.4,
    description: 'Adorned with an icy, multi-band ring system.',
  },
  {
    name: 'Uranus',
    type: 'uranus',
    radius: 0.92,
    orbitRadius: 51,
    orbitSpeed: 0.068,
    rotationSpeed: -0.015,
    axialTilt: 97.8 * (Math.PI / 180),
    orbitalInclination: 0.01,
    atmosphereColor: '#7de3f4',
    atmosphereOpacity: 0.3,
    hasRings: true,
    ringInner: 1.2,
    ringOuter: 1.55,
    description: 'Ice giant rolling on its side with faint rings.',
  },
  {
    name: 'Neptune',
    type: 'neptune',
    radius: 0.88,
    orbitRadius: 62,
    orbitSpeed: 0.054,
    rotationSpeed: 0.016,
    axialTilt: 28.3 * (Math.PI / 180),
    orbitalInclination: 0.03,
    atmosphereColor: '#3b66ff',
    atmosphereOpacity: 0.35,
    description: 'Supersonic winds sweeping across a deep azure methane atmosphere.',
  },
];

/* ---------- Procedural High-Detail Texture Generator ---------- */
/* Generates 100% reliable, zero-CORS, detailed planetary maps on the fly */

function pseudoNoise(x: number, y: number, seed: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function fbm(x: number, y: number, seed: number, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const ix = Math.floor(x * frequency);
    const iy = Math.floor(y * frequency);
    const fx = x * frequency - ix;
    const fy = y * frequency - iy;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const a = pseudoNoise(ix, iy, seed);
    const b = pseudoNoise(ix + 1, iy, seed);
    const c = pseudoNoise(ix, iy + 1, seed);
    const d = pseudoNoise(ix + 1, iy + 1, seed);
    const lerpX1 = a + u * (b - a);
    const lerpX2 = c + u * (d - c);
    value += (lerpX1 + v * (lerpX2 - lerpX1)) * amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value;
}

function createPlanetTexture(type: PlanetType): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;

  const imgData = ctx.createImageData(width, height);
  const bumpData = bCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height; // 0 to 1 latitude
    const lat = Math.abs(v - 0.5) * 2; // 0 at equator, 1 at poles

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const idx = (y * width + x) * 4;

      let r = 128,
        g = 128,
        b = 128,
        bump = 128;

      if (type === 'sun') {
        const n = fbm(u * 16, v * 16, 1, 5);
        const flare = Math.pow(n, 1.5);
        r = 255;
        g = Math.min(255, Math.floor(140 + flare * 115));
        b = Math.min(255, Math.floor(20 + flare * 160));
        bump = Math.floor(n * 255);
      } else if (type === 'mercury' || type === 'moon') {
        const n = fbm(u * 12, v * 12, type === 'mercury' ? 2 : 9, 5);
        const craters = Math.pow(fbm(u * 28, v * 28, 3, 3), 2);
        const base = type === 'mercury' ? [145, 130, 115] : [175, 175, 175];
        const shade = 0.65 + n * 0.45 - craters * 0.25;
        r = Math.floor(base[0] * shade);
        g = Math.floor(base[1] * shade);
        b = Math.floor(base[2] * shade);
        bump = Math.floor((n - craters * 0.5 + 0.5) * 180);
      } else if (type === 'venus') {
        const swirl = fbm(u * 8 + Math.sin(v * 6), v * 10, 4, 5);
        r = Math.floor(215 + swirl * 35);
        g = Math.floor(165 + swirl * 40);
        b = Math.floor(95 + swirl * 30);
        bump = Math.floor(swirl * 100);
      } else if (type === 'earth') {
        const continent = fbm(u * 6.5, v * 6.5, 11, 6);
        const detail = fbm(u * 20, v * 20, 12, 3);
        if (lat > 0.84 + (continent - 0.5) * 0.1) {
          // Polar ice caps
          r = 240;
          g = 248;
          b = 255;
          bump = 180;
        } else if (continent > 0.49) {
          // Land: forests, plains, mountains
          const elev = (continent - 0.49) * 4;
          const arid = fbm(u * 10, v * 10, 15, 3);
          if (elev > 0.65) {
            // Mountains
            r = Math.floor(120 + elev * 60);
            g = Math.floor(110 + elev * 55);
            b = Math.floor(100 + elev * 50);
            bump = 245;
          } else if (arid > 0.58 && lat < 0.45) {
            // Deserts
            r = Math.floor(195 + detail * 35);
            g = Math.floor(165 + detail * 30);
            b = Math.floor(110 + detail * 20);
            bump = 165;
          } else {
            // Lush forests & grasslands
            r = Math.floor(35 + detail * 45);
            g = Math.floor(105 + detail * 65);
            b = Math.floor(40 + detail * 30);
            bump = 155;
          }
        } else {
          // Deep & shallow oceans
          const depth = continent / 0.49;
          r = Math.floor(8 + depth * 22);
          g = Math.floor(40 + depth * 75);
          b = Math.floor(105 + depth * 105);
          bump = 90;
        }
      } else if (type === 'mars') {
        const n = fbm(u * 8, v * 8, 21, 5);
        const darkPatch = fbm(u * 4, v * 4, 22, 4);
        if (lat > 0.9) {
          r = 235;
          g = 225;
          b = 220;
          bump = 190;
        } else {
          const factor = 0.75 + n * 0.4 - (darkPatch > 0.55 ? 0.22 : 0);
          r = Math.min(255, Math.floor(198 * factor));
          g = Math.min(255, Math.floor(92 * factor));
          b = Math.min(255, Math.floor(54 * factor));
          bump = Math.floor(n * 240);
        }
      } else if (type === 'jupiter') {
        const turb = fbm(u * 10, v * 16, 31, 4) * 0.06;
        const band = Math.sin((v + turb) * Math.PI * 18);
        const band2 = Math.cos((v + turb * 0.5) * Math.PI * 9);
        // Great Red Spot
        const dx = (u - 0.55) * 3.5;
        const dy = (v - 0.62) * 8.0;
        const spotDist = Math.sqrt(dx * dx + dy * dy);
        if (spotDist < 0.28) {
          const swirl = Math.cos(spotDist * 18);
          r = Math.floor(205 + swirl * 25);
          g = Math.floor(85 + swirl * 20);
          b = Math.floor(60 + swirl * 15);
        } else {
          r = Math.floor(205 + band * 30 + band2 * 15);
          g = Math.floor(165 + band * 35 + band2 * 20);
          b = Math.floor(125 + band * 30 + band2 * 25);
        }
        bump = Math.floor(128 + band * 25);
      } else if (type === 'saturn') {
        const turb = fbm(u * 8, v * 12, 41, 3) * 0.03;
        const band = Math.sin((v + turb) * Math.PI * 22);
        r = Math.floor(225 + band * 18);
        g = Math.floor(198 + band * 18);
        b = Math.floor(148 + band * 15);
        bump = Math.floor(128 + band * 15);
      } else if (type === 'uranus') {
        const band = Math.sin(v * Math.PI * 8) * 10;
        r = Math.floor(145 + band);
        g = Math.floor(215 + band);
        b = Math.floor(230 + band);
        bump = 128;
      } else if (type === 'neptune') {
        const turb = fbm(u * 10, v * 12, 51, 4) * 0.05;
        const band = Math.sin((v + turb) * Math.PI * 14);
        r = Math.floor(42 + band * 18);
        g = Math.floor(92 + band * 25);
        b = Math.floor(210 + band * 30);
        bump = 128;
      }

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;

      bumpData.data[idx] = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  return { map, bumpMap };
}

function createCloudTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const idx = (y * width + x) * 4;
      const n = fbm(u * 10, v * 10, 77, 5);
      const alpha = n > 0.48 ? Math.min(255, Math.floor((n - 0.48) * 520)) : 0;
      imgData.data[idx] = 255;
      imgData.data[idx + 1] = 255;
      imgData.data[idx + 2] = 255;
      imgData.data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function createRingTexture(isSaturn: boolean): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;

  for (let r = 80; r < center; r += 1) {
    const norm = (r - 80) / (center - 80); // 0 inner to 1 outer
    // Cassini division gap around 0.65 - 0.72 for Saturn
    const cassiniGap = isSaturn && norm > 0.64 && norm < 0.71;
    const innerFade = Math.min(1, norm * 4);
    const outerFade = Math.min(1, (1 - norm) * 5);
    const bandWave = 0.6 + 0.4 * Math.sin(norm * 95) * Math.cos(norm * 37);
    const alpha = cassiniGap ? 0.05 : innerFade * outerFade * bandWave * (isSaturn ? 0.85 : 0.35);

    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.strokeStyle = isSaturn
      ? `rgba(${215 + Math.sin(norm * 40) * 20}, ${190 + Math.cos(norm * 40) * 20}, 150, ${alpha})`
      : `rgba(160, 220, 240, ${alpha * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Sun with Dynamic Corona & High-Reach Lighting ---------- */

function Sun({ onSelect }: { onSelect: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const corona1Ref = useRef<THREE.Mesh>(null);
  const corona2Ref = useRef<THREE.Mesh>(null);
  const { map } = useMemo(() => createPlanetTexture('sun'), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) meshRef.current.rotation.y = t * 0.03;
    if (corona1Ref.current) {
      const s1 = 1 + Math.sin(t * 2) * 0.025;
      corona1Ref.current.scale.set(s1, s1, s1);
    }
    if (corona2Ref.current) {
      const s2 = 1 + Math.cos(t * 1.3) * 0.04;
      corona2Ref.current.scale.set(s2, s2, s2);
    }
  });

  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Photosphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[3.2, 64, 64]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
      {/* Inner Corona */}
      <mesh ref={corona1Ref}>
        <sphereGeometry args={[3.55, 48, 48]} />
        <meshBasicMaterial
          color="#ffaa22"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Outer Solar Glow */}
      <mesh ref={corona2Ref}>
        <sphereGeometry args={[4.4, 48, 48]} />
        <meshBasicMaterial
          color="#ff5500"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Decay=0 ensures outer planets like Saturn & Neptune are brightly illuminated */}
      <pointLight position={[0, 0, 0]} intensity={3.2} distance={500} decay={0} color="#fff7e8" castShadow />
      <pointLight position={[0, 0, 0]} intensity={1.5} distance={80} decay={1} color="#ffaa44" />
    </group>
  );
}

/* ---------- Asteroid Belt (Instanced for 60 FPS) ---------- */

function AsteroidBelt() {
  const count = 900;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const asteroids = useMemo(() => {
    return Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 23.5 + Math.random() * 3.2;
      const y = (Math.random() - 0.5) * 1.2;
      const scale = 0.03 + Math.random() * 0.09;
      const speed = 0.02 + Math.random() * 0.015;
      return { angle, radius, y, scale, speed };
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    asteroids.forEach((a, i) => {
      const curAngle = a.angle + t * a.speed;
      dummy.position.set(
        Math.cos(curAngle) * a.radius,
        a.y,
        Math.sin(curAngle) * a.radius,
      );
      dummy.rotation.set(t * 0.4 + i, t * 0.3 + i, 0);
      dummy.scale.setScalar(a.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8a7f75" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
}

/* ---------- Earth's Moon ---------- */

function Moon() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { map, bumpMap } = useMemo(() => createPlanetTexture('moon'), []);

  useFrame((state) => {
    const angle = state.clock.elapsedTime * 0.9;
    if (groupRef.current) {
      groupRef.current.position.set(
        Math.cos(angle) * 1.5,
        Math.sin(angle * 0.5) * 0.15,
        Math.sin(angle) * 1.5,
      );
    }
    if (meshRef.current) meshRef.current.rotation.y += 0.005;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.015} roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ---------- Realistic Planet Component ---------- */

function Planet({
  config,
  speedMultiplier,
  showLabels,
  isSelected,
  onSelect,
  planetPositions,
}: {
  config: PlanetConfig;
  speedMultiplier: number;
  showLabels: boolean;
  isSelected: boolean;
  onSelect: (name: string) => void;
  planetPositions: React.MutableRefObject<Record<string, THREE.Vector3>>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const { map, bumpMap } = useMemo(() => createPlanetTexture(config.type), [config.type]);
  const cloudMap = useMemo(() => (config.hasClouds ? createCloudTexture() : null), [config.hasClouds]);
  const ringMap = useMemo(
    () => (config.hasRings ? createRingTexture(config.type === 'saturn') : null),
    [config.hasRings, config.type],
  );

  const startAngle = useMemo(() => Math.random() * Math.PI * 2, []);
  const angleRef = useRef(startAngle);

  useFrame((_, delta) => {
    angleRef.current += delta * config.orbitSpeed * 0.25 * speedMultiplier;
    if (groupRef.current) {
      const x = Math.cos(angleRef.current) * config.orbitRadius;
      const z = Math.sin(angleRef.current) * config.orbitRadius;
      const y = Math.sin(angleRef.current) * config.orbitRadius * config.orbitalInclination;
      groupRef.current.position.set(x, y, z);
      planetPositions.current[config.name] = groupRef.current.position.clone();
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += config.rotationSpeed * speedMultiplier;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += config.rotationSpeed * 1.35 * speedMultiplier;
    }
  });

  return (
    <group ref={groupRef}>
      <group
        rotation={[0, 0, config.axialTilt]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(config.name);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Main Planet Sphere */}
        <mesh ref={meshRef} castShadow receiveShadow>
          <sphereGeometry args={[config.radius, 64, 64]} />
          <meshStandardMaterial
            map={map}
            bumpMap={bumpMap}
            bumpScale={0.025}
            roughness={config.type === 'earth' ? 0.65 : 0.85}
            metalness={0.05}
          />
        </mesh>

        {/* Dynamic Cloud Layer for Earth */}
        {config.hasClouds && cloudMap && (
          <mesh ref={cloudRef}>
            <sphereGeometry args={[config.radius * 1.018, 48, 48]} />
            <meshStandardMaterial
              map={cloudMap}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Atmospheric Halo */}
        {config.atmosphereColor && (
          <mesh>
            <sphereGeometry args={[config.radius * 1.06, 48, 48]} />
            <meshBasicMaterial
              color={config.atmosphereColor}
              transparent
              opacity={config.atmosphereOpacity ?? 0.25}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {/* Textured Multi-Band Rings */}
        {config.hasRings && ringMap && (
          <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[(config.ringOuter ?? 3) * 2, (config.ringOuter ?? 3) * 2]} />
            <meshStandardMaterial
              map={ringMap}
              transparent
              side={THREE.DoubleSide}
              roughness={0.7}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* Earth's Moon */}
      {config.type === 'earth' && <Moon />}

      {/* Floating HUD Label */}
      {(showLabels || hovered || isSelected) && (
        <Html position={[0, config.radius + 0.55, 0]} center distanceFactor={28}>
          <div
            onClick={() => onSelect(config.name)}
            className={`cursor-pointer select-none whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider transition-all ${
              isSelected
                ? 'border border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-lg shadow-cyan-500/30'
                : 'border border-white/15 bg-black/70 text-white/80 hover:border-cyan-400/50 hover:text-white'
            }`}
          >
            {config.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ---------- Inclined Orbit Path ---------- */

function OrbitRing({
  radius,
  inclination,
  isSelected,
}: {
  radius: number;
  inclination: number;
  isSelected: boolean;
}) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 180;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const y = Math.sin(theta) * radius * inclination;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius, inclination]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        color={isSelected ? '#00f0ff' : '#4a5568'}
        transparent
        opacity={isSelected ? 0.65 : 0.22}
      />
    </line>
  );
}

/* ---------- Camera Follower ---------- */

function CameraTracker({
  selectedPlanet,
  planetPositions,
  controlsRef,
}: {
  selectedPlanet: string | null;
  planetPositions: React.MutableRefObject<Record<string, THREE.Vector3>>;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!controlsRef.current) return;
    if (selectedPlanet && planetPositions.current[selectedPlanet]) {
      const targetPos = planetPositions.current[selectedPlanet];
      controlsRef.current.target.lerp(targetPos, 0.08);
      controlsRef.current.update();
    } else if (!selectedPlanet) {
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      controlsRef.current.update();
    }
  });

  return null;
}

/* ---------- Main 3D Solar System Component ---------- */

export default function SolarSystem3D() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const planetPositions = useRef<Record<string, THREE.Vector3>>({});
  const controlsRef = useRef<any>(null);

  const activeConfig = PLANETS.find((p) => p.name === selectedPlanet);

  return (
    <div className="relative h-full w-full bg-[#020208]">
      <Canvas
        shadows
        camera={{ position: [0, 26, 52], fov: 50, near: 0.1, far: 1500 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => setSelectedPlanet(null)}
      >
        <color attach="background" args={['#020208']} />
        <ambientLight intensity={0.22} />
        <hemisphereLight args={['#ffffff', '#111122', 0.18]} />

        <Suspense fallback={null}>
          <Sun onSelect={() => setSelectedPlanet(null)} />
          <AsteroidBelt />

          {PLANETS.map((planet) => (
            <OrbitRing
              key={`orbit-${planet.name}`}
              radius={planet.orbitRadius}
              inclination={planet.orbitalInclination}
              isSelected={selectedPlanet === planet.name}
            />
          ))}

          {PLANETS.map((planet) => (
            <Planet
              key={planet.name}
              config={planet}
              speedMultiplier={speedMultiplier}
              showLabels={showLabels}
              isSelected={selectedPlanet === planet.name}
              onSelect={(name) => setSelectedPlanet(name)}
              planetPositions={planetPositions}
            />
          ))}

          <Stars radius={350} depth={120} count={9000} factor={5} saturation={0.2} fade speed={0.4} />
          <CameraTracker
            selectedPlanet={selectedPlanet}
            planetPositions={planetPositions}
            controlsRef={controlsRef}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan
          minDistance={3}
          maxDistance={180}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Bottom Interactive Control Bar */}
      <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/65 px-4 py-2.5 text-xs text-white backdrop-blur-md">
        <button
          onClick={() => setSelectedPlanet(null)}
          className={`rounded-lg px-2.5 py-1 font-medium transition ${
            selectedPlanet === null
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          Sun
        </button>
        {PLANETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setSelectedPlanet(p.name)}
            className={`rounded-lg px-2.5 py-1 font-medium transition ${
              selectedPlanet === p.name
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {p.name}
          </button>
        ))}

        <div className="mx-2 h-4 w-[1px] bg-white/15" />

        <label className="flex items-center gap-2 text-white/70">
          <span>Speed</span>
          <input
            type="range"
            min="0"
            max="4"
            step="0.2"
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
            className="h-1 w-20 accent-cyan-400 cursor-pointer"
          />
        </label>

        <button
          onClick={() => setShowLabels((s) => !s)}
          className="ml-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-white/80 hover:bg-white/10"
        >
          {showLabels ? 'Hide Labels' : 'Show Labels'}
        </button>
      </div>

      {/* Selected Planet Telemetry Card */}
      {activeConfig && (
        <div className="absolute top-6 left-6 z-40 max-w-xs rounded-2xl border border-cyan-500/30 bg-black/75 p-4 text-white backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-wide text-cyan-300">
              {activeConfig.name}
            </h3>
            <button
              onClick={() => setSelectedPlanet(null)}
              className="text-xs text-white/50 hover:text-white"
            >
              Reset View
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-300 leading-relaxed">
            {activeConfig.description}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-xs text-gray-400">
            <div>
              <span className="block text-[10px] uppercase text-gray-500">Orbit Radius</span>
              <span className="font-mono text-white">{activeConfig.orbitRadius} AU (scaled)</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-gray-500">Axial Tilt</span>
              <span className="font-mono text-white">
                {((activeConfig.axialTilt * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
