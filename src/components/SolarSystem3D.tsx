import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Rocket,
  Shield,
  Coins,
  Droplets,
  Sparkles,
  Compass,
  Globe2,
  MapPin,
  User,
  Zap,
  Music,
  Heart,
  Footprints,
  Moon,
  ArrowUp,
  Smile,
  Menu,
  X,
  Lock,
  Crown,
  Sliders,
  PlaySquare,
  BarChart3,
  LogOut,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  getAllPlanetOwnerships,
  claimPlanetForUser,
  getTotalPlanetsCount,
  setTotalPlanetsCount,
  type PlanetOwnership,
} from '@/lib/firestore';

/* ---------- 0. CLASH OF CLANS + FREE FIRE 3D SPHERICAL EARTH BASE & CHARACTER SYSTEM ---------- */

export interface BaseEntity {
  id: string;
  name: string;
  category: 'building' | 'resource' | 'defense' | 'army' | 'obstacle';
  level: number;
  gridX: number;
  gridZ: number;
  size: number;
  description: string;
}

export type CharacterId = 'alok' | 'kelly';
export type CharacterPosture = 'stand' | 'sit' | 'sleep';

export interface FreeFireCharacterSpec {
  id: CharacterId;
  name: string;
  title: string;
  skillName: string;
  skillDesc: string;
  accentColor: string;
  secondaryColor: string;
  baseSpeed: number;
  sprintBonus: number;
}

const FREE_FIRE_CHARACTERS: Record<CharacterId, FreeFireCharacterSpec> = {
  alok: {
    id: 'alok',
    name: 'DJ Alok',
    title: 'World Famous DJ',
    skillName: 'Drop the Beat',
    skillDesc: 'Creates a 5m musical aura that boosts movement speed by 15% and restores HP.',
    accentColor: '#f59e0b',
    secondaryColor: '#d946ef',
    baseSpeed: 6.2,
    sprintBonus: 1.45,
  },
  kelly: {
    id: 'kelly',
    name: 'Kelly "The Swift"',
    title: 'Awakened Sprinter',
    skillName: 'Deadly Velocity',
    skillDesc: 'Unleashes a golden lightning dash that boosts sprinting speed by 25%.',
    accentColor: '#facc15',
    secondaryColor: '#38bdf8',
    baseSpeed: 7.0,
    sprintBonus: 1.65,
  },
};

const INITIAL_BASE_ENTITIES: BaseEntity[] = [
  {
    id: 'town_hall',
    name: 'Town Hall',
    category: 'building',
    level: 1,
    gridX: 0,
    gridZ: 0,
    size: 3,
    description: 'The heart of your Earth village. Upgrading unlocks new buildings, defenses, and planetary tech.',
  },
  {
    id: 'gold_mine_1',
    name: 'Gold Mine',
    category: 'resource',
    level: 1,
    gridX: -4,
    gridZ: -2,
    size: 2,
    description: 'Extracts precious gold ore from deep beneath Earth’s continental crust.',
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
    description: 'Home of the Master Builder who constructs and upgrades your planetary village.',
  },
  {
    id: 'cannon_1',
    name: 'Cannon',
    category: 'defense',
    level: 1,
    gridX: 2,
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
    description: 'Open-air muster ground where your heroes and troops gather around the watchfire.',
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

// Spherical Planet Constants
const R_PLANET = 52.0;             // Base Sea-Level Radius of the 3D Spherical Earth
const R_VILLAGE = R_PLANET + 1.25; // Raised Continental Plateau Radius for the Starter Base
const TILE_ANGLE = 0.0175;         // Angular step per Clash of Clans grid tile on the sphere
const TILE_WORLD = R_VILLAGE * TILE_ANGLE; // ~0.93 world units per tile
const GRID_TILES = 16;             // 16x16 curved Clash of Clans village clearing

/* ---------- ARTICULATED 3D FREE FIRE CHARACTER RIG BUILDER ---------- */

interface CharacterRig {
  id: CharacterId;
  root: THREE.Group;
  facingGroup: THREE.Group;
  bodyPivot: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  skillAuraGroup: THREE.Group;
  sleepZzzGroup: THREE.Group;
  selectionRing: THREE.Mesh;
}


function createCharacterNameplateSprite(name: string, subtitle: string, accentHex: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Rounded dark glass pill background
  ctx.fillStyle = 'rgba(6, 10, 22, 0.82)';
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(16, 16, 480, 96, 28);
  ctx.fill();
  ctx.stroke();

  // Character Name
  ctx.font = 'bold 42px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), 256, 64);

  // Skill Subtitle
  ctx.font = '600 24px "JetBrains Mono", monospace';
  ctx.fillStyle = accentHex;
  ctx.fillText(subtitle.toUpperCase(), 256, 96);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  sprite.scale.set(1.9, 0.48, 1);
  sprite.position.set(0, 1.85, 0);
  return sprite;
}

function buildFreeFireCharacterRig(charId: CharacterId): CharacterRig {
  const isAlok = charId === 'alok';

  const root = new THREE.Group();
  const facingGroup = new THREE.Group();
  root.add(facingGroup);

  // Scale character to fit harmoniously alongside village buildings while showing rich detail
  const charScale = 0.78; // Prominent Free Fire 3rd-person hero scale
  const bodyPivot = new THREE.Group();
  bodyPivot.scale.setScalar(charScale);
  facingGroup.add(bodyPivot);

// LOAD YOUR NEW MESHY AI 3D MODEL (/cyber_merc.glb) for all characters
const loader = new GLTFLoader();
loader.load(
  '/cyber_merc.glb',
  (gltf) => {
    const model = gltf.scene;

    // Auto-scale and align feet to the ground
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2.2 / maxDim : 1.5;
    model.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -scaledBox.min.y, -center.z);

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Hide the old procedural blocky meshes so only your new 3D model is visible
    torsoGroup.visible = false;
    leftLeg.hipPivot.visible = false;
    rightLeg.hipPivot.visible = false;

    bodyPivot.add(model);

    // Play embedded Meshy animation if present
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(gltf.animations[0]).play();
      model.userData.mixer = mixer;
    }
  },
  undefined,
  () => {
    // Keep procedural character rig when /cyber_merc.glb is not present
  },
);
  
  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: isAlok ? 0xd99b72 : 0xf2bfa0,
    roughness: 0.65,
  });

  /* --- 1. PELVIS & TORSO --- */
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.y = 1.05;
  bodyPivot.add(pelvisGroup);

  const pelvisMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.26, 0.34),
    new THREE.MeshStandardMaterial({
      color: isAlok ? 0x1e293b : 0x111827,
      roughness: 0.75,
    }),
  );
  pelvisMesh.castShadow = true;
  pelvisGroup.add(pelvisMesh);

  // Tactical Belt & Buckle
  const beltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.09, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }),
  );
  beltMesh.position.y = 0.1;
  pelvisGroup.add(beltMesh);

  const buckleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.1, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.8,
      roughness: 0.2,
    }),
  );
  buckleMesh.position.set(0, 0.1, 0.18);
  pelvisGroup.add(buckleMesh);

  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.14;
  pelvisGroup.add(torsoGroup);

  if (isAlok) {
    // DJ Alok Inner Black Graphic Tee
    const innerShirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.78, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 }),
    );
    innerShirt.position.y = 0.4;
    innerShirt.castShadow = true;
    torsoGroup.add(innerShirt);

    // Glowing Equalizer Bars on Alok's Chest Tee
    const eqColors = [0x38bdf8, 0xfacc15, 0xd946ef, 0x38bdf8, 0xfacc15];
    for (let i = 0; i < 5; i++) {
      const barH = 0.12 + (i % 2) * 0.1 + (i === 2 ? 0.16 : 0);
      const eqBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, barH, 0.02),
        new THREE.MeshBasicMaterial({ color: eqColors[i] }),
      );
      eqBar.position.set((i - 2) * 0.06, 0.48, 0.175);
      torsoGroup.add(eqBar);
    }

    // DJ Alok Signature White & Gold Open DJ Vest/Jacket Panels
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.1,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.75,
      roughness: 0.25,
    });

    const leftVest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.38), vestMat);
    leftVest.position.set(0.21, 0.41, 0.01);
    leftVest.castShadow = true;
    torsoGroup.add(leftVest);

    const rightVest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.82, 0.38), vestMat);
    rightVest.position.set(-0.21, 0.41, 0.01);
    rightVest.castShadow = true;
    torsoGroup.add(rightVest);

    const backVest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.12), vestMat);
    backVest.position.set(0, 0.41, -0.14);
    backVest.castShadow = true;
    torsoGroup.add(backVest);

    // Gold Lapel Stripes & High Popped Collar
    const leftGoldStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 0.4), goldTrimMat);
    leftGoldStripe.position.set(0.11, 0.41, 0.01);
    torsoGroup.add(leftGoldStripe);

    const rightGoldStripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.82, 0.4), goldTrimMat);
    rightGoldStripe.position.set(-0.11, 0.41, 0.01);
    torsoGroup.add(rightGoldStripe);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.22, 16, 1, true, Math.PI * 0.25, Math.PI * 1.5),
      vestMat,
    );
    collar.position.set(0, 0.86, -0.02);
    torsoGroup.add(collar);

    // DJ Headphones resting around Alok's neck
    const headphoneBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.035, 8, 20, Math.PI * 1.3),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 }),
    );
    headphoneBand.rotation.x = Math.PI / 2;
    headphoneBand.rotation.z = Math.PI * 0.85;
    headphoneBand.position.set(0, 0.82, 0.02);
    torsoGroup.add(headphoneBand);

    const earCupGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16);
    const leftCup = new THREE.Mesh(earCupGeo, goldTrimMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(0.2, 0.82, 0.12);
    torsoGroup.add(leftCup);

    const rightCup = new THREE.Mesh(earCupGeo, goldTrimMat);
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(-0.2, 0.82, 0.12);
    torsoGroup.add(rightCup);
  } else {
    // KELLY ("The Swift"): Iconic Bright Yellow Track Jacket + Black/White Racing Stripes + Crop Top
    const cropTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.72, 0.31),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 }),
    );
    cropTop.position.y = 0.42;
    cropTop.castShadow = true;
    torsoGroup.add(cropTop);

    // Midriff skin band at lower waist
    const midriff = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.3), skinMat);
    midriff.position.y = 0.12;
    torsoGroup.add(midriff);

    const yellowJacketMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      metalness: 0.05,
    });
    const blackStripeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });

    const leftJacket = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.68, 0.35), yellowJacketMat);
    leftJacket.position.set(0.19, 0.47, 0.01);
    leftJacket.castShadow = true;
    torsoGroup.add(leftJacket);

    const rightJacket = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.68, 0.35), yellowJacketMat);
    rightJacket.position.set(-0.19, 0.47, 0.01);
    rightJacket.castShadow = true;
    torsoGroup.add(rightJacket);

    const backJacket = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.12), yellowJacketMat);
    backJacket.position.set(0, 0.47, -0.13);
    backJacket.castShadow = true;
    torsoGroup.add(backJacket);

    // White & Black Racing Trim on Kelly's Jacket
    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 0.36), blackStripeMat);
    leftTrim.position.set(0.09, 0.47, 0.01);
    torsoGroup.add(leftTrim);

    const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.68, 0.36), blackStripeMat);
    rightTrim.position.set(-0.09, 0.47, 0.01);
    torsoGroup.add(rightTrim);

    const kellyCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16, 1, true, Math.PI * 0.25, Math.PI * 1.5),
      yellowJacketMat,
    );
    kellyCollar.position.set(0, 0.84, -0.02);
    torsoGroup.add(kellyCollar);
  }

  /* --- 2. HEAD, FACE, HAIR & SIGNATURE ACCESSORIES --- */
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.88;
  torsoGroup.add(headGroup);

  // Neck
  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.18, 12), skinMat);
  neckMesh.position.y = 0.06;
  headGroup.add(neckMesh);

  // Sculpted Head
  const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.44), skinMat);
  cranium.position.y = 0.34;
  cranium.castShadow = true;
  headGroup.add(cranium);

  // Eyes & Eyebrows
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: isAlok ? 0x29180a : 0x3b2314 });
  const browMat = new THREE.MeshBasicMaterial({ color: isAlok ? 0x111827 : 0x3f2312 });

  [-0.1, 0.1].forEach((ex) => {
    const eyeW = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.02), eyeWhiteMat);
    eyeW.position.set(ex, 0.36, 0.22);
    headGroup.add(eyeW);

    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.042, 0.025), pupilMat);
    pupil.position.set(ex, 0.36, 0.223);
    headGroup.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.022, 0.025), browMat);
    brow.position.set(ex, 0.41, 0.222);
    headGroup.add(brow);
  });

  // Nose & Mouth
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.05), skinMat);
  nose.position.set(0, 0.32, 0.23);
  headGroup.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.022, 0.02),
    new THREE.MeshBasicMaterial({ color: isAlok ? 0x8c4a32 : 0xd96b6b }),
  );
  mouth.position.set(0, 0.24, 0.222);
  headGroup.add(mouth);

  if (isAlok) {
    // DJ Alok Signature Gold-Rimmed Aviator Sunglasses
    const goldFrameMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.15,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.1,
    });

    [-0.105, 0.105].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.025, 16), goldFrameMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(gx, 0.365, 0.232);
      headGroup.add(rim);

      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.03, 16), lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(gx, 0.365, 0.234);
      headGroup.add(lens);
    });

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.02), goldFrameMat);
    bridge.position.set(0, 0.375, 0.235);
    headGroup.add(bridge);

    // Goatee / Beard trim for DJ Alok
    const beard = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.12, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 }),
    );
    beard.position.set(0, 0.17, 0.005);
    headGroup.add(beard);

    // DJ Alok Spiky Top Hair + Undercut
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.75 });
    const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.46), hairMat);
    hairBase.position.set(0, 0.56, -0.01);
    headGroup.add(hairBase);

    for (let i = 0; i < 9; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 5), hairMat);
      const row = Math.floor(i / 3) - 1;
      const col = (i % 3) - 1;
      spike.position.set(col * 0.12, 0.68, row * 0.11);
      spike.rotation.set(-0.2 + row * 0.15, 0, -col * 0.2);
      spike.castShadow = true;
      headGroup.add(spike);
    }
  } else {
    // KELLY Signature Bob-Cut Hair & Sporty Red/White Headband
    const kellyHairMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.7 });
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.48), kellyHairMat);
    hairTop.position.set(0, 0.54, -0.01);
    headGroup.add(hairTop);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.16), kellyHairMat);
    hairBack.position.set(0, 0.36, -0.18);
    headGroup.add(hairBack);

    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.36), kellyHairMat);
    hairSideL.position.set(0.22, 0.35, 0.02);
    headGroup.add(hairSideL);

    const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.36), kellyHairMat);
    hairSideR.position.set(-0.22, 0.35, 0.02);
    headGroup.add(hairSideR);

    // Sporty Red Headband
    const headband = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.065, 0.49),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }),
    );
    headband.position.set(0, 0.5, 0.0);
    headGroup.add(headband);
  }

  /* --- 3. ARTICULATED ARMS (SHOULDERS, ELBOWS, FOREARMS & HANDS) --- */
  function createArm(isLeft: boolean) {
    const dir = isLeft ? 1 : -1;
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(dir * 0.38, 0.74, 0);
    torsoGroup.add(shoulderPivot);

    const sleeveColor = isAlok ? 0xf8fafc : 0xfacc15;
    const sleeveMat = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.5 });

    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.085, 0.42, 12),
      isAlok ? skinMat : sleeveMat,
    );
    upperArm.position.y = -0.18;
    upperArm.castShadow = true;
    shoulderPivot.add(upperArm);

    // Shoulder Pad / Racing Stripe
    const shoulderCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.18, 0.22),
      new THREE.MeshStandardMaterial({ color: isAlok ? 0xf59e0b : 0xfacc15, roughness: 0.4 }),
    );
    shoulderCap.position.y = -0.04;
    shoulderPivot.add(shoulderCap);

    const elbowPivot = new THREE.Group();
    elbowPivot.position.y = -0.38;
    shoulderPivot.add(elbowPivot);

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.07, 0.38, 12),
      isAlok ? skinMat : sleeveMat,
    );
    forearm.position.y = -0.18;
    forearm.castShadow = true;
    elbowPivot.add(forearm);

    // Glove / Wristband
    const wristBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.082, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }),
    );
    wristBand.position.y = -0.33;
    elbowPivot.add(wristBand);

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.11), skinMat);
    hand.position.y = -0.41;
    hand.castShadow = true;
    elbowPivot.add(hand);

    return { shoulderPivot, elbowPivot };
  }

  const leftArm = createArm(true);
  const rightArm = createArm(false);

  /* --- 4. ARTICULATED LEGS (HIPS, THIGHS, KNEES, SHINS & SNEAKERS) --- */
  function createLeg(isLeft: boolean) {
    const dir = isLeft ? 1 : -1;
    const hipPivot = new THREE.Group();
    hipPivot.position.set(dir * 0.16, -0.05, 0);
    pelvisGroup.add(hipPivot);

    const pantsMat = new THREE.MeshStandardMaterial({
      color: isAlok ? 0x1e293b : 0x18181b,
      roughness: 0.75,
    });

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.105, 0.48, 12),
      pantsMat,
    );
    thigh.position.y = -0.24;
    thigh.castShadow = true;
    hipPivot.add(thigh);

    // Gold/Yellow Thigh Holster / Strap
    const strap = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.06, 0.26),
      new THREE.MeshStandardMaterial({ color: isAlok ? 0xf59e0b : 0xfacc15, roughness: 0.4 }),
    );
    strap.position.y = -0.26;
    hipPivot.add(strap);

    const kneePivot = new THREE.Group();
    kneePivot.position.y = -0.48;
    hipPivot.add(kneePivot);

    const shinMat = isAlok ? pantsMat : skinMat;
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.46, 12), shinMat);
    shin.position.y = -0.23;
    shin.castShadow = true;
    kneePivot.add(shin);

    if (!isAlok) {
      // Kelly's white sport sock
      const sock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.088, 0.24, 12),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 }),
      );
      sock.position.y = -0.34;
      kneePivot.add(sock);
    }

    // High-Top Free Fire Sneaker
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.48, 0.05);
    kneePivot.add(shoeGroup);

    const shoeMain = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.13, 0.32),
      new THREE.MeshStandardMaterial({
        color: isAlok ? 0xf8fafc : 0xfacc15,
        roughness: 0.5,
      }),
    );
    shoeMain.castShadow = true;
    shoeGroup.add(shoeMain);

    const shoeSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.045, 0.34),
      new THREE.MeshStandardMaterial({
        color: isAlok ? 0xf59e0b : 0xffffff,
        roughness: 0.6,
      }),
    );
    shoeSole.position.y = -0.05;
    shoeGroup.add(shoeSole);

    return { hipPivot, kneePivot };
  }

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);

  /* --- 5. FREE FIRE ACTIVE SKILL 3D AURA ("DROP THE BEAT" / "DEADLY VELOCITY") --- */
  const skillAuraGroup = new THREE.Group();
  skillAuraGroup.position.y = 0.06;
  skillAuraGroup.visible = false;
  root.add(skillAuraGroup);

  const outerAuraRing = new THREE.Mesh(
    new THREE.RingGeometry(1.35, 1.52, 48),
    new THREE.MeshBasicMaterial({
      color: isAlok ? 0xf59e0b : 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    }),
  );
  outerAuraRing.rotation.x = -Math.PI / 2;
  skillAuraGroup.add(outerAuraRing);

  const innerAuraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 0.96, 36),
    new THREE.MeshBasicMaterial({
      color: isAlok ? 0xd946ef : 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    }),
  );
  innerAuraRing.rotation.x = -Math.PI / 2;
  skillAuraGroup.add(innerAuraRing);

  // Equalizer Pillars / Speed Lightning Nodes around the Aura Ring
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.35 + (i % 3) * 0.18, 0.08),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? (isAlok ? 0xfacc15 : 0x38bdf8) : isAlok ? 0xd946ef : 0xfef08a,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      }),
    );
    bar.position.set(Math.cos(ang) * 1.42, 0.22, Math.sin(ang) * 1.42);
    skillAuraGroup.add(bar);
  }

  /* --- 6. SLEEP "Zzz" FLOATING 3D PARTICLES --- */
  const sleepZzzGroup = new THREE.Group();
  sleepZzzGroup.position.y = 1.2;
  sleepZzzGroup.visible = false;
  root.add(sleepZzzGroup);

  for (let i = 0; i < 3; i++) {
    const zOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08 + i * 0.03, 0),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
    );
    zOrb.position.set(i * 0.16, i * 0.25, 0);
    sleepZzzGroup.add(zOrb);
  }

  /* --- 7. ACTIVE PLAYER FOOT RING --- */
  const selectionRing = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.52, 32),
    new THREE.MeshBasicMaterial({
      color: isAlok ? 0xf59e0b : 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
  );
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.position.y = 0.03;
  root.add(selectionRing);

  const nameplate = createCharacterNameplateSprite(
    isAlok ? '★ DJ ALOK' : '⚡ KELLY',
    isAlok ? 'DROP THE BEAT' : 'DEADLY VELOCITY',
    isAlok ? '#f59e0b' : '#facc15',
  );
  root.add(nameplate);

  return {
    id: charId,
    root,
    facingGroup,
    bodyPivot,
    torsoGroup,
    headGroup,
    leftShoulder: leftArm.shoulderPivot,
    leftElbow: leftArm.elbowPivot,
    rightShoulder: rightArm.shoulderPivot,
    rightElbow: rightArm.elbowPivot,
    leftHip: leftLeg.hipPivot,
    leftKnee: leftLeg.kneePivot,
    rightHip: rightLeg.hipPivot,
    rightKnee: rightLeg.kneePivot,
    skillAuraGroup,
    sleepZzzGroup,
    selectionRing,
  };
}

/* ---------- MAIN PLANET BASE + FREE FIRE CHARACTER VIEW ---------- */

