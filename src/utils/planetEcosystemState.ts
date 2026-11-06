export type PlanetSceneMode =
  | 'planet'
  | 'square'
  | 'training_room'
  | 'asteroid_mining'
  | 'council_meeting';

export interface ShopTrackerDefinition {
  id: string;
  sectorId: string;
  name: string;
  role: string;
  category: 'mistakes' | 'exams' | 'revision' | 'finance' | 'asteroid_radar' | 'army_dispatch';
  metricLabel: string;
  secondaryLabel: string;
  accentColor: string;
  gx: number;
  gz: number;
  defaultTarget: number;
}

export interface LoggedTrackerEntry {
  id: string;
  shopId: string;
  title: string;
  primaryValue: number;
  secondaryNote: string;
  timestamp: string;
}

export interface ArmyUnitCount {
  infantry: number;
  siegeBreakers: number;
  plasmaLancers: number;
  engineers: number;
}

export interface AsteroidTarget {
  id: string;
  name: string;
  mineralName: string;
  mineralCode: string;
  requiredLevel: number;
  difficultyLabel: string;
  combatDurationSec: number; // 5 minutes (300s)
  miningDurationHours: number; // 5 hours to 120 hours (5 days)
  miningDurationLabel: string;
  estimatedYieldGold: number;
  estimatedYieldMineral: number;
  color: string;
  status: 'scouted' | 'fighting' | 'mining' | 'completed';
  elapsedSec: number;
  assignedArmy: number;
  assignedEngineers: number;
}

export interface ClanWarRewardItem {
  id: string;
  name: string;
  description: string;
  modelType: 'obelisk' | 'brazier' | 'crystal_pylon' | 'victory_banner';
  color: string;
  placedLocation: 'unplaced' | 'planet' | string; // 'planet' or sectorId square
}

export interface CouncilSpeakerLine {
  speakerId: string;
  speakerName: string;
  trustName: string;
  placeName: string;
  color: string;
  statement: string;
}

export interface PlanetEcosystemData {
  goldReserve: number;
  mineralStore: number;
  clanWarWins: number;
  sectorBaseLevels: Record<string, number>;
  army: ArmyUnitCount;
  sectorGarrisons: Record<string, number>;
  logs: LoggedTrackerEntry[];
  asteroids: AsteroidTarget[];
  clanRewards: ClanWarRewardItem[];
}

