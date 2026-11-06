import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import {
  Compass,
  Crown,
  Footprints,
  Globe2,
  MapPin,
  Navigation,
  Rocket,
  Sparkles,
  User,
  Pickaxe,
  Shield,
  Trophy,
  Users,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import {
  computeEquineBiomechanics,
  computeSphericalBasis,
  evaluateShaderMatchedElevation,
  latLonToNormal,
  stepSphericalRider,
  type PlanetBiome,
  type SphericalRiderState,
} from '@/utils/planetaryNavigation';
import {
  advanceAsteroidPhase,
  buildWeeklyCouncilTranscript,
  computeSectorDummyLevel,
  createInitialPlanetEcosystem,
  getShopsForSector,
  launchAsteroidOperation,
  logShopProgress,
  placeClanWarReward,
  trainArmyUnits,
  type AsteroidTarget,
  type PlanetEcosystemData,
  type PlanetSceneMode,
  type ShopTrackerDefinition,
} from '@/utils/planetEcosystemState';
import {
  AsteroidMiningSceneR3F,
  BoyCharacter3D,
  ClanWarTrophyMesh,
  DaytimeSkyDomeWithClouds,
  getCoCSquareTexture,
  MiniFloatingHall3D,
  PlanetDummyLevelTotem,
  playHorseJumpSound,
  playHorseWhinnySound,
  SquareBaseSceneR3F,
  SquareBaseTerrainModel3D,
  TownHallModel3D,
  TrainingRoomTrackerSceneR3F,
  UserHorseModel3D,
  WeeklyCouncilMeetingSceneR3F,
  type HorseAnimRefs,
} from './PlanetScenesR3F';

/* ============================================================================
 * 0. PERMANENT 3D MODEL CONFIGURATION (ADD YOUR 3D MODEL IN CODE HERE)
 * ============================================================================
 * Option A (File in /public/models/ or URL):
 *   1. Upload your .glb, .gltf, or .obj file into `/public/models/` (e.g. `/public/models/horse.glb`)
 *   2. Set `modelUrl: '/models/horse.glb'` below.
 *
 * Option B (Paste raw .obj text directly in code):
 *   Paste the contents of a `.obj` file inside the `rawObjText` backticks below.
 * ============================================================================ */
export const DEFAULT_CUSTOM_MODEL_CONFIG = {
  modelUrl: '', // e.g. '/models/horse.glb' or 'https://example.com/horse.glb'
  modelName: 'Custom Horse & Rider',
  scale: 1.0,
  yawDeg: 0, // Adjust to 90, 180, or -90 if your model faces sideways/backward
  rawObjText: ``, // Or paste raw Wavefront .obj vertices/faces (`v ... \n f ...`) here
};

export interface PlanetLandmarkSpot {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lon: number;
  color: string;
  icon: string;
}

export const PLANET_LANDMARKS: PlanetLandmarkSpot[] = [
  {
    id: 'sanctum',
    name: 'Sovereign Sanctum',
    subtitle: 'Central Command Citadel & Hearth',
    lat: 0.21,
    lon: 0.05,
    color: '#f59e0b',
    icon: '⛺',
  },
  {
    id: 'asia',
    name: 'Asia Silk Citadel',
    subtitle: 'Far Eastern Continental Outpost & Pagoda',
    lat: 0.46,
    lon: 1.82,
    color: '#e11d48',
    icon: '🏯',
  },
  {
    id: 'americas',
    name: 'Americas Sierra Redoubt',
    subtitle: 'Far Western Continental Bastion & Sierra Lodge',
    lat: 0.42,
    lon: -1.76,
    color: '#2563eb',
    icon: '🏰',
  },
  {
    id: 'library',
    name: 'Smriti Library',
    subtitle: 'Ancient Archives & Syllabus Codex',
    lat: 0.34,
    lon: 0.42,
    color: '#38bdf8',
    icon: '🏛️',
  },
  {
    id: 'army_camp',
    name: 'Ares War Camp',
    subtitle: 'Cavalry Garrison & Meso Training',
    lat: -0.08,
    lon: 0.55,
    color: '#ef4444',
    icon: '⚔️',
  },
  {
    id: 'crucible',
    name: 'Temporal Crucible',
    subtitle: 'Deep-Focus Chronometer & Study Tower',
    lat: 0.28,
    lon: -0.48,
    color: '#a855f7',
    icon: '⏳',
  },
  {
    id: 'vault',
    name: 'Arka Treasury Vault',
    subtitle: 'CE Income Streams & Sovereign Mint',
    lat: -0.22,
    lon: -0.38,
    color: '#10b981',
    icon: '🏦',
  },
  {
    id: 'market',
    name: 'Pelagic Trade Harbor',
    subtitle: 'Coastal Maritime Exchange & Docks',
    lat: -0.04,
    lon: -0.82,
    color: '#06b6d4',
    icon: '🏪',
  },
];


const R_PLANET = 28;

const IS_SOFTWARE_GL = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

function SoftwareGlFramePacer() {
  const { gl, invalidate } = useThree();
  const busyRef = useRef(false);
  const timerRef = useRef(0);

  useEffect(() => {
    invalidate();
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [invalidate]);

  useFrame(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const ctx = gl.getContext() as WebGL2RenderingContext;
    const sync = ctx.fenceSync ? ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    ctx.flush();
    const poll = () => {
      const state = sync && ctx.getSyncParameter(sync, ctx.SYNC_STATUS);
      if (sync && state === ctx.UNSIGNALED) {
        timerRef.current = window.setTimeout(poll, 5);
      } else {
        if (sync) ctx.deleteSync(sync);
        timerRef.current = window.setTimeout(() => {
          busyRef.current = false;
          invalidate();
        }, 85);
      }
    };
    timerRef.current = window.setTimeout(poll, 5);
  });

  return null;
}

/* ============================================================================
 * 1. CUSTOM GLSL SHADERS FOR CONTINUOUS NATURAL PLANET (OCEANS + LAND MASSES)
 * ============================================================================ */

const PLANET_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPlanetRadius;
  uniform float uSeedOffset;

  varying vec3 vSphereDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying float vElevation;
  varying float vMoisture;
  varying float vRidge;

  float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);

    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);

    return mix(nxy0, nxy1, u.z);
  }

  float fbm3D(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amp * noise3D(p * freq);
      freq *= 2.05;
      amp *= 0.5;
    }
    return value;
  }

  void evaluateTerrain(vec3 dir, out float elev, out float moist, out float ridgeVal) {
    vec3 s = dir + vec3(uSeedOffset * 1.3, uSeedOffset * 0.7, -uSeedOffset * 1.1);
    float warp = fbm3D(s * 1.6 + vec3(3.1, 1.7, 2.3)) * 0.45;
    float continent = fbm3D(s * 1.35 + vec3(warp, warp, -warp));

    float ridgeRaw = 1.0 - abs(noise3D(s * 3.8 + vec3(5.2, -2.1, 1.4)) * 2.0 - 1.0);
    ridgeVal = ridgeRaw * ridgeRaw;

    float detail = fbm3D(s * 6.0);
    moist = fbm3D(s * 2.8 + vec3(-4.2, 3.5, 1.9));

    vec3 diffSpawn = dir - vec3(0.0, 0.14, 0.99);
    float spawnMask = exp(-dot(diffSpawn, diffSpawn) * 6.0);
    float rawContinent = mix(continent - 0.39, 0.22, spawnMask * 0.75);

    if (rawContinent < 0.0) {
      elev = rawContinent * 2.2;
    } else {
      float hills = rawContinent * 1.65 + (detail - 0.5) * 0.18;
      float mountainMask = smoothstep(0.24, 0.44, rawContinent) * (1.0 - spawnMask * 0.85);
      float mountains = mountainMask * ridgeVal * 2.1;
      elev = hills + mountains;
    }
  }

  vec3 displacedPoint(vec3 dir) {
    float e;
    float m;
    float r;
    evaluateTerrain(dir, e, m, r);
    float disp = max(0.0, e);
    return dir * (uPlanetRadius + disp);
  }

  void main() {
    vec3 dir = normalize(position);
    vSphereDir = dir;

    float elev;
    float moist;
    float ridgeVal;
    evaluateTerrain(dir, elev, moist, ridgeVal);

    vElevation = elev;
    vMoisture = moist;
    vRidge = ridgeVal;

    float disp = max(0.0, elev);
    vec3 newPos = dir * (uPlanetRadius + disp);

    // Finite-difference tangent vectors on the sphere for outward surface normal
    vec3 refUp = abs(dir.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 t1 = normalize(cross(refUp, dir));
    vec3 t2 = normalize(cross(dir, t1));
    float eps = 0.008;

    vec3 pCenter = newPos;
    vec3 p1 = displacedPoint(normalize(dir + t1 * eps));
    vec3 p2 = displacedPoint(normalize(dir + t2 * eps));
    // cross(t1, t2) points outward along +dir
    vec3 perturbedNormal = normalize(cross(p1 - pCenter, p2 - pCenter));

    // Smooth normal on ocean surface, outward perturbed normal on land
    vec3 finalLocalNormal = elev < 0.0 ? dir : normalize(mix(dir, perturbedNormal, 0.65));

    vWorldNormal = normalize(mat3(modelMatrix) * finalLocalNormal);
    vec4 worldPosition = modelMatrix * vec4(newPos, 1.0);
    vWorldPos = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const PLANET_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunDirection;
  uniform vec3 uAtmosphereColor;

  varying vec3 vSphereDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying float vElevation;
  varying float vMoisture;
  varying float vRidge;

  float hash31(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    // High-frequency organic micro-detail for foliage & rock flutes
    float micro = noise3D(vSphereDir * 36.0);
    float fineFlute = noise3D(vec3(vSphereDir.x * 55.0, vSphereDir.y * 18.0, vSphereDir.z * 55.0));

    vec3 surfaceColor;
    float specularStrength = 0.08;

    if (vElevation < 0.0) {
      // CONTINUOUS OCEAN BASINS: Deep sapphire -> coastal turquoise -> animated surf foam
      float depthFactor = clamp(-vElevation / 0.85, 0.0, 1.0);
      vec3 shallowWater = vec3(0.08, 0.62, 0.78);
      vec3 midOcean = vec3(0.05, 0.34, 0.62);
      vec3 deepAbyss = vec3(0.03, 0.17, 0.42);

      vec3 waterCol = mix(shallowWater, midOcean, smoothstep(0.0, 0.45, depthFactor));
      waterCol = mix(waterCol, deepAbyss, smoothstep(0.45, 1.0, depthFactor));

      // Animated wave shimmer
      float wave1 = sin(vSphereDir.x * 48.0 + vSphereDir.z * 42.0 + uTime * 2.1);
      float wave2 = cos(vSphereDir.y * 52.0 - vSphereDir.x * 36.0 + uTime * 1.6);
      float waveRipple = (wave1 + wave2) * 0.5;
      waterCol += vec3(0.03, 0.07, 0.10) * waveRipple * (1.0 - depthFactor * 0.6);

      // White shoreline surf foam right along the coast
      float shoreFoam = smoothstep(-0.09, -0.002, vElevation);
      float foamPattern = smoothstep(0.35, 0.75, waveRipple * 0.5 + 0.5 + micro * 0.3);
      waterCol = mix(waterCol, vec3(0.92, 0.97, 1.0), shoreFoam * (0.55 + 0.45 * foamPattern));

      normal = normalize(normal + vec3(wave1, wave2, -wave1) * 0.025);
      surfaceColor = waterCol;
      specularStrength = 0.75;
    } else {
      // CONTINUOUS NATURAL LAND MASSES: Golden beach -> lush emerald/olive forest -> chiseled limestone peaks
      vec3 sandColor = vec3(0.88, 0.76, 0.52);
      vec3 sunlitMeadow = vec3(0.38, 0.69, 0.20);
      vec3 deepEmeraldForest = vec3(0.16, 0.48, 0.15);
      vec3 oliveHighland = vec3(0.30, 0.54, 0.21);
      vec3 limestoneCliff = vec3(0.72, 0.75, 0.78);
      vec3 alpineSnow = vec3(0.96, 0.98, 1.0);

      // Blend emerald forest & sunlit meadow using moisture + canopy micro-noise
      vec3 foliageColor = mix(
        sunlitMeadow,
        deepEmeraldForest,
        smoothstep(0.30, 0.70, vMoisture + (micro - 0.5) * 0.25)
      );
      foliageColor = mix(foliageColor, oliveHighland, smoothstep(0.55, 1.15, vElevation));

      // Transition from warm coastal sand to lush green land
      float beachBlend = smoothstep(0.0, 0.12, vElevation);
      vec3 landCol = mix(sandColor, foliageColor, beachBlend);

      // Steepness & altitude transition to chiseled grey-white limestone mountains
      float slope = 1.0 - clamp(dot(normal, vSphereDir), 0.0, 1.0);
      float rockMask = smoothstep(1.05, 1.55, vElevation + slope * 0.85);
      vec3 flutedRock = limestoneCliff * (0.84 + 0.28 * fineFlute);
      landCol = mix(landCol, flutedRock, rockMask);

      // High alpine snow-dusted ridges
      float snowMask = smoothstep(1.65, 2.15, vElevation + (micro - 0.5) * 0.18);
      landCol = mix(landCol, alpineSnow, snowMask);

      surfaceColor = landCol;
      specularStrength = mix(0.06, 0.20, snowMask);
    }

    // Lighting: Warm Golden Sun + Bright Sky Hemisphere Fill
    float NdotL = max(dot(normal, sunDir), 0.0);
    float twilightWrap = max(dot(normal, sunDir) * 0.5 + 0.5, 0.0);

    vec3 sunLight = vec3(1.05, 0.98, 0.88) * (NdotL * 0.85 + 0.22);
    vec3 skyFill = mix(vec3(0.18, 0.26, 0.38), vec3(0.42, 0.58, 0.75), twilightWrap) * 0.52;

    // Blinn-Phong solar specular highlight (strong on oceans, subtle on land)
    vec3 halfVec = normalize(sunDir + viewDir);
    float specPower = vElevation < 0.0 ? 72.0 : 18.0;
    float spec = pow(max(dot(normal, halfVec), 0.0), specPower) * specularStrength * NdotL;
    vec3 specColor = vec3(1.0, 0.96, 0.84) * spec;

    // Atmospheric Fresnel rim glow around the planetary horizon
    float fresnel = pow(1.0 - max(dot(viewDir, vSphereDir), 0.0), 3.2);
    vec3 rimGlow = uAtmosphereColor * fresnel * (0.35 + 0.45 * twilightWrap);

    vec3 finalColor = surfaceColor * (sunLight + skyFill) + specColor + rimGlow;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform vec3 uAtmosphereColor;

  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 normal = normalize(vNormal);
    float rim = pow(1.0 - max(dot(viewDir, -normal), 0.0), 2.6);
    float sunFacing = max(dot(-normal, normalize(uSunDirection)) * 0.5 + 0.5, 0.2);
    vec3 col = uAtmosphereColor * sunFacing;
    gl_FragColor = vec4(col, rim * 0.48);
  }
`;

/* ============================================================================
 * 2. PLANET SPHERE MESH WITH CUSTOM SHADER MATERIAL + FOREST & LANDMARKS
 * ============================================================================ */

function PlanetSphereWithShader({
  seedOffset,
  sunDirection,
  ecosystem,
  onSelectLandmark,
}: {
  seedOffset: number;
  sunDirection: THREE.Vector3;
  ecosystem: PlanetEcosystemData;
  onSelectLandmark: (lm: PlanetLandmarkSpot) => void;
}) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPlanetRadius: { value: R_PLANET },
      uSeedOffset: { value: seedOffset },
      uSunDirection: { value: sunDirection.clone().normalize() },
      uAtmosphereColor: { value: new THREE.Color('#38bdf8') },
    }),
    [seedOffset, sunDirection],
  );

  const atmoUniforms = useMemo(
    () => ({
      uSunDirection: { value: sunDirection.clone().normalize() },
      uAtmosphereColor: { value: new THREE.Color('#60a5fa') },
    }),
    [sunDirection],
  );

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Compute 3D surface positions & orientations for the Sovereign Landmarks
  const landmarkPlacements = useMemo(() => {
    const upVec = new THREE.Vector3(0, 1, 0);
    return PLANET_LANDMARKS.map((lm) => {
      const n = latLonToNormal(lm.lat, lm.lon);
      const ev = evaluateShaderMatchedElevation(n.x, n.y, n.z, R_PLANET, seedOffset);
      const safeRadius = Math.max(R_PLANET + 0.15, ev.surfaceRadius);
      const normalVec = new THREE.Vector3(n.x, n.y, n.z).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(upVec, normalVec);
      return {
        landmark: lm,
        pos: [n.x * safeRadius, n.y * safeRadius, n.z * safeRadius] as [number, number, number],
        quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
      };
    });
  }, [seedOffset]);

  const planetTrophies = useMemo(() => {
    const upVec = new THREE.Vector3(0, 1, 0);
    return ecosystem.clanRewards
      .filter((r) => r.placedLocation === 'planet')
      .map((reward, idx) => {
        const lat = 0.16 + idx * 0.06;
        const lon = 0.14 + idx * 0.08;
        const n = latLonToNormal(lat, lon);
        const ev = evaluateShaderMatchedElevation(n.x, n.y, n.z, R_PLANET, seedOffset);
        const safeRadius = Math.max(R_PLANET + 0.1, ev.surfaceRadius);
        const normalVec = new THREE.Vector3(n.x, n.y, n.z).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(upVec, normalVec);
        return {
          reward,
          pos: [n.x * safeRadius, n.y * safeRadius, n.z * safeRadius] as [number, number, number],
          quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
        };
      });
  }, [ecosystem.clanRewards, seedOffset]);

  const cocSquareTexture = useMemo(() => getCoCSquareTexture(), []);

  return (
    <group>
      {/* Core Displaced Planet Sphere with Custom GLSL ShaderMaterial */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[R_PLANET, 128, 128]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={PLANET_VERTEX_SHADER}
          fragmentShader={PLANET_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      </mesh>

      {/* Rayleigh Scattering Outer Atmosphere Halo */}
      <mesh scale={[1.055, 1.055, 1.055]}>
        <sphereGeometry args={[R_PLANET, 64, 64]} />
        <shaderMaterial
          vertexShader={ATMOSPHERE_VERTEX_SHADER}
          fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
          uniforms={atmoUniforms}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* High-Performance GPU-Instanced Forest from tree_forest.glb (82% Coverage) */}
      <InstancedForest seedOffset={seedOffset} />

      {/* Clan War Trophies Placed on Main Planet */}
      {planetTrophies.map(({ reward, pos, quat }) => (
        <group key={reward.id} position={pos} quaternion={quat}>
          <ClanWarTrophyMesh reward={reward} scale={0.95} />
        </group>
      ))}

      {/* Sovereign Landmark Citadels, CoC Diamond Squares, Main Halls & Dummy Level Totems Visible from Above Earth */}
      {landmarkPlacements.map(({ landmark, pos, quat }) => {
        const dummyInfo = computeSectorDummyLevel(landmark.id, ecosystem);
        return (
          <group
            key={landmark.id}
            position={pos}
            quaternion={quat}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLandmark(landmark);
            }}
          >
            {/* Ground 3D Square Base Model (square_base.glb) + Miniature 3D Village Models */}
            <group position={[0, 0.22, 0]}>
              <SquareBaseTerrainModel3D scale={1.15} fallbackMap={cocSquareTexture} />
            </group>

            {/* Miniature 3D Town Hall, Elixir Vat, Gold Vault & Ruined Castle on Planet Square */}
            <group position={[0.14, 0.22, -0.04]} rotation={[0, Math.PI / 4, 0]}>
              <TownHallModel3D scale={0.18} />
              {/* Mini Pink Elixir Collector */}
              <mesh position={[-0.22, 0.09, 0.02]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#ec4899" roughness={0.3} />
              </mesh>
              {/* Mini Gold Storage */}
              <mesh position={[0.02, 0.08, 0.22]}>
                <boxGeometry args={[0.14, 0.12, 0.14]} />
                <meshStandardMaterial color="#facc15" roughness={0.35} />
              </mesh>
            </group>
            {/* Mini Ruined Castle & Sunlit Trees */}
            <mesh position={[-0.12, 0.27, 0.28]} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.18, 0.12, 0.18]} />
              <meshStandardMaterial color="#64748b" roughness={0.85} />
            </mesh>
            {[
              [-0.48, -0.35],
              [0.48, -0.32],
              [-0.42, 0.42],
              [0.45, 0.38],
            ].map(([tx, tz], tIdx) => (
              <mesh key={tIdx} position={[tx, 0.29, tz]}>
                <sphereGeometry args={[0.085, 8, 8]} />
                <meshStandardMaterial color="#ecfccb" roughness={0.55} />
              </mesh>
            ))}

            {/* Ascending Sky Staircase from Diamond North Tip up to the Floating Sky Main Hall */}
            {Array.from({ length: 8 }).map((_, stepIdx) => {
              const t = (stepIdx + 0.5) / 8;
              return (
                <mesh
                  key={stepIdx}
                  position={[0, 0.22 + t * 1.28, -0.88 - t * 0.82]}
                >
                  <boxGeometry args={[0.42, 0.08, 0.14]} />
                  <meshBasicMaterial color={stepIdx % 2 === 0 ? landmark.color : '#fde047'} />
                </mesh>
              );
            })}

            {/* Floating Sky Island & User's 3D Main Hall in the Air Outside the Square Box */}
            <group position={[0, 1.52, -1.78]}>
              <mesh position={[0, -0.08, 0]}>
                <cylinderGeometry args={[0.92, 0.72, 0.14, 16]} />
                <meshStandardMaterial color="#1e293b" roughness={0.55} />
              </mesh>
              <mesh position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.68, 0.65, 8]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.85, 0.035, 8, 24]} />
                <meshBasicMaterial color={landmark.color} />
              </mesh>
              <MiniFloatingHall3D scale={1.08} accentColor={landmark.color} />
            </group>

            {/* 3D Dummy Level Totem Visible from Above Earth */}
            <PlanetDummyLevelTotem
              level={dummyInfo.level}
              stars={dummyInfo.stars}
              color={landmark.color}
            />

            {/* Luminous beacon light pillar for navigation */}
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 3.2, 6]} />
              <meshBasicMaterial color={landmark.color} transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ============================================================================
 * GPU-INSTANCED FOREST COMPONENT USING tree_forest.glb ACROSS 82% CONTINENT
 * ============================================================================ */
function InstancedForest({ seedOffset }: { seedOffset: number }) {
  const instancedPineRef = useRef<THREE.InstancedMesh>(null);
  const instancedOakRef = useRef<THREE.InstancedMesh>(null);
  const instancedPeakRef = useRef<THREE.InstancedMesh>(null);

  // Compute 540 sampled forest placements across the 82% solid Earth continent
  const forestPlacements = useMemo(() => {
    const pines: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const oaks: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const peaks: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];

    const totalSamples = 560;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const upVec = new THREE.Vector3(0, 1, 0);

    const pinePalette = [
      new THREE.Color('#1f4d1e'),
      new THREE.Color('#285e23'),
      new THREE.Color('#1a421b'),
      new THREE.Color('#336b28'),
      new THREE.Color('#22521c'),
      new THREE.Color('#39732b'),
      new THREE.Color('#2d6325'),
    ];

    const oakPalette = [
      new THREE.Color('#387a24'),
      new THREE.Color('#49942a'),
      new THREE.Color('#2f681d'),
      new THREE.Color('#58a632'),
    ];

    const peakPalette = [
      new THREE.Color('#94a3b8'),
      new THREE.Color('#cbd5e1'),
      new THREE.Color('#e2e8f0'),
      new THREE.Color('#64748b'),
    ];

    for (let i = 0; i < totalSamples; i++) {
      const y = 1 - (i / (totalSamples - 1)) * 1.84 - 0.08;
      if (Math.abs(y) > 0.88) continue;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const nx = Math.cos(theta) * r;
      const ny = y;
      const nz = Math.sin(theta) * r;

      // Keep immediate horse spawn path and starting clearing clear
      if (Math.hypot(nx - 0.0, ny - 0.13, nz - 0.99) < 0.075) continue;

      // Check distance to all landmarks so bases are never occluded
      let nearLandmark = false;
      for (const lm of PLANET_LANDMARKS) {
        const ln = latLonToNormal(lm.lat, lm.lon);
        if (Math.hypot(nx - ln.x, ny - ln.y, nz - ln.z) < 0.052) {
          nearLandmark = true;
          break;
        }
      }
      if (nearLandmark) continue;

      const ev = evaluateShaderMatchedElevation(nx, ny, nz, R_PLANET, seedOffset);
      const normalVec = new THREE.Vector3(nx, ny, nz).normalize();
      const baseQuat = new THREE.Quaternion().setFromUnitVectors(upVec, normalVec);
      const yawAngle = ((i * 37) % 360) * (Math.PI / 180);
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(normalVec, yawAngle);
      const finalQuat = baseQuat.clone().premultiply(yawQuat);

      // High alpine limestone/snow mountain crags (matching i1.jpg)
      if (ev.elevation >= 1.45) {
        const radius = ev.surfaceRadius - 0.05;
        const pos = new THREE.Vector3(nx * radius, ny * radius, nz * radius);
        const s = 1.1 + ((i * 13) % 10) * 0.12;
        const mat = new THREE.Matrix4().compose(pos, finalQuat, new THREE.Vector3(s * 1.4, s * 2.2, s * 1.4));
        peaks.push({
          matrix: mat,
          color: peakPalette[i % peakPalette.length],
        });
      }
      // Dense forest landmass (82% of solid Earth)
      else if (ev.elevation >= 0.12 && ev.elevation < 1.42) {
        const radius = ev.surfaceRadius - 0.02;
        const pos = new THREE.Vector3(nx * radius, ny * radius, nz * radius);
        const s = 0.82 + ((i * 19) % 10) * 0.06; // natural scale variation

        const mat = new THREE.Matrix4().compose(pos, finalQuat, new THREE.Vector3(s, s, s));

        if (i % 6 === 0) {
          // Deciduous round oak companion tree
          oaks.push({
            matrix: mat,
            color: oakPalette[i % oakPalette.length],
          });
        } else {
          // Main tree_forest.glb instanced pine tree
          pines.push({
            matrix: mat,
            color: pinePalette[i % pinePalette.length],
          });
        }
      }
    }

    return { pines, oaks, peaks };
  }, [seedOffset]);

  // Apply instance matrices and colors for 60 FPS single-draw-call rendering
  useEffect(() => {
    if (instancedPineRef.current) {
      forestPlacements.pines.forEach((item, i) => {
        instancedPineRef.current?.setMatrixAt(i, item.matrix);
        instancedPineRef.current?.setColorAt(i, item.color);
      });
      instancedPineRef.current.instanceMatrix.needsUpdate = true;
      if (instancedPineRef.current.instanceColor) {
        instancedPineRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [forestPlacements.pines]);

  useEffect(() => {
    if (instancedOakRef.current) {
      forestPlacements.oaks.forEach((item, i) => {
        instancedOakRef.current?.setMatrixAt(i, item.matrix);
        instancedOakRef.current?.setColorAt(i, item.color);
      });
      instancedOakRef.current.instanceMatrix.needsUpdate = true;
      if (instancedOakRef.current.instanceColor) {
        instancedOakRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [forestPlacements.oaks]);

  useEffect(() => {
    if (instancedPeakRef.current) {
      forestPlacements.peaks.forEach((item, i) => {
        instancedPeakRef.current?.setMatrixAt(i, item.matrix);
        instancedPeakRef.current?.setColorAt(i, item.color);
      });
      instancedPeakRef.current.instanceMatrix.needsUpdate = true;
      if (instancedPeakRef.current.instanceColor) {
        instancedPeakRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [forestPlacements.peaks]);

  // Procedural pine geometry
  const fallbackPineGeometry = useMemo(() => {
    const geom = new THREE.ConeGeometry(0.55, 1.6, 7);
    geom.translate(0, 0.8, 0);
    return geom;
  }, []);

  return (
    <group>
      {/* Primary Instanced Pine Forest */}
      {forestPlacements.pines.length > 0 && (
        <instancedMesh
          ref={instancedPineRef}
          args={[fallbackPineGeometry, undefined, forestPlacements.pines.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.78}
            metalness={0.06}
          />
        </instancedMesh>
      )}

      {/* Companion Deciduous Round Oaks from reference i1.jpg */}
      {forestPlacements.oaks.length > 0 && (
        <instancedMesh
          ref={instancedOakRef}
          args={[undefined, undefined, forestPlacements.oaks.length]}
          frustumCulled={false}
        >
          <dodecahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.82} metalness={0.05} />
        </instancedMesh>
      )}

      {/* Alpine Limestone Crags from reference i1.jpg */}
      {forestPlacements.peaks.length > 0 && (
        <instancedMesh
          ref={instancedPeakRef}
          args={[undefined, undefined, forestPlacements.peaks.length]}
          frustumCulled={false}
        >
          <coneGeometry args={[0.65, 1.4, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.92} metalness={0.02} />
        </instancedMesh>
      )}
    </group>
  );
}

/* ============================================================================
 * 2B. OPEN-WORLD FLAT/ROLLING GROUND TERRAIN, DIRT ROAD & HILLS (CHASE VIEW)
 *     Matches reference image_442f5876.png perspective on ground (no sphere drop-off)
 * ============================================================================ */
export function latLonToOpenWorldXZ(lat: number, lon: number): { wx: number; wz: number } {
  let dLon = lon;
  while (dLon > Math.PI) dLon -= Math.PI * 2;
  while (dLon < -Math.PI) dLon += Math.PI * 2;
  const sideOffset =
    Math.abs(dLon) > 0.008 ? Math.sign(dLon) * (Math.abs(dLon) * 84.0 + 16.5) : dLon * 85.0;
  return {
    wx: sideOffset,
    wz: -(lat - 0.13) * 96.0,
  };
}

function hashTerrain2D(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function noiseTerrain2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uz = fz * fz * (3.0 - 2.0 * fz);
  const a = hashTerrain2D(ix, iz);
  const b = hashTerrain2D(ix + 1, iz);
  const c = hashTerrain2D(ix, iz + 1);
  const d = hashTerrain2D(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbmTerrain2D(x: number, z: number): number {
  let v = 0.0;
  let amp = 0.5;
  let px = x;
  let pz = z;
  for (let i = 0; i < 4; i++) {
    v += amp * noiseTerrain2D(px, pz);
    px = px * 2.03 + 13.7;
    pz = pz * 2.03 + 7.9;
    amp *= 0.5;
  }
  return v;
}

let cachedGroundMicroTexture: THREE.CanvasTexture | null = null;
function getRealisticGroundMicroTexture(): THREE.CanvasTexture {
  if (cachedGroundMicroTexture) return cachedGroundMicroTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c8c8c4';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4200; i++) {
      const x = (i * 73) % 256;
      const y = (i * 137) % 256;
      const shade = 188 + ((i * 29) % 48);
      ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 4})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.needsUpdate = true;
  cachedGroundMicroTexture = tex;
  return tex;
}

let cachedStuccoTexture: THREE.CanvasTexture | null = null;
function getWeatheredStuccoTexture(): THREE.CanvasTexture {
  if (cachedStuccoTexture) return cachedStuccoTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e2e4e0';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3200; i++) {
      const x = (i * 53) % 256;
      const y = (i * 89) % 256;
      const v = 205 + (i % 42);
      ctx.fillStyle = `rgb(${v},${v - 2},${v - 5})`;
      ctx.fillRect(x, y, 2, 2);
    }
    // Subtle tropical rain-stain streaks near top & bottom
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(60, 65, 58, 0.24)');
    grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(0.78, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(1, 'rgba(55, 50, 42, 0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  cachedStuccoTexture = tex;
  return tex;
}

let cachedTimberTexture: THREE.CanvasTexture | null = null;
function getTimberPlankTexture(): THREE.CanvasTexture {
  if (cachedTimberTexture) return cachedTimberTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d6c6b2';
    ctx.fillRect(0, 0, 256, 256);
    // Horizontal plank seams & wood grain fibers
    for (let y = 0; y < 256; y += 24) {
      ctx.fillStyle = 'rgba(55, 35, 18, 0.42)';
      ctx.fillRect(0, y, 256, 2);
      ctx.fillStyle = 'rgba(255, 245, 230, 0.16)';
      ctx.fillRect(0, y + 2, 256, 2);
    }
    for (let i = 0; i < 1600; i++) {
      const x = (i * 67) % 256;
      const y = (i * 43) % 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(90, 62, 38, 0.14)' : 'rgba(240, 228, 210, 0.12)';
      ctx.fillRect(x, y, 14, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  cachedTimberTexture = tex;
  return tex;
}

export function evaluateOpenWorldTerrain(wx: number, wz: number): {
  height: number;
  roadMask: number;
  riverMask: number;
  color: [number, number, number];
} {
  // 1. Wide Free Fire Bermuda Road Network:
  //    - Central N-S Spine Dirt Road (Bimasakti Strip corridor) flanked by wide olive-green grassy meadows!
  //    - Distant Northern E-W Crossroad (wz ≈ -54) & Southern E-W Crossroad (wz ≈ +36)
  //    - Wide Outer Bermuda Ring Road loop (radius ≈ 74m)
  const mainRoadCenterX = Math.sin(wz * 0.015) * 1.85;
  const distSpineRoad = Math.abs(wx - mainRoadCenterX);

  const northCrossZ = -54.0 + Math.sin(wx * 0.018) * 2.2;
  const southCrossZ = 36.0 + Math.cos(wx * 0.016) * 2.2;
  const distNorthCross = Math.abs(wz - northCrossZ);
  const distSouthCross = Math.abs(wz - southCrossZ);

  const ringRadius = Math.hypot(wx * 0.82, wz * 0.74);
  const distRingRoad = Math.abs(ringRadius - 74.0);

  const minRoadDist = Math.min(distSpineRoad, distNorthCross, distSouthCross, distRingRoad);

  // Keep the 8 Sovereign Square bases & wide roadside Bermuda compounds on level grassy clearings
  let minSquareDist = 999;
  for (const lm of PLANET_LANDMARKS) {
    const { wx: lx, wz: lz } = latLonToOpenWorldXZ(lm.lat, lm.lon);
    const dSq = Math.hypot(wx - lx, wz - lz);
    if (dSq < minSquareDist) minSquareDist = dSq;
  }

  // Flatten wide grassy roadside compound shoulders (wx ≈ ±11.5m) without turning them into dirt road!
  const distToRoadsidePads = Math.abs(Math.abs(wx - mainRoadCenterX) - 11.5);
  const padFlatMask =
    Math.abs(wz) < 62.0 ? 1.0 - THREE.MathUtils.smoothstep(distToRoadsidePads, 4.5, 9.5) : 0.0;

  // 2. Winding Bermuda River Channel (East-West at wz ≈ -39, spanned by 3D bridges) + Foreground Roadside Forest Duckweed Pond (at wx ≈ 7.6, wz ≈ -12.2)
  const riverCenterZ = -39.0 + Math.sin(wx * 0.024) * 4.4;
  const distRiver = Math.abs(wz - riverCenterZ);
  const onBridgeCrossing = distSpineRoad < 4.5 || Math.abs(Math.abs(wx) - 56.0) < 4.5;
  const channelRiverMask = onBridgeCrossing
    ? 0.0
    : 1.0 - THREE.MathUtils.smoothstep(distRiver, 3.0, 6.4);

  const distPond = Math.hypot((wx - 7.6) * 0.88, (wz + 12.2) * 1.02);
  const pondMask = 1.0 - THREE.MathUtils.smoothstep(distPond, 3.1, 5.1);
  const riverMask = Math.max(channelRiverMask, pondMask);

  // 3. Defined Central Dirt Road Mask (half-width ~2.6m, blending into lush olive-green grass at 4.6m)
  const roadMask = (1.0 - THREE.MathUtils.smoothstep(minRoadDist, 2.2, 4.6)) * (1.0 - pondMask);
  // Gentle grassy bank on the left & right, rising smoothly into wide rolling Bermuda hills & Peak plateau
  const leftBankMound =
    wx < mainRoadCenterX - 3.2
      ? THREE.MathUtils.smoothstep(mainRoadCenterX - wx, 3.2, 10.5) *
        (1.0 - THREE.MathUtils.smoothstep(mainRoadCenterX - wx, 12.0, 24.0)) *
        0.85
      : 0.0;
  const bankRise = THREE.MathUtils.smoothstep(distSpineRoad, 14.5, 34.0);
  const squareFlatMask = Math.max(
    1.0 - THREE.MathUtils.smoothstep(minSquareDist, 5.6, 10.5),
    padFlatMask * 0.9,
  );

  // 4. Multi-Octave Realistic Bermuda Topography (Wide Bimasakti Valley + Peak Terraced Plateau + Distant Ridge Mountains)
  const fbmDetail = fbmTerrain2D(wx * 0.045, wz * 0.045);
  const hillWave1 = Math.sin(wx * 0.032 + 0.5) * Math.cos(wz * 0.028 - 0.3) * 3.4;
  const hillWave2 = (fbmDetail - 0.5) * 3.6;

  // Iconic Bermuda "Peak" high plateau on the NE & NW flanks
  const peakPlateau =
    THREE.MathUtils.smoothstep(Math.hypot(wx - 44.0, wz + 18.0), 42.0, 12.0) * 8.2 +
    THREE.MathUtils.smoothstep(Math.hypot(wx + 44.0, wz + 14.0), 38.0, 12.0) * 6.8;
  const distantMountains =
    THREE.MathUtils.smoothstep(Math.abs(wx), 34.0, 115.0) *
    (7.4 + fbmTerrain2D(wx * 0.025, wz * 0.025) * 6.2);

  const rawHillHeight = Math.max(
    0,
    (hillWave1 + hillWave2 + 1.4) * 0.62 + peakPlateau + distantMountains,
  );
  let height =
    rawHillHeight * bankRise * (1.0 - squareFlatMask * 0.92) +
    leftBankMound * (1.0 - roadMask);

  // Carve river channel bed, foreground duckweed pond basin, or slight bridge arch crown
  if (channelRiverMask > 0.01) {
    height = THREE.MathUtils.lerp(height, -0.78, channelRiverMask);
  } else if (pondMask > 0.01) {
    height = THREE.MathUtils.lerp(height, -0.58, pondMask);
  } else if (onBridgeCrossing && distRiver < 5.8) {
    height = Math.max(height, (1.0 - distRiver / 5.8) * 0.36);
  }

  // Pass roadMask, riverMask, and minRoadDist encoded in vertex color for the custom GLSL shader!
  const normRoadDist = THREE.MathUtils.clamp(minRoadDist / 12.0, 0, 1);
  return {
    height,
    roadMask,
    riverMask,
    color: [
      THREE.MathUtils.clamp(roadMask, 0, 1),
      THREE.MathUtils.clamp(riverMask, 0, 1),
      normRoadDist,
    ],
  };
}

/**
 * Free Fire Bermuda Structural Compound Builder (Multi-part 3D buildings, watchtowers, warehouses & fences)
 * Positioned along the wide Bimasakti Valley grassy shoulders so the central vista is wide and realistic.
 */
interface BermudaBuildingSpec {
  id: string;
  kind: 'two_story_cyan' | 'wood_cabin' | 'warehouse' | 'watchtower' | 'bridge';
  wx: number;
  wz: number;
  yaw: number;
  scale?: number;
}

const BERMUDA_STRUCTURES: BermudaBuildingSpec[] = [
  // Wide Foreground Bimasakti Strip Roadside Village sitting on lush olive-green grassy shoulders
  { id: 'bima_cabin_l1', kind: 'wood_cabin', wx: -10.8, wz: -9.5, yaw: Math.PI / 2, scale: 1.08 },
  { id: 'bima_cyan_r1', kind: 'two_story_cyan', wx: 13.8, wz: -20.5, yaw: -Math.PI / 2, scale: 1.08 },
  { id: 'bima_wh_l2', kind: 'warehouse', wx: -11.8, wz: -23.5, yaw: Math.PI / 2, scale: 1.05 },
  { id: 'bima_cabin_r2', kind: 'wood_cabin', wx: 12.6, wz: -28.5, yaw: -Math.PI / 2, scale: 1.0 },
  { id: 'bima_tower_l', kind: 'watchtower', wx: -8.2, wz: -15.5, yaw: 0.28, scale: 1.12 },

  // Wide River Bridge Crossings (spanning the Bermuda River at wz ≈ -39.0)
  { id: 'bridge_center', kind: 'bridge', wx: -0.8, wz: -39.0, yaw: 0, scale: 1.12 },
  { id: 'bridge_west', kind: 'bridge', wx: -56.0, wz: -43.0, yaw: 0, scale: 1.05 },
  { id: 'bridge_east', kind: 'bridge', wx: 56.0, wz: -35.0, yaw: 0, scale: 1.05 },

  // Northern Crossroad & Pochinok / Clock Tower Compounds
  { id: 'north_cyan_l', kind: 'two_story_cyan', wx: -11.8, wz: -50.0, yaw: Math.PI / 2, scale: 1.1 },
  { id: 'north_wh_r', kind: 'warehouse', wx: 12.5, wz: -52.0, yaw: -Math.PI / 2, scale: 1.1 },
  { id: 'north_tower_r', kind: 'watchtower', wx: 23.0, wz: -46.0, yaw: -0.4, scale: 1.2 },

  // Wide East & West Cross-Island Highway Compounds (Peak Ridge & Hangar Valley)
  { id: 'west_wh_1', kind: 'warehouse', wx: -30.0, wz: -17.5, yaw: 0, scale: 1.1 },
  { id: 'west_cyan_1', kind: 'two_story_cyan', wx: -34.0, wz: 14.0, yaw: 0, scale: 1.08 },
  { id: 'west_tower_1', kind: 'watchtower', wx: -42.0, wz: -7.0, yaw: 0.5, scale: 1.25 },
  { id: 'east_cabin_1', kind: 'wood_cabin', wx: 29.0, wz: -16.5, yaw: Math.PI, scale: 1.1 },
  { id: 'east_cyan_1', kind: 'two_story_cyan', wx: 34.0, wz: 15.0, yaw: Math.PI, scale: 1.12 },
  { id: 'east_tower_1', kind: 'watchtower', wx: 40.0, wz: -11.0, yaw: -0.3, scale: 1.28 },

  // Southern Approach Compounds
  { id: 'south_cabin_l', kind: 'wood_cabin', wx: -11.2, wz: 11.0, yaw: Math.PI / 2, scale: 1.05 },
  { id: 'south_wh_r', kind: 'warehouse', wx: 11.8, wz: 12.5, yaw: -Math.PI / 2, scale: 1.05 },
  { id: 'south_cyan_l', kind: 'two_story_cyan', wx: -12.0, wz: 28.0, yaw: Math.PI / 2, scale: 1.08 },
  { id: 'south_tower_c', kind: 'watchtower', wx: 21.5, wz: 27.0, yaw: 0.4, scale: 1.15 },
];

function FFBermudaStructureMesh({ spec }: { spec: BermudaBuildingSpec }) {
  const stuccoTex = useMemo(() => getWeatheredStuccoTexture(), []);
  const timberTex = useMemo(() => getTimberPlankTexture(), []);
  const ev = evaluateOpenWorldTerrain(spec.wx, spec.wz);
  const baseHeight = spec.kind === 'bridge' ? 0.05 : ev.height;
  const s = spec.scale ?? 1;

  if (spec.kind === 'two_story_cyan') {
    // Iconic Free Fire Bermuda 2-Story Weathered Cyan Stucco & Terracotta Upper House + Picket Fence
    return (
      <group position={[spec.wx, baseHeight, spec.wz]} rotation={[0, spec.yaw, 0]} scale={s}>
        {/* Concrete Foundation Slab & Steps */}
        <mesh position={[0, 0.09, 0]} receiveShadow>
          <boxGeometry args={[4.8, 0.18, 3.8]} />
          <meshStandardMaterial map={stuccoTex} color="#64748b" roughness={0.9} />
        </mesh>
        {/* 1st Floor Weathered Pastel Cyan Stucco Body */}
        <mesh position={[0, 1.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.45, 1.84, 3.45]} />
          <meshStandardMaterial
            map={stuccoTex}
            bumpMap={stuccoTex}
            bumpScale={0.04}
            color="#6baab2"
            roughness={0.78}
          />
        </mesh>
        {/* Mid-Floor Concrete Ledge Overhang & Coral Trim Band */}
        <mesh position={[0, 2.04, 0]}>
          <boxGeometry args={[4.64, 0.24, 3.64]} />
          <meshStandardMaterial map={stuccoTex} color="#cbd5e1" roughness={0.72} />
        </mesh>
        <mesh position={[0, 2.22, 0]}>
          <boxGeometry args={[4.66, 0.14, 3.66]} />
          <meshStandardMaterial map={stuccoTex} color="#c85a48" roughness={0.68} />
        </mesh>
        {/* 2nd Floor Weathered Terracotta-Red Stucco Box (Recessed Roof Terrace) */}
        <mesh position={[-0.35, 3.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.55, 1.58, 3.15]} />
          <meshStandardMaterial
            map={stuccoTex}
            bumpMap={stuccoTex}
            bumpScale={0.04}
            color="#c65d4b"
            roughness={0.74}
          />
        </mesh>
        {/* Roof Parapet Cap */}
        <mesh position={[-0.35, 3.91, 0]}>
          <boxGeometry args={[3.68, 0.1, 3.28]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.7} />
        </mesh>
        {/* Recessed Window Frames with Reflective Glass Panes & Doorway */}
        {[0.6, -1.1].map((wxPos) => (
          <group key={wxPos} position={[wxPos, 1.15, 1.73]}>
            <mesh>
              <boxGeometry args={[0.72, 0.72, 0.06]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.6, 0.6, 0.04]} />
              <meshStandardMaterial color="#1e293b" roughness={0.18} metalness={0.65} />
            </mesh>
          </group>
        ))}
        {/* 2nd Floor Window */}
        <mesh position={[-0.4, 3.05, 1.58]}>
          <boxGeometry args={[0.68, 0.62, 0.05]} />
          <meshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[1.45, 0.82, 1.73]}>
          <boxGeometry args={[0.66, 1.38, 0.06]} />
          <meshStandardMaterial color="#0f172a" roughness={0.55} />
        </mesh>
        {/* Side Picket Fence Segment */}
        <group position={[0, 0.45, -2.45]}>
          <mesh>
            <boxGeometry args={[4.0, 0.78, 0.08]} />
            <meshStandardMaterial map={timberTex} color="#cbd5e1" roughness={0.82} />
          </mesh>
        </group>
      </group>
    );
  }

  if (spec.kind === 'wood_cabin') {
    // Iconic Free Fire Bermuda Timber Plank Cabin with Pitched Gable Roof, Overhang & Brick Chimney
    return (
      <group position={[spec.wx, baseHeight, spec.wz]} rotation={[0, spec.yaw, 0]} scale={s}>
        {/* Stone Foundation Plinth */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[4.05, 0.16, 3.45]} />
          <meshStandardMaterial map={stuccoTex} color="#57534e" roughness={0.92} />
        </mesh>
        {/* Timber Cabin Main Body with Wood Plank Grain & Bump */}
        <mesh position={[0, 1.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.85, 1.92, 3.25]} />
          <meshStandardMaterial
            map={timberTex}
            bumpMap={timberTex}
            bumpScale={0.05}
            color="#a47b54"
            roughness={0.84}
          />
        </mesh>
        {/* Corner Structural Log Pillars */}
        {[-1.88, 1.88].map((cx) =>
          [-1.58, 1.58].map((cz) => (
            <mesh key={`${cx}_${cz}`} position={[cx, 1.04, cz]}>
              <boxGeometry args={[0.2, 1.96, 0.2]} />
              <meshStandardMaterial map={timberTex} color="#5c3e23" roughness={0.88} />
            </mesh>
          )),
        )}
        {/* Pitched Wooden Shingle Roof with Overhang */}
        <mesh position={[0, 2.42, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.05, 1.1, 4]} />
          <meshStandardMaterial
            map={timberTex}
            bumpMap={timberTex}
            bumpScale={0.04}
            color="#785332"
            roughness={0.82}
          />
        </mesh>
        {/* Red Brick Chimney on Roof Corner */}
        <mesh position={[-1.1, 2.6, 0.8]}>
          <boxGeometry args={[0.5, 1.15, 0.5]} />
          <meshStandardMaterial map={stuccoTex} color="#8f3d2e" roughness={0.88} />
        </mesh>
        {/* Doorway & Reflective Glass Window */}
        <mesh position={[0.4, 0.82, 1.64]}>
          <boxGeometry args={[0.7, 1.42, 0.06]} />
          <meshStandardMaterial map={timberTex} color="#3b2716" roughness={0.75} />
        </mesh>
        <mesh position={[-0.85, 1.16, 1.64]}>
          <boxGeometry args={[0.68, 0.64, 0.05]} />
          <meshStandardMaterial color="#1e293b" roughness={0.22} metalness={0.55} />
        </mesh>
      </group>
    );
  }

  if (spec.kind === 'warehouse') {
    // Corrugated Sage-Roof Hangar / Barracks Warehouse with Weathered Stucco & Supply Crates
    return (
      <group position={[spec.wx, baseHeight, spec.wz]} rotation={[0, spec.yaw, 0]} scale={s}>
        {/* Concrete Pad */}
        <mesh position={[0, 0.07, 0]} receiveShadow>
          <boxGeometry args={[5.7, 0.14, 3.9]} />
          <meshStandardMaterial map={stuccoTex} color="#64748b" roughness={0.9} />
        </mesh>
        {/* Weathered Stucco Walls */}
        <mesh position={[0, 1.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.45, 2.12, 3.65]} />
          <meshStandardMaterial
            map={stuccoTex}
            bumpMap={stuccoTex}
            bumpScale={0.045}
            color="#cbc7b7"
            roughness={0.86}
          />
        </mesh>
        {/* Corrugated Sage-Green Pitched Roof */}
        <mesh position={[0, 2.56, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.9, 1.0, 4]} />
          <meshStandardMaterial
            map={timberTex}
            color="#6b8365"
            roughness={0.68}
            metalness={0.18}
          />
        </mesh>
        {/* Row of Dark Industrial Windows */}
        {[-1.6, 0, 1.6].map((wxOff) => (
          <mesh key={wxOff} position={[wxOff, 1.26, 1.84]}>
            <boxGeometry args={[0.74, 0.6, 0.05]} />
            <meshStandardMaterial color="#1e293b" roughness={0.22} metalness={0.55} />
          </mesh>
        ))}
        {/* Stacked Wooden Tactical Cover Crates & Fuel Drum Outside */}
        <mesh position={[3.15, 0.42, 0.8]}>
          <boxGeometry args={[0.84, 0.84, 0.84]} />
          <meshStandardMaterial map={timberTex} color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[3.25, 0.36, -0.2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.72, 12]} />
          <meshStandardMaterial color="#0284c7" roughness={0.45} metalness={0.32} />
        </mesh>
      </group>
    );
  }

  if (spec.kind === 'watchtower') {
    // Authentic Weathered Timber & Steel Fire Lookout Watchtower with Switchback Stairs & Survival Camp Props (matching video 00:48, 02:16, 02:45-03:23)
    return (
      <group position={[spec.wx, baseHeight, spec.wz]} rotation={[0, spec.yaw, 0]} scale={s}>
        {/* 4 Heavy Weathered Timber Corner Legs */}
        {[-1.15, 1.15].map((lx) =>
          [-1.15, 1.15].map((lz) => (
            <mesh
              key={`${lx}_${lz}`}
              position={[lx * 0.78, 4.3, lz * 0.78]}
              rotation={[lz * 0.045, 0, -lx * 0.045]}
            >
              <boxGeometry args={[0.2, 8.6, 0.2]} />
              <meshStandardMaterial map={timberTex} color="#5c422c" roughness={0.88} />
            </mesh>
          )),
        )}
        {/* Horizontal Structural Timber Girt Frames & X-Braces */}
        {[1.9, 3.8, 5.7, 7.6].map((hy, idx) => {
          const w = 2.15 - idx * 0.16;
          return (
            <group key={hy} position={[0, hy, 0]}>
              <mesh>
                <boxGeometry args={[w, 0.14, w]} />
                <meshStandardMaterial map={timberTex} color="#6b4e35" roughness={0.86} />
              </mesh>
              {/* Diagonal Cross-Brace Timber */}
              <mesh position={[0, -0.88, w * 0.48]} rotation={[0, 0, idx % 2 === 0 ? 0.68 : -0.68]}>
                <boxGeometry args={[w * 1.18, 0.09, 0.09]} />
                <meshStandardMaterial map={timberTex} color="#4f3824" roughness={0.9} />
              </mesh>
            </group>
          );
        })}
        {/* Zig-Zagging Switchback Wooden Staircase Flights & Landings Inside Tower */}
        {[0, 1, 2, 3].map((flightIdx) => {
          const yStart = 0.25 + flightIdx * 1.9;
          const dir = flightIdx % 2 === 0 ? 1 : -1;
          return (
            <group key={flightIdx} position={[dir * 0.25, yStart + 0.95, 0]}>
              {/* Inclined Stair Stringer Ramp */}
              <mesh rotation={[0.66 * dir, 0, 0]}>
                <boxGeometry args={[0.64, 0.1, 2.35]} />
                <meshStandardMaterial map={timberTex} color="#7c5a3a" roughness={0.85} />
              </mesh>
              {/* Wooden Handrail */}
              <mesh position={[0.3, 0.45, 0]} rotation={[0.66 * dir, 0, 0]}>
                <boxGeometry args={[0.06, 0.08, 2.35]} />
                <meshStandardMaterial map={timberTex} color="#8c6744" roughness={0.82} />
              </mesh>
              {/* Switchback Landing Deck */}
              <mesh position={[-dir * 0.25, 0.92, dir * 0.72]}>
                <boxGeometry args={[1.55, 0.12, 0.72]} />
                <meshStandardMaterial map={timberTex} color="#6e4f33" roughness={0.86} />
              </mesh>
            </group>
          );
        })}
        {/* Upper Wooden Catwalk Deck & Perimeter Guardrails */}
        <mesh position={[0, 8.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.95, 0.2, 2.95]} />
          <meshStandardMaterial map={timberTex} color="#6e5034" roughness={0.86} />
        </mesh>
        {[-1.38, 1.38].map((rx) => (
          <mesh key={`rail_x_${rx}`} position={[rx, 9.08, 0]}>
            <boxGeometry args={[0.08, 0.9, 2.9]} />
            <meshStandardMaterial map={timberTex} color="#7c5a3c" roughness={0.84} />
          </mesh>
        ))}
        {[-1.38, 1.38].map((rz) => (
          <mesh key={`rail_z_${rz}`} position={[0, 9.08, rz]}>
            <boxGeometry args={[2.9, 0.9, 0.08]} />
            <meshStandardMaterial map={timberTex} color="#7c5a3c" roughness={0.84} />
          </mesh>
        ))}
        {/* Fire Lookout Cabin Box with Wrap-Around Observation Windows */}
        <mesh position={[0, 9.58, 0]} castShadow>
          <boxGeometry args={[2.1, 1.85, 2.1]} />
          <meshStandardMaterial map={timberTex} color="#8a6644" roughness={0.82} />
        </mesh>
        <mesh position={[0, 9.75, 0]}>
          <boxGeometry args={[2.16, 0.72, 2.16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.18} metalness={0.68} />
        </mesh>
        {/* Overhanging Pitched Wooden Shingle Hip Roof */}
        <mesh position={[0, 10.92, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2.15, 1.05, 4]} />
          <meshStandardMaterial map={timberTex} color="#4a3728" roughness={0.85} />
        </mesh>
        {/* Survival Camp Clearing Props at Base: Tarp-Covered Supply Pallet & Weathered Wooden Picnic Table */}
        <group position={[2.25, 0, 1.1]} rotation={[0, -0.35, 0]}>
          {/* Wooden Pallet Base */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[1.35, 0.14, 1.05]} />
            <meshStandardMaterial map={timberTex} color="#6b4c30" roughness={0.88} />
          </mesh>
          {/* Blue/Teal Weatherproof Tarp Covering Stacked Supplies (matching video 03:13) */}
          <mesh position={[0, 0.46, 0]}>
            <boxGeometry args={[1.26, 0.64, 0.96]} />
            <meshStandardMaterial color="#1d6fa5" roughness={0.58} />
          </mesh>
        </group>
        {/* Weathered Wooden Picnic Table by the Watchtower Clearing */}
        <group position={[-2.15, 0, 1.45]} rotation={[0, 0.42, 0]}>
          <mesh position={[0, 0.56, 0]}>
            <boxGeometry args={[1.45, 0.08, 0.72]} />
            <meshStandardMaterial map={timberTex} color="#755538" roughness={0.86} />
          </mesh>
          {[-0.52, 0.52].map((bz) => (
            <mesh key={bz} position={[0, 0.34, bz]}>
              <boxGeometry args={[1.42, 0.06, 0.24]} />
              <meshStandardMaterial map={timberTex} color="#6b4d32" roughness={0.88} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  // Wide Steel & Timber River Bridge
  return (
    <group position={[spec.wx, baseHeight, spec.wz]} rotation={[0, spec.yaw, 0]} scale={s}>
      {/* Timber & Concrete Bridge Deck */}
      <mesh position={[0, 0.34, 0]} receiveShadow>
        <boxGeometry args={[6.8, 0.3, 12.0]} />
        <meshStandardMaterial map={timberTex} color="#785c3c" roughness={0.82} />
      </mesh>
      {/* Left & Right Steel Truss Side Guardrails */}
      {[-3.15, 3.15].map((bx) => (
        <group key={bx} position={[bx, 1.2, 0]}>
          <mesh>
            <boxGeometry args={[0.26, 1.45, 12.0]} />
            <meshStandardMaterial color="#991b1b" roughness={0.55} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.88, 0]}>
            <boxGeometry args={[0.32, 0.18, 12.2]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.48} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const DUCKWEED_WATER_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSkyReflectColor;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  float hashW(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noiseW(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hashW(i), hashW(i + vec2(1.0, 0.0)), f.x),
      mix(hashW(i + vec2(0.0, 1.0)), hashW(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbmW(vec2 p) {
    float v = 0.0;
    v += 0.50 * noiseW(p); p *= 2.03;
    v += 0.25 * noiseW(p); p *= 2.01;
    v += 0.125 * noiseW(p); p *= 2.02;
    v += 0.0625 * noiseW(p);
    return v;
  }

  void main() {
    // Animated dual-wave normal perturbation for mirror-like forest water ripples
    float w1 = sin(vWorldPos.x * 1.45 + vWorldPos.z * 1.05 + uTime * 2.1);
    float w2 = cos(vWorldPos.x * 2.2 - vWorldPos.z * 1.75 - uTime * 1.6);
    float w3 = sin(vWorldPos.x * 4.5 + vWorldPos.z * 4.1 + uTime * 2.8) * 0.45;
    vec3 normal = normalize(vec3((w1 + w3) * 0.11, 1.0, (w2 - w3) * 0.11));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.8);

    // Center-to-bank depth gradient
    float bankDist = abs(vUv.y - 0.5) * 2.0;
    vec3 baseWater = mix(uDeepColor, uShallowColor, smoothstep(0.0, 0.85, bankDist));

    // Mirror-like dark forest canopy & sunlit sky reflection (matching video 00:24 & 02:18)
    float canopyMirror = fbmW(vWorldPos.xz * 0.36 + normal.xz * 0.85);
    vec3 canopyReflectCol = mix(vec3(0.09, 0.20, 0.08), vec3(0.24, 0.42, 0.15), canopyMirror);
    vec3 mirrorTarget = mix(canopyReflectCol, uSkyReflectColor, smoothstep(0.32, 0.74, canopyMirror + fresnel * 0.28));
    vec3 reflCol = mix(baseWater, mirrorTarget, clamp(fresnel * 0.82 + 0.32, 0.0, 1.0));

    // Solar specular glint on open water ripples
    vec3 halfVec = normalize(normalize(uSunDir) + viewDir);
    float spec = pow(max(dot(normal, halfVec), 0.0), 64.0);
    reflCol += vec3(1.0, 0.98, 0.86) * spec * 0.85;

    // Organic floating mats of bright chartreuse-green Duckweed & Surface Algae (matching video 00:22-00:31 & 01:45-02:41)
    vec2 driftUv = vWorldPos.xz * 0.42 + vec2(uTime * 0.015, -uTime * 0.01);
    float algaeFbm = fbmW(driftUv);
    float algaeFine = noiseW(vWorldPos.xz * 3.8);
    float bankAlgaeBias = smoothstep(0.08, 0.78, bankDist) * 0.34;
    float duckweedMask = smoothstep(0.45, 0.60, algaeFbm + bankAlgaeBias + (algaeFine - 0.5) * 0.16);

    vec3 duckweedBright = vec3(0.52, 0.74, 0.12); // Sunlit chartreuse duckweed (#85bd1f)
    vec3 duckweedDeep = vec3(0.30, 0.50, 0.08);   // Shaded wet moss-algae (#4d8014)
    vec3 duckweedCol = mix(duckweedDeep, duckweedBright, smoothstep(0.25, 0.8, algaeFine));
    // Subtle stippled duckweed grain
    duckweedCol *= 0.88 + 0.24 * hashW(floor(vWorldPos.xz * 24.0));

    reflCol = mix(reflCol, duckweedCol, duckweedMask * 0.94);

    float alpha = 1.0 - smoothstep(0.86, 1.0, bankDist);
    gl_FragColor = vec4(reflCol, alpha * 0.95);
  }
`;

function WeatheredWoodenFishingPier({
  position,
  rotationY = 0,
  scale = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const timberTex = useMemo(() => getTimberPlankTexture(), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Support Pilings Driven into Muddy Riverbed */}
      {[-0.82, 0.82].map((px) =>
        [-1.6, -0.5, 0.6, 1.7].map((pz) => (
          <mesh key={`${px}_${pz}`} position={[px, 0.12, pz]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 1.35, 7]} />
            <meshStandardMaterial map={timberTex} color="#3d2c1e" roughness={0.92} />
          </mesh>
        )),
      )}
      {/* Longitudinal Stringer Beams */}
      {[-0.72, 0.72].map((bx) => (
        <mesh key={bx} position={[bx, 0.58, 0.05]}>
          <boxGeometry args={[0.12, 0.14, 3.8]} />
          <meshStandardMaterial map={timberTex} color="#523a26" roughness={0.88} />
        </mesh>
      ))}
      {/* Weathered Individual Cross-Planks with Slight Gaps (matching video 02:18-02:38) */}
      {Array.from({ length: 14 }).map((_, idx) => {
        const pz = -1.7 + idx * 0.27;
        const jitter = ((idx * 37) % 9) * 0.008;
        return (
          <mesh key={idx} position={[jitter, 0.68, pz]} receiveShadow castShadow>
            <boxGeometry args={[1.88, 0.06, 0.21]} />
            <meshStandardMaterial
              map={timberTex}
              color={idx % 3 === 0 ? '#6e5239' : idx % 2 === 0 ? '#7c5d41' : '#5e4530'}
              roughness={0.88}
            />
          </mesh>
        );
      })}
      {/* Left & Right Rustic Wooden Pier Handrails */}
      {[-0.86, 0.86].map((rx) => (
        <group key={rx} position={[rx, 1.08, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.07, 0.07, 3.6]} />
            <meshStandardMaterial map={timberTex} color="#6b4f35" roughness={0.86} />
          </mesh>
          {[-1.55, 0, 1.55].map((pz) => (
            <mesh key={pz} position={[0, -0.12, pz]}>
              <boxGeometry args={[0.08, 0.62, 0.08]} />
              <meshStandardMaterial map={timberTex} color="#59402a" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Weathered Wooden Angler Chair on the End of the Pier (matching video 02:22) */}
      <group position={[-0.22, 0.71, 1.15]} rotation={[0, 0.28, 0]}>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.48, 0.05, 0.46]} />
          <meshStandardMaterial map={timberTex} color="#7a583b" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.54, -0.2]} rotation={[-0.12, 0, 0]}>
          <boxGeometry args={[0.48, 0.56, 0.05]} />
          <meshStandardMaterial map={timberTex} color="#6e4e32" roughness={0.86} />
        </mesh>
      </group>
      {/* Angled Fishing Rod Leaned Over the Water */}
      <mesh position={[0.35, 1.12, 1.65]} rotation={[0.92, 0.15, 0]}>
        <cylinderGeometry args={[0.012, 0.028, 2.2, 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.5} />
      </mesh>
    </group>
  );
}

function RealisticRiverWaterSurface() {
  const waterMatRef = useRef<THREE.ShaderMaterial>(null);
  const pondMatRef = useRef<THREE.ShaderMaterial>(null);
  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.42, 0.36, -0.83).normalize() },
      uDeepColor: { value: new THREE.Color('#0c2824') },
      uShallowColor: { value: new THREE.Color('#1c4d38') },
      uSkyReflectColor: { value: new THREE.Color('#cfe4ee') },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (waterMatRef.current) {
      waterMatRef.current.uniforms.uTime.value = t;
    }
    if (pondMatRef.current) {
      pondMatRef.current.uniforms.uTime.value = t;
    }
  });

  // Floating 3D Water Lily Pads & White/Yellow Blossoms along the Pond & Riverbanks
  const lilyPads = useMemo(
    () => [
      // Roadside Forest Duckweed Pond Lily Pads (visible right beside starting trail!)
      { x: 6.2, y: -0.02, z: -10.8, r: 0.42, flower: '#fef08a' },
      { x: 7.1, y: -0.02, z: -11.6, r: 0.36, flower: '#ffffff' },
      { x: 5.5, y: -0.02, z: -12.4, r: 0.46, flower: null },
      { x: 8.4, y: -0.02, z: -13.1, r: 0.38, flower: '#fef08a' },
      { x: 6.8, y: -0.02, z: -14.2, r: 0.44, flower: '#ffffff' },
      // Main River Dock Lily Pads
      { x: 3.6, y: -0.21, z: -34.2, r: 0.48, flower: '#ffffff' },
      { x: 4.5, y: -0.21, z: -34.9, r: 0.4, flower: '#fef08a' },
      { x: 6.2, y: -0.21, z: -35.1, r: 0.44, flower: null },
      { x: -4.2, y: -0.21, z: -35.4, r: 0.46, flower: '#ffffff' },
      { x: -5.4, y: -0.21, z: -34.6, r: 0.38, flower: '#fef08a' },
    ],
    [],
  );

  return (
    <group>
      {/* 1. Main Meandering Forest River with Chartreuse Duckweed/Algae Mats & Mirror Canopy Reflections */}
      <mesh position={[0, -0.24, -39.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[460, 18, 96, 12]} />
        <shaderMaterial
          ref={waterMatRef}
          transparent
          uniforms={waterUniforms}
          vertexShader={`
            uniform float uTime;
            varying vec3 vWorldPos;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 pos = position;
              float curveOffset = sin(pos.x * 0.024) * 4.4;
              pos.y += curveOffset;
              float ripple = sin(pos.x * 0.45 + uTime * 2.1) * 0.03 + cos(pos.y * 0.8 - uTime * 1.7) * 0.025;
              pos.z += ripple;
              vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
              vWorldPos = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={DUCKWEED_WATER_FRAGMENT_SHADER}
        />
      </mesh>

      {/* 2. Foreground Roadside Forest Duckweed & Algae Pond (right alongside the starting trail at wx=7.2, wz=-12.2, matching video 00:22 & 02:18) */}
      <mesh position={[7.4, -0.05, -12.2]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[9.2, 7.6, 24, 20]} />
        <shaderMaterial
          ref={pondMatRef}
          transparent
          uniforms={waterUniforms}
          vertexShader={`
            uniform float uTime;
            varying vec3 vWorldPos;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vec3 pos = position;
              vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
              vWorldPos = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={DUCKWEED_WATER_FRAGMENT_SHADER}
        />
      </mesh>

      {/* 3. Weathered Wooden Fishing Pier at the Foreground Duckweed Pond & Main River */}
      <WeatheredWoodenFishingPier position={[4.6, -0.42, -12.0]} rotationY={Math.PI * 0.46} scale={0.92} />
      <WeatheredWoodenFishingPier position={[4.8, -0.58, -33.2]} rotationY={Math.PI} scale={1.08} />

      {/* 4. Floating 3D Lily Pads & Water-Lily Flowers */}
      {lilyPads.map((lp, idx) => (
        <group key={idx} position={[lp.x, lp.y, lp.z]}>
          <mesh rotation={[-Math.PI / 2, 0, idx * 1.1]}>
            <circleGeometry args={[lp.r, 12, 0, Math.PI * 1.85]} />
            <meshStandardMaterial color="#4b8319" roughness={0.65} side={THREE.DoubleSide} />
          </mesh>
          {lp.flower && (
            <mesh position={[0, 0.04, 0]}>
              <dodecahedronGeometry args={[0.09, 0]} />
              <meshStandardMaterial color={lp.flower} roughness={0.4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

let cachedBarkTexture: THREE.CanvasTexture | null = null;
function getRealisticBarkTexture(): THREE.CanvasTexture {
  if (cachedBarkTexture) return cachedBarkTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#473321';
    ctx.fillRect(0, 0, 256, 256);
    // Deep vertical bark furrows & ridges
    for (let x = 0; x < 256; x += 4) {
      const dark = 36 + ((x * 17) % 34);
      ctx.fillStyle = `rgb(${dark + 18}, ${dark + 6}, ${dark - 4})`;
      ctx.fillRect(x, 0, 2, 256);
      ctx.fillStyle = `rgb(${dark - 12}, ${dark - 16}, ${dark - 20})`;
      ctx.fillRect(x + 2, 0, 1, 256);
    }
    for (let i = 0; i < 2200; i++) {
      const x = (i * 59) % 256;
      const y = (i * 97) % 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(28, 18, 10, 0.45)' : 'rgba(115, 88, 62, 0.28)';
      ctx.fillRect(x, y, 2, 10 + (i % 14));
    }
    // Subtle green woodland moss near the root base
    const mossGrad = ctx.createLinearGradient(0, 180, 0, 256);
    mossGrad.addColorStop(0, 'rgba(45, 78, 28, 0.0)');
    mossGrad.addColorStop(1, 'rgba(48, 86, 28, 0.55)');
    ctx.fillStyle = mossGrad;
    ctx.fillRect(0, 180, 256, 76);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.needsUpdate = true;
  cachedBarkTexture = tex;
  return tex;
}

function createRealisticTreeTrunkGeometry(): THREE.BufferGeometry {
  // Build a multi-part organic tree trunk with flared roots + main trunk + 3 forked upper limbs
  const parts: THREE.BufferGeometry[] = [];

  // Main tapered trunk with subtle organic curve and root flare
  const mainTrunk = new THREE.CylinderGeometry(0.24, 0.56, 3.2, 10, 8);
  const pos = mainTrunk.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const hNorm = (y + 1.6) / 3.2; // 0 at base, 1 at top
    const angle = Math.atan2(z, x);
    // Buttress root flare at the bottom (hNorm < 0.28)
    const rootFlare =
      hNorm < 0.28 ? Math.pow(1.0 - hNorm / 0.28, 1.6) * (0.38 + 0.22 * Math.cos(angle * 5.0)) : 0.0;
    const barkKnot = 1.0 + Math.sin(hNorm * 12.0 + angle * 3.0) * 0.05 + rootFlare;
    const bendX = Math.sin(hNorm * Math.PI * 0.85) * 0.12;
    const bendZ = Math.cos(hNorm * Math.PI * 0.65) * 0.08;
    pos.setXYZ(i, x * barkKnot + bendX, y + 1.6, z * barkKnot + bendZ);
  }
  mainTrunk.computeVertexNormals();
  parts.push(mainTrunk);

  // 3 forked primary limbs branching outward from upper trunk
  for (let b = 0; b < 3; b++) {
    const branch = new THREE.CylinderGeometry(0.09, 0.21, 1.55, 7, 4);
    const bPos = branch.attributes.position as THREE.BufferAttribute;
    const yaw = (b * Math.PI * 2) / 3 + 0.35;
    const tilt = 0.58 + (b % 2) * 0.1;
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0, 'YXZ'));
    const attachY = 2.15 + b * 0.24;
    const vec = new THREE.Vector3();
    for (let i = 0; i < bPos.count; i++) {
      vec.set(bPos.getX(i), bPos.getY(i) + 0.72, bPos.getZ(i));
      vec.applyQuaternion(quat);
      vec.y += attachY;
      bPos.setXYZ(i, vec.x, vec.y, vec.z);
    }
    branch.computeVertexNormals();
    parts.push(branch);
  }

  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of parts) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : 0;
  }
  const merged = new THREE.BufferGeometry();
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint16Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;
  for (const g of parts) {
    const pAttr = g.attributes.position as THREE.BufferAttribute;
    const nAttr = g.attributes.normal as THREE.BufferAttribute;
    const uAttr = g.attributes.uv as THREE.BufferAttribute;
    positions.set(pAttr.array as Float32Array, vOffset * 3);
    normals.set(nAttr.array as Float32Array, vOffset * 3);
    if (uAttr) uvs.set(uAttr.array as Float32Array, vOffset * 2);
    if (g.index) {
      const idxArr = g.index.array;
      for (let k = 0; k < idxArr.length; k++) {
        indices[iOffset + k] = idxArr[k] + vOffset;
      }
      iOffset += idxArr.length;
    }
    vOffset += pAttr.count;
  }
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

function createRealisticPineBoughGeometry(): THREE.BufferGeometry {
  const geom = new THREE.ConeGeometry(1.48, 2.2, 20, 6);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 0.001) {
      const angle = Math.atan2(z, x);
      const hNorm = (y + 1.1) / 2.2;
      const skirtFactor = 1.0 - hNorm;
      // Multi-ribbed drooping conifer boughs & irregular needle clusters
      const boughRib =
        Math.cos(angle * 7.0 + hNorm * 4.2) * 0.22 +
        Math.sin(angle * 13.0 - hNorm * 5.8) * 0.14;
      const radialScale = 1.0 + boughRib * (0.4 + skirtFactor * 0.55);
      const droopY =
        -Math.pow(skirtFactor, 1.4) * 0.24 + Math.sin(angle * 7.0 + hNorm * 3.0) * 0.1 * skirtFactor;
      pos.setXYZ(i, x * radialScale, y + droopY, z * radialScale);
    }
  }
  geom.computeVertexNormals();
  return geom;
}

function createRealisticBroadleafCloudGeometry(): THREE.BufferGeometry {
  const geom = new THREE.IcosahedronGeometry(1.26, 3);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.hypot(x, y, z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    // Billowy asymmetric leaf-cloud lobes & sub-clumps
    const lobe1 = Math.sin(nx * 4.2 + nz * 3.1) * Math.cos(ny * 3.6 - nx * 2.4) * 0.24;
    const lobe2 = Math.cos(nz * 7.5 - ny * 5.2) * Math.sin(nx * 6.4 + ny * 4.3) * 0.13;
    const disp = 1.0 + lobe1 + lobe2;
    const yScale = ny < 0 ? 0.68 : 0.94;
    pos.setXYZ(i, x * disp * 1.15, y * disp * yScale, z * disp * 1.15);
  }
  geom.computeVertexNormals();
  return geom;
}

function createRealisticFernBushGeometry(): THREE.BufferGeometry {
  const geom = new THREE.IcosahedronGeometry(0.75, 2);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const angle = Math.atan2(z, x);
    const frond = 1.0 + Math.cos(angle * 7.0) * 0.28 + Math.sin(angle * 13.0 + y * 4.0) * 0.15;
    const archY = Math.max(-0.22, y * 0.65 - Math.hypot(x, z) * 0.16);
    pos.setXYZ(i, x * frond * 1.25, archY, z * frond * 1.25);
  }
  geom.computeVertexNormals();
  return geom;
}

function createRealisticGrassTuftGeometry(): THREE.BufferGeometry {
  // Build a multi-stem patch of 16 fine, slender curved woodland grass blades with pointed tips
  const blades: THREE.BufferGeometry[] = [];
  const bladeCount = 16;
  for (let b = 0; b < bladeCount; b++) {
    const bladeH = 0.38 + ((b * 19) % 7) * 0.045;
    const plane = new THREE.PlaneGeometry(0.058, bladeH, 1, 4);
    const pos = plane.attributes.position as THREE.BufferAttribute;
    const angle = ((b * 137.5) % 360) * (Math.PI / 180);
    const patchRadius = ((b * 29) % 10) * 0.042;
    const offX = Math.cos(b * 2.1) * patchRadius;
    const offZ = Math.sin(b * 2.1) * patchRadius;
    const lean = 0.09 + (b % 4) * 0.045;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i) + bladeH * 0.5;
      const hNorm = THREE.MathUtils.clamp(ly / bladeH, 0, 1);
      // Taper slender blade to a needle-sharp tip
      const taper = 1.0 - Math.pow(hNorm, 1.25) * 0.92;
      const arch = Math.pow(hNorm, 1.85) * lean;
      const tx = lx * taper;
      const tz = arch;
      const rx = offX + tx * cosA - tz * sinA;
      const rz = offZ + tx * sinA + tz * cosA;
      pos.setXYZ(i, rx, ly, rz);
    }
    plane.computeVertexNormals();
    blades.push(plane);
  }

  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of blades) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : 0;
  }
  const merged = new THREE.BufferGeometry();
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint16Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;
  for (const g of blades) {
    const pAttr = g.attributes.position as THREE.BufferAttribute;
    const nAttr = g.attributes.normal as THREE.BufferAttribute;
    const uAttr = g.attributes.uv as THREE.BufferAttribute;
    positions.set(pAttr.array as Float32Array, vOffset * 3);
    normals.set(nAttr.array as Float32Array, vOffset * 3);
    if (uAttr) uvs.set(uAttr.array as Float32Array, vOffset * 2);
    if (g.index) {
      const idxArr = g.index.array;
      for (let k = 0; k < idxArr.length; k++) {
        indices[iOffset + k] = idxArr[k] + vOffset;
      }
      iOffset += idxArr.length;
    }
    vOffset += pAttr.count;
  }
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

