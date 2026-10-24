import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
    name: 'The Sun',
    order: 'STAR // 00',
    classification: 'G2V Yellow Dwarf Star',
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
    moonsText: '8 Planets + Magnetic Loops',
    rotationText: '25.4 Days / 7.25°',
    gravity: 'Gravity: 274 m/s²',
    atmosphere: '73% Hydrogen, 25% Helium, active magnetic plasma arches & CME shockwaves',
    description:
      'The gravitational and radiative heart of our Solar System. Driven by core thermonuclear fusion, twisted magnetic flux ropes erupt from sunspot regions as towering solar prominences and X-Class Coronal Mass Ejections (press [X] to trigger).',
  },
  {
    id: 'mercury',
    keybind: '1',
    name: 'Mercury',
    order: 'PLANET // 01',
    classification: 'Terrestrial World',
    radius: 1.35,
    distance: 28,
    orbitalSpeed: 1.607,
    rotationSpeed: 0.002,
    tilt: 0.03,
    eccentricity: 0.06,
    color: '#94a3b8',
    badgeBg: 'radial-gradient(circle at 30% 30%, #cbd5e1, #64748b, #334155)',
    diameter: '4,879 km',
    distanceText: '0.39 AU (57.9M km)',
    orbitText: '88 Earth Days',
    tempText: '-180°C to 430°C',
    moonsText: '0 Moons',
    rotationText: '58.6 Days / 0.03°',
    gravity: 'Gravity: 3.7 m/s²',
    atmosphere: 'Ultra-thin exosphere: Oxygen, Sodium, Hydrogen, Helium',
    description:
      'The innermost and smallest planet in the Solar System. Heavily cratered by ancient impacts including the Caloris Basin, Mercury endures intense solar wind bombardment and extreme day-night thermal swings.',
  },
  {
    id: 'venus',
    keybind: '2',
    name: 'Venus',
    order: 'PLANET // 02',
    classification: 'Terrestrial World',
    radius: 2.35,
    distance: 40,
    orbitalSpeed: 1.174,
    rotationSpeed: -0.0015,
    tilt: 177.3,
    eccentricity: 0.01,
    color: '#fbbf24',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fde68a, #d97706, #78350f)',
    diameter: '12,104 km',
    distanceText: '0.72 AU (108.2M km)',
    orbitText: '224.7 Earth Days',
    tempText: '465°C (Runaway Greenhouse)',
    moonsText: '0 Moons',
    rotationText: '-243 Days (Retrograde)',
    gravity: 'Gravity: 8.87 m/s²',
    atmosphere: '96.5% CO₂, 3.5% N₂, super-rotating Sulfuric Acid cloud decks',
    description:
      'Cloaked in dense golden sulfuric acid clouds that reflect 75% of sunlight, Venus traps heat in a runaway greenhouse effect that makes its volcanic plains hotter than Mercury.',
  },
  {
    id: 'earth',
    keybind: '3',
    name: 'Earth',
    order: 'PLANET // 03',
    classification: 'Oceanic Terrestrial World',
    radius: 2.55,
    distance: 56,
    orbitalSpeed: 1.0,
    rotationSpeed: 0.012,
    tilt: 23.44,
    eccentricity: 0.016,
    color: '#38bdf8',
    badgeBg: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7, #1e3a8a)',
    diameter: '12,742 km',
    distanceText: '1.00 AU (149.6M km)',
    orbitText: '365.25 Days',
    tempText: '-89°C to 57°C (Mean 15°C)',
    moonsText: '1 (Luna)',
    rotationText: '23h 56m / 23.4°',
    gravity: 'Gravity: 9.81 m/s²',
    atmosphere: '78% Nitrogen, 21% Oxygen, 0.9% Argon, dynamic H₂O weather clouds',
    description:
      'Our home oasis in the cosmos. Features specular liquid water oceans, tectonic continents, polar ice caps, a Rayleigh-scattering blue atmosphere rim, and our large stabilizing Moon.',
  },
  {
    id: 'mars',
    keybind: '4',
    name: 'Mars',
    order: 'PLANET // 04',
    classification: 'Terrestrial World',
    radius: 1.75,
    distance: 73,
    orbitalSpeed: 0.802,
    rotationSpeed: 0.0115,
    tilt: 25.19,
    eccentricity: 0.05,
    color: '#f97316',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c, #7c2d12)',
    diameter: '6,779 km',
    distanceText: '1.52 AU (227.9M km)',
    orbitText: '687 Earth Days',
    tempText: '-125°C to 20°C',
    moonsText: '2 (Phobos & Deimos)',
    rotationText: '24h 37m / 25.2°',
    gravity: 'Gravity: 3.72 m/s²',
    atmosphere: '95% CO₂, 2.6% N₂, 1.9% Argon, suspended iron-oxide dust haze',
    description:
      'The Red Planet owes its rusty ochre hue to iron oxide dust blanketing basaltic plains, towering shield volcanoes like Olympus Mons, the Valles Marineris canyon system, and polar CO₂ ice caps.',
  },
  {
    id: 'jupiter',
    keybind: '5',
    name: 'Jupiter',
    order: 'PLANET // 05',
    classification: 'Gas Giant',
    radius: 6.8,
    distance: 118,
    orbitalSpeed: 0.434,
    rotationSpeed: 0.026,
    tilt: 3.13,
    eccentricity: 0.03,
    color: '#fb923c',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fed7aa, #c2410c, #431407)',
    diameter: '139,820 km',
    distanceText: '5.20 AU (778.5M km)',
    orbitText: '11.86 Earth Years',
    tempText: '-110°C (Cloud Tops)',
    moonsText: '95 (Io, Europa, Ganymede, Callisto)',
    rotationText: '9h 55m / 3.1°',
    gravity: 'Gravity: 24.79 m/s²',
    atmosphere: '90% Hydrogen, 10% Helium, Ammonia zonal jet streams & Great Red Spot',
    description:
      'The colossus of the Solar System. Its rapid 10-hour spin drives counter-flowing ammonia cloud belts, vortex eddies, the Great Red Spot anticyclone, and the four Galilean moons.',
  },
  {
    id: 'saturn',
    keybind: '6',
    name: 'Saturn',
    order: 'PLANET // 06',
    classification: 'Ringed Gas Giant',
    radius: 5.6,
    distance: 162,
    orbitalSpeed: 0.323,
    rotationSpeed: 0.024,
    tilt: 26.73,
    eccentricity: 0.04,
    color: '#fde047',
    badgeBg: 'radial-gradient(circle at 30% 30%, #fef9c3, #ca8a04, #713f12)',
    diameter: '116,460 km',
    distanceText: '9.58 AU (1.43B km)',
    orbitText: '29.45 Earth Years',
    tempText: '-140°C (Cloud Tops)',
    moonsText: '146 (Titan, Enceladus, Rhea)',
    rotationText: '10h 33m / 26.7°',
    gravity: 'Gravity: 10.44 m/s²',
    atmosphere: '96% Hydrogen, 3% Helium, golden Ammonia haze & icy Ring System',
    description:
      'Crowned by an expansive ring system spanning 282,000 km across, composed of pure water-ice particles sculpted into the A, B, and C rings divided by the Cassini Division and Encke Gap.',
  },
  {
    id: 'uranus',
    keybind: '7',
    name: 'Uranus',
    order: 'PLANET // 07',
    classification: 'Ice Giant',
    radius: 3.9,
    distance: 204,
    orbitalSpeed: 0.228,
    rotationSpeed: -0.016,
    tilt: 97.77,
    eccentricity: 0.03,
    color: '#67e8f9',
    badgeBg: 'radial-gradient(circle at 30% 30%, #cffafe, #06b6d4, #164e63)',
    diameter: '50,724 km',
    distanceText: '19.2 AU (2.87B km)',
    orbitText: '84 Earth Years',
    tempText: '-195°C (Coldest Atmosphere)',
    moonsText: '28 (Miranda, Ariel, Titania)',
    rotationText: '-17h 14m / 97.8° (Sideways)',
    gravity: 'Gravity: 8.69 m/s²',
    atmosphere: '83% Hydrogen, 15% Helium, 2.3% Methane ice haze',
    description:
      'An ice giant knocked onto its side with a 97.8-degree axial tilt, causing its polar rings and moons to orbit perpendicular to the ecliptic plane.',
  },
  {
    id: 'neptune',
    keybind: '8',
    name: 'Neptune',
    order: 'PLANET // 08',
    classification: 'Ice Giant',
    radius: 3.8,
    distance: 242,
    orbitalSpeed: 0.182,
    rotationSpeed: 0.018,
    tilt: 28.32,
    eccentricity: 0.01,
    color: '#3b82f6',
    badgeBg: 'radial-gradient(circle at 30% 30%, #93c5fd, #2563eb, #1e1b4b)',
    diameter: '49,244 km',
    distanceText: '30.1 AU (4.50B km)',
    orbitText: '164.8 Earth Years',
    tempText: '-200°C (Cloud Tops)',
    moonsText: '16 (Triton, Proteus)',
    rotationText: '16h 06m / 28.3°',
    gravity: 'Gravity: 11.15 m/s²',
    atmosphere: '80% Hydrogen, 19% Helium, 1.5% Methane with supersonic cirrus streaks',
    description:
      'The outermost major planet in the Solar System. Internal heat powers 2,100 km/h supersonic winds, carving bright white methane cirrus streaks and dark anticyclonic storms.',
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

function generatePlanetTextures(planetId: string) {
  const width = 1024,
    height = 512;
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

  let specCanvas: HTMLCanvasElement | null = null;
  let specCtx: CanvasRenderingContext2D | null = null;
  let specData: ImageData | null = null;
  if (planetId === 'earth') {
    specCanvas = document.createElement('canvas');
    specCanvas.width = width;
    specCanvas.height = height;
    specCtx = specCanvas.getContext('2d')!;
    specData = specCtx.createImageData(width, height);
  }

  const craters: { x: number; y: number; z: number; r: number; depth: number }[] = [];
  if (planetId === 'mercury' || planetId === 'mars' || planetId === 'moon') {
    const count = planetId === 'mercury' ? 140 : planetId === 'moon' ? 110 : 75;
    let s = planetId === 'mercury' ? 91 : 213;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
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

      if (planetId === 'mercury' || planetId === 'moon') {
        const n1 = noiseGen.sphereFBM(u, v, 3.2, 5, 0.55);
        const n2 = noiseGen.sphereFBM(u + 0.3, v, 12.0, 4, 0.5);
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
        const darkBasalt = planetId === 'mercury' ? [74, 70, 68] : [90, 92, 98];
        const midRegolith = planetId === 'mercury' ? [138, 132, 126] : [155, 158, 162];
        const brightHighland = planetId === 'mercury' ? [196, 189, 182] : [215, 218, 222];
        rgb =
          h < 0.48
            ? mixColor(darkBasalt, midRegolith, h / 0.48)
            : mixColor(midRegolith, brightHighland, (h - 0.48) / 0.52);
        bumpVal = clamp(h * 255, 0, 255);
      } else if (planetId === 'venus') {
        const warp = noiseGen.sphereFBM(u, v, 2.5, 4, 0.5) * 0.12;
        const bandPattern = Math.sin((v + warp) * Math.PI * 10);
        const swirl = noiseGen.sphereFBM(u * 1.8 + warp, v * 3.5, 4.0, 5, 0.55);
        const t = clamp(swirl * 0.72 + (bandPattern * 0.5 + 0.5) * 0.28, 0, 1);
        rgb =
          t < 0.5
            ? mixColor([168, 102, 36], [226, 174, 92], t * 2)
            : mixColor([226, 174, 92], [249, 226, 168], (t - 0.5) * 2);
        bumpVal = clamp(t * 180 + 40, 0, 255);
      } else if (planetId === 'earth' && specData) {
        const warpU = noiseGen.sphereFBM(u + 1.7, v + 0.4, 2.2, 3, 0.5) * 0.08;
        const warpV = noiseGen.sphereFBM(u + 4.1, v + 2.3, 2.2, 3, 0.5) * 0.08;
        const cont = noiseGen.sphereFBM(u + warpU, v + warpV, 2.4, 6, 0.54);
        const detail = noiseGen.sphereFBM(u, v, 14.0, 4, 0.5);
        const moisture = noiseGen.sphereFBM(u + 3.1, v + 1.2, 3.5, 4, 0.5);
        const seaLevel = 0.505;
        const iceThreshold = 0.83 - (detail - 0.5) * 0.08;

        if (poleFactor > iceThreshold) {
          rgb = [242, 248, 255];
          bumpVal = 145;
          specData.data[idx] = 60;
          specData.data[idx + 1] = 60;
          specData.data[idx + 2] = 60;
          specData.data[idx + 3] = 255;
        } else if (cont < seaLevel) {
          const depthT = clamp(cont / seaLevel, 0, 1);
          rgb =
            depthT < 0.84
              ? mixColor([8, 28, 72], [15, 58, 122], depthT / 0.84)
              : mixColor([15, 58, 122], [28, 118, 168], (depthT - 0.84) / 0.16);
          bumpVal = 110;
          specData.data[idx] = 235;
          specData.data[idx + 1] = 240;
          specData.data[idx + 2] = 255;
          specData.data[idx + 3] = 255;
        } else {
          const landElev = clamp((cont - seaLevel) / (1 - seaLevel), 0, 1);
          const latDist = Math.abs(poleFactor - 0.25);
          const desertFactor = clamp((1 - latDist * 3.8) * (1 - moisture * 0.9), 0, 1);
          let baseLand = mixColor([34, 88, 42], [76, 124, 56], detail);
          baseLand = mixColor(baseLand, [194, 158, 98], desertFactor);
          if (landElev > 0.62)
            rgb = mixColor([112, 96, 84], [240, 244, 248], (landElev - 0.62) / 0.38);
          else if (landElev > 0.36)
            rgb = mixColor(baseLand, [112, 96, 84], (landElev - 0.36) / 0.26);
          else rgb = baseLand;
          bumpVal = clamp(128 + landElev * 127 + (detail - 0.5) * 35, 120, 255);
          specData.data[idx] = 18;
          specData.data[idx + 1] = 18;
          specData.data[idx + 2] = 18;
          specData.data[idx + 3] = 255;
        }
      } else if (planetId === 'mars') {
        const n1 = noiseGen.sphereFBM(u, v, 2.8, 5, 0.55);
        const n2 = noiseGen.sphereFBM(u + 1.2, v, 10.0, 4, 0.5);
        let h = n1 * 0.72 + n2 * 0.28;
        for (let c = 0; c < craters.length; c++) {
          const cr = craters[c];
          const dx = px - cr.x,
            dy = py - cr.y,
            dz = pz - cr.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < cr.r * cr.r * 1.3) {
            const d = Math.sqrt(distSq) / cr.r;
            if (d < 0.85) h -= (1 - d) * 0.22;
            else if (d < 1.15) h += 0.09;
          }
        }
        h = clamp(h, 0, 1);
        if (poleFactor > 0.87 - (n2 - 0.5) * 0.06) {
          rgb = [238, 232, 228];
          bumpVal = 190;
        } else {
          rgb =
            h < 0.42
              ? mixColor([92, 42, 26], [184, 82, 42], h / 0.42)
              : mixColor([184, 82, 42], [226, 134, 78], (h - 0.42) / 0.58);
          bumpVal = clamp(h * 255, 0, 255);
        }
      } else if (planetId === 'jupiter') {
        const turb = noiseGen.sphereFBM(u * 2.2, v * 6.0, 3.8, 5, 0.55) - 0.5;
        const fineSwirl = noiseGen.sphereFBM(u * 5.0 + turb * 0.2, v * 12.0, 6.0, 4, 0.5);
        const lat = v + turb * 0.045;
        const z1 = Math.sin(lat * Math.PI * 14);
        const z2 = Math.cos(lat * Math.PI * 26) * 0.5;
        const z3 = Math.sin(lat * Math.PI * 6);
        const bandVal = clamp((z1 + z2 + z3 * 0.4) * 0.35 + 0.5 + (fineSwirl - 0.5) * 0.22, 0, 1);

        rgb =
          bandVal < 0.45
            ? mixColor([146, 78, 46], [204, 142, 92], bandVal / 0.45)
            : mixColor([204, 142, 92], [242, 228, 204], (bandVal - 0.45) / 0.55);
        if (poleFactor > 0.78) rgb = mixColor(rgb, [138, 128, 118], (poleFactor - 0.78) / 0.22);

        let du = Math.abs(u - 0.5);
        if (du > 0.5) du = 1.0 - du;
        const dv = v - 0.63;
        const grsDist = Math.sqrt(du * 9.5 * (du * 9.5) + dv * 18.0 * (dv * 18.0));
        if (grsDist < 1.15) {
          const swirlAngle = grsDist * 5.0 + fineSwirl * 2.0;
          const spotColor = mixColor(
            [198, 62, 36],
            [232, 116, 68],
            Math.sin(swirlAngle) * 0.5 + 0.5,
          );
          rgb = mixColor(rgb, spotColor, Math.pow(clamp(1 - grsDist / 1.15, 0, 1), 1.4));
        }
        bumpVal = clamp(bandVal * 160 + 50, 0, 255);
      } else if (planetId === 'saturn') {
        const turb = (noiseGen.sphereFBM(u * 2.0, v * 8.0, 3.0, 4, 0.5) - 0.5) * 0.02;
        const lat = v + turb;
        const band = Math.sin(lat * Math.PI * 18) * 0.35 + Math.cos(lat * Math.PI * 9) * 0.35 + 0.5;
        const t = clamp(band, 0, 1);
        rgb =
          t < 0.5
            ? mixColor([182, 146, 88], [224, 194, 134], t * 2)
            : mixColor([224, 194, 134], [246, 232, 188], (t - 0.5) * 2);
        if (poleFactor > 0.82) rgb = mixColor(rgb, [126, 134, 118], (poleFactor - 0.82) / 0.18);
        bumpVal = clamp(t * 140 + 60, 0, 255);
      } else if (planetId === 'uranus') {
        const band = Math.sin(v * Math.PI * 8) * 0.15 + 0.5;
        const n = noiseGen.sphereFBM(u, v, 3.0, 3, 0.5);
        const t = clamp(band * 0.7 + n * 0.3, 0, 1);
        rgb = mixColor([110, 202, 218], [188, 242, 248], t);
        bumpVal = 128;
      } else if (planetId === 'neptune') {
        const turb = (noiseGen.sphereFBM(u * 3.0, v * 6.0, 3.5, 4, 0.5) - 0.5) * 0.03;
        const lat = v + turb;
        const band = Math.sin(lat * Math.PI * 12) * 0.3 + 0.5;
        const streak = noiseGen.sphereFBM(u * 6.0, v * 22.0, 4.5, 4, 0.55);
        rgb = mixColor([24, 56, 158], [48, 108, 228], clamp(band, 0, 1));
        let du = Math.abs(u - 0.35);
        if (du > 0.5) du = 1.0 - du;
        const dv = v - 0.62;
        const gdsDist = Math.sqrt(du * 11 * (du * 11) + dv * 20 * (dv * 20));
        if (gdsDist < 1.0) {
          rgb = mixColor(rgb, [12, 24, 88], 1 - gdsDist);
        }
        if (streak > 0.67 && poleFactor < 0.75) {
          rgb = mixColor(rgb, [215, 238, 255], (streak - 0.67) / 0.33);
        }
        bumpVal = clamp(band * 150 + 50, 0, 255);
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
  return { map, bumpMap, specularMap };
}

function generateEarthCloudsTexture() {
  const width = 1024,
    height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const warp = noiseGen.sphereFBM(u + 2.0, v + 1.0, 3.2, 4, 0.5) * 0.1;
      const n = noiseGen.sphereFBM(u + warp, v + warp * 0.5, 4.5, 5, 0.56);
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
  return tex;
}

function generateRingTexture(isSaturn = true) {
  const width = 1024,
    height = 64;
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
  const width = 1024,
    height = 512;
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

      const neb1 = noiseGen.sphereFBM(u, v, 2.6, 5, 0.55);
      const neb2 = noiseGen.sphereFBM(u + 4.2, v + 1.8, 5.2, 4, 0.5);
      const dustLane = noiseGen.sphereFBM(u * 2.0, v * 3.0, 6.5, 4, 0.55);

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
}

export default function SolarSystem3D() {
  const rootRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<ControllerActions | null>(null);

  useEffect(() => {
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
    let focusedPlanetId: string | null = 'earth';
    let showOrbits = true;
    let showLabels = true;
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
          const maps = generatePlanetTextures(data.id);
          let mat: THREE.Material;
          if (data.id === 'earth') {
            mat = new THREE.MeshPhongMaterial({
              map: maps.map,
              bumpMap: maps.bumpMap,
              bumpScale: 0.06,
              specularMap: maps.specularMap ?? undefined,
              specular: new THREE.Color(0x5588aa),
              shininess: 32,
            });
          } else {
            const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune', 'venus'].includes(
              data.id,
            );
            mat = new THREE.MeshStandardMaterial({
              map: maps.map,
              bumpMap: maps.bumpMap,
              bumpScale: isGasGiant ? 0.015 : 0.085,
              roughness: isGasGiant ? 0.65 : 0.85,
              metalness: 0.04,
            });
          }

          mainMesh = new THREE.Mesh(sphereGeoHigh, mat);
          mainMesh.scale.setScalar(data.radius);
          tiltGroup.add(mainMesh);

          if (data.id === 'earth') {
            const cloudTex = generateEarthCloudsTexture();
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

            const atmoMesh = new THREE.Mesh(
              sphereGeoHigh,
              createAtmosphereMaterial(0x38bdf8, 0.9, 3.0),
            );
            atmoMesh.scale.setScalar(data.radius * 1.12);
            planetHolder.add(atmoMesh);

            const moonMaps = generatePlanetTextures('moon');
            const moonPivot = new THREE.Group();
            moonPivot.rotation.z = 0.09;
            const moonMesh = new THREE.Mesh(
              new THREE.SphereGeometry(data.radius * 0.27, 32, 32),
              new THREE.MeshStandardMaterial({
                map: moonMaps.map,
                bumpMap: moonMaps.bumpMap,
                bumpScale: 0.06,
                roughness: 0.9,
              }),
            );
            moonMesh.position.set(data.radius * 2.6, 0, 0);
            moonPivot.add(moonMesh);
            planetHolder.add(moonPivot);
            moons.push({ pivot: moonPivot, speed: 2.2 });
          }

          if (data.id === 'venus') {
            const atmoMesh = new THREE.Mesh(
              sphereGeoHigh,
              createAtmosphereMaterial(0xfbbf24, 0.75, 2.8),
            );
            atmoMesh.scale.setScalar(data.radius * 1.11);
            planetHolder.add(atmoMesh);
          }

          if (data.id === 'mars') {
            const atmoMesh = new THREE.Mesh(
              sphereGeoHigh,
              createAtmosphereMaterial(0xf97316, 0.55, 3.4),
            );
            atmoMesh.scale.setScalar(data.radius * 1.09);
            planetHolder.add(atmoMesh);
          }

          if (data.id === 'jupiter') {
            const atmoMesh = new THREE.Mesh(
              sphereGeoHigh,
              createAtmosphereMaterial(0xfdba74, 0.5, 3.8),
            );
            atmoMesh.scale.setScalar(data.radius * 1.07);
            planetHolder.add(atmoMesh);

            const galileanSpecs = [
              { dist: 1.48, size: 0.075, color: 0xfacc15, speed: 3.4 },
              { dist: 1.82, size: 0.068, color: 0xe2e8f0, speed: 2.4 },
              { dist: 2.25, size: 0.105, color: 0xa8a29e, speed: 1.6 },
              { dist: 2.75, size: 0.092, color: 0x78716c, speed: 1.05 },
            ];
            galileanSpecs.forEach((m, mIdx) => {
              const mPivot = new THREE.Group();
              mPivot.rotation.y = mIdx * 1.6;
              const mMesh = new THREE.Mesh(
                new THREE.SphereGeometry(data.radius * m.size, 20, 20),
                new THREE.MeshStandardMaterial({ color: m.color, roughness: 0.8 }),
              );
              mMesh.position.set(data.radius * m.dist, 0, 0);
              mPivot.add(mMesh);
              tiltGroup.add(mPivot);
              moons.push({ pivot: mPivot, speed: m.speed });
            });
          }

          if (data.id === 'saturn') {
            const innerR = data.radius * 1.25;
            const outerR = data.radius * 2.45;
            const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);
            const posAttr = ringGeo.attributes.position;
            const uvAttr = ringGeo.attributes.uv;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < posAttr.count; i++) {
              v3.fromBufferAttribute(posAttr, i);
              uvAttr.setXY(i, (v3.length() - innerR) / (outerR - innerR), 0.5);
            }
            const ringMesh = new THREE.Mesh(
              ringGeo,
              new THREE.MeshStandardMaterial({
                map: generateRingTexture(true),
                side: THREE.DoubleSide,
                transparent: true,
                roughness: 0.7,
                metalness: 0.05,
              }),
            );
            ringMesh.rotation.x = Math.PI / 2;
            tiltGroup.add(ringMesh);

            const titanPivot = new THREE.Group();
            const titanMesh = new THREE.Mesh(
              new THREE.SphereGeometry(data.radius * 0.11, 24, 24),
              new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 }),
            );
            titanMesh.position.set(data.radius * 2.95, 0, 0);
            titanPivot.add(titanMesh);
            tiltGroup.add(titanPivot);
            moons.push({ pivot: titanPivot, speed: 1.35 });
          }

          if (data.id === 'uranus') {
            const innerR = data.radius * 1.35;
            const outerR = data.radius * 1.88;
            const ringGeo = new THREE.RingGeometry(innerR, outerR, 96);
            const posAttr = ringGeo.attributes.position;
            const uvAttr = ringGeo.attributes.uv;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < posAttr.count; i++) {
              v3.fromBufferAttribute(posAttr, i);
              uvAttr.setXY(i, (v3.length() - innerR) / (outerR - innerR), 0.5);
            }
            const ringMesh = new THREE.Mesh(
              ringGeo,
              new THREE.MeshBasicMaterial({
                map: generateRingTexture(false),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7,
              }),
            );
            ringMesh.rotation.x = Math.PI / 2;
            tiltGroup.add(ringMesh);

            const atmoMesh = new THREE.Mesh(
              sphereGeoHigh,
              createAtmosphereMaterial(0x67e8f9, 0.65, 3.2),
            );
            atmoMesh.scale.setScalar(data.radius * 1.09);
            planetHolder.add(atmoMesh);
          }

          if (data.id === 'neptune') {
            const atmoMesh = new THREE.Mesh(
              sphereGeoHigh,
              createAtmosphereMaterial(0x3b82f6, 0.8, 3.1),
            );
            atmoMesh.scale.setScalar(data.radius * 1.1);
            planetHolder.add(atmoMesh);
          }

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
        const initialAngle = idx === 0 ? 0 : idx * 1.15 + 0.4;
        planetObjects[data.id] = {
          data,
          orbitPivot,
          planetHolder,
          tiltGroup,
          mainMesh,
          cloudMesh,
          moons,
          angle: initialAngle,
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

      for (let i = 0; i < mainBeltCount; i++) {
        const radius = 84 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const ySpread = (Math.random() - 0.5) * 5.2 * Math.sin(Math.random() * Math.PI);
        const scaleX = 0.14 + Math.pow(Math.random(), 2.4) * 0.55;
        const scaleY = scaleX * (0.6 + Math.random() * 0.7);
        const scaleZ = scaleX * (0.6 + Math.random() * 0.7);

        const item = {
          radius,
          angle,
          y: ySpread,
          speed: (0.52 + Math.random() * 0.18) * (92 / radius),
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

      for (let i = 0; i < kuiperCount; i++) {
        const radius = 262 + Math.random() * 65;
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

      CELESTIAL_DATA.forEach((planet) => {
        const btn = document.createElement('button');
        btn.id = `dock-btn-${planet.id}`;
        btn.className =
          'glass-pill px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-medium text-slate-200 whitespace-nowrap';
        btn.onclick = () => selectCelestialTarget(planet.id);
        const kbdHtml =
          planet.keybind !== '' ? `<span class="kbd-badge">${planet.keybind}</span>` : '';
        btn.innerHTML = `
          <span class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${planet.badgeBg}; box-shadow: 0 0 8px ${planet.color}66;"></span>
          <span>${planet.name.replace('The ', '')}</span>
          ${kbdHtml}
        `;
        dock.appendChild(btn);

        const lbl = document.createElement('div');
        lbl.className = 'planet-label';
        lbl.style.color = planet.color;
        lbl.onclick = (e) => {
          e.stopPropagation();
          selectCelestialTarget(planet.id);
        };
        lbl.innerHTML = `
          <div class="px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-700/70 backdrop-blur-md text-[11px] font-mono-tech font-medium text-slate-100 tracking-wide whitespace-nowrap shadow-lg hover:border-sky-400 flex items-center gap-1.5">
            <span>${planet.name.replace('The ', '')}</span>
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
          badge.textContent = 'AUTOPILOT LOCK';
          badge.className =
            'text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/50';
        } else {
          badge.textContent = 'MANUAL 6DOF';
          badge.className =
            'text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
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

        if (!focusedPlanetId) focusedPlanetId = 'earth';
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
      q('keyboard-help-panel')?.classList.toggle('hidden', !showKeyboardHelp);
      q('btn-help')?.classList.toggle('active', showKeyboardHelp);
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
      showLabels = !showLabels;
      if (labelsContainer) labelsContainer.style.display = showLabels ? 'block' : 'none';
      q('btn-labels')?.classList.toggle('active', showLabels);
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
