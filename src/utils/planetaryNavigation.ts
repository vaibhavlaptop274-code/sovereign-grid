export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface SphericalBasis {
  normal: Vec3Tuple;
  east: Vec3Tuple;
  north: Vec3Tuple;
  forward: Vec3Tuple;
  right: Vec3Tuple;
}

export interface SphericalRiderState {
  lat: number; // radians, [-PI/2 + 0.15, PI/2 - 0.15]
  lon: number; // radians, [-PI, PI]
  heading: number; // radians, 0 = north, PI/2 = east
  speed: number; // linear speed along sphere surface
  gaitPhase: number; // accumulated phase for 4-beat horse leg animation
  jumpOffset: number;
  jumpVel: number;
}

export interface RiderControlInput {
  forward: number; // -1..1
  turn: number; // -1..1 (positive = turn right, negative = turn left)
  gallop: boolean;
  jump?: boolean;
}

export type PlanetBiome =
  | 'Deep Ocean'
  | 'Turquoise Shallows'
  | 'Golden Coastline'
  | 'Emerald Forest'
  | 'Alpine Highland'
  | 'Limestone Peaks';

function fract(x: number): number {
  return x - Math.floor(x);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(x: number, minVal: number, maxVal: number): number {
  return Math.max(minVal, Math.min(maxVal, x));
}

export function smoothstepJS(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic 3D hash/value noise matching the GLSL shader hash31/noise3D
 * so CPU horse grounding matches GPU vertex displacement on the sphere.
 */
export function hash31(px: number, py: number, pz: number): number {
  const d = px * 127.1 + py * 311.7 + pz * 74.7;
  return fract(Math.sin(d) * 43758.5453123);
}

export function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const n000 = hash31(ix, iy, iz);
  const n100 = hash31(ix + 1, iy, iz);
  const n010 = hash31(ix, iy + 1, iz);
  const n110 = hash31(ix + 1, iy + 1, iz);
  const n001 = hash31(ix, iy, iz + 1);
  const n101 = hash31(ix + 1, iy, iz + 1);
  const n011 = hash31(ix, iy + 1, iz + 1);
  const n111 = hash31(ix + 1, iy + 1, iz + 1);

  const nx00 = mix(n000, n100, ux);
  const nx10 = mix(n010, n110, ux);
  const nx01 = mix(n001, n101, ux);
  const nx11 = mix(n011, n111, ux);

  const nxy0 = mix(nx00, nx10, uy);
  const nxy1 = mix(nx01, nx11, uy);

  return mix(nxy0, nxy1, uz);
}

export function fbm3D(x: number, y: number, z: number): number {
  let value = 0.0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < 4; i++) {
    value += amp * noise3D(x * freq, y * freq, z * freq);
    freq *= 2.05;
    amp *= 0.5;
  }
  return value;
}

/**
 * Evaluates the continuous natural planet elevation and biome at unit normal (nx, ny, nz).
 * Returns elevation (negative = ocean depth, positive = land height above sea level)
 * and the displaced surface radius for the Horse & Rider.
 */