export const SECTOR_SHOPS: ShopTrackerDefinition[] = [
  // 🏛️ LIBRARY SQUARE SHOPS (Mistakes, Exam, Revision, Speed Trackers)
  {
    id: 'shop_mistakes',
    sectorId: 'library',
    name: 'Mistake Autopsy Shop',
    role: 'Error Pattern & Silly Mistake Tracker',
    category: 'mistakes',
    metricLabel: 'Mistakes Resolved',
    secondaryLabel: 'Root Cause / Topic Tag',
    accentColor: '#f43f5e',
    gx: -8.5,
    gz: -7.5,
    defaultTarget: 50,
  },
  {
    id: 'shop_exams',
    sectorId: 'library',
    name: 'Exam & Mock Score Shop',
    role: 'Full-Length Test & Percentile Tracker',
    category: 'exams',
    metricLabel: 'Mock Score (%)',
    secondaryLabel: 'Exam Name & Rank Note',
    accentColor: '#38bdf8',
    gx: 8.5,
    gz: -7.5,
    defaultTarget: 100,
  },
  {
    id: 'shop_revision',
    sectorId: 'library',
    name: 'Syllabus Codex Shop',
    role: 'Active Recall & Spaced Revision Tracker',
    category: 'revision',
    metricLabel: 'Chapters Mastered',
    secondaryLabel: 'Subject & Module',
    accentColor: '#a855f7',
    gx: -8.5,
    gz: 7.5,
    defaultTarget: 40,
  },
  {
    id: 'shop_focus',
    sectorId: 'library',
    name: 'Deep Drill Speed Shop',
    role: 'Timed Problem Solving & Speed Tracker',
    category: 'revision',
    metricLabel: 'Problems Solved',
    secondaryLabel: 'Drill Set & Accuracy',
    accentColor: '#10b981',
    gx: 8.5,
    gz: 7.5,
    defaultTarget: 200,
  },

  // 🏦 MONEY & MINING SQUARE SHOPS (Mines, Stores, Engineers, Asteroid Radar)
  {
    id: 'shop_asteroid_radar',
    sectorId: 'vault',
    name: 'Asteroid Mineral Radar Shop',
    role: 'Deep-Space Mineral Prospectus & Extraction Tracker',
    category: 'asteroid_radar',
    metricLabel: 'Core Purity (%)',
    secondaryLabel: 'Asteroid Sector Scan',
    accentColor: '#f59e0b',
    gx: -8.5,
    gz: -7.5,
    defaultTarget: 100,
  },
  {
    id: 'shop_gold_refinery',
    sectorId: 'vault',
    name: 'Bullion & Store Ledger Shop',
    role: 'Gold Mining Output & Vault Reserve Tracker',
    category: 'finance',
    metricLabel: 'Gold Mined (CE)',
    secondaryLabel: 'Vein / Store Batch',
    accentColor: '#eab308',
    gx: 8.5,
    gz: -7.5,
    defaultTarget: 5000,
  },
  {
    id: 'shop_engineer_guild',
    sectorId: 'vault',
    name: 'Engineer Tooling Shop',
    role: 'Laser Drill Calibration & Extraction Crew Log',
    category: 'finance',
    metricLabel: 'Drill Output (MW)',
    secondaryLabel: 'Tooling Tier Note',
    accentColor: '#06b6d4',
    gx: 8.5,
    gz: 7.5,
    defaultTarget: 150,
  },

  // ⚔️ ARMY GARRISON SQUARE SHOPS
  {
    id: 'shop_war_command',
    sectorId: 'army_camp',
    name: 'War Readiness Tracker Shop',
    role: 'Battalion Combat Drill & Deployment Log',
    category: 'army_dispatch',
    metricLabel: 'Combat Readiness (%)',
    secondaryLabel: 'Regiment Order',
    accentColor: '#ef4444',
    gx: -8.5,
    gz: -7.5,
    defaultTarget: 100,
  },
  {
    id: 'shop_siege_foundry',
    sectorId: 'army_camp',
    name: 'Siege Weapons Shop',
    role: 'Orbital Drop & Artillery Calibration Tracker',
    category: 'army_dispatch',
    metricLabel: 'Ordnance Units',
    secondaryLabel: 'Battery Designation',
    accentColor: '#f97316',
    gx: 8.5,
    gz: -7.5,
    defaultTarget: 50,
  },

  // ⛺ HEADQUARTERS (MAIN HALL SQUARE) TRUST BUILDINGS
  {
    id: 'trust_academic',
    sectorId: 'sanctum',
    name: 'Smriti Academic Trust Hall',
    role: 'Planetary Knowledge & Library Endowment Trust',
    category: 'revision',
    metricLabel: 'Trust Index',
    secondaryLabel: 'Endowment Directive',
    accentColor: '#38bdf8',
    gx: -8.5,
    gz: -7.5,
    defaultTarget: 100,
  },
  {
    id: 'trust_defense',
    sectorId: 'sanctum',
    name: 'Ares Defense Trust Hall',
    role: 'Planetary Security & Fleet Command Trust',
    category: 'army_dispatch',
    metricLabel: 'Shield Readiness',
    secondaryLabel: 'Defense Protocol',
    accentColor: '#ef4444',
    gx: 8.5,
    gz: -7.5,
    defaultTarget: 100,
  },
  {
    id: 'trust_mineral',
    sectorId: 'sanctum',
    name: 'Kubera Mineral Trust Hall',
    role: ' Treasury, Mines & Asteroid Extraction Trust',
    category: 'finance',
    metricLabel: 'Reserve Ratio',
    secondaryLabel: 'Treasury Audit',
    accentColor: '#10b981',
    gx: -8.5,
    gz: 7.5,
    defaultTarget: 100,
  },
  {
    id: 'trust_continental',
    sectorId: 'sanctum',
    name: 'Continental Alliance Trust Hall',
    role: 'Asia & Americas Outpost Infrastructure Trust',
    category: 'finance',
    metricLabel: 'Outpost Sync (%)',
    secondaryLabel: 'Continental Charter',
    accentColor: '#f59e0b',
    gx: 8.5,
    gz: 7.5,
    defaultTarget: 100,
  },
];

