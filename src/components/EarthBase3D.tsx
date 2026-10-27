import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Rocket, Hammer, Shield, Coins, Droplets, Sparkles, Compass } from 'lucide-react';

export interface BaseEntity {
  id: string;
  name: string;
  category: 'building' | 'resource' | 'defense' | 'army' | 'obstacle';
  level: number;
  gridX: number; // -8 to +8
  gridZ: number; // -8 to +8
  size: number;  // 1x1, 2x2, or 3x3 tiles
  description: string;
}

const INITIAL_BASE_ENTITIES: BaseEntity[] = [
  {
    id: 'town_hall',
    name: 'Town Hall',
    category: 'building',
    level: 1,
    gridX: 0,
    gridZ: 0,
    size: 3,
    description: 'The heart of your Earth village. Upgrading unlocks new buildings and defenses.',
  },
  {
    id: 'cyber_merc',
    name: 'Tactical Cyber Mercenary',
    category: 'army',
    level: 1,
    gridX: 0,
    gridZ: 3,
    size: 2,
    description: 'Elite 3D hero unit guarding your Earth Outpost.',
  },
  {
    id: 'gold_mine_1',
    name: 'Gold Mine',
    category: 'resource',
    level: 1,
    gridX: -4,
    gridZ: -2,
    size: 2,
    description: 'Extracts precious gold ore from deep beneath Earth’s crust.',
  },
  {
    id: 'elixir_collector_1',
    name: 'Elixir Collector',
    category: 'resource',
    level: 1,
    gridX: 4,
    gridZ: -2,
    size: 2,
    description: 'Pumps glowing ley-line elixir from underground tectonic veins.',
  },
  {
    id: 'builders_hut',
    name: "Builder's Hut",
    category: 'building',
    level: 1,
    gridX: -2,
    gridZ: 3,
    size: 1,
    description: 'Home of the Master Builder who constructs and upgrades your village.',
  },
  {
    id: 'cannon_1',
    name: 'Cannon',
    category: 'defense',
    level: 1,
    gridX: 3,
    gridZ: 3,
    size: 2,
    description: 'Point-defense turret that rotates 360° to guard your starter base.',
  },
  {
    id: 'army_camp',
    name: 'Army Camp',
    category: 'army',
    level: 1,
    gridX: -4,
    gridZ: 4,
    size: 3,
    description: 'Open-air muster ground where your troops gather around the watchfire.',
  },
  {
    id: 'obs_pine_1',
    name: 'Old Pine Tree',
    category: 'obstacle',
    level: 1,
    gridX: -6,
    gridZ: -6,
    size: 1,
    description: 'An overgrown pine tree inside your village borders. Can be cleared for Gems.',
  },
  {
    id: 'obs_rock_1',
    name: 'Mossy Boulder',
    category: 'obstacle',
    level: 1,
    gridX: 6,
    gridZ: -5,
    size: 2,
    description: 'A heavy granite boulder blocking buildable land.',
  },
  {
    id: 'obs_oak_1',
    name: 'Ancient Oak',
    category: 'obstacle',
    level: 1,
    gridX: 6,
    gridZ: 5,
    size: 1,
    description: 'Tall forest tree growing near the edge of the clearing.',
  },
  {
    id: 'obs_gem_box',
    name: 'Gem Meteorite',
    category: 'obstacle',
    level: 1,
    gridX: -7,
    gridZ: 1,
    size: 1,
    description: 'A fallen cosmic crystal pulsing with rare Gems!',
  },
];

const TILE_SIZE = 2.0;
const GRID_TILES = 18; // 18x18 buildable Clash of Clans grid

