import * as THREE from 'three';

/* ============================================================================
 * 1. IMAGE-2 SIGNATURE TREES (i1_9536f7ba.jpg)
 *    - Tall Fluted Drooping Spruce / Fir Tree (ribbed vertical folds)
 *    - Lush Rounded Bushy Oak Tree (flared brown trunk + dense round dome crown)
 * ============================================================================ */

let cachedFlutedConeGeos: THREE.BufferGeometry[] | null = null;

function getFlutedSpruceTierGeometries(): THREE.BufferGeometry[] {
  if (cachedFlutedConeGeos) return cachedFlutedConeGeos;

  const tiers = [
    { radius: 0.78, height: 1.05, radialSegs: 24 },
    { radius: 0.64, height: 0.95, radialSegs: 24 },
    { radius: 0.48, height: 0.85, radialSegs: 20 },
    { radius: 0.32, height: 0.78, radialSegs: 18 },
  ];

  cachedFlutedConeGeos = tiers.map(({ radius, height, radialSegs }) => {
    const geo = new THREE.ConeGeometry(radius, height, radialSegs, 5, false);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Normalized height from top (+height/2) to bottom (-height/2)
      const tFromTop = (height / 2 - v.y) / height;
      if (tFromTop > 0.06) {
        const angle = Math.atan2(v.z, v.x);
        // Create deep vertical fluted ribs & drooping bough skirts like Image 2 (i1_9536f7ba.jpg)
        const flute = Math.cos(angle * (radialSegs / 2));
        const rScale = 1.0 + flute * 0.22 * tFromTop + Math.pow(tFromTop, 1.7) * 0.14;
        v.x *= rScale;
        v.z *= rScale;
        // Droop the outer tips slightly downward
        v.y -= (flute * 0.5 + 0.5) * 0.11 * Math.pow(tFromTop, 1.4);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
    }
    geo.computeVertexNormals();
    return geo;
  });

  return cachedFlutedConeGeos;
}

const spruceDarkMat = new THREE.MeshStandardMaterial({
  color: 0x2f5e16,
  roughness: 0.76,
  flatShading: true,
});
const spruceSunMat = new THREE.MeshStandardMaterial({
  color: 0x4f8a1f,
  roughness: 0.72,
  flatShading: true,
});
const spruceTipMat = new THREE.MeshStandardMaterial({
  color: 0x67a826,
  roughness: 0.68,
  flatShading: true,
});
const trunkRichBrownMat = new THREE.MeshStandardMaterial({
  color: 0x6b3614,
  roughness: 0.88,
});

/**
 * Builds the iconic tall fluted drooping Spruce/Fir tree from Image 2 (i1_9536f7ba.jpg)
 */
export function createFlutedSpruceTree(scale = 1): THREE.Group {
  const group = new THREE.Group();
  const tierGeos = getFlutedSpruceTierGeometries();

  // Flared dark-brown base trunk & roots
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.22 * scale, 0.95 * scale, 9),
    trunkRichBrownMat,
  );
  trunk.position.y = 0.42 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const tierHeights = [0.76, 1.24, 1.68, 2.08];
  tierGeos.forEach((geo, idx) => {
    const mat = idx === 0 ? spruceDarkMat : idx < 3 ? spruceSunMat : spruceTipMat;
    const tierMesh = new THREE.Mesh(geo, mat);
    tierMesh.scale.setScalar(scale);
    tierMesh.position.y = tierHeights[idx] * scale;
    tierMesh.rotation.y = idx * 0.55;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    group.add(tierMesh);
  });

  return group;
}

const oakShadowLeafMat = new THREE.MeshStandardMaterial({
  color: 0x3b6910,
  roughness: 0.78,
});
const oakMidLeafMat = new THREE.MeshStandardMaterial({
  color: 0x579116,
  roughness: 0.74,
});
const oakSunLeafMat = new THREE.MeshStandardMaterial({
  color: 0x76b81e,
  roughness: 0.68,
});