export function evaluateShaderMatchedElevation(
  nx: number,
  ny: number,
  nz: number,
  planetRadius = 28,
  seedOffset = 0,
): {
  elevation: number;
  displacement: number;
  surfaceRadius: number;
  moisture: number;
  biome: PlanetBiome;
  isWater: boolean;
} {
  const sx = nx + seedOffset * 1.3;
  const sy = ny + seedOffset * 0.7;
  const sz = nz - seedOffset * 1.1;

  // Macro continental shapes + domain warp for organic coastlines
  const warp = fbm3D(sx * 1.6 + 3.1, sy * 1.6 + 1.7, sz * 1.6 + 2.3) * 0.45;
  const continent = fbm3D(sx * 1.35 + warp, sy * 1.35 + warp, sz * 1.35 - warp);

  // Ridge noise for chiseled alpine limestone ranges
  const ridgeRaw =
    1.0 - Math.abs(noise3D(sx * 3.8 + 5.2, sy * 3.8 - 2.1, sz * 3.8 + 1.4) * 2.0 - 1.0);
  const ridge = ridgeRaw * ridgeRaw;

  const detail = fbm3D(sx * 6.0, sy * 6.0, sz * 6.0);
  const moisture = fbm3D(sx * 2.8 - 4.2, sy * 2.8 + 3.5, sz * 2.8 + 1.9);

  // Guarantee solid Earth with ~82% forest land mass and ~18% oceanic bays/seas
  // Gentle fertile meadow plateau around the spawn zone (lat=0.12..0.16, lon=-0.06..0.02)
  const distSpawnSq = (nx - 0.0) ** 2 + (ny - 0.14) ** 2 + (nz - 0.99) ** 2;
  const spawnMask = Math.exp(-distSpawnSq * 6.0);
  const rawContinent = mix(continent - 0.39, 0.22, spawnMask * 0.75);

  let elevation = 0;
  if (rawContinent < 0) {
    // Ocean basin
    elevation = rawContinent * 2.2;
  } else {
    // Coastal meadow + rolling hills + chiseled mountain peaks away from spawn clearing
    const hills = rawContinent * 1.65 + (detail - 0.5) * 0.18;
    const mountainMask = smoothstepJS(0.24, 0.44, rawContinent) * (1.0 - spawnMask * 0.85);
    const mountains = mountainMask * ridge * 2.1;
    elevation = hills + mountains;
  }

  const displacement = elevation > 0 ? elevation : 0;
  const surfaceRadius = planetRadius + displacement;

  let biome: PlanetBiome = 'Emerald Forest';
  if (elevation < -0.22) {
    biome = 'Deep Ocean';
  } else if (elevation < 0.0) {
    biome = 'Turquoise Shallows';
  } else if (elevation < 0.16) {
    biome = 'Golden Coastline';
  } else if (elevation < 0.95) {
    biome = 'Emerald Forest';
  } else if (elevation < 1.55) {
    biome = 'Alpine Highland';
  } else {
    biome = 'Limestone Peaks';
  }

  return {
    elevation,
    displacement,
    surfaceRadius,
    moisture,
    biome,
    isWater: elevation < 0.0,
  };
}

/**
 * Converts spherical (lat, lon) to unit normal vector on the sphere.
 * lat = 0 at equator, +PI/2 at north pole (+Y)
 * lon = 0 at +Z prime meridian, +PI/2 at +X
 */
export function latLonToNormal(lat: number, lon: number): Vec3Tuple {
  const cosLat = Math.cos(lat);
  return {
    x: cosLat * Math.sin(lon),
    y: Math.sin(lat),
    z: cosLat * Math.cos(lon),
  };
}

/**
 * Computes orthonormal basis on the sphere at (lat, lon) and tangent forward/right vectors for `heading`.
 */
export function computeSphericalBasis(lat: number, lon: number, heading: number): SphericalBasis {
  const normal = latLonToNormal(lat, lon);

  // East tangent vector: d/d(lon) normalized
  const east: Vec3Tuple = {
    x: Math.cos(lon),
    y: 0,
    z: -Math.sin(lon),
  };

  // North tangent vector: normal x east (points toward +lat)
  const north: Vec3Tuple = {
    x: -Math.sin(lat) * Math.sin(lon),
    y: Math.cos(lat),
    z: -Math.sin(lat) * Math.cos(lon),
  };

  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);

  // Forward along tangent plane: heading = 0 -> North, heading = PI/2 -> East
  const forward: Vec3Tuple = {
    x: north.x * cosH + east.x * sinH,
    y: north.y * cosH + east.y * sinH,
    z: north.z * cosH + east.z * sinH,
  };

  // Right along tangent plane: heading + PI/2
  const right: Vec3Tuple = {
    x: east.x * cosH - north.x * sinH,
    y: east.y * cosH - north.y * sinH,
    z: east.z * cosH - north.z * sinH,
  };

  return { normal, east, north, forward, right };
}