function EarthBase3DView({
  planetId,
  planetName,
  isOwner,
  ownerName,
  onExitToSpace,
}: {
  planetId: string;
  planetName: string;
  isOwner: boolean;
  ownerName: string | null;
  onExitToSpace: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<BaseEntity | null>(null);
  const [enteringAtmosphere, setEnteringAtmosphere] = useState(true);
  const [cameraMode, setCameraMode] = useState<'character' | 'village' | 'globe'>(
    isOwner ? 'character' : 'globe',
  );

  // Free Fire Character State
  const [activeChar, setActiveChar] = useState<CharacterId>('alok');
  const [posture, setPosture] = useState<CharacterPosture>('stand');
  const [isSprinting, setIsSprinting] = useState(false);
  const [skillActive, setSkillActive] = useState(false);
  const [isEmoting, setIsEmoting] = useState(false);
  const [hp, setHp] = useState(200);
  const [ep, setEp] = useState(150);

  // Virtual Analog Joystick UI State
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joystickVectorRef = useRef({ x: 0, y: 0 });
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyDraggingRef = useRef(false);

  // Bridges from React UI buttons to the 60FPS Three.js loop
  const activeCharRef = useRef<CharacterId>('alok');
  const postureRef = useRef<CharacterPosture>('stand');
  const isSprintingRef = useRef(false);
  const skillActiveRef = useRef(false);
  const isEmotingRef = useRef(false);
  const cameraModeRef = useRef<'character' | 'village' | 'globe'>(
    isOwner ? 'character' : 'globe',
  );

  const actionsBridgeRef = useRef<{
    triggerJump: () => void;
    setPostureState: (next: CharacterPosture) => void;
    switchCharacter: (id: CharacterId) => void;
    activateSkill: () => void;
    triggerEmote: () => void;
    setCamPreset: (mode: 'character' | 'village' | 'globe') => void;
  } | null>(null);

  // Virtual Joystick Pointer Handlers
  const updateJoystickFromEvent = (clientX: number, clientY: number) => {
    if (!isOwner) return;
    const base = joyBaseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width / 2 - 14;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    joystickVectorRef.current = { x: dx / maxR, y: dy / maxR };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const isMobile = window.innerWidth < 768;

    /* ---------- 1. SCENE, SPACE STARFIELD & CAMERA ---------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040a);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.5,
      2000,
    );
    camera.position.set(0, R_PLANET + 115, 95);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, isOwner ? R_VILLAGE : 0, 0);
    controls.minDistance = 4.5;
    controls.maxDistance = 260;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // Background Starfield around the Planet
    const starCount = isMobile ? 1800 : 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 450 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xe2e8f0, size: 1.4, transparent: true, opacity: 0.8 }),
      ),
    );

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.95);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    sunLight.position.set(85, 130, 75);
    if (!isMobile) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 20;
      sunLight.shadow.camera.far = 260;
      const d = 65;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
    }
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-90, -70, -80);
    scene.add(rimLight);

    /* ---------- 2. PHOTOREALISTIC SPHERICAL EARTH GLOBE (NO BLOCKY CHUNKS) ---------- */
    const UP = new THREE.Vector3(0, 1, 0);
    function getSphereTransform(gx: number, gz: number, radiusOffset = 0) {
      const normal = new THREE.Vector3(gx * TILE_ANGLE, 1.0, gz * TILE_ANGLE).normalize();
      const position = normal.clone().multiplyScalar(R_VILLAGE + radiusOffset);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, normal);
      return { normal, position, quaternion };
    }

    const planetMaps = generatePlanetTextures(planetId);
    const globeSegments = isMobile ? 64 : 96;
    const globeGeo = new THREE.SphereGeometry(R_VILLAGE - 0.06, globeSegments, globeSegments);
    const globeMat = new THREE.MeshPhongMaterial({
      map: planetMaps.map,
      bumpMap: planetMaps.bumpMap,
      bumpScale: 0.35,
      specularMap: planetMaps.specularMap ?? undefined,
      specular: new THREE.Color(0x66aacc),
      shininess: 38,
    });
    const earthTerrainMesh = new THREE.Mesh(globeGeo, globeMat);
    earthTerrainMesh.receiveShadow = true;
    scene.add(earthTerrainMesh);

    // Smooth Natural Sanctuary Ground Pad at North Pole for Base & Characters
    const clearingCapGeo = new THREE.CylinderGeometry(13.2, 14.4, 0.45, 64);
    const clearingCapMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a3e,
      roughness: 0.88,
      metalness: 0.02,
    });
    const clearingCap = new THREE.Mesh(clearingCapGeo, clearingCapMat);
    clearingCap.position.set(0, R_VILLAGE - 0.25, 0);
    clearingCap.receiveShadow = true;
    scene.add(clearingCap);

    // Subtle stone sanctuary ring around clearing
    const ringBorder = new THREE.Mesh(
      new THREE.RingGeometry(13.0, 13.45, 64),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32,
      }),
    );
    ringBorder.rotation.x = -Math.PI / 2;
    ringBorder.position.set(0, R_VILLAGE + 0.01, 0);
    scene.add(ringBorder);

    // Smooth Rayleigh Scattering Atmosphere Halo
    const atmoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(R_VILLAGE * 1.11, 64, 64),
      createAtmosphereMaterial(0x38bdf8, 0.88, 3.2),
    );
    scene.add(atmoMesh);

    /* ---------- 3. NATURAL TREES & ROCKS AROUND THE SANCTUARY ---------- */
    function createPineTree(scale = 1) {
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11 * scale, 0.18 * scale, 0.65 * scale, 7),
        new THREE.MeshStandardMaterial({ color: 0x6e4720, roughness: 0.9 }),
      );
      trunk.position.y = 0.32 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x245c18, roughness: 0.8 });
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((0.72 - i * 0.15) * scale, (0.9 - i * 0.12) * scale, 7),
          leafMat,
        );
        cone.position.y = (0.8 + i * 0.45) * scale;
        cone.castShadow = true;
        group.add(cone);
      }
      return group;
    }

    function createOakTree(scale = 1) {
      const group = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13 * scale, 0.2 * scale, 0.75 * scale, 7),
        new THREE.MeshStandardMaterial({ color: 0x784c24, roughness: 0.9 }),
      );
      trunk.position.y = 0.38 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      const crownMat = new THREE.MeshStandardMaterial({ color: 0x4ca626, roughness: 0.78 });
      const mainCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 * scale, 1), crownMat);
      mainCrown.position.y = 1.05 * scale;
      mainCrown.castShadow = true;
      group.add(mainCrown);
      return group;
    }

    function createBoulder(scale = 1) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.55 * scale, 1),
        new THREE.MeshStandardMaterial({ color: 0x7c858e, roughness: 0.85 }),
      );
      rock.scale.set(1.2, 0.75, 1.0);
      rock.position.y = 0.25 * scale;
      rock.castShadow = true;
      rock.receiveShadow = true;
      return rock;
    }

    for (let i = 0; i < 44; i++) {
      const angle = (i / 44) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
      const gridDist = 9.4 + Math.random() * 2.8;
      const gx = Math.cos(angle) * gridDist;
      const gz = Math.sin(angle) * gridDist;
      const { position, quaternion } = getSphereTransform(gx, gz, -0.04);

      const s = 0.85 + Math.random() * 0.45;
      const tree = i % 3 === 0 ? createOakTree(s) : createPineTree(s);
      tree.position.copy(position);
      tree.quaternion.copy(quaternion);
      scene.add(tree);
    }

    // Optional Custom Planet GLB Model Slot (/models/<planetId>.glb) for user-created 3D models
    const customModelLoader = new GLTFLoader();
    customModelLoader.load(
      `/models/${planetId}.glb`,
      (gltf) => {
        const customModel = gltf.scene;
        const { position, quaternion } = getSphereTransform(0, -4, 0.05);
        customModel.position.copy(position);
        customModel.quaternion.copy(quaternion);
        scene.add(customModel);
      },
      undefined,
      () => {
        // Silently skip if user hasn't uploaded /models/<planetId>.glb yet
      },
    );

    /* ---------- 4. STARTER BUILDINGS ON THE SPHERE ---------- */
    const clickableMeshes: THREE.Object3D[] = [];
    const animatedParts: {
      cannonTurret?: THREE.Object3D;
      elixirLiquid?: THREE.Object3D;
      mineWheel?: THREE.Object3D;
      townHallCrystal?: THREE.Object3D;
      campfireFlame?: THREE.Object3D;
    } = {};

    const S = 0.48;

    function buildEntityMesh(entity: BaseEntity): THREE.Group {
      const root = new THREE.Group();
      const inner = new THREE.Group();
      inner.scale.setScalar(S);
      root.add(inner);

      const footprintSize = entity.size * 2.0;

      if (entity.category !== 'obstacle') {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(footprintSize * 0.92, 0.3, footprintSize * 0.92),
          new THREE.MeshStandardMaterial({ color: 0x8b939c, roughness: 0.85 }),
        );
        pad.position.y = 0.12;
        pad.castShadow = true;
        pad.receiveShadow = true;
        inner.add(pad);
      }

      if (entity.id === 'town_hall') {
        const walls = new THREE.Mesh(
          new THREE.BoxGeometry(4.2, 2.4, 3.8),
          new THREE.MeshStandardMaterial({ color: 0xd6c7b2, roughness: 0.8 }),
        );
        walls.position.y = 1.4;
        walls.castShadow = true;
        walls.receiveShadow = true;
        inner.add(walls);

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
          inner.add(p);
        });

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(3.4, 2.0, 4),
          new THREE.MeshStandardMaterial({ color: 0xd95f18, roughness: 0.75 }),
        );
        roof.position.y = 3.6;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        inner.add(roof);

        const door = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 1.5, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xffcf40 }),
        );
        door.position.set(0, 1.0, 1.9);
        inner.add(door);

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
        inner.add(crystal);
        animatedParts.townHallCrystal = crystal;
      } else if (entity.id === 'gold_mine_1') {
        const mound = new THREE.Mesh(
          new THREE.ConeGeometry(1.5, 1.5, 7),
          new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 }),
        );
        mound.position.y = 0.9;
        mound.castShadow = true;
        inner.add(mound);

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
          inner.add(nugget);
        }

        const wheel = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.12, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0x784c24, roughness: 0.8 }),
        );
        wheel.position.set(0, 1.9, 0);
        wheel.castShadow = true;
        inner.add(wheel);
        animatedParts.mineWheel = wheel;
      } else if (entity.id === 'elixir_collector_1') {
        const baseRing = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3, 1.4, 0.5, 16),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.5 }),
        );
        baseRing.position.y = 0.4;
        baseRing.castShadow = true;
        inner.add(baseRing);

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
        inner.add(glassVat);

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
        inner.add(liquid);
        animatedParts.elixirLiquid = liquid;

        const cap = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 0.8, 16),
          new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.5, roughness: 0.4 }),
        );
        cap.position.y = 2.8;
        cap.castShadow = true;
        inner.add(cap);
      } else if (entity.id === 'builders_hut') {
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 1.2, 1.3),
          new THREE.MeshStandardMaterial({ color: 0x8c5828, roughness: 0.85 }),
        );
        cabin.position.y = 0.75;
        cabin.castShadow = true;
        inner.add(cabin);

        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.15, 0.9, 4),
          new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 }),
        );
        roof.position.y = 1.8;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        inner.add(roof);
      } else if (entity.id === 'cannon_1') {
        const mount = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.3, 0.6, 12),
          new THREE.MeshStandardMaterial({ color: 0x784c24, roughness: 0.85 }),
        );
        mount.position.y = 0.45;
        mount.castShadow = true;
        inner.add(mount);

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

        inner.add(turretGroup);
        animatedParts.cannonTurret = turretGroup;
      } else if (entity.id === 'army_camp') {
        const fireRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.65, 0.18, 8, 12),
          new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 }),
        );
        fireRing.rotation.x = Math.PI / 2;
        fireRing.position.y = 0.3;
        inner.add(fireRing);

        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.55, 1.35, 8),
          new THREE.MeshBasicMaterial({ color: 0xff7700 }),
        );
        flame.position.y = 0.95;
        inner.add(flame);
        animatedParts.campfireFlame = flame;
      } else if (entity.id.startsWith('obs_pine')) {
        inner.add(createPineTree(2.0));
      } else if (entity.id.startsWith('obs_oak')) {
        inner.add(createOakTree(2.0));
      } else if (entity.id.startsWith('obs_rock')) {
        inner.add(createBoulder(2.2));
      } else if (entity.id === 'obs_gem_box') {
        const gemCluster = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.85, 0),
          new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x059669,
            emissiveIntensity: 0.9,
            roughness: 0.15,
          }),
        );
        gemCluster.position.y = 0.9;
        gemCluster.castShadow = true;
        inner.add(gemCluster);
      }

      const { position, quaternion } = getSphereTransform(entity.gridX, entity.gridZ, 0.02);
      root.position.copy(position);
      root.quaternion.copy(quaternion);
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

    /* ---------- 5. SPAWN BOTH FREE FIRE CHARACTERS (DJ ALOK & KELLY) ---------- */
    const alokRig = buildFreeFireCharacterRig('alok');
    const kellyRig = buildFreeFireCharacterRig('kelly');
    scene.add(alokRig.root);
    scene.add(kellyRig.root);

    const charRigs: Record<CharacterId, CharacterRig> = {
      alok: alokRig,
      kelly: kellyRig,
    };

    const charPhysics: Record<
      CharacterId,
      {
        gx: number;
        gz: number;
        heading: number;
        jumpHeight: number;
        verticalVel: number;
        walkCycle: number;
      }
    > = {
      alok: { gx: 0.0, gz: 2.6, heading: 0, jumpHeight: 0, verticalVel: 0, walkCycle: 0 },
      kelly: { gx: -2.6, gz: 4.2, heading: 0.4, jumpHeight: 0, verticalVel: 0, walkCycle: 0 },
    };

    /* ---------- 6. REALISTIC WISPY ATMOSPHERIC CLOUD SPHERE (NO BLOCKY PUFFS) ---------- */
    const cloudsOrbitGroup = new THREE.Group();
    const wispyCloudTex = generateEarthCloudsTexture(planetId);
    const wispyCloudSphere = new THREE.Mesh(
      new THREE.SphereGeometry(R_VILLAGE * 1.045, 64, 64),
      new THREE.MeshLambertMaterial({
        map: wispyCloudTex,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    cloudsOrbitGroup.add(wispyCloudSphere);
    scene.add(cloudsOrbitGroup);

    const selectionHighlight = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.78, 4),
      new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        side: THREE.DoubleSide,
      }),
    );
    selectionHighlight.visible = false;
    scene.add(selectionHighlight);

    /* ---------- 7. CHARACTER ACTIONS & CAMERA PRESET BRIDGE ---------- */
    let camTransition: {
      startPos: THREE.Vector3;
      endPos: THREE.Vector3;
      startTarget: THREE.Vector3;
      endTarget: THREE.Vector3;
      progress: number;
    } | null = null;

    let skillTimer: number | null = null;
    let emoteTimer: number | null = null;

    const triggerJump = () => {
      const id = activeCharRef.current;
      const st = charPhysics[id];
      // If sitting or sleeping, stand up first and jump!
      if (postureRef.current !== 'stand') {
        postureRef.current = 'stand';
        setPosture('stand');
      }
      if (st.jumpHeight <= 0.02) {
        st.verticalVel = 7.2;
      }
    };

    const setPostureState = (next: CharacterPosture) => {
      const targetPosture = postureRef.current === next ? 'stand' : next;
      postureRef.current = targetPosture;
      setPosture(targetPosture);
      if (targetPosture !== 'stand') {
        isSprintingRef.current = false;
        setIsSprinting(false);
      }
    };

    const switchCharacter = (id: CharacterId) => {
      activeCharRef.current = id;
      setActiveChar(id);
      postureRef.current = 'stand';
      setPosture('stand');
    };

    const activateSkill = () => {
      skillActiveRef.current = true;
      setSkillActive(true);
      setHp((prev) => Math.min(200, prev + 35));
      if (skillTimer) window.clearTimeout(skillTimer);
      skillTimer = window.setTimeout(() => {
        skillActiveRef.current = false;
        setSkillActive(false);
      }, 9000);
    };

    const triggerEmote = () => {
      postureRef.current = 'stand';
      setPosture('stand');
      isEmotingRef.current = true;
      setIsEmoting(true);
      if (emoteTimer) window.clearTimeout(emoteTimer);
      emoteTimer = window.setTimeout(() => {
        isEmotingRef.current = false;
        setIsEmoting(false);
      }, 3600);
    };

    const setCamPreset = (mode: 'character' | 'village' | 'globe') => {
      cameraModeRef.current = mode;
      setCameraMode(mode);
      const activeSt = charPhysics[activeCharRef.current];
      const charTf = getSphereTransform(activeSt.gx, activeSt.gz, 0.7);

      camTransition = {
        startPos: camera.position.clone(),
        startTarget: controls.target.clone(),
        endPos:
          mode === 'character'
            ? charTf.position.clone().add(new THREE.Vector3(0, 2.4, 5.2))
            : mode === 'village'
              ? new THREE.Vector3(0, R_VILLAGE + 19, 28)
              : new THREE.Vector3(0, 40, 148),
        endTarget:
          mode === 'character'
            ? charTf.position.clone()
            : mode === 'village'
              ? new THREE.Vector3(0, R_VILLAGE * 0.78, 0)
              : new THREE.Vector3(0, 0, 0),
        progress: 0,
      };
    };

    actionsBridgeRef.current = {
      triggerJump,
      setPostureState,
      switchCharacter,
      activateSkill,
      triggerEmote,
      setCamPreset,
    };

    /* ---------- 8. KEYBOARD & POINTER INPUT ---------- */
    const keyMap: Record<string, boolean> = {};
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
          const tf = getSphereTransform(picked.gridX, picked.gridZ, 0.08);
          selectionHighlight.position.copy(tf.position);
          selectionHighlight.quaternion
            .copy(tf.quaternion)
            .multiply(
              new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 4)),
            );
          selectionHighlight.scale.setScalar(picked.size * TILE_WORLD);
        }
      } else {
        setSelectedEntity(null);
        selectionHighlight.visible = false;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      keyMap[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.repeat) return;

      if (e.code === 'Escape') {
        onExitToSpace();
      } else if (e.code === 'Digit1') {
        setCamPreset('character');
      } else if (e.code === 'Digit2') {
        setCamPreset('village');
      } else if (e.code === 'Digit3') {
        setCamPreset('globe');
      } else if (isOwner) {
        if (e.code === 'Space') {
          triggerJump();
        } else if (e.code === 'KeyC') {
          setPostureState('sit');
        } else if (e.code === 'KeyZ') {
          setPostureState('sleep');
        } else if (e.code === 'KeyF') {
          activateSkill();
        } else if (e.code === 'KeyB') {
          triggerEmote();
        } else if (e.code === 'Tab') {
          switchCharacter(activeCharRef.current === 'alok' ? 'kelly' : 'alok');
        } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
          isSprintingRef.current = !isSprintingRef.current;
          setIsSprinting(isSprintingRef.current);
        }
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      keyMap[e.code] = false;
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    /* ---------- 9. PROCEDURAL SKELETAL ANIMATION & MOVEMENT LOOP ---------- */
    const clock = new THREE.Clock();
    let diveProgress = 0;
    const diveDuration = 1.65;
    const startCamPos = new THREE.Vector3(0, R_PLANET + 115, 95);
    const targetInitialCamPos = new THREE.Vector3(0, R_VILLAGE + 2.6, 6.2);

    let animId = 0;
    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const currentCharId = activeCharRef.current;
      const activeSpec = FREE_FIRE_CHARACTERS[currentCharId];
      const activePhys = charPhysics[currentCharId];
      const prevCharWorldPos = getSphereTransform(
        activePhys.gx,
        activePhys.gz,
        activePhys.jumpHeight + 0.65,
      ).position;

      /* --- A. Compute Movement Input (Virtual Joystick + WASD/Arrows) --- */
      let moveX = isOwner ? joystickVectorRef.current.x : 0;
      let moveY = isOwner ? joystickVectorRef.current.y : 0;

      if (isOwner) {
        if (keyMap['KeyW'] || keyMap['ArrowUp']) moveY -= 1;
        if (keyMap['KeyS'] || keyMap['ArrowDown']) moveY += 1;
        if (keyMap['KeyA'] || keyMap['ArrowLeft']) moveX -= 1;
        if (keyMap['KeyD'] || keyMap['ArrowRight']) moveX += 1;
      }

      const inputMag = Math.min(1, Math.hypot(moveX, moveY));
      const isMoving = inputMag > 0.08;

      if (isMoving) {
        if (isEmotingRef.current) {
          isEmotingRef.current = false;
          setIsEmoting(false);
        }
        const normX = moveX / Math.hypot(moveX, moveY);
        const normY = moveY / Math.hypot(moveX, moveY);

        // Align movement relative to current camera yaw around the village
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        if (camForward.lengthSq() < 0.001) camForward.set(0, 0, -1);
        camForward.normalize();
        const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);

        const worldMoveX = camRight.x * normX + camForward.x * -normY;
        const worldMoveZ = camRight.z * normX + camForward.z * -normY;

        // posture speed multipliers (Sit/Crouch walk = 0.5x, Sleep/Prone crawl = 0.28x)
        const postureMult =
          postureRef.current === 'sit' ? 0.52 : postureRef.current === 'sleep' ? 0.3 : 1.0;
        const sprintMult =
          isSprintingRef.current && postureRef.current === 'stand' ? activeSpec.sprintBonus : 1.0;
        const skillMult = skillActiveRef.current ? 1.22 : 1.0;

        const effectiveSpeed =
          activeSpec.baseSpeed * inputMag * postureMult * sprintMult * skillMult;

        activePhys.gx = clamp(activePhys.gx + worldMoveX * effectiveSpeed * dt, -14.5, 14.5);
        activePhys.gz = clamp(activePhys.gz + worldMoveZ * effectiveSpeed * dt, -14.5, 14.5);

        // Smoothly rotate character heading toward movement direction
        const targetHeading = Math.atan2(worldMoveX, worldMoveZ);
        let diff = targetHeading - activePhys.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        activePhys.heading += diff * clamp(dt * 12, 0, 1);

        activePhys.walkCycle += dt * effectiveSpeed * 2.3;
      }

      /* --- B. Jump & Gravity Physics along Spherical Normal --- */
      if (activePhys.jumpHeight > 0 || activePhys.verticalVel !== 0) {
        activePhys.jumpHeight += activePhys.verticalVel * dt;
        activePhys.verticalVel -= 18.5 * dt; // Gravity
        if (activePhys.jumpHeight <= 0) {
          activePhys.jumpHeight = 0;
          activePhys.verticalVel = 0;
        }
      }

      /* --- C. Update Both Free Fire Character Rigs (Skeletal Poses) --- */
      (['alok', 'kelly'] as CharacterId[]).forEach((cid) => {
        const rig = charRigs[cid];
        const phys = charPhysics[cid];
        const isControlled = cid === currentCharId;
        const charPosture: CharacterPosture = isControlled ? postureRef.current : 'stand';
        const charMoving = isControlled && isMoving;
        const charJumping = phys.jumpHeight > 0.04;
        const charSprinting =
          isControlled && isSprintingRef.current && charPosture === 'stand' && charMoving;

        // Position & orient on the spherical Earth
        const tf = getSphereTransform(phys.gx, phys.gz, phys.jumpHeight);
        rig.root.position.copy(tf.position);
        rig.root.quaternion.copy(tf.quaternion);
        rig.facingGroup.rotation.y = phys.heading;

        // Selection ring & Skill Aura visibility
        rig.selectionRing.visible = isControlled;
        rig.skillAuraGroup.visible = isControlled && skillActiveRef.current;
        if (rig.skillAuraGroup.visible) {
          rig.skillAuraGroup.rotation.y = elapsed * 2.4;
          const auraPulse = 1 + Math.sin(elapsed * 6) * 0.06;
          rig.skillAuraGroup.scale.set(auraPulse, 1, auraPulse);
        }

        // Sleep Zzz Particles
        rig.sleepZzzGroup.visible = charPosture === 'sleep' && !charMoving;
        if (rig.sleepZzzGroup.visible) {
          rig.sleepZzzGroup.children.forEach((zOrb, idx) => {
            const zPhase = (elapsed * 1.2 + idx * 0.33) % 1;
            zOrb.position.y = zPhase * 0.85;
            zOrb.position.x = Math.sin(elapsed * 3 + idx) * 0.15 + idx * 0.12;
            zOrb.scale.setScalar(1 - zPhase * 0.5);
          });
        }

        // Target Skeletal Joint Angles based on Posture & Action
        let targetBodyY = 0;
        let targetBodyPitch = 0;
        let targetTorsoPitch = 0;
        let targetTorsoYaw = 0;
        let targetHeadPitch = 0;
        let lShoulderX = 0,
          lShoulderZ = 0.08,
          lElbowX = -0.15;
        let rShoulderX = 0,
          rShoulderZ = -0.08,
          rElbowX = -0.15;
        let lHipX = 0,
          lKneeX = 0;
        let rHipX = 0,
          rKneeX = 0;

        if (charJumping) {
          // Mid-air Free Fire Jump Pose
          targetBodyY = 0.1;
          targetTorsoPitch = 0.12;
          lShoulderX = -2.1;
          lShoulderZ = 0.35;
          rShoulderX = -2.1;
          rShoulderZ = -0.35;
          lElbowX = -0.4;
          rElbowX = -0.4;
          lHipX = -0.65;
          lKneeX = 1.1;
          rHipX = -0.35;
          rKneeX = 0.75;
        } else if (charPosture === 'sleep') {
          // Prone / Sleeping Horizontal Pose on the grass
          targetBodyY = -0.46;
          targetBodyPitch = Math.PI / 2 - 0.08; // Lie flat horizontally
          if (charMoving) {
            // Tactical Prone Crawl Animation
            const c = phys.walkCycle * 1.2;
            targetTorsoYaw = Math.sin(c) * 0.12;
            lShoulderX = -2.5 + Math.sin(c) * 0.45;
            rShoulderX = -2.5 - Math.sin(c) * 0.45;
            lElbowX = -0.8;
            rElbowX = -0.8;
            lHipX = Math.sin(c) * 0.35;
            rHipX = -Math.sin(c) * 0.35;
            lKneeX = 0.45 + Math.max(0, Math.sin(c)) * 0.4;
            rKneeX = 0.45 + Math.max(0, -Math.sin(c)) * 0.4;
          } else {
            // Peaceful Sleeping Pose (head resting on arm + slow breathing)
            const breath = Math.sin(elapsed * 2.0) * 0.04;
            targetTorsoPitch = breath;
            targetHeadPitch = -0.25;
            lShoulderX = -2.6;
            lShoulderZ = 0.4;
            lElbowX = -1.4;
            rShoulderX = -0.4;
            rShoulderZ = -0.25;
            rElbowX = -0.6;
            lHipX = 0.1;
            rHipX = -0.15;
            lKneeX = 0.25;
            rKneeX = 0.55;
          }
        } else if (charPosture === 'sit') {
          if (charMoving) {
            // Tactical Free Fire Crouch-Walk
            const c = phys.walkCycle * 1.1;
            targetBodyY = -0.22 + Math.abs(Math.sin(c)) * 0.04;
            targetTorsoPitch = 0.38;
            targetHeadPitch = -0.25;
            lHipX = -0.85 + Math.sin(c) * 0.55;
            rHipX = -0.85 - Math.sin(c) * 0.55;
            lKneeX = 1.45;
            rKneeX = 1.45;
            lShoulderX = -Math.sin(c) * 0.5;
            rShoulderX = Math.sin(c) * 0.5;
            lElbowX = -0.85;
            rElbowX = -0.85;
          } else {
            // Seated on the Grass Pose (Cross/Bent knees, hands resting forward)
            targetBodyY = -0.34;
            targetTorsoPitch = 0.12 + Math.sin(elapsed * 2.2) * 0.02;
            lHipX = -1.35;
            rHipX = -1.35;
            lKneeX = 1.65;
            rKneeX = 1.65;
            lShoulderX = -0.45;
            lShoulderZ = 0.15;
            rShoulderX = -0.45;
            rShoulderZ = -0.15;
            lElbowX = -0.65;
            rElbowX = -0.65;
          }
        } else if (isControlled && isEmotingRef.current) {
          // Celebratory Free Fire Booyah Dance / Wave Emote
          const beat = elapsed * 8.0;
          targetBodyY = Math.abs(Math.sin(beat)) * 0.08;
          targetTorsoYaw = Math.sin(beat * 0.5) * 0.35;
          lShoulderX = -2.4 + Math.sin(beat) * 0.35;
          lShoulderZ = 0.45;
          rShoulderX = -2.4 - Math.sin(beat) * 0.35;
          rShoulderZ = -0.45;
          lElbowX = -0.5 + Math.cos(beat) * 0.3;
          rElbowX = -0.5 - Math.cos(beat) * 0.3;
          lHipX = Math.sin(beat * 0.5) * 0.35;
          rHipX = -Math.sin(beat * 0.5) * 0.35;
          lKneeX = Math.max(0, -lHipX) * 0.8;
          rKneeX = Math.max(0, -rHipX) * 0.8;
        } else if (charMoving) {
          // Stand Walk / Free Fire Sprint Cycle
          const c = phys.walkCycle;
          const amp = charSprinting ? 1.15 : 0.72;
          targetBodyY = Math.abs(Math.sin(c * 2)) * (charSprinting ? 0.09 : 0.05);
          targetTorsoPitch = charSprinting ? 0.28 : 0.09;
          targetTorsoYaw = Math.sin(c) * (charSprinting ? 0.18 : 0.08);

          lHipX = Math.sin(c) * amp;
          rHipX = -Math.sin(c) * amp;
          lKneeX = Math.max(0, -Math.sin(c + 0.4)) * (charSprinting ? 1.35 : 0.85);
          rKneeX = Math.max(0, Math.sin(c + 0.4)) * (charSprinting ? 1.35 : 0.85);

          lShoulderX = -Math.sin(c) * amp * 0.95;
          rShoulderX = Math.sin(c) * amp * 0.95;
          lElbowX = charSprinting ? -1.15 : -0.45;
          rElbowX = charSprinting ? -1.15 : -0.45;
        } else {
          // Idle Heroic Breathing Stance
          const idleWave = Math.sin(elapsed * 2.4 + (cid === 'alok' ? 0 : 1.5));
          targetBodyY = idleWave * 0.015;
          lShoulderZ = 0.1 + idleWave * 0.025;
          rShoulderZ = -0.1 - idleWave * 0.025;
          lElbowX = -0.22;
          rElbowX = -0.22;
          // Companion character waves occasionally when idle
          if (!isControlled && Math.sin(elapsed * 0.8) > 0.6) {
            rShoulderX = -2.3;
            rShoulderZ = -0.3 + Math.sin(elapsed * 9) * 0.25;
            rElbowX = -0.4;
          }
        }

        // Smoothly interpolate all skeletal joints
        const lerpRate = clamp(dt * 12, 0, 1);
        rig.bodyPivot.position.y = THREE.MathUtils.lerp(
          rig.bodyPivot.position.y,
          targetBodyY,
          lerpRate,
        );
        rig.bodyPivot.rotation.x = THREE.MathUtils.lerp(
          rig.bodyPivot.rotation.x,
          targetBodyPitch,
          lerpRate,
        );
        rig.torsoGroup.rotation.x = THREE.MathUtils.lerp(
          rig.torsoGroup.rotation.x,
          targetTorsoPitch,
          lerpRate,
        );
        rig.torsoGroup.rotation.y = THREE.MathUtils.lerp(
          rig.torsoGroup.rotation.y,
          targetTorsoYaw,
          lerpRate,
        );
        rig.headGroup.rotation.x = THREE.MathUtils.lerp(
          rig.headGroup.rotation.x,
          targetHeadPitch,
          lerpRate,
        );

        rig.leftShoulder.rotation.x = THREE.MathUtils.lerp(
          rig.leftShoulder.rotation.x,
          lShoulderX,
          lerpRate,
        );
        rig.leftShoulder.rotation.z = THREE.MathUtils.lerp(
          rig.leftShoulder.rotation.z,
          lShoulderZ,
          lerpRate,
        );
        rig.leftElbow.rotation.x = THREE.MathUtils.lerp(
          rig.leftElbow.rotation.x,
          lElbowX,
          lerpRate,
        );

        rig.rightShoulder.rotation.x = THREE.MathUtils.lerp(
          rig.rightShoulder.rotation.x,
          rShoulderX,
          lerpRate,
        );
        rig.rightShoulder.rotation.z = THREE.MathUtils.lerp(
          rig.rightShoulder.rotation.z,
          rShoulderZ,
          lerpRate,
        );
        rig.rightElbow.rotation.x = THREE.MathUtils.lerp(
          rig.rightElbow.rotation.x,
          rElbowX,
          lerpRate,
        );

        rig.leftHip.rotation.x = THREE.MathUtils.lerp(rig.leftHip.rotation.x, lHipX, lerpRate);
        rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, lKneeX, lerpRate);
        rig.rightHip.rotation.x = THREE.MathUtils.lerp(rig.rightHip.rotation.x, rHipX, lerpRate);
        rig.rightKnee.rotation.x = THREE.MathUtils.lerp(
          rig.rightKnee.rotation.x,
          rKneeX,
          lerpRate,
        );
      });

      /* --- D. Camera Follow & Preset Transitions --- */
      const newCharWorldPos = getSphereTransform(
        activePhys.gx,
        activePhys.gz,
        activePhys.jumpHeight + 0.65,
      ).position;

      if (diveProgress < 1) {
        diveProgress = Math.min(1, diveProgress + dt / diveDuration);
        const ease = 1 - Math.pow(1 - diveProgress, 3);
        camera.position.lerpVectors(startCamPos, targetInitialCamPos, ease);
        controls.target.copy(newCharWorldPos);
        if (diveProgress >= 1) {
          setEnteringAtmosphere(false);
        }
      } else if (camTransition) {
        camTransition.progress = Math.min(1, camTransition.progress + dt * 1.6);
        const ease = 1 - Math.pow(1 - camTransition.progress, 3);
        camera.position.lerpVectors(camTransition.startPos, camTransition.endPos, ease);
        controls.target.lerpVectors(camTransition.startTarget, camTransition.endTarget, ease);
        if (camTransition.progress >= 1) camTransition = null;
      } else if (cameraModeRef.current === 'character') {
        // Third-Person Free Fire Follow Camera: translates smoothly with the character while allowing 360° mouse orbit
        const deltaMove = newCharWorldPos.clone().sub(prevCharWorldPos);
        camera.position.add(deltaMove);
        controls.target.lerp(newCharWorldPos, 0.25);
      }

      // Animate clouds & village buildings
      cloudsOrbitGroup.rotation.y = elapsed * 0.025;
      if (animatedParts.townHallCrystal) {
        animatedParts.townHallCrystal.rotation.y = elapsed * 1.4;
        animatedParts.townHallCrystal.position.y = 5.2 + Math.sin(elapsed * 2.5) * 0.2;
      }
      if (animatedParts.mineWheel) animatedParts.mineWheel.rotation.z = elapsed * 1.8;
      if (animatedParts.elixirLiquid) {
        animatedParts.elixirLiquid.scale.y = 0.75 + (Math.sin(elapsed * 2.2) * 0.5 + 0.5) * 0.35;
      }
      if (animatedParts.cannonTurret) {
        animatedParts.cannonTurret.rotation.y = Math.sin(elapsed * 0.8) * 0.85;
      }
      if (animatedParts.campfireFlame) {
        const flicker = 0.9 + Math.sin(elapsed * 14) * 0.12;
        animatedParts.campfireFlame.scale.set(
          flicker,
          1 + Math.cos(elapsed * 18) * 0.15,
          flicker,
        );
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (skillTimer) window.clearTimeout(skillTimer);
      if (emoteTimer) window.clearTimeout(emoteTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, [onExitToSpace, planetId, isOwner]);

  // Passive EP/HP regeneration when sleeping or using DJ Alok's skill
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (posture === 'sleep' || skillActive) {
        setHp((h) => Math.min(200, h + 5));
        setEp((e) => Math.min(200, e + 8));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [posture, skillActive]);

  const currentSpec = FREE_FIRE_CHARACTERS[activeChar];

  return (
    <div
      className="relative h-screen w-screen overflow-hidden select-none bg-[#030712] touch-none"
      onPointerMove={(e) => {
        if (isOwner && joyDraggingRef.current) updateJoystickFromEvent(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        if (joyDraggingRef.current) {
          joyDraggingRef.current = false;
          setJoyKnob({ x: 0, y: 0 });
          joystickVectorRef.current = { x: 0, y: 0 };
        }
      }}
    >
      <div ref={containerRef} className="fixed inset-0 h-full w-full z-[1]" />

      {enteringAtmosphere && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center bg-sky-500/15 backdrop-blur-[2px] transition-opacity duration-500">
          <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3 border-sky-300/60">
            <Compass className="w-5 h-5 text-sky-300 animate-spin" />
            <span className="font-display text-xs sm:text-base font-bold tracking-widest uppercase text-white">
              Entering {planetName} Outpost // {isOwner ? 'Sovereign Control' : 'Spectator Mode'}
            </span>
          </div>
        </div>
      )}

      {/* ==================== TOP HEADER HUD ==================== */}
      <header className="fixed top-0 left-0 right-0 z-20 p-2.5 sm:p-4 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Planet & Ownership Status Badge */}
          <div className="glass-panel rounded-2xl px-3 py-1.5 flex items-center gap-2.5 border-amber-400/50">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-display font-bold text-slate-950 shadow-lg"
              style={{ backgroundColor: isOwner ? currentSpec.accentColor : '#64748b' }}
            >
              {isOwner ? (
                activeChar === 'alok' ? <Music className="w-4 h-4 sm:w-5 sm:h-5" /> : <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-display font-bold text-xs sm:text-sm text-white leading-tight flex items-center gap-1.5">
                <span>{planetName}</span>
                {isOwner ? (
                  <span className="text-[9px] font-mono-tech uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Sovereign
                  </span>
                ) : (
                  <span className="text-[9px] font-mono-tech uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> View Only
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono-tech text-slate-300">
                {isOwner
                  ? `${currentSpec.name} // ${posture.toUpperCase()}`
                  : `Ruler: ${ownerName} (Spectator Mode)`}
              </div>
            </div>
          </div>

          {/* Camera Mode Switcher: 3rd-Person Character vs Village vs Full Globe */}
          <div className="glass-panel rounded-2xl p-1 flex items-center gap-1">
            <button
              onClick={() => actionsBridgeRef.current?.setCamPreset('character')}
              className={`glass-pill px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                cameraMode === 'character' ? 'active-amber text-white' : 'text-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xs:inline">Hero</span>
            </button>
            <button
              onClick={() => actionsBridgeRef.current?.setCamPreset('village')}
              className={`glass-pill px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                cameraMode === 'village' ? 'active text-white' : 'text-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden xs:inline">Outpost</span>
            </button>
            <button
              onClick={() => actionsBridgeRef.current?.setCamPreset('globe')}
              className={`glass-pill px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                cameraMode === 'globe' ? 'active text-white' : 'text-slate-300'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-300" />
              <span className="hidden xs:inline">Globe</span>
            </button>
          </div>

          <button
            onClick={onExitToSpace}
            className="glass-pill px-3 py-1.5 rounded-2xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg hover:border-amber-400/60"
          >
            <Rocket className="w-3.5 h-3.5 text-amber-300" />
            <span>Orbit</span>
          </button>
        </div>

        {/* Right: Character Switcher Cards (Only enabled for Owner) + Village Resources */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <div className="glass-panel rounded-2xl p-1 flex items-center gap-1">
              <button
                onClick={() => actionsBridgeRef.current?.switchCharacter('alok')}
                className={`glass-pill px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  activeChar === 'alok' ? 'active-amber text-white' : 'text-slate-300'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-amber-300" />
                <span>Alok</span>
              </button>
              <button
                onClick={() => actionsBridgeRef.current?.switchCharacter('kelly')}
                className={`glass-pill px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  activeChar === 'kelly' ? 'active-amber text-white' : 'text-slate-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Kelly</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5">
              <div className="glass-panel rounded-2xl px-3 py-1.5 flex items-center gap-2 border-amber-400/40">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-display font-bold text-xs text-amber-300">1,500</span>
              </div>
              <div className="glass-panel rounded-2xl px-3 py-1.5 flex items-center gap-2 border-fuchsia-400/40">
                <Droplets className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="font-display font-bold text-xs text-fuchsia-300">1,500</span>
              </div>
              <div className="glass-panel rounded-2xl px-3 py-1.5 flex items-center gap-2 border-emerald-400/40">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-display font-bold text-xs text-emerald-300">250</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==================== BOTTOM-LEFT: FREE FIRE VIRTUAL ANALOG JOYSTICK (OWNER ONLY) ==================== */}
      {isOwner && (
        <div className="fixed bottom-16 left-4 sm:left-8 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
          <div
            ref={joyBaseRef}
            onPointerDown={(e) => {
              e.stopPropagation();
              joyDraggingRef.current = true;
              updateJoystickFromEvent(e.clientX, e.clientY);
            }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/65 border-2 border-sky-400/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.75)] cursor-grab active:cursor-grabbing"
          >
            <div className="absolute inset-2 rounded-full border border-dashed border-slate-600/60 pointer-events-none" />
            <span className="absolute top-1.5 text-[9px] font-mono-tech text-sky-400/70">W</span>
            <span className="absolute bottom-1.5 text-[9px] font-mono-tech text-sky-400/70">S</span>
            <span className="absolute left-2 text-[9px] font-mono-tech text-sky-400/70">A</span>
            <span className="absolute right-2 text-[9px] font-mono-tech text-sky-400/70">D</span>

            <div
              style={{
                transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)`,
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 border-2 border-white/90 shadow-[0_0_20px_rgba(245,158,11,0.85)] flex items-center justify-center pointer-events-none transition-transform duration-75"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white/80" />
            </div>
          </div>
          <span className="text-[9px] font-mono-tech uppercase tracking-wider text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
            Move / WASD
          </span>
        </div>
      )}

      {/* ==================== BOTTOM-CENTER: HP / EP BAR & BUILDING INSPECTOR ==================== */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 w-[calc(100vw-2rem)] max-w-md pointer-events-auto flex flex-col gap-2">
        {selectedEntity && (
          <div className="glass-panel rounded-2xl p-3 flex items-center justify-between gap-3 border-emerald-400/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {selectedEntity.category}
                </span>
                <span className="text-xs font-mono-tech text-amber-300 font-semibold">
                  Lv.{selectedEntity.level}
                </span>
                <span className="font-display text-sm font-bold text-white">
                  {selectedEntity.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {selectedEntity.description}
              </p>
            </div>
            <div className="glass-pill px-2.5 py-1 rounded-xl text-[11px] font-mono-tech text-sky-300 whitespace-nowrap">
              <Shield className="w-3 h-3 inline mr-1" />
              {selectedEntity.size}x{selectedEntity.size}
            </div>
          </div>
        )}

        {isOwner ? (
          <div className="glass-panel rounded-2xl px-4 py-2 border-slate-700/80 hidden sm:block">
            <div className="flex items-center justify-between text-[10px] font-mono-tech mb-1">
              <span className="text-amber-300 flex items-center gap-1 font-semibold">
                <Zap className="w-3 h-3" /> EP {ep}/200
              </span>
              <span className="text-slate-300 uppercase tracking-wider">
                {skillActive ? `${currentSpec.skillName.toUpperCase()} ACTIVE` : currentSpec.skillName}
              </span>
              <span className="text-emerald-300 flex items-center gap-1 font-bold">
                <Heart className="w-3 h-3 fill-emerald-400" /> HP {hp}/200
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300"
                style={{ width: `${(ep / 200) * 100}%` }}
              />
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-white transition-all duration-300"
                style={{ width: `${(hp / 200) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl px-4 py-2.5 border-rose-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>{planetName}</strong> belongs to <strong>{ownerName}</strong>. You are visiting in Spectator Mode.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ==================== BOTTOM-RIGHT: ACTION & POSTURE CLUSTER (OWNER ONLY) ==================== */}
      {isOwner && (
        <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-8 z-20 flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => actionsBridgeRef.current?.triggerEmote()}
              className={`w-11 h-11 rounded-2xl glass-pill flex flex-col items-center justify-center gap-0.5 ${
                isEmoting ? 'active-amber text-white' : 'text-slate-200'
              }`}
              title="Booyah Dance Emote [B]"
            >
              <Smile className="w-4 h-4 text-pink-400" />
              <span className="text-[8px] font-mono-tech">Emote</span>
            </button>

            <button
              onClick={() => {
                isSprintingRef.current = !isSprintingRef.current;
                setIsSprinting(isSprintingRef.current);
                if (isSprintingRef.current && postureRef.current !== 'stand') {
                  postureRef.current = 'stand';
                  setPosture('stand');
                }
              }}
              className={`w-12 h-11 rounded-2xl glass-pill flex flex-col items-center justify-center gap-0.5 ${
                isSprinting ? 'active-amber text-white' : 'text-slate-200'
              }`}
              title="Toggle Sprint [Shift]"
            >
              <Footprints className="w-4 h-4 text-amber-300" />
              <span className="text-[8px] font-mono-tech">Sprint</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => actionsBridgeRef.current?.activateSkill()}
              className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex flex-col items-center justify-center border-2 transition-all shadow-lg ${
                skillActive
                  ? 'bg-gradient-to-br from-amber-400 via-fuchsia-500 to-indigo-600 border-white scale-105 shadow-[0_0_30px_rgba(245,158,11,0.9)]'
                  : 'bg-slate-900/85 border-amber-400/70 hover:border-amber-300'
              }`}
              title={`${currentSpec.skillName}: ${currentSpec.skillDesc} [F]`}
            >
              {activeChar === 'alok' ? (
                <Music className="w-5 h-5 text-amber-300" />
              ) : (
                <Zap className="w-5 h-5 text-yellow-300" />
              )}
              <span className="text-[8px] font-mono-tech font-bold text-white mt-0.5">SKILL</span>
            </button>

            <button
              onClick={() => actionsBridgeRef.current?.setPostureState('sit')}
              className={`w-12 h-12 rounded-full glass-pill flex flex-col items-center justify-center border-2 ${
                posture === 'sit'
                  ? 'active border-sky-400 text-white scale-105'
                  : 'border-slate-600/70 text-slate-200'
              }`}
              title="Sit / Crouch [C]"
            >
              <span className="text-[10px] font-display font-bold">SIT</span>
            </button>

            <button
              onClick={() => actionsBridgeRef.current?.setPostureState('sleep')}
              className={`w-12 h-12 rounded-full glass-pill flex flex-col items-center justify-center border-2 ${
                posture === 'sleep'
                  ? 'active border-indigo-400 text-white scale-105'
                  : 'border-slate-600/70 text-slate-200'
              }`}
              title="Sleep / Lie Prone [Z]"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-[8px] font-mono-tech text-indigo-200">SLEEP</span>
            </button>

            <button
              onClick={() => actionsBridgeRef.current?.triggerJump()}
              className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-white/80 shadow-[0_0_22px_rgba(56,189,248,0.65)] active:scale-95 flex flex-col items-center justify-center text-white transition-transform"
              title="Jump [Space]"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[8px] font-mono-tech font-bold">JUMP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 1. CELESTIAL & DEEP-SPACE ASTRONOMICAL DATABASE (13 TARGETS) ---------- */

interface CelestialBodyData {
  id: string;
  keybind: string;
  name: string;
  order: string;
  classification: string;
  radius: number;
  distance?: number;
  orbitalSpeed?: number;
  rotationSpeed?: number;
  tilt?: number;
  eccentricity?: number;
  isDeepSpace?: boolean;
  position?: [number, number, number];
  color: string;
  badgeBg: string;
  diameter: string;
  distanceText: string;
  orbitText: string;
  tempText: string;
  moonsText: string;
  rotationText: string;
  gravity: string;
  atmosphere: string;
  description: string;
}

const CELESTIAL_DATA: CelestialBodyData[] = [
  {
    id: 'sun',
    keybind: '0',
    name: 'Helios Prime',
    order: 'STAR // 00',
    classification: 'G2V Sovereign Star',
    radius: 13.5,
    distance: 0,
    orbitalSpeed: 0,
    rotationSpeed: 0.003,
    tilt: 7.25,
    color: '#fbbf24',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fef08a, #f59e0b, #dc2626)',
    diameter: '1,392,700 km',
    distanceText: '0.00 AU (Center)',
    orbitText: '230M Yrs (Galactic)',
    tempText: '5,500°C (Photosphere)',
    moonsText: '8 Sovereign Earth Realms',
    rotationText: '25.4 Days / 7.25°',
    gravity: 'Gravity: 274 m/s²',
    atmosphere: '73% Hydrogen, 25% Helium, active magnetic plasma arches & CME shockwaves',
    description:
      'The gravitational and radiative heart of the Sovereign Grid. Sustains eight habitable Earth-class worlds with golden sunlight and magnetic solar wind.',
  },
  {
    id: 'gaia',
    keybind: '1',
    name: 'Gaia',
    order: 'REALM // 01',
    classification: 'Prime Oceanic Earth World',
    radius: 4.0,
    distance: 35,
    orbitalSpeed: 1.35,
    rotationSpeed: 0.012,
    tilt: 23.4,
    eccentricity: 0.015,
    color: '#38bdf8',
    badgeBg: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7, #1e3a8a)',
    diameter: '12,742 km',
    distanceText: '0.68 AU',
    orbitText: '280 Days',
    tempText: '16°C Mean (Temperate)',
    moonsText: '1 (Selene)',
    rotationText: '24h 00m / 23.4°',
    gravity: 'Gravity: 9.81 m/s²',
    atmosphere: '78% Nitrogen, 21% Oxygen, dynamic Cumulus & Cirrus cloud decks',
    description:
      'The ancestral cradle of life. Features deep sapphire oceans, lush emerald continents, snow-capped tectonic cordilleras, and a bright Rayleigh-scattering blue atmosphere.',
  },
  {
    id: 'olympus',
    keybind: '2',
    name: 'Olympus',
    order: 'REALM // 02',
    classification: 'Highland Terrestrial Earth World',
    radius: 4.8,
    distance: 58,
    orbitalSpeed: 1.12,
    rotationSpeed: 0.011,
    tilt: 19.8,
    eccentricity: 0.012,
    color: '#f59e0b',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fde68a, #0284c7, #1e3a8a)',
    diameter: '14,850 km',
    distanceText: '0.88 AU',
    orbitText: '330 Days',
    tempText: '18°C Mean (Mediterranean)',
    moonsText: '1 (Aegis)',
    rotationText: '25h 12m / 19.8°',
    gravity: 'Gravity: 10.2 m/s²',
    atmosphere: '77% Nitrogen, 22% Oxygen, golden-rimmed mountain cloud formations',
    description:
      'An Earth-like world famed for its towering marble-white mountain ranges, sunlit Mediterranean archipelagos, warm azure seas, and fertile golden plateaus.',
  },
  {
    id: 'elysium',
    keybind: '3',
    name: 'Elysium',
    order: 'REALM // 03',
    classification: 'Verdant Garden Earth World',
    radius: 4.3,
    distance: 82,
    orbitalSpeed: 0.96,
    rotationSpeed: 0.0125,
    tilt: 21.5,
    eccentricity: 0.016,
    color: '#10b981',
    badgeBg: 'radial-gradient(circle at 30% 30%, #6ee7b7, #059669, #0c4a6e)',
    diameter: '13,620 km',
    distanceText: '1.05 AU',
    orbitText: '385 Days',
    tempText: '17°C Mean (Subtropical)',
    moonsText: '1 (Aura)',
    rotationText: '23h 45m / 21.5°',
    gravity: 'Gravity: 9.75 m/s²',
    atmosphere: '78% Nitrogen, 21.5% Oxygen, trade-wind cyclone wisps',
    description:
      'A paradise Earth world covered in vast emerald rainforest basins, winding river deltas, shimmering turquoise lagoons, and tranquil polar ice sheets.',
  },
  {
    id: 'atlantis',
    keybind: '4',
    name: 'Atlantis',
    order: 'REALM // 04',
    classification: 'Pelagic Archipelago Earth World',
    radius: 3.7,
    distance: 105,
    orbitalSpeed: 0.82,
    rotationSpeed: 0.013,
    tilt: 24.0,
    eccentricity: 0.02,
    color: '#06b6d4',
    badgeBg: 'radial-gradient(circle at 30% 30%, #67e8f9, #0891b2, #172554)',
    diameter: '11,940 km',
    distanceText: '1.28 AU',
    orbitText: '460 Days',
    tempText: '15°C Mean (Pelagic)',
    moonsText: '2 (Triton & Nereus)',
    rotationText: '22h 50m / 24.0°',
    gravity: 'Gravity: 9.60 m/s²',
    atmosphere: '79% Nitrogen, 20.5% Oxygen, oceanic marine cloud bands',
    description:
      'A breathtaking oceanic Earth world where ring-shaped island continents and shallow turquoise coral shelves rise above deep cobalt-blue oceans.',
  },
  {
    id: 'arcadia',
    keybind: '5',
    name: 'Arcadia',
    order: 'REALM // 05',
    classification: 'Sylvan Super-Earth World',
    radius: 5.8,
    distance: 164,
    orbitalSpeed: 0.64,
    rotationSpeed: 0.014,
    tilt: 18.2,
    eccentricity: 0.018,
    color: '#22c55e',
    badgeBg: 'radial-gradient(circle at 30% 30%, #86efac, #16a34a, #1e3a8a)',
    diameter: '17,400 km',
    distanceText: '1.65 AU',
    orbitText: '610 Days',
    tempText: '14°C Mean (Temperate Forest)',
    moonsText: '2 (Pan & Sylvan)',
    rotationText: '21h 30m / 18.2°',
    gravity: 'Gravity: 10.6 m/s²',
    atmosphere: '77% Nitrogen, 22% Oxygen, rich biosphere mist & aurorae',
    description:
      'An unspoiled pastoral Super-Earth of sprawling redwood continents, alpine lakes, deep sapphire seas, and crisp highland valleys.',
  },
  {
    id: 'hyperborea',
    keybind: '6',
    name: 'Hyperborea',
    order: 'REALM // 06',
    classification: 'Boreal Terrestrial Earth World',
    radius: 5.2,
    distance: 200,
    orbitalSpeed: 0.51,
    rotationSpeed: 0.012,
    tilt: 26.2,
    eccentricity: 0.022,
    color: '#60a5fa',
    badgeBg: 'radial-gradient(circle at 30% 30%, #e0f2fe, #2563eb, #1e1b4b)',
    diameter: '15,900 km',
    distanceText: '2.10 AU',
    orbitText: '820 Days',
    tempText: '9°C Mean (Boreal Alpine)',
    moonsText: '1 (Boreas)',
    rotationText: '24h 20m / 26.2°',
    gravity: 'Gravity: 9.88 m/s²',
    atmosphere: '78% Nitrogen, 21% Oxygen, crystalline polar clouds',
    description:
      'A majestic northern-style Earth world of pine-covered continents, dramatic fjord coastlines, geothermal valleys, and expansive polar ice caps.',
  },
  {
    id: 'avalon',
    keybind: '7',
    name: 'Avalon',
    order: 'REALM // 07',
    classification: 'Misty Isle Earth World',
    radius: 4.4,
    distance: 234,
    orbitalSpeed: 0.4,
    rotationSpeed: 0.0115,
    tilt: 22.8,
    eccentricity: 0.014,
    color: '#34d399',
    badgeBg: 'radial-gradient(circle at 30% 30%, #a7f3d0, #0d9488, #1e3a8a)',
    diameter: '13,880 km',
    distanceText: '2.65 AU',
    orbitText: '1,120 Days',
    tempText: '13°C Mean (Temperate Maritime)',
    moonsText: '1 (Nimue)',
    rotationText: '24h 40m / 22.8°',
    gravity: 'Gravity: 9.72 m/s²',
    atmosphere: '78% Nitrogen, 21% Oxygen, silver-white atmospheric cloud swirls',
    description:
      'A mystical Earth-twin of emerald island continents, inland freshwater seas, silver cloud ribbons, and calm aquamarine coastal shelves.',
  },
  {
    id: 'aether',
    keybind: '8',
    name: 'Aether',
    order: 'REALM // 08',
    classification: 'Celestial Frontier Earth World',
    radius: 4.6,
    distance: 268,
    orbitalSpeed: 0.32,
    rotationSpeed: 0.013,
    tilt: 20.5,
    eccentricity: 0.01,
    color: '#818cf8',
    badgeBg: 'radial-gradient(circle at 30% 30%, #c7d2fe, #0284c7, #1e1b4b)',
    diameter: '14,350 km',
    distanceText: '3.20 AU',
    orbitText: '1,480 Days',
    tempText: '12°C Mean (Highland Earth)',
    moonsText: '1 (Hemera)',
    rotationText: '23h 15m / 20.5°',
    gravity: 'Gravity: 9.90 m/s²',
    atmosphere: '78% Nitrogen, 21% Oxygen, high-altitude indigo-blue Rayleigh halo',
    description:
      'The outermost sovereign Earth world, where deep indigo oceans meet lush temperate continents beneath a luminous sapphire-violet atmospheric crown.',
  },
  {
    id: 'orion',
    keybind: '',
    name: 'Orion Nebula (M42)',
    order: 'DEEP SPACE // M42',
    classification: 'Diffuse Emission Nebula',
    isDeepSpace: true,
    radius: 58,
    position: [-780, 210, -820],
    color: '#d946ef',
    badgeBg: 'radial-gradient(circle at 30% 30%, #f5d0fe, #d946ef, #06b6d4)',
    diameter: '24 Light-Years Across',
    distanceText: '1,344 Light-Years',
    orbitText: 'Milky Way Orion Arm',
    tempText: '10,000 K (Ionized H-II)',
    moonsText: 'Trapezium OB Star Cluster',
    rotationText: 'Turbulent Gas Expansion',
    gravity: 'Stellar Nursery Collapse',
    atmosphere: 'Ionized Hydrogen (H-alpha magenta), Doubly Ionized Oxygen (O-III teal-cyan), PAH dust',
    description:
      'One of the brightest diffuse nebulae in the night sky and the closest massive star-forming nursery to Earth. Ultraviolet radiation from the central Trapezium cluster sculpts glowing cavitary clouds of magenta hydrogen and cyan oxygen.',
  },
  {
    id: 'andromeda',
    keybind: '',
    name: 'Andromeda (M31)',
    order: 'GALAXY // M31',
    classification: 'Barred Spiral Galaxy (SA(s)b)',
    isDeepSpace: true,
    radius: 85,
    position: [920, 310, -760],
    color: '#818cf8',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fef08a, #6366f1, #1e1b4b)',
    diameter: '152,000 Light-Years',
    distanceText: '2.537 Million Light-Years',
    orbitText: 'Approaching at 110 km/s',
    tempText: '1 Trillion Stars',
    moonsText: 'M32 & M110 Dwarf Galaxies',
    rotationText: 'Oblique 77° Inclination',
    gravity: 'Supermassive Core (1.4×10⁸ M☉)',
    atmosphere: 'Logarithmic spiral arms of young O/B blue stars, H-II regions, and golden-white bulge',
    description:
      'The nearest major spiral galaxy to the Milky Way. Rendered here as a 3D logarithmic spiral disk angled at 77°, showcasing its dense golden stellar bulge and twin spiral arms studded with blue star clusters.',
  },
  {
    id: 'vela_pulsar',
    keybind: '',
    name: 'Vela Pulsar',
    order: 'PULSAR // PSR B0833',
    classification: 'Magnetized Neutron Star',
    isDeepSpace: true,
    radius: 18,
    position: [-620, -195, 690],
    color: '#22d3ee',
    badgeBg: 'radial-gradient(circle at 30% 30%, #ffffff, #22d3ee, #0284c7)',
    diameter: '20 km Core (Jets: 1.5 LY)',
    distanceText: '936 Light-Years',
    orbitText: 'Vela Supernova Remnant',
    tempText: '1,000,000 K Surface',
    moonsText: 'Relativistic Twin Polar Jets',
    rotationText: '11.19 Spins / Second (89 ms)',
    gravity: 'Surface: ~1.5×10¹² m/s²',
    atmosphere: 'Ultra-relativistic electron-positron magnetosphere & synchrotron radiation',
    description:
      'The collapsed ultra-dense neutron star remnant of a Type II supernova that exploded 11,000 years ago. Its misaligned magnetic axis whips twin relativistic particle beams across space like a cosmic lighthouse.',
  },
  {
    id: 'crab_pulsar',
    keybind: '',
    name: 'Crab Pulsar (M1)',
    order: 'PULSAR // PSR B0531',
    classification: 'Young Millisecond Pulsar',
    isDeepSpace: true,
    radius: 18,
    position: [740, -230, 640],
    color: '#c084fc',
    badgeBg: 'radial-gradient(circle at 30% 30%, #ffffff, #c084fc, #6b21a8)',
    diameter: '25 km Core (Synchrotron Nebula)',
    distanceText: '6,500 Light-Years',
    orbitText: '1054 AD Supernova Remnant',
    tempText: '1.6×10⁶ K Surface',
    moonsText: 'Equatorial X-Ray Torus & Jets',
    rotationText: '30.2 Spins / Second (33 ms)',
    gravity: 'Magnetic Field: 3.8×10⁸ Tesla',
    atmosphere: 'Gamma-ray, X-ray & optical synchrotron emission beams',
    description:
      'Born in the historic supernova observed in 1054 AD, the Crab Pulsar spins 30 times a second, accelerating particles to near lightspeed in twin opposing violet-cyan relativistic jets.',
  },
];

/* ---------- 2. DETERMINISTIC NOISE & PROCEDURAL TEXTURE SYNTHESIS ENGINE ---------- */

class ProceduralNoise {
  private p: Uint8Array;

  constructor(seed = 1337) {
    this.p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  private lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }
  private grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise3D(x: number, y: number, z: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x),
      v = this.fade(y),
      w = this.fade(z);
    const A = this.p[X] + Y,
      AA = this.p[A] + Z,
      AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y,
      BA = this.p[B] + Z,
      BB = this.p[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z)),
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1),
        ),
        this.lerp(
          u,
          this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
        ),
      ),
    );
  }

  sphereFBM(u: number, v: number, scale: number, octaves = 5, persistence = 0.5, lacunarity = 2.0) {
    const theta = u * Math.PI * 2;
    const phi = v * Math.PI;
    const sx = Math.sin(phi) * Math.cos(theta) * scale;
    const sy = Math.cos(phi) * scale;
    const sz = Math.sin(phi) * Math.sin(theta) * scale;

    let total = 0,
      frequency = 1,
      amplitude = 1,
      maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise3D(sx * frequency, sy * frequency, sz * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return (total / maxValue) * 0.5 + 0.5;
  }
}

const noiseGen = new ProceduralNoise(42069);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function mixColor(c1: number[], c2: number[], t: number): [number, number, number] {
  const tc = clamp(t, 0, 1);
  return [
    c1[0] + (c2[0] - c1[0]) * tc,
    c1[1] + (c2[1] - c1[1]) * tc,
    c1[2] + (c2[2] - c1[2]) * tc,
  ];
}

// Biome & Continent Profiles for all 8 Ancient English Earth Realms
interface EarthBiomeProfile {
  seedOffsetU: number;
  seedOffsetV: number;
  continentScale: number;
  seaLevel: number;
  iceThreshold: number;
  deepOcean: [number, number, number];
  midOcean: [number, number, number];
  coastalShelf: [number, number, number];
  lowlandForest: [number, number, number];
  highlandForest: [number, number, number];
  savannaDesert: [number, number, number];
  mountainRock: [number, number, number];
  snowPeak: [number, number, number];
}

const EARTH_REALM_PROFILES: Record<string, EarthBiomeProfile> = {
  gaia: {
    seedOffsetU: 1.7,
    seedOffsetV: 0.4,
    continentScale: 2.35,
    seaLevel: 0.5,
    iceThreshold: 0.84,
    deepOcean: [6, 26, 68],
    midOcean: [14, 58, 124],
    coastalShelf: [28, 126, 178],
    lowlandForest: [30, 86, 42],
    highlandForest: [72, 124, 54],
    savannaDesert: [194, 158, 98],
    mountainRock: [110, 96, 84],
    snowPeak: [244, 248, 255],
  },
  olympus: {
    seedOffsetU: 5.2,
    seedOffsetV: 2.1,
    continentScale: 2.15,
    seaLevel: 0.47,
    iceThreshold: 0.82,
    deepOcean: [8, 32, 78],
    midOcean: [18, 72, 138],
    coastalShelf: [42, 146, 192],
    lowlandForest: [46, 98, 44],
    highlandForest: [92, 134, 58],
    savannaDesert: [212, 172, 104],
    mountainRock: [132, 118, 102],
    snowPeak: [250, 250, 255],
  },
  elysium: {
    seedOffsetU: 9.4,
    seedOffsetV: 3.7,
    continentScale: 2.5,
    seaLevel: 0.51,
    iceThreshold: 0.86,
    deepOcean: [5, 34, 72],
    midOcean: [12, 76, 128],
    coastalShelf: [24, 158, 172],
    lowlandForest: [22, 96, 48],
    highlandForest: [58, 138, 66],
    savannaDesert: [176, 156, 92],
    mountainRock: [104, 98, 88],
    snowPeak: [242, 250, 252],
  },
  atlantis: {
    seedOffsetU: 13.8,
    seedOffsetV: 6.2,
    continentScale: 3.1,
    seaLevel: 0.555,
    iceThreshold: 0.85,
    deepOcean: [4, 28, 76],
    midOcean: [14, 74, 144],
    coastalShelf: [38, 176, 204],
    lowlandForest: [28, 98, 56],
    highlandForest: [68, 132, 72],
    savannaDesert: [208, 184, 128],
    mountainRock: [116, 108, 98],
    snowPeak: [245, 250, 255],
  },
  arcadia: {
    seedOffsetU: 18.1,
    seedOffsetV: 1.9,
    continentScale: 2.2,
    seaLevel: 0.485,
    iceThreshold: 0.83,
    deepOcean: [7, 28, 66],
    midOcean: [16, 62, 122],
    coastalShelf: [32, 134, 168],
    lowlandForest: [24, 82, 38],
    highlandForest: [64, 118, 48],
    savannaDesert: [182, 148, 88],
    mountainRock: [106, 92, 80],
    snowPeak: [244, 248, 252],
  },
  hyperborea: {
    seedOffsetU: 23.5,
    seedOffsetV: 4.8,
    continentScale: 2.4,
    seaLevel: 0.5,
    iceThreshold: 0.72,
    deepOcean: [6, 22, 62],
    midOcean: [14, 52, 116],
    coastalShelf: [44, 128, 182],
    lowlandForest: [28, 76, 52],
    highlandForest: [62, 108, 74],
    savannaDesert: [168, 156, 124],
    mountainRock: [118, 118, 126],
    snowPeak: [248, 252, 255],
  },
  avalon: {
    seedOffsetU: 29.3,
    seedOffsetV: 7.4,
    continentScale: 2.75,
    seaLevel: 0.525,
    iceThreshold: 0.84,
    deepOcean: [6, 32, 70],
    midOcean: [16, 72, 128],
    coastalShelf: [36, 154, 176],
    lowlandForest: [26, 92, 54],
    highlandForest: [66, 132, 76],
    savannaDesert: [188, 166, 108],
    mountainRock: [112, 104, 96],
    snowPeak: [246, 250, 255],
  },
  aether: {
    seedOffsetU: 35.7,
    seedOffsetV: 2.9,
    continentScale: 2.3,
    seaLevel: 0.505,
    iceThreshold: 0.81,
    deepOcean: [8, 24, 74],
    midOcean: [18, 56, 134],
    coastalShelf: [42, 132, 194],
    lowlandForest: [32, 88, 56],
    highlandForest: [74, 126, 72],
    savannaDesert: [192, 162, 112],
    mountainRock: [116, 106, 102],
    snowPeak: [246, 248, 255],
  },
};

const planetTextureCache = new Map<
  string,
  { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture; specularMap: THREE.CanvasTexture | null }
>();
const cloudTextureCache = new Map<string, THREE.CanvasTexture>();
let cachedSkyboxTexture: THREE.CanvasTexture | null = null;

function generatePlanetTextures(planetId: string) {
  const cached = planetTextureCache.get(planetId);
  if (cached) return cached;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const width = isMobile ? 384 : 512;
  const height = isMobile ? 192 : 256;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = width;
  albedoCanvas.height = height;
  const albedoCtx = albedoCanvas.getContext('2d')!;
  const albedoData = albedoCtx.createImageData(width, height);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  const bumpData = bumpCtx.createImageData(width, height);

  const isMoon = planetId === 'moon';
  let specCanvas: HTMLCanvasElement | null = null;
  let specCtx: CanvasRenderingContext2D | null = null;
  let specData: ImageData | null = null;
  if (!isMoon) {
    specCanvas = document.createElement('canvas');
    specCanvas.width = width;
    specCanvas.height = height;
    specCtx = specCanvas.getContext('2d')!;
    specData = specCtx.createImageData(width, height);
  }

  const craters: { x: number; y: number; z: number; r: number; depth: number }[] = [];
  if (isMoon) {
    let s = 213;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < 80; i++) {
      const u = rand();
      const v = 0.1 + rand() * 0.8;
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;
      craters.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
        r: 0.025 + Math.pow(rand(), 2.6) * 0.16,
        depth: 0.4 + rand() * 0.6,
      });
    }
  }

  const profile = EARTH_REALM_PROFILES[planetId] || EARTH_REALM_PROFILES.gaia;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi),
      cosPhi = Math.cos(phi);
    const poleFactor = Math.abs(v * 2 - 1);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const theta = u * Math.PI * 2;
      const px = sinPhi * Math.cos(theta),
        py = cosPhi,
        pz = sinPhi * Math.sin(theta);

      const idx = (y * width + x) * 4;
      let rgb: [number, number, number] = [128, 128, 128];
      let bumpVal = 128;

      if (isMoon) {
        const n1 = noiseGen.sphereFBM(u, v, 3.2, 3, 0.55);
        const n2 = noiseGen.sphereFBM(u + 0.3, v, 12.0, 2, 0.5);
        let h = n1 * 0.7 + n2 * 0.3;
        let craterOffset = 0;
        for (let c = 0; c < craters.length; c++) {
          const cr = craters[c];
          const dx = px - cr.x,
            dy = py - cr.y,
            dz = pz - cr.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          const rSq = cr.r * cr.r;
          if (distSq < rSq * 1.44) {
            const d = Math.sqrt(distSq) / cr.r;
            if (d < 0.82) craterOffset -= (1 - (d / 0.82) * (d / 0.82)) * 0.38 * cr.depth;
            else if (d < 1.2)
              craterOffset += Math.sin(((d - 0.82) / 0.38) * Math.PI) * 0.22 * cr.depth;
          }
        }
        h = clamp(h + craterOffset, 0, 1);
        rgb =
          h < 0.48
            ? mixColor([90, 92, 98], [155, 158, 162], h / 0.48)
            : mixColor([155, 158, 162], [215, 218, 222], (h - 0.48) / 0.52);
        bumpVal = clamp(h * 255, 0, 255);
      } else if (specData) {
        // Photorealistic Earth-Class World Synthesis (Smooth Continents, Coastal Shelves, Specular Water & Mountain Relief)
        const su = u + profile.seedOffsetU;
        const sv = v + profile.seedOffsetV;
        const warpU = noiseGen.sphereFBM(su, sv, 2.2, 2, 0.5) * 0.085;
        const warpV = noiseGen.sphereFBM(su + 2.4, sv + 1.9, 2.2, 2, 0.5) * 0.085;
        const cont = noiseGen.sphereFBM(su + warpU, sv + warpV, profile.continentScale, 4, 0.54);
        const detail = noiseGen.sphereFBM(su, sv, 14.0, 2, 0.5);
        const moisture = noiseGen.sphereFBM(su + 3.1, sv + 1.2, 3.5, 2, 0.5);
        const seaLevel = profile.seaLevel;
        const iceThreshold = profile.iceThreshold - (detail - 0.5) * 0.08;

        if (poleFactor > iceThreshold) {
          rgb = profile.snowPeak;
          bumpVal = 148;
          specData.data[idx] = 65;
          specData.data[idx + 1] = 65;
          specData.data[idx + 2] = 65;
          specData.data[idx + 3] = 255;
        } else if (cont < seaLevel) {
          const depthT = clamp(cont / seaLevel, 0, 1);
          rgb =
            depthT < 0.82
              ? mixColor(profile.deepOcean, profile.midOcean, depthT / 0.82)
              : mixColor(profile.midOcean, profile.coastalShelf, (depthT - 0.82) / 0.18);
          bumpVal = 110;
          specData.data[idx] = 235;
          specData.data[idx + 1] = 242;
          specData.data[idx + 2] = 255;
          specData.data[idx + 3] = 255;
        } else {
          const landElev = clamp((cont - seaLevel) / (1 - seaLevel), 0, 1);
          const latDist = Math.abs(poleFactor - 0.25);
          const desertFactor = clamp((1 - latDist * 3.8) * (1 - moisture * 0.9), 0, 1);
          let baseLand = mixColor(profile.lowlandForest, profile.highlandForest, detail);
          baseLand = mixColor(baseLand, profile.savannaDesert, desertFactor);
          if (landElev > 0.6)
            rgb = mixColor(profile.mountainRock, profile.snowPeak, (landElev - 0.6) / 0.4);
          else if (landElev > 0.34)
            rgb = mixColor(baseLand, profile.mountainRock, (landElev - 0.34) / 0.26);
          else rgb = baseLand;
          bumpVal = clamp(128 + landElev * 127 + (detail - 0.5) * 35, 120, 255);
          specData.data[idx] = 16;
          specData.data[idx + 1] = 16;
          specData.data[idx + 2] = 16;
          specData.data[idx + 3] = 255;
        }
      }

      albedoData.data[idx] = rgb[0];
      albedoData.data[idx + 1] = rgb[1];
      albedoData.data[idx + 2] = rgb[2];
      albedoData.data[idx + 3] = 255;

      bumpData.data[idx] = bumpVal;
      bumpData.data[idx + 1] = bumpVal;
      bumpData.data[idx + 2] = bumpVal;
      bumpData.data[idx + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;

  let specularMap: THREE.CanvasTexture | null = null;
  if (specCanvas && specCtx && specData) {
    specCtx.putImageData(specData, 0, 0);
    specularMap = new THREE.CanvasTexture(specCanvas);
  }

  const result = { map, bumpMap, specularMap };
  planetTextureCache.set(planetId, result);
  return result;
}

function generateEarthCloudsTexture(planetId = 'gaia') {
  const cached = cloudTextureCache.get(planetId);
  if (cached) return cached;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const width = isMobile ? 384 : 512;
  const height = isMobile ? 192 : 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  const profile = EARTH_REALM_PROFILES[planetId] || EARTH_REALM_PROFILES.gaia;
  const offsetU = profile.seedOffsetU * 0.7;
  const offsetV = profile.seedOffsetV * 0.7;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const warp = noiseGen.sphereFBM(u + 2.0 + offsetU, v + 1.0 + offsetV, 3.2, 2, 0.5) * 0.1;
      const n = noiseGen.sphereFBM(u + offsetU + warp, v + offsetV + warp * 0.5, 4.5, 3, 0.56);
      const cloudAlpha = clamp((n - 0.47) * 3.1, 0, 1);
      const idx = (y * width + x) * 4;
      imgData.data[idx] = 255;
      imgData.data[idx + 1] = 255;
      imgData.data[idx + 2] = 255;
      imgData.data[idx + 3] = Math.floor(cloudAlpha * 235);
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cloudTextureCache.set(planetId, tex);
  return tex;
}

function generateRingTexture(isSaturn = true) {
  const width = 512,
    height = 32;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let x = 0; x < width; x++) {
    const r = x / width;
    let alpha = 0;
    let rgb: [number, number, number] = [215, 195, 160];

    if (isSaturn) {
      const fineRing = Math.sin(r * 420) * 0.5 + 0.5;
      const microRing = Math.cos(r * 1150) * 0.5 + 0.5;
      if (r > 0.05 && r < 0.24) {
        alpha = 0.18 + fineRing * 0.12;
        rgb = [165, 152, 135];
      } else if (r >= 0.24 && r < 0.62) {
        alpha = 0.72 + fineRing * 0.22 + microRing * 0.06;
        rgb = mixColor([210, 185, 145], [248, 232, 198], fineRing);
      } else if (r >= 0.62 && r < 0.675) {
        alpha = 0.03;
        rgb = [80, 75, 70];
      } else if (r >= 0.675 && r < 0.94) {
        if (r > 0.865 && r < 0.88) alpha = 0.04;
        else {
          alpha = 0.52 + fineRing * 0.18;
          rgb = mixColor([195, 178, 148], [228, 212, 182], microRing);
        }
      } else if (r >= 0.955 && r < 0.97) {
        alpha = 0.35;
        rgb = [220, 205, 180];
      }
    } else {
      if (
        (r > 0.35 && r < 0.38) ||
        (r > 0.52 && r < 0.54) ||
        (r > 0.75 && r < 0.78) ||
        (r > 0.91 && r < 0.95)
      ) {
        alpha = 0.28;
        rgb = [160, 225, 240];
      }
    }

    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      imgData.data[idx] = rgb[0];
      imgData.data[idx + 1] = rgb[1];
      imgData.data[idx + 2] = rgb[2];
      imgData.data[idx + 3] = clamp(Math.floor(alpha * 255), 0, 255);
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createCoronaGlowTexture(colorInner: string, colorMid: string, colorOuter: string) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0.0, colorInner);
  grad.addColorStop(0.28, colorMid);
  grad.addColorStop(0.65, colorOuter);
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function generateCosmosSkyboxTexture() {
  if (cachedSkyboxTexture) return cachedSkyboxTexture;
  const width = 512,
    height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const galacticCenterV = 0.5 + Math.sin(u * Math.PI * 2) * 0.18;
      const distFromPlane = Math.abs(v - galacticCenterV);
      const planeMask = Math.exp(-distFromPlane * distFromPlane * 36.0);

      const neb1 = noiseGen.sphereFBM(u, v, 2.6, 3, 0.55);
      const neb2 = noiseGen.sphereFBM(u + 4.2, v + 1.8, 5.2, 2, 0.5);
      const dustLane = noiseGen.sphereFBM(u * 2.0, v * 3.0, 6.5, 2, 0.55);

      let col: [number, number, number] = [2, 4, 11];
      col = mixColor(col, [16, 26, 64], clamp(neb1 * planeMask * 1.35, 0, 1));
      col = mixColor(col, [52, 28, 78], clamp(neb2 * planeMask * 0.9, 0, 1));
      col = mixColor(col, [18, 62, 92], clamp(neb1 * neb2 * 0.8, 0, 1));

      if (distFromPlane < 0.05 && dustLane > 0.52) {
        const rift = clamp((dustLane - 0.52) * 2.5 * (1 - distFromPlane / 0.05), 0, 0.75);
        col = mixColor(col, [3, 5, 12], rift);
      }

      const idx = (y * width + x) * 4;
      imgData.data[idx] = col[0];
      imgData.data[idx + 1] = col[1];
      imgData.data[idx + 2] = col[2];
      imgData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedSkyboxTexture = tex;
  return tex;
}

/* ---------- 3. CUSTOM GLSL SHADERS (SUN, SOLAR MAGNETIC LOOPS & ATMOSPHERES) ---------- */

const SunShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uFlareBoost;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vec3 p = normalize(vPosition) * 3.8;
      float n1 = snoise(p + vec3(uTime * 0.14, -uTime * 0.09, uTime * 0.11));
      float n2 = snoise(p * 2.7 - vec3(uTime * 0.22));
      float n3 = snoise(p * 6.5 + vec3(0.0, uTime * 0.35, 0.0));
      float granule = (n1 * 0.5 + n2 * 0.32 + n3 * 0.18) * 0.5 + 0.5;

      vec3 darkSpot = vec3(0.48, 0.06, 0.01);
      vec3 crimson = vec3(0.92, 0.24, 0.03);
      vec3 golden = vec3(1.0, 0.68, 0.08);
      vec3 whiteHot = vec3(1.0, 0.98, 0.86);

      vec3 color = mix(darkSpot, crimson, smoothstep(0.15, 0.42, granule));
      color = mix(color, golden, smoothstep(0.42, 0.70, granule));
      color = mix(color, whiteHot, smoothstep(0.70, 0.95 - uFlareBoost * 0.2, granule));

      vec3 viewDir = normalize(vViewPosition);
      float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
      color += vec3(1.0, 0.6, 0.18) * pow(fresnel, 2.2) * (0.95 + uFlareBoost * 0.8);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const SolarLoopShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uPhase;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      float flow1 = sin(vUv.x * 18.0 - uTime * 4.5 + uPhase) * 0.5 + 0.5;
      float flow2 = cos(vUv.x * 32.0 - uTime * 7.2 - uPhase) * 0.5 + 0.5;
      float pulse = pow(flow1 * 0.65 + flow2 * 0.35, 1.5);

      float archEnvelope = sin(vUv.x * 3.14159265);
      float coreMask = sin(vUv.y * 3.14159265);

      vec3 emberRed = vec3(0.95, 0.22, 0.04);
      vec3 plasmaGold = vec3(1.0, 0.72, 0.18);
      vec3 hotCore = vec3(1.0, 0.97, 0.85);

      vec3 col = mix(emberRed, plasmaGold, pulse);
      col = mix(col, hotCore, pow(pulse * coreMask, 2.0));

      float alpha = archEnvelope * (0.35 + pulse * 0.65) * uIntensity;
      gl_FragColor = vec4(col, alpha);
    }
  `,
};

function createAtmosphereMaterial(rgbColor: number, intensity = 0.85, power = 3.2) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(rgbColor) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uPower;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), uPower);
        gl_FragColor = vec4(uColor, fresnel * uIntensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

function sphericalToVec3(r: number, lat: number, lon: number) {
  const phi = Math.PI / 2 - lat;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(lon),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(lon),
  );
}

/* ---------- 4. MAIN HELIOSPHERE v2.0 COMPONENT ---------- */

export const ANCIENT_PLANET_IDS = [
  'gaia',
  'olympus',
  'elysium',
  'atlantis',
  'arcadia',
  'hyperborea',
  'avalon',
  'aether',
] as const;

export const RIVAL_SOVEREIGNS: Record<string, string> = {
  gaia: 'Lord Hyperion',
  olympus: 'Valkyrie Astra',
  elysium: 'Archon Solon',
  atlantis: 'Nereid Thalassa',
  arcadia: 'Warden Sylvanus',
  hyperborea: 'Jarl Boreas',
  avalon: 'Oracle Morgana',
  aether: 'Seraph Zephyr',
};

export function buildSovereignRegistry(playerOwnedPlanetId: string): Record<string, { ownerName: string; isPlayer: boolean }> {
  const reg: Record<string, { ownerName: string; isPlayer: boolean }> = {};
  for (const id of ANCIENT_PLANET_IDS) {
    if (id === playerOwnedPlanetId) {
      reg[id] = { ownerName: 'Commander (You)', isPlayer: true };
    } else {
      reg[id] = { ownerName: RIVAL_SOVEREIGNS[id] || 'Rival Sovereign', isPlayer: false };
    }
  }
  return reg;
}

interface ControllerActions {
  toggleFlightMode: () => void;
  triggerSolarFlareCME: (showAlert?: boolean) => void;
  setCameraPreset: (mode: 'overview' | 'topdown') => void;
  toggleTourMode: () => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  toggleAsteroids: () => void;
  toggleKeyboardHelp: () => void;
  togglePause: () => void;
  onTimeSliderChange: (val: string) => void;
  adjustTimeSpeed: (dir: number) => void;
  releaseFocus: () => void;
  stepPlanet: (delta: number) => void;
  zoomToSurface: () => void;
  toggleAutopilot: () => void;
  zeroShipVelocity: () => void;
  toggleInvertPitch: () => void;
  enterEarthAtmosphere: (targetPlanetId?: string) => void;
  setFlightKey: (code: string, active: boolean) => void;
}

export default function SolarSystem3D() {
  const rootRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<ControllerActions | null>(null);
  const cockpitStickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cockpitStickTouchId = useRef<number | null>(null);
  const cockpitStickCenter = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cockpitStickUi, setCockpitStickUi] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [playerOwnedPlanetId, setPlayerOwnedPlanetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sovereign_home_planet_v1');
      if (saved && (ANCIENT_PLANET_IDS as readonly string[]).includes(saved)) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'gaia';
  });
  const [showClaimModal, setShowClaimModal] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('sovereign_home_planet_v1');
    } catch {
      return false;
    }
  });
  const [activeSurfacePlanetId, setActiveSurfacePlanetId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('gaia');
  const [divingToEarth, setDivingToEarth] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState<boolean>(false);
  const [sidePanelTab, setSidePanelTab] = useState<'realms' | 'controls' | 'keys'>('realms');
  const [telemetryDetailsOpen, setTelemetryDetailsOpen] = useState<boolean>(false);
  const [labelsEnabled, setLabelsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sovereign_labels_enabled_v1') !== 'false';
    } catch {
      return true;
    }
  });
  const showLabelsRef = useRef<boolean>(labelsEnabled);

  const handleClaimSovereignPlanet = (planetId: string) => {
    setPlayerOwnedPlanetId(planetId);
    setSelectedPlanetId(planetId);
    try {
      localStorage.setItem('sovereign_home_planet_v1', planetId);
    } catch {
      // ignore storage errors
    }
    setShowClaimModal(false);
  };

  useEffect(() => {
    if (activeSurfacePlanetId) return;
    const root = rootRef.current;
    if (!root) return;

    const q = <T extends HTMLElement = HTMLElement>(id: string) =>
      root.querySelector(`#${id}`) as T | null;

    const container = q<HTMLDivElement>('canvas-container');
    const dock = q<HTMLDivElement>('planet-dock');
    const labelsContainer = q<HTMLDivElement>('labels-container');
    if (!container || !dock || !labelsContainer) return;

    // Clear containers in case React StrictMode double-mounts
    container.innerHTML = '';
    dock.innerHTML = '';
    labelsContainer.innerHTML = '';

    let cancelled = false;
    let animFrameId = 0;

    /* --- Scene, Camera, Renderer & Controls --- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      7500,
    );
    camera.position.set(0, 135, 255);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 2400;
    controls.minDistance = 2.2;
    controls.target.set(0, 0, 0);

    // High-reach solar lighting (decay=0.05 so outer planets stay vibrant in Three r186)
    const sunLight = new THREE.PointLight(0xfff7ed, 3.2, 2600, 0.05);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x334155, 0.9);
    scene.add(ambientLight);

    /* --- Internal State --- */
    const planetObjects: Record<
      string,
      {
        data: CelestialBodyData;
        orbitPivot: THREE.Group;
        planetHolder: THREE.Group;
        tiltGroup: THREE.Group;
        mainMesh: THREE.Mesh;
        cloudMesh: THREE.Mesh | null;
        moons: { pivot: THREE.Group; speed: number }[];
        angle: number;
        baseAngle: number;
      }
    > = {};

    const orbitLinesGroup = new THREE.Group();
    const beltsGroup = new THREE.Group();
    let sunMaterialUniforms: { uTime: { value: number }; uFlareBoost: { value: number } } | null =
      null;
    let asteroidInstancedMesh: THREE.InstancedMesh | null = null;
    let kuiperInstancedMesh: THREE.InstancedMesh | null = null;

    const asteroidData: {
      radius: number;
      angle: number;
      y: number;
      speed: number;
      rotX: number;
      rotY: number;
      rotSpeedX: number;
      rotSpeedY: number;
      scaleX: number;
      scaleY: number;
      scaleZ: number;
    }[] = [];

    const solarLoops: {
      mesh: THREE.Mesh;
      uniforms: { uTime: { value: number }; uPhase: { value: number }; uIntensity: { value: number } };
      baseScale: number;
      phase: number;
    }[] = [];

    let cmeParticleSystem: THREE.Points | null = null;
    const CME_COUNT = 2200;
    const cmeParticles: {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      age: number;
      maxAge: number;
    }[] = [];
    let solarFlareBoost = 0;
    let autoCmeTimer = 0;

    const pulsarObjects: {
      spinGroup: THREE.Group;
      coreFlare: THREE.Sprite;
      speed: number;
    }[] = [];

    let warpTunnelLines: THREE.LineSegments | null = null;
    const labelElements: Record<string, HTMLDivElement> = {};

    let isPaused = false;
    let timeMultiplier = 1.0;
    let simulatedDays = 0;
    let systemOrbitPhase = 0;
    let focusedPlanetId: string | null = playerOwnedPlanetId || 'gaia';
    let showOrbits = true;
    let showBelts = true;
    let showKeyboardHelp = true;
    let isTourMode = false;
    let tourTimer = 0;
    let tourIndex = 0;

    let isCockpitMode = false;
    let isAutopilot = false;
    let invertPitch = false;

    const shipState = {
      position: new THREE.Vector3(0, 18, 95),
      quaternion: new THREE.Quaternion(),
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      throttleDisplay: 0,
      warpCharge: 100,
      isWarping: false,
      speedKms: 0,
    };

    const keyState: Record<string, boolean> = {};

    const cameraTransition = {
      active: false,
      progress: 0,
      duration: 1.3,
      startPos: new THREE.Vector3(),
      startTarget: new THREE.Vector3(),
      desiredOffset: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const pointerDownPos = { x: 0, y: 0 };

    function updateLoadingProgress(percent: number, text: string) {
      const bar = q('loading-bar');
      const status = q('loading-status');
      if (bar) bar.style.width = `${percent}%`;
      if (status) status.textContent = text;
    }

    /* --- 5. Build Cosmos Background --- */
    function buildCosmosBackground() {
      const skyGeo = new THREE.SphereGeometry(3800, 48, 32);
      const skyTex = generateCosmosSkyboxTexture();
      const skyMat = new THREE.MeshBasicMaterial({
        map: skyTex,
        side: THREE.BackSide,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(skyGeo, skyMat));

      const starPalettes = [
        new THREE.Color(0x93c5fd),
        new THREE.Color(0xf8fafc),
        new THREE.Color(0xfef08a),
        new THREE.Color(0xfdba74),
        new THREE.Color(0xfca5a5),
      ];

      const createStarLayer = (
        count: number,
        size: number,
        minRadius: number,
        maxRadius: number,
        opacity: number,
      ) => {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          const r = minRadius + Math.random() * (maxRadius - minRadius);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = r * Math.cos(phi);
          pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
          const c = starPalettes[Math.floor(Math.random() * starPalettes.length)];
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
          size,
          vertexColors: true,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        scene.add(new THREE.Points(geo, mat));
      };

      createStarLayer(7000, 1.5, 1300, 3200, 0.78);
      createStarLayer(2400, 2.8, 1200, 2900, 0.9);
      createStarLayer(500, 4.5, 1100, 2600, 1.0);
    }

    /* --- 6. Build Celestial Bodies --- */
    function buildCelestialBodies() {
      const sphereGeoHigh = new THREE.SphereGeometry(1, 64, 64);

      CELESTIAL_DATA.filter((d) => !d.isDeepSpace).forEach((data, idx) => {
        const orbitPivot = new THREE.Group();
        scene.add(orbitPivot);

        const planetHolder = new THREE.Group();
        orbitPivot.add(planetHolder);

        const tiltGroup = new THREE.Group();
        tiltGroup.rotation.z = THREE.MathUtils.degToRad(data.tilt || 0);
        planetHolder.add(tiltGroup);

        let mainMesh: THREE.Mesh;
        let cloudMesh: THREE.Mesh | null = null;
        const moons: { pivot: THREE.Group; speed: number }[] = [];

        if (data.id === 'sun') {
          sunMaterialUniforms = {
            uTime: { value: 0 },
            uFlareBoost: { value: 0 },
          };
          const sunMat = new THREE.ShaderMaterial({
            uniforms: sunMaterialUniforms,
            vertexShader: SunShader.vertexShader,
            fragmentShader: SunShader.fragmentShader,
          });

          mainMesh = new THREE.Mesh(sphereGeoHigh, sunMat);
          mainMesh.scale.setScalar(data.radius);
          tiltGroup.add(mainMesh);

          const coronaTex1 = createCoronaGlowTexture(
            'rgba(255, 248, 210, 0.95)',
            'rgba(251, 146, 60, 0.45)',
            'rgba(220, 38, 38, 0.08)',
          );
          const coronaSprite1 = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: coronaTex1,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              transparent: true,
            }),
          );
          coronaSprite1.scale.setScalar(data.radius * 4.5);
          planetHolder.add(coronaSprite1);

          const coronaTex2 = createCoronaGlowTexture(
            'rgba(251, 191, 36, 0.5)',
            'rgba(234, 88, 12, 0.18)',
            'rgba(124, 45, 18, 0.0)',
          );
          const coronaSprite2 = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: coronaTex2,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              transparent: true,
            }),
          );
          coronaSprite2.scale.setScalar(data.radius * 8.0);
          planetHolder.add(coronaSprite2);
        } else {
          // All 8 ancient worlds are realistic Earth-class terrestrial worlds with specular oceans, clouds, atmosphere & natural moon
          const maps = generatePlanetTextures(data.id);
          const mat = new THREE.MeshPhongMaterial({
            map: maps.map,
            bumpMap: maps.bumpMap,
            bumpScale: 0.065,
            specularMap: maps.specularMap ?? undefined,
            specular: new THREE.Color(0x5588aa),
            shininess: 34,
          });

          mainMesh = new THREE.Mesh(sphereGeoHigh, mat);
          mainMesh.scale.setScalar(data.radius);
          tiltGroup.add(mainMesh);

          const cloudTex = generateEarthCloudsTexture(data.id);
          cloudMesh = new THREE.Mesh(
            sphereGeoHigh,
            new THREE.MeshLambertMaterial({
              map: cloudTex,
              transparent: true,
              opacity: 0.88,
              depthWrite: false,
            }),
          );
          cloudMesh.scale.setScalar(data.radius * 1.018);
          tiltGroup.add(cloudMesh);

          const atmoColorHex = new THREE.Color(data.color || '#38bdf8').getHex();
          const atmoMesh = new THREE.Mesh(
            sphereGeoHigh,
            createAtmosphereMaterial(atmoColorHex, 0.88, 3.0),
          );
          atmoMesh.scale.setScalar(data.radius * 1.12);
          planetHolder.add(atmoMesh);

          const moonMaps = generatePlanetTextures('moon');
          const moonPivot = new THREE.Group();
          moonPivot.rotation.z = 0.08 + (idx % 3) * 0.04;
          const moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(data.radius * 0.2, 24, 24),
            new THREE.MeshStandardMaterial({
              map: moonMaps.map,
              bumpMap: moonMaps.bumpMap,
              bumpScale: 0.06,
              roughness: 0.9,
            }),
          );
          moonMesh.position.set(data.radius * 2.1, 0, 0);
          moonPivot.add(moonMesh);
          planetHolder.add(moonPivot);
          moons.push({ pivot: moonPivot, speed: 1.8 + idx * 0.18 });

          const a = data.distance || 0;
          const e = data.eccentricity || 0.01;
          const b = a * Math.sqrt(1 - e * e);
          const orbitPoints: THREE.Vector3[] = [];
          for (let i = 0; i <= 180; i++) {
            const angle = (i / 180) * Math.PI * 2;
            orbitPoints.push(new THREE.Vector3(Math.cos(angle) * a, 0, Math.sin(angle) * b));
          }
          const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
          const orbitLine = new THREE.Line(
            orbitGeo,
            new THREE.LineBasicMaterial({
              color: new THREE.Color(data.color),
              transparent: true,
              opacity: 0.24,
            }),
          );
          orbitLinesGroup.add(orbitLine);
        }

        mainMesh.userData = { planetId: data.id };
        // Distribute the 8 planets across all 8 octants (360 degrees) of the Solar System
        // using a golden-step permutation [0, 3, 6, 1, 4, 7, 2, 5] so consecutive planets are well-separated
        const octantOrder = [0, 3, 6, 1, 4, 7, 2, 5];
        const octantIdx = idx > 0 ? octantOrder[(idx - 1) % 8] : 0;
        const baseAngle = idx === 0 ? 0 : (octantIdx / 8) * Math.PI * 2 + 0.15;
        if (data.distance && data.distance > 0) {
          const a = data.distance;
          const e = data.eccentricity || 0.01;
          const b = a * Math.sqrt(1 - e * e);
          planetHolder.position.set(Math.cos(baseAngle) * a, 0, Math.sin(baseAngle) * b);
        }
        planetObjects[data.id] = {
          data,
          orbitPivot,
          planetHolder,
          tiltGroup,
          mainMesh,
          cloudMesh,
          moons,
          angle: baseAngle,
          baseAngle,
        };
      });
    }

    /* --- 7. Solar Prominences & CME Particle Engine --- */
    function triggerSolarFlareCME(showAlert = true) {
      const sunRadius = CELESTIAL_DATA[0].radius;
      solarFlareBoost = 1.35;

      const baseTheta = Math.random() * Math.PI * 2;
      const baseLat = (Math.random() - 0.5) * 0.7;
      const dir = sphericalToVec3(1, baseLat, baseTheta).normalize();

      for (let i = 0; i < CME_COUNT; i++) {
        const p = cmeParticles[i];
        if (!p) continue;
        const spread = new THREE.Vector3(
          (Math.random() - 0.5) * 0.95,
          (Math.random() - 0.5) * 0.95,
          (Math.random() - 0.5) * 0.95,
        );
        const particleDir = dir.clone().add(spread).normalize();
        p.pos.copy(particleDir).multiplyScalar(sunRadius * (0.98 + Math.random() * 0.15));

        const speed = 8.0 + Math.pow(Math.random(), 1.6) * 28.0;
        p.vel.copy(particleDir).multiplyScalar(speed);
        p.age = Math.random() * 0.25;
        p.maxAge = 3.2 + Math.random() * 4.5;
      }

      if (showAlert) {
        const banner = q('solar-flare-banner');
        if (banner) {
          banner.classList.remove('opacity-0', '-translate-y-4');
          banner.classList.add('opacity-100', 'translate-y-0');
          setTimeout(() => {
            banner.classList.add('opacity-0', '-translate-y-4');
            banner.classList.remove('opacity-100', 'translate-y-0');
          }, 4200);
        }
      }
    }

    function buildSolarFlaresAndCME() {
      const sunObj = planetObjects['sun'];
      if (!sunObj) return;
      const sunRadius = sunObj.data.radius;

      const loopCount = 8;
      for (let i = 0; i < loopCount; i++) {
        const lat = (Math.random() - 0.5) * 1.3;
        const lon = (i / loopCount) * Math.PI * 2 + Math.random() * 0.4;
        const spanAngle = 0.24 + Math.random() * 0.22;
        const archHeight = sunRadius * (1.18 + Math.random() * 0.28);

        const p0 = sphericalToVec3(sunRadius * 0.98, lat, lon - spanAngle);
        const p1 = sphericalToVec3(archHeight * 0.96, lat + 0.06, lon - spanAngle * 0.45);
        const p2 = sphericalToVec3(archHeight * 1.04, lat - 0.04, lon);
        const p3 = sphericalToVec3(archHeight * 0.96, lat + 0.05, lon + spanAngle * 0.45);
        const p4 = sphericalToVec3(sunRadius * 0.98, lat, lon + spanAngle);

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
        const tubeGeo = new THREE.TubeGeometry(
          curve,
          44,
          0.22 + Math.random() * 0.16,
          12,
          false,
        );
        const uniforms = {
          uTime: { value: 0 },
          uPhase: { value: i * 1.7 },
          uIntensity: { value: 0.85 },
        };
        const tubeMat = new THREE.ShaderMaterial({
          uniforms,
          vertexShader: SolarLoopShader.vertexShader,
          fragmentShader: SolarLoopShader.fragmentShader,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const loopMesh = new THREE.Mesh(tubeGeo, tubeMat);
        sunObj.tiltGroup.add(loopMesh);
        solarLoops.push({ mesh: loopMesh, uniforms, baseScale: 1.0, phase: i * 1.3 });
      }

      const cmeGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(CME_COUNT * 3);
      const colors = new Float32Array(CME_COUNT * 3);

      for (let i = 0; i < CME_COUNT; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.3;

        cmeParticles.push({
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          age: 999,
          maxAge: 4.0 + Math.random() * 3.5,
        });
      }

      cmeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      cmeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const cmeTex = createCoronaGlowTexture(
        'rgba(255, 255, 255, 1.0)',
        'rgba(251, 146, 60, 0.7)',
        'rgba(220, 38, 38, 0.0)',
      );

      const cmeMat = new THREE.PointsMaterial({
        size: 2.4,
        map: cmeTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      cmeParticleSystem = new THREE.Points(cmeGeo, cmeMat);
      scene.add(cmeParticleSystem);

      triggerSolarFlareCME(false);
    }

    /* --- 8. Deep-Space Objects (Orion M42, Andromeda M31, Pulsars) --- */
    function buildDeepSpaceObjects() {
      const cloudSpriteTex = createCoronaGlowTexture(
        'rgba(255, 255, 255, 0.85)',
        'rgba(255, 255, 255, 0.32)',
        'rgba(255, 255, 255, 0.0)',
      );

      CELESTIAL_DATA.filter((d) => d.isDeepSpace).forEach((data) => {
        const orbitPivot = new THREE.Group();
        scene.add(orbitPivot);

        const planetHolder = new THREE.Group();
        if (data.position) {
          planetHolder.position.set(data.position[0], data.position[1], data.position[2]);
        }
        orbitPivot.add(planetHolder);

        const tiltGroup = new THREE.Group();
        planetHolder.add(tiltGroup);

        const hitGeo = new THREE.SphereGeometry(data.radius * 0.85, 16, 16);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const mainMesh = new THREE.Mesh(hitGeo, hitMat);
        mainMesh.userData = { planetId: data.id };
        tiltGroup.add(mainMesh);

        if (data.id === 'orion') {
          const count = 1600;
          const geo = new THREE.BufferGeometry();
          const pos = new Float32Array(count * 3);
          const col = new Float32Array(count * 3);

          const cMagenta = new THREE.Color('#d946ef');
          const cCyan = new THREE.Color('#06b6d4');
          const cViolet = new THREE.Color('#7c3aed');
          const cCore = new THREE.Color('#fdf4ff');

          for (let i = 0; i < count; i++) {
            const r = Math.pow(Math.random(), 1.5) * data.radius * 1.4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const wingX = r * Math.sin(phi) * Math.cos(theta) * 1.3;
            const wingY = r * Math.cos(phi) * 0.85 + Math.sin(wingX * 0.04) * 12;
            const wingZ = r * Math.sin(phi) * Math.sin(theta);

            pos[i * 3] = wingX;
            pos[i * 3 + 1] = wingY;
            pos[i * 3 + 2] = wingZ;

            const distRatio = r / (data.radius * 1.4);
            let c: THREE.Color;
            if (distRatio < 0.22) c = cCore.clone().lerp(cCyan, distRatio / 0.22);
            else if (distRatio < 0.6)
              c = cCyan.clone().lerp(cMagenta, (distRatio - 0.22) / 0.38);
            else c = cMagenta.clone().lerp(cViolet, (distRatio - 0.6) / 0.4);

            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
          }

          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

          const nebMat = new THREE.PointsMaterial({
            size: 28,
            map: cloudSpriteTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          tiltGroup.add(new THREE.Points(geo, nebMat));

          const trapGeo = new THREE.BufferGeometry();
          const trapPos = new Float32Array(45 * 3);
          for (let i = 0; i < 45; i++) {
            trapPos[i * 3] = (Math.random() - 0.5) * 32;
            trapPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
            trapPos[i * 3 + 2] = (Math.random() - 0.5) * 32;
          }
          trapGeo.setAttribute('position', new THREE.BufferAttribute(trapPos, 3));
          tiltGroup.add(
            new THREE.Points(
              trapGeo,
              new THREE.PointsMaterial({
                size: 6.5,
                map: cloudSpriteTex,
                color: 0xe0f2fe,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              }),
            ),
          );
        } else if (data.id === 'andromeda') {
          const starCount = 6500;
          const geo = new THREE.BufferGeometry();
          const pos = new Float32Array(starCount * 3);
          const col = new Float32Array(starCount * 3);

          const coreGold = new THREE.Color('#fef08a');
          const bulgeAmber = new THREE.Color('#fbbf24');
          const armBlue = new THREE.Color('#60a5fa');
          const h2Pink = new THREE.Color('#f472b6');

          for (let i = 0; i < starCount; i++) {
            const arm = i % 2;
            const t = Math.pow(Math.random(), 1.35);
            const r = t * data.radius * 1.45;
            const spiralAngle =
              t * Math.PI * 5.2 +
              arm * Math.PI +
              (Math.random() - 0.5) * (0.45 + (1 - t) * 0.9);
            const thickness = (1 - t * 0.75) * 10.0 * (Math.random() - 0.5);

            pos[i * 3] = Math.cos(spiralAngle) * r;
            pos[i * 3 + 1] = thickness;
            pos[i * 3 + 2] = Math.sin(spiralAngle) * r;

            let c: THREE.Color;
            if (t < 0.18) c = coreGold.clone().lerp(bulgeAmber, t / 0.18);
            else if (Math.random() < 0.08) c = h2Pink;
            else c = bulgeAmber.clone().lerp(armBlue, clamp((t - 0.18) / 0.65, 0, 1));

            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
          }

          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
          geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

          const galMat = new THREE.PointsMaterial({
            size: 4.5,
            map: cloudSpriteTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });
          tiltGroup.add(new THREE.Points(geo, galMat));

          const coreSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: createCoronaGlowTexture(
                'rgba(255,252,220,1)',
                'rgba(251,191,36,0.55)',
                'rgba(99,102,241,0)',
              ),
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          coreSprite.scale.setScalar(data.radius * 0.95);
          tiltGroup.add(coreSprite);

          tiltGroup.rotation.x = THREE.MathUtils.degToRad(62);
          tiltGroup.rotation.z = THREE.MathUtils.degToRad(-28);
        } else if (data.id === 'vela_pulsar' || data.id === 'crab_pulsar') {
          const isCrab = data.id === 'crab_pulsar';
          const beamColor = isCrab ? 0xc084fc : 0x22d3ee;

          const spinGroup = new THREE.Group();
          tiltGroup.add(spinGroup);

          const coreMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.4, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0xffffff }),
          );
          spinGroup.add(coreMesh);

          const coreFlare = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: createCoronaGlowTexture(
                'rgba(255,255,255,1)',
                isCrab ? 'rgba(192,132,252,0.75)' : 'rgba(34,211,238,0.75)',
                'rgba(0,0,0,0)',
              ),
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          coreFlare.scale.setScalar(26);
          spinGroup.add(coreFlare);

          const jetAxisGroup = new THREE.Group();
          jetAxisGroup.rotation.z = 0.55;
          spinGroup.add(jetAxisGroup);

          const jetLength = 75;
          const jetGeo = new THREE.ConeGeometry(7.5, jetLength, 24, 1, true);
          const jetMat = new THREE.MeshBasicMaterial({
            color: beamColor,
            transparent: true,
            opacity: 0.48,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          });

          const northJet = new THREE.Mesh(jetGeo, jetMat);
          northJet.position.y = jetLength / 2;
          northJet.rotation.x = Math.PI;
          jetAxisGroup.add(northJet);

          const southJet = new THREE.Mesh(jetGeo, jetMat);
          southJet.position.y = -jetLength / 2;
          jetAxisGroup.add(southJet);

          const torusMesh = new THREE.Mesh(
            new THREE.TorusGeometry(12, 0.7, 16, 64),
            new THREE.MeshBasicMaterial({
              color: beamColor,
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          torusMesh.rotation.x = Math.PI / 2;
          tiltGroup.add(torusMesh);

          pulsarObjects.push({
            spinGroup,
            coreFlare,
            speed: isCrab ? 16.0 : 10.5,
          });
        }

        planetObjects[data.id] = {
          data,
          orbitPivot,
          planetHolder,
          tiltGroup,
          mainMesh,
          cloudMesh: null,
          moons: [],
          angle: 0,
          baseAngle: 0,
        };
      });
    }

    /* --- 9. Asteroid & Kuiper Belts + Warp Tunnel --- */
    function buildAsteroidBelts() {
      const rockGeo = new THREE.DodecahedronGeometry(1, 1);
      const posAttr = rockGeo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        const n = noiseGen.noise3D(v.x * 1.8, v.y * 1.8, v.z * 1.8);
        v.multiplyScalar(0.78 + n * 0.32);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      rockGeo.computeVertexNormals();

      const mainBeltCount = 2600;
      asteroidInstancedMesh = new THREE.InstancedMesh(
        rockGeo,
        new THREE.MeshStandardMaterial({
          color: 0x9ca3af,
          roughness: 0.88,
          metalness: 0.12,
        }),
        mainBeltCount,
      );

      const dummy = new THREE.Object3D();
      const c = new THREE.Color();

      // Main Asteroid Belt placed cleanly between Atlantis (105) and Arcadia (164) at 125..139
      for (let i = 0; i < mainBeltCount; i++) {
        const radius = 125 + Math.random() * 14;
        const angle = Math.random() * Math.PI * 2;
        const ySpread = (Math.random() - 0.5) * 4.5 * Math.sin(Math.random() * Math.PI);
        const scaleX = 0.14 + Math.pow(Math.random(), 2.4) * 0.5;
        const scaleY = scaleX * (0.6 + Math.random() * 0.7);
        const scaleZ = scaleX * (0.6 + Math.random() * 0.7);

        const item = {
          radius,
          angle,
          y: ySpread,
          speed: (0.52 + Math.random() * 0.18) * (132 / radius),
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          rotSpeedX: (Math.random() - 0.5) * 0.02,
          rotSpeedY: (Math.random() - 0.5) * 0.02,
          scaleX,
          scaleY,
          scaleZ,
        };
        asteroidData.push(item);

        dummy.position.set(Math.cos(angle) * radius, ySpread, Math.sin(angle) * radius);
        dummy.rotation.set(item.rotX, item.rotY, 0);
        dummy.scale.set(scaleX, scaleY, scaleZ);
        dummy.updateMatrix();
        asteroidInstancedMesh.setMatrixAt(i, dummy.matrix);

        const shade = 0.55 + Math.random() * 0.4;
        c.setRGB(shade * 1.05, shade * 0.98, shade * 0.9);
        asteroidInstancedMesh.setColorAt(i, c);
      }
      beltsGroup.add(asteroidInstancedMesh);

      const kuiperCount = 1800;
      kuiperInstancedMesh = new THREE.InstancedMesh(
        rockGeo,
        new THREE.MeshStandardMaterial({
          color: 0xbae6fd,
          roughness: 0.7,
          metalness: 0.15,
        }),
        kuiperCount,
      );

      // Kuiper Belt placed cleanly outside Aether (268) at 296..356
      for (let i = 0; i < kuiperCount; i++) {
        const radius = 296 + Math.random() * 60;
        const angle = Math.random() * Math.PI * 2;
        const ySpread = (Math.random() - 0.5) * 14.0;
        const s = 0.22 + Math.pow(Math.random(), 2.2) * 0.75;

        dummy.position.set(Math.cos(angle) * radius, ySpread, Math.sin(angle) * radius);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        kuiperInstancedMesh.setMatrixAt(i, dummy.matrix);

        const icy = 0.6 + Math.random() * 0.35;
        c.setRGB(icy * 0.85, icy * 0.95, icy * 1.05);
        kuiperInstancedMesh.setColorAt(i, c);
      }
      beltsGroup.add(kuiperInstancedMesh);
    }

    function buildWarpTunnelEffect() {
      const streakCount = 320;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(streakCount * 6);
      for (let i = 0; i < streakCount; i++) {
        const r = 3.5 + Math.random() * 24;
        const theta = Math.random() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        const z = -10 - Math.random() * 90;
        const len = 8 + Math.random() * 18;

        pos[i * 6] = x;
        pos[i * 6 + 1] = y;
        pos[i * 6 + 2] = z;
        pos[i * 6 + 3] = x;
        pos[i * 6 + 4] = y;
        pos[i * 6 + 5] = z - len;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      warpTunnelLines = new THREE.LineSegments(geo, mat);
      camera.add(warpTunnelLines);
    }

    /* --- 10. UI Dock, 3D Floating Labels & Telemetry HUD --- */
    function selectCelestialTarget(planetId: string, customDistanceMultiplier = 3.8) {
      const pObj = planetObjects[planetId];
      if (!pObj) return;

      focusedPlanetId = planetId;
      setSelectedPlanetId(planetId);

      CELESTIAL_DATA.forEach((p) => {
        const btn = q(`dock-btn-${p.id}`);
        if (btn) btn.classList.toggle('active', p.id === planetId);
      });

      ['overview', 'topdown'].forEach((k) => {
        const el = q(`preset-${k}`);
        if (el) el.classList.remove('active');
      });

      const d = pObj.data;
      const activeTargetEl = q('active-target-indicator');
      if (activeTargetEl) activeTargetEl.textContent = `TARGET: ${d.name.toUpperCase()}`;

      const navName = q('nav-target-name');
      const navType = q('nav-target-type');
      const lockName = q('cockpit-lock-name');
      if (navName) navName.textContent = d.name;
      if (navType) navType.textContent = d.order;
      if (lockName) lockName.textContent = d.name.toUpperCase();

      const setTxt = (id: string, val: string) => {
        const el = q(id);
        if (el) el.textContent = val;
      };
      setTxt('hud-classification', d.classification);
      setTxt('hud-order', d.order);
      setTxt('hud-name', d.name);
      setTxt('hud-description', d.description);
      setTxt('hud-diameter', d.diameter);
      setTxt('hud-distance', d.distanceText);
      setTxt('hud-orbit', d.orbitText);
      setTxt('hud-temp', d.tempText);
      setTxt('hud-moons', d.moonsText);
      setTxt('hud-rotation', d.rotationText);
      setTxt('hud-gravity', d.gravity);
      setTxt('hud-atmosphere', d.atmosphere);

      // Update Sovereign Ownership badge inside Telemetry Panel
      const ownerBadge = q('hud-owner-badge');
      const registry = buildSovereignRegistry(playerOwnedPlanetId);
      const sovInfo = registry[planetId];
      if (ownerBadge) {
        if (sovInfo) {
          if (sovInfo.isPlayer) {
            ownerBadge.textContent = '★ YOUR SOVEREIGN REALM (FULL CONTROL)';
            ownerBadge.className =
              'inline-block text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider mb-1';
          } else {
            ownerBadge.textContent = `🔒 RULED BY: ${sovInfo.ownerName.toUpperCase()} (VIEW ONLY)`;
            ownerBadge.className =
              'inline-block text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider mb-1';
          }
        } else {
          ownerBadge.textContent = 'CELESTIAL ANCHOR // UNCLAIMED';
          ownerBadge.className =
            'inline-block text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 tracking-wider mb-1';
        }
      }

      if (!isCockpitMode) {
        const panel = q('telemetry-panel');
        if (panel) {
          panel.classList.remove('translate-x-[120%]', 'opacity-0', 'pointer-events-none');
          panel.classList.add('translate-x-0', 'opacity-100', 'pointer-events-auto');
        }

        const worldPos = new THREE.Vector3();
        pObj.planetHolder.getWorldPosition(worldPos);

        const viewDist = Math.max(d.radius * customDistanceMultiplier, 6.2);
        const radialDir =
          worldPos.length() > 1 ? worldPos.clone().normalize() : new THREE.Vector3(0, 0, 1);
        const sideVec = new THREE.Vector3(-radialDir.z, 0.32, radialDir.x).normalize();

        cameraTransition.active = true;
        cameraTransition.progress = 0;
        cameraTransition.duration = 1.2;
        cameraTransition.startPos.copy(camera.position);
        cameraTransition.startTarget.copy(controls.target);
        cameraTransition.desiredOffset.copy(
          radialDir
            .multiplyScalar(viewDist * 0.75)
            .add(sideVec.multiplyScalar(viewDist * 0.85)),
        );
      }
    }

    function buildUIAndLabels() {
      if (!dock || !labelsContainer) return;
      const registry = buildSovereignRegistry(playerOwnedPlanetId);

      CELESTIAL_DATA.forEach((planet) => {
        const sov = registry[planet.id];
        const btn = document.createElement('button');
        btn.id = `dock-btn-${planet.id}`;
        btn.className =
          'glass-pill px-2.5 py-2 rounded-xl flex items-center justify-between gap-1.5 text-xs font-medium text-slate-200 w-full text-left';
        btn.onclick = () => {
          selectCelestialTarget(planet.id);
          setSidePanelOpen(false);
        };
        const kbdHtml =
          planet.keybind !== '' ? `<span class="kbd-badge">${planet.keybind}</span>` : '';
        const crownHtml = sov?.isPlayer
          ? `<span class="text-[9px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-mono-tech">YOURS</span>`
          : '';
        btn.innerHTML = `
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${planet.badgeBg}; box-shadow: 0 0 8px ${planet.color}66;"></span>
            <span class="truncate">${planet.name.replace('The ', '')}</span>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            ${crownHtml}
            ${kbdHtml}
          </div>
        `;
        dock.appendChild(btn);

        const lbl = document.createElement('div');
        lbl.className = 'planet-label';
        lbl.style.color = planet.color;
        lbl.onclick = (e) => {
          e.stopPropagation();
          selectCelestialTarget(planet.id);
        };
        const ownerTag = sov
          ? sov.isPlayer
            ? `<span class="text-[8px] px-1 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">YOUR REALM</span>`
            : `<span class="text-[8px] px-1 rounded bg-slate-800/90 text-slate-400">${sov.ownerName}</span>`
          : '';
        lbl.innerHTML = `
          <div class="px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-700/70 backdrop-blur-md text-[11px] font-mono-tech font-medium text-slate-100 tracking-wide whitespace-nowrap shadow-lg hover:border-sky-400 flex items-center gap-1.5">
            <span>${planet.name.replace('The ', '')}</span>
            ${ownerTag}
            ${planet.keybind !== '' ? `<span class="text-[9px] text-sky-400">[${planet.keybind}]</span>` : ''}
          </div>
          <div class="label-dot" style="background-color: ${planet.color};"></div>
        `;
        labelsContainer.appendChild(lbl);
        labelElements[planet.id] = lbl;
      });
    }

    function updateAutopilotUI() {
      const btn = q('btn-autopilot');
      const badge = q('flight-status-badge');
      if (btn) btn.classList.toggle('active-amber', isAutopilot);
      if (badge) {
        if (isAutopilot) {
          badge.textContent = 'AUTO';
          badge.className =
            'text-[8px] font-mono-tech px-1 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/50';
        } else {
          badge.textContent = '6DOF';
          badge.className =
            'text-[8px] font-mono-tech px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        }
      }
    }

    function zoomToSurface() {
      if (focusedPlanetId) {
        if (isCockpitMode) {
          isAutopilot = true;
          updateAutopilotUI();
        } else {
          selectCelestialTarget(focusedPlanetId, 2.25);
        }
      }
    }

    function stepPlanet(delta: number) {
      const currentIndex = CELESTIAL_DATA.findIndex((p) => p.id === focusedPlanetId);
      const nextIndex = (currentIndex + delta + CELESTIAL_DATA.length) % CELESTIAL_DATA.length;
      selectCelestialTarget(CELESTIAL_DATA[nextIndex].id);
    }

    function releaseFocus() {
      if (isCockpitMode) {
        isAutopilot = false;
        updateAutopilotUI();
        return;
      }
      focusedPlanetId = null;
      isTourMode = false;
      q('preset-tour')?.classList.remove('active');
      const ind = q('active-target-indicator');
      if (ind) ind.textContent = 'TARGET: SOL SYSTEM';

      CELESTIAL_DATA.forEach((p) => {
        q(`dock-btn-${p.id}`)?.classList.remove('active');
      });

      const panel = q('telemetry-panel');
      if (panel) {
        panel.classList.add('translate-x-[120%]', 'opacity-0', 'pointer-events-none');
        panel.classList.remove('translate-x-0', 'opacity-100', 'pointer-events-auto');
      }
    }

    function toggleFlightMode() {
      isCockpitMode = !isCockpitMode;
      const cockpitHud = q('cockpit-hud');
      const modePill = q('mode-indicator-pill');
      const cockpitBtn = q('btn-cockpit-mode');
      const telemetryPanel = q('telemetry-panel');
      const helpOrbital = q('help-orbital-section');
      const helpCockpit = q('help-cockpit-section');

      if (isCockpitMode) {
        controls.enabled = false;
        cameraTransition.active = false;
        isTourMode = false;
        q('preset-tour')?.classList.remove('active');

        shipState.position.copy(camera.position);
        shipState.quaternion.copy(camera.quaternion);
        shipState.velocity.set(0, 0, 0);
        shipState.angularVelocity.set(0, 0, 0);

        if (!focusedPlanetId) focusedPlanetId = playerOwnedPlanetId || 'gaia';
        selectCelestialTarget(focusedPlanetId);

        cockpitHud?.classList.remove('hidden');
        telemetryPanel?.classList.add('translate-x-[120%]', 'opacity-0', 'pointer-events-none');
        telemetryPanel?.classList.remove('translate-x-0', 'opacity-100', 'pointer-events-auto');

        if (modePill) {
          modePill.textContent = '6DOF COCKPIT FLIGHT';
          modePill.className =
            'text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/50';
        }
        cockpitBtn?.classList.add('active-amber');

        helpOrbital?.classList.add('hidden');
        helpCockpit?.classList.remove('hidden');
      } else {
        isAutopilot = false;
        updateAutopilotUI();
        controls.enabled = true;
        camera.fov = 55;
        camera.updateProjectionMatrix();
        if (warpTunnelLines)
          (warpTunnelLines.material as THREE.LineBasicMaterial).opacity = 0;

        camera.up.set(0, 1, 0);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        controls.target.copy(camera.position).add(forward.multiplyScalar(45));

        cockpitHud?.classList.add('hidden');
        if (modePill) {
          modePill.textContent = 'ORBITAL MODE';
          modePill.className =
            'text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40';
        }
        cockpitBtn?.classList.remove('active-amber');

        helpOrbital?.classList.remove('hidden');
        helpCockpit?.classList.add('hidden');

        if (focusedPlanetId) {
          selectCelestialTarget(focusedPlanetId);
        }
      }
    }

    function toggleAutopilot() {
      if (!isCockpitMode) toggleFlightMode();
      isAutopilot = !isAutopilot;
      updateAutopilotUI();
    }

    function zeroShipVelocity() {
      shipState.velocity.set(0, 0, 0);
      shipState.angularVelocity.set(0, 0, 0);
      isAutopilot = false;
      updateAutopilotUI();
    }

    function toggleInvertPitch() {
      invertPitch = !invertPitch;
      const lbl = q('pitch-invert-label');
      if (lbl) lbl.textContent = invertPitch ? 'INV' : 'STD';
    }

    function toggleKeyboardHelp() {
      showKeyboardHelp = !showKeyboardHelp;
      setSidePanelTab('keys');
      setSidePanelOpen((prev) => !prev);
    }

    function setCameraPreset(mode: 'overview' | 'topdown') {
      if (isCockpitMode) toggleFlightMode();
      releaseFocus();
      ['overview', 'topdown'].forEach((k) => {
        q(`preset-${k}`)?.classList.toggle('active', k === mode);
      });

      cameraTransition.active = true;
      cameraTransition.progress = 0;
      cameraTransition.duration = 1.35;
      cameraTransition.startPos.copy(camera.position);
      cameraTransition.startTarget.copy(controls.target);
      cameraTransition.endTarget.set(0, 0, 0);

      if (mode === 'overview') {
        cameraTransition.endPos.set(0, 140, 265);
      } else if (mode === 'topdown') {
        cameraTransition.endPos.set(0, 380, 0.1);
      }
    }

    function toggleTourMode() {
      if (isCockpitMode) toggleFlightMode();
      isTourMode = !isTourMode;
      q('preset-tour')?.classList.toggle('active', isTourMode);
      if (isTourMode) {
        tourTimer = 0;
        tourIndex = (tourIndex + 1) % CELESTIAL_DATA.length;
        selectCelestialTarget(CELESTIAL_DATA[tourIndex].id);
      }
    }

    function toggleOrbits() {
      showOrbits = !showOrbits;
      orbitLinesGroup.visible = showOrbits;
      q('btn-orbits')?.classList.toggle('active', showOrbits);
    }

    function toggleLabels() {
      const next = !showLabelsRef.current;
      showLabelsRef.current = next;
      setLabelsEnabled(next);
      try {
        localStorage.setItem('sovereign_labels_enabled_v1', String(next));
      } catch {
        // ignore storage errors
      }
      if (labelsContainer) {
        labelsContainer.style.display = next ? 'block' : 'none';
      }
      Object.values(labelElements).forEach((lbl) => {
        lbl.style.display = next ? 'flex' : 'none';
      });
    }

    function toggleAsteroids() {
      showBelts = !showBelts;
      beltsGroup.visible = showBelts;
      q('btn-asteroids')?.classList.toggle('active', showBelts);
    }

    function togglePause() {
      isPaused = !isPaused;
      q('icon-pause')?.classList.toggle('hidden', isPaused);
      q('icon-play')?.classList.toggle('hidden', !isPaused);
    }

    function onTimeSliderChange(val: string) {
      const v = parseFloat(val);
      if (v === 0) timeMultiplier = 0;
      else if (v <= 25) timeMultiplier = (v / 25) * 1.0;
      else timeMultiplier = 1.0 + Math.pow((v - 25) / 75, 2.2) * 24.0;
      const readout = q('speed-readout');
      if (readout) readout.textContent = `${timeMultiplier.toFixed(1)}x`;
    }

    function adjustTimeSpeed(dir: number) {
      const slider = q<HTMLInputElement>('time-slider');
      if (!slider) return;
      const nextVal = clamp(parseFloat(slider.value) + dir * 8, 0, 100);
      slider.value = String(nextVal);
      onTimeSliderChange(String(nextVal));
    }

    function enterEarthAtmosphere(targetPlanetId?: string) {
      if (isCockpitMode) toggleFlightMode();
      const candidate = targetPlanetId || focusedPlanetId || playerOwnedPlanetId || 'gaia';
      const resolvedId = (ANCIENT_PLANET_IDS as readonly string[]).includes(candidate)
        ? candidate
        : playerOwnedPlanetId || 'gaia';
      selectCelestialTarget(resolvedId, 1.15);
      cameraTransition.duration = 0.85;
      setDivingToEarth(true);
      setTimeout(() => {
        setDivingToEarth(false);
        setActiveSurfacePlanetId(resolvedId);
      }, 850);
    }

    function setFlightKey(code: string, active: boolean) {
      keyState[code] = active;
      if (
        active &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(
          code,
        )
      ) {
        isAutopilot = false;
        updateAutopilotUI();
      }
    }

    actionsRef.current = {
      toggleFlightMode,
      triggerSolarFlareCME,
      setCameraPreset,
      toggleTourMode,
      toggleOrbits,
      toggleLabels,
      toggleAsteroids,
      toggleKeyboardHelp,
      togglePause,
      onTimeSliderChange,
      adjustTimeSpeed,
      releaseFocus,
      stepPlanet,
      zoomToSurface,
      toggleAutopilot,
      zeroShipVelocity,
      toggleInvertPitch,
      enterEarthAtmosphere,
      setFlightKey,
    };

    /* --- 11. Keyboard & Pointer Event Handlers --- */
    function onKeyDown(e: KeyboardEvent) {
      const code = e.code;
      keyState[code] = true;

      if (
        [
          'Space',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'BracketLeft',
          'BracketRight',
        ].includes(code)
      ) {
        e.preventDefault();
      }

      if (e.repeat) return;

      if (code === 'KeyC') toggleFlightMode();
      else if (code === 'KeyX') {
        if (isCockpitMode && (keyState['ControlLeft'] || keyState['ControlRight']))
          zeroShipVelocity();
        else triggerSolarFlareCME(true);
      } else if (code === 'KeyH') toggleKeyboardHelp();
      else if (code === 'KeyO') toggleOrbits();
      else if (code === 'KeyB') toggleAsteroids();
      else if (code === 'KeyP') togglePause();
      else if (code === 'KeyT') toggleTourMode();
      else if (code === 'KeyV') setCameraPreset('topdown');
      else if (code === 'KeyZ') zoomToSurface();
      else if (code === 'KeyE' && !isCockpitMode) enterEarthAtmosphere();
      else if (code === 'KeyG') toggleAutopilot();
      else if (code === 'KeyI') toggleInvertPitch();
      else if (code === 'BracketLeft') stepPlanet(-1);
      else if (code === 'BracketRight') stepPlanet(1);
      else if (code === 'Comma') adjustTimeSpeed(-1);
      else if (code === 'Period') adjustTimeSpeed(1);
      else if (code === 'Escape') releaseFocus();
      else if (code === 'Digit0') selectCelestialTarget('sun');
      else if (code === 'Digit1') selectCelestialTarget('gaia');
      else if (code === 'Digit2') selectCelestialTarget('olympus');
      else if (code === 'Digit3') selectCelestialTarget('elysium');
      else if (code === 'Digit4') selectCelestialTarget('atlantis');
      else if (code === 'Digit5') selectCelestialTarget('arcadia');
      else if (code === 'Digit6') selectCelestialTarget('hyperborea');
      else if (code === 'Digit7') selectCelestialTarget('avalon');
      else if (code === 'Digit8') selectCelestialTarget('aether');
      else if (code === 'Digit9') {
        if (isCockpitMode) toggleFlightMode();
        setCameraPreset('overview');
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      keyState[e.code] = false;
    }

    let isCockpitCanvasDragging = false;
    let lastCockpitPointer = { x: 0, y: 0 };

    function onPointerDown(e: PointerEvent) {
      pointerDownPos.x = e.clientX;
      pointerDownPos.y = e.clientY;
      if (isCockpitMode) {
        isCockpitCanvasDragging = true;
        lastCockpitPointer.x = e.clientX;
        lastCockpitPointer.y = e.clientY;
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!isCockpitMode || !isCockpitCanvasDragging) return;
      const dx = e.clientX - lastCockpitPointer.x;
      const dy = e.clientY - lastCockpitPointer.y;
      lastCockpitPointer.x = e.clientX;
      lastCockpitPointer.y = e.clientY;

      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        const pitchSign = invertPitch ? -1 : 1;
        shipState.angularVelocity.y -= dx * 0.0045;
        shipState.angularVelocity.x -= dy * 0.0045 * pitchSign;
        isAutopilot = false;
        updateAutopilotUI();
      }
    }

    function onPointerUp(e: PointerEvent) {
      isCockpitCanvasDragging = false;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 6) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targetMeshes = Object.values(planetObjects).map((p) => p.mainMesh);
      const intersects = raycaster.intersectObjects(targetMeshes, false);

      if (intersects.length > 0) {
        const hitPlanetId = intersects[0].object.userData.planetId;
        if (hitPlanetId) selectCelestialTarget(hitPlanetId);
      }
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /* --- 12. 6DOF Spaceship Flight & Orbital Camera Updaters --- */
    const _forward = new THREE.Vector3();
    const _right = new THREE.Vector3();
    const _up = new THREE.Vector3();
    const _qPitch = new THREE.Quaternion();
    const _qYaw = new THREE.Quaternion();
    const _qRoll = new THREE.Quaternion();
    const _targetWorldPos = new THREE.Vector3();
    const _lookMatrix = new THREE.Matrix4();
    const _desiredQuat = new THREE.Quaternion();

    function updateSpaceshipFlight(dt: number) {
      const rotAccel = 2.6 * dt;
      const pitchSign = invertPitch ? -1 : 1;

      if (keyState['ArrowUp']) {
        shipState.angularVelocity.x += rotAccel * pitchSign;
        isAutopilot = false;
        updateAutopilotUI();
      }
      if (keyState['ArrowDown']) {
        shipState.angularVelocity.x -= rotAccel * pitchSign;
        isAutopilot = false;
        updateAutopilotUI();
      }
      if (keyState['ArrowLeft']) {
        shipState.angularVelocity.y += rotAccel;
        isAutopilot = false;
        updateAutopilotUI();
      }
      if (keyState['ArrowRight']) {
        shipState.angularVelocity.y -= rotAccel;
        isAutopilot = false;
        updateAutopilotUI();
      }

      // Virtual Touch Flight Stick input (smooth proportional pitch & yaw)
      const stickX = cockpitStickRef.current.x;
      const stickY = cockpitStickRef.current.y;
      if (Math.abs(stickX) > 0.04 || Math.abs(stickY) > 0.04) {
        shipState.angularVelocity.y -= stickX * rotAccel * 1.15;
        shipState.angularVelocity.x -= stickY * rotAccel * pitchSign * 1.15;
        isAutopilot = false;
        updateAutopilotUI();
      }

      if (keyState['KeyQ']) {
        shipState.angularVelocity.z += rotAccel * 1.25;
      }
      if (keyState['KeyE']) {
        shipState.angularVelocity.z -= rotAccel * 1.25;
      }

      shipState.angularVelocity.multiplyScalar(Math.pow(0.06, dt));

      _qPitch.setFromAxisAngle(new THREE.Vector3(1, 0, 0), shipState.angularVelocity.x * dt);
      _qYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), shipState.angularVelocity.y * dt);
      _qRoll.setFromAxisAngle(new THREE.Vector3(0, 0, 1), shipState.angularVelocity.z * dt);

      shipState.quaternion.multiply(_qYaw).multiply(_qPitch).multiply(_qRoll);
      shipState.quaternion.normalize();

      _forward.set(0, 0, -1).applyQuaternion(shipState.quaternion).normalize();
      _right.set(1, 0, 0).applyQuaternion(shipState.quaternion).normalize();
      _up.set(0, 1, 0).applyQuaternion(shipState.quaternion).normalize();

      let activeThrustInput = 0;
      if (isAutopilot && focusedPlanetId && planetObjects[focusedPlanetId]) {
        const tObj = planetObjects[focusedPlanetId];
        tObj.planetHolder.getWorldPosition(_targetWorldPos);
        const toTarget = _targetWorldPos.clone().sub(shipState.position);
        const dist = toTarget.length();
        const standoffDist = Math.max(tObj.data.radius * 3.4, 9.0);

        _lookMatrix.lookAt(shipState.position, _targetWorldPos, _up);
        _desiredQuat.setFromRotationMatrix(_lookMatrix);
        shipState.quaternion.slerp(_desiredQuat, clamp(dt * 3.8, 0, 1));

        if (dist > standoffDist * 1.08) {
          const desiredSpeed = clamp((dist - standoffDist) * 1.6, 12, 260);
          const desiredVel = toTarget.normalize().multiplyScalar(desiredSpeed);
          shipState.velocity.lerp(desiredVel, clamp(dt * 2.5, 0, 1));
          activeThrustInput = dist > 180 ? 1.0 : 0.65;
          shipState.isWarping = dist > 220;
        } else {
          shipState.velocity.multiplyScalar(Math.pow(0.02, dt));
          shipState.isWarping = false;
          isAutopilot = false;
          updateAutopilotUI();
        }
      } else {
        const isBoost = keyState['ShiftLeft'] || keyState['ShiftRight'];
        const wantsWarp = Boolean(keyState['Space'] && shipState.warpCharge > 2);
        shipState.isWarping = wantsWarp;

        let baseAccel = 42.0;
        if (isBoost) baseAccel = 135.0;
        if (wantsWarp) baseAccel = 480.0;

        if (keyState['KeyW'] || wantsWarp) {
          shipState.velocity.addScaledVector(_forward, baseAccel * dt);
          activeThrustInput = wantsWarp ? 1.0 : isBoost ? 0.85 : 0.5;
        }
        if (keyState['KeyS']) {
          shipState.velocity.addScaledVector(_forward, -baseAccel * 0.85 * dt);
          activeThrustInput = 0.35;
        }
        if (keyState['KeyA']) {
          shipState.velocity.addScaledVector(_right, -baseAccel * 0.65 * dt);
        }
        if (keyState['KeyD']) {
          shipState.velocity.addScaledVector(_right, baseAccel * 0.65 * dt);
        }
        if (keyState['KeyR'] || keyState['Equal']) {
          shipState.velocity.addScaledVector(_up, baseAccel * 0.65 * dt);
        }
        if (keyState['KeyF'] || keyState['Minus']) {
          shipState.velocity.addScaledVector(_up, -baseAccel * 0.65 * dt);
        }

        if (wantsWarp) {
          shipState.warpCharge = Math.max(0, shipState.warpCharge - 18 * dt);
        } else {
          shipState.warpCharge = Math.min(100, shipState.warpCharge + 14 * dt);
        }

        shipState.velocity.multiplyScalar(Math.pow(0.22, dt));
      }

      shipState.position.addScaledVector(shipState.velocity, dt);

      if (shipState.position.length() < 16.0) {
        shipState.position.normalize().multiplyScalar(16.0);
      }

      camera.position.copy(shipState.position);
      camera.quaternion.copy(shipState.quaternion);

      const targetFov = shipState.isWarping
        ? 104
        : keyState['ShiftLeft'] || keyState['ShiftRight']
          ? 68
          : 55;
      camera.fov += (targetFov - camera.fov) * clamp(dt * 6.0, 0, 1);
      camera.updateProjectionMatrix();

      if (warpTunnelLines) {
        const mat = warpTunnelLines.material as THREE.LineBasicMaterial;
        const targetOpacity = shipState.isWarping ? 0.75 : 0.0;
        mat.opacity += (targetOpacity - mat.opacity) * clamp(dt * 8.0, 0, 1);
        if (mat.opacity > 0.01) {
          warpTunnelLines.rotation.z += dt * 1.5;
          const posAttr = warpTunnelLines.geometry.attributes.position;
          for (let i = 0; i < posAttr.count; i += 2) {
            let z1 = posAttr.getZ(i) + dt * 220;
            let z2 = posAttr.getZ(i + 1) + dt * 220;
            if (z1 > 2) {
              z1 -= 95;
              z2 -= 95;
            }
            posAttr.setZ(i, z1);
            posAttr.setZ(i + 1, z2);
          }
          posAttr.needsUpdate = true;
        }
      }

      const speedUnits = shipState.velocity.length();
      const displayKms = (speedUnits * 14.8).toFixed(1);
      const speedReadoutEl = q('cockpit-speed-readout');
      if (speedReadoutEl) {
        speedReadoutEl.innerHTML = shipState.isWarping
          ? `${(speedUnits * 0.042).toFixed(2)} <span class="text-[9px] font-mono-tech text-fuchsia-400">c</span>`
          : `${displayKms} <span class="text-[9px] font-mono-tech text-sky-400">km/s</span>`;
      }

      shipState.throttleDisplay +=
        (activeThrustInput * 100 - shipState.throttleDisplay) * clamp(dt * 8, 0, 1);
      const throtPct = q('cockpit-throttle-pct');
      const throtBar = q('cockpit-throttle-bar');
      if (throtPct) throtPct.textContent = `${Math.round(shipState.throttleDisplay)}%`;
      if (throtBar) throtBar.style.width = `${clamp(shipState.throttleDisplay, 0, 100)}%`;

      const warpPct = q('cockpit-warp-pct');
      const warpBar = q('cockpit-warp-bar');
      if (warpPct) warpPct.textContent = `${Math.round(shipState.warpCharge)}%`;
      if (warpBar) warpBar.style.width = `${shipState.warpCharge}%`;

      if (!isAutopilot) {
        const badge = q('flight-status-badge');
        if (badge) {
          if (shipState.isWarping) {
            badge.textContent = 'WARP';
            badge.className =
              'text-[8px] font-mono-tech px-1 py-0.5 rounded bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/60';
          } else if (keyState['ShiftLeft'] || keyState['ShiftRight']) {
            badge.textContent = 'BOOST';
            badge.className =
              'text-[8px] font-mono-tech px-1 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/50';
          } else {
            badge.textContent = '6DOF';
            badge.className =
              'text-[8px] font-mono-tech px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          }
        }
      }

      const horizonEl = q('hud-horizon-group');
      const rungsEl = root?.querySelector('#hud-pitch-rungs');
      if (horizonEl && rungsEl) {
        const rollDeg = -shipState.angularVelocity.z * 28;
        const pitchOffset = clamp(shipState.angularVelocity.x * 22, -35, 35);
        horizonEl.style.transform = `rotate(${rollDeg}deg)`;
        rungsEl.setAttribute('transform', `translate(0, ${pitchOffset})`);
      }

      const targetBox = q('cockpit-target-box');
      if (focusedPlanetId && planetObjects[focusedPlanetId] && targetBox) {
        const tObj = planetObjects[focusedPlanetId];
        tObj.planetHolder.getWorldPosition(_targetWorldPos);
        const distUnits = _targetWorldPos.distanceTo(shipState.position);
        const distText = tObj.data.isDeepSpace
          ? `${(distUnits * 0.012).toFixed(1)} kLY`
          : `${(distUnits / 56).toFixed(2)} AU`;

        const navDist = q('nav-target-dist');
        const lockDist = q('cockpit-lock-dist');
        if (navDist) navDist.textContent = distText;
        if (lockDist) lockDist.textContent = distText;

        const proj = _targetWorldPos.clone().project(camera);
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;

        if (proj.z > 1.0) {
          const edgeX = clamp(-proj.x * halfW + halfW, 60, window.innerWidth - 60);
          const edgeY = clamp(proj.y * halfH + halfH, 80, window.innerHeight - 120);
          targetBox.style.left = `${edgeX}px`;
          targetBox.style.top = `${edgeY}px`;
          targetBox.style.opacity = '0.45';
        } else {
          const screenX = clamp(proj.x * halfW + halfW, 50, window.innerWidth - 50);
          const screenY = clamp(-proj.y * halfH + halfH, 70, window.innerHeight - 110);
          targetBox.style.left = `${screenX}px`;
          targetBox.style.top = `${screenY}px`;
          targetBox.style.opacity = '1';
        }
      }
    }

    const _spherical = new THREE.Spherical();
    const _offsetVec = new THREE.Vector3();

    function updateKeyboardOrbitalCamera(dt: number) {
      let azimDelta = 0;
      let polarDelta = 0;
      let zoomFactor = 1.0;

      const orbitSpeed = 1.45 * dt;
      if (keyState['ArrowLeft'] || keyState['KeyA']) azimDelta += orbitSpeed;
      if (keyState['ArrowRight'] || keyState['KeyD']) azimDelta -= orbitSpeed;
      if (keyState['ArrowUp'] || keyState['KeyW']) polarDelta -= orbitSpeed * 0.8;
      if (keyState['ArrowDown'] || keyState['KeyS']) polarDelta += orbitSpeed * 0.8;

      if (keyState['KeyR'] || keyState['Equal'] || keyState['NumpadAdd'])
        zoomFactor = 1.0 - 1.35 * dt;
      if (keyState['KeyF'] || keyState['Minus'] || keyState['NumpadSubtract'])
        zoomFactor = 1.0 + 1.35 * dt;

      if (azimDelta !== 0 || polarDelta !== 0 || zoomFactor !== 1.0) {
        cameraTransition.active = false;
        _offsetVec.copy(camera.position).sub(controls.target);
        _spherical.setFromVector3(_offsetVec);
        _spherical.theta += azimDelta;
        _spherical.phi = clamp(_spherical.phi + polarDelta, 0.08, Math.PI - 0.08);
        _spherical.radius = clamp(
          _spherical.radius * zoomFactor,
          controls.minDistance,
          controls.maxDistance,
        );
        _offsetVec.setFromSpherical(_spherical);
        camera.position.copy(controls.target).add(_offsetVec);
      }
    }

    /* --- 13. Initialization Sequence --- */
    updateLoadingProgress(15, 'Generating Deep Space Milky Way Skybox...');
    buildCosmosBackground();

    updateLoadingProgress(40, 'Synthesizing Planetary Surface Maps & Shaders...');
    buildCelestialBodies();

    updateLoadingProgress(65, 'Igniting Solar Magnetic Loops & CME Particle Engine...');
    buildSolarFlaresAndCME();

    updateLoadingProgress(80, 'Constructing Orion Nebula, Andromeda Galaxy & Pulsars...');
    buildDeepSpaceObjects();

    updateLoadingProgress(92, 'Populating 3D Asteroid & Kuiper Belts...');
    buildAsteroidBelts();
    buildWarpTunnelEffect();

    scene.add(orbitLinesGroup);
    scene.add(beltsGroup);

    buildUIAndLabels();

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    setCameraPreset('overview');

    updateLoadingProgress(100, 'All Telemetry & Flight Systems Online.');
    const loaderTimeout = setTimeout(() => {
      const loader = q('loading-screen');
      if (loader) loader.classList.add('opacity-0', 'pointer-events-none');
    }, 350);

    /* --- 14. Main 60FPS Animation Loop --- */
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();
    const prevPlanetWorldPos = new THREE.Vector3();
    const currPlanetWorldPos = new THREE.Vector3();
    const dummyAsteroid = new THREE.Object3D();

    function animate() {
      if (cancelled) return;
      animFrameId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const simDelta = isPaused ? 0 : dt * timeMultiplier;

      solarFlareBoost = Math.max(0, solarFlareBoost - dt * 0.45);
      if (sunMaterialUniforms) {
        sunMaterialUniforms.uTime.value = elapsed;
        sunMaterialUniforms.uFlareBoost.value = solarFlareBoost;
      }
      sunLight.intensity = 3.2 + solarFlareBoost * 1.4;

      for (let i = 0; i < solarLoops.length; i++) {
        const loop = solarLoops[i];
        loop.uniforms.uTime.value = elapsed;
        loop.uniforms.uIntensity.value =
          0.78 + Math.sin(elapsed * 1.8 + loop.phase) * 0.22 + solarFlareBoost * 0.5;
        const pulseScale =
          1.0 + Math.sin(elapsed * 0.9 + loop.phase) * 0.06 + solarFlareBoost * 0.12;
        loop.mesh.scale.setScalar(pulseScale);
      }

      autoCmeTimer += dt;
      if (autoCmeTimer > 22.0) {
        autoCmeTimer = 0;
        triggerSolarFlareCME(false);
      }

      if (cmeParticleSystem) {
        const posAttr = cmeParticleSystem.geometry.attributes.position;
        const colAttr = cmeParticleSystem.geometry.attributes.color;
        for (let i = 0; i < CME_COUNT; i++) {
          const p = cmeParticles[i];
          if (p.age < p.maxAge) {
            p.age += dt;
            p.pos.addScaledVector(p.vel, dt);
            const lifeRatio = clamp(p.age / p.maxAge, 0, 1);

            posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);

            const r = 1.0 - lifeRatio * 0.35;
            const g = Math.max(0, 0.95 - lifeRatio * 1.15);
            const b = Math.max(0, 0.75 - lifeRatio * 1.6);
            const fade = 1.0 - Math.pow(lifeRatio, 1.5);
            colAttr.setXYZ(i, r * fade, g * fade, b * fade);
          } else {
            posAttr.setXYZ(i, 0, 0, 0);
            colAttr.setXYZ(i, 0, 0, 0);
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      for (let i = 0; i < pulsarObjects.length; i++) {
        const pul = pulsarObjects[i];
        pul.spinGroup.rotation.y += pul.speed * dt;
        const strobe = 22 + Math.sin(elapsed * pul.speed * 2.0) * 8;
        pul.coreFlare.scale.setScalar(strobe);
      }
      if (planetObjects['andromeda']) {
        planetObjects['andromeda'].tiltGroup.rotation.y += 0.015 * dt;
      }

      if (!isPaused && timeMultiplier > 0) {
        simulatedDays += simDelta * 14.5;
        const baseDate = new Date(2026, 9, 21);
        baseDate.setDate(baseDate.getDate() + Math.floor(simulatedDays));
        const dateEl = q('sim-date-display');
        if (dateEl) dateEl.textContent = baseDate.toISOString().split('T')[0];
      }

      if (!isCockpitMode && focusedPlanetId && planetObjects[focusedPlanetId]) {
        planetObjects[focusedPlanetId].planetHolder.getWorldPosition(prevPlanetWorldPos);
      }

      if (!isPaused && timeMultiplier > 0) {
        systemOrbitPhase += 0.14 * simDelta;
      }

      CELESTIAL_DATA.filter((d) => !d.isDeepSpace).forEach((data, idx) => {
        const obj = planetObjects[data.id];
        if (!obj) return;

        if (data.distance && data.distance > 0 && data.orbitalSpeed) {
          // Harmonic 360-degree orbital progression: all 8 planets orbit continuously while staying spread across all 8 octants around the Sun
          obj.angle =
            obj.baseAngle +
            systemOrbitPhase +
            Math.sin(systemOrbitPhase * (0.65 + idx * 0.12) + idx * 1.3) * 0.18;
          const a = data.distance;
          const e = data.eccentricity || 0.01;
          const b = a * Math.sqrt(1 - e * e);
          obj.planetHolder.position.set(Math.cos(obj.angle) * a, 0, Math.sin(obj.angle) * b);
        }

        const rotSpeed = data.rotationSpeed || 0;
        obj.mainMesh.rotation.y += rotSpeed * (isPaused ? 0.15 : 1 + timeMultiplier * 0.35);

        if (obj.cloudMesh) {
          obj.cloudMesh.rotation.y +=
            rotSpeed * 1.28 * (isPaused ? 0.15 : 1 + timeMultiplier * 0.35);
        }

        obj.moons.forEach((m) => {
          m.pivot.rotation.y += m.speed * simDelta * 0.8;
        });
      });

      if (showBelts && !isPaused && timeMultiplier > 0 && asteroidInstancedMesh) {
        for (let i = 0; i < asteroidData.length; i++) {
          const a = asteroidData[i];
          a.angle += a.speed * 0.06 * simDelta;
          a.rotX += a.rotSpeedX;
          a.rotY += a.rotSpeedY;
          dummyAsteroid.position.set(
            Math.cos(a.angle) * a.radius,
            a.y,
            Math.sin(a.angle) * a.radius,
          );
          dummyAsteroid.rotation.set(a.rotX, a.rotY, 0);
          dummyAsteroid.scale.set(a.scaleX, a.scaleY, a.scaleZ);
          dummyAsteroid.updateMatrix();
          asteroidInstancedMesh.setMatrixAt(i, dummyAsteroid.matrix);
        }
        asteroidInstancedMesh.instanceMatrix.needsUpdate = true;
        beltsGroup.rotation.y += 0.004 * simDelta;
      }

      if (isCockpitMode) {
        updateSpaceshipFlight(dt);
      } else {
        updateKeyboardOrbitalCamera(dt);

        if (isTourMode) {
          tourTimer += dt;
          if (tourTimer > 9.0) {
            tourTimer = 0;
            tourIndex = (tourIndex + 1) % CELESTIAL_DATA.length;
            selectCelestialTarget(CELESTIAL_DATA[tourIndex].id);
          }
        }

        if (focusedPlanetId && planetObjects[focusedPlanetId]) {
          const targetObj = planetObjects[focusedPlanetId];
          targetObj.planetHolder.getWorldPosition(currPlanetWorldPos);

          if (cameraTransition.active) {
            cameraTransition.progress += dt / cameraTransition.duration;
            const t = clamp(cameraTransition.progress, 0, 1);
            const ease = 1 - Math.pow(1 - t, 3);

            const destPos = currPlanetWorldPos.clone().add(cameraTransition.desiredOffset);
            camera.position.lerpVectors(cameraTransition.startPos, destPos, ease);
            controls.target.lerpVectors(cameraTransition.startTarget, currPlanetWorldPos, ease);

            if (t >= 1) cameraTransition.active = false;
          } else {
            const deltaMove = currPlanetWorldPos.clone().sub(prevPlanetWorldPos);
            camera.position.add(deltaMove);
            controls.target.copy(currPlanetWorldPos);
          }
        } else if (cameraTransition.active) {
          cameraTransition.progress += dt / cameraTransition.duration;
          const t = clamp(cameraTransition.progress, 0, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          camera.position.lerpVectors(cameraTransition.startPos, cameraTransition.endPos, ease);
          controls.target.lerpVectors(
            cameraTransition.startTarget,
            cameraTransition.endTarget,
            ease,
          );
          if (t >= 1) cameraTransition.active = false;
        }

        controls.update();
      }

      if (showLabelsRef.current) {
        if (labelsContainer.style.display === 'none') {
          labelsContainer.style.display = 'block';
        }
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;

        CELESTIAL_DATA.forEach((data) => {
          const obj = planetObjects[data.id];
          const lbl = labelElements[data.id];
          if (!obj || !lbl) return;

          lbl.style.display = 'flex';
          obj.planetHolder.getWorldPosition(tempVec);
          tempVec.y += data.radius * 1.35;
          tempVec.project(camera);

          if (tempVec.z > 1.0 || (!isCockpitMode && focusedPlanetId === data.id)) {
            lbl.style.opacity = '0';
            lbl.style.pointerEvents = 'none';
          } else {
            const x = tempVec.x * halfW + halfW;
            const y = -(tempVec.y * halfH) + halfH;
            lbl.style.left = `${x}px`;
            lbl.style.top = `${y}px`;
            lbl.style.opacity = '1';
            lbl.style.pointerEvents = 'auto';
          }
        });
      } else {
        if (labelsContainer.style.display !== 'none') {
          labelsContainer.style.display = 'none';
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameId);
      clearTimeout(loaderTimeout);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, [activeSurfacePlanetId, playerOwnedPlanetId]);

  const sovereignRegistry = buildSovereignRegistry(playerOwnedPlanetId);

  if (activeSurfacePlanetId) {
    const pData = CELESTIAL_DATA.find((c) => c.id === activeSurfacePlanetId);
    const sovInfo = sovereignRegistry[activeSurfacePlanetId] || {
      ownerName: 'Commander (You)',
      isPlayer: true,
    };
    return (
      <EarthBase3DView
        onExitToSpace={() => setActiveSurfacePlanetId(null)}
        planetId={activeSurfacePlanetId}
        planetName={pData?.name || 'Gaia'}
        ownerName={sovInfo.ownerName}
        isOwner={sovInfo.isPlayer}
      />
    );
  }

  const isSelectedPlanetAncient = (ANCIENT_PLANET_IDS as readonly string[]).includes(
    selectedPlanetId,
  );
  const isSelectedPlanetOwned = selectedPlanetId === playerOwnedPlanetId;
  const selectedPlanetObj = CELESTIAL_DATA.find((c) => c.id === selectedPlanetId);
  const ownedPlanetObj = CELESTIAL_DATA.find((c) => c.id === playerOwnedPlanetId);

  return (
    <div ref={rootRef} className="relative h-screen w-screen overflow-hidden bg-[#02040a] select-none">
      {/* SOVEREIGN REALM CLAIM & REGISTRY MODAL (1 PLAYER = 1 PLANET) */}
      {showClaimModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl">
          <div className="glass-panel max-w-2xl w-full rounded-3xl p-5 sm:p-6 border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.25)] max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="text-[10px] font-mono-tech uppercase tracking-widest text-emerald-400">
                  Sovereign Pact // 1 Player = 1 Ancient Earth
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Claim Your Sovereign Home Planet
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  All 8 worlds are living Earth-like realms with oceans, continents, and clouds. You
                  hold <strong className="text-emerald-300">Full Sovereign Command</strong> on your
                  chosen planet and <strong className="text-rose-300">Spectator View-Only</strong>{' '}
                  access on the other 7 rival realms.
                </p>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="glass-pill px-2.5 py-1 rounded-xl text-xs font-mono-tech text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4 overflow-y-auto thin-scrollbar pr-1">
              {CELESTIAL_DATA.filter((p) =>
                (ANCIENT_PLANET_IDS as readonly string[]).includes(p.id),
              ).map((planet) => {
                const isMine = planet.id === playerOwnedPlanetId;
                const rivalName = RIVAL_SOVEREIGNS[planet.id];
                return (
                  <div
                    key={planet.id}
                    className={`rounded-2xl p-3 border transition-all flex flex-col justify-between gap-2 ${
                      isMine
                        ? 'bg-emerald-950/40 border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{
                              background: planet.badgeBg,
                              boxShadow: `0 0 10px ${planet.color}88`,
                            }}
                          />
                          <span className="font-display font-bold text-sm sm:text-base text-white">
                            {planet.name}
                          </span>
                        </div>
                        {isMine ? (
                          <span className="text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-300 border border-emerald-400/50">
                            ★ Your Realm
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            Ruler: {rivalName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                        {planet.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleClaimSovereignPlanet(planet.id)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                          isMine
                            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50'
                            : 'glass-pill text-slate-200 hover:text-emerald-300'
                        }`}
                      >
                        {isMine ? 'Active Sovereign Seat' : `Claim ${planet.name}`}
                      </button>
                      <button
                        onClick={() => {
                          setShowClaimModal(false);
                          actionsRef.current?.enterEarthAtmosphere(planet.id);
                        }}
                        className="glass-pill py-1.5 px-2.5 rounded-xl text-xs font-mono-tech text-sky-300 hover:text-white"
                      >
                        {isMine ? 'Enter Base' : 'Spectate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Atmospheric Re-Entry Transition Overlay */}
      {divingToEarth && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-sky-400/25 backdrop-blur-md transition-all duration-700">
          <div className="glass-panel px-6 py-4 rounded-3xl flex items-center gap-3.5 border-emerald-400/60 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <Globe2 className="w-6 h-6 text-emerald-300 animate-spin" />
            <div>
              <div className="font-display text-base sm:text-lg font-bold tracking-widest uppercase text-white">
                Entering {selectedPlanetObj?.name || 'Gaia'} Atmosphere
              </div>
              <div className="font-mono-tech text-xs text-emerald-300 uppercase">
                {isSelectedPlanetOwned
                  ? 'Landing at Your Sovereign Command Base...'
                  : `Entering Spectator Orbit (${RIVAL_SOVEREIGNS[selectedPlanetId] || 'Rival Sovereign'})...`}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Loading & Procedural Synthesis Overlay */}
      <div
        id="loading-screen"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#02040a] transition-opacity duration-700"
      >
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-t-amber-400 border-r-sky-400 border-b-fuchsia-500 border-l-transparent animate-spin" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 shadow-[0_0_45px_rgba(245,158,11,0.85)] animate-pulse-glow" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-[0.22em] text-white uppercase mb-2">
          Heliosphere <span className="text-sky-400 font-light">v2.0</span>
        </h1>
        <p
          id="loading-status"
          className="font-mono-tech text-xs sm:text-sm text-slate-400 tracking-widest uppercase mb-6"
        >
          Synthesizing 8 Ancient Earth Realms, Solar Flares &amp; Nebulae...
        </p>
        <div className="w-64 sm:w-80 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
          <div
            id="loading-bar"
            className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-fuchsia-500 w-0 transition-all duration-200"
          />
        </div>
      </div>

      {/* WebGL 3D Canvas Container */}
      <div id="canvas-container" className="fixed inset-0 w-full h-full z-[1]" />

      {/* 3D Floating HTML Labels Container */}
      <div
        id="labels-container"
        style={{ display: labelsEnabled ? 'block' : 'none' }}
        className={`fixed inset-0 pointer-events-none z-10 overflow-hidden ${
          labelsEnabled ? '' : 'hidden'
        }`}
      />

      {/* SCI-FI SPACESHIP COCKPIT HUD OVERLAY (MOBILE, TABLET & DESKTOP READY) */}
      <div
        id="cockpit-hud"
        className="fixed inset-0 z-[15] pointer-events-none hidden cockpit-vignette transition-opacity duration-300"
      >
        <svg className="w-full h-full opacity-75" viewBox="0 0 1920 1080" preserveAspectRatio="none">
          <defs>
            <linearGradient id="strutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.96" />
            </linearGradient>
            <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,0 L1920,0 L1920,90 L1620,42 L300,42 L0,90 Z"
            fill="url(#strutGrad)"
            stroke="#1e293b"
            strokeWidth="2"
          />
          <path d="M0,90 L300,42 L135,920 L0,1080 Z" fill="url(#strutGrad)" opacity="0.35" />
          <path d="M1920,90 L1620,42 L1785,920 L1920,1080 Z" fill="url(#strutGrad)" opacity="0.35" />
          <polyline
            points="300,42 135,920 420,1030"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          <polyline
            points="1620,42 1785,920 1500,1030"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.3"
          />
          <path
            d="M0,1080 L135,920 L420,1010 L1500,1010 L1785,920 L1920,1080 Z"
            fill="url(#strutGrad)"
            stroke="#334155"
            strokeWidth="1.5"
          />
          <line x1="420" y1="1010" x2="1500" y2="1010" stroke="url(#cyanGlow)" strokeWidth="2" />
        </svg>

        {/* Central Pitch Ladder, Roll Horizon & Reticle */}
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative w-56 h-56 sm:w-80 sm:h-80 flex items-center justify-center">
            <svg className="w-full h-full opacity-45" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.75"
                strokeDasharray="4 6"
              />
              <path
                d="M100,8 L100,16 M100,184 L100,192 M8,100 L16,100 M184,100 L192,100"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
            </svg>

            <div
              id="hud-horizon-group"
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
            >
              <svg className="w-44 h-44 sm:w-64 sm:h-64" viewBox="0 0 200 200">
                <line
                  x1="25"
                  y1="100"
                  x2="72"
                  y2="100"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeOpacity="0.8"
                />
                <line
                  x1="128"
                  y1="100"
                  x2="175"
                  y2="100"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                  strokeOpacity="0.8"
                />
                <g
                  id="hud-pitch-rungs"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeOpacity="0.55"
                  fill="none"
                >
                  <path d="M65,70 L82,70 L82,75 M135,70 L118,70 L118,75" />
                  <path d="M75,45 L86,45 L86,49 M125,45 L114,45 L114,49" />
                  <path
                    d="M65,130 L82,130 L82,125 M135,130 L118,130 L118,125"
                    strokeDasharray="3 2"
                  />
                  <path
                    d="M75,155 L86,155 L86,151 M125,155 L114,155 L114,151"
                    strokeDasharray="3 2"
                  />
                </g>
              </svg>
            </div>

            <div className="w-4 h-4 relative flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
              <div className="absolute w-6 h-6 rounded-full border border-sky-400/70" />
            </div>
          </div>
        </div>

        {/* 3D Target Lock Box */}
        <div
          id="cockpit-target-box"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-amber-400/80 rounded-lg flex flex-col items-center justify-between p-1 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-opacity duration-150"
        >
          <div className="w-full flex justify-between text-[9px] font-mono-tech text-amber-300 uppercase px-1 bg-slate-950/80 rounded">
            <span id="cockpit-lock-name">GAIA</span>
            <span>LOCK</span>
          </div>
          <div
            id="cockpit-lock-dist"
            className="text-[10px] font-mono-tech font-bold text-sky-300 bg-slate-950/85 px-1.5 py-0.5 rounded border border-sky-500/30 whitespace-nowrap"
          >
            0.0 AU
          </div>
        </div>

        {/* UNIFIED ULTRA-COMPACT COCKPIT BAR (TOP-CENTER) */}
        <div className="fixed top-12 left-1/2 -translate-x-1/2 max-w-[96vw] w-auto glass-panel rounded-xl px-2 py-1 border border-sky-500/35 pointer-events-auto shadow-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            {/* Speed & Flight Status */}
            <div className="flex items-center gap-1.5 pr-1.5 border-r border-slate-800/80">
              <span
                id="flight-status-badge"
                className="text-[8px] font-mono-tech px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              >
                SUBLIGHT
              </span>
              <div
                id="cockpit-speed-readout"
                className="font-display text-xs sm:text-sm font-bold text-white leading-none"
              >
                0.0 <span className="text-[9px] font-mono-tech text-sky-400">km/s</span>
              </div>
            </div>

            {/* Compact Thrust & Warp Bars */}
            <div className="hidden xs:flex flex-col gap-0.5 w-14 sm:w-20 pr-1.5 border-r border-slate-800/80">
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-mono-tech text-slate-400">T</span>
                <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    id="cockpit-throttle-bar"
                    className="h-full bg-gradient-to-r from-sky-500 to-amber-400 w-0"
                  />
                </div>
                <span id="cockpit-throttle-pct" className="hidden">0%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] font-mono-tech text-slate-400">W</span>
                <div className="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    id="cockpit-warp-bar"
                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-400 w-full"
                  />
                </div>
                <span id="cockpit-warp-pct" className="hidden">100%</span>
              </div>
            </div>

            {/* Target Selector */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-800/80">
              <button
                onClick={() => actionsRef.current?.stepPlanet(-1)}
                className="glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-mono-tech text-slate-200"
                title="Previous Target"
              >
                ◀
              </button>
              <div className="bg-slate-900/85 border border-slate-800 rounded-md px-1.5 py-0.5 min-w-[72px] sm:min-w-[90px] text-center">
                <div
                  id="nav-target-name"
                  className="font-display text-[10px] sm:text-xs font-bold text-white truncate leading-tight"
                >
                  Gaia
                </div>
                <div className="flex items-center justify-center gap-1 text-[7px] font-mono-tech leading-none">
                  <span id="nav-target-type" className="hidden">REALM</span>
                  <span id="nav-target-dist" className="text-sky-300">0.00 AU</span>
                </div>
              </div>
              <button
                onClick={() => actionsRef.current?.stepPlanet(1)}
                className="glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-mono-tech text-slate-200"
                title="Next Target"
              >
                ▶
              </button>
            </div>

            {/* Small Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => actionsRef.current?.toggleAutopilot()}
                id="btn-autopilot"
                className="glass-pill py-1 px-2 rounded-md text-[9px] sm:text-[10px] font-semibold text-amber-300 border-amber-500/40"
              >
                🚀 Auto
              </button>
              <button
                onClick={() => actionsRef.current?.zeroShipVelocity()}
                className="glass-pill py-1 px-1.5 rounded-md text-[9px] sm:text-[10px] font-medium text-slate-300"
                title="Full All-Stop Brake"
              >
                Stop
              </button>
              {isSelectedPlanetAncient && (
                <button
                  onClick={() => actionsRef.current?.enterEarthAtmosphere(selectedPlanetId)}
                  className="glass-pill py-1 px-1.5 rounded-md text-[9px] sm:text-[10px] font-semibold text-emerald-300 border-emerald-400/50"
                >
                  Land
                </button>
              )}
              <button
                onClick={() => actionsRef.current?.toggleInvertPitch()}
                className="glass-pill py-1 px-1.5 rounded-md text-[9px] font-mono-tech text-slate-300"
                title="Invert Pitch"
              >
                <span id="pitch-invert-label">STD</span>
              </button>
              <button
                onClick={() => actionsRef.current?.toggleFlightMode()}
                className="glass-pill py-1 px-2 rounded-md text-[9px] sm:text-[10px] font-semibold text-rose-300 border border-rose-500/40"
              >
                Exit
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM-LEFT VIRTUAL TOUCH FLIGHT STICK (COMPACT) */}
        <div className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 pointer-events-auto flex flex-col items-center gap-0.5 select-none touch-none">
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              cockpitStickTouchId.current = e.pointerId;
              const rect = e.currentTarget.getBoundingClientRect();
              cockpitStickCenter.current = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              };
              const maxR = rect.width * 0.38;
              const dx = e.clientX - cockpitStickCenter.current.x;
              const dy = e.clientY - cockpitStickCenter.current.y;
              const dist = Math.hypot(dx, dy);
              const clampedDist = Math.min(dist, maxR);
              const angle = Math.atan2(dy, dx);
              const nx = maxR > 0 ? (Math.cos(angle) * clampedDist) / maxR : 0;
              const ny = maxR > 0 ? (Math.sin(angle) * clampedDist) / maxR : 0;
              cockpitStickRef.current = { x: nx, y: ny };
              setCockpitStickUi({ x: nx * 22, y: ny * 22 });
            }}
            onPointerMove={(e) => {
              if (cockpitStickTouchId.current !== e.pointerId) return;
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const maxR = rect.width * 0.38;
              const dx = e.clientX - cockpitStickCenter.current.x;
              const dy = e.clientY - cockpitStickCenter.current.y;
              const dist = Math.hypot(dx, dy);
              const clampedDist = Math.min(dist, maxR);
              const angle = Math.atan2(dy, dx);
              const nx = maxR > 0 ? (Math.cos(angle) * clampedDist) / maxR : 0;
              const ny = maxR > 0 ? (Math.sin(angle) * clampedDist) / maxR : 0;
              cockpitStickRef.current = { x: nx, y: ny };
              setCockpitStickUi({ x: nx * 22, y: ny * 22 });
            }}
            onPointerUp={(e) => {
              if (cockpitStickTouchId.current !== e.pointerId) return;
              e.stopPropagation();
              cockpitStickTouchId.current = null;
              cockpitStickRef.current = { x: 0, y: 0 };
              setCockpitStickUi({ x: 0, y: 0 });
            }}
            onPointerCancel={() => {
              cockpitStickTouchId.current = null;
              cockpitStickRef.current = { x: 0, y: 0 };
              setCockpitStickUi({ x: 0, y: 0 });
            }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-950/75 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.2)] flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <div className="absolute inset-2 rounded-full border border-dashed border-sky-400/25 pointer-events-none" />
            <div
              style={{
                transform: `translate(${cockpitStickUi.x}px, ${cockpitStickUi.y}px)`,
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-600 border border-white/80 shadow-[0_0_10px_rgba(56,189,248,0.75)] pointer-events-none transition-transform duration-75"
            />
          </div>
          <span className="text-[8px] font-mono-tech uppercase tracking-wider text-sky-300/80 bg-slate-950/75 px-1.5 py-0.5 rounded-full border border-sky-500/25">
            Steer
          </span>
        </div>

        {/* BOTTOM-RIGHT TOUCH PROPULSION, WARP & ROLL PAD (COMPACT BUTTONS) */}
        <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 pointer-events-auto flex flex-col items-end gap-1 select-none touch-none">
          {/* Roll Left / Right Bank Buttons */}
          <div className="flex items-center gap-1">
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                actionsRef.current?.setFlightKey('KeyQ', true);
              }}
              onPointerUp={() => actionsRef.current?.setFlightKey('KeyQ', false)}
              onPointerLeave={() => actionsRef.current?.setFlightKey('KeyQ', false)}
              onPointerCancel={() => actionsRef.current?.setFlightKey('KeyQ', false)}
              className="glass-panel px-2 py-1 rounded-lg text-[9px] font-mono-tech font-semibold text-slate-200 active:bg-sky-500/30 border border-slate-700"
            >
              ↺ Roll L
            </button>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                actionsRef.current?.setFlightKey('KeyE', true);
              }}
              onPointerUp={() => actionsRef.current?.setFlightKey('KeyE', false)}
              onPointerLeave={() => actionsRef.current?.setFlightKey('KeyE', false)}
              onPointerCancel={() => actionsRef.current?.setFlightKey('KeyE', false)}
              className="glass-panel px-2 py-1 rounded-lg text-[9px] font-mono-tech font-semibold text-slate-200 active:bg-sky-500/30 border border-slate-700"
            >
              ↻ Roll R
            </button>
          </div>

          {/* Warp & Afterburner Boost Row */}
          <div className="flex items-center gap-1">
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                actionsRef.current?.setFlightKey('Space', true);
              }}
              onPointerUp={() => actionsRef.current?.setFlightKey('Space', false)}
              onPointerLeave={() => actionsRef.current?.setFlightKey('Space', false)}
              onPointerCancel={() => actionsRef.current?.setFlightKey('Space', false)}
              className="glass-panel px-2.5 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider text-fuchsia-300 border border-fuchsia-400/60 active:scale-95"
            >
              🌌 Warp
            </button>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                actionsRef.current?.setFlightKey('KeyW', true);
                actionsRef.current?.setFlightKey('ShiftLeft', true);
              }}
              onPointerUp={() => {
                actionsRef.current?.setFlightKey('KeyW', false);
                actionsRef.current?.setFlightKey('ShiftLeft', false);
              }}
              onPointerLeave={() => {
                actionsRef.current?.setFlightKey('KeyW', false);
                actionsRef.current?.setFlightKey('ShiftLeft', false);
              }}
              onPointerCancel={() => {
                actionsRef.current?.setFlightKey('KeyW', false);
                actionsRef.current?.setFlightKey('ShiftLeft', false);
              }}
              className="glass-panel px-2.5 py-1.5 rounded-xl text-[10px] font-display font-bold uppercase tracking-wider text-amber-300 border border-amber-400/60 active:scale-95"
            >
              ⚡ Boost
            </button>
          </div>

          {/* Sublight Thrust & Retro Brake Row */}
          <div className="flex items-center gap-1">
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                actionsRef.current?.setFlightKey('KeyS', true);
              }}
              onPointerUp={() => actionsRef.current?.setFlightKey('KeyS', false)}
              onPointerLeave={() => actionsRef.current?.setFlightKey('KeyS', false)}
              onPointerCancel={() => actionsRef.current?.setFlightKey('KeyS', false)}
              className="glass-panel px-2.5 py-1.5 rounded-xl text-[10px] font-mono-tech font-semibold text-slate-300 border border-slate-700 active:scale-95"
            >
              ⏪ Retro
            </button>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                actionsRef.current?.setFlightKey('KeyW', true);
              }}
              onPointerUp={() => actionsRef.current?.setFlightKey('KeyW', false)}
              onPointerLeave={() => actionsRef.current?.setFlightKey('KeyW', false)}
              onPointerCancel={() => actionsRef.current?.setFlightKey('KeyW', false)}
              className="glass-panel px-3 py-1.5 rounded-xl text-[11px] font-display font-bold uppercase tracking-wider text-sky-200 bg-sky-500/25 border border-sky-400 active:scale-95"
            >
              🔥 Thrust
            </button>
          </div>
        </div>
      </div>

      {/* SOLAR WEATHER / X-CLASS FLARE ALERT BANNER */}
      <div
        id="solar-flare-banner"
        className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-0 -translate-y-4 transition-all duration-300"
      >
        <div className="glass-panel border-amber-500/80 bg-amber-950/70 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.45)]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <div className="font-mono-tech text-xs text-amber-200 tracking-wider uppercase">
            <strong className="text-white">SOLAR WEATHER ALERT:</strong> X-Class Coronal Mass
            Ejection (CME) Eruption Active!
          </div>
        </div>
      </div>

      {/* COMPACT TOP BAR (CLEAN & UNOBSTRUCTED ON MOBILE, TABLET & DESKTOP) */}
      <header className="fixed top-0 left-0 right-0 z-30 p-2 sm:p-3 pointer-events-none flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            onClick={() => setSidePanelOpen((prev) => !prev)}
            className={`glass-panel px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all border ${
              sidePanelOpen
                ? 'border-sky-400 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                : 'border-slate-700/80 text-white hover:border-sky-400/60'
            }`}
            title="Open Command Deck Side Panel"
          >
            <svg
              className="w-4 h-4 text-sky-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              {sidePanelOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
            <span className="font-display tracking-wider uppercase text-[11px] sm:text-xs">
              Command Deck
            </span>
          </button>

          <div className="glass-panel rounded-2xl px-2.5 py-1.5 hidden sm:flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
            <div className="text-[10px] font-mono-tech flex items-center gap-2 text-slate-300">
              <span className="text-emerald-300 font-semibold">
                HOME: {(ownedPlanetObj?.name || 'Gaia').toUpperCase()}
              </span>
              <span className="text-slate-600">|</span>
              <span id="active-target-indicator" className="text-sky-400">
                TARGET: GAIA
              </span>
              <span
                id="mode-indicator-pill"
                className="hidden md:inline-block text-[9px] font-mono-tech uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40"
              >
                ORBITAL MODE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => actionsRef.current?.toggleLabels()}
            className={`glass-panel px-2.5 py-2 rounded-2xl text-[10px] sm:text-xs font-semibold flex items-center gap-1 border ${
              labelsEnabled
                ? 'text-slate-200 border-slate-700/80'
                : 'text-sky-300 border-sky-400/50 bg-sky-500/15'
            }`}
            title={labelsEnabled ? 'Disable 3D Planet Labels' : 'Show 3D Planet Labels'}
          >
            <span>{labelsEnabled ? 'Disable Labels' : 'Show Labels'}</span>
          </button>

          <button
            onClick={() => setShowClaimModal(true)}
            className="glass-panel px-2.5 py-2 rounded-2xl text-[11px] sm:text-xs font-semibold text-sky-300 border border-sky-400/40 flex items-center gap-1"
            title="Sovereign Pact: 1 Player = 1 Ancient Earth"
          >
            <span>👑</span>
            <span className="hidden xs:inline">{ownedPlanetObj?.name || 'Gaia'}</span>
          </button>

          <button
            onClick={() =>
              actionsRef.current?.enterEarthAtmosphere(
                isSelectedPlanetAncient ? selectedPlanetId : playerOwnedPlanetId,
              )
            }
            id="btn-enter-earth"
            className={`glass-panel px-3 py-2 rounded-2xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 border ${
              !isSelectedPlanetAncient || isSelectedPlanetOwned
                ? 'text-emerald-300 border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-amber-300 border-amber-400/60'
            }`}
            title="Dive into Planet Atmosphere [E]"
          >
            <Globe2 className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
            <span>
              {!isSelectedPlanetAncient || isSelectedPlanetOwned
                ? `Enter ${ownedPlanetObj?.name || 'Gaia'} Base`
                : `Spectate ${selectedPlanetObj?.name || 'Realm'}`}
            </span>
          </button>
        </div>
      </header>

      {/* MOBILE / TABLET BACKDROP WHEN SIDE PANEL IS OPEN */}
      {sidePanelOpen && (
        <div
          onClick={() => setSidePanelOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* COLLAPSIBLE LEFT SIDE PANEL DRAWER (HOUSES REALMS DOCK, CONTROLS, TIME WARP & SHORTCUTS) */}
      <aside
        className={`fixed top-14 sm:top-16 left-2 sm:left-3 z-30 w-[calc(100vw-1rem)] max-w-[340px] max-h-[calc(100vh-4.5rem)] glass-panel rounded-3xl p-3.5 sm:p-4 flex flex-col transition-all duration-300 border border-slate-700/80 shadow-2xl ${
          sidePanelOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-[115%] opacity-0 pointer-events-none'
        }`}
      >
        {/* Drawer Header + Tab Switcher */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
          <div>
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-sky-400">
              Sovereign Grid // Deck
            </div>
            <div className="text-xs font-mono-tech text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span id="sim-date-display">2026-10-21</span>
              <span>•</span>
              <span className="text-emerald-300">Home: {ownedPlanetObj?.name || 'Gaia'}</span>
            </div>
          </div>
          <button
            onClick={() => setSidePanelOpen(false)}
            className="glass-pill px-2.5 py-1 rounded-xl text-xs font-mono-tech text-slate-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* 3-Tab Navigation Bar */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 mb-3">
          <button
            onClick={() => setSidePanelTab('realms')}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all ${
              sidePanelTab === 'realms'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Realms (13)
          </button>
          <button
            onClick={() => setSidePanelTab('controls')}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all ${
              sidePanelTab === 'controls'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Controls
          </button>
          <button
            onClick={() => setSidePanelTab('keys')}
            id="btn-help"
            className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all ${
              sidePanelTab === 'keys'
                ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Shortcuts
          </button>
        </div>

        {/* Scrollable Tab Content Area */}
        <div className="overflow-y-auto thin-scrollbar pr-1 space-y-3 flex-1">
          {/* TAB 1: REALMS & CELESTIAL TARGETS DOCK */}
          <div className={sidePanelTab === 'realms' ? 'space-y-2.5' : 'hidden'}>
            <button
              onClick={() => {
                setSidePanelOpen(false);
                setShowClaimModal(true);
              }}
              className="w-full py-2 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span>👑 Sovereign Realm Registry</span>
              <span className="text-[10px] font-mono-tech uppercase">Change / Inspect</span>
            </button>

            <div className="text-[10px] font-mono-tech uppercase tracking-wider text-slate-400 px-1">
              Tap Any World or Deep-Space Target:
            </div>
            <div id="planet-dock" className="grid grid-cols-2 gap-1.5" />
          </div>

          {/* TAB 2: FLIGHT, CAMERA, LAYERS & TIME WARP CONTROLS */}
          <div className={sidePanelTab === 'controls' ? 'space-y-3.5' : 'hidden'}>
            {/* Orbital Time Warp Section */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-tech uppercase tracking-wider text-sky-400 font-semibold">
                  Orbital Time Warp
                </span>
                <span
                  id="speed-readout"
                  className="font-mono-tech text-xs font-semibold text-sky-300"
                >
                  1.0x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => actionsRef.current?.togglePause()}
                  id="btn-pause"
                  className="glass-pill px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-sky-400 text-xs"
                  title="Pause / Resume Orbital Motion [P]"
                >
                  <svg id="icon-pause" className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <svg
                    id="icon-play"
                    className="w-3.5 h-3.5 hidden"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                </button>
                <button
                  onClick={() => actionsRef.current?.adjustTimeSpeed(-1)}
                  className="glass-pill px-2 py-1 rounded-lg text-xs text-slate-300"
                >
                  -
                </button>
                <input
                  id="time-slider"
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="25"
                  className="cosmic-slider flex-1"
                  onChange={(e) => actionsRef.current?.onTimeSliderChange(e.target.value)}
                />
                <button
                  onClick={() => actionsRef.current?.adjustTimeSpeed(1)}
                  className="glass-pill px-2 py-1 rounded-lg text-xs text-slate-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* Camera View Presets */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="text-[10px] font-mono-tech uppercase tracking-wider text-slate-400 font-semibold">
                Camera View Presets
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    actionsRef.current?.setCameraPreset('overview');
                    setSidePanelOpen(false);
                  }}
                  id="preset-overview"
                  className="glass-pill active py-2 px-2 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center"
                >
                  Overview
                </button>
                <button
                  onClick={() => {
                    actionsRef.current?.setCameraPreset('topdown');
                    setSidePanelOpen(false);
                  }}
                  id="preset-topdown"
                  className="glass-pill py-2 px-2 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center"
                >
                  Ecliptic
                </button>
                <button
                  onClick={() => {
                    actionsRef.current?.toggleTourMode();
                    setSidePanelOpen(false);
                  }}
                  id="preset-tour"
                  className="glass-pill py-2 px-2 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center"
                >
                  Auto Tour
                </button>
              </div>
            </div>

            {/* Flight & Solar Events */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="text-[10px] font-mono-tech uppercase tracking-wider text-amber-400 font-semibold">
                Flight Deck &amp; Solar Weather
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    actionsRef.current?.toggleFlightMode();
                    setSidePanelOpen(false);
                  }}
                  id="btn-cockpit-mode"
                  className="glass-pill py-2 px-2.5 rounded-xl text-xs font-semibold text-amber-300 border-amber-500/40 flex items-center justify-center gap-1.5"
                >
                  <span>Cockpit 6DOF</span>
                  <span className="kbd-badge">C</span>
                </button>
                <button
                  onClick={() => {
                    actionsRef.current?.triggerSolarFlareCME(true);
                    setSidePanelOpen(false);
                  }}
                  id="btn-solar-flare"
                  className="glass-pill py-2 px-2.5 rounded-xl text-xs font-medium text-orange-300 flex items-center justify-center gap-1.5"
                >
                  <span>CME Flare</span>
                  <span className="kbd-badge">X</span>
                </button>
              </div>
            </div>

            {/* Visual HUD Overlays */}
            <div className="bg-slate-900/75 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="text-[10px] font-mono-tech uppercase tracking-wider text-slate-400 font-semibold">
                Visual Overlays
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => actionsRef.current?.toggleOrbits()}
                  id="btn-orbits"
                  className="glass-pill active py-2 px-2 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center"
                >
                  Orbits
                </button>
                <button
                  onClick={() => actionsRef.current?.toggleLabels()}
                  id="btn-labels"
                  className={`glass-pill py-2 px-2 rounded-xl text-[11px] font-medium text-slate-200 flex items-center justify-center ${
                    labelsEnabled ? 'active' : ''
                  }`}
                >
                  {labelsEnabled ? 'Disable Labels' : 'Show Labels'}
                </button>
                <button
                  onClick={() => actionsRef.current?.toggleAsteroids()}
                  id="btn-asteroids"
                  className="glass-pill active py-2 px-2 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center"
                >
                  Belts
                </button>
              </div>
            </div>
          </div>

          {/* TAB 3: KEYBOARD SHORTCUTS CHEAT-SHEET */}
          <div
            id="keyboard-help-panel"
            className={sidePanelTab === 'keys' ? 'space-y-3 text-xs' : 'hidden'}
          >
            <div id="help-orbital-section" className="space-y-1.5 text-[11px]">
              <div className="text-[10px] font-mono-tech uppercase text-sky-400 font-semibold">
                Orbital Camera Controls
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Orbit Camera Around</span>
                <span>
                  <kbd className="kbd-badge">Arrows</kbd> / <kbd className="kbd-badge">WASD</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Zoom In / Out</span>
                <span>
                  <kbd className="kbd-badge">R</kbd> <kbd className="kbd-badge">F</kbd> or{' '}
                  <kbd className="kbd-badge">+</kbd> <kbd className="kbd-badge">-</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Select Sun / 8 Realms</span>
                <span>
                  <kbd className="kbd-badge">0</kbd> - <kbd className="kbd-badge">8</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cycle All 13 Targets</span>
                <span>
                  <kbd className="kbd-badge">[</kbd> / <kbd className="kbd-badge">]</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Close Surface Zoom</span>
                <span>
                  <kbd className="kbd-badge">Z</kbd>
                </span>
              </div>
              <div className="flex justify-between text-emerald-300 font-medium">
                <span>Enter / Spectate Realm</span>
                <span>
                  <kbd className="kbd-badge">E</kbd>
                </span>
              </div>
            </div>

            <div id="help-cockpit-section" className="space-y-1.5 text-[11px] hidden">
              <div className="text-[10px] font-mono-tech uppercase text-amber-400 font-semibold">
                6DOF Spaceship Flight Controls
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Pitch &amp; Yaw Attitude</span>
                <span>
                  <kbd className="kbd-badge">Arrow Keys</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Roll Bank Left / Right</span>
                <span>
                  <kbd className="kbd-badge">Q</kbd> / <kbd className="kbd-badge">E</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Main Thrusters / Retro</span>
                <span>
                  <kbd className="kbd-badge">W</kbd> / <kbd className="kbd-badge">S</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Afterburner / WARP DRIVE</span>
                <span>
                  <kbd className="kbd-badge">Shift</kbd> / <kbd className="kbd-badge">Space</kbd>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
              <div className="text-[10px] font-mono-tech uppercase text-fuchsia-400 font-semibold">
                Global Simulation Shortcuts
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Switch Cockpit / Orbit</span>
                <span>
                  <kbd className="kbd-badge">C</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Trigger Solar CME Flare</span>
                <span>
                  <kbd className="kbd-badge">X</kbd>
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Pause / Time Speed</span>
                <span>
                  <kbd className="kbd-badge">P</kbd> | <kbd className="kbd-badge">,</kbd>{' '}
                  <kbd className="kbd-badge">.</kbd>
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* COMPACT MINI TELEMETRY BAR (COLLAPSED BY DEFAULT, EXPANDABLE VIA 'INFO' BUTTON) */}
      <aside
        id="telemetry-panel"
        className="fixed bottom-2.5 right-2.5 left-2.5 sm:left-auto sm:w-[350px] z-20 glass-panel rounded-2xl p-2.5 sm:p-3 flex flex-col transition-all duration-500 transform translate-x-[120%] opacity-0 pointer-events-none overflow-hidden border border-slate-700/80 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2
                id="hud-name"
                className="font-display text-base sm:text-lg font-bold text-white tracking-tight truncate"
              >
                Gaia
              </h2>
              <span
                id="hud-order"
                className="text-[9px] font-mono-tech text-slate-400 uppercase"
              >
                #01 REALM
              </span>
              <span
                id="hud-classification"
                className="hidden"
              >
                Primeval Terran Realm
              </span>
            </div>
            <div
              id="hud-owner-badge"
              className="inline-block text-[8px] sm:text-[9px] font-mono-tech uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider mt-0.5"
            >
              ★ YOUR SOVEREIGN REALM (FULL CONTROL)
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setTelemetryDetailsOpen((prev) => !prev)}
              className={`glass-pill px-2 py-1 rounded-xl text-[11px] font-mono-tech flex items-center gap-1 ${
                telemetryDetailsOpen ? 'text-sky-300 border-sky-400/50' : 'text-slate-300'
              }`}
              title="Toggle Planet Telemetry Details"
            >
              <span>{telemetryDetailsOpen ? 'Hide Info' : 'Info'}</span>
            </button>
            <button
              onClick={() => actionsRef.current?.releaseFocus()}
              className="glass-pill px-2 py-1 rounded-xl text-slate-300 hover:text-white text-xs font-mono-tech"
              title="Close Panel [Esc]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Collapsible Details Section (Hidden unless user taps 'Info') */}
        <div
          className={
            telemetryDetailsOpen
              ? 'overflow-y-auto thin-scrollbar pr-1 my-2 pt-2 border-t border-slate-800 max-h-44 space-y-2 text-xs'
              : 'hidden'
          }
        >
          <p id="hud-description" className="text-slate-300 leading-relaxed text-[11px]">
            The First Cradle of Life — an ancient Earth-like world of emerald supercontinents,
            sapphire oceans, and golden auroras.
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-1.5">
              <div className="text-[8px] font-mono-tech uppercase text-slate-400">Diameter</div>
              <div id="hud-diameter" className="font-display text-[11px] font-semibold text-white">
                12,480 km
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-1.5">
              <div className="text-[8px] font-mono-tech uppercase text-slate-400">Distance</div>
              <div
                id="hud-distance"
                className="font-display text-[11px] font-semibold text-sky-300"
              >
                0.42 AU
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-1.5">
              <div className="text-[8px] font-mono-tech uppercase text-slate-400">Orbit</div>
              <div id="hud-orbit" className="font-display text-[11px] font-semibold text-white">
                112 Days
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-1.5">
              <div className="text-[8px] font-mono-tech uppercase text-slate-400">Temp</div>
              <div
                id="hud-temp"
                className="font-display text-[11px] font-semibold text-amber-300"
              >
                21°C Mean
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-1.5">
              <div className="text-[8px] font-mono-tech uppercase text-slate-400">Moons</div>
              <div id="hud-moons" className="font-display text-[11px] font-semibold text-white">
                1 (Selene-I)
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-xl p-1.5">
              <div className="text-[8px] font-mono-tech uppercase text-slate-400">Spin / Tilt</div>
              <div
                id="hud-rotation"
                className="font-display text-[11px] font-semibold text-indigo-300"
              >
                24.0h / 18.2°
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-2 flex items-center justify-between gap-2">
            <div id="hud-atmosphere" className="text-[10px] text-slate-300 truncate">
              78% Nitrogen, 21% Oxygen, 1% Argon
            </div>
            <span id="hud-gravity" className="text-[10px] font-mono-tech text-sky-400 flex-shrink-0">
              9.8 m/s²
            </span>
          </div>
        </div>

        <div className="pt-2 mt-2 border-t border-slate-700/60 flex items-center justify-between gap-1.5">
          <button
            onClick={() => actionsRef.current?.stepPlanet(-1)}
            className="glass-pill py-1.5 px-2.5 rounded-xl text-[11px] font-medium text-slate-200"
          >
            Prev
          </button>
          <button
            onClick={() => actionsRef.current?.zoomToSurface()}
            className="glass-pill py-1.5 px-2.5 rounded-xl text-[11px] font-medium text-sky-300"
          >
            Zoom
          </button>
          {isSelectedPlanetAncient && (
            <button
              onClick={() => actionsRef.current?.enterEarthAtmosphere(selectedPlanetId)}
              className={`glass-pill active flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 ${
                isSelectedPlanetOwned
                  ? 'text-emerald-300 border-emerald-400/50'
                  : 'text-amber-300 border-amber-400/50'
              }`}
            >
              <span>{isSelectedPlanetOwned ? 'Enter Your Base' : 'Spectate Realm'}</span>
            </button>
          )}
          <button
            onClick={() => actionsRef.current?.stepPlanet(1)}
            className="glass-pill py-1.5 px-2.5 rounded-xl text-[11px] font-medium text-slate-200"
          >
            Next
          </button>
        </div>
      </aside>
    </div>
  );
}