export const INITIAL_ASTEROIDS: AsteroidTarget[] = [
  {
    id: 'ast_psyche',
    name: '16-Psyche Iron Core',
    mineralName: 'Aetherium & Nickel-Gold',
    mineralCode: 'AETH-99',
    requiredLevel: 5,
    difficultyLabel: 'Level 5 • Low Orbit',
    combatDurationSec: 300, // 5 min fight
    miningDurationHours: 5, // 5 hours mining
    miningDurationLabel: '5 Hours',
    estimatedYieldGold: 1800,
    estimatedYieldMineral: 420,
    color: '#f59e0b',
    status: 'mining',
    elapsedSec: 1200,
    assignedArmy: 25,
    assignedEngineers: 8,
  },
  {
    id: 'ast_ceres',
    name: 'Ceres-V Cryo Mantle',
    mineralName: 'Helium-3 & Platinum',
    mineralCode: 'HE3-PT',
    requiredLevel: 8,
    difficultyLabel: 'Level 8 • Mid Belt',
    combatDurationSec: 300, // 5 min fight
    miningDurationHours: 24, // 1 day mining
    miningDurationLabel: '24 Hours (1 Day)',
    estimatedYieldGold: 4600,
    estimatedYieldMineral: 1150,
    color: '#38bdf8',
    status: 'scouted',
    elapsedSec: 0,
    assignedArmy: 0,
    assignedEngineers: 0,
  },
  {
    id: 'ast_vesta',
    name: 'Vesta-IX Sovereign Lode',
    mineralName: 'Crystalline Solarium',
    mineralCode: 'SOL-X',
    requiredLevel: 12,
    difficultyLabel: 'Level 12 • Deep Belt',
    combatDurationSec: 300, // 5 min fight
    miningDurationHours: 72, // 3 days mining
    miningDurationLabel: '72 Hours (3 Days)',
    estimatedYieldGold: 9500,
    estimatedYieldMineral: 2800,
    color: '#a855f7',
    status: 'scouted',
    elapsedSec: 0,
    assignedArmy: 0,
    assignedEngineers: 0,
  },
  {
    id: 'ast_krypton',
    name: 'Krypton-Apex Monolith',
    mineralName: 'Heavy Antimatter Ore',
    mineralCode: 'VOID-7',
    requiredLevel: 16,
    difficultyLabel: 'Level 16 • Outer Rim',
    combatDurationSec: 300, // 5 min fight
    miningDurationHours: 120, // 5 days mining
    miningDurationLabel: '120 Hours (5 Days)',
    estimatedYieldGold: 22000,
    estimatedYieldMineral: 6400,
    color: '#10b981',
    status: 'scouted',
    elapsedSec: 0,
    assignedArmy: 0,
    assignedEngineers: 0,
  },
];