const GRASS_MEADOW_VERTEX_SHADER = `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying float vHeightNorm;
  varying vec3 vColor;

  void main() {
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(0.32, 0.52, 0.14);
    #endif
    vHeightNorm = clamp(position.y / 0.65, 0.0, 1.0);

    vec4 instWorld = modelMatrix * instanceMatrix * vec4(position, 1.0);
    // Natural rolling meadow wind wave bending slender grass blades
    float gust = sin(uTime * 2.2 + instWorld.x * 0.48 + instWorld.z * 0.36)
               + cos(uTime * 1.5 - instWorld.x * 0.25 + instWorld.z * 0.52) * 0.6;
    float bend = pow(vHeightNorm, 1.7) * 0.11;
    instWorld.x += gust * bend;
    instWorld.z += gust * 0.7 * bend;

    vWorldPos = instWorld.xyz;
    gl_Position = projectionMatrix * viewMatrix * instWorld;
  }
`;

const GRASS_MEADOW_FRAGMENT_SHADER = `
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec3 vWorldPos;
  varying float vHeightNorm;
  varying vec3 vColor;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunDir);

    // Deep shaded root base transitioning to natural olive-emerald & sunlit chartreuse blade tips
    vec3 rootCol = vColor * vec3(0.20, 0.28, 0.12);
    vec3 tipCol = mix(vColor * 1.08, vec3(0.56, 0.74, 0.18), 0.38);
    vec3 bladeCol = mix(rootCol, tipCol, smoothstep(0.08, 0.94, vHeightNorm));

    // Subsurface sun-backlighting through translucent grass blades
    float backLit = pow(max(dot(viewDir, -L), 0.0), 2.0) * 0.48 + 0.28;
    bladeCol += vec3(0.38, 0.58, 0.12) * backLit * vHeightNorm * 0.34;

    float dist = length(cameraPosition - vWorldPos);
    float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 1.65));
    bladeCol = mix(bladeCol, uFogColor, clamp(fogFactor, 0.0, 1.0));

    gl_FragColor = vec4(bladeCol, 1.0);
  }
`;

