import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  type AsteroidTarget,
  type ClanWarRewardItem,
  type CouncilSpeakerLine,
  type LoggedTrackerEntry,
  type ShopTrackerDefinition,
} from '@/utils/planetEcosystemState';

let cachedMainHallGeometry: THREE.BufferGeometry | null = null;
let mainHallLoadListeners: Array<(geom: THREE.BufferGeometry) => void> = [];
let mainHallLoadStarted = false;

function ensureMainHallLoaded(onReady: (geom: THREE.BufferGeometry) => void) {
  if (cachedMainHallGeometry) {
    onReady(cachedMainHallGeometry);
    return;
  }
  mainHallLoadListeners.push(onReady);
  if (mainHallLoadStarted) return;
  mainHallLoadStarted = true;

  const loader = new GLTFLoader();
  const processGltf = (gltf: any) => {
    let foundGeom: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((child: any) => {
      if (!foundGeom && child.isMesh && child.geometry) {
        foundGeom = child.geometry.clone();
      }
    });
    if (foundGeom) {
      const geom = foundGeom as THREE.BufferGeometry;
      geom.computeVertexNormals();
      geom.computeBoundingBox();
      if (geom.boundingBox) {
        const min = geom.boundingBox.min;
        const max = geom.boundingBox.max;
        const cx = (min.x + max.x) * 0.5;
        const cz = (min.z + max.z) * 0.5;
        geom.translate(-cx, -min.y, -cz);
      }
      cachedMainHallGeometry = geom;
      mainHallLoadListeners.forEach((cb) => cb(geom));
      mainHallLoadListeners = [];
    }
  };

  loader.load(
    '/models/main_hall_lod.glb',
    processGltf,
    undefined,
    () => {
      loader.load('/models/main_hall.glb', processGltf, undefined, (err) => {
        console.warn('Main hall GLB fallback warning:', err);
      });
    },
  );
}

interface CachedTownHallData {
  geom: THREE.BufferGeometry;
  map: THREE.Texture | null;
}

let cachedTownHallData: CachedTownHallData | null = null;
let townHallLoadListeners: Array<(data: CachedTownHallData) => void> = [];
let townHallLoadStarted = false;

function ensureTownHallLoaded(onReady: (data: CachedTownHallData) => void) {
  if (cachedTownHallData) {
    onReady(cachedTownHallData);
    return;
  }
  townHallLoadListeners.push(onReady);
  if (townHallLoadStarted) return;
  townHallLoadStarted = true;

  const loader = new GLTFLoader();
  const processGltf = (gltf: any) => {
    let foundGeom: THREE.BufferGeometry | null = null;
    let foundMap: THREE.Texture | null = null;
    gltf.scene.traverse((child: any) => {
      if (!foundGeom && child.isMesh && child.geometry) {
        foundGeom = child.geometry.clone();
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        if (mat && mat.map) {
          foundMap = mat.map;
          if (foundMap) {
            foundMap.colorSpace = THREE.SRGBColorSpace;
            foundMap.needsUpdate = true;
          }
        }
      }
    });
    if (foundGeom) {
      const geom = foundGeom as THREE.BufferGeometry;
      // Align the Town Hall's 30.5-degree native footprint with local X/Z axes so it sits parallel to the 45° diamond pad
      geom.rotateY(-0.5323);
      if (!geom.attributes.normal) {
        geom.computeVertexNormals();
      }
      geom.computeBoundingBox();
      if (geom.boundingBox) {
        const min = geom.boundingBox.min;
        const max = geom.boundingBox.max;
        const cx = (min.x + max.x) * 0.5;
        const cz = (min.z + max.z) * 0.5;
        geom.translate(-cx, -min.y, -cz);
      }
      cachedTownHallData = { geom, map: foundMap };
      townHallLoadListeners.forEach((cb) => cb(cachedTownHallData!));
      townHallLoadListeners = [];
    }
  };

  loader.load(
    '/models/town_hall_lod.glb',
    processGltf,
    undefined,
    () => {
      loader.load('/models/town_hall.glb', processGltf, undefined, (err) => {
        console.warn('Town hall GLB fallback warning:', err);
      });
    },
  );
}