/**
 * Builds the lush rounded bushy Oak tree in the center of Image 2 (i1_9536f7ba.jpg)
 */
export function createBushyRoundOakTree(scale = 1): THREE.Group {
  const group = new THREE.Group();

  // Thick flared reddish-brown trunk with root buttresses
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * scale, 0.28 * scale, 0.82 * scale, 10),
    trunkRichBrownMat,
  );
  trunk.position.y = 0.38 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  for (let r = 0; r < 4; r++) {
    const ang = (r / 4) * Math.PI * 2 + 0.4;
    const rootSpur = new THREE.Mesh(
      new THREE.ConeGeometry(0.09 * scale, 0.36 * scale, 6),
      trunkRichBrownMat,
    );
    rootSpur.position.set(Math.cos(ang) * 0.16 * scale, 0.14 * scale, Math.sin(ang) * 0.16 * scale);
    rootSpur.rotation.z = -Math.cos(ang) * 0.52;
    rootSpur.rotation.x = Math.sin(ang) * 0.52;
    group.add(rootSpur);
  }

  // Core rounded dome + 22 stippled outer leafy puffs for the exact Image-2 bushy round crown
  const crownGroup = new THREE.Group();
  crownGroup.position.y = 1.24 * scale;
  group.add(crownGroup);

  const coreDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.68 * scale, 16, 14),
    oakMidLeafMat,
  );
  coreDome.scale.set(1.04, 1.12, 1.04);
  coreDome.castShadow = true;
  coreDome.receiveShadow = true;
  crownGroup.add(coreDome);

  // Golden-ratio spiral distribution of leafy puffs around the dome
  const puffCount = 22;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < puffCount; i++) {
    const y = 1 - (i / (puffCount - 1)) * 1.55; // +1 at top down to -0.55 at skirt
    const r = Math.sqrt(Math.max(0.05, 1 - y * y * 0.65));
    const theta = goldenAngle * i;
    const px = Math.cos(theta) * r * 0.54 * scale;
    const py = y * 0.56 * scale;
    const pz = Math.sin(theta) * r * 0.54 * scale;

    const isSunSide = px + py * 0.8 > 0.08 * scale;
    const isShadowSide = px + py * 0.5 < -0.15 * scale;
    const mat = isSunSide ? oakSunLeafMat : isShadowSide ? oakShadowLeafMat : oakMidLeafMat;

    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry((0.26 + (i % 3) * 0.035) * scale, 1),
      mat,
    );
    puff.position.set(px, py, pz);
    puff.castShadow = true;
    puff.receiveShadow = true;
    crownGroup.add(puff);
  }

  return group;
}

/* ============================================================================
 * 2. WHOLE-PLANET LAND & CHISELED LIMESTONE MOUNTAIN EVALUATOR (82% LAND!)
 * ============================================================================ */

