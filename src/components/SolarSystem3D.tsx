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

      if (e.repeat) return;

      if (code === 'KeyC') toggleFlightMode();
      else if (code === 'KeyX') {
        if (isCockpitMode && (keyState['ControlLeft'] || keyState['ControlRight']))
          zeroShipVelocity();
        else triggerSolarFlareCME(true);
      } else if (code === 'KeyH') toggleKeyboardHelp();
      else if (code === 'KeyO') toggleOrbits();
      else if (code === 'KeyL') toggleLabels();
      else if (code === 'KeyB') toggleAsteroids();
      else if (code === 'KeyP') togglePause();
      else if (code === 'KeyT') toggleTourMode();
      else if (code === 'KeyV') setCameraPreset('topdown');
      else if (code === 'KeyZ') zoomToSurface();
      else if (code === 'KeyG') toggleAutopilot();
      else if (code === 'KeyI') toggleInvertPitch();
      else if (code === 'BracketLeft') stepPlanet(-1);
      else if (code === 'BracketRight') stepPlanet(1);
      else if (code === 'Comma') adjustTimeSpeed(-1);
      else if (code === 'Period') adjustTimeSpeed(1);
      else if (code === 'Escape') releaseFocus();
      else if (code === 'Digit0') selectCelestialTarget('sun');
      else if (code === 'Digit1') selectCelestialTarget('mercury');
      else if (code === 'Digit2') selectCelestialTarget('venus');
      else if (code === 'Digit3') selectCelestialTarget('earth');
      else if (code === 'Digit4') selectCelestialTarget('mars');
      else if (code === 'Digit5') selectCelestialTarget('jupiter');
      else if (code === 'Digit6') selectCelestialTarget('saturn');
      else if (code === 'Digit7') selectCelestialTarget('uranus');
      else if (code === 'Digit8') selectCelestialTarget('neptune');
      else if (code === 'Digit9') {
        if (isCockpitMode) toggleFlightMode();
        setCameraPreset('overview');
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      keyState[e.code] = false;
    }

    function onPointerDown(e: PointerEvent) {
      pointerDownPos.x = e.clientX;
      pointerDownPos.y = e.clientY;
    }

    function onPointerUp(e: PointerEvent) {
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
          ? `${(speedUnits * 0.042).toFixed(2)} <span class="text-xs font-mono-tech text-fuchsia-400">c WARP</span>`
          : `${displayKms} <span class="text-xs font-mono-tech text-sky-400">km/s</span>`;
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
            badge.textContent = 'WARP DRIVE ACTIVE';
            badge.className =
              'text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/60';
          } else if (keyState['ShiftLeft'] || keyState['ShiftRight']) {
            badge.textContent = 'AFTERBURNER';
            badge.className =
              'text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-400/50';
          } else {
            badge.textContent = 'MANUAL 6DOF';
            badge.className =
              'text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
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

      CELESTIAL_DATA.filter((d) => !d.isDeepSpace).forEach((data) => {
        const obj = planetObjects[data.id];
        if (!obj) return;

        if (data.distance && data.distance > 0 && data.orbitalSpeed) {
          obj.angle += data.orbitalSpeed * 0.22 * simDelta;
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

      if (showLabels) {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;

        CELESTIAL_DATA.forEach((data) => {
          const obj = planetObjects[data.id];
          const lbl = labelElements[data.id];
          if (!obj || !lbl) return;

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
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative h-screen w-screen overflow-hidden bg-[#02040a] select-none">
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
          Synthesizing Planetary Surfaces, Solar Flares &amp; Deep-Space Nebulae...
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
        className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
      />

      {/* SCI-FI SPACESHIP COCKPIT HUD OVERLAY */}
      <div
        id="cockpit-hud"
        className="fixed inset-0 z-[15] pointer-events-none hidden cockpit-vignette transition-opacity duration-300"
      >
        <svg className="w-full h-full opacity-80" viewBox="0 0 1920 1080" preserveAspectRatio="none">
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
          <path d="M0,90 L300,42 L135,920 L0,1080 Z" fill="url(#strutGrad)" opacity="0.45" />
          <path d="M1920,90 L1620,42 L1785,920 L1920,1080 Z" fill="url(#strutGrad)" opacity="0.45" />
          <polyline
            points="300,42 135,920 420,1030"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.35"
          />
          <polyline
            points="1620,42 1785,920 1500,1030"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeOpacity="0.35"
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
          <div className="relative w-80 h-80 flex items-center justify-center">
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
              <svg className="w-64 h-64" viewBox="0 0 200 200">
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
            <span id="cockpit-lock-name">EARTH</span>
            <span>LOCK</span>
          </div>
          <div
            id="cockpit-lock-dist"
            className="text-[10px] font-mono-tech font-bold text-sky-300 bg-slate-950/85 px-1.5 py-0.5 rounded border border-sky-500/30 whitespace-nowrap"
          >
            0.0 AU
          </div>
        </div>

        {/* Left Cockpit Telemetry Module */}
        <div className="fixed bottom-28 left-4 sm:left-8 w-64 sm:w-72 glass-panel rounded-2xl p-3.5 border-l-2 border-l-sky-400 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-sky-400 font-semibold">
              6DOF Flight Propulsion
            </span>
            <span
              id="flight-status-badge"
              className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            >
              SUBLIGHT
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[10px] font-mono-tech text-slate-400">REL. VELOCITY</div>
              <div
                id="cockpit-speed-readout"
                className="font-display text-xl sm:text-2xl font-bold text-white"
              >
                0.0 <span className="text-xs font-mono-tech text-sky-400">km/s</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono-tech text-slate-400">PITCH INVERT</div>
              <button
                onClick={() => actionsRef.current?.toggleInvertPitch()}
                className="text-[11px] font-mono-tech text-slate-300 hover:text-sky-300"
              >
                <span id="pitch-invert-label">STD</span> <span className="kbd-badge">I</span>
              </button>
            </div>
          </div>

          <div className="mb-2.5">
            <div className="flex justify-between text-[10px] font-mono-tech text-slate-400 mb-1">
              <span>THRUST OUTPUT [W/S | SHIFT]</span>
              <span id="cockpit-throttle-pct" className="text-sky-300">
                0%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/70">
              <div
                id="cockpit-throttle-bar"
                className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-400 w-0 transition-all duration-75"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono-tech text-slate-400 mb-1">
              <span>WARP CAPACITOR [HOLD SPACE]</span>
              <span id="cockpit-warp-pct" className="text-fuchsia-300">
                100%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/70">
              <div
                id="cockpit-warp-bar"
                className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-400 w-full transition-all duration-75"
              />
            </div>
          </div>
        </div>

        {/* Right Cockpit Navigation & Autopilot Module */}
        <div className="fixed bottom-28 right-4 sm:right-8 w-64 sm:w-72 glass-panel rounded-2xl p-3.5 border-r-2 border-r-amber-400 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono-tech uppercase tracking-widest text-amber-400 font-semibold">
              Nav Computer &amp; Autopilot
            </span>
            <span className="text-[10px] font-mono-tech text-slate-400">[ [ / ] ] CYCLE</span>
          </div>

          <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-2.5 mb-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-tech text-slate-400">NAV WAYPOINT</span>
              <span id="nav-target-type" className="text-[9px] font-mono-tech text-amber-300 uppercase">
                PLANET
              </span>
            </div>
            <div id="nav-target-name" className="font-display text-lg font-bold text-white truncate">
              Earth
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] font-mono-tech">
              <span className="text-slate-400">RANGE:</span>
              <span id="nav-target-dist" className="text-sky-300 font-semibold">
                0.00 AU
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => actionsRef.current?.toggleAutopilot()}
              id="btn-autopilot"
              className="glass-pill flex-1 py-2 px-3 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5"
            >
              <span>Autopilot Fly-To</span>
              <span className="kbd-badge">G</span>
            </button>
            <button
              onClick={() => actionsRef.current?.zeroShipVelocity()}
              className="glass-pill py-2 px-2.5 rounded-xl text-xs font-medium text-slate-300"
              title="Full All-Stop Brake"
            >
              <span>Stop</span>
              <span className="kbd-badge">X</span>
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

      {/* TOP NAVIGATION & TELEMETRY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-20 p-3 sm:p-4 pointer-events-none flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2.5">
        <div className="glass-panel rounded-2xl px-3.5 py-2 pointer-events-auto flex items-center gap-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/50">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base tracking-wider text-white">
                  HELIOSPHERE
                </span>
                <span
                  id="mode-indicator-pill"
                  className="text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40"
                >
                  ORBITAL MODE
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono-tech">
                <span id="sim-date-display">2026-10-21</span>
                <span className="text-slate-600">|</span>
                <span id="active-target-indicator" className="text-sky-400">
                  TARGET: SOL SYSTEM
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-1.5">
            <button
              onClick={() => actionsRef.current?.toggleFlightMode()}
              id="btn-cockpit-mode"
              className="glass-pill px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 border-amber-500/40 flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>Cockpit Mode</span>
              <span className="kbd-badge">C</span>
            </button>

            <button
              onClick={() => actionsRef.current?.triggerSolarFlareCME(true)}
              id="btn-solar-flare"
              className="glass-pill px-2.5 py-1.5 rounded-xl text-xs font-medium text-orange-300 flex items-center gap-1.5"
              title="Trigger X-Class Solar Flare & Coronal Mass Ejection"
            >
              <svg
                className="w-3.5 h-3.5 text-orange-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="hidden sm:inline">CME Flare</span>
              <span className="kbd-badge">X</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-1">
            <button
              onClick={() => actionsRef.current?.setCameraPreset('overview')}
              id="preset-overview"
              className="glass-pill active px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Overview</span>
              <span className="kbd-badge">9</span>
            </button>
            <button
              onClick={() => actionsRef.current?.setCameraPreset('topdown')}
              id="preset-topdown"
              className="glass-pill px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5"
            >
              <span className="hidden md:inline">Ecliptic</span>
              <span className="kbd-badge">V</span>
            </button>
            <button
              onClick={() => actionsRef.current?.toggleTourMode()}
              id="preset-tour"
              className="glass-pill px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Tour</span>
              <span className="kbd-badge">T</span>
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-1">
            <button
              onClick={() => actionsRef.current?.toggleOrbits()}
              id="btn-orbits"
              className="glass-pill active px-2 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1"
            >
              <span>Orbits</span>
              <span className="kbd-badge">O</span>
            </button>
            <button
              onClick={() => actionsRef.current?.toggleLabels()}
              id="btn-labels"
              className="glass-pill active px-2 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1"
            >
              <span>Labels</span>
              <span className="kbd-badge">L</span>
            </button>
            <button
              onClick={() => actionsRef.current?.toggleAsteroids()}
              id="btn-asteroids"
              className="glass-pill active px-2 py-1.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1"
            >
              <span>Belts</span>
              <span className="kbd-badge">B</span>
            </button>
            <button
              onClick={() => actionsRef.current?.toggleKeyboardHelp()}
              id="btn-help"
              className="glass-pill active px-2.5 py-1.5 rounded-xl text-xs font-semibold text-sky-300 flex items-center gap-1"
            >
              <span>Keys</span>
              <span className="kbd-badge">H</span>
            </button>
          </div>
        </div>
      </header>

      {/* COLLAPSIBLE KEYBOARD CONTROLS CHEAT-SHEET HUD */}
      <aside
        id="keyboard-help-panel"
        className="fixed top-20 left-3 sm:left-4 z-20 w-72 sm:w-80 glass-panel rounded-2xl p-3.5 text-xs transition-all duration-300 pointer-events-auto"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="font-display font-bold text-white tracking-wide uppercase text-xs">
              Keyboard Flight &amp; Nav Deck
            </span>
          </div>
          <button
            onClick={() => actionsRef.current?.toggleKeyboardHelp()}
            className="text-slate-400 hover:text-white text-[11px] font-mono-tech"
          >
            HIDE <span className="kbd-badge">H</span>
          </button>
        </div>

        <div id="help-orbital-section" className="space-y-1.5 text-[11px]">
          <div className="text-[10px] font-mono-tech uppercase text-sky-400 font-semibold">
            Orbital Camera Controls (No Mouse)
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Orbit Camera Around</span>
            <span>
              <kbd className="kbd-badge">Arrows</kbd> or <kbd className="kbd-badge">WASD</kbd>
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Zoom In / Out</span>
            <span>
              <kbd className="kbd-badge">R</kbd>
              <kbd className="kbd-badge">F</kbd> or <kbd className="kbd-badge">+</kbd>
              <kbd className="kbd-badge">-</kbd>
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Select Sun / Planets</span>
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
            <span>Strafe Left/Right/Up/Dn</span>
            <span>
              <kbd className="kbd-badge">A</kbd>
              <kbd className="kbd-badge">D</kbd> / <kbd className="kbd-badge">R</kbd>
              <kbd className="kbd-badge">F</kbd>
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Afterburner / WARP DRIVE</span>
            <span>
              <kbd className="kbd-badge">Shift</kbd> / <kbd className="kbd-badge">Space</kbd>
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Autopilot Fly-To Target</span>
            <span>
              <kbd className="kbd-badge">G</kbd>
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1 text-[11px]">
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
      </aside>

      {/* RIGHT-SIDE PLANET & DEEP-SPACE TELEMETRY HUD CARD */}
      <aside
        id="telemetry-panel"
        className="fixed top-20 right-3 sm:right-4 z-20 w-[calc(100vw-1.5rem)] sm:w-96 max-h-[calc(100vh-12rem)] glass-panel rounded-3xl p-4 sm:p-5 flex flex-col transition-all duration-500 transform translate-x-[120%] opacity-0 pointer-events-none overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span
                id="hud-classification"
                className="text-[10px] font-mono-tech uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30"
              >
                Terrestrial Planet
              </span>
              <span id="hud-order" className="text-[11px] font-mono-tech text-slate-400">
                #03 FROM SUN
              </span>
            </div>
            <h2
              id="hud-name"
              className="font-display text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight"
            >
              Earth
            </h2>
          </div>
          <button
            onClick={() => actionsRef.current?.releaseFocus()}
            className="glass-pill px-2 py-1.5 rounded-xl text-slate-400 hover:text-white flex items-center gap-1"
            title="Exit Target Lock [Esc]"
          >
            <span className="kbd-badge">Esc</span>
          </button>
        </div>

        <div className="overflow-y-auto thin-scrollbar pr-1 my-3 space-y-3.5 text-xs sm:text-sm">
          <p id="hud-description" className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
            Our home world and the only known astronomical object to harbor life.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                Mean Diameter / Span
              </div>
              <div id="hud-diameter" className="font-display text-sm font-semibold text-white mt-0.5">
                12,742 km
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                Heliocentric Dist
              </div>
              <div
                id="hud-distance"
                className="font-display text-sm font-semibold text-sky-300 mt-0.5"
              >
                1.00 AU
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                Orbital Period
              </div>
              <div id="hud-orbit" className="font-display text-sm font-semibold text-white mt-0.5">
                365.25 Days
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                Effective Temp
              </div>
              <div
                id="hud-temp"
                className="font-display text-sm font-semibold text-amber-300 mt-0.5"
              >
                15°C Mean
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                Moons / Structure
              </div>
              <div id="hud-moons" className="font-display text-sm font-semibold text-white mt-0.5">
                1 (Luna)
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5">
              <div className="text-[10px] font-mono-tech uppercase text-slate-400">
                Spin / Obliquity
              </div>
              <div
                id="hud-rotation"
                className="font-display text-sm font-semibold text-indigo-300 mt-0.5"
              >
                23.9h / 23.4°
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono-tech uppercase text-slate-400">
                Spectral &amp; Atmospheric Profile
              </span>
              <span id="hud-gravity" className="text-[11px] font-mono-tech text-sky-400">
                9.8 m/s²
              </span>
            </div>
            <div id="hud-atmosphere" className="text-xs text-slate-200 font-medium">
              78% Nitrogen, 21% Oxygen, 1% Argon
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-1.5">
          <button
            onClick={() => actionsRef.current?.stepPlanet(-1)}
            className="glass-pill py-2 px-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1"
          >
            <span className="kbd-badge">[</span>
            <span>Prev</span>
          </button>
          <button
            onClick={() => actionsRef.current?.zoomToSurface()}
            className="glass-pill flex-1 py-2 px-2.5 rounded-xl text-xs font-medium text-sky-300 flex items-center justify-center gap-1.5"
          >
            <span>Surface Zoom</span>
            <span className="kbd-badge">Z</span>
          </button>
          <button
            onClick={() => actionsRef.current?.stepPlanet(1)}
            className="glass-pill py-2 px-2.5 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-1"
          >
            <span>Next</span>
            <span className="kbd-badge">]</span>
          </button>
        </div>
      </aside>

      {/* BOTTOM INTERACTIVE DOCK: TIME WARP + ALL CELESTIAL TARGETS BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 p-2.5 sm:p-4 pointer-events-none flex flex-col items-center gap-2">
        <div className="glass-panel rounded-2xl px-3.5 py-1.5 pointer-events-auto flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => actionsRef.current?.togglePause()}
            id="btn-pause"
            className="glass-pill px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-sky-400 text-xs"
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
            <span className="kbd-badge">P</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => actionsRef.current?.adjustTimeSpeed(-1)}
              className="glass-pill px-1.5 py-0.5 rounded text-xs text-slate-300"
              title="Slower [,]"
            >
              <span className="kbd-badge">,</span>
            </button>
            <span className="text-[10px] font-mono-tech uppercase tracking-wider text-slate-400 hidden sm:inline">
              Orbital Warp
            </span>
            <input
              id="time-slider"
              type="range"
              min="0"
              max="100"
              defaultValue="25"
              className="cosmic-slider w-20 sm:w-28"
              onChange={(e) => actionsRef.current?.onTimeSliderChange(e.target.value)}
            />
            <button
              onClick={() => actionsRef.current?.adjustTimeSpeed(1)}
              className="glass-pill px-1.5 py-0.5 rounded text-xs text-slate-300"
              title="Faster [.]"
            >
              <span className="kbd-badge">.</span>
            </button>
            <span
              id="speed-readout"
              className="font-mono-tech text-xs font-semibold text-sky-300 w-12 text-right"
            >
              1.0x
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-1.5 pointer-events-auto max-w-full overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <div id="planet-dock" className="flex items-center gap-1.5 px-1" />
        </div>
      </footer>
    </div>
  );
}
<button
            onClick={() => window.dispatchEvent(new CustomEvent('enter-earth-base'))}
            className="glass-pill flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold text-emerald-300 border-emerald-500/40 flex items-center justify-center gap-1.5"
          >
            <span>Enter Base</span>
            <span className="kbd-badge">E</span>
          </button>
