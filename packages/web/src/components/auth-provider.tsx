'use client';

import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getFirebaseAuth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function authenticationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Authentication was unsuccessful. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    queueMicrotask(() => {
      if (!active) {
        return;
      }

      try {
        unsubscribe = onIdTokenChanged(
          getFirebaseAuth(),
          (nextUser) => {
            setUser(nextUser);
            setLoading(false);
          },
          (authError) => {
            setError(authenticationErrorMessage(authError));
            setLoading(false);
          }
        );
      } catch (authError) {
        setError(authenticationErrorMessage(authError));
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      async signInWithGoogle() {
        setError(null);

        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithPopup(getFirebaseAuth(), provider);
        } catch (authError) {
          setError(authenticationErrorMessage(authError));
        }
      },
      async signOutUser() {
        setError(null);

        try {
          await signOut(getFirebaseAuth());
        } catch (authError) {
          setError(authenticationErrorMessage(authError));
        }
      },
    }),
    [error, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
