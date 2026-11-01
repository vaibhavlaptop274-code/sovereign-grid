import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, touchLastSeen } from '@/lib/firestore';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'sovereign_grid_local_user';

function createLocalUser(email: string): User {
  const uid = 'local_' + email.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    uid,
    email,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'local-token',
    getIdTokenResult: async () => ({
      token: 'local-token',
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {},
    }),
    reload: async () => {},
    toJSON: () => ({ uid, email }),
    displayName: email.split('@')[0],
    phoneNumber: null,
    photoURL: null,
    providerId: 'password',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (auth) return null;
    try {
      const savedEmail = localStorage.getItem(LOCAL_USER_KEY);
      return savedEmail ? createLocalUser(savedEmail) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(auth !== null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      const localUser = createLocalUser(email);
      try {
        localStorage.setItem(LOCAL_USER_KEY, email);
      } catch {
        // ignore storage errors
      }
      setUser(localUser);
      return { error: null };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Fire-and-forget: update last seen timestamp
      touchLastSeen(cred.user.uid, cred.user.email ?? email);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) {
      const localUser = createLocalUser(email);
      try {
        localStorage.setItem(LOCAL_USER_KEY, email);
      } catch {
        // ignore storage errors
      }
      setUser(localUser);
      return { error: null };
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Create the player's Firestore profile + initial game progress
      await createUserProfile(cred.user.uid, cred.user.email ?? email);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Sign up failed' };
    }
  };

  const signOut = async () => {
    if (!auth) {
      try {
        localStorage.removeItem(LOCAL_USER_KEY);
      } catch {
        // ignore storage errors
      }
      setUser(null);
      return;
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