const REALISTIC_FOLIAGE_VERTEX_SHADER = `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying vec3 vColor;

  void main() {
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = vec3(0.24, 0.44, 0.16);
    #endif
    vLocalPos = position;

    // World space transform via instanceMatrix
    vec4 instWorld = modelMatrix * instanceMatrix * vec4(position, 1.0);

    // Subtle organic wind sway on upper boughs & leaf tips
    float windPhase = uTime * 1.45 + instWorld.x * 0.32 + instWorld.z * 0.27;
    float heightFactor = clamp((position.y + 1.0) * 0.45, 0.0, 1.2);
    instWorld.x += sin(windPhase) * 0.06 * heightFactor;
    instWorld.z += cos(windPhase * 0.85) * 0.05 * heightFactor;

    vWorldPos = instWorld.xyz;
    mat3 normalMat = mat3(modelMatrix) * mat3(instanceMatrix);
    vNormal = normalize(normalMat * normal);

    gl_Position = projectionMatrix * viewMatrix * instWorld;
  }
`;

const REALISTIC_FOLIAGE_FRAGMENT_SHADER = `
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying vec3 vColor;

  // Fast 3D botanical gyroid leaf-cluster field
  float leafGyroid(vec3 p) {
    return dot(sin(p), cos(p.yzx)) * 0.3333 + 0.5;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    // High-frequency botanical leaf & pine-needle cluster scales
    vec3 p1 = vWorldPos * 7.5 + vLocalPos * 2.5;
    vec3 p2 = vWorldPos * 19.5 + vec3(1.7, 3.1, 2.3);
    vec3 p3 = vWorldPos * 44.0;

    float g1 = leafGyroid(p1);
    float g2 = leafGyroid(p2);
    float g3 = leafGyroid(p3);
    float clusterN = g1 * 0.42 + g2 * 0.36 + g3 * 0.22;

    // Lacy leaf/needle silhouette alpha cutout on outer edges & bough skirts (matching sunlit canopy in video 00:01-00:11)
    float rim = abs(dot(viewDir, normalize(vNormal)));
    float edgeCutoutZone = smoothstep(0.10, 0.44, rim) * smoothstep(-1.18, -0.68, vLocalPos.y);
    float leafAlpha = mix(clusterN, 1.0, edgeCutoutZone);
    if (leafAlpha < 0.47) discard;

    // Analytical high-frequency 3D leaf-cluster normal perturbation for crisp individual leaves/needles
    vec3 bumpGrad = (cos(p2) * cos(p2.yzx) - sin(p2.zxy) * sin(p2)) * 0.55
                  + (cos(p3) * cos(p3.yzx) - sin(p3.zxy) * sin(p3)) * 0.30;
    vec3 N = normalize(vNormal + bumpGrad * 0.48);

    vec3 L = normalize(uSunDir);
    float NdotL = max(dot(N, L), 0.0);

    // Internal crown self-shadowing (ambient occlusion) + sunlit top leaf clusters
    float crownAO = clamp(0.38 + (vLocalPos.y + 0.90) * 0.34 + (g1 - 0.35) * 0.40, 0.20, 1.15);

    // Rich botanical chlorophyll palette: deep shaded forest interior -> vibrant golden-green sunlit leaf tips
    vec3 deepShadowLeaf = vColor * vec3(0.26, 0.35, 0.20);
    vec3 midLeaf = vColor * (0.86 + 0.34 * clusterN + (g3 - 0.5) * 0.22);
    vec3 sunlitTip = mix(midLeaf, vec3(0.60, 0.82, 0.18), 0.46) * 1.28;

    vec3 baseFoliage = mix(deepShadowLeaf, midLeaf, crownAO);
    baseFoliage = mix(baseFoliage, sunlitTip, smoothstep(0.24, 0.82, NdotL * (0.65 + clusterN * 0.75)));

    // Strong golden-chartreuse subsurface scattering (SSS) translucency when backlit by sun (matching video 00:58)
    float backScatter = pow(max(dot(viewDir, -L), 0.0), 2.1) * 0.56 + pow(NdotL, 1.5) * 0.24;
    vec3 sssGlow = vec3(0.58, 0.86, 0.15) * backScatter * smoothstep(0.34, 0.80, g2);

    float hemi = 0.5 + 0.5 * N.y;
    vec3 skyFill = mix(vec3(0.18, 0.25, 0.14), vec3(0.78, 0.88, 0.96), hemi) * 0.48;
    vec3 sunLight = vec3(1.0, 0.96, 0.84) * (0.30 + NdotL * 0.78);

    vec3 finalCol = baseFoliage * (skyFill + sunLight) * crownAO + sssGlow * 0.46;

    // Exponential horizon mist matching the ground terrain shader
    float dist = length(cameraPosition - vWorldPos);
    float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 1.65));
    finalCol = mix(finalCol, uFogColor, clamp(fogFactor, 0.0, 1.0));

    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

function OpenWorldPlanetGroundScene({
  ecosystem,
  onSelectLandmark,
}: {
  ecosystem: PlanetEcosystemData;
  onSelectLandmark: (lm: PlanetLandmarkSpot) => void;
}) {
  const cocSquareGroundTexture = useMemo(() => getCoCSquareTexture(), []);
  const groundMicroTexture = useMemo(() => getRealisticGroundMicroTexture(), []);
  const barkTexture = useMemo(() => getRealisticBarkTexture(), []);

  const trunkGeom = useMemo(() => createRealisticTreeTrunkGeometry(), []);
  const pineBoughGeom = useMemo(() => createRealisticPineBoughGeometry(), []);
  const broadleafCloudGeom = useMemo(() => createRealisticBroadleafCloudGeometry(), []);
  const fernBushGeom = useMemo(() => createRealisticFernBushGeometry(), []);
  const grassTuftGeom = useMemo(() => createRealisticGrassTuftGeometry(), []);

  const pineInstRef = useRef<THREE.InstancedMesh>(null);
  const pineMidInstRef = useRef<THREE.InstancedMesh>(null);
  const pineUpperInstRef = useRef<THREE.InstancedMesh>(null);
  const trunkInstRef = useRef<THREE.InstancedMesh>(null);
  const oakInstRef = useRef<THREE.InstancedMesh>(null);
  const fernInstRef = useRef<THREE.InstancedMesh>(null);
  const grassInstRef = useRef<THREE.InstancedMesh>(null);
  const rockInstRef = useRef<THREE.InstancedMesh>(null);
  const poleInstRef = useRef<THREE.InstancedMesh>(null);

  const terrainShaderUniforms = useMemo(
    () => ({
      uSunDir: { value: new THREE.Vector3(0.45, 0.52, 0.72).normalize() },
      uFogColor: { value: new THREE.Color('#dbe8f0') },
      uFogDensity: { value: 0.0046 },
    }),
    [],
  );

  const foliageShaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.45, 0.52, 0.72).normalize() },
      uFogColor: { value: new THREE.Color('#dbe8f0') },
      uFogDensity: { value: 0.0046 },
    }),
    [],
  );

  useFrame((state) => {
    foliageShaderUniforms.uTime.value = state.clock.elapsedTime;
  });

  // Build wide Free Fire Bermuda terrain mesh (520m x 520m) with custom GLSL multi-octave FBM surface shader
  const terrainGeometry = useMemo(() => {
    const size = 520;
    const segs = 160;
    const geom = new THREE.PlaneGeometry(size, size, segs, segs);
    geom.rotateX(-Math.PI / 2);

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const wx = posAttr.getX(i);
      const wz = posAttr.getZ(i);
      const ev = evaluateOpenWorldTerrain(wx, wz);
      posAttr.setY(i, ev.height);
      colors[i * 3 + 0] = ev.color[0];
      colors[i * 3 + 1] = ev.color[1];
      colors[i * 3 + 2] = ev.color[2];
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Generate dense, multi-layered realistic woodland: 3-tier Douglas firs/pines, multi-lobe broadleaf oaks/maples, understory ferns/shrubs, wind-swaying 3D tall grass tufts & mossy boulders
  const envInstances = useMemo(() => {
    const pines: Array<{
      lowerMatrix: THREE.Matrix4;
      midMatrix: THREE.Matrix4;
      upperMatrix: THREE.Matrix4;
      color: THREE.Color;
    }> = [];
    const trunks: Array<{ matrix: THREE.Matrix4 }> = [];
    const oaks: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const ferns: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const grasses: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const rocks: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const poles: Array<{ matrix: THREE.Matrix4 }> = [];

    const pineColors = [
      new THREE.Color('#234217'),
      new THREE.Color('#2c4f1d'),
      new THREE.Color('#1d3812'),
      new THREE.Color('#355c23'),
      new THREE.Color('#28491a'),
    ];
    const oakColors = [
      new THREE.Color('#365e1f'),
      new THREE.Color('#446e27'),
      new THREE.Color('#2d5219'),
      new THREE.Color('#537a2b'),
      new THREE.Color('#647d28'),
    ];
    const fernColors = [
      new THREE.Color('#3b6922'),
      new THREE.Color('#4a7c29'),
      new THREE.Color('#2e5718'),
    ];
    const grassColors = [
      new THREE.Color('#48781e'),
      new THREE.Color('#5b8e24'),
      new THREE.Color('#3c6818'),
      new THREE.Color('#6ea126'),
      new THREE.Color('#7ca329'),
    ];
    const rockColors = [
      new THREE.Color('#576558'),
      new THREE.Color('#47554c'),
      new THREE.Color('#687569'),
    ];

    // 1. Roadside utility poles along the Bimasakti central dirt highway shoulders
    for (let pz = -105; pz <= 85; pz += 16) {
      const side = pz % 32 === 0 ? -5.8 : 5.8;
      const roadX = Math.sin(pz * 0.015) * 1.85 + side;
      const ev = evaluateOpenWorldTerrain(roadX, pz);
      if (ev.riverMask > 0.1) continue;
      const poleMat = new THREE.Matrix4().compose(
        new THREE.Vector3(roadX, ev.height + 2.6, pz),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1),
      );
      poles.push({ matrix: poleMat });
    }

    // Helper to check if a position is clear of roads, rivers, buildings, and Sovereign Squares
    const isClearForForest = (rx: number, rz: number, minRoadClearance: number): boolean => {
      const mainRoadCenterX = Math.sin(rz * 0.015) * 1.85;
      if (Math.abs(rx - mainRoadCenterX) < minRoadClearance) return false;
      // Keep foreground duckweed pond clear of trees
      if (Math.hypot(rx - 7.4, rz + 12.2) < 5.2) return false;

      for (const lm of PLANET_LANDMARKS) {
        const { wx: lx, wz: lz } = latLonToOpenWorldXZ(lm.lat, lm.lon);
        if (Math.hypot(rx - lx, rz - lz) < 9.2) return false;
      }
      for (const st of BERMUDA_STRUCTURES) {
        if (Math.hypot(rx - st.wx, rz - st.wz) < 6.8) return false;
      }
      const ev = evaluateOpenWorldTerrain(rx, rz);
      if (ev.roadMask > 0.12 || ev.riverMask > 0.08) return false;
      return true;
    };

    // 1B. Dense Wind-Swaying 3D Tall Meadow Grass, Wildflowers & Riverbank Reeds (900 instances blanketing trail edges, pond banks, and clearings like video 00:35-01:10)
    for (let g = 0; g < 900; g++) {
      let gx: number;
      let gz: number;
      if (g < 560) {
        // Dense overgrown grass corridor hugging both sides of the main dirt trail & foreground pond
        const side = g % 2 === 0 ? -1 : 1;
        const offsetFromTrail = 2.05 + ((g * 17) % 140) * 0.12 + Math.sin(g * 1.9) * 0.45;
        gz = -68 + ((g * 13) % 92) + Math.cos(g * 2.3) * 1.4;
        const mainRoadCenterX = Math.sin(gz * 0.015) * 1.85;
        gx = mainRoadCenterX + side * offsetFromTrail;
      } else {
        // Riverbank & clearing meadow patches
        gx = (((g * 73) % 160) - 80) + Math.sin(g * 1.3) * 2.2;
        gz = (((g * 41) % 140) - 85) + Math.cos(g * 1.7) * 2.2;
      }

      // Keep the center wheel ruts of the dirt trail open, and keep the middle of the pond open
      const mainRoadCenterX = Math.sin(gz * 0.015) * 1.85;
      if (Math.abs(gx - mainRoadCenterX) < 1.85) continue;
      const pondDist = Math.hypot(gx - 7.4, gz + 12.2);
      if (pondDist < 3.4) continue;

      const gev = evaluateOpenWorldTerrain(gx, gz);
      if (gev.riverMask > 0.35) continue;

      // Taller reeds/cattails near pond & river banks
      const isBankReed = pondDist < 5.2 || (gev.riverMask > 0.02 && gev.riverMask <= 0.35);
      const gScaleXZ = isBankReed ? 1.15 + (g % 4) * 0.15 : 0.92 + (g % 5) * 0.16;
      const gScaleY = isBankReed ? 1.45 + (g % 4) * 0.24 : 0.78 + (g % 6) * 0.18;
      const gYaw = ((g * 67) % 360) * (Math.PI / 180);
      const gQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(Math.sin(g) * 0.06, gYaw, Math.cos(g) * 0.06),
      );
      grasses.push({
        matrix: new THREE.Matrix4().compose(
          new THREE.Vector3(gx, gev.height - 0.04, gz),
          gQuat,
          new THREE.Vector3(gScaleXZ, gScaleY, gScaleXZ),
        ),
        color: grassColors[g % grassColors.length],
      });
    }

    // 2. Dense Foreground & Midground Woodland Groves + Hillside Forests (480 mature trees)
    for (let i = 0; i < 480; i++) {
      let rx: number;
      let rz: number;
      if (i < 220) {
        const side = i % 2 === 0 ? -1 : 1;
        const bandOffset = 6.4 + ((i * 23) % 68) + Math.sin(i * 3.1) * 2.5;
        rz = -95 + ((i * 19) % 140) + Math.cos(i * 2.7) * 3.0;
        const mainRoadCenterX = Math.sin(rz * 0.015) * 1.85;
        rx = mainRoadCenterX + side * bandOffset;
      } else {
        rx = (((i * 97) % 400) - 200) + Math.sin(i * 1.7) * 5.5;
        rz = (((i * 53) % 400) - 200) + Math.cos(i * 2.3) * 5.5;
      }

      if (!isClearForForest(rx, rz, 6.0)) continue;
      const ev = evaluateOpenWorldTerrain(rx, rz);

      const scale = 1.35 + ((i * 19) % 12) * 0.18;
      const yaw = ((i * 47) % 360) * (Math.PI / 180);
      const tiltX = Math.sin(i * 2.1) * 0.04;
      const tiltZ = Math.cos(i * 1.9) * 0.04;
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, yaw, tiltZ));
      const quatMid = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-tiltX * 0.5, yaw + 1.1, tiltZ * 0.5),
      );
      const quatTop = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(tiltX * 0.4, yaw + 2.3, -tiltZ * 0.4),
      );

      if (i % 9 === 0) {
        // Mossy forest boulder outcrop
        const rockMat = new THREE.Matrix4().compose(
          new THREE.Vector3(rx, ev.height + 0.38 * scale, rz),
          quat,
          new THREE.Vector3(scale * 1.35, scale * 0.78, scale * 1.15),
        );
        rocks.push({
          matrix: rockMat,
          color: rockColors[i % rockColors.length],
        });
      }

      // Alternate between towering 3-tier Douglas Fir/Spruce Conifers & sprawling Multi-Crown Broadleaf Oaks
      if (i % 3 !== 0) {
        // Tall Conifer Trunk rising from y=ev.height with visible furrowed lower bark & branches
        const trunkMat = new THREE.Matrix4().compose(
          new THREE.Vector3(rx, ev.height - 0.08, rz),
          quat,
          new THREE.Vector3(scale * 0.68, scale * 0.92, scale * 0.68),
        );
        trunks.push({ matrix: trunkMat });

        const lowerMat = new THREE.Matrix4().compose(
          new THREE.Vector3(rx, ev.height + scale * 2.28, rz),
          quat,
          new THREE.Vector3(scale * 1.08, scale * 1.04, scale * 1.08),
        );
        const midMat = new THREE.Matrix4().compose(
          new THREE.Vector3(rx, ev.height + scale * 3.22, rz),
          quatMid,
          new THREE.Vector3(scale * 0.85, scale * 0.98, scale * 0.85),
        );
        const upperMat = new THREE.Matrix4().compose(
          new THREE.Vector3(rx, ev.height + scale * 4.10, rz),
          quatTop,
          new THREE.Vector3(scale * 0.60, scale * 0.92, scale * 0.60),
        );

        pines.push({
          lowerMatrix: lowerMat,
          midMatrix: midMat,
          upperMatrix: upperMat,
          color: pineColors[i % pineColors.length],
        });
      } else {
        // Broadleaf Woodland Oak / Maple with stout forked trunk & 3 overlapping billowy leaf clouds high on the limbs
        const trunkMat = new THREE.Matrix4().compose(
          new THREE.Vector3(rx, ev.height - 0.08, rz),
          quat,
          new THREE.Vector3(scale * 0.88, scale * 0.84, scale * 0.88),
        );
        trunks.push({ matrix: trunkMat });

        const baseColor = oakColors[i % oakColors.length];
        oaks.push({
          matrix: new THREE.Matrix4().compose(
            new THREE.Vector3(rx, ev.height + scale * 3.05, rz),
            quat,
            new THREE.Vector3(scale * 1.22, scale * 0.95, scale * 1.22),
          ),
          color: baseColor,
        });
        const offAngle1 = yaw + 0.85;
        oaks.push({
          matrix: new THREE.Matrix4().compose(
            new THREE.Vector3(
              rx + Math.cos(offAngle1) * scale * 0.84,
              ev.height + scale * 2.58,
              rz + Math.sin(offAngle1) * scale * 0.84,
            ),
            quatMid,
            new THREE.Vector3(scale * 0.88, scale * 0.76, scale * 0.88),
          ),
          color: oakColors[(i + 1) % oakColors.length],
        });
        const offAngle2 = yaw + 2.95;
        oaks.push({
          matrix: new THREE.Matrix4().compose(
            new THREE.Vector3(
              rx + Math.cos(offAngle2) * scale * 0.78,
              ev.height + scale * 2.65,
              rz + Math.sin(offAngle2) * scale * 0.78,
            ),
            quatTop,
            new THREE.Vector3(scale * 0.82, scale * 0.72, scale * 0.82),
          ),
          color: oakColors[(i + 2) % oakColors.length],
        });
      }

      // 3. Lush Forest Understory: Ferns & Woodland Shrubs around tree bases and along valley edges
      if (i % 2 === 0) {
        const fx = rx + Math.cos(yaw) * 1.45;
        const fz = rz + Math.sin(yaw) * 1.45;
        if (isClearForForest(fx, fz, 4.8)) {
          const fev = evaluateOpenWorldTerrain(fx, fz);
          const fScale = 0.65 + (i % 5) * 0.14;
          ferns.push({
            matrix: new THREE.Matrix4().compose(
              new THREE.Vector3(fx, fev.height + fScale * 0.28, fz),
              quatMid,
              new THREE.Vector3(fScale * 1.2, fScale * 0.85, fScale * 1.2),
            ),
            color: fernColors[i % fernColors.length],
          });
        }
      }
    }

    return { pines, trunks, oaks, ferns, grasses, rocks, poles };
  }, []);

  useEffect(() => {
    if (pineInstRef.current && pineMidInstRef.current && pineUpperInstRef.current) {
      envInstances.pines.forEach((t, idx) => {
        pineInstRef.current?.setMatrixAt(idx, t.lowerMatrix);
        pineInstRef.current?.setColorAt(idx, t.color);
        pineMidInstRef.current?.setMatrixAt(idx, t.midMatrix);
        pineMidInstRef.current?.setColorAt(idx, t.color);
        pineUpperInstRef.current?.setMatrixAt(idx, t.upperMatrix);
        pineUpperInstRef.current?.setColorAt(idx, t.color);
      });
      pineInstRef.current.instanceMatrix.needsUpdate = true;
      if (pineInstRef.current.instanceColor) pineInstRef.current.instanceColor.needsUpdate = true;
      pineMidInstRef.current.instanceMatrix.needsUpdate = true;
      if (pineMidInstRef.current.instanceColor)
        pineMidInstRef.current.instanceColor.needsUpdate = true;
      pineUpperInstRef.current.instanceMatrix.needsUpdate = true;
      if (pineUpperInstRef.current.instanceColor)
        pineUpperInstRef.current.instanceColor.needsUpdate = true;
    }
    if (trunkInstRef.current) {
      envInstances.trunks.forEach((tr, idx) => {
        trunkInstRef.current?.setMatrixAt(idx, tr.matrix);
      });
      trunkInstRef.current.instanceMatrix.needsUpdate = true;
    }
    if (oakInstRef.current) {
      envInstances.oaks.forEach((o, idx) => {
        oakInstRef.current?.setMatrixAt(idx, o.matrix);
        oakInstRef.current?.setColorAt(idx, o.color);
      });
      oakInstRef.current.instanceMatrix.needsUpdate = true;
      if (oakInstRef.current.instanceColor) oakInstRef.current.instanceColor.needsUpdate = true;
    }
    if (fernInstRef.current) {
      envInstances.ferns.forEach((fn, idx) => {
        fernInstRef.current?.setMatrixAt(idx, fn.matrix);
        fernInstRef.current?.setColorAt(idx, fn.color);
      });
      fernInstRef.current.instanceMatrix.needsUpdate = true;
      if (fernInstRef.current.instanceColor) fernInstRef.current.instanceColor.needsUpdate = true;
    }
    if (grassInstRef.current) {
      envInstances.grasses.forEach((gr, idx) => {
        grassInstRef.current?.setMatrixAt(idx, gr.matrix);
        grassInstRef.current?.setColorAt(idx, gr.color);
      });
      grassInstRef.current.instanceMatrix.needsUpdate = true;
      if (grassInstRef.current.instanceColor) grassInstRef.current.instanceColor.needsUpdate = true;
    }
    if (rockInstRef.current) {
      envInstances.rocks.forEach((rk, idx) => {
        rockInstRef.current?.setMatrixAt(idx, rk.matrix);
        rockInstRef.current?.setColorAt(idx, rk.color);
      });
      rockInstRef.current.instanceMatrix.needsUpdate = true;
      if (rockInstRef.current.instanceColor) rockInstRef.current.instanceColor.needsUpdate = true;
    }
    if (poleInstRef.current) {
      envInstances.poles.forEach((pl, idx) => {
        poleInstRef.current?.setMatrixAt(idx, pl.matrix);
      });
      poleInstRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [envInstances]);

  return (
    <group>
      {/* Realistic Daytime Sky Dome with Rayleigh Scattering, Solar Halo & 3D-Lit Cumulus Clouds */}
      <DaytimeSkyDomeWithClouds radius={310} />

      {/* Wide Open-World Forest Terrain with Custom GLSL Multi-Octave FBM Shader, Fallen Autumn/Oak Leaf Litter & Wet Wheel-Rut Puddles */}
      <mesh geometry={terrainGeometry} receiveShadow>
        <shaderMaterial
          uniforms={terrainShaderUniforms}
          vertexShader={`
            attribute vec3 color;
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vMasks;
            void main() {
              vMasks = color;
              vNormal = normalize(normalMatrix * normal);
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPos = worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 uSunDir;
            uniform vec3 uFogColor;
            uniform float uFogDensity;
            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec3 vMasks;

            float hash2(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise2(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = hash2(i);
              float b = hash2(i + vec2(1.0, 0.0));
              float c = hash2(i + vec2(0.0, 1.0));
              float d = hash2(i + vec2(1.0, 1.0));
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float fbm(vec2 p) {
              float v = 0.0;
              float a = 0.5;
              for (int i = 0; i < 4; i++) {
                v += a * noise2(p);
                p = p * 2.03 + vec2(13.7, 9.2);
                a *= 0.5;
              }
              return v;
            }

            void main() {
              vec2 xz = vWorldPos.xz;
              float macroN = fbm(xz * 0.08);
              float midN = fbm(xz * 0.55);
              float microN = fbm(xz * 3.8);
              float leafCellN = noise2(xz * 9.5);
              float fineGrit = noise2(xz * 22.0) - 0.5;

              // Noisy organic road edge mask & dual wheel-track ruts
              float roadDist = vMasks.z * 12.0 + (midN - 0.5) * 0.85;
              float roadMask = 1.0 - smoothstep(1.95, 4.15, roadDist);
              float shoulderMask = (1.0 - smoothstep(2.8, 5.8, roadDist)) * (1.0 - roadMask);
              float wheelTrack = exp(-pow((abs(roadDist - 1.12)) * 2.2, 2.0)) * roadMask;

              // 1. Damp Woodland Loam Dirt Trail with Wheel Tracks, Fallen Oak Leaf Litter & Wet Puddles (matching video 00:35-01:10)
              vec3 dirtBase = mix(vec3(0.42, 0.34, 0.24), vec3(0.55, 0.46, 0.33), midN);
              dirtBase -= vec3(0.09, 0.08, 0.06) * wheelTrack;
              dirtBase += fineGrit * 0.055 + (microN - 0.5) * 0.06;

              // Scattered Fallen Autumn/Oak Leaf Litter across trail shoulders & forest floor (#8f5924 / #6e4118)
              float leafScatterZone = clamp(shoulderMask * 1.15 + roadMask * 0.55 + smoothstep(4.5, 12.0, roadDist) * 0.75, 0.0, 1.0);
              float leafClumpMask = smoothstep(0.54, 0.72, leafCellN * 0.65 + microN * 0.35) * leafScatterZone;
              vec3 dryOakLeaf = mix(vec3(0.48, 0.28, 0.12), vec3(0.66, 0.42, 0.18), hash2(floor(xz * 14.0)));
              dirtBase = mix(dirtBase, dryOakLeaf, leafClumpMask * 0.68);

              // 2. Lush Olive-Emerald Forest Floor, Damp Woodland Moss & Pine-Needle Humus
              vec3 oliveGrass = vec3(0.30, 0.46, 0.16);
              vec3 emeraldMoss = vec3(0.18, 0.34, 0.10);
              vec3 forestHumus = vec3(0.22, 0.18, 0.11);
              vec3 grassCol = mix(emeraldMoss, oliveGrass, smoothstep(0.25, 0.75, macroN));

              float forestZone = smoothstep(5.2, 10.5, roadDist);
              float humusPatch = smoothstep(0.45, 0.76, midN) * forestZone;
              grassCol = mix(grassCol, forestHumus, humusPatch * 0.54);
              grassCol = mix(grassCol, dryOakLeaf, leafClumpMask * 0.52);

              float dappledCanopyShadow = 1.0 - smoothstep(0.40, 0.70, fbm(xz * 0.38)) * forestZone * 0.42;
              grassCol *= dappledCanopyShadow;
              grassCol += (microN - 0.5) * 0.055 + fineGrit * 0.035;

              // Blend gravelly leaf-strewn roadside shoulder
              vec3 gravelShoulder = mix(vec3(0.44, 0.38, 0.27), dryOakLeaf, 0.38) + fineGrit * 0.05;
              grassCol = mix(grassCol, gravelShoulder, shoulderMask * 0.72);

              // 3. Stratified Limestone & Slate Rock on Steep Slopes & High Peak Ridges
              float slope = 1.0 - clamp(vNormal.y, 0.0, 1.0);
              float rockMask = clamp(smoothstep(0.18, 0.45, slope) + smoothstep(4.5, 10.2, vWorldPos.y) * 0.58, 0.0, 1.0);
              float strata = sin(vWorldPos.y * 4.2 + midN * 5.0) * 0.5 + 0.5;
              vec3 rockCol = mix(vec3(0.38, 0.40, 0.36), vec3(0.52, 0.51, 0.46), strata * 0.6 + microN * 0.4);
              grassCol = mix(grassCol, rockCol, rockMask * (1.0 - roadMask));

              vec3 surfaceCol = mix(grassCol, dirtBase, roadMask);

              // Wet wheel-rut mud puddles reflecting sky along the trail
              float puddleMask = wheelTrack * smoothstep(0.58, 0.74, midN);
              vec3 viewDir = normalize(cameraPosition - vWorldPos);
              surfaceCol = mix(surfaceCol, vec3(0.38, 0.48, 0.52), puddleMask * 0.58);

              // Riverbed wet mossy mud tint near river channel
              if (vMasks.y > 0.01) {
                surfaceCol = mix(surfaceCol, vec3(0.18, 0.32, 0.24), vMasks.y);
              }

              // Procedural Per-Pixel Micro-Bump Normal Perturbation
              float hL = fbm((xz + vec2(0.12, 0.0)) * 3.8);
              float hF = fbm((xz + vec2(0.0, 0.12)) * 3.8);
              vec3 bumpOffset = vec3((microN - hL) * 0.68, 0.0, (microN - hF) * 0.68);
              vec3 N = normalize(vNormal + bumpOffset * (1.0 - puddleMask * 0.85));

              // Realistic Directional Sunlight + Sky Hemisphere Fill Lighting
              vec3 L = normalize(uSunDir);
              float NdotL = max(dot(N, L), 0.0);
              float hemi = 0.5 + 0.5 * N.y;
              vec3 skyLight = mix(vec3(0.24, 0.32, 0.18), vec3(0.84, 0.91, 0.98), hemi);
              vec3 lighting = skyLight * 0.52 + vec3(1.0, 0.96, 0.86) * NdotL * 0.70;

              // Specular glint on wet mud puddles
              vec3 halfVec = normalize(L + viewDir);
              float wetSpec = pow(max(dot(N, halfVec), 0.0), 48.0) * puddleMask * 0.55;

              vec3 finalCol = surfaceCol * lighting + vec3(1.0, 0.97, 0.88) * wetSpec;

              // Exponential Horizon Mist / Aerial Perspective
              float dist = length(cameraPosition - vWorldPos);
              float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 1.65));
              finalCol = mix(finalCol, uFogColor, clamp(fogFactor, 0.0, 1.0));

              gl_FragColor = vec4(finalCol, 1.0);
            }
          `}
        />
      </mesh>

      {/* Realistic Animated GLSL Duckweed/Algae River, Roadside Pond & Weathered Wooden Fishing Pier */}
      <RealisticRiverWaterSurface />

      {/* Fallen Mossy Hollow Logs & Red-Capped Forest Mushrooms along the Foreground Trail & Pond Bank (matching video 00:38, 00:52, 01:36, 02:02) */}
      {[
        { x: -3.85, z: -8.6, yaw: 1.42, len: 2.9 },
        { x: 3.4, z: -17.2, yaw: -1.35, len: 2.6 },
        { x: -4.4, z: -26.5, yaw: 1.48, len: 3.2 },
      ].map((log, lIdx) => {
        const lev = evaluateOpenWorldTerrain(log.x, log.z);
        return (
          <group
            key={`fallen_log_${lIdx}`}
            position={[log.x, lev.height + 0.11, log.z]}
            rotation={[0, log.yaw, 0]}
          >
            {/* Fallen Furrowed Bark Trunk */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.18, 0.23, log.len, 10]} />
              <meshStandardMaterial map={barkTexture} color="#46301d" roughness={0.94} />
            </mesh>
            {/* Lush Green Woodland Moss Blanket along Top of Fallen Log */}
            <mesh position={[0, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.13, log.len * 0.84, 8]} />
              <meshStandardMaterial color="#365e18" roughness={0.9} />
            </mesh>
            {/* Cluster of Small Forest Mushrooms nestled into the damp moss beside the Log */}
            {[-0.55, -0.28, 0.42].map((mx, mIdx) => (
              <group
                key={mIdx}
                position={[mx, -0.04, 0.25 + (mIdx % 2) * 0.09]}
                scale={0.62 + mIdx * 0.12}
              >
                <mesh position={[0, 0.07, 0]}>
                  <cylinderGeometry args={[0.024, 0.032, 0.14, 7]} />
                  <meshStandardMaterial color="#e7e5d0" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.14, 0]}>
                  <sphereGeometry args={[0.085, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
                  <meshStandardMaterial color="#b92b1e" roughness={0.6} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* Free Fire Bermuda Structural Compounds (2-Story Cyan Houses, Wood Cabins, Warehouses, Fire Lookout Watchtowers, Bridges) */}
      {BERMUDA_STRUCTURES.map((spec) => (
        <FFBermudaStructureMesh key={spec.id} spec={spec} />
      ))}

      {/* Instanced Roadside Utility Poles */}
      {envInstances.poles.length > 0 && (
        <instancedMesh
          ref={poleInstRef}
          args={[undefined, undefined, envInstances.poles.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.07, 0.1, 5.2, 6]} />
          <meshStandardMaterial map={barkTexture} color="#4a3520" roughness={0.88} />
        </instancedMesh>
      )}

      {/* Instanced Moss-Covered Forest Boulders */}
      {envInstances.rocks.length > 0 && (
        <instancedMesh
          ref={rockInstRef}
          args={[undefined, undefined, envInstances.rocks.length]}
          frustumCulled={false}
        >
          <dodecahedronGeometry args={[0.98, 1]} />
          <meshStandardMaterial
            map={groundMicroTexture}
            bumpMap={groundMicroTexture}
            bumpScale={0.14}
            color="#ffffff"
            roughness={0.88}
          />
        </instancedMesh>
      )}

      {/* Instanced Furrowed-Bark Tree Trunks with Root Flare & Forked Upper Limbs */}
      {envInstances.trunks.length > 0 && (
        <instancedMesh
          ref={trunkInstRef}
          args={[trunkGeom, undefined, envInstances.trunks.length]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            map={barkTexture}
            bumpMap={barkTexture}
            bumpScale={0.18}
            color="#8a6848"
            roughness={0.92}
          />
        </instancedMesh>
      )}

      {/* Instanced 3-Tiered Sculpted Conifer Boughs with Custom GLSL Alpha-Cutout Needle & Subsurface Shader */}
      {envInstances.pines.length > 0 && (
        <>
          <instancedMesh
            ref={pineInstRef}
            args={[pineBoughGeom, undefined, envInstances.pines.length]}
            frustumCulled={false}
          >
            <shaderMaterial
              uniforms={foliageShaderUniforms}
              vertexShader={REALISTIC_FOLIAGE_VERTEX_SHADER}
              fragmentShader={REALISTIC_FOLIAGE_FRAGMENT_SHADER}
            />
          </instancedMesh>
          <instancedMesh
            ref={pineMidInstRef}
            args={[pineBoughGeom, undefined, envInstances.pines.length]}
            frustumCulled={false}
          >
            <shaderMaterial
              uniforms={foliageShaderUniforms}
              vertexShader={REALISTIC_FOLIAGE_VERTEX_SHADER}
              fragmentShader={REALISTIC_FOLIAGE_FRAGMENT_SHADER}
            />
          </instancedMesh>
          <instancedMesh
            ref={pineUpperInstRef}
            args={[pineBoughGeom, undefined, envInstances.pines.length]}
            frustumCulled={false}
          >
            <shaderMaterial
              uniforms={foliageShaderUniforms}
              vertexShader={REALISTIC_FOLIAGE_VERTEX_SHADER}
              fragmentShader={REALISTIC_FOLIAGE_FRAGMENT_SHADER}
            />
          </instancedMesh>
        </>
      )}

      {/* Instanced Multi-Crown Broadleaf Woodland Oaks & Maples with Custom GLSL Leaf-Cluster & Subsurface Shader */}
      {envInstances.oaks.length > 0 && (
        <instancedMesh
          ref={oakInstRef}
          args={[broadleafCloudGeom, undefined, envInstances.oaks.length]}
          frustumCulled={false}
        >
          <shaderMaterial
            uniforms={foliageShaderUniforms}
            vertexShader={REALISTIC_FOLIAGE_VERTEX_SHADER}
            fragmentShader={REALISTIC_FOLIAGE_FRAGMENT_SHADER}
          />
        </instancedMesh>
      )}

      {/* Instanced Woodland Understory Ferns & Forest Shrubs */}
      {envInstances.ferns.length > 0 && (
        <instancedMesh
          ref={fernInstRef}
          args={[fernBushGeom, undefined, envInstances.ferns.length]}
          frustumCulled={false}
        >
          <shaderMaterial
            uniforms={foliageShaderUniforms}
            vertexShader={REALISTIC_FOLIAGE_VERTEX_SHADER}
            fragmentShader={REALISTIC_FOLIAGE_FRAGMENT_SHADER}
          />
        </instancedMesh>
      )}

      {/* Instanced Wind-Swaying 3D Tall Meadow Grass, Wildflowers & Riverbank Reeds (900 tufts) */}
      {envInstances.grasses.length > 0 && (
        <instancedMesh
          ref={grassInstRef}
          args={[grassTuftGeom, undefined, envInstances.grasses.length]}
          frustumCulled={false}
        >
          <shaderMaterial
            side={THREE.DoubleSide}
            uniforms={foliageShaderUniforms}
            vertexShader={GRASS_MEADOW_VERTEX_SHADER}
            fragmentShader={GRASS_MEADOW_FRAGMENT_SHADER}
          />
        </instancedMesh>
      )}

      {/* 8 Sovereign Squares Integrated Along the Free Fire Bermuda Road Network */}
      {PLANET_LANDMARKS.map((landmark) => {
        const { wx, wz } = latLonToOpenWorldXZ(landmark.lat, landmark.lon);
        const ev = evaluateOpenWorldTerrain(wx, wz);
        const dummyInfo = computeSectorDummyLevel(landmark.id, ecosystem);
        const placedRewards = ecosystem.clanRewards.filter(
          (r) => r.placedLocation === landmark.id,
        );

        return (
          <group
            key={landmark.id}
            position={[wx, ev.height + 0.04, wz]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectLandmark(landmark);
            }}
          >
            {/* Outer Deep Forest Square Clearing Frame */}
            <mesh position={[0, 0.02, 0]} receiveShadow>
              <boxGeometry args={[6.4, 0.12, 6.4]} />
              <meshStandardMaterial color="#254c14" roughness={0.9} />
            </mesh>

            {/* Authentic Clash-of-Clans 45° Rotated Diamond Lawn Clearing */}
            <mesh position={[0, 0.09, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
              <boxGeometry args={[4.4, 0.08, 4.4]} />
              <meshStandardMaterial
                map={cocSquareGroundTexture}
                color="#ffffff"
                roughness={0.78}
              />
            </mesh>

            {/* Central Orange-Roofed CoC Village Compound inside the Diamond Clearing */}
            <group position={[0.35, 0.14, 0.1]} rotation={[0, Math.PI / 4, 0]}>
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.72, 0.32, 0.72]} />
                <meshStandardMaterial color="#fde68a" roughness={0.65} />
              </mesh>
              <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.68, 0.38, 4]} />
                <meshStandardMaterial color="#f97316" roughness={0.5} />
              </mesh>
            </group>

            {/* Ascending Sky Staircase to the Floating Sky Main Hall */}
            {Array.from({ length: 7 }).map((_, sIdx) => {
              const t = (sIdx + 1) / 8;
              return (
                <mesh key={sIdx} position={[0, 0.15 + t * 2.1, -1.9 - t * 1.4]}>
                  <boxGeometry args={[0.52, 0.07, 0.24]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.4} />
                </mesh>
              );
            })}

            {/* Floating Sky Sanctuary Island & Main Hall */}
            <group position={[0, 2.35, -3.55]}>
              <mesh position={[0, -0.22, 0]}>
                <coneGeometry args={[1.15, 0.55, 6]} />
                <meshStandardMaterial color="#475569" roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[1.65, 0.12, 1.65]} />
                <meshStandardMaterial color={landmark.color} roughness={0.35} />
              </mesh>
              <MiniFloatingHall3D scale={1.15} accentColor={landmark.color} />
            </group>

            {/* 3D Dummy Level Totem */}
            <PlanetDummyLevelTotem
              level={dummyInfo.level}
              stars={dummyInfo.stars}
              color={landmark.color}
            />

            {placedRewards.map((rw, rIdx) => (
              <group key={rw.id} position={[2.2 - rIdx * 1.4, 0.1, 2.2]}>
                <ClanWarTrophyMesh reward={rw} scale={0.48} />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/* ============================================================================
 * 3. COMPOSITE HORSE & RIDER MODEL WITH SPHERICAL SURFACE NAVIGATION
 * ============================================================================ */

export interface LoadedCustom3DModel {
  name: string;
  object: THREE.Group;
  animations: THREE.AnimationClip[];
  scale: number;
  yawDeg: number;
}

function HorseAndRiderNavigator({
  seedOffset,
  riderStateRef,
  keysRef,
  uiSteerRef,
  whinnyTimeRef,
  autopilotTarget,
  onClearAutopilot,
  onReachLandmark,
  onTelemetryUpdate,
  cameraMode,
  customModel,
  playerStance = 'stand',
  isMountedOnHorse = true,
  showBoyRiderOnHorse = false,
}: {
  seedOffset: number;
  riderStateRef: React.MutableRefObject<SphericalRiderState>;
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  uiSteerRef: React.MutableRefObject<{ forward: number; turn: number; gallop: boolean; jump: boolean }>;
  whinnyTimeRef: React.MutableRefObject<number>;
  autopilotTarget: PlanetLandmarkSpot | null;
  onClearAutopilot: () => void;
  onReachLandmark: (lm: PlanetLandmarkSpot | null) => void;
  onTelemetryUpdate: (info: {
    biome: PlanetBiome;
    speed: number;
    elevation: number;
    latDeg: number;
    lonDeg: number;
  }) => void;
  cameraMode: 'chase' | 'globe';
  customModel: LoadedCustom3DModel | null;
  playerStance?: 'stand' | 'crouch' | 'prone';
  isMountedOnHorse?: boolean;
  showBoyRiderOnHorse?: boolean;
}) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const horseBodyPivotRef = useRef<THREE.Group>(null);
  const riderTorsoRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const boyGaitPhaseRef = useRef(0);
  const boyMoveFactorRef = useRef(0);
  const horseAnimRef = useRef<HorseAnimRefs>({
    gaitPhase: 0,
    moveFactor: 0,
    gallopBlend: 0,
    whinnyIntensity: 0,
    jumpArc: 0,
    rearAngleRad: 0,
  });

  useEffect(() => {
    if (!customModel || customModel.animations.length === 0) {
      mixerRef.current = null;
      return;
    }
    const mixer = new THREE.AnimationMixer(customModel.object);
    const action = mixer.clipAction(customModel.animations[0]);
    action.play();
    mixerRef.current = mixer;
    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [customModel]);

  const { camera } = useThree();
  const smoothCamPos = useRef(new THREE.Vector3(0, 1.68, 3.8));
  const smoothLookAt = useRef(new THREE.Vector3(0, 1.35, -14.0));
  const prevCameraModeRef = useRef<'chase' | 'globe'>(cameraMode);
  const lastHudSyncRef = useRef(0);

  // Scratch objects to avoid per-frame allocations
  const rotMatrix = useMemo(() => new THREE.Matrix4(), []);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const vecRight = useMemo(() => new THREE.Vector3(), []);
  const vecUp = useMemo(() => new THREE.Vector3(), []);
  const vecForward = useMemo(() => new THREE.Vector3(), []);
  const desiredCamVec = useMemo(() => new THREE.Vector3(), []);
  const desiredLookVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const k = keysRef.current;
    const ui = uiSteerRef.current;

    let forwardInput = ui.forward;
    let turnInput = ui.turn;
    let gallopInput = ui.gallop || !!k.ShiftLeft || !!k.ShiftRight;
    const jumpInput = ui.jump || !!k.Space;
    ui.jump = false;

    if (k.KeyW || k.ArrowUp) forwardInput = 1;
    if (k.KeyS || k.ArrowDown) forwardInput = -0.65;
    if (k.KeyA || k.ArrowLeft) turnInput = -1;
    if (k.KeyD || k.ArrowRight) turnInput = 1;

    if (Math.abs(forwardInput) > 0.1 || Math.abs(turnInput) > 0.1) {
      if (autopilotTarget) onClearAutopilot();
    } else if (autopilotTarget) {
      const dLat = autopilotTarget.lat - riderStateRef.current.lat;
      let dLon = autopilotTarget.lon - riderStateRef.current.lon;
      if (dLon > Math.PI) dLon -= Math.PI * 2;
      if (dLon < -Math.PI) dLon += Math.PI * 2;
      const distAngular = Math.hypot(dLat, dLon * Math.cos(riderStateRef.current.lat));

      if (distAngular < 0.045) {
        onReachLandmark(autopilotTarget);
        onClearAutopilot();
        forwardInput = 0;
        turnInput = 0;
      } else {
        const desiredHeading = Math.atan2(
          dLon * Math.cos(riderStateRef.current.lat),
          dLat,
        );
        let headingDiff = desiredHeading - riderStateRef.current.heading;
        while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
        while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
        turnInput = THREE.MathUtils.clamp(headingDiff * 2.4, -1, 1);
        forwardInput = 1;
        gallopInput = true;
      }
    }

    // Scale forward speed according to whether the boy is mounted on the horse vs roaming on foot (walk, sprint, crouch-walk, or prone-crawl)
    const stanceSpeedMult = isMountedOnHorse
      ? 1.15
      : playerStance === 'prone'
        ? 0.36
        : playerStance === 'crouch'
          ? 0.56
          : gallopInput
            ? 0.96
            : 0.8;

    const effectiveGallop = isMountedOnHorse
      ? gallopInput
      : playerStance === 'stand' && gallopInput;

    const stepped = stepSphericalRider(
      riderStateRef.current,
      {
        forward: forwardInput * stanceSpeedMult,
        turn: turnInput,
        gallop: effectiveGallop,
        jump: jumpInput,
      },
      delta,
      R_PLANET,
      seedOffset,
    );

    riderStateRef.current = stepped.nextState;

    // When on the ground (chase mode), place horse & rider on the flat/rolling open-world terrain (no circular sphere curvature!)
    if (cameraMode === 'chase') {
      const { wx, wz } = latLonToOpenWorldXZ(stepped.nextState.lat, stepped.nextState.lon);
      const terrainEv = evaluateOpenWorldTerrain(wx, wz);
      const wy = terrainEv.height + stepped.nextState.jumpOffset;

      const fx = Math.sin(stepped.nextState.heading);
      const fz = -Math.cos(stepped.nextState.heading);
      vecUp.set(0, 1, 0);
      vecForward.set(fx, 0, fz).normalize();
      vecRight.crossVectors(vecUp, vecForward).normalize();

      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(wx, wy, wz);
        rotMatrix.makeBasis(vecRight, vecUp, vecForward);
        targetQuat.setFromRotationMatrix(rotMatrix);
        rootGroupRef.current.quaternion.slerp(targetQuat, 1 - Math.exp(-16 * delta));
      }

      // Wide eye-level open-world ground camera with subtle 3/4 side offset when viewing the Horse so all 4 legs, neck, tail & rearing whinny are clearly visible
      const camBackDist = isMountedOnHorse ? 4.35 : 4.5;
      const camUpHeight = isMountedOnHorse ? 1.78 : 1.84;
      const camSideOffset = isMountedOnHorse ? 1.25 : 0.0;
      desiredCamVec.set(
        wx - fx * camBackDist + vecRight.x * camSideOffset,
        wy + camUpHeight,
        wz - fz * camBackDist + vecRight.z * camSideOffset,
      );
      const camGroundY = evaluateOpenWorldTerrain(desiredCamVec.x, desiredCamVec.z).height;
      if (desiredCamVec.y < camGroundY + 1.2) {
        desiredCamVec.y = camGroundY + 1.2;
      }

      desiredLookVec.set(
        wx + fx * 14.0,
        wy + 1.32,
        wz + fz * 14.0,
      );

      const damp = 1 - Math.exp(-8.5 * delta);
      smoothCamPos.current.lerp(desiredCamVec, damp);
      smoothLookAt.current.lerp(desiredLookVec, damp);

      camera.position.copy(smoothCamPos.current);
      camera.up.set(0, 1, 0);
      camera.lookAt(smoothLookAt.current);
    } else {
      vecUp.set(stepped.basis.normal.x, stepped.basis.normal.y, stepped.basis.normal.z).normalize();
      vecForward
        .set(stepped.basis.forward.x, stepped.basis.forward.y, stepped.basis.forward.z)
        .normalize();
      vecRight.crossVectors(vecUp, vecForward).normalize();

      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(
          stepped.position.x,
          stepped.position.y,
          stepped.position.z,
        );

        rotMatrix.makeBasis(vecRight, vecUp, vecForward);
        targetQuat.setFromRotationMatrix(rotMatrix);
        rootGroupRef.current.quaternion.slerp(targetQuat, 1 - Math.exp(-16 * delta));
      }
    }

    // Advance Whinny timer if active
    if (whinnyTimeRef.current > 0) {
      whinnyTimeRef.current = Math.max(0, whinnyTimeRef.current - delta);
    }

    // Compute Equine Biomechanics (Natural 4-Beat Walk, 4-Beat Gallop, Rearing Whinny, and Bascule Jump)
    const speedAbs = Math.abs(stepped.nextState.speed);
    const phase = stepped.nextState.gaitPhase * 5.2;
    const equine = computeEquineBiomechanics({
      speedAbs,
      gallop: effectiveGallop,
      gaitPhase: phase,
      jumpOffset: stepped.nextState.jumpOffset,
      jumpVel: stepped.nextState.jumpVel,
      whinnyTimeRemaining: whinnyTimeRef.current,
      whinnyDuration: 1.85,
    });

    boyGaitPhaseRef.current = phase;
    boyMoveFactorRef.current = equine.moveFactor;

    horseAnimRef.current.gaitPhase = phase;
    horseAnimRef.current.moveFactor = equine.moveFactor;
    horseAnimRef.current.gallopBlend = equine.gallopBlend;
    horseAnimRef.current.whinnyIntensity = equine.whinnyIntensity;
    horseAnimRef.current.jumpArc = equine.jumpArc;
    horseAnimRef.current.rearAngleRad = equine.rearAngleRad;
    horseAnimRef.current.jumpOffset = stepped.nextState.jumpOffset;

    if (riderTorsoRef.current) {
      // Keep the mounted Boy locked onto the horse's saddle during walk, gallop, whinny rearing, and jumping
      const horseScale = 1.18;
      riderTorsoRef.current.position.set(
        0,
        equine.saddleHeightY * horseScale,
        -0.18 * horseScale,
      );
      riderTorsoRef.current.rotation.x = equine.saddlePitchRad;
    }

    if (mixerRef.current) {
      mixerRef.current.timeScale = speedAbs > 0.2 ? Math.max(0.6, equine.moveFactor * 1.35) : 0.35;
      mixerRef.current.update(delta);
    }

    // Handle transition into Full Planet Globe camera view vs Open-World Ground Chase view
    if (prevCameraModeRef.current !== cameraMode) {
      prevCameraModeRef.current = cameraMode;
      if (cameraMode === 'globe') {
        camera.up.set(0, 1, 0);
        camera.position.set(16, 18, 68);
        camera.lookAt(0, 0, 0);
      } else {
        const { wx, wz } = latLonToOpenWorldXZ(
          riderStateRef.current.lat,
          riderStateRef.current.lon,
        );
        const wy = evaluateOpenWorldTerrain(wx, wz).height;
        const fx = Math.sin(riderStateRef.current.heading);
        const fz = -Math.cos(riderStateRef.current.heading);
        smoothCamPos.current.set(wx - fx * 3.8, wy + 1.68, wz - fz * 3.8);
        smoothLookAt.current.set(wx + fx * 14.0, wy + 1.35, wz + fz * 14.0);
        camera.up.set(0, 1, 0);
        camera.position.copy(smoothCamPos.current);
        camera.lookAt(smoothLookAt.current);
      }
    }

    // Check proximity to any of the 8 Sovereign Landmarks & throttle HUD telemetry updates to ~8Hz
    if (state.clock.elapsedTime - lastHudSyncRef.current > 0.12) {
      lastHudSyncRef.current = state.clock.elapsedTime;

      let closestLm: PlanetLandmarkSpot | null = null;
      let minAng = 0.14;
      for (const lm of PLANET_LANDMARKS) {
        const dLat = lm.lat - stepped.nextState.lat;
        let dLon = lm.lon - stepped.nextState.lon;
        if (dLon > Math.PI) dLon -= Math.PI * 2;
        if (dLon < -Math.PI) dLon += Math.PI * 2;
        const dist = Math.hypot(dLat, dLon * Math.cos(stepped.nextState.lat));
        if (dist < minAng) {
          minAng = dist;
          closestLm = lm;
        }
      }
      onReachLandmark(closestLm);

      onTelemetryUpdate({
        biome: stepped.biome,
        speed: Math.abs(stepped.nextState.speed),
        elevation: stepped.elevation,
        latDeg: Math.round((stepped.nextState.lat * 180) / Math.PI),
        lonDeg: Math.round((stepped.nextState.lon * 180) / Math.PI),
      });
    }
  });

  // Compute initial spawn position so first frame is grounded on the open-world dirt road (or sphere in globe mode)
  const initialPlacement = useMemo(() => {
    if (cameraMode === 'chase') {
      const { wx, wz } = latLonToOpenWorldXZ(
        riderStateRef.current.lat,
        riderStateRef.current.lon,
      );
      const wy = evaluateOpenWorldTerrain(wx, wz).height;
      return [wx, wy, wz] as [number, number, number];
    }
    const basis = computeSphericalBasis(
      riderStateRef.current.lat,
      riderStateRef.current.lon,
      riderStateRef.current.heading,
    );
    const ev = evaluateShaderMatchedElevation(
      basis.normal.x,
      basis.normal.y,
      basis.normal.z,
      R_PLANET,
      seedOffset,
    );
    return [
      basis.normal.x * ev.surfaceRadius,
      basis.normal.y * ev.surfaceRadius,
      basis.normal.z * ev.surfaceRadius,
    ] as [number, number, number];
  }, [cameraMode, riderStateRef, seedOffset]);

  return (
    <group ref={rootGroupRef} position={initialPlacement} scale={0.72}>
      <group ref={horseBodyPivotRef}>
        {customModel ? (
          <group
            scale={customModel.scale}
            rotation={[0, (customModel.yawDeg * Math.PI) / 180, 0]}
          >
            <primitive object={customModel.object} />
          </group>
        ) : !isMountedOnHorse ? (
          /* ==================== ON FOOT: USER'S 3D BOY ROAMS / RUNS / SITS / GOES PRONE WITHOUT THE HORSE ==================== */
          <group position={[0, 0, 0]}>
            <BoyCharacter3D
              stance={playerStance}
              gaitPhaseRef={boyGaitPhaseRef}
              moveFactorRef={boyMoveFactorRef}
              scale={1.08}
            />
          </group>
        ) : (
          /* ==================== USER'S 3D HORSE (user_horse_lod.glb) WITH NATURAL WALK, GALLOP, WHINNY & JUMP ==================== */
          <>
            <UserHorseModel3D animRef={horseAnimRef} scale={1.18} />

            {/* Optional 3D Boy Rider sitting astride the saddle when showBoyRiderOnHorse is enabled */}
            {showBoyRiderOnHorse && (
              <group ref={riderTorsoRef} position={[0, 1.27, -0.21]}>
                <BoyCharacter3D
                  stance="horse_mount"
                  gaitPhaseRef={boyGaitPhaseRef}
                  moveFactorRef={boyMoveFactorRef}
                  scale={0.84}
                />
                {/* Golden Reins connecting Bridle to the Boy's Hands */}
                <mesh position={[-0.16, 0.36, 0.44]} rotation={[0.25, 0, 0]}>
                  <boxGeometry args={[0.018, 0.018, 0.52]} />
                  <meshStandardMaterial color="#fbbf24" roughness={0.4} />
                </mesh>
                <mesh position={[0.16, 0.36, 0.44]} rotation={[0.25, 0, 0]}>
                  <boxGeometry args={[0.018, 0.018, 0.52]} />
                  <meshStandardMaterial color="#fbbf24" roughness={0.4} />
                </mesh>
              </group>
            )}
          </>
        )}
      </group>
    </group>
  );
}

/* ============================================================================
 * 3B. NATIVE STARFIELD & GLOBE ORBIT CONTROLS (ZERO DREI OVERHEAD)
 * ============================================================================ */

function CosmicStarfield({ count = 2200, radius = 160, depth = 60 }: { count?: number; radius?: number; depth?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    let seed = 918273;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const r = radius + rand() * depth;
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      pos[i * 3] = r * s * Math.cos(theta);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(theta);

      const tint = 0.8 + rand() * 0.2;
      col[i * 3] = tint;
      col[i * 3 + 1] = tint * (0.94 + rand() * 0.06);
      col[i * 3 + 2] = 1.0;
    }
    return [pos, col];
  }, [count, radius, depth]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.25}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function GlobeOrbitControls({
  minDistance,
  maxDistance,
  rotateSpeed = 0.65,
  globeSpinRef,
}: {
  minDistance: number;
  maxDistance: number;
  rotateSpeed?: number;
  globeSpinRef?: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<ThreeOrbitControls | null>(null);

  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.rotateSpeed = rotateSpeed;
    controls.update();
    controlsRef.current = controls;
    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl.domElement, minDistance, maxDistance, rotateSpeed]);

  useFrame((_, delta) => {
    if (globeSpinRef && (Math.abs(globeSpinRef.current.x) > 0.02 || Math.abs(globeSpinRef.current.y) > 0.02)) {
      const spherical = new THREE.Spherical().setFromVector3(camera.position);
      spherical.theta -= globeSpinRef.current.x * 1.8 * delta;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi - globeSpinRef.current.y * 1.4 * delta,
        0.2,
        Math.PI - 0.2,
      );
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);
    }
    controlsRef.current?.update();
  });

  return null;
}

/* ============================================================================
 * 4. MAIN REACT THREE FIBER PLANETARY WORLD COMPONENT
 * ============================================================================ */

export interface PlanetaryWorldR3FProps {
  planetId?: string;
  planetName?: string;
  isOwner?: boolean;
  ownerName?: string | null;
  onExitToSpace?: () => void;
  onEnterSquareBase?: (landmarkId: string) => void;
  onSwitchToClassicView?: () => void;
}

export default function PlanetaryWorldR3F({
  planetId = 'gaia',
  planetName = 'Gaia',
  onExitToSpace,
}: PlanetaryWorldR3FProps) {
  // Core 5-Scene State Machine for the 1 Planet
  const [sceneMode, setSceneMode] = useState<PlanetSceneMode>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('square') === '1') {
      return 'square';
    }
    return 'planet';
  });
  const [cameraMode, setCameraMode] = useState<'chase' | 'globe'>('chase');
  const [squareCamMode, setSquareCamMode] = useState<'ff_third_person' | 'coc_overview'>('coc_overview');

  // Persistent Planet Ecosystem State (Levels, Shops, Logs, Army, Asteroids, Clan War Rewards)
  const [ecosystem, setEcosystem] = useState<PlanetEcosystemData>(() =>
    createInitialPlanetEcosystem(),
  );

  // Active Place / Square & Active Shop for FF Training Room
  const [activeSector, setActiveSector] = useState<PlanetLandmarkSpot>(PLANET_LANDMARKS[0]);
  const [nearbyLandmark, setNearbyLandmark] = useState<PlanetLandmarkSpot | null>(
    PLANET_LANDMARKS[0],
  );
  const [autopilotTarget, setAutopilotTarget] = useState<PlanetLandmarkSpot | null>(null);
  const [nearShop, setNearShop] = useState<ShopTrackerDefinition | null>(null);
  const [activeShop, setActiveShop] = useState<ShopTrackerDefinition>(() =>
    getShopsForSector('library')[0],
  );
  const [activeAsteroidId, setActiveAsteroidId] = useState<string>('ast_psyche');
  const [councilSpeakerIdx, setCouncilSpeakerIdx] = useState<number>(0);

  // Side Drawer / Command Overlays inside Squares & Planet
  const [activeDrawer, setActiveDrawer] = useState<
    'none' | 'army' | 'asteroids' | 'clan_rewards' | 'levels'
  >('none');

  // Training Room Form State
  const [logTitleInput, setLogTitleInput] = useState('');
  const [logValueInput, setLogValueInput] = useState('25');
  const [logNoteInput, setLogNoteInput] = useState('');
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [gallopEnabled, setGallopEnabled] = useState(false);
  const [playerStance, setPlayerStance] = useState<'stand' | 'crouch' | 'prone'>('stand');
  const [isMountedOnHorse, setIsMountedOnHorse] = useState(true);
  const [showBoyRiderOnHorse, setShowBoyRiderOnHorse] = useState(false);
  const [whinnyActiveUI, setWhinnyActiveUI] = useState(false);
  const whinnyTimeRef = useRef<number>(0);
  const [customModel, setCustomModel] = useState<LoadedCustom3DModel | null>(null);

  const triggerHorseWhinny = () => {
    setIsMountedOnHorse(true);
    whinnyTimeRef.current = 1.85;
    setWhinnyActiveUI(true);
    playHorseWhinnySound();
    window.setTimeout(() => {
      setWhinnyActiveUI(false);
    }, 1850);
  };

  // Virtual Analog Joystick State (Works for Horse, FF Walking in Square, AND Rotating Globe!)
  const [joyKnob, setJoyKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyContainerRef = useRef<HTMLDivElement>(null);
  const joyActiveRef = useRef(false);
  const globeSpinRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const normalizeLoadedObject = (rawObj: THREE.Object3D): THREE.Group => {
    const wrapper = new THREE.Group();
    rawObj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (!mesh.material) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#d97706',
            roughness: 0.55,
          });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(rawObj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const normScale = 2.0 / maxDim;
    rawObj.scale.multiplyScalar(normScale);

    const scaledBox = new THREE.Box3().setFromObject(rawObj);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    rawObj.position.x -= scaledCenter.x;
    rawObj.position.z -= scaledCenter.z;
    rawObj.position.y -= scaledBox.min.y;

    wrapper.add(rawObj);
    return wrapper;
  };

  const loadModelFromUrlOrFile = (url: string, label: string, ext: string) => {
    if (ext === 'obj') {
      const loader = new OBJLoader();
      loader.load(url, (obj) => {
        const normalized = normalizeLoadedObject(obj);
        setCustomModel({
          name: label,
          object: normalized,
          animations: [],
          scale: DEFAULT_CUSTOM_MODEL_CONFIG.scale,
          yawDeg: DEFAULT_CUSTOM_MODEL_CONFIG.yawDeg,
        });
      });
      return;
    }

    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const normalized = normalizeLoadedObject(gltf.scene);
      setCustomModel({
        name: label,
        object: normalized,
        animations: gltf.animations || [],
        scale: DEFAULT_CUSTOM_MODEL_CONFIG.scale,
        yawDeg: DEFAULT_CUSTOM_MODEL_CONFIG.yawDeg,
      });
    });
  };

  useEffect(() => {
    if (DEFAULT_CUSTOM_MODEL_CONFIG.modelUrl.trim()) {
      const cleanUrl = DEFAULT_CUSTOM_MODEL_CONFIG.modelUrl.trim();
      const ext = cleanUrl.split('?')[0].split('.').pop()?.toLowerCase() || 'glb';
      loadModelFromUrlOrFile(cleanUrl, DEFAULT_CUSTOM_MODEL_CONFIG.modelName, ext);
    } else if (DEFAULT_CUSTOM_MODEL_CONFIG.rawObjText.trim()) {
      try {
        const loader = new OBJLoader();
        const obj = loader.parse(DEFAULT_CUSTOM_MODEL_CONFIG.rawObjText);
        const normalized = normalizeLoadedObject(obj);
        setCustomModel({
          name: DEFAULT_CUSTOM_MODEL_CONFIG.modelName,
          object: normalized,
          animations: [],
          scale: DEFAULT_CUSTOM_MODEL_CONFIG.scale,
          yawDeg: DEFAULT_CUSTOM_MODEL_CONFIG.yawDeg,
        });
      } catch (err) {
        console.error('Failed to parse DEFAULT_CUSTOM_MODEL_CONFIG.rawObjText:', err);
      }
    }
  }, []);

  const [telemetry, setTelemetry] = useState<{
    biome: PlanetBiome;
    speed: number;
    elevation: number;
    latDeg: number;
    lonDeg: number;
  }>({
    biome: 'Emerald Forest',
    speed: 0,
    elevation: 0.36,
    latDeg: 7,
    lonDeg: -1,
  });

  const seedOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < planetId.length; i++) {
      hash = (hash * 31 + planetId.charCodeAt(i)) % 1000;
    }
    return (hash / 1000) * 3.5;
  }, [planetId]);

  const sunDirection = useMemo(() => new THREE.Vector3(35, 28, 65).normalize(), []);

  const riderStateRef = useRef<SphericalRiderState>({
    lat: 0.13,
    lon: 0.0,
    heading: 0.0,
    speed: 0,
    gaitPhase: 0,
    jumpOffset: 0,
    jumpVel: 0,
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const uiSteerRef = useRef<{
    forward: number;
    turn: number;
    gallop: boolean;
    jump: boolean;
  }>({
    forward: 0,
    turn: 0,
    gallop: false,
    jump: false,
  });

  const handleEnterPlaceSquare = (lm: PlanetLandmarkSpot) => {
    setActiveSector(lm);
    const sectorShops = getShopsForSector(lm.id);
    if (sectorShops.length > 0) {
      setActiveShop(sectorShops[0]);
      setNearShop(sectorShops[0]);
    }
    setSceneMode('square');
    setActiveDrawer('none');
  };

  const handleOpenTrainingRoomForShop = (shop: ShopTrackerDefinition) => {
    setActiveShop(shop);
    setSceneMode('training_room');
    setActiveDrawer('none');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not intercept typing when inside an input field
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }
      keysRef.current[e.code] = true;
      if (e.code === 'KeyC') {
        // Free Fire Sit / Crouch toggle (dismounts horse if mounted)
        setIsMountedOnHorse(false);
        setPlayerStance((s) => (s === 'crouch' ? 'stand' : 'crouch'));
      }
      if (e.code === 'KeyZ') {
        // Free Fire Prone / Crawl toggle (dismounts horse if mounted)
        setIsMountedOnHorse(false);
        setPlayerStance((s) => (s === 'prone' ? 'stand' : 'prone'));
      }
      if (e.code === 'KeyH' && sceneMode === 'planet') {
        // Command boy to Ride Horse or Dismount back to on-foot roaming
        setIsMountedOnHorse((mounted) => {
          const next = !mounted;
          if (next) setPlayerStance('stand');
          return next;
        });
      }
      if (e.code === 'KeyR' && sceneMode === 'planet') {
        setIsMountedOnHorse(true);
        setShowBoyRiderOnHorse((prev) => !prev);
      }
      if (e.code === 'KeyN' && sceneMode === 'planet') {
        triggerHorseWhinny();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        // Pressing Sprint while crouched/prone stands the boy up to run
        setPlayerStance('stand');
      }
      if (e.code === 'Space') {
        e.preventDefault();
        uiSteerRef.current.jump = true;
        setPlayerStance((s) => (s !== 'stand' ? 'stand' : s));
        if (sceneMode === 'planet') {
          playHorseJumpSound();
        }
      }
      if (e.code === 'KeyV') {
        if (sceneMode === 'planet') {
          setCameraMode((m) => (m === 'chase' ? 'globe' : 'chase'));
        } else if (sceneMode === 'square') {
          setSquareCamMode((m) =>
            m === 'ff_third_person' ? 'coc_overview' : 'ff_third_person',
          );
        }
      }
      if (e.code === 'KeyE' && sceneMode === 'planet' && nearbyLandmark) {
        handleEnterPlaceSquare(nearbyLandmark);
      }
      if (e.code === 'KeyF' && sceneMode === 'square' && nearShop) {
        handleOpenTrainingRoomForShop(nearShop);
      }
      if (e.code === 'Escape' && sceneMode !== 'planet') {
        if (sceneMode === 'training_room') setSceneMode('square');
        else setSceneMode('planet');
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [sceneMode, nearbyLandmark, nearShop]);

  const handleSetSteer = (forward: number, turn: number) => {
    uiSteerRef.current.forward = forward;
    uiSteerRef.current.turn = turn;
    if (sceneMode === 'planet' && cameraMode === 'globe') {
      globeSpinRef.current = { x: turn, y: forward };
    } else {
      globeSpinRef.current = { x: 0, y: 0 };
    }
  };

  const updateVirtualJoystick = (clientX: number, clientY: number) => {
    if (!joyContainerRef.current) return;
    const rect = joyContainerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 12;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    const normX = dx / maxR;
    const normY = -dy / maxR;
    handleSetSteer(normY, normX);
  };

  const resetVirtualJoystick = () => {
    joyActiveRef.current = false;
    setJoyKnob({ x: 0, y: 0 });
    handleSetSteer(0, 0);
  };

  const currentSectorShops = useMemo(
    () => getShopsForSector(activeSector.id),
    [activeSector.id],
  );
  const currentSectorDummy = useMemo(
    () => computeSectorDummyLevel(activeSector.id, ecosystem),
    [activeSector.id, ecosystem],
  );
  const activeAsteroid: AsteroidTarget =
    ecosystem.asteroids.find((a) => a.id === activeAsteroidId) || ecosystem.asteroids[0];
  const councilTranscript = useMemo(
    () => buildWeeklyCouncilTranscript(planetName, ecosystem),
    [planetName, ecosystem],
  );

  const handleLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(logValueInput);
    if (!logTitleInput.trim() || Number.isNaN(val)) return;
    setEcosystem((prev) =>
      logShopProgress(prev, activeShop.id, logTitleInput, val, logNoteInput),
    );
    setPulseTrigger((p) => p + 1);
    setLogTitleInput('');
    setLogNoteInput('');
    setStatusBanner(
      `Logged "${logTitleInput}" into ${activeShop.name}! Sector Dummy Level boosted +1 & +250 CE Gold.`,
    );
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const totalCombatTroops =
    ecosystem.army.infantry + ecosystem.army.siegeBreakers + ecosystem.army.plasmaLancers;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030712] select-none">
      {/* ==================== REACT THREE FIBER 3D SCENE CANVAS ==================== */}
      <Canvas
        shadows={IS_SOFTWARE_GL ? false : { type: THREE.PCFShadowMap }}
        dpr={IS_SOFTWARE_GL ? 1 : [1, 2]}
        frameloop={IS_SOFTWARE_GL ? 'demand' : 'always'}
        camera={{ position: [0, 12, 42], fov: 55, near: 0.1, far: 550 }}
        gl={{ antialias: !IS_SOFTWARE_GL, powerPreference: 'high-performance' }}
      >
        {IS_SOFTWARE_GL && <SoftwareGlFramePacer />}
        <color
          attach="background"
          args={[
            sceneMode === 'training_room'
              ? '#050811'
              : sceneMode === 'square' || (sceneMode === 'planet' && cameraMode === 'chase')
                ? '#dbe8f0'
                : '#040b16',
          ]}
        />
        <fogExp2
          attach="fog"
          args={[
            sceneMode === 'square' || (sceneMode === 'planet' && cameraMode === 'chase')
              ? '#dbe8f0'
              : '#071426',
            sceneMode === 'planet' && cameraMode === 'chase'
              ? 0.0046
              : sceneMode === 'square'
                ? 0.0052
                : 0.0035,
          ]}
        />

        {/* Warm Directional Sun + Cool Sky/Ground Hemisphere Fill */}
        <hemisphereLight args={['#e0f2fe', '#3a4f28', 0.95]} />
        <directionalLight
          position={[35, 28, 65]}
          intensity={1.9}
          color="#fffbeb"
          castShadow={!IS_SOFTWARE_GL}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
        />

        {((sceneMode === 'planet' && cameraMode === 'globe') ||
          sceneMode === 'asteroid_mining' ||
          sceneMode === 'council_meeting') && (
          <CosmicStarfield radius={160} depth={60} count={2200} />
        )}

        {/* MODE 1: WHOLE-PLANET MAP (OPEN-WORLD GROUND IN CHASE MODE + 3D GLOBE IN GLOBE MODE) */}
        {sceneMode === 'planet' && (
          <>
            {cameraMode === 'chase' ? (
              <OpenWorldPlanetGroundScene
                ecosystem={ecosystem}
                onSelectLandmark={(lm) => {
                  setAutopilotTarget(lm);
                  setCameraMode('chase');
                }}
              />
            ) : (
              <PlanetSphereWithShader
                seedOffset={seedOffset}
                sunDirection={sunDirection}
                ecosystem={ecosystem}
                onSelectLandmark={(lm) => {
                  setAutopilotTarget(lm);
                  setCameraMode('chase');
                }}
              />
            )}

            <HorseAndRiderNavigator
              seedOffset={seedOffset}
              riderStateRef={riderStateRef}
              keysRef={keysRef}
              uiSteerRef={uiSteerRef}
              whinnyTimeRef={whinnyTimeRef}
              autopilotTarget={autopilotTarget}
              onClearAutopilot={() => setAutopilotTarget(null)}
              onReachLandmark={setNearbyLandmark}
              onTelemetryUpdate={setTelemetry}
              cameraMode={cameraMode}
              customModel={customModel}
              playerStance={playerStance}
              isMountedOnHorse={isMountedOnHorse}
              showBoyRiderOnHorse={showBoyRiderOnHorse}
            />

            {cameraMode === 'globe' && (
              <GlobeOrbitControls
                minDistance={R_PLANET + 6}
                maxDistance={R_PLANET * 3.4}
                rotateSpeed={0.65}
                globeSpinRef={globeSpinRef}
              />
            )}
          </>
        )}

        {/* MODE 2: CLASH-OF-CLANS SQUARE BASE (FF THIRD-PERSON WALKING + MAIN HALL + SHOPS) */}
        {sceneMode === 'square' && (
          <SquareBaseSceneR3F
            sectorId={activeSector.id}
            sectorName={activeSector.name}
            sectorColor={activeSector.color}
            sectorLevel={currentSectorDummy.level}
            shops={currentSectorShops}
            clanRewards={ecosystem.clanRewards}
            keysRef={keysRef}
            uiSteerRef={uiSteerRef}
            squareCamMode={squareCamMode}
            playerStance={playerStance}
            onNearShopChange={(sh) => {
              if (sh) setNearShop(sh);
            }}
            onSelectShopForLog={(sh) => handleOpenTrainingRoomForShop(sh)}
            onExitSquareToPlanet={() => setSceneMode('planet')}
          />
        )}

        {/* MODE 3: FF TRAINING ROOM GIANT TRACKER SCENE ("trackers look so damn big") */}
        {sceneMode === 'training_room' && (
          <TrainingRoomTrackerSceneR3F
            shop={activeShop}
            logs={ecosystem.logs}
            pulseTrigger={pulseTrigger}
          />
        )}

        {/* MODE 4: LIVE 3D ASTEROID COMBAT (5m) & ENGINEER MINERAL MINING (5h-5d) */}
        {sceneMode === 'asteroid_mining' && (
          <AsteroidMiningSceneR3F asteroid={activeAsteroid} />
        )}

        {/* MODE 5: WEEKLY 3D COUNCIL MEETING (3D DELEGATES SPEAKING AROUND HOLOTABLE) */}
        {sceneMode === 'council_meeting' && (
          <WeeklyCouncilMeetingSceneR3F
            speakers={councilTranscript}
            activeSpeakerIdx={councilSpeakerIdx}
          />
        )}
      </Canvas>

      {/* ==================== TOP HUD BAR ==================== */}
      <header className="fixed top-0 left-0 right-0 z-20 p-2.5 sm:p-3.5 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="bg-slate-950/95 border border-amber-400/50 rounded-2xl px-3 py-1.5 flex items-center gap-2.5 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs sm:text-sm text-white">
                  {sceneMode === 'planet'
                    ? `${planetName} // FF Planetary Map (82% Forest)`
                    : sceneMode === 'square'
                      ? `${activeSector.icon} ${activeSector.name} — CoC Square`
                      : sceneMode === 'training_room'
                        ? `FF Training Room // ${activeShop.name}`
                        : sceneMode === 'asteroid_mining'
                          ? `Asteroid Mining // ${activeAsteroid.name}`
                          : `Headquarters // Weekly 3D Council Meeting`}
                </span>
                <span className="text-[9px] font-mono-tech uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  Lv.{currentSectorDummy.level} {currentSectorDummy.tierTitle}
                </span>
              </div>
              <div className="text-[10px] font-mono-tech text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-amber-300">
                  💰 {ecosystem.goldReserve.toLocaleString()} CE
                </span>
                <span>•</span>
                <span className="text-cyan-300">
                  💎 {ecosystem.mineralStore.toLocaleString()} Minerals
                </span>
                <span>•</span>
                <span className="text-rose-300">⚔️ {totalCombatTroops} Army</span>
                <span>•</span>
                <span className="text-emerald-300">
                  🛠️ {ecosystem.army.engineers} Engineers
                </span>
              </div>
            </div>
          </div>

          {/* Camera / View Mode Controls */}
          {sceneMode === 'planet' && (
            <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-1 flex items-center gap-1">
              <button
                onClick={() => setCameraMode('chase')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  cameraMode === 'chase'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>{isMountedOnHorse ? 'Horse Chase' : 'Player Chase'}</span>
              </button>
              <button
                onClick={() => setCameraMode('globe')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  cameraMode === 'globe'
                    ? 'bg-sky-500/25 text-sky-200 border border-sky-400/60'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5 text-sky-300" />
                <span>Rotate Globe</span>
              </button>
            </div>
          )}

          {sceneMode === 'square' && (
            <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-1 flex items-center gap-1">
              <button
                onClick={() => setSquareCamMode('ff_third_person')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  squareCamMode === 'ff_third_person'
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-300" />
                <span>FF Walk View</span>
              </button>
              <button
                onClick={() => setSquareCamMode('coc_overview')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  squareCamMode === 'coc_overview'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>CoC Top View</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Action Buttons: Command Hubs & Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {sceneMode !== 'planet' && (
            <button
              onClick={() =>
                sceneMode === 'training_room'
                  ? setSceneMode('square')
                  : setSceneMode('planet')
              }
              className="bg-slate-950/95 hover:bg-slate-900 border border-amber-400/60 text-amber-200 px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {sceneMode === 'training_room'
                  ? 'Back to Square'
                  : 'Ride Horse to Planet'}
              </span>
            </button>
          )}

          {sceneMode === 'planet' && (
            <button
              onClick={() => handleEnterPlaceSquare(nearbyLandmark || PLANET_LANDMARKS[0])}
              className="bg-slate-950/95 hover:bg-slate-900 border border-emerald-400/60 text-emerald-300 px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enter Square Base</span>
            </button>
          )}

          <button
            onClick={() =>
              setActiveDrawer((d) => (d === 'army' ? 'none' : 'army'))
            }
            className={`px-2.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1 border shadow-lg ${
              activeDrawer === 'army'
                ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-200 hover:border-rose-400/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Army Camp</span>
          </button>

          <button
            onClick={() =>
              setActiveDrawer((d) => (d === 'asteroids' ? 'none' : 'asteroids'))
            }
            className={`px-2.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1 border shadow-lg ${
              activeDrawer === 'asteroids'
                ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-200 hover:border-amber-400/50'
            }`}
          >
            <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
            <span>Asteroids & Mining</span>
          </button>

          <button
            onClick={() =>
              setActiveDrawer((d) => (d === 'clan_rewards' ? 'none' : 'clan_rewards'))
            }
            className={`px-2.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1 border shadow-lg ${
              activeDrawer === 'clan_rewards'
                ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-200 hover:border-purple-400/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-purple-400" />
            <span>Clan Trophies</span>
          </button>

          <button
            onClick={() => {
              setSceneMode(
                sceneMode === 'council_meeting' ? 'planet' : 'council_meeting',
              );
              setActiveDrawer('none');
            }}
            className={`px-2.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1 border shadow-lg ${
              sceneMode === 'council_meeting'
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-200 hover:border-cyan-400/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Weekly 3D Meeting</span>
          </button>

          {onExitToSpace && (
            <button
              onClick={onExitToSpace}
              className="bg-slate-950/95 hover:bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1 shadow-lg"
            >
              <Rocket className="w-3.5 h-3.5 text-amber-300" />
              <span>Orbit</span>
            </button>
          )}

          <a
            href="/Sovereign_Grid_Master_Architecture_Plan.pdf"
            download="Sovereign_Grid_Master_Architecture_Plan.pdf"
            className="bg-emerald-950/95 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 px-2.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1 shadow-lg"
            title="Download Full Project Master Plan PDF"
          >
            <span>📄 Plan PDF</span>
          </a>
        </div>

        {/* ==================== SECOND ROW IN HEADER: RIDE HORSE TO PLACE OR SQUARE SHOPS BAR ==================== */}
        {sceneMode === 'planet' && (
          <div className="w-full flex justify-center pointer-events-auto mt-0.5">
            <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl px-2.5 py-1 flex items-center gap-1.5 max-w-[96vw] overflow-x-auto thin-scrollbar shadow-lg">
              <span className="text-[10px] font-mono-tech uppercase text-amber-300 px-1.5 whitespace-nowrap flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Ride Horse / Enter Place:
              </span>
              {PLANET_LANDMARKS.map((lm) => {
                const isTarget = autopilotTarget?.id === lm.id;
                const isNear = nearbyLandmark?.id === lm.id;
                const lvInfo = computeSectorDummyLevel(lm.id, ecosystem);
                return (
                  <button
                    key={lm.id}
                    onClick={() => {
                      setAutopilotTarget(lm);
                      setNearbyLandmark(lm);
                      setCameraMode('chase');
                    }}
                    onDoubleClick={() => handleEnterPlaceSquare(lm)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono-tech whitespace-nowrap transition-all flex items-center gap-1 ${
                      isTarget
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/70'
                        : isNear
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60'
                          : 'bg-slate-900/90 text-slate-300 hover:text-amber-300 border border-slate-800'
                    }`}
                  >
                    <span>
                      {lm.icon} {lm.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] px-1 rounded bg-slate-800 text-amber-300">
                      Lv.{lvInfo.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sceneMode === 'square' && (
          <div className="w-full flex justify-center pointer-events-auto mt-0.5">
            <div className="bg-slate-950/95 border border-emerald-500/50 rounded-2xl px-3 py-1.5 flex items-center gap-2 max-w-[96vw] overflow-x-auto thin-scrollbar shadow-lg">
              <span className="text-[10px] font-mono-tech uppercase text-emerald-300 whitespace-nowrap">
                🏪 Square Shops (Click to Log Progress in FF Training Room):
              </span>
              {currentSectorShops.map((sh) => (
                <button
                  key={sh.id}
                  onClick={() => handleOpenTrainingRoomForShop(sh)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-mono-tech bg-slate-900 hover:bg-emerald-500/25 text-white border border-slate-700 hover:border-emerald-400 whitespace-nowrap flex items-center gap-1.5 transition-all"
                >
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>{sh.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">
                    Log Progress
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ==================== STATUS TOAST BANNER ==================== */}
      {statusBanner && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border border-emerald-400 text-emerald-200 px-4 py-2 rounded-2xl text-xs font-mono-tech shadow-2xl">
          ✨ {statusBanner}
        </div>
      )}

      {/* ==================== TOP-LEFT FF BERMUDA TACTICAL MINIMAP RADAR (PLANET MODE) ==================== */}
      {sceneMode === 'planet' && (
        <div className="fixed top-36 left-4 z-20 hidden sm:flex flex-col gap-1.5 bg-slate-950/95 border border-emerald-500/40 rounded-2xl p-2.5 w-52 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between gap-2 text-[9px] font-mono-tech text-emerald-300">
            <span>FF BERMUDA RADAR</span>
            <span className="text-amber-300">BIMASAKTI</span>
          </div>
          <div className="relative w-full h-32 rounded-xl bg-[#1e3518] border border-emerald-500/30 overflow-hidden">
            {/* Forest Topographic Grid & Bermuda Multi-Road + River SVG Overlay */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              {/* Winding Bermuda River */}
              <path
                d="M 0 36 Q 25 32, 50 36 T 100 35"
                fill="none"
                stroke="#287494"
                strokeWidth="4.5"
              />
              {/* Outer Bermuda Ring Road */}
              <ellipse
                cx="50"
                cy="52"
                rx="34"
                ry="32"
                fill="none"
                stroke="#9e8f6d"
                strokeWidth="1.6"
                strokeDasharray="2 1"
              />
              {/* North-South Bimasakti Spine Road */}
              <path
                d="M 50 4 Q 52 50, 49 96"
                fill="none"
                stroke="#b8a67e"
                strokeWidth="2.4"
              />
              {/* Northern & Southern Cross-Island Roads */}
              <path d="M 8 42 Q 50 40, 92 42" fill="none" stroke="#a89872" strokeWidth="1.8" />
              <path d="M 10 64 Q 50 66, 90 64" fill="none" stroke="#a89872" strokeWidth="1.8" />
              {/* 3 River Bridges */}
              <rect x="48" y="33" width="4" height="6" fill="#dc2626" rx="0.8" />
              <rect x="20" y="32" width="3.5" height="6" fill="#dc2626" rx="0.8" />
              <rect x="76" y="32" width="3.5" height="6" fill="#dc2626" rx="0.8" />
            </svg>

            {/* Zone Callout Labels (Peak, Bimasakti, Clock Tower) */}
            <span className="absolute top-1.5 left-2 text-[7px] font-mono-tech text-slate-300/80 pointer-events-none">
              CLOCK TOWER
            </span>
            <span className="absolute top-1.5 right-2 text-[7px] font-mono-tech text-amber-200/80 pointer-events-none">
              PEAK RIDGE
            </span>
            <span className="absolute bottom-1.5 left-2 text-[7px] font-mono-tech text-cyan-200/80 pointer-events-none">
              BIMASAKTI STRIP
            </span>

            {PLANET_LANDMARKS.map((lm) => {
              const xPct = THREE.MathUtils.clamp(50 + lm.lon * 62, 10, 90);
              const yPct = THREE.MathUtils.clamp(52 - (lm.lat - 0.13) * 75, 10, 90);
              const lv = computeSectorDummyLevel(lm.id, ecosystem).level;
              return (
                <button
                  key={lm.id}
                  onClick={() => handleEnterPlaceSquare(lm)}
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  title={`${lm.name} (Lv.${lv}) — Click to Enter Square`}
                >
                  <span className="block w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950 shadow" />
                </button>
              );
            })}
            {/* Live Horse Position Dot */}
            <div
              style={{
                left: `${THREE.MathUtils.clamp(50 + (telemetry.lonDeg * Math.PI / 180) * 62, 6, 94)}%`,
                top: `${THREE.MathUtils.clamp(52 - ((telemetry.latDeg * Math.PI / 180) - 0.13) * 75, 6, 94)}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-400 border-2 border-white"
            />
          </div>
          <div className="text-[9px] font-mono-tech text-slate-400 flex justify-between">
            <span>🐎 {telemetry.biome}</span>
            <span>Click dot → Square</span>
          </div>
        </div>
      )}

      {/* ==================== MODE 3 OVERLAY: FF TRAINING ROOM GIANT TRACKER LOG CONSOLE ==================== */}
      {sceneMode === 'training_room' && (
        <div className="fixed right-4 top-20 bottom-6 z-30 w-[92vw] max-w-md bg-slate-950/95 border border-cyan-400/60 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-2xl pointer-events-auto">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech uppercase text-cyan-400 block">
                  FF Training Room // Giant Holographic Tracker
                </span>
                <h2 className="font-display text-base font-bold text-white mt-0.5">
                  {activeShop.name}
                </h2>
                <p className="text-xs text-slate-400">{activeShop.role}</p>
              </div>
              <button
                onClick={() => setSceneMode('square')}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono-tech text-slate-200"
              >
                Exit Room
              </button>
            </div>

            {/* Shop Switcher inside Training Room */}
            <div className="mt-3">
              <label className="text-[10px] font-mono-tech uppercase text-slate-400 block mb-1">
                Switch Giant Tracker Board:
              </label>
              <div className="flex flex-wrap gap-1">
                {currentSectorShops.map((sh) => (
                  <button
                    key={sh.id}
                    onClick={() => setActiveShop(sh)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono-tech border ${
                      activeShop.id === sh.id
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sh.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Log Progress Form (Player Device Input) */}
            <form onSubmit={handleLogProgressSubmit} className="mt-4 space-y-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-xs font-mono-tech font-bold text-amber-300 flex items-center justify-between">
                <span>📱 PLAYER DEVICE LOGGING CONSOLE</span>
                <span>Target: {activeShop.defaultTarget}</span>
              </div>

              <div>
                <label className="text-[11px] font-mono-tech text-slate-300 block mb-1">
                  Tracker Entry Title (Mistake / Exam / Batch)
                </label>
                <input
                  type="text"
                  required
                  value={logTitleInput}
                  onChange={(e) => setLogTitleInput(e.target.value)}
                  placeholder="e.g., Rotational Torque Sign Mistake / Mock #5"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono-tech text-slate-300 block mb-1">
                    {activeShop.metricLabel}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={logValueInput}
                    onChange={(e) => setLogValueInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono-tech text-slate-300 block mb-1">
                    {activeShop.secondaryLabel}
                  </label>
                  <input
                    type="text"
                    value={logNoteInput}
                    onChange={(e) => setLogNoteInput(e.target.value)}
                    placeholder="Chapter / Root cause"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono-tech font-bold text-xs shadow-lg transition-all"
              >
                ⚡ Transmit Log to Giant 3D Tracker (+1 Level)
              </button>
            </form>

            {/* Recent Logged Entries on this Giant Tracker */}
            <div className="mt-4">
              <span className="text-[10px] font-mono-tech uppercase text-slate-400 block mb-1.5">
                Logged Entries on Giant Screen:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {ecosystem.logs
                  .filter((l) => l.shopId === activeShop.id)
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{entry.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {entry.secondaryNote} • {entry.timestamp}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono-tech font-bold text-xs">
                        {entry.primaryValue}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono-tech text-slate-400 border-t border-slate-800 pt-2 mt-3">
            The 3D character in front of the colossal tracker beams your device logs directly into the monument.
          </div>
        </div>
      )}

      {/* ==================== SIDE DRAWERS: ARMY / ASTEROIDS & MINING / CLAN TROPHIES ==================== */}
      {activeDrawer === 'army' && (
        <div className="fixed right-4 top-20 z-30 w-[92vw] max-w-md bg-slate-950/95 border border-rose-500/60 rounded-2xl p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-rose-400">
                ⚔️ Ares Army Garrison & Engineer Training
              </span>
              <h3 className="font-display text-sm font-bold text-white">
                Train Forces & Dispatch to Places / Asteroids
              </h3>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="text-xs font-mono-tech text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
              <div className="text-xs font-bold text-white">Vanguard Infantry</div>
              <div className="text-lg font-mono-tech font-bold text-rose-400">
                {ecosystem.army.infantry}
              </div>
              <button
                onClick={() =>
                  setEcosystem((prev) => trainArmyUnits(prev, 'infantry', 15, 300))
                }
                className="mt-1.5 w-full py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/60 text-rose-200 text-[10px] font-mono-tech font-bold"
              >
                +15 Infantry (300 CE)
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
              <div className="text-xs font-bold text-white">Siege Breakers</div>
              <div className="text-lg font-mono-tech font-bold text-amber-400">
                {ecosystem.army.siegeBreakers}
              </div>
              <button
                onClick={() =>
                  setEcosystem((prev) => trainArmyUnits(prev, 'siegeBreakers', 8, 450))
                }
                className="mt-1.5 w-full py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/60 text-amber-200 text-[10px] font-mono-tech font-bold"
              >
                +8 Siege (450 CE)
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
              <div className="text-xs font-bold text-white">Plasma Lancers</div>
              <div className="text-lg font-mono-tech font-bold text-sky-400">
                {ecosystem.army.plasmaLancers}
              </div>
              <button
                onClick={() =>
                  setEcosystem((prev) => trainArmyUnits(prev, 'plasmaLancers', 10, 500))
                }
                className="mt-1.5 w-full py-1 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/60 text-sky-200 text-[10px] font-mono-tech font-bold"
              >
                +10 Lancers (500 CE)
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
              <div className="text-xs font-bold text-white">Mining Engineers</div>
              <div className="text-lg font-mono-tech font-bold text-emerald-400">
                {ecosystem.army.engineers}
              </div>
              <button
                onClick={() =>
                  setEcosystem((prev) => trainArmyUnits(prev, 'engineers', 5, 400))
                }
                className="mt-1.5 w-full py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/60 text-emerald-200 text-[10px] font-mono-tech font-bold"
              >
                +5 Engineers (400 CE)
              </button>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-800 pt-2.5">
            <span className="text-[10px] font-mono-tech uppercase text-slate-400 block mb-1.5">
              Send Army Garrison to Planet Sectors:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PLANET_LANDMARKS.slice(0, 6).map((lm) => (
                <button
                  key={lm.id}
                  onClick={() => {
                    if (ecosystem.army.infantry < 10) return;
                    setEcosystem((prev) => ({
                      ...prev,
                      army: { ...prev.army, infantry: prev.army.infantry - 10 },
                      sectorGarrisons: {
                        ...prev.sectorGarrisons,
                        [lm.id]: (prev.sectorGarrisons[lm.id] ?? 20) + 10,
                      },
                    }));
                    setStatusBanner(`Dispatched 10 Vanguard Troops to ${lm.name}!`);
                    setTimeout(() => setStatusBanner(null), 3000);
                  }}
                  className="px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono-tech text-slate-200 flex items-center justify-between"
                >
                  <span>
                    {lm.icon} {lm.name.split(' ')[0]}
                  </span>
                  <span className="text-emerald-300">
                    {ecosystem.sectorGarrisons[lm.id] ?? 20} Gd
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeDrawer === 'asteroids' && (
        <div className="fixed right-4 top-20 z-30 w-[92vw] max-w-md bg-slate-950/95 border border-amber-400/60 rounded-2xl p-4 shadow-2xl pointer-events-auto max-h-[78vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-amber-400">
                ☄️ Money & Asteroid Mineral Extraction Tracker
              </span>
              <h3 className="font-display text-sm font-bold text-white">
                5-Min Army Fight → 5h to 5d Engineer Mining
              </h3>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="text-xs font-mono-tech text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="space-y-2.5 mt-3">
            {ecosystem.asteroids.map((ast) => (
              <div
                key={ast.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>☄️ {ast.name}</span>
                      <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {ast.mineralCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Mineral: {ast.mineralName} • {ast.difficultyLabel}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded font-bold ${
                      ast.status === 'mining'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                        : ast.status === 'fighting'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                          : ast.status === 'completed'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
                            : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {ast.status === 'fighting'
                      ? '⚔️ 5m Fight'
                      : ast.status === 'mining'
                        ? `⛏️ Mining (${ast.miningDurationLabel})`
                        : ast.status}
                  </span>
                </div>

                <div className="text-[10px] font-mono-tech text-slate-300 flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-lg">
                  <span>Fight: 5 Min (Army)</span>
                  <span>•</span>
                  <span>Mine: {ast.miningDurationLabel} (Engineers)</span>
                  <span>•</span>
                  <span className="text-amber-300">+{ast.estimatedYieldMineral} Ore</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {ast.status === 'scouted' && (
                    <button
                      onClick={() => {
                        setEcosystem((prev) =>
                          launchAsteroidOperation(prev, ast.id, 20, 4),
                        );
                        setActiveAsteroidId(ast.id);
                        setStatusBanner(
                          `Launched 5-Min Army Attack + 4 Engineers on ${ast.name}!`,
                        );
                        setTimeout(() => setStatusBanner(null), 3500);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono-tech font-bold text-[10px]"
                    >
                      ⚔️ Attack (20 Army + 4 Eng)
                    </button>
                  )}

                  {(ast.status === 'fighting' || ast.status === 'mining') && (
                    <button
                      onClick={() =>
                        setEcosystem((prev) => advanceAsteroidPhase(prev, ast.id))
                      }
                      className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono-tech font-bold text-[10px]"
                    >
                      {ast.status === 'fighting'
                        ? '⚡ Complete 5m Fight → Start Mining'
                        : '💎 Collect Extracted Minerals'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveAsteroidId(ast.id);
                      setSceneMode('asteroid_mining');
                      setActiveDrawer('none');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/60 text-sky-200 font-mono-tech font-bold text-[10px]"
                  >
                    👁️ Go to Asteroid 3D
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDrawer === 'clan_rewards' && (
        <div className="fixed right-4 top-20 z-30 w-[92vw] max-w-md bg-slate-950/95 border border-purple-400/60 rounded-2xl p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-purple-300">
                🏆 Clan War Victory Rewards ({ecosystem.clanWarWins} Wars Won)
              </span>
              <h3 className="font-display text-sm font-bold text-white">
                Place Trophies on Main Planet or Any Square
              </h3>
            </div>
            <button
              onClick={() => setActiveDrawer('none')}
              className="text-xs font-mono-tech text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Close
            </button>
          </div>

          <div className="space-y-2.5 mt-3">
            {ecosystem.clanRewards.map((rw) => (
              <div
                key={rw.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{rw.name}</div>
                    <div className="text-[10px] text-slate-400">{rw.description}</div>
                  </div>
                  <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/40">
                    At: {rw.placedLocation}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() =>
                      setEcosystem((prev) =>
                        placeClanWarReward(prev, rw.id, 'planet'),
                      )
                    }
                    className={`px-2 py-1 rounded text-[10px] font-mono-tech ${
                      rw.placedLocation === 'planet'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    🌍 Main Planet
                  </button>
                  {PLANET_LANDMARKS.slice(0, 5).map((lm) => (
                    <button
                      key={lm.id}
                      onClick={() =>
                        setEcosystem((prev) =>
                          placeClanWarReward(prev, rw.id, lm.id),
                        )
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono-tech ${
                        rw.placedLocation === lm.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {lm.icon} {lm.name.split(' ')[0]} Sq
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== MODE 5 OVERLAY: WEEKLY 3D COUNCIL MEETING SPEAKER CARD ==================== */}
      {sceneMode === 'council_meeting' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-2xl bg-slate-950/95 border border-cyan-400/70 rounded-2xl p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-cyan-400">
                🏛️ Weekly 3D Council Meeting // Basic Planetary & Sector Briefing
              </span>
              <h3 className="font-display text-sm font-bold text-white">
                {councilTranscript[councilSpeakerIdx].speakerName} —{' '}
                {councilTranscript[councilSpeakerIdx].trustName}
              </h3>
            </div>
            <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
              {councilTranscript[councilSpeakerIdx].placeName}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            “{councilTranscript[councilSpeakerIdx].statement}”
          </p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1.5">
              {councilTranscript.map((sp, idx) => (
                <button
                  key={sp.speakerId}
                  onClick={() => setCouncilSpeakerIdx(idx)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono-tech ${
                    idx === councilSpeakerIdx
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {sp.speakerName.split(' ')[0]}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setCouncilSpeakerIdx((i) => (i + 1) % councilTranscript.length)
              }
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono-tech font-bold text-xs"
            >
              Next 3D Speaker →
            </button>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM-LEFT: VIRTUAL ANALOG JOYSTICK + WASD PAD ==================== */}
      {(sceneMode === 'planet' || sceneMode === 'square') && (
        <div className="fixed bottom-4 left-4 z-20 flex items-end gap-3 pointer-events-auto">
          {/* Interactive Virtual Analog Joystick (Rides Horse, Walks in Square, or Rotates Globe) */}
          <div className="flex flex-col items-center gap-1">
            <div
              ref={joyContainerRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                joyActiveRef.current = true;
                updateVirtualJoystick(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (!joyActiveRef.current) return;
                updateVirtualJoystick(e.clientX, e.clientY);
              }}
              onPointerUp={resetVirtualJoystick}
              onPointerCancel={resetVirtualJoystick}
              className="relative w-24 h-24 rounded-full bg-slate-950/95 border-2 border-amber-400/50 shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="w-16 h-16 rounded-full border border-slate-800 pointer-events-none" />
              <div
                style={{
                  transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
                }}
                className="w-9 h-9 rounded-full bg-amber-400 border-2 border-white shadow-md pointer-events-none"
              />
            </div>
            <span className="text-[9px] font-mono-tech uppercase text-amber-300 bg-slate-950/95 px-2 py-0.5 rounded-full border border-slate-800">
              {sceneMode === 'planet' && cameraMode === 'globe'
                ? 'Globe Spin Joystick'
                : sceneMode === 'square'
                  ? 'FF Walk Joystick'
                  : isMountedOnHorse
                    ? 'Horse Ride Joystick'
                    : 'FF Player Joystick'}
            </span>
          </div>

          {/* Discrete WASD Buttons */}
          <div className="hidden sm:flex flex-col items-center gap-1">
            <div className="bg-slate-950/95 border border-slate-700/80 rounded-2xl p-1.5 grid grid-cols-3 gap-1 shadow-xl">
              <div />
              <button
                onPointerDown={() => handleSetSteer(1, 0)}
                onPointerUp={() => handleSetSteer(0, 0)}
                onPointerLeave={() => handleSetSteer(0, 0)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500/25 border border-slate-700 text-xs font-mono-tech font-bold text-amber-300 flex items-center justify-center"
              >
                W
              </button>
              <div />
              <button
                onPointerDown={() => handleSetSteer(0.7, -1)}
                onPointerUp={() => handleSetSteer(0, 0)}
                onPointerLeave={() => handleSetSteer(0, 0)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500/25 border border-slate-700 text-xs font-mono-tech font-bold text-slate-200 flex items-center justify-center"
              >
                A
              </button>
              <button
                onPointerDown={() => handleSetSteer(-0.6, 0)}
                onPointerUp={() => handleSetSteer(0, 0)}
                onPointerLeave={() => handleSetSteer(0, 0)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500/25 border border-slate-700 text-xs font-mono-tech font-bold text-slate-200 flex items-center justify-center"
              >
                S
              </button>
              <button
                onPointerDown={() => handleSetSteer(0.7, 1)}
                onPointerUp={() => handleSetSteer(0, 0)}
                onPointerLeave={() => handleSetSteer(0, 0)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-amber-500/25 border border-slate-700 text-xs font-mono-tech font-bold text-slate-200 flex items-center justify-center"
              >
                D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM-LEFT-CENTER: CONTEXTUAL ENTER SQUARE OR SHOP PROMPT (KEEPS CENTER ROAD CLEAR) ==================== */}
      {sceneMode === 'planet' && (
        <div className="fixed bottom-32 left-4 sm:bottom-4 sm:left-64 z-20 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-xs pointer-events-auto flex flex-col gap-1.5">
          {autopilotTarget && (
            <div className="bg-slate-950/95 border border-amber-400/60 rounded-2xl px-3 py-1.5 flex items-center justify-between gap-2 shadow-xl">
              <div className="text-[11px] font-mono-tech text-amber-200 flex items-center gap-1.5">
                <span>{isMountedOnHorse ? '🐎' : '🏃'}</span>
                <span className="truncate">
                  {isMountedOnHorse
                    ? `Riding to ${autopilotTarget.name}...`
                    : `Running to ${autopilotTarget.name}...`}
                </span>
              </div>
              <button
                onClick={() => setAutopilotTarget(null)}
                className="text-[10px] font-mono-tech text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
              >
                Stop
              </button>
            </div>
          )}

          {nearbyLandmark && (
            <div className="bg-slate-950/95 border border-emerald-400/60 rounded-2xl px-3 py-2 flex items-center justify-between gap-2.5 shadow-xl">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-display text-xs font-bold text-white truncate">
                    {nearbyLandmark.icon} {nearbyLandmark.name}
                  </span>
                  <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                    Lv.{computeSectorDummyLevel(nearbyLandmark.id, ecosystem).level}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5 truncate">
                  {nearbyLandmark.subtitle}
                </p>
              </div>
              <button
                onClick={() => handleEnterPlaceSquare(nearbyLandmark)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono-tech font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 whitespace-nowrap shadow-md shrink-0"
              >
                🏰 Square [E]
              </button>
            </div>
          )}
        </div>
      )}

      {sceneMode === 'square' && nearShop && (
        <div className="fixed bottom-32 left-4 sm:bottom-4 sm:left-64 z-20 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-xs pointer-events-auto">
          <div className="bg-slate-950/95 border border-cyan-400/70 rounded-2xl px-3 py-2 flex items-center justify-between gap-2.5 shadow-xl">
            <div className="min-w-0">
              <div className="text-xs font-display font-bold text-white truncate">
                🏪 {nearShop.name}
              </div>
              <p className="text-[10px] text-slate-300 truncate">{nearShop.role}</p>
            </div>
            <button
              onClick={() => handleOpenTrainingRoomForShop(nearShop)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono-tech font-bold bg-cyan-400 text-slate-950 hover:bg-cyan-300 whitespace-nowrap shadow-md shrink-0"
            >
              📱 Log [F]
            </button>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM-RIGHT: HORSE ACTIONS (WALK, RUN/GALLOP, WHINNY, JUMP) & FREE FIRE BOY STANCES ==================== */}
      {(sceneMode === 'planet' || sceneMode === 'square') && (
        <div className="fixed bottom-4 right-4 z-20 flex flex-wrap items-center justify-end gap-1.5 max-w-[64vw] pointer-events-auto">
          {/* 1. Free Fire Sit / Crouch [C] */}
          <button
            onClick={() => {
              setIsMountedOnHorse(false);
              setPlayerStance((s) => (s === 'crouch' ? 'stand' : 'crouch'));
            }}
            className={`px-2.5 py-2 rounded-2xl text-xs font-mono-tech font-bold flex items-center gap-1.5 border shadow-xl transition-all ${
              !isMountedOnHorse && playerStance === 'crouch'
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Free Fire Boy Sit / Crouch Stance (Key C)"
          >
            <span>🧎</span>
            <span>
              {!isMountedOnHorse && playerStance === 'crouch'
                ? 'Sitting [C]'
                : 'Sit [C]'}
            </span>
          </button>

          {/* 2. Free Fire Prone / Crawl [Z] */}
          <button
            onClick={() => {
              setIsMountedOnHorse(false);
              setPlayerStance((s) => (s === 'prone' ? 'stand' : 'prone'));
            }}
            className={`px-2.5 py-2 rounded-2xl text-xs font-mono-tech font-bold flex items-center gap-1.5 border shadow-xl transition-all ${
              !isMountedOnHorse && playerStance === 'prone'
                ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Free Fire Boy Prone / Crawl Stance (Key Z)"
          >
            <span>趴</span>
            <span>Prone [Z]</span>
          </button>

          {/* 3. Walk vs Run / Gallop [Shift] */}
          <button
            onClick={() => {
              const next = !gallopEnabled;
              setGallopEnabled(next);
              uiSteerRef.current.gallop = next;
              if (next && !isMountedOnHorse) {
                setPlayerStance('stand');
              }
            }}
            className={`px-3 py-2 rounded-2xl text-xs font-mono-tech font-bold flex items-center gap-1.5 border shadow-xl transition-all ${
              gallopEnabled
                ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                : 'bg-slate-950/95 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Natural Walk vs Fast Run / Gallop (Shift)"
          >
            <Footprints className="w-4 h-4 text-amber-300" />
            <span>
              {isMountedOnHorse
                ? gallopEnabled
                  ? 'Galloping [Shift]'
                  : 'Run / Gallop [Shift]'
                : gallopEnabled
                  ? 'Running [Shift]'
                  : 'Run [Shift]'}
            </span>
          </button>

          {/* 4. Horse Whinny / Neigh + Rear Up [N] */}
          {sceneMode === 'planet' && (
            <button
              onClick={triggerHorseWhinny}
              className={`px-3 py-2 rounded-2xl text-xs font-mono-tech font-bold flex items-center gap-1.5 border shadow-xl transition-all ${
                whinnyActiveUI
                  ? 'bg-orange-500 border-orange-300 text-slate-950 scale-105'
                  : 'bg-slate-950/95 border-orange-400/70 text-orange-300 hover:bg-orange-500/20'
              }`}
              title="Make Horse Rear Up & Whinny / Neigh with Sound (Key N)"
            >
              <span>🔊</span>
              <span>{whinnyActiveUI ? 'Whinnying!' : 'Whinny [N]'}</span>
            </button>
          )}

          {/* 5. Toggle Boy Rider Astride Saddle [R] */}
          {sceneMode === 'planet' && isMountedOnHorse && (
            <button
              onClick={() => setShowBoyRiderOnHorse((prev) => !prev)}
              className={`px-2.5 py-2 rounded-2xl text-xs font-mono-tech font-bold flex items-center gap-1.5 border shadow-xl transition-all ${
                showBoyRiderOnHorse
                  ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                  : 'bg-slate-950/95 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle Boy Sitting Astride Horse Saddle vs Horse Solo (Key R)"
            >
              <span>{showBoyRiderOnHorse ? '🤠' : '🐎'}</span>
              <span>{showBoyRiderOnHorse ? 'Rider: ON [R]' : 'Horse Solo [R]'}</span>
            </button>
          )}

          {/* 6. Switch between Horse Mode and Boy On-Foot Mode [H] */}
          {sceneMode === 'planet' && (
            <button
              onClick={() => {
                setIsMountedOnHorse((mounted) => {
                  const next = !mounted;
                  if (next) setPlayerStance('stand');
                  return next;
                });
              }}
              className={`px-3 py-2 rounded-2xl text-xs font-mono-tech font-bold flex items-center gap-1.5 border shadow-xl transition-all ${
                isMountedOnHorse
                  ? 'bg-amber-500 border-amber-300 text-slate-950'
                  : 'bg-slate-950/95 border-amber-400/60 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Switch between Horse & Boy On-Foot Roaming (Key H)"
            >
              <span>{isMountedOnHorse ? '🚶' : '🐎'}</span>
              <span>
                {isMountedOnHorse ? 'Boy on Foot [H]' : 'Ride Horse [H]'}
              </span>
            </button>
          )}

          {/* 7. Horse Bascule Jump / Boy Jump [Space] */}
          <button
            onClick={() => {
              if (!isMountedOnHorse && playerStance !== 'stand') {
                setPlayerStance('stand');
              } else {
                uiSteerRef.current.jump = true;
                if (sceneMode === 'planet' && isMountedOnHorse) {
                  playHorseJumpSound();
                }
              }
            }}
            className="px-3 py-2 rounded-2xl bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400 text-xs font-mono-tech font-bold text-sky-200 shadow-xl active:scale-95"
            title="Horse Bascule Jump / Stand Up (Space)"
          >
            {!isMountedOnHorse && playerStance !== 'stand'
              ? 'Stand Up'
              : isMountedOnHorse
                ? '⬆️ Jump [Space]'
                : 'Jump'}
          </button>
        </div>
      )}
    </div>
  );
}