export function evaluateGlobalPlanetSurface(
  nx: number,
  ny: number,
  nz: number,
  planetSeed: number,
): {
  displacement: number;
  color: [number, number, number];
  isLand: boolean;
  isMountain: boolean;
} {
  // Multi-octave spherical continent noise biased strongly toward LAND (~82% of the globe is lush land!)
  const c1 =
    Math.sin(nx * 2.8 + planetSeed) * Math.cos(ny * 2.6 - 0.5) +
    Math.cos(nz * 2.9 + planetSeed * 0.8) * 0.75;
  const c2 = Math.sin((nx + nz) * 5.2 - ny * 4.4) * 0.42;
  const continentVal = c1 + c2 + 0.58; // Positive on ~82% of the sphere

  if (continentVal < -0.22) {
    // Scenic Sapphire Sea / Lake Basin (~18% of globe)
    const depth = Math.min(1, (-0.22 - continentVal) / 0.9);
    return {
      displacement: -0.35 - depth * 0.85,
      color: [
        THREE.MathUtils.lerp(0.14, 0.03, depth),
        THREE.MathUtils.lerp(0.54, 0.22, depth),
        THREE.MathUtils.lerp(0.68, 0.45, depth),
      ],
      isLand: false,
      isMountain: false,
    };
  }

  if (continentVal < -0.04) {
    // Warm Golden Sandy Shoreline
    return {
      displacement: 0.08,
      color: [0.82, 0.68, 0.42],
      isLand: true,
      isMountain: false,
    };
  }

  // Sharp Chiseled Grey-White Limestone Mountain Ranges (like Image 2 i1_9536f7ba.jpg)
  const ridgeWave =
    1.0 - Math.abs(Math.sin(nx * 7.5 + ny * 6.2 - nz * 5.8 + planetSeed));
  const mountainMask = Math.max(0, continentVal - 0.65) * Math.pow(ridgeWave, 2.2);

  if (mountainMask > 0.28) {
    const mHeight = (mountainMask - 0.28) * 4.2;
    const facetShade = Math.sin(nx * 28 + nz * 24) * 0.06;
    return {
      displacement: 0.65 + mHeight,
      color: [
        0.76 + facetShade,
        0.79 + facetShade,
        0.84 + facetShade,
      ],
      isLand: true,
      isMountain: true,
    };
  }

  // Lush Sunlit Green Rolling Meadows & Forests (like Image 2 i1_9536f7ba.jpg)
  const meadowPatch = Math.sin(nx * 14 + nz * 14) * Math.cos(ny * 14) * 0.5 + 0.5;
  return {
    displacement: 0.22 + continentVal * 0.35,
    color: [
      THREE.MathUtils.lerp(0.24, 0.42, meadowPatch),
      THREE.MathUtils.lerp(0.52, 0.69, meadowPatch),
      THREE.MathUtils.lerp(0.1, 0.16, meadowPatch),
    ],
    isLand: true,
    isMountain: false,
  };
}

/* ============================================================================
 * 3. CLASH-OF-CLANS SQUARE BASE CLEARING SCENE BUILDER
 *    (Recreates Images 1 & 3: asdf_c05a868d.jpg and i2_af13d6e9.jpg)
 *    - 44x44 Checkerboard Green Lawn Square
 *    - Dense Surrounding Bushy Green Forest on 3 Sides
 *    - Top-Left Dirt Forest Path + Wooden Fence + Waiting Warhorse
 *    - Top-Right Rocky Cliff + Cascading Blue Waterfall
 *    - Bottom-Left Sandy Beach + Coastal Boulders + Turquoise Sea
 *    - Walled Base Compartments, Central Citadel, Elixir Orbs & Campfires
 * ============================================================================ */

let cachedBaseGroundTex: THREE.CanvasTexture | null = null;