export const INITIAL_CLAN_REWARDS: ClanWarRewardItem[] = [
  {
    id: 'cw_obelisk',
    name: 'Golden Siege Obelisk',
    description: 'Clan War Season I Victory Monument (+2 Sector Level)',
    modelType: 'obelisk',
    color: '#f59e0b',
    placedLocation: 'planet',
  },
  {
    id: 'cw_brazier',
    name: 'Inferno Dragon Brazier',
    description: 'Eternal War Flame won in Clan War Defense',
    modelType: 'brazier',
    color: '#ef4444',
    placedLocation: 'library',
  },
  {
    id: 'cw_pylon',
    name: 'Aether Crystal Pylon',
    description: 'High-energy mineral resonator trophy',
    modelType: 'crystal_pylon',
    color: '#38bdf8',
    placedLocation: 'vault',
  },
  {
    id: 'cw_banner',
    name: 'Sovereign Grand Banner',
    description: 'Supreme Commander Pennant for any Square or Planet',
    modelType: 'victory_banner',
    color: '#10b981',
    placedLocation: 'unplaced',
  },
];

export function createInitialPlanetEcosystem(): PlanetEcosystemData {
  return {
    goldReserve: 14850,
    mineralStore: 1920,
    clanWarWins: 4,
    sectorBaseLevels: {
      sanctum: 14,
      library: 12,
      army_camp: 11,
      vault: 13,
      asia: 9,
      americas: 10,
      crucible: 8,
      market: 9,
    },
    army: {
      infantry: 85,
      siegeBreakers: 24,
      plasmaLancers: 32,
      engineers: 18,
    },
    sectorGarrisons: {
      sanctum: 40,
      library: 20,
      army_camp: 55,
      vault: 30,
      asia: 25,
      americas: 25,
    },
    logs: [
      {
        id: 'log_1',
        shopId: 'shop_mistakes',
        title: 'Calculus Sign Flip & Integration Bounds',
        primaryValue: 18,
        secondaryNote: 'Definite Integrals • Fixed with boundary check',
        timestamp: 'Today, 09:15',
      },
      {
        id: 'log_2',
        shopId: 'shop_exams',
        title: 'All-India Sovereign Mock Test #4',
        primaryValue: 94,
        secondaryNote: '99.2 Percentile • Physics + Math Top 1%',
        timestamp: 'Yesterday, 18:40',
      },
      {
        id: 'log_3',
        shopId: 'shop_revision',
        title: 'Electrodynamics & Rotational Mechanics',
        primaryValue: 14,
        secondaryNote: 'Full Active Recall Flashcard Pass',
        timestamp: '2 days ago',
      },
      {
        id: 'log_4',
        shopId: 'shop_asteroid_radar',
        title: '16-Psyche Core Spectrographic Lock',
        primaryValue: 96,
        secondaryNote: 'High-grade Aetherium vein confirmed',
        timestamp: 'Today, 11:00',
      },
    ],
    asteroids: INITIAL_ASTEROIDS,
    clanRewards: INITIAL_CLAN_REWARDS,
  };
}

export function getShopsForSector(sectorId: string): ShopTrackerDefinition[] {
  const matched = SECTOR_SHOPS.filter((s) => s.sectorId === sectorId);
  if (matched.length > 0) return matched;
  // Default shops for continental outposts (Asia / Americas / etc.)
  return [
    {
      id: `shop_${sectorId}_main`,
      sectorId,
      name: 'Outpost Progress Tracker Shop',
      role: 'Regional Infrastructure & Mastery Log',
      category: 'revision',
      metricLabel: 'Milestones Logged',
      secondaryLabel: 'Outpost Directive',
      accentColor: '#f59e0b',
      gx: -8.5,
      gz: -7.5,
      defaultTarget: 50,
    },
    {
      id: `shop_${sectorId}_trade`,
      sectorId,
      name: 'Continental Resource Shop',
      role: 'Regional Supply & Mineral Exchange Tracker',
      category: 'finance',
      metricLabel: 'Supply Units',
      secondaryLabel: 'Convoy Route',
      accentColor: '#38bdf8',
      gx: 8.5,
      gz: -7.5,
      defaultTarget: 250,
    },
  ];
}

