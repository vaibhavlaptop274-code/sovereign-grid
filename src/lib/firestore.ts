import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserProfile = {
  uid: string;
  email: string;
  createdAt: unknown;
  lastSeenAt: unknown;
};

export type GameProgress = {
  cosmicEnergy: number;         // Total DevPoints earned from trackers
  planetLevel: number;          // Starts at 0, evolves to 5
  ownedPlanetId: string | null; // Which ancient Earth planet this player claimed (1 per player)
  hasCompletedSetup: boolean;
  armyLevel: number;
  updatedAt: unknown;
};

export type PlanetOwnership = {
  planetId: string;
  ownerUid: string;
  ownerEmail: string;
  ownerName: string;
  planetLevel: number;
  cosmicEnergy: number;
  customModelUrl?: string;
  updatedAt: unknown;
};

export const DEFAULT_PROGRESS: Omit<GameProgress, 'updatedAt'> = {
  cosmicEnergy: 0,
  planetLevel: 0,
  ownedPlanetId: null,
  hasCompletedSetup: false,
  armyLevel: 1,
};

const LOCAL_PROGRESS_PREFIX = 'sovereign_grid_progress_';
const LOCAL_PLANETS_KEY = 'sovereign_grid_planets_map';
const LOCAL_TOTAL_PLANETS_KEY = 'sovereign_grid_total_planets';

function getLocalPlanetsMap(): Record<string, PlanetOwnership> {
  try {
    const raw = localStorage.getItem(LOCAL_PLANETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPlanetsMap(map: Record<string, PlanetOwnership>) {
  try {
    localStorage.setItem(LOCAL_PLANETS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export async function createUserProfile(uid: string, email: string): Promise<void> {
  if (!db) {
    try {
      const key = LOCAL_PROGRESS_PREFIX + uid;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(
          key,
          JSON.stringify({ ...DEFAULT_PROGRESS, updatedAt: Date.now() }),
        );
      }
    } catch {
      // ignore
    }
    return;
  }
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    uid,
    email,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  } satisfies Omit<UserProfile, 'createdAt' | 'lastSeenAt'> & { createdAt: unknown; lastSeenAt: unknown });

  await setDoc(doc(db, 'users', uid, 'game', 'progress'), {
    ...DEFAULT_PROGRESS,
    updatedAt: serverTimestamp(),
  });
}

export async function touchLastSeen(uid: string, email?: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email: email ?? '',
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
    return;
  }
  await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true });
}

export async function getGameProgress(uid: string): Promise<GameProgress | null> {
  if (!db) {
    try {
      const raw = localStorage.getItem(LOCAL_PROGRESS_PREFIX + uid);
      if (raw) return JSON.parse(raw) as GameProgress;
      return { ...DEFAULT_PROGRESS, updatedAt: Date.now() };
    } catch {
      return { ...DEFAULT_PROGRESS, updatedAt: Date.now() };
    }
  }
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'game', 'progress'));
    return snap.exists()
      ? (snap.data() as GameProgress)
      : { ...DEFAULT_PROGRESS, updatedAt: Date.now() };
  } catch {
    return { ...DEFAULT_PROGRESS, updatedAt: Date.now() };
  }
}

export async function saveGameProgress(
  uid: string,
  progress: Partial<Omit<GameProgress, 'updatedAt'>>,
): Promise<void> {
  try {
    const existingRaw = localStorage.getItem(LOCAL_PROGRESS_PREFIX + uid);
    const existing = existingRaw ? JSON.parse(existingRaw) : DEFAULT_PROGRESS;
    localStorage.setItem(
      LOCAL_PROGRESS_PREFIX + uid,
      JSON.stringify({ ...DEFAULT_PROGRESS, ...existing, ...progress, updatedAt: Date.now() }),
    );
  } catch {
    // ignore
  }

  if (!db) return;
  await setDoc(
    doc(db, 'users', uid, 'game', 'progress'),
    {
      ...DEFAULT_PROGRESS,
      ...progress,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getAllPlanetOwnerships(): Promise<Record<string, PlanetOwnership>> {
  const localMap = getLocalPlanetsMap();
  if (!db) return localMap;

  try {
    const snap = await getDocs(collection(db, 'planets'));
    const result: Record<string, PlanetOwnership> = { ...localMap };
    snap.forEach((docSnap) => {
      result[docSnap.id] = docSnap.data() as PlanetOwnership;
    });
    return result;
  } catch {
    return localMap;
  }
}

export async function claimPlanetForUser(
  uid: string,
  email: string,
  planetId: string,
): Promise<{ ok: boolean; error?: string; ownership?: PlanetOwnership }> {
  const allOwnerships = await getAllPlanetOwnerships();

  // Check if planet is already claimed by another user
  const existingPlanetOwner = allOwnerships[planetId];
  if (existingPlanetOwner && existingPlanetOwner.ownerUid !== uid) {
    return {
      ok: false,
      error: `This planet is already claimed by ${existingPlanetOwner.ownerName}.`,
    };
  }

  // Check if user already claimed a different planet
  const userAlreadyOwns = Object.values(allOwnerships).find((p) => p.ownerUid === uid);
  if (userAlreadyOwns && userAlreadyOwns.planetId !== planetId) {
    return {
      ok: false,
      error: `You already rule ${userAlreadyOwns.planetId.toUpperCase()}. Each player can only claim one planet.`,
    };
  }

  const ownerName = email ? email.split('@')[0] : 'Sovereign';
  const progress = await getGameProgress(uid);

  const ownership: PlanetOwnership = {
    planetId,
    ownerUid: uid,
    ownerEmail: email,
    ownerName,
    planetLevel: progress?.planetLevel ?? 0,
    cosmicEnergy: progress?.cosmicEnergy ?? 0,
    updatedAt: Date.now(),
  };

  // Save locally for instant responsiveness
  const updatedLocal = { ...allOwnerships, [planetId]: ownership };
  saveLocalPlanetsMap(updatedLocal);
  await saveGameProgress(uid, { ownedPlanetId: planetId });

  if (db) {
    try {
      await setDoc(doc(db, 'planets', planetId), {
        ...ownership,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Fallback already saved in localStorage
    }
  }

  return { ok: true, ownership };
}

export async function getTotalPlanetsCount(): Promise<number> {
  let localCount = 8;
  try {
    const saved = localStorage.getItem(LOCAL_TOTAL_PLANETS_KEY);
    if (saved) localCount = Math.max(1, Math.min(8, parseInt(saved, 10) || 8));
  } catch {
    // ignore
  }
  if (!db) return localCount;

  try {
    const snap = await getDoc(doc(db, 'config', 'solar_system'));
    if (snap.exists() && typeof snap.data().total_planets === 'number') {
      return Math.max(1, Math.min(8, snap.data().total_planets));
    }
  } catch {
    // ignore
  }
  return localCount;
}

export async function setTotalPlanetsCount(count: number): Promise<void> {
  const clamped = Math.max(1, Math.min(8, Math.round(count)));
  try {
    localStorage.setItem(LOCAL_TOTAL_PLANETS_KEY, String(clamped));
  } catch {
    // ignore
  }
  if (!db) return;
  try {
    await setDoc(
      doc(db, 'config', 'solar_system'),
      { total_planets: clamped, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // ignore
  }
}
