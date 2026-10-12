import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
  powerOutput: number;   // kW
  batteryLevel: number;  // 0–100
  gridStatus: 'online' | 'offline' | 'degraded';
  level: number;
  score: number;
  updatedAt: unknown;
};

export const DEFAULT_PROGRESS: Omit<GameProgress, 'updatedAt'> = {
  powerOutput: 4.2,
  batteryLevel: 87,
  gridStatus: 'online',
  level: 1,
  score: 0,
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

export async function touchLastSeen(uid: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), { lastSeenAt: serverTimestamp() });
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
  await updateDoc(doc(db, 'users', uid, 'game', 'progress'), {
    ...progress,
    updatedAt: serverTimestamp(),
  });
}