export function computeSectorDummyLevel(
  sectorId: string,
  state: PlanetEcosystemData,
): {
  level: number;
  stars: number;
  tierTitle: string;
  logsCount: number;
} {
  const base = state.sectorBaseLevels[sectorId] ?? 8;
  const sectorShopIds = new Set(getShopsForSector(sectorId).map((s) => s.id));
  const logsCount = state.logs.filter((l) => sectorShopIds.has(l.shopId)).length;
  const trophyBonus = state.clanRewards.filter((r) => r.placedLocation === sectorId).length * 2;
  const level = base + logsCount + trophyBonus;
  const stars = Math.min(5, Math.max(1, Math.floor(level / 3)));
  const tierTitle =
    level >= 15 ? 'APEX CITADEL' : level >= 12 ? 'IMPERIAL TIER' : level >= 9 ? 'FORTIFIED' : 'OUTPOST';

  return { level, stars, tierTitle, logsCount };
}

export function logShopProgress(
  state: PlanetEcosystemData,
  shopId: string,
  title: string,
  primaryValue: number,
  secondaryNote: string,
): PlanetEcosystemData {
  const cleanTitle = title.trim();
  if (!cleanTitle || Number.isNaN(primaryValue) || primaryValue < 0) {
    return state;
  }
  const shop = SECTOR_SHOPS.find((s) => s.id === shopId);
  const sectorId = shop?.sectorId ?? 'library';

  const newEntry: LoggedTrackerEntry = {
    id: `log_${Date.now()}`,
    shopId,
    title: cleanTitle,
    primaryValue,
    secondaryNote: secondaryNote.trim() || 'Logged in FF Training Room',
    timestamp: 'Just now',
  };

  return {
    ...state,
    goldReserve: state.goldReserve + 250,
    sectorBaseLevels: {
      ...state.sectorBaseLevels,
      [sectorId]: (state.sectorBaseLevels[sectorId] ?? 8) + 1,
    },
    logs: [newEntry, ...state.logs],
  };
}

export function trainArmyUnits(
  state: PlanetEcosystemData,
  unitType: keyof ArmyUnitCount,
  amount: number,
  goldCost: number,
): PlanetEcosystemData {
  if (amount <= 0 || state.goldReserve < goldCost) return state;
  return {
    ...state,
    goldReserve: state.goldReserve - goldCost,
    army: {
      ...state.army,
      [unitType]: state.army[unitType] + amount,
    },
  };
}

export function launchAsteroidOperation(
  state: PlanetEcosystemData,
  asteroidId: string,
  armyCommitted: number,
  engineersCommitted: number,
): PlanetEcosystemData {
  const totalCombatTroops =
    state.army.infantry + state.army.siegeBreakers + state.army.plasmaLancers;
  if (armyCommitted <= 0 || engineersCommitted <= 0) return state;
  if (totalCombatTroops < armyCommitted || state.army.engineers < engineersCommitted) {
    return state;
  }

  return {
    ...state,
    army: {
      ...state.army,
      infantry: Math.max(0, state.army.infantry - armyCommitted),
      engineers: Math.max(0, state.army.engineers - engineersCommitted),
    },
    asteroids: state.asteroids.map((ast) =>
      ast.id === asteroidId
        ? {
            ...ast,
            status: 'fighting',
            elapsedSec: 0,
            assignedArmy: armyCommitted,
            assignedEngineers: engineersCommitted,
          }
        : ast,
    ),
  };
}