function getSquareBaseGroundTexture(): THREE.CanvasTexture {
  if (cachedBaseGroundTex) return cachedBaseGroundTex;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Forest Floor Outer Background
  ctx.fillStyle = '#3b690e';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Darker Mown Grass Frame around the Checkerboard Clearing (212..812)
  ctx.fillStyle = '#5fa315';
  ctx.fillRect(204, 204, 616, 616);

  // 3. Crisp 40x40 Alternating Light/Medium Lime-Green Checkerboard Lawn (244..780)
  const gridStart = 244;
  const gridSize = 536;
  const cells = 40;
  const cellPx = gridSize / cells;

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#8be028' : '#7dd11f';
      ctx.fillRect(
        gridStart + c * cellPx,
        gridStart + r * cellPx,
        Math.ceil(cellPx),
        Math.ceil(cellPx),
      );
    }
  }

  // 4. Top-Left Winding Dirt Forest Trail (x: 0..215, y: 400..540) matching i2_af13d6e9.jpg
  ctx.fillStyle = '#68a818';
  ctx.beginPath();
  ctx.ellipse(155, 470, 68, 82, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#d49b4b';
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.quadraticCurveTo(95, 495, 204, 465);
  ctx.stroke();

  // 5. Bottom / South-West Sandy Beach & Turquoise Sea (y: 805..1024) matching asdf_c05a868d.jpg
  const sandGrad = ctx.createLinearGradient(0, 795, 0, 915);
  sandGrad.addColorStop(0.0, '#62a316');
  sandGrad.addColorStop(0.18, '#c6924b');
  sandGrad.addColorStop(0.75, '#d8a55c');
  sandGrad.addColorStop(1.0, '#e8f4f8'); // White surf foam line
  ctx.fillStyle = sandGrad;
  ctx.fillRect(0, 800, 1024, 115);

  const seaGrad = ctx.createLinearGradient(0, 905, 0, 1024);
  seaGrad.addColorStop(0.0, '#38bdf8');
  seaGrad.addColorStop(0.28, '#0284c7');
  seaGrad.addColorStop(1.0, '#075985');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, 908, 1024, 116);

  // Subtle wave lines parallel to the beach
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  [922, 948, 978].forEach((wy) => {
    ctx.beginPath();
    ctx.moveTo(0, wy);
    ctx.lineTo(1024, wy);
    ctx.stroke();
  });

  cachedBaseGroundTex = new THREE.CanvasTexture(canvas);
  cachedBaseGroundTex.colorSpace = THREE.SRGBColorSpace;
  cachedBaseGroundTex.anisotropy = 4;
  return cachedBaseGroundTex;
}

export interface LandmarkSquareBaseSceneResult {
  group: THREE.Group;
  clickableMeshes: THREE.Object3D[];
  animatedWaterfallFoam: THREE.Mesh[];
  animatedCampfires: THREE.Mesh[];
  exitGatePosition: THREE.Vector3;
}

