import {
  doc,
  getDoc,
  setDoc,
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
  cosmicEnergy: number;        // Total points earned from trackers
  planetLevel: number;         // Starts at 0 (barren planet)
  ownedPlanetId: string | null; // Which planet they claimed from the Solar System
  hasCompletedSetup: boolean;  // True after they create their first tracker on MyTube
  armyLevel: number;           // Used for asteroid creature fights & clan wars
  updatedAt: unknown;
};

export const DEFAULT_PROGRESS: Omit<GameProgress, 'updatedAt'> = {
  cosmicEnergy: 0,
  planetLevel: 0,
  ownedPlanetId: null,
  hasCompletedSetup: false,
  armyLevel: 1,
};

export async function createUserProfile(uid: string, email: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    uid,
    email,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  } satisfies Omit<UserProfile, 'createdAt' | 'lastSeenAt'> & { createdAt: unknown; lastSeenAt: unknown });

  // Initialise game progress sub-document
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
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid, 'game', 'progress'));
  return snap.exists() ? (snap.data() as GameProgress) : null;
}

export async function saveGameProgress(
  uid: string,
  progress: Partial<Omit<GameProgress, 'updatedAt'>>,
): Promise<void> {
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