export function advanceAsteroidPhase(
  state: PlanetEcosystemData,
  asteroidId: string,
): PlanetEcosystemData {
  let goldGain = 0;
  let mineralGain = 0;

  const updatedAsteroids = state.asteroids.map((ast) => {
    if (ast.id !== asteroidId) return ast;
    if (ast.status === 'fighting') {
      // Finish 5-minute Vanguard Fight -> transition to Engineer Mining (5h - 5d)
      return {
        ...ast,
        status: 'mining' as const,
        elapsedSec: 0,
      };
    }
    if (ast.status === 'mining') {
      goldGain = ast.estimatedYieldGold;
      mineralGain = ast.estimatedYieldMineral;
      return {
        ...ast,
        status: 'completed' as const,
        elapsedSec: ast.miningDurationHours * 3600,
      };
    }
    return ast;
  });

  return {
    ...state,
    goldReserve: state.goldReserve + goldGain,
    mineralStore: state.mineralStore + mineralGain,
    asteroids: updatedAsteroids,
  };
}

export function placeClanWarReward(
  state: PlanetEcosystemData,
  rewardId: string,
  destination: 'unplaced' | 'planet' | string,
): PlanetEcosystemData {
  return {
    ...state,
    clanRewards: state.clanRewards.map((r) =>
      r.id === rewardId ? { ...r, placedLocation: destination } : r,
    ),
  };
}

/**
 * Generates the Weekly 3D Council Meeting transcript containing strictly
 * basic planetary & sector infrastructure info (never private user logs).
 */
export function buildWeeklyCouncilTranscript(
  planetName: string,
  state: PlanetEcosystemData,
): CouncilSpeakerLine[] {
  const totalTroops =
    state.army.infantry + state.army.siegeBreakers + state.army.plasmaLancers;
  const activeMiningCount = state.asteroids.filter((a) => a.status === 'mining').length;
  const sanctumLv = computeSectorDummyLevel('sanctum', state).level;
  const libraryLv = computeSectorDummyLevel('library', state).level;
  const vaultLv = computeSectorDummyLevel('vault', state).level;
  const armyLv = computeSectorDummyLevel('army_camp', state).level;

  return [
    {
      speakerId: 'chair_sanctum',
      speakerName: 'High Archon Solon',
      trustName: 'Sovereign Headquarters Trust',
      placeName: 'Main Hall Square',
      color: '#f59e0b',
      statement: `Weekly Planetary Briefing for ${planetName}: 82% Emerald Forest coverage is stable. Headquarters Main Hall stands at Level ${sanctumLv} with ${state.clanWarWins} Clan War victories recorded.`,
    },
    {
      speakerId: 'delegate_library',
      speakerName: 'Curator Veda',
      trustName: 'Smriti Academic Trust',
      placeName: 'Smriti Library Square',
      color: '#38bdf8',
      statement: `Library Main Building & 4 Square Shops are online at Sector Level ${libraryLv}. Training Room Holographic Trackers are calibrated; private study logs remain sealed per protocol.`,
    },
    {
      speakerId: 'delegate_army',
      speakerName: 'Marshal Kael',
      trustName: 'Ares Defense Trust',
      placeName: 'Ares War Camp Square',
      color: '#ef4444',
      statement: `Army Garrison is at Level ${armyLv} with ${totalTroops} active combat troops and ${state.army.engineers} extraction engineers ready for 5-minute asteroid vanguard strikes.`,
    },
    {
      speakerId: 'delegate_vault',
      speakerName: 'Director Aurelia',
      trustName: 'Kubera Mineral Trust',
      placeName: 'Money & Mining Square',
      color: '#10b981',
      statement: `Treasury holds ${state.goldReserve.toLocaleString()} CE Gold and ${state.mineralStore.toLocaleString()} refined minerals at Level ${vaultLv}. ${activeMiningCount} asteroid extraction rig(s) are currently drilling in deep orbit.`,
    },
    {
      speakerId: 'delegate_outposts',
      speakerName: 'Envoy Lin & Commander Vance',
      trustName: 'Continental Alliance Trust',
      placeName: 'Asia & Americas Squares',
      color: '#a855f7',
      statement: `Asia Silk Citadel and Americas Sierra Redoubt Main Halls are linked via horse trail networks. All continental defense perimeters report green status.`,
    },
  ];
}