export function buildLandmarkSquareBaseScene(
  landmarkId: string,
  landmarkName: string,
): LandmarkSquareBaseSceneResult {
  const group = new THREE.Group();
  const clickableMeshes: THREE.Object3D[] = [];
  const animatedWaterfallFoam: THREE.Mesh[] = [];
  const animatedCampfires: THREE.Mesh[] = [];

  // 1. Flat Checkerboard Base Clearing Ground Plane (72 x 72 units)
  const groundTex = getSquareBaseGroundTexture();
  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(72, 72, 1, 1),
    new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.receiveShadow = true;
  group.add(groundPlane);

  // 2. Dense Surrounding Forest Canopy on 3 Sides (NW, NE, SE) — exactly like i2_af13d6e9.jpg & asdf_c05a868d.jpg
  const crownGeo = new THREE.IcosahedronGeometry(1.15, 2);
  const forestMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.76,
  });
  const maxTrees = 480;
  const canopyInstanced = new THREE.InstancedMesh(crownGeo, forestMat, maxTrees);
  canopyInstanced.castShadow = true;
  canopyInstanced.receiveShadow = true;

  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.2, 7);
  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkRichBrownMat, maxTrees);

  const dummy = new THREE.Object3D();
  const cCol = new THREE.Color();
  let tIdx = 0;
  let seed = 9001;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let gx = -34; gx <= 34; gx += 1.95) {
    for (let gz = -34; gz <= 19.5; gz += 1.95) {
      if (tIdx >= maxTrees) break;
      // Keep the central 42x42 square clearing open
      if (gx > -21.2 && gx < 21.2 && gz > -21.2 && gz < 20.5) continue;
      // Keep the Top-Left Dirt Forest Trail & Gate open (x < -18, z between -4.8 and +1.8)
      if (gx < -17.5 && gz > -5.2 && gz < 2.2) continue;
      // Keep the Top-Right Waterfall Cliff corner clear of trees (gx > 19, gz < -15)
      if (gx > 20 && gz < -15) continue;

      const jx = gx + (rand() - 0.5) * 1.1;
      const jz = gz + (rand() - 0.5) * 1.1;
      const s = 0.85 + rand() * 0.65;

      dummy.position.set(jx, 0.55 * s, jz);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.updateMatrix();
      trunkInstanced.setMatrixAt(tIdx, dummy.matrix);

      dummy.position.set(jx, 1.45 * s, jz);
      dummy.scale.set(s * 1.18, s * 0.96, s * 1.18);
      dummy.updateMatrix();
      canopyInstanced.setMatrixAt(tIdx, dummy.matrix);

      // Rich Clash-of-Clans leafy lime/emerald variation
      cCol.setHSL(0.25 + (rand() - 0.5) * 0.04, 0.72, 0.34 + rand() * 0.16);
      canopyInstanced.setColorAt(tIdx, cCol);
      tIdx++;
    }
  }
  trunkInstanced.count = tIdx;
  canopyInstanced.count = tIdx;
  trunkInstanced.instanceMatrix.needsUpdate = true;
  canopyInstanced.instanceMatrix.needsUpdate = true;
  if (canopyInstanced.instanceColor) canopyInstanced.instanceColor.needsUpdate = true;
  group.add(trunkInstanced);
  group.add(canopyInstanced);

  // 3. Top-Left Dirt Trail Wooden Fence & Exit Gate (matching i2_af13d6e9.jpg left path)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.85 });
  for (let f = 0; f < 6; f++) {
    const fx = -21.5 - f * 1.4;
    const fz = -5.1;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.18), fenceMat);
    post.position.set(fx, 0.42, fz);
    post.castShadow = true;
    group.add(post);

    if (f < 5) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.08), fenceMat);
      rail.position.set(fx - 0.7, 0.62, fz);
      group.add(rail);
    }
  }
  const exitGatePosition = new THREE.Vector3(-20.2, 0, -1.6);

  // 4. Top-Right Rocky Cliff & Cascading Blue Waterfall (matching i2_af13d6e9.jpg top-right)
  const cliffGroup = new THREE.Group();
  cliffGroup.position.set(24.5, 0, -21.5);
  const cliffRockMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.88,
    flatShading: true,
  });
  for (let c = 0; c < 9; c++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.6 + (c % 3) * 0.9, 1),
      cliffRockMat,
    );
    rock.position.set((c % 3) * 2.4 - 2.4, 1.8 + Math.floor(c / 3) * 2.1, (c % 2) * 1.5);
    rock.scale.set(1.2, 1.35, 1.1);
    rock.castShadow = true;
    cliffGroup.add(rock);
  }
  const waterCascadeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  for (let tier = 0; tier < 3; tier++) {
    const stream = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.3, 0.45), waterCascadeMat);
    stream.position.set(-0.6, 5.2 - tier * 1.9, 1.2 + tier * 0.85);
    stream.rotation.x = 0.32;
    cliffGroup.add(stream);

    const splash = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 8), foamMat);
    splash.scale.set(1.6, 0.45, 1.1);
    splash.position.set(-0.6, 4.2 - tier * 1.9, 1.65 + tier * 0.85);
    cliffGroup.add(splash);
    animatedWaterfallFoam.push(splash);
  }
  group.add(cliffGroup);

  // 5. Bottom-Left Coastal Boulders along the Sandy Shoreline (matching asdf_c05a868d.jpg)
  const shoreRockMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.82,
    flatShading: true,
  });
  const boulderCoords = [
    [-26, 21.8, 1.1],
    [-23.5, 22.6, 0.85],
    [-18.2, 22.2, 1.25],
    [-16.4, 23.1, 0.75],
    [-10.5, 22.4, 1.15],
    [-4.2, 22.8, 0.95],
    [3.5, 22.2, 1.2],
    [5.2, 23.0, 0.78],
    [12.8, 22.5, 1.1],
    [18.5, 22.1, 1.3],
  ];
  boulderCoords.forEach(([bx, bz, bs]) => {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95 * bs, 1), shoreRockMat);
    b.scale.set(1.3, 0.68, 1.1);
    b.position.set(bx, 0.25 * bs, bz);
    b.castShadow = true;
    b.receiveShadow = true;
    group.add(b);
  });

  // 6. Walled Clash-of-Clans Base Layout Inside the Square Clearing (matching asdf_c05a868d.jpg)
  const wallBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.45,
  });
  const wallLavaGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    roughness: 0.3,
    metalness: 0.6,
  });

  // Build Fortified Golden-Lava Wall Segments (Outer Perimeter + Inner Cross Compartments)
  const wallPostGeo = new THREE.BoxGeometry(0.76, 0.88, 0.76);
  const wallGlowGeo = new THREE.BoxGeometry(0.8, 0.28, 0.8);
  const wallPositions: [number, number][] = [];

  for (let i = -11; i <= 11; i++) {
    // Outer square perimeter (with gate openings at +-1, 0)
    if (Math.abs(i) > 1) {
      wallPositions.push([i, -11], [i, 11], [-11, i], [11, i]);
    }
    // Inner cross-compartment walls
    if (Math.abs(i) > 2 && Math.abs(i) < 11) {
      wallPositions.push([i, -4], [i, 4], [-4, i], [4, i]);
    }
  }

  const wallBaseInst = new THREE.InstancedMesh(wallPostGeo, wallBaseMat, wallPositions.length);
  const wallGlowInst = new THREE.InstancedMesh(wallGlowGeo, wallLavaGoldMat, wallPositions.length);
  wallBaseInst.castShadow = true;
  wallBaseInst.receiveShadow = true;

  wallPositions.forEach(([wx, wz], idx) => {
    dummy.position.set(wx, 0.44, wz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    wallBaseInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(wx, 0.72, wz);
    dummy.updateMatrix();
    wallGlowInst.setMatrixAt(idx, dummy.matrix);
  });
  wallBaseInst.instanceMatrix.needsUpdate = true;
  wallGlowInst.instanceMatrix.needsUpdate = true;
  group.add(wallBaseInst);
  group.add(wallGlowInst);

  // Helper to register clickable base structures
  const addStructure = (
    meshGroup: THREE.Group,
    id: string,
    name: string,
    description: string,
    gx: number,
    gz: number,
  ) => {
    meshGroup.position.set(gx, 0, gz);
    const entityData = {
      id,
      name,
      category: 'building' as const,
      level: 10,
      gridX: gx,
      gridZ: gz,
      size: 3,
      description,
    };
    meshGroup.userData = { entity: entityData };
    meshGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData = { entity: entityData };
        clickableMeshes.push(child);
      }
    });
    group.add(meshGroup);
  };

  // A. Central Sovereign Citadel / Town Hall at (0, 0) customized for the entered Landmark
  const centerHub = new THREE.Group();
  const keepMat = new THREE.MeshStandardMaterial({
    color:
      landmarkId === 'library'
        ? 0xe2e8f0
        : landmarkId === 'vault'
          ? 0xfacc15
          : landmarkId === 'crucible'
            ? 0x4c1d95
            : 0x7f1d1d,
    roughness: 0.45,
    metalness: landmarkId === 'vault' ? 0.8 : 0.25,
  });
  const keepBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 3.4), keepMat);
  keepBody.position.y = 1.4;
  keepBody.castShadow = true;
  centerHub.add(keepBody);

  const keepRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 1.6, 4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }),
  );
  keepRoof.position.y = 3.6;
  keepRoof.rotation.y = Math.PI / 4;
  keepRoof.castShadow = true;
  centerHub.add(keepRoof);

  const lavaCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 1),
    new THREE.MeshBasicMaterial({ color: 0xf97316 }),
  );
  lavaCore.position.y = 4.8;
  centerHub.add(lavaCore);

  addStructure(
    centerHub,
    landmarkId,
    `${landmarkName} — Central Keep`,
    `Heart of ${landmarkName}. Click to inspect or manage this Sovereign sector.`,
    0,
    0,
  );

  // B. 4 Glowing Pink/Magenta Elixir / Arka Storage Spheres (matching asdf_c05a868d.jpg!)
  const elixirCoords: [number, number][] = [
    [0, -7.5],
    [0, 7.5],
    [-7.5, 0],
    [7.5, 0],
  ];
  const elixirGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe879f9,
    emissive: 0xc026d3,
    emissiveIntensity: 0.75,
    roughness: 0.1,
    clearcoat: 1.0,
  });
  elixirCoords.forEach(([ex, ez], idx) => {
    const vat = new THREE.Group();
    const tray = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.4, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 }),
    );
    tray.position.y = 0.22;
    vat.add(tray);

    const orb = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 16), elixirGlassMat);
    orb.position.y = 1.25;
    orb.castShadow = true;
    vat.add(orb);

    addStructure(
      vat,
      `arka_vat_${idx}`,
      `Arka & XP Reservoir #${idx + 1}`,
      'High-capacity Arka energy sphere powering your Sovereign rank.',
      ex,
      ez,
    );
  });

  // C. 4 Golden Treasury Storage Vaults in the Diagonal Compartments (matching asdf_c05a868d.jpg!)
  const goldCoords: [number, number][] = [
    [-7.5, -7.5],
    [7.5, -7.5],
    [-7.5, 7.5],
    [7.5, 7.5],
  ];
  const goldBullionMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.88,
    roughness: 0.2,
  });
  goldCoords.forEach(([gx, gz], idx) => {
    const treasury = new THREE.Group();
    const crib = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }),
    );
    crib.position.y = 0.55;
    crib.castShadow = true;
    treasury.add(crib);

    const goldMound = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), goldBullionMat);
    goldMound.scale.set(1.2, 0.85, 1.2);
    goldMound.position.y = 1.25;
    goldMound.castShadow = true;
    treasury.add(goldMound);

    addStructure(
      treasury,
      `gold_vault_${idx}`,
      `Kubera Gold Treasury #${idx + 1}`,
      'Stores planetary CE & gold reserves.',
      gx,
      gz,
    );
  });

  // D. 4 Flickering Army Campfire Pits outside the walls (matching asdf_c05a868d.jpg!)
  const campCoords: [number, number][] = [
    [-14.5, -6.5],
    [14.5, -6.5],
    [-6.5, 14.5],
    [6.5, 14.5],
  ];
  campCoords.forEach(([cx, cz], idx) => {
    const camp = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.22, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.18;
    camp.add(ring);

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.68, 1.45, 8),
      new THREE.MeshBasicMaterial({ color: 0xf97316 }),
    );
    flame.position.y = 0.75;
    camp.add(flame);
    animatedCampfires.push(flame);

    addStructure(
      camp,
      `army_campfire_${idx}`,
      `Vanguard Muster Camp #${idx + 1}`,
      'Daily target & focus muster ground.',
      cx,
      cz,
    );
  });

  // E. 8 Perimeter Watchtowers & Collectors around the outer lawn (matching asdf_c05a868d.jpg!)
  const towerCoords: [number, number][] = [
    [-14.5, 0],
    [14.5, 0],
    [0, -14.5],
    [0, 14.5],
    [-14.5, -13.5],
    [14.5, -13.5],
    [-14.5, 13.5],
    [14.5, 13.5],
  ];
  towerCoords.forEach(([tx, tz], idx) => {
    const tower = new THREE.Group();
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.95, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 }),
    );
    pillar.position.y = 1.3;
    pillar.castShadow = true;
    tower.add(pillar);

    const turretTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.85, 0.65, 8),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 }),
    );
    turretTop.position.y = 2.8;
    tower.add(turretTop);

    addStructure(
      tower,
      `sentinel_tower_${idx}`,
      `Sentinel Watchtower #${idx + 1}`,
      'Guards the perimeter against distraction & entropy.',
      tx,
      tz,
    );
  });

  return {
    group,
    clickableMeshes,
    animatedWaterfallFoam,
    animatedCampfires,
    exitGatePosition,
  };
}