export function TownHallModel3D({ scale = 1 }: { scale?: number }) {
  const [data, setData] = useState<CachedTownHallData | null>(() => cachedTownHallData);

  useEffect(() => {
    let mounted = true;
    ensureTownHallLoaded((loaded) => {
      if (mounted) setData(loaded);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <group scale={scale}>
      {data ? (
        <mesh geometry={data.geom}>
          <meshStandardMaterial
            map={data.map}
            color="#ffffff"
            roughness={0.62}
            metalness={0.12}
          />
        </mesh>
      ) : (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.4, 1.0, 1.4]} />
            <meshStandardMaterial color="#d6b485" roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.25, 0.7, 4]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

let cachedSquareBaseData: CachedTownHallData | null = null;
let squareBaseLoadListeners: Array<(data: CachedTownHallData) => void> = [];
let squareBaseLoadStarted = false;

function ensureSquareBaseLoaded(onReady: (data: CachedTownHallData) => void) {
  if (cachedSquareBaseData) {
    onReady(cachedSquareBaseData);
    return;
  }
  squareBaseLoadListeners.push(onReady);
  if (squareBaseLoadStarted) return;
  squareBaseLoadStarted = true;

  const loader = new GLTFLoader();
  const processGltf = (gltf: any) => {
    let foundGeom: THREE.BufferGeometry | null = null;
    let foundMap: THREE.Texture | null = null;
    gltf.scene.traverse((child: any) => {
      if (!foundGeom && child.isMesh && child.geometry) {
        foundGeom = child.geometry.clone();
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        if (mat && mat.map) {
          foundMap = mat.map;
          if (foundMap) {
            foundMap.colorSpace = THREE.SRGBColorSpace;
            foundMap.needsUpdate = true;
          }
        }
      }
    });
    if (foundGeom) {
      const geom = foundGeom as THREE.BufferGeometry;
      if (!geom.attributes.normal) {
        geom.computeVertexNormals();
      }
      geom.computeBoundingBox();
      if (geom.boundingBox) {
        const min = geom.boundingBox.min;
        const max = geom.boundingBox.max;
        const cx = (min.x + max.x) * 0.5;
        const cz = (min.z + max.z) * 0.5;
        // Translate so the flat central clearing lawn (at y ≈ -0.132 in normalized GLB coordinates) sits right at y = 0
        geom.translate(-cx, 0.1318, -cz);
      }
      cachedSquareBaseData = { geom, map: foundMap };
      squareBaseLoadListeners.forEach((cb) => cb(cachedSquareBaseData!));
      squareBaseLoadListeners = [];
    }
  };

  loader.load(
    '/models/square_base_lod.glb',
    processGltf,
    undefined,
    () => {
      loader.load('/models/square_base.glb', processGltf, undefined, (err) => {
        console.warn('Square base GLB fallback warning:', err);
      });
    },
  );
}

export function SquareBaseTerrainModel3D({
  scale = 38,
  fallbackMap,
}: {
  scale?: number;
  fallbackMap?: THREE.Texture;
}) {
  const [data, setData] = useState<CachedTownHallData | null>(() => cachedSquareBaseData);

  useEffect(() => {
    let mounted = true;
    ensureSquareBaseLoaded((loaded) => {
      if (mounted) setData(loaded);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <group scale={scale}>
      {data ? (
        <mesh geometry={data.geom}>
          <meshStandardMaterial
            map={data.map}
            emissiveMap={data.map}
            emissive="#ffffff"
            emissiveIntensity={0.44}
            color="#ffffff"
            roughness={0.78}
            metalness={0.04}
          />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.0, 1.95]} />
          <meshStandardMaterial
            map={fallbackMap}
            color="#ffffff"
            roughness={0.86}
            metalness={0.02}
          />
        </mesh>
      )}
    </group>
  );
}

/* ============================================================================
 * 0. CUSTOM 3D MAIN HALL MODEL (LOADED FROM USER'S main_hall.glb FOR ALL PLACES)
 * ============================================================================ */
export function MainHallModel3D({
  scale = 1,
  accentColor = '#f59e0b',
  showPedestal = false,
}: {
  scale?: number;
  accentColor?: string;
  showPedestal?: boolean;
}) {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(() => cachedMainHallGeometry);

  useEffect(() => {
    let mounted = true;
    ensureMainHallLoaded((loaded) => {
      if (mounted) setGeom(loaded);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const hasVertexColors = Boolean(geom?.attributes?.color);

  return (
    <group>
      {showPedestal && (
        <group>
          <mesh position={[0, 0.16, 0]} receiveShadow>
            <boxGeometry args={[5.6, 0.32, 5.6]} />
            <meshStandardMaterial color="#334155" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.34, 0]} receiveShadow>
            <boxGeometry args={[4.9, 0.08, 4.9]} />
            <meshStandardMaterial color={accentColor} roughness={0.35} metalness={0.25} />
          </mesh>
        </group>
      )}
      <group position={[0, showPedestal ? 0.36 : 0, 0]} scale={scale}>
        {geom ? (
          <mesh geometry={geom}>
            <meshStandardMaterial
              vertexColors={hasVertexColors}
              color={hasVertexColors ? '#ffffff' : '#e2d5c1'}
              roughness={0.52}
              metalness={0.18}
            />
          </mesh>
        ) : (
          <group>
            <mesh position={[0, 0.7, 0]}>
              <boxGeometry args={[1.2, 1.4, 1.2]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.6, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[0.95, 0.6, 4]} />
              <meshStandardMaterial color={accentColor} roughness={0.35} />
            </mesh>
          </group>
        )}
      </group>
      {/* Subtle Accent Halo Crown above Main Hall */}
      <mesh position={[0, (showPedestal ? 0.45 : 0.1) + scale * 1.98, 0]}>
        <octahedronGeometry args={[0.14 * Math.max(1, scale * 0.65), 0]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
    </group>
  );
}

/** Lightweight composite Floating Sky Hall for distant planet-map Square markers */
export function MiniFloatingHall3D({
  scale = 1,
  accentColor = '#f59e0b',
}: {
  scale?: number;
  accentColor?: string;
}) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.15, 0.84, 1.15]} />
        <meshStandardMaterial color="#e2d5c1" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[0.82, 0.44, 0.82]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.38, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.88, 0.56, 4]} />
        <meshStandardMaterial color={accentColor} roughness={0.38} />
      </mesh>
      <mesh position={[0, 1.82, 0]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
    </group>
  );
}

/* ============================================================================
 * 0B. REALISTIC DAYTIME SKY DOME WITH SOFT WHITE CLOUDS & HORIZON MIST
 * ============================================================================ */
export function DaytimeSkyDomeWithClouds({ radius = 280 }: { radius?: number }) {
  const skyUniforms = useMemo(
    () => ({
      uZenithColor: { value: new THREE.Color('#2768b5') },
      uMidSkyColor: { value: new THREE.Color('#6db6e8') },
      uHorizonColor: { value: new THREE.Color('#dbe8f0') },
      uGroundMistColor: { value: new THREE.Color('#c8d8e2') },
      uSunDir: { value: new THREE.Vector3(0.42, 0.36, -0.83).normalize() },
    }),
    [],
  );

  return (
    <mesh scale={[radius, radius, radius]} frustumCulled={false}>
      <sphereGeometry args={[1, 40, 28]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={skyUniforms}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uZenithColor;
          uniform vec3 uMidSkyColor;
          uniform vec3 uHorizonColor;
          uniform vec3 uGroundMistColor;
          uniform vec3 uSunDir;
          varying vec3 vDir;

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

          float fbm2(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 5; i++) {
              v += a * noise2(p);
              p = p * 2.04 + vec2(17.3, 9.2);
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec3 d = normalize(vDir);
            float h = clamp(d.y, 0.0, 1.0);

            // Rayleigh & Mie sky gradient with warm horizon atmospheric scattering
            vec3 sky = mix(uHorizonColor, uMidSkyColor, smoothstep(0.0, 0.32, h));
            sky = mix(sky, uZenithColor, smoothstep(0.26, 0.92, h));

            // Solar Mie forward-scattering halo & subtle sun core
            float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
            vec3 sunHalo = vec3(1.0, 0.94, 0.82) * (pow(sunDot, 10.0) * 0.24 + pow(sunDot, 48.0) * 0.35);
            sky += sunHalo;

            // Multi-layered 3D-shaded cumulus & high-altitude cirrus clouds
            if (d.y > 0.012) {
              vec2 uv = d.xz / (d.y + 0.22) * 1.95;
              float n1 = fbm2(uv);
              float n2 = fbm2(uv * 2.35 - vec2(4.2, 1.8));
              float nShift = fbm2(uv + uSunDir.xz * 0.14);
              float cloudDensity = smoothstep(0.41, 0.77, n1 * 0.66 + n2 * 0.34);
              float horizonFade = smoothstep(0.015, 0.20, h);

              // Self-shadowing & sunlit top edge on cumulus clouds
              float cloudLight = clamp(0.65 + (n1 - nShift) * 1.65 + pow(sunDot, 4.0) * 0.28, 0.0, 1.0);
              vec3 cloudShadowCol = vec3(0.76, 0.83, 0.90);
              vec3 cloudBrightCol = vec3(1.0, 0.99, 0.96);
              vec3 cloudColor = mix(cloudShadowCol, cloudBrightCol, cloudLight);

              // High wispy cirrus streaks
              float cirrus = smoothstep(0.56, 0.86, fbm2(uv * vec2(3.6, 1.1) + vec2(8.1, -3.4))) * 0.32;
              sky = mix(sky, vec3(0.96, 0.98, 1.0), cirrus * horizonFade);
              sky = mix(sky, cloudColor, cloudDensity * horizonFade * 0.88);
            }

            if (d.y < 0.0) {
              sky = mix(uHorizonColor, uGroundMistColor, clamp(-d.y * 4.0, 0.0, 1.0));
            }

            gl_FragColor = vec4(sky, 1.0);
          }
        `}
      />
    </mesh>
  );
}

/* ============================================================================
 * 1. CLAN WAR TROPHY 3D COMPOSITE BUILDER (FOR PLANET OR ANY SQUARE)
 * ============================================================================ */
export function ClanWarTrophyMesh({
  reward,
  scale = 1,
}: {
  reward: ClanWarRewardItem;
  scale?: number;
}) {
  const spinRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (spinRef.current) {
      spinRef.current.rotation.y += delta * 1.4;
      spinRef.current.position.y = 1.65 + Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
    }
  });

  return (
    <group scale={scale}>
      {/* Pedestal Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.4, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.48, 0.52, 0.08, 8]} />
        <meshStandardMaterial color={reward.color} roughness={0.3} metalness={0.25} />
      </mesh>

      {reward.modelType === 'obelisk' && (
        <group>
          <mesh position={[0, 1.15, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.36, 1.4, 4]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.25} />
          </mesh>
          <mesh ref={spinRef} position={[0, 2.0, 0]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
        </group>
      )}

      {reward.modelType === 'brazier' && (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.25, 0.75, 10]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.5} />
          </mesh>
          <mesh ref={spinRef} position={[0, 1.45, 0]}>
            <coneGeometry args={[0.35, 0.85, 7]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
        </group>
      )}

      {reward.modelType === 'crystal_pylon' && (
        <group>
          <mesh ref={spinRef} position={[0, 1.35, 0]} castShadow>
            <octahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.6}
              roughness={0.15}
            />
          </mesh>
        </group>
      )}

      {reward.modelType === 'victory_banner' && (
        <group>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 1.8, 8]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.55, 0.25]} castShadow>
            <boxGeometry args={[0.06, 0.75, 0.55]} />
            <meshStandardMaterial color="#10b981" roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ============================================================================
 * 2. DUMMY LEVEL MARKER VISIBLE FROM ABOVE EARTH ON THE PLANET SPHERE
 * ============================================================================ */
export function PlanetDummyLevelTotem({
  level,
  stars,
  color,
}: {
  level: number;
  stars: number;
  color: string;
}) {
  const ringGroupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += delta * 0.9;
      ringGroupRef.current.position.y = 2.6 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    }
  });

  const ringCount = Math.min(5, Math.max(1, stars));
  const totemScale = 1 + Math.min(0.85, (level - 8) * 0.06);

  return (
    <group ref={ringGroupRef} position={[0, 2.6, 0]} scale={totemScale}>
      {/* Stacked Tier Rings representing Level from orbit */}
      {Array.from({ length: ringCount }).map((_, idx) => (
        <mesh
          key={idx}
          position={[0, idx * 0.22, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.62 - idx * 0.07, 0.035, 8, 24]} />
          <meshBasicMaterial color={idx % 2 === 0 ? color : '#fde047'} />
        </mesh>
      ))}
      {/* Floating Level Crown Octahedron */}
      <mesh position={[0, ringCount * 0.22 + 0.22, 0]}>
        <octahedronGeometry args={[0.24, 0]} />
        <meshBasicMaterial color="#fde047" />
      </mesh>
    </group>
  );
}

/* ============================================================================
 * 3. COMPOSITE 3D FREE FIRE CHARACTER MODEL (FOR SQUARE WALKING & TRAINING ROOM)
 * ============================================================================ */
export function CompositeFFPlayerCharacter({
  walkPhase = 0,
  isWalking = false,
  holdingDevice = false,
  jacketColor = '#0ea5e9',
}: {
  walkPhase?: number;
  isWalking?: boolean;
  holdingDevice?: boolean;
  jacketColor?: string;
}) {
  const swing = isWalking ? Math.sin(walkPhase * 8) * 0.55 : 0;

  return (
    <group>
      {/* Left & Right Legs */}
      <group position={[-0.14, 0.72, 0]} rotation={[swing, 0, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.16, 0.64, 0.18]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.66, 0.04]}>
          <boxGeometry args={[0.18, 0.12, 0.26]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>
      <group position={[0.14, 0.72, 0]} rotation={[-swing, 0, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <boxGeometry args={[0.16, 0.64, 0.18]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.66, 0.04]}>
          <boxGeometry args={[0.18, 0.12, 0.26]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>

      {/* Torso & Tactical Vest */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <boxGeometry args={[0.44, 0.62, 0.26]} />
        <meshStandardMaterial color={jacketColor} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.14, 0.14]}>
        <boxGeometry args={[0.3, 0.42, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.18, 0.17]}>
        <boxGeometry args={[0.18, 0.08, 0.02]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Head, Hair & Tactical Visor */}
      <group position={[0, 1.62, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#e2a77f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.07, -0.02]}>
          <sphereGeometry args={[0.19, 14, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0.16]}>
          <boxGeometry args={[0.24, 0.07, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Left & Right Arms */}
      <group
        position={[-0.29, 1.32, 0]}
        rotation={[holdingDevice ? -0.85 : -swing * 0.8, holdingDevice ? 0.25 : 0, 0]}
      >
        <mesh position={[0, -0.24, 0]} castShadow>
          <boxGeometry args={[0.13, 0.5, 0.14]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} />
        </mesh>
      </group>
      <group
        position={[0.29, 1.32, 0]}
        rotation={[holdingDevice ? -0.85 : swing * 0.8, holdingDevice ? -0.25 : 0, 0]}
      >
        <mesh position={[0, -0.24, 0]} castShadow>
          <boxGeometry args={[0.13, 0.5, 0.14]} />
          <meshStandardMaterial color={jacketColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Glowing Logging Tablet Device when in FF Training Room */}
      {holdingDevice && (
        <group position={[0, 1.12, 0.42]} rotation={[-0.45, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.46, 0.32, 0.04]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.4, 0.26]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      )}
    </group>
  );
}

let cachedCoCSquareTexture: THREE.CanvasTexture | null = null;

export function getCoCSquareTexture(): THREE.CanvasTexture {
  if (cachedCoCSquareTexture) return cachedCoCSquareTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  const drawDiamondOverlay = () => {
    const cx = 508;
    const cy = 472;
    const rx = 376;
    const ry = 369;

    // Crisp 44x44 isometric diamond lawn grid inside the clearing
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy);
    ctx.closePath();
    ctx.clip();

    const cells = 44;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const u0 = r / cells;
        const v0 = c / cells;
        const u1 = (r + 1) / cells;
        const v1 = (c + 1) / cells;

        const p0x = cx + (u0 - v0) * rx;
        const p0y = cy - ry + (u0 + v0) * ry;
        const p1x = cx + (u1 - v0) * rx;
        const p1y = cy - ry + (u1 + v0) * ry;
        const p2x = cx + (u1 - v1) * rx;
        const p2y = cy - ry + (u1 + v1) * ry;
        const p3x = cx + (u0 - v1) * rx;
        const p3y = cy - ry + (u0 + v1) * ry;

        ctx.fillStyle =
          (r + c) % 2 === 0 ? 'rgba(186, 238, 88, 0.16)' : 'rgba(118, 178, 30, 0.12)';
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(195, 242, 102, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.lineTo(cx + rx, cy);
    ctx.lineTo(cx, cy + ry);
    ctx.lineTo(cx - rx, cy);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  // Base Clash-of-Clans diamond lawn, SW beach/sea, NE river, and forest perimeter
  ctx.fillStyle = '#204512';
  ctx.fillRect(0, 0, 1024, 1024);

  const seaGrad = ctx.createLinearGradient(0, 520, 460, 1024);
  seaGrad.addColorStop(0, '#9c7a54');
  seaGrad.addColorStop(0.16, '#3674ab');
  seaGrad.addColorStop(0.55, '#245687');
  seaGrad.addColorStop(1, '#183d66');
  ctx.fillStyle = seaGrad;
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.lineTo(520, 1024);
  ctx.lineTo(0, 1024);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#459ad1';
  ctx.beginPath();
  ctx.moveTo(540, 0);
  ctx.lineTo(1024, 340);
  ctx.lineTo(1024, 210);
  ctx.lineTo(680, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#78b42c';
  ctx.beginPath();
  ctx.moveTo(508, 38);
  ctx.lineTo(950, 472);
  ctx.lineTo(508, 906);
  ctx.lineTo(66, 472);
  ctx.closePath();
  ctx.fill();

  const lawnGrad = ctx.createRadialGradient(508, 472, 20, 508, 472, 390);
  lawnGrad.addColorStop(0, '#b3e65a');
  lawnGrad.addColorStop(0.65, '#a2d848');
  lawnGrad.addColorStop(1, '#92c83b');
  ctx.fillStyle = lawnGrad;
  ctx.beginPath();
  ctx.moveTo(508, 103);
  ctx.lineTo(884, 472);
  ctx.lineTo(508, 841);
  ctx.lineTo(132, 472);
  ctx.closePath();
  ctx.fill();

  drawDiamondOverlay();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cachedCoCSquareTexture = tex;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 1024, 1024);
    drawDiamondOverlay();
    tex.needsUpdate = true;
  };
  img.src = '/assets/aistudio/images_e519247d.jpg';

  return tex;
}

/* ============================================================================
 * 3B. COMPOSITE 3D CLASH-OF-CLANS VILLAGE BUILDINGS, OBSTACLES & RUINED CASTLE
 * ============================================================================ */
function CoCDiamondTilePad({
  size = 3.2,
  color = '#659924',
  innerColor = '#74ad2a',
}: {
  size?: number;
  color?: string;
  innerColor?: string;
}) {
  return (
    <group>
      {/* Soft Ground Contact Shadow */}
      <mesh position={[0.14, 0.015, 0.14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 1.06, size * 1.06]} />
        <meshBasicMaterial color="#142909" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      {/* Outer Olive-Green Diamond Tile Footprint */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[size, 0.04, size]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      {/* Inner Trimmed Turf Pad */}
      <mesh position={[0, 0.048, 0]}>
        <boxGeometry args={[size * 0.9, 0.02, size * 0.9]} />
        <meshStandardMaterial color={innerColor} roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Sunlit White/Lime-Topped Round CoC Broadleaf Tree (Multi-Lobed 3D Model) */
function CoCSunlitRoundTree3D({
  position,
  scale = 0.85,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Crisp CoC Ground Contact Shadow */}
      <mesh position={[0.24, 0.02, 0.24]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 16]} />
        <meshBasicMaterial color="#1a360b" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Sturdy Brown Trunk */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.18, 0.3, 0.84, 8]} />
        <meshStandardMaterial color="#6b3e1e" roughness={0.88} />
      </mesh>
      {/* Multi-Lobed Deep Green Lower Canopy */}
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.82, 14, 12]} />
        <meshStandardMaterial color="#4d8c1e" roughness={0.75} />
      </mesh>
      <mesh position={[0.32, 0.98, 0.22]}>
        <sphereGeometry args={[0.58, 12, 10]} />
        <meshStandardMaterial color="#3f7a16" roughness={0.78} />
      </mesh>
      <mesh position={[-0.3, 1.02, 0.2]}>
        <sphereGeometry args={[0.56, 12, 10]} />
        <meshStandardMaterial color="#589e24" roughness={0.72} />
      </mesh>
      {/* Medium Lime Mid Canopy */}
      <mesh position={[-0.08, 1.36, -0.06]}>
        <sphereGeometry args={[0.72, 14, 12]} />
        <meshStandardMaterial color="#84cc16" roughness={0.65} />
      </mesh>
      {/* Iconic CoC Sunlit Cream-White Top Crown Lobes */}
      <mesh position={[-0.14, 1.62, -0.12]}>
        <sphereGeometry args={[0.54, 12, 10]} />
        <meshStandardMaterial color="#f7fee7" roughness={0.48} />
      </mesh>
      <mesh position={[0.18, 1.52, -0.08]}>
        <sphereGeometry args={[0.4, 10, 10]} />
        <meshStandardMaterial color="#ecfccb" roughness={0.52} />
      </mesh>
    </group>
  );
}

/** Multi-Tiered Conifer Pine Tree (Used around Ruined Clan Castle & Perimeter) */
function CoCPineTree3D({
  position,
  scale = 0.88,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0.18, 0.02, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.82, 14]} />
        <meshBasicMaterial color="#142909" transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 0.7, 7]} />
        <meshStandardMaterial color="#5c3418" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <coneGeometry args={[0.78, 1.05, 8]} />
        <meshStandardMaterial color="#155e4b" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <coneGeometry args={[0.6, 0.9, 8]} />
        <meshStandardMaterial color="#1f7a5c" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.98, 0]}>
        <coneGeometry args={[0.38, 0.7, 8]} />
        <meshStandardMaterial color="#a7f3d0" roughness={0.55} />
      </mesh>
    </group>
  );
}

/** Multi-Faceted 3D Craggy Grey Boulder Cluster */
function CoCCraggyBoulder3D({
  position,
  scale = 0.88,
  rotationY = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0.16, 0.02, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 14]} />
        <meshBasicMaterial color="#142909" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.38, 0]} scale={[1.15, 0.78, 1.0]}>
        <dodecahedronGeometry args={[0.68, 0]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      <mesh position={[0.38, 0.26, 0.26]} scale={[0.9, 0.68, 0.85]}>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh position={[-0.1, 0.66, -0.08]} scale={[0.78, 0.42, 0.72]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.72} />
      </mesh>
    </group>
  );
}

/** 3D Fallen Log, Tree Stump, or Round Bush Obstacle */
function CoCSmallObstacle3D({
  position,
  type,
  rotationY = 0,
  scale = 0.88,
}: {
  position: [number, number, number];
  type: 'log' | 'stump' | 'bush' | 'mushroom';
  rotationY?: number;
  scale?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0.1, 0.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 12]} />
        <meshBasicMaterial color="#142909" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {type === 'log' && (
        <group>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.2, 1.1, 8]} />
            <meshStandardMaterial color="#6b3e1e" roughness={0.88} />
          </mesh>
          <mesh position={[0.1, 0.35, 0]} scale={[1.3, 0.38, 0.65]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color="#65a30d" roughness={0.8} />
          </mesh>
        </group>
      )}
      {type === 'stump' && (
        <group>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.24, 0.34, 0.44, 8]} />
            <meshStandardMaterial color="#784421" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.02, 8]} />
            <meshStandardMaterial color="#fde68a" roughness={0.7} />
          </mesh>
        </group>
      )}
      {type === 'bush' && (
        <group>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.38, 10, 10]} />
            <meshStandardMaterial color="#65a30d" roughness={0.75} />
          </mesh>
          <mesh position={[-0.08, 0.48, -0.05]}>
            <sphereGeometry args={[0.26, 10, 10]} />
            <meshStandardMaterial color="#d9f99d" roughness={0.62} />
          </mesh>
        </group>
      )}
      {type === 'mushroom' && (
        <group>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.11, 0.15, 0.36, 8]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.38, 0]} scale={[1, 0.65, 1]}>
            <sphereGeometry args={[0.28, 10, 10]} />
            <meshStandardMaterial color="#ef4444" roughness={0.55} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Central Ground Town Hall 3D Model (Loaded from User's town_hall.glb) on 4x4 Diamond Pad */
export function CoCCentralVillageHall3D({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <group
      rotation={[0, Math.PI / 4, 0]}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <CoCDiamondTilePad size={4.4} color="#5e8f1f" innerColor="#6ca325" />
      <group position={[0, 0.08, 0]}>
        <TownHallModel3D scale={2.35} />
      </group>
    </group>
  );
}

/** Ruined Stone Clan Castle Overgrown with Vines & Surrounded by 6 Pine Trees */
function CoCRuinedClanCastle3D() {
  return (
    <group position={[-1.8, 0, 7.2]}>
      {/* Ruined Castle Center Keep */}
      <group rotation={[0, Math.PI / 4, 0]}>
        <CoCDiamondTilePad size={3.2} color="#55821c" innerColor="#649622" />
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[1.95, 0.95, 1.95]} />
          <meshStandardMaterial color="#64748b" roughness={0.88} />
        </mesh>
        {/* Broken Crumbled Battlement Towers */}
        <mesh position={[-0.68, 1.1, -0.68]}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        <mesh position={[0.68, 0.98, 0.64]}>
          <boxGeometry args={[0.55, 0.42, 0.55]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        {/* Mossy Overgrowth & Timber Roof Remnant */}
        <mesh position={[0.14, 1.05, -0.14]}>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
        </mesh>
      </group>
      {/* Surrounding Pine Grove & Boulders */}
      <CoCPineTree3D position={[-1.95, 0, -0.75]} scale={0.85} />
      <CoCPineTree3D position={[-1.5, 0, 1.15]} scale={0.92} />
      <CoCPineTree3D position={[-0.35, 0, 1.75]} scale={0.82} />
      <CoCPineTree3D position={[1.45, 0, -1.1]} scale={0.88} />
      <CoCPineTree3D position={[1.9, 0, 0.25]} scale={0.8} />
      <CoCCraggyBoulder3D position={[1.65, 0, 1.4]} scale={0.78} rotationY={0.8} />
      <CoCSmallObstacle3D position={[-0.2, 0, -1.75]} type="stump" scale={0.88} />
      <CoCSmallObstacle3D position={[-2.4, 0, 1.65]} type="bush" scale={0.8} />
    </group>
  );
}

/** SW Beach 3D Wrecked Wooden Boat & Coastal Boulders */
function CoCBeachShipwreckBoat3D({ onClick }: { onClick?: () => void }) {
  return (
    <group
      position={[-18.8, 0.06, 14.2]}
      rotation={[0.08, -Math.PI / 4, 0.12]}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {/* Boat Hull */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.52, 3.2]} />
        <meshStandardMaterial color="#8c4620" roughness={0.8} />
      </mesh>
      {/* Tapered Bow & Stern */}
      <mesh position={[0, 0.34, -1.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.72, 0.95, 4]} />
        <meshStandardMaterial color="#78350f" roughness={0.82} />
      </mesh>
      {/* Wooden Rower Benches */}
      {[-0.8, 0, 0.8].map((bz, i) => (
        <mesh key={i} position={[0, 0.56, bz]} castShadow>
          <boxGeometry args={[1.32, 0.08, 0.28]} />
          <meshStandardMaterial color="#b45309" roughness={0.75} />
        </mesh>
      ))}
      {/* Tilted Broken Mast */}
      <mesh position={[0, 1.15, -0.2]} rotation={[0.25, 0, -0.32]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 1.9, 7]} />
        <meshStandardMaterial color="#5c3418" roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ============================================================================
 * 4. CLASH-OF-CLANS SQUARE BASE SCENE WITH FULL 3D VILLAGE MODELS & OBSTACLES
 * ============================================================================ */
export function SquareBaseSceneR3F({
  sectorId,
  sectorName,
  sectorColor,
  sectorLevel,
  shops,
  clanRewards,
  keysRef,
  uiSteerRef,
  squareCamMode,
  onNearShopChange,
  onSelectShopForLog,
  onExitSquareToPlanet,
}: {
  sectorId: string;
  sectorName: string;
  sectorColor: string;
  sectorLevel: number;
  shops: ShopTrackerDefinition[];
  clanRewards: ClanWarRewardItem[];
  keysRef: React.MutableRefObject<Record<string, boolean>>;
  uiSteerRef: React.MutableRefObject<{ forward: number; turn: number; gallop: boolean; jump: boolean }>;
  squareCamMode: 'ff_third_person' | 'coc_overview';
  onNearShopChange: (shop: ShopTrackerDefinition | null) => void;
  onSelectShopForLog: (shop: ShopTrackerDefinition) => void;
  onExitSquareToPlanet: () => void;
}) {
  const playerGroupRef = useRef<THREE.Group>(null);
  const campfireFlameRef = useRef<THREE.Mesh>(null);
  const playerStateRef = useRef({
    x: 4.5,
    z: 11.5,
    heading: Math.PI, // Facing North toward the 3D Village Compound & Sky Staircase
    walkPhase: 0,
    isWalking: false,
    y: 0,
    vy: 0,
  });
  const lastProximityCheckRef = useRef(0);
  const { camera } = useThree();
  const smoothCamPos = useRef(new THREE.Vector3(0, 39.5, 14.5));
  const smoothLookAt = useRef(new THREE.Vector3(0, 0, 0.6));

  // Shared Clash-of-Clans Diamond Clearing Texture (/assets/aistudio/images_e519247d.jpg + 44x44 grid)
  const lawnTexture = useMemo(() => getCoCSquareTexture(), []);

  // Position the interactive Tracker Shops as the authentic 3D Clash-of-Clans Village Cluster around the Central Hall!
  const villageShops = useMemo(() => {
    const cocClusterSlots: Array<[number, number, 'elixir' | 'gold_storage' | 'cannon_huts' | 'gold_mine']> = [
      [0.4, -0.4, 'elixir'],        // Left of Central Hall: Elixir Collector & Pink Vat
      [4.4, 3.6, 'gold_storage'],   // Below Central Hall: Gold Storage & Bullion Cart
      [3.8, -5.2, 'cannon_huts'],   // Above Central Hall: Builder Huts & Cannon Turret
      [8.8, -3.4, 'gold_mine'],     // Right-Top of Central Hall: Gold Mine & Ore Cart
    ];
    return shops.map((sh, idx) => {
      const slot = cocClusterSlots[idx % cocClusterSlots.length];
      return {
        ...sh,
        renderX: slot[0],
        renderZ: slot[1],
        cocType: slot[2],
      };
    });
  }, [shops]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const k = keysRef.current;
    const ui = uiSteerRef.current;

    if (campfireFlameRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 11) * 0.16;
      campfireFlameRef.current.scale.set(s, s * 1.15, s);
    }

    let forward = ui.forward;
    let turn = ui.turn;
    if (k.KeyW || k.ArrowUp) forward = 1;
    if (k.KeyS || k.ArrowDown) forward = -0.75;
    if (k.KeyA || k.ArrowLeft) turn = -1;
    if (k.KeyD || k.ArrowRight) turn = 1;

    const p = playerStateRef.current;
    const sprintMult = ui.gallop || k.ShiftLeft || k.ShiftRight ? 1.55 : 1.0;

    if (Math.abs(turn) > 0.05) {
      p.heading -= turn * 2.8 * dt;
    }

    if (Math.abs(forward) > 0.05) {
      const moveSpeed = 6.5 * sprintMult * forward;
      const nx = p.x + Math.sin(p.heading) * moveSpeed * dt;
      const nz = p.z + Math.cos(p.heading) * moveSpeed * dt;
      // Allow walking north up the 24-Step Sky Staircase (Z < -17.5) to the Floating Main Hall
      if (nz < -17.5) {
        const maxWidth = nz < -28.0 ? 4.2 : 2.3;
        p.x = THREE.MathUtils.clamp(nx, -maxWidth, maxWidth);
        p.z = THREE.MathUtils.clamp(nz, -35.5, 18.5);
      } else {
        p.x = THREE.MathUtils.clamp(nx, -17.5, 17.5);
        p.z = THREE.MathUtils.clamp(nz, -35.5, 18.5);
      }
      p.walkPhase += Math.abs(moveSpeed) * dt * 0.45;
      p.isWalking = true;
    } else {
      p.isWalking = false;
    }

    // Compute floor height (0 on the clearing lawn, rising up the 24-step Sky Staircase from Z=-17.5 to Z=-28.5 up to Y=11.5 above the 3D forest trees)
    let floorY = 0;
    if (p.z < -17.5 && Math.abs(p.x) <= 4.5) {
      const stairProgress = THREE.MathUtils.clamp((-17.5 - p.z) / 11.0, 0, 1);
      floorY = stairProgress * 11.5;
    }

    // Jump & stair-climbing physics
    if ((ui.jump || k.Space) && p.y <= floorY + 0.05) {
      p.vy = 6.2;
      ui.jump = false;
    }
    if (p.y > floorY || p.vy > 0) {
      p.y += p.vy * dt;
      p.vy -= 16.0 * dt;
      if (p.y <= floorY) {
        p.y = floorY;
        p.vy = 0;
      }
    } else {
      p.y = floorY;
    }

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(p.x, p.y, p.z);
      playerGroupRef.current.rotation.y = p.heading;
    }

    // Camera follow (Free Fire Third-Person Chase vs CoC Isometric Diamond Top View)
    if (squareCamMode === 'ff_third_person') {
      const backDist = 5.4;
      const upHeight = 2.8;
      const desiredCam = new THREE.Vector3(
        p.x - Math.sin(p.heading) * backDist,
        p.y + upHeight,
        p.z - Math.cos(p.heading) * backDist,
      );
      const desiredLook = new THREE.Vector3(
        p.x + Math.sin(p.heading) * 2.2,
        p.y + 1.35,
        p.z + Math.cos(p.heading) * 2.2,
      );
      const damp = 1 - Math.exp(-9 * dt);
      smoothCamPos.current.lerp(desiredCam, damp);
      smoothLookAt.current.lerp(desiredLook, damp);
      camera.position.copy(smoothCamPos.current);
      camera.up.set(0, 1, 0);
      camera.lookAt(smoothLookAt.current);
    } else {
      // Framing the entire 3D Square Base (stone-walled clearing, 3D forest canopy, southern beach, Town Hall & Sky Staircase)
      const desiredCam = new THREE.Vector3(0, 48.0, 22.0);
      const desiredLook = new THREE.Vector3(0, 0, -1.0);
      const damp = 1 - Math.exp(-7 * dt);
      smoothCamPos.current.lerp(desiredCam, damp);
      smoothLookAt.current.lerp(desiredLook, damp);
      camera.position.copy(smoothCamPos.current);
      camera.up.set(0, 1, 0);
      camera.lookAt(smoothLookAt.current);
    }

    // Check proximity to 3D Village Shops at ~8Hz
    if (state.clock.elapsedTime - lastProximityCheckRef.current > 0.12) {
      lastProximityCheckRef.current = state.clock.elapsedTime;
      let closestShop: ShopTrackerDefinition | null = null;
      let minDist = 4.8;
      for (const sh of villageShops) {
        const d = Math.hypot(p.x - sh.renderX, p.z - sh.renderZ);
        if (d < minDist) {
          minDist = d;
          closestShop = sh;
        }
      }
      onNearShopChange(closestShop);
    }
  });

  const placedRewardsHere = clanRewards.filter((r) => r.placedLocation === sectorId);

  return (
    <group>
      {/* Realistic Daytime Sky Dome with Clouds (No circular ground / space vacuum on ground) */}
      <DaytimeSkyDomeWithClouds radius={190} />

      {/* Overhead Sunny Daylight Fill for the 3D Square Base & Town Hall */}
      <hemisphereLight args={['#fffbeb', '#365314', 0.85]} />
      <directionalLight position={[12, 42, 18]} intensity={0.75} />

      {/* 1. User's Custom 3D Square Base Terrain Model (square_base.glb) + Extended Horizon Ground */}
      <mesh position={[0, -5.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[480, 480]} />
        <meshStandardMaterial color="#445c2a" roughness={0.94} />
      </mesh>
      <SquareBaseTerrainModel3D scale={40} fallbackMap={lawnTexture} />

      {/* 2. CENTRAL 3D CLASH-OF-CLANS VILLAGE COMPOUND (Orange Hall + 3D Collector/Storage/Cannon/Mine Shops + Army Camp) */}
      {/* Central Orange-Roofed CoC Village Hall at (4.8, 0, -0.8) */}
      <group position={[4.8, 0, -0.8]}>
        <CoCCentralVillageHall3D
          onClick={() => {
            if (villageShops[0]) onSelectShopForLog(villageShops[0]);
          }}
        />
      </group>

      {/* Interactive 3D Village Buildings (Each mapped to a Sector Shop for FF Training Room Logging!) */}
      {villageShops.map((shop) => (
        <group
          key={shop.id}
          position={[shop.renderX, 0, shop.renderZ]}
          rotation={[0, Math.PI / 4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectShopForLog(shop);
          }}
        >
          <CoCDiamondTilePad size={3.1} color="#5e8f1f" innerColor="#6ca325" />

          {shop.cocType === 'elixir' && (
            <group>
              {/* Timber & Brass Frame */}
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[1.1, 1.25, 0.4, 12]} />
                <meshStandardMaterial color="#78350f" roughness={0.8} />
              </mesh>
              {/* Glowing Pink-Magenta Elixir Vat */}
              <mesh position={[0, 1.05, 0]}>
                <sphereGeometry args={[0.92, 16, 14]} />
                <meshStandardMaterial
                  color="#ec4899"
                  emissive="#db2777"
                  emissiveIntensity={0.35}
                  roughness={0.25}
                />
              </mesh>
              {/* Brass Top Collector Funnel */}
              <mesh position={[0, 1.98, 0]}>
                <cylinderGeometry args={[0.45, 0.25, 0.42, 10]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0.25} />
              </mesh>
            </group>
          )}

          {shop.cocType === 'gold_storage' && (
            <group>
              {/* Reinforced Timber Vault Box */}
              <mesh position={[0, 0.65, 0]}>
                <boxGeometry args={[2.1, 1.2, 2.1]} />
                <meshStandardMaterial color="#78350f" roughness={0.75} />
              </mesh>
              {/* Gleaming Pile of 3D Gold Bullion on Top */}
              <mesh position={[0, 1.32, 0]}>
                <dodecahedronGeometry args={[0.85, 1]} />
                <meshStandardMaterial color="#facc15" roughness={0.28} metalness={0.25} />
              </mesh>
              <mesh position={[0.45, 1.15, 0.35]}>
                <boxGeometry args={[0.65, 0.35, 0.42]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.25} />
              </mesh>
            </group>
          )}

          {shop.cocType === 'cannon_huts' && (
            <group>
              {/* Builder Hut 1 */}
              <group position={[-0.65, 0, -0.45]}>
                <mesh position={[0, 0.55, 0]}>
                  <boxGeometry args={[1.05, 1.0, 1.05]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh position={[0, 1.32, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[0.92, 0.65, 4]} />
                  <meshStandardMaterial color="#334155" roughness={0.6} />
                </mesh>
              </group>
              {/* 3D Defense Cannon Turret */}
              <group position={[0.62, 0, 0.45]}>
                <mesh position={[0, 0.28, 0]}>
                  <cylinderGeometry args={[0.62, 0.75, 0.45, 10]} />
                  <meshStandardMaterial color="#78350f" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.72, 0.18]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
                  <cylinderGeometry args={[0.28, 0.38, 1.25, 12]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.25} />
                </mesh>
              </group>
            </group>
          )}

          {shop.cocType === 'gold_mine' && (
            <group>
              {/* Timber Mine Shaft & Sloped Roof */}
              <mesh position={[-0.35, 0.65, -0.25]}>
                <boxGeometry args={[1.55, 1.2, 1.55]} />
                <meshStandardMaterial color="#78350f" roughness={0.82} />
              </mesh>
              <mesh position={[-0.35, 1.45, -0.25]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[1.35, 0.72, 4]} />
                <meshStandardMaterial color="#b45309" roughness={0.65} />
              </mesh>
              {/* Ore Cart filled with Gold */}
              <mesh position={[0.68, 0.38, 0.55]}>
                <boxGeometry args={[0.78, 0.52, 0.62]} />
                <meshStandardMaterial color="#334155" roughness={0.5} />
              </mesh>
              <mesh position={[0.68, 0.72, 0.55]}>
                <dodecahedronGeometry args={[0.34, 0]} />
                <meshStandardMaterial color="#facc15" roughness={0.3} metalness={0.25} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* 3D Army Camp Fire Pit on 4x4 Diamond Pad at (9.4, 0, 1.2) */}
      <group position={[9.4, 0, 1.2]} rotation={[0, Math.PI / 4, 0]}>
        <CoCDiamondTilePad size={3.9} color="#78b82a" innerColor="#84cc16" />
        {/* Circle of Hearth Stones */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.72, 0.85, 0.22, 10]} />
          <meshStandardMaterial color="#64748b" roughness={0.88} />
        </mesh>
        {/* Flickering 3D Roaring Campfire Flame */}
        <mesh ref={campfireFlameRef} position={[0, 0.58, 0]}>
          <coneGeometry args={[0.45, 0.95, 7]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <coneGeometry args={[0.26, 0.65, 6]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
        {/* 3 Miniature 3D Troops Guarding the Army Camp */}
        {[
          [-1.15, -0.95, '#38bdf8'],
          [1.15, -0.85, '#f43f5e'],
          [-0.85, 1.15, '#fbbf24'],
        ].map(([tx, tz, tCol], idx) => (
          <group key={idx} position={[tx as number, 0, tz as number]}>
            <mesh position={[0, 0.35, 0]} castShadow>
              <capsuleGeometry args={[0.16, 0.32, 4, 8]} />
              <meshStandardMaterial color={tCol as string} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.74, 0]} castShadow>
              <sphereGeometry args={[0.15, 10, 10]} />
              <meshStandardMaterial color="#fcd34d" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. RUINED STONE CLAN CASTLE & OVERGROWN PINE GROVE AT (-1.4, 0, 7.6) */}
      <CoCRuinedClanCastle3D />

      {/* 4. 3D NATURAL OBSTACLES FIELD INSIDE THE 3D SQUARE BASE CLEARING */}
      {/* 12 Iconic Puffy Sunlit White/Lime-Topped 3D Round Trees */}
      <CoCSunlitRoundTree3D position={[-9.5, 0, -13.8]} scale={1.12} />
      <CoCSunlitRoundTree3D position={[-14.8, 0, -7.8]} scale={1.15} />
      <CoCSunlitRoundTree3D position={[-15.2, 0, -1.2]} scale={1.12} />
      <CoCSunlitRoundTree3D position={[-10.8, 0, 8.8]} scale={1.12} />
      <CoCSunlitRoundTree3D position={[-3.2, 0, 14.8]} scale={1.12} />
      <CoCSunlitRoundTree3D position={[-0.8, 0, 16.5]} scale={1.15} />
      <CoCSunlitRoundTree3D position={[4.2, 0, 14.8]} scale={1.1} />
      <CoCSunlitRoundTree3D position={[14.8, 0, 8.2]} scale={1.12} />
      <CoCSunlitRoundTree3D position={[15.4, 0, -4.5]} scale={1.15} />
      <CoCSunlitRoundTree3D position={[14.6, 0, -12.4]} scale={1.1} />
      <CoCSunlitRoundTree3D position={[0.4, 0, -6.8]} scale={0.82} />
      <CoCSunlitRoundTree3D position={[-12.5, 0, -7.2]} scale={0.88} />

      {/* 9 Multi-Faceted 3D Craggy Grey Boulders */}
      <CoCCraggyBoulder3D position={[-13.8, 0, -11.5]} scale={1.05} rotationY={0.4} />
      <CoCCraggyBoulder3D position={[-15.4, 0, 3.6]} scale={1.1} rotationY={1.2} />
      <CoCCraggyBoulder3D position={[-9.2, 0, 12.8]} scale={1.0} rotationY={2.1} />
      <CoCCraggyBoulder3D position={[5.2, 0, -14.8]} scale={1.05} rotationY={0.9} />
      <CoCCraggyBoulder3D position={[15.2, 0, 4.8]} scale={0.95} rotationY={1.7} />
      {/* Coastal 3D Boulders along the SW Sandy Shoreline */}
      <CoCCraggyBoulder3D position={[-15.6, 0, 9.2]} scale={1.15} rotationY={0.5} />
      <CoCCraggyBoulder3D position={[-14.5, 0, 12.8]} scale={1.05} rotationY={1.4} />
      <CoCCraggyBoulder3D position={[-12.2, 0, 15.8]} scale={1.2} rotationY={2.3} />
      <CoCCraggyBoulder3D position={[-8.8, 0, 16.8]} scale={1.1} rotationY={0.8} />

      {/* 12 3D Fallen Logs, Stumps, Bushes & Mushrooms */}
      <CoCSmallObstacle3D position={[-14.4, 0, 4.8]} type="stump" scale={1.05} />
      <CoCSmallObstacle3D position={[-13.2, 0, 6.8]} type="stump" scale={0.95} />
      <CoCSmallObstacle3D position={[-5.4, 0, 13.8]} type="log" rotationY={0.65} scale={1.05} />
      <CoCSmallObstacle3D position={[-2.4, 0, 15.8]} type="mushroom" scale={0.95} />
      <CoCSmallObstacle3D position={[11.8, 0, 11.6]} type="stump" scale={1.0} />
      <CoCSmallObstacle3D position={[13.6, 0, 9.4]} type="bush" scale={1.05} />
      <CoCSmallObstacle3D position={[-3.2, 0, -14.8]} type="stump" scale={1.1} />
      <CoCSmallObstacle3D position={[10.5, 0, -13.8]} type="log" rotationY={-0.55} scale={1.0} />
      <CoCSmallObstacle3D position={[-9.5, 0, -9.2]} type="bush" scale={0.9} />
      <CoCSmallObstacle3D position={[-14.8, 0, -2.5]} type="bush" scale={0.95} />
      <CoCSmallObstacle3D position={[7.2, 0, -8.5]} type="mushroom" scale={0.88} />
      <CoCSmallObstacle3D position={[6.2, 0, 9.8]} type="stump" scale={0.9} />

      {/* 5. 3D WRECKED WOODEN BOAT ON THE SW SANDY SHORELINE */}
      <group position={[3.8, 0, 2.2]}>
        <CoCBeachShipwreckBoat3D onClick={onExitSquareToPlanet} />
      </group>

      {/* 6. CLAN WAR TROPHIES PLACED IN THIS SQUARE */}
      {placedRewardsHere.map((reward, idx) => (
        <group key={reward.id} position={[-7.5 + idx * 2.4, 0, -3.5]}>
          <ClanWarTrophyMesh reward={reward} scale={0.95} />
        </group>
      ))}

      {/* 7. WAITING 3D WARHORSE AT THE NW GATE (Click to Ride Back to Planet) */}
      <group
        position={[-13.8, 0, -14.8]}
        rotation={[0, Math.PI / 4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onExitSquareToPlanet();
        }}
      >
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.15, 24]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.45, 0.45, 1.1]} />
          <meshStandardMaterial color="#8c4620" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.2, 0.42]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.22, 0.48, 0.24]} />
          <meshStandardMaterial color="#8c4620" roughness={0.65} />
        </mesh>
      </group>

      {/* 8. GRAND 24-STEP 3D SKY STAIRCASE & FLOATING SKY MAIN HALL RISING ABOVE THE 3D FOREST CANOPY */}
      <group>
        {[-1.9, 1.9].map((px) => (
          <group key={px} position={[px, 0, -17.5]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.22, 0.28, 2.2, 8]} />
              <meshStandardMaterial color="#334155" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.35, 0]}>
              <octahedronGeometry args={[0.24, 0]} />
              <meshBasicMaterial color={sectorColor} />
            </mesh>
          </group>
        ))}

        {Array.from({ length: 24 }).map((_, i) => {
          const t = (i + 0.5) / 24;
          const sz = -17.5 - t * 11.0;
          const sy = t * 11.5;
          return (
            <group key={i} position={[0, sy, sz]}>
              <mesh>
                <boxGeometry args={[3.2, 0.22, 0.42]} />
                <meshStandardMaterial color="#334155" roughness={0.55} metalness={0.2} />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <boxGeometry args={[2.7, 0.04, 0.28]} />
                <meshBasicMaterial color={i % 2 === 0 ? sectorColor : '#fde047'} />
              </mesh>
              {i % 4 === 0 && (
                <>
                  <mesh position={[-1.55, 0.5, 0]}>
                    <boxGeometry args={[0.12, 1.0, 0.12]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.4} />
                  </mesh>
                  <mesh position={[1.55, 0.5, 0]}>
                    <boxGeometry args={[0.12, 1.0, 0.12]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.4} />
                  </mesh>
                </>
              )}
            </group>
          );
        })}

        <mesh position={[0, 5.5, -23.0]} rotation={[Math.atan2(11.5, 11.0), 0, 0]}>
          <boxGeometry args={[2.0, 0.3, 15.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.25} />
        </mesh>
      </group>

      {/* FLOATING SKY ISLAND & USER'S 3D MAIN HALL HIGH IN THE AIR OUTSIDE THE SQUARE (0, 11.5, -32.0) */}
      <group position={[0, 11.5, -32.0]}>
        <mesh position={[0, -0.1, 2.4]}>
          <boxGeometry args={[3.6, 0.22, 2.8]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[4.6, 3.8, 0.45, 24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.55} metalness={0.22} />
        </mesh>
        <mesh position={[0, -2.0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[3.5, 3.2, 9]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.2, 0.09, 10, 36]} />
          <meshBasicMaterial color={sectorColor} />
        </mesh>
        <MainHallModel3D scale={2.9} accentColor={sectorColor} showPedestal />
      </group>

      {/* 9. FREE FIRE THIRD-PERSON PLAYER CHARACTER */}
      <group
        ref={playerGroupRef}
        position={[4.5, 0, 11.5]}
        rotation={[0, Math.PI, 0]}
        visible={squareCamMode === 'ff_third_person'}
      >
        <CompositeFFPlayerCharacter
          walkPhase={playerStateRef.current.walkPhase}
          isWalking={playerStateRef.current.isWalking}
          holdingDevice={false}
        />
      </group>
    </group>
  );
}

/* ============================================================================
 * 5. FF TRAINING ROOM GIANT TRACKER SCENE ("trackers look so damn big in this scene")
 * ============================================================================ */
export function TrainingRoomTrackerSceneR3F({
  shop,
  logs,
  pulseTrigger,
}: {
  shop: ShopTrackerDefinition;
  logs: LoggedTrackerEntry[];
  pulseTrigger: number;
}) {
  const { camera } = useThree();
  const beamRef = useRef<THREE.Mesh>(null);
  const holoRingRef = useRef<THREE.Mesh>(null);

  React.useEffect(() => {
    // Low-angle cinematic framing behind and slightly to the right of the player
    // so the player looks normal-sized at z=3.2 and the Giant Tracker towers at z=-6.5!
    camera.up.set(0, 1, 0);
    camera.position.set(2.4, 2.35, 6.8);
    camera.lookAt(0, 4.4, -5.5);
  }, [camera]);

  useFrame((state, delta) => {
    if (holoRingRef.current) {
      holoRingRef.current.rotation.z += delta * 0.65;
    }
    if (beamRef.current) {
      const pulse = 0.45 + Math.sin(state.clock.elapsedTime * 8) * 0.25;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  // Compute bar heights from logged entries for the colossal 3D bar chart on the Giant Tracker
  const barValues = useMemo(() => {
    const shopLogs = logs.filter((l) => l.shopId === shop.id).slice(0, 7);
    const baseBars = [42, 58, 66, 74, 81, 88, 95];
    shopLogs.forEach((l, idx) => {
      baseBars[baseBars.length - 1 - idx] = Math.min(
        100,
        Math.max(18, (l.primaryValue / Math.max(1, shop.defaultTarget)) * 100),
      );
    });
    return baseBars;
  }, [logs, shop, pulseTrigger]);

  return (
    <group>
      {/* 1. FF Training Room Tactical Grid Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#090d16" roughness={0.4} metalness={0.2} />
      </mesh>
      <gridHelper args={[44, 44, shop.accentColor, '#1e293b']} position={[0, 0.02, 0]} />

      {/* 2. Side Training Room Pillars & Neon Strips */}
      {[-9, -3, 3].map((zPos) => (
        <React.Fragment key={zPos}>
          <mesh position={[-11, 4.5, zPos]} castShadow>
            <boxGeometry args={[0.8, 9, 0.8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          <mesh position={[-10.55, 4.5, zPos]}>
            <boxGeometry args={[0.08, 8.2, 0.15]} />
            <meshBasicMaterial color={shop.accentColor} />
          </mesh>
          <mesh position={[11, 4.5, zPos]} castShadow>
            <boxGeometry args={[0.8, 9, 0.8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          <mesh position={[10.55, 4.5, zPos]}>
            <boxGeometry args={[0.08, 8.2, 0.15]} />
            <meshBasicMaterial color={shop.accentColor} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 3. COLOSSAL TOWERING 3D TRACKER MONOLITH (16m Wide x 10.5m Tall!) */}
      <group position={[0, 0, -6.5]}>
        {/* Heavy Cybernetic Pedestal Base */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[17.2, 0.9, 2.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.25} />
        </mesh>
        {/* Outer Armored Monolith Frame */}
        <mesh position={[0, 5.6, -0.35]} castShadow>
          <boxGeometry args={[16.4, 9.8, 0.6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.25} />
        </mesh>
        {/* Glowing Neon Border Frame */}
        <mesh position={[0, 5.6, -0.02]}>
          <boxGeometry args={[15.8, 9.2, 0.08]} />
          <meshBasicMaterial color={shop.accentColor} />
        </mesh>
        {/* Deep Holo-Screen Backdrop */}
        <mesh position={[0, 5.6, 0.05]}>
          <planeGeometry args={[15.3, 8.7]} />
          <meshBasicMaterial color="#040914" />
        </mesh>

        {/* GIANT 3D BAR CHART PILLARS RISING ON THE TRACKER SCREEN */}
        {barValues.map((val, idx) => {
          const barH = Math.max(0.8, (val / 100) * 6.4);
          const bx = -5.4 + idx * 1.45;
          return (
            <group key={idx} position={[bx, 1.4, 0.35]}>
              <mesh position={[0, barH / 2, 0]} castShadow>
                <boxGeometry args={[0.88, barH, 0.45]} />
                <meshStandardMaterial
                  color={idx === barValues.length - 1 ? '#fde047' : shop.accentColor}
                  emissive={idx === barValues.length - 1 ? '#f59e0b' : shop.accentColor}
                  emissiveIntensity={0.45}
                  roughness={0.2}
                />
              </mesh>
              {/* Top Cap */}
              <mesh position={[0, barH + 0.12, 0]}>
                <boxGeometry args={[0.94, 0.14, 0.52]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          );
        })}

        {/* Giant Rotating Telemetry Gauge on the Right Side of the Colossal Screen */}
        <group position={[4.8, 5.8, 0.35]}>
          <mesh ref={holoRingRef}>
            <torusGeometry args={[1.95, 0.12, 12, 36]} />
            <meshBasicMaterial color={shop.accentColor} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.35, 0.08, 10, 32]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.65, 0]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      </group>

      {/* 4. PLAYER STANDING IN FRONT OF THE GIANT TRACKER HOLDING LOGGING DEVICE */}
      <group position={[0, 0, 2.6]} rotation={[0, Math.PI, 0]}>
        <CompositeFFPlayerCharacter
          isWalking={false}
          holdingDevice={true}
          jacketColor={shop.accentColor}
        />
        {/* Glowing Floor Platform under the Player */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.98, 32]} />
          <meshBasicMaterial color={shop.accentColor} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 5. DATA-LOGGING LASER BEAM FROM PLAYER'S DEVICE TO THE GIANT TRACKER */}
      <mesh
        ref={beamRef}
        position={[0, 2.9, -1.8]}
        rotation={[Math.PI / 2 - 0.38, 0, 0]}
      >
        <cylinderGeometry args={[0.18, 0.03, 9.2, 12]} />
        <meshBasicMaterial
          color={shop.accentColor}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ============================================================================
 * 6. LIVE 3D ASTEROID COMBAT (5m) & ENGINEER MINERAL MINING (5h-5d) SCENE
 * ============================================================================ */
export function AsteroidMiningSceneR3F({
  asteroid,
}: {
  asteroid: AsteroidTarget;
}) {
  const { camera } = useThree();
  const asteroidGroupRef = useRef<THREE.Group>(null);
  const laserGroupRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    camera.up.set(0, 1, 0);
    camera.position.set(0, 7.5, 16.5);
    camera.lookAt(0, 0.5, 0);
  }, [camera]);

  useFrame((state, delta) => {
    if (asteroidGroupRef.current) {
      asteroidGroupRef.current.rotation.y += delta * 0.14;
    }
    if (laserGroupRef.current) {
      const s = 0.85 + Math.sin(state.clock.elapsedTime * 12) * 0.2;
      laserGroupRef.current.scale.set(1, s, 1);
    }
  });

  return (
    <group>
      <group ref={asteroidGroupRef}>
        {/* Core Craggy Asteroid Body */}
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[4.4, 2]} />
          <meshStandardMaterial color="#334155" roughness={0.88} metalness={0.15} />
        </mesh>

        {/* Glowing Mineral Crystal Veins protruding from the Asteroid */}
        {[
          [2.8, 2.1, 1.8],
          [-2.9, 1.8, 2.2],
          [1.6, -2.6, 2.8],
          [-2.2, -2.1, -2.4],
          [0.4, 3.8, -1.5],
          [3.2, -0.8, -2.5],
        ].map(([cx, cy, cz], idx) => (
          <mesh key={idx} position={[cx, cy, cz]} rotation={[cx, cy, cz]}>
            <octahedronGeometry args={[0.95, 0]} />
            <meshStandardMaterial
              color={asteroid.color}
              emissive={asteroid.color}
              emissiveIntensity={0.75}
              roughness={0.15}
            />
          </mesh>
        ))}

        {/* 3D Engineers & Army Troopers stationed on the Asteroid Surface */}
        {[0, 1, 2, 3, 4].map((idx) => {
          const ang = (idx / 5) * Math.PI * 2;
          const rx = Math.cos(ang) * 5.2;
          const rz = Math.sin(ang) * 5.2;
          return (
            <group key={idx} position={[rx, 1.2, rz]} rotation={[0, -ang - Math.PI / 2, 0]}>
              {/* Trooper / Engineer Rig */}
              <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[0.38, 0.75, 0.28]} />
                <meshStandardMaterial
                  color={asteroid.status === 'fighting' ? '#ef4444' : '#06b6d4'}
                  roughness={0.4}
                />
              </mesh>
              <mesh position={[0, 1.15, 0]}>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
              </mesh>
              {/* Laser Extraction Drill or Combat Beam aimed into the Asteroid Core */}
              <mesh position={[0, 0.65, 2.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.14, 3.8, 8]} />
                <meshBasicMaterial
                  color={asteroid.status === 'fighting' ? '#ef4444' : asteroid.color}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Orbital Extraction Rig Ring above Asteroid */}
      <group ref={laserGroupRef} position={[0, 6.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.6, 0.18, 10, 32]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.25} />
        </mesh>
        <mesh position={[0, -2.5, 0]}>
          <cylinderGeometry args={[0.25, 0.65, 4.8, 12]} />
          <meshBasicMaterial color={asteroid.color} transparent opacity={0.45} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================================
 * 7. WEEKLY 3D COUNCIL MEETING SCENE (3D MODELS SPEAKING AROUND HOLOTABLE)
 * ============================================================================ */
export function WeeklyCouncilMeetingSceneR3F({
  speakers,
  activeSpeakerIdx,
}: {
  speakers: CouncilSpeakerLine[];
  activeSpeakerIdx: number;
}) {
  const { camera } = useThree();
  const holoPlanetRef = useRef<THREE.Mesh>(null);

  React.useEffect(() => {
    camera.up.set(0, 1, 0);
    camera.position.set(0, 5.2, 9.6);
    camera.lookAt(0, 1.4, 0);
  }, [camera]);

  useFrame((_, delta) => {
    if (holoPlanetRef.current) {
      holoPlanetRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group>
      {/* Grand Circular Council Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#0f172a" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 4.5, 48]} />
        <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
      </mesh>

      {/* Central Holotable & Rotating Hologram of Planet Gaia */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 2.7, 1.1, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[2.1, 2.1, 0.06, 32]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh ref={holoPlanetRef} position={[0, 2.35, 0]}>
        <sphereGeometry args={[0.95, 24, 24]} />
        <meshBasicMaterial color="#22c55e" wireframe />
      </mesh>

      {/* 5 Trust Delegate 3D Models Standing Around the Holotable */}
      {speakers.map((sp, idx) => {
        const angle = (idx / speakers.length) * Math.PI * 2 - Math.PI / 2;
        const rx = Math.cos(angle) * 3.8;
        const rz = Math.sin(angle) * 3.8;
        const isSpeaking = idx === activeSpeakerIdx;

        return (
          <group
            key={sp.speakerId}
            position={[rx, 0, rz]}
            rotation={[0, -angle - Math.PI / 2, 0]}
            scale={isSpeaking ? 1.18 : 1.0}
          >
            <CompositeFFPlayerCharacter
              isWalking={isSpeaking}
              walkPhase={isSpeaking ? idx + 1.5 : 0}
              holdingDevice={true}
              jacketColor={sp.color}
            />
            {isSpeaking && (
              <mesh position={[0, 2.15, 0]}>
                <octahedronGeometry args={[0.18, 0]} />
                <meshBasicMaterial color="#fde047" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