/**
 * Advances the horse & rider state across the spherical planet surface for timestep `dt`.
 */
export function stepSphericalRider(
  state: SphericalRiderState,
  input: RiderControlInput,
  dt: number,
  planetRadius = 28,
  seedOffset = 0,
): {
  nextState: SphericalRiderState;
  position: Vec3Tuple;
  basis: SphericalBasis;
  biome: PlanetBiome;
  elevation: number;
  isWater: boolean;
} {
  const clampedDt = clamp(dt, 0.001, 0.1);
  const turnSpeed = 2.15;
  const nextHeading = state.heading + input.turn * turnSpeed * clampedDt;

  const maxSpeed = input.gallop ? 11.5 : 6.8;
  const targetSpeed = input.forward * maxSpeed;
  const accel = Math.abs(targetSpeed) > Math.abs(state.speed) ? 8.5 : 10.5;
  const nextSpeed = state.speed + (targetSpeed - state.speed) * (1 - Math.exp(-accel * clampedDt));

  // Angular velocity on sphere of radius `planetRadius`
  const angularDist = (nextSpeed * clampedDt) / planetRadius;
  const dLat = Math.cos(nextHeading) * angularDist;
  const cosLatSafe = Math.max(0.2, Math.cos(state.lat));
  const dLon = (Math.sin(nextHeading) * angularDist) / cosLatSafe;

  // Keep away from singular poles
  const candidateLat = clamp(state.lat + dLat, -Math.PI * 0.44, Math.PI * 0.44);
  let candidateLon = state.lon + dLon;
  if (candidateLon > Math.PI) candidateLon -= Math.PI * 2;
  if (candidateLon < -Math.PI) candidateLon += Math.PI * 2;

  const candidateNormal = latLonToNormal(candidateLat, candidateLon);
  const surfaceEval = evaluateShaderMatchedElevation(
    candidateNormal.x,
    candidateNormal.y,
    candidateNormal.z,
    planetRadius,
    seedOffset,
  );

  // Prevent riding into deep ocean trenches (allow wading in shallow coastal water >= -0.18)
  let finalLat = candidateLat;
  let finalLon = candidateLon;
  let finalSpeed = nextSpeed;
  let finalEval = surfaceEval;

  if (surfaceEval.elevation < -0.18) {
    finalLat = state.lat;
    finalLon = state.lon;
    finalSpeed = 0;
    const stayNormal = latLonToNormal(finalLat, finalLon);
    finalEval = evaluateShaderMatchedElevation(
      stayNormal.x,
      stayNormal.y,
      stayNormal.z,
      planetRadius,
      seedOffset,
    );
  }

  // Jump physics
  let jumpVel = state.jumpVel;
  let jumpOffset = state.jumpOffset;
  if (input.jump && jumpOffset <= 0.001) {
    jumpVel = 5.2;
  }
  if (jumpOffset > 0 || jumpVel > 0) {
    jumpOffset += jumpVel * clampedDt;
    jumpVel -= 14.5 * clampedDt;
    if (jumpOffset <= 0) {
      jumpOffset = 0;
      jumpVel = 0;
    }
  }

  const gaitFreq = Math.abs(finalSpeed) > 0.15 ? 1.8 + Math.abs(finalSpeed) * 1.15 : 0;
  const nextGaitPhase = state.gaitPhase + gaitFreq * clampedDt;

  const basis = computeSphericalBasis(finalLat, finalLon, nextHeading);
  const totalRadius = finalEval.surfaceRadius + jumpOffset;

  const position: Vec3Tuple = {
    x: basis.normal.x * totalRadius,
    y: basis.normal.y * totalRadius,
    z: basis.normal.z * totalRadius,
  };

  return {
    nextState: {
      lat: finalLat,
      lon: finalLon,
      heading: nextHeading,
      speed: finalSpeed,
      gaitPhase: nextGaitPhase,
      jumpOffset,
      jumpVel,
    },
    position,
    basis,
    biome: finalEval.biome,
    elevation: finalEval.elevation,
    isWater: finalEval.isWater,
  };
}