export default function EarthBase3D({ onExitToSpace }: { onExitToSpace: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<BaseEntity | null>(INITIAL_BASE_ENTITIES[1]);
  const [enteringAtmosphere, setEnteringAtmosphere] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    /* ---------- 1. SCENE, SKY, SHADOWS & CAMERA ---------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6ec6ff);
    scene.fog = new THREE.FogExp2(0x8fd3ff, 0.0045);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.5,
      600,
    );
    camera.position.set(0, 145, 95);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 0, 0);
    controls.minDistance = 8;
    controls.maxDistance = 85;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.minPolarAngle = Math.PI / 6;

    // Warm Sunlight + Soft Sky Light
    const hemiLight = new THREE.HemisphereLight(0xdff4ff, 0x3d6e28, 0.75);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff4d6, 2.2);
    sunLight.position.set(38, 55, 28);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 150;
    const d = 36;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    /* ---------- 2. OCEAN, ISLAND CLIFFS & CHECKERED GRASS GRID ---------- */
    const waterGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1ca3ec,
      roughness: 0.2,
      metalness: 0.1,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -1.6;
    scene.add(waterMesh);

    const beachGeo = new THREE.CylinderGeometry(42, 45, 1.2, 48);
    const beachMat = new THREE.MeshStandardMaterial({ color: 0xeed690, roughness: 0.9 });
    const beachMesh = new THREE.Mesh(beachGeo, beachMat);
    beachMesh.position.y = -1.2;
    beachMesh.receiveShadow = true;
    scene.add(beachMesh);

    const islandGeo = new THREE.CylinderGeometry(36, 39, 1.4, 48);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x458b22, roughness: 0.88 });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = -0.7;
    islandMesh.receiveShadow = true;
    scene.add(islandMesh);

    const gridGroup = new THREE.Group();
    const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.98, 0.16, TILE_SIZE * 0.98);
    const lightGrassMat = new THREE.MeshStandardMaterial({ color: 0x68c138, roughness: 0.85 });
    const darkGrassMat = new THREE.MeshStandardMaterial({ color: 0x5cb230, roughness: 0.85 });

    const halfGrid = GRID_TILES / 2;
    for (let gx = -halfGrid; gx < halfGrid; gx++) {
      for (let gz = -halfGrid; gz < halfGrid; gz++) {
        const isLight = (gx + gz) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isLight ? lightGrassMat : darkGrassMat);
        tile.position.set(
          (gx + 0.5) * TILE_SIZE,
          0,
          (gz + 0.5) * TILE_SIZE,
        );
        tile.receiveShadow = true;
        gridGroup.add(tile);
      }
    }
    scene.add(gridGroup);

    const borderFrameGeo = new THREE.RingGeometry(
      GRID_TILES * TILE_SIZE * 0.707,
      GRID_TILES * TILE_SIZE * 0.73,
      4,
    );
    const borderFrameMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const borderFrame = new THREE.Mesh(borderFrameGeo, borderFrameMat);
    borderFrame.rotation.x = -Math.PI / 2;
    borderFrame.rotation.z = Math.PI / 4;
    borderFrame.position.y = 0.02;
    scene.add(borderFrame);

    /* ---------- 3. SURROUNDING WILDERNESS FOREST & ROCKS ---------- */
    function createPineTree(scale = 1) {
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2 * scale, 0.32 * scale, 1.2 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x6e4720, roughness: 0.9 }),
      );
      trunk.position.y = 0.6 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6e1e, roughness: 0.8 });
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((1.3 - i * 0.28) * scale, (1.6 - i * 0.2) * scale, 8),
          leafMat,
        );
        cone.position.y = (1.5 + i * 0.85) * scale;
        cone.castShadow = true;
        cone.receiveShadow = true;
        group.add(cone);
      }
      return group;
    }

    function createOakTree(scale = 1) {
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24 * scale, 0.38 * scale, 1.4 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x784c24, roughness: 0.9 }),
      );
      trunk.position.y = 0.7 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      const crownMat = new THREE.MeshStandardMaterial({ color: 0x4ca626, roughness: 0.78 });
      const mainCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25 * scale, 1), crownMat);
      mainCrown.position.y = 2.0 * scale;
      mainCrown.castShadow = true;
      group.add(mainCrown);

      const subCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85 * scale, 1), crownMat);
      subCrown.position.set(0.6 * scale, 1.7 * scale, 0.4 * scale);
      subCrown.castShadow = true;
      group.add(subCrown);

      return group;
    }

    function createBoulder(scale = 1) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.95 * scale, 1),
        new THREE.MeshStandardMaterial({ color: 0x7c858e, roughness: 0.85 }),
      );
      rock.scale.set(1.2, 0.75, 1.0);
      rock.position.y = 0.45 * scale;
      rock.castShadow = true;
      rock.receiveShadow = true;
      return rock;
    }

    for (let i = 0; i < 68; i++) {
      const angle = (i / 68) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const dist = 23 + Math.random() * 10;
      const wx = Math.cos(angle) * dist;
      const wz = Math.sin(angle) * dist;
      if (Math.abs(wx) < 19.5 && Math.abs(wz) < 19.5) continue;

      const s = 0.8 + Math.random() * 0.55;
      const tree = i % 3 === 0 ? createOakTree(s) : createPineTree(s);
      tree.position.set(wx, 0, wz);
      tree.rotation.y = Math.random() * Math.PI * 2;
      scene.add(tree);
    }

    /* ---------- 4. 3D CLASH OF CLANS STARTER BUILDINGS + CYBER MERCENARY ---------- */
    const clickableMeshes: THREE.Object3D[] = [];
    let characterMixer: THREE.AnimationMixer | null = null;
    const animatedParts: {
      cannonTurret?: THREE.Object3D;
      elixirLiquid?: THREE.Object3D;
      mineWheel?: THREE.Object3D;
      townHallCrystal?: THREE.Object3D;
      campfireFlame?: THREE.Object3D;
    } = {};

    function buildEntityMesh(entity: BaseEntity): THREE.Group {
      const root = new THREE.Group();
      const footprintSize = entity.size * TILE_SIZE;

      // Base foundation slab for buildings
      if (entity.category !== 'obstacle') {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(footprintSize * 0.92, 0.25, footprintSize * 0.92),
          new THREE.MeshStandardMaterial({
            color: entity.id === 'cyber_merc' ? 0x0f172a : 0x8b939c,
            roughness: 0.85,
          }),
        );
        pad.position.y = 0.125;
        pad.castShadow = true;
        pad.receiveShadow = true;
        root.add(pad);
      }

      if (entity.id === 'cyber_merc') {
        // Glowing Neon Cyan Hero Pedestal Ring
        const neonRing = new THREE.Mesh(
          new THREE.RingGeometry(1.1, 1.35, 32),
          new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide }),
        );
        neonRing.rotation.x = -Math.PI / 2;
        neonRing.position.y = 0.27;
        root.add(neonRing);

        const heroLight = new THREE.PointLight(0x00ffcc, 3, 6);
        heroLight.position.set(0, 1.2, 0);
        root.add(heroLight);

        // Load /cyber_merc.glb from public/ folder
        const loader = new GLTFLoader();
        loader.load(
          '/cyber_merc.glb',
          (gltf) => {
            const model = gltf.scene;

            // Auto-scale and center the model so it stands cleanly on the pedestal
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetHeight = 3.2; // Stand tall and clearly visible infront of Town Hall
            const scale = maxDim > 0 ? targetHeight / maxDim : 2.0;
            model.scale.setScalar(scale);

            // Recompute bounding box after scaling so feet touch the pedestal at y = 0.25
            const scaledBox = new THREE.Box3().setFromObject(model);
            const center = scaledBox.getCenter(new THREE.Vector3());
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = 0.25 - scaledBox.min.y;

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData = { entity };
                clickableMeshes.push(child);
              }
            });

            root.add(model);

            // Play embedded Meshy AI animation if present
            if (gltf.animations && gltf.animations.length > 0) {
              characterMixer = new THREE.AnimationMixer(model);
              const action = characterMixer.clipAction(gltf.animations[0]);
              action.play();
            }
          },
          undefined,
          (error) => {
            console.error('Error loading /cyber_merc.glb:', error);
          },
        );
      } else if (entity.id === 'town_hall') {
        const walls = new THREE.Mesh(
          new THREE.BoxGeometry(4.2, 2.4, 3.8),
          new THREE.MeshStandardMaterial({ color: 0xd6c7b2, roughness: 0.8 }),
        );
        walls.position.y = 1.4;
        walls.castShadow = true;
        walls.receiveShadow = true;
        root.add(walls);

        const pillarGeo = new THREE.BoxGeometry(0.45, 2.5, 0.45);
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4720, roughness: 0.85 });
        [
          [-1.95, -1.75],
          [1.95, -1.75],
          [-1.95, 1.75],
          [1.95, 1.75],
        ].forEach(([px, pz]) => {
          const p = new THREE.Mesh(pillarGeo, woodMat);
          p.position.set(px, 1.4, pz);
          p.castShadow = true;
          root.add(p);
        });

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(3.4, 2.0, 4),
          new THREE.MeshStandardMaterial({ color: 0xd95f18, roughness: 0.75 }),
        );
        roof.position.y = 3.6;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        root.add(roof);

        const door = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.5, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xffcf40 }),
        );
        door.position.set(0, 1.0, 1.9);
        root.add(door);

        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.55, 0),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.8,
            roughness: 0.2,
          }),
        );
        crystal.position.y = 5.2;
        root.add(crystal);
        animatedParts.townHallCrystal = crystal;
      } else if (entity.id === 'gold_mine_1') {
        const mound = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 1.5, 7),
          new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
        );
        mound.position.y = 0.9;
        mound.castShadow = true;
        root.add(mound);

        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          metalness: 0.65,
          roughness: 0.25,
          emissive: 0xca8a04,
          emissiveIntensity: 0.2,
        });
        for (let i = 0; i < 6; i++) {
          const nugget = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), goldMat);
          const a = (i / 6) * Math.PI * 2;
          nugget.position.set(Math.cos(a) * 0.9, 0.45, Math.sin(a) * 0.9);
          nugget.castShadow = true;
          root.add(nugget);
        }

        const wheel = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.12, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0x784c24, roughness: 0.8 }),
        );
        wheel.position.set(0, 1.9, 0);
        wheel.castShadow = true;
        root.add(wheel);
        animatedParts.mineWheel = wheel;
      } else if (entity.id === 'elixir_collector_1') {
        const baseRing = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3, 1.4, 0.5, 16),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.5 }),
        );
        baseRing.position.y = 0.4;
        baseRing.castShadow = true;
        root.add(baseRing);

        const glassVat = new THREE.Mesh(
          new THREE.CylinderGeometry(1.05, 1.05, 2.0, 20),
          new THREE.MeshStandardMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.32,
            roughness: 0.1,
          }),
        );
        glassVat.position.y = 1.5;
        root.add(glassVat);

        const liquid = new THREE.Mesh(
          new THREE.CylinderGeometry(0.92, 0.92, 1.4, 18),
          new THREE.MeshStandardMaterial({
            color: 0xd946ef,
            emissive: 0xc026d3,
            emissiveIntensity: 0.65,
            roughness: 0.2,
          }),
        );
        liquid.position.y = 1.25;
        root.add(liquid);
        animatedParts.elixirLiquid = liquid;

        const cap = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 0.8, 16),
          new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.5, roughness: 0.4 }),
        );
        cap.position.y = 2.8;
        cap.castShadow = true;
        root.add(cap);
      } else if (entity.id === 'builders_hut') {
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 1.2, 1.3),
          new THREE.MeshStandardMaterial({ color: 0x8c5828, roughness: 0.85 }),
        );
        cabin.position.y = 0.75;
        cabin.castShadow = true;
        root.add(cabin);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.15, 0.9, 4),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 }),
        );
        roof.position.y = 1.8;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        root.add(roof);
      } else if (entity.id === 'cannon_1') {
        const mount = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.3, 0.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x784c24, roughness: 0.85 }),
        );
        mount.position.y = 0.45;
        mount.castShadow = true;
        root.add(mount);

        const turretGroup = new THREE.Group();
        turretGroup.position.y = 0.95;

        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.48, 2.1, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 }),
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.45;
        barrel.castShadow = true;
        turretGroup.add(barrel);

        root.add(turretGroup);
        animatedParts.cannonTurret = turretGroup;
      } else if (entity.id === 'army_camp') {
        const fireRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.65, 0.18, 8, 12),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }),
        );
        fireRing.rotation.x = Math.PI / 2;
        fireRing.position.y = 0.3;
        root.add(fireRing);

        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.55, 1.35, 8),
          new THREE.MeshBasicMaterial({ color: 0xff7700 }),
        );
        flame.position.y = 0.95;
        root.add(flame);
        animatedParts.campfireFlame = flame;
      } else if (entity.id.startsWith('obs_pine')) {
        root.add(createPineTree(1.15));
      } else if (entity.id.startsWith('obs_oak')) {
        root.add(createOakTree(1.15));
      } else if (entity.id.startsWith('obs_rock')) {
        root.add(createBoulder(1.4));
      } else if (entity.id === 'obs_gem_box') {
        const gemCluster = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.75, 0),
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 0.9,
            roughness: 0.15,
          }),
        );
        gemCluster.position.y = 0.8;
        gemCluster.castShadow = true;
        root.add(gemCluster);
      }

      root.position.set(entity.gridX * TILE_SIZE, 0.08, entity.gridZ * TILE_SIZE);
      root.userData = { entity };

      root.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.userData = { entity };
          clickableMeshes.push(child);
        }
      });

      return root;
    }

    INITIAL_BASE_ENTITIES.forEach((entity) => {
      scene.add(buildEntityMesh(entity));
    });

    /* ---------- 5. HIGH-ALTITUDE ENTRY CLOUDS ---------- */
    const cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
    });
    for (let i = 0; i < 24; i++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(6 + Math.random() * 8, 1), cloudMat);
      puff.scale.set(1.8, 0.45, 1.2);
      puff.position.set(
        (Math.random() - 0.5) * 90,
        45 + Math.random() * 65,
        (Math.random() - 0.5) * 90,
      );
      cloudsGroup.add(puff);
    }
    scene.add(cloudsGroup);

    /* ---------- 6. SELECTION TILE HIGHLIGHT RING ---------- */
    const selectionHighlight = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.75, 4),
      new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        side: THREE.DoubleSide,
      }),
    );
    selectionHighlight.rotation.x = -Math.PI / 2;
    selectionHighlight.rotation.z = Math.PI / 4;
    selectionHighlight.position.set(0, 0.14, 3 * TILE_SIZE);
    selectionHighlight.scale.setScalar(2 * TILE_SIZE);
    scene.add(selectionHighlight);

    /* ---------- 7. CLICK SELECTION & KEYBOARD HANDLERS ---------- */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const downPos = { x: 0, y: 0 };

    function onPointerDown(e: PointerEvent) {
      downPos.x = e.clientX;
      downPos.y = e.clientY;
    }

    function onPointerUp(e: PointerEvent) {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const picked = hits[0].object.userData.entity as BaseEntity | undefined;
        if (picked) {
          setSelectedEntity(picked);
          selectionHighlight.visible = true;
          selectionHighlight.position.set(
            picked.gridX * TILE_SIZE,
            0.14,
            picked.gridZ * TILE_SIZE,
          );
          selectionHighlight.scale.setScalar(picked.size * TILE_SIZE);
        }
      } else {
        setSelectedEntity(null);
        selectionHighlight.visible = false;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Escape') {
        onExitToSpace();
      }
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    /* ---------- 8. ANIMATION LOOP (ATMOSPHERIC DIVE + BASE IDLE) ---------- */
    const clock = new THREE.Clock();
    let diveProgress = 0;
    const diveDuration = 1.8;
    const startCamPos = new THREE.Vector3(0, 145, 95);
    const targetIsoPos = new THREE.Vector3(28, 24, 28);

    let animId = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (characterMixer) {
        characterMixer.update(dt);
      }

      if (diveProgress < 1) {
        diveProgress = Math.min(1, diveProgress + dt / diveDuration);
        const ease = 1 - Math.pow(1 - diveProgress, 3);
        camera.position.lerpVectors(startCamPos, targetIsoPos, ease);
        controls.target.set(0, 0, 0);

        cloudMat.opacity = Math.max(0, (1 - diveProgress) * 0.85);
        if (diveProgress >= 1) {
          cloudsGroup.visible = false;
          setEnteringAtmosphere(false);
        }
      }

      if (animatedParts.townHallCrystal) {
        animatedParts.townHallCrystal.rotation.y = elapsed * 1.4;
        animatedParts.townHallCrystal.position.y = 5.2 + Math.sin(elapsed * 2.5) * 0.2;
      }
      if (animatedParts.mineWheel) {
        animatedParts.mineWheel.rotation.z = elapsed * 1.8;
      }
      if (animatedParts.elixirLiquid) {
        const pumpScale = 0.75 + (Math.sin(elapsed * 2.2) * 0.5 + 0.5) * 0.35;
        animatedParts.elixirLiquid.scale.y = pumpScale;
      }
      if (animatedParts.cannonTurret) {
        animatedParts.cannonTurret.rotation.y = Math.sin(elapsed * 0.8) * 0.85;
      }
      if (animatedParts.campfireFlame) {
        const flicker = 0.9 + Math.sin(elapsed * 14) * 0.12;
        animatedParts.campfireFlame.scale.set(flicker, 1 + Math.cos(elapsed * 18) * 0.15, flicker);
      }

      if (selectionHighlight.visible) {
        const pulse = 1 + Math.sin(elapsed * 5) * 0.04;
        selectionHighlight.scale.setScalar(
          (selectedEntity?.size ?? 2) * TILE_SIZE * pulse,
        );
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, [onExitToSpace]);

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none bg-sky-300">
      <div ref={containerRef} className="fixed inset-0 h-full w-full z-[1]" />

      {enteringAtmosphere && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center bg-sky-100/30 backdrop-blur-[2px] transition-opacity duration-500">
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 border-sky-300/60">
            <Compass className="w-5 h-5 text-sky-300 animate-spin" />
            <span className="font-display text-sm sm:text-base font-bold tracking-widest uppercase text-white">
              Entering Earth Atmosphere // Sector 01 Clearing...
            </span>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-20 p-3 sm:p-4 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center font-display font-bold text-white shadow-lg">
              1
            </div>
            <div>
              <div className="font-display font-bold text-sm text-white leading-tight">
                Earth Outpost Alpha
              </div>
              <div className="text-[11px] font-mono-tech text-emerald-300 flex items-center gap-1">
                <Hammer className="w-3 h-3" /> 1 / 1 Builders Free
              </div>
            </div>
          </div>

          <button
            onClick={onExitToSpace}
            className="glass-pill active px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg hover:scale-[1.02]"
          >
            <Rocket className="w-4 h-4 text-sky-300" />
            <span>Return to Solar System</span>
            <span className="kbd-badge">Esc</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border-amber-400/40">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">Gold</div>
              <div className="font-display font-bold text-sm text-amber-300">1,500 / 2,500</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border-fuchsia-400/40">
            <Droplets className="w-4 h-4 text-fuchsia-400" />
            <div>
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">Elixir</div>
              <div className="font-display font-bold text-sm text-fuchsia-300">1,500 / 2,500</div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center gap-2.5 border-emerald-400/40">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">Gems</div>
              <div className="font-display font-bold text-sm text-emerald-300">250</div>
            </div>
          </div>
        </div>
      </header>

      {selectedEntity && (
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100vw-2rem)] max-w-xl pointer-events-auto">
          <div className="glass-panel rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-emerald-400/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {selectedEntity.category}
                </span>
                <span className="text-xs font-mono-tech text-amber-300 font-semibold">
                  Level {selectedEntity.level}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mt-0.5">
                {selectedEntity.name}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">{selectedEntity.description}</p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className="glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-sky-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Grid ({selectedEntity.size}x{selectedEntity.size})</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
