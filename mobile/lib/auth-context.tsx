import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "./api";
import { clearStoredToken, getStoredToken, setStoredToken } from "./storage";
import type { User } from "./types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: {
    email: string;
    password: string;
    name: string;
    surname: string;
    birthDay: number;
    birthMonth: number;
    birthYear: number;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  applyUser: (next: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback(
    async (nextToken: string, nextUser: User) => {
      await setStoredToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const stored = await getStoredToken();
    if (!stored) {
      setToken(null);
      setUser(null);
      return;
    }
    const { user: me } = await api.me(stored);
    if (!me) {
      await clearStoredToken();
      setToken(null);
      setUser(null);
      return;
    }
    setToken(stored);
    setUser(me);
  }, []);

  useEffect(() => {
    refreshUser()
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { token: t, user: u } = await api.login(email, password);
      if (!t) {
        throw new Error("Sunucu oturum jetonu döndürmedi.");
      }
      await persistSession(t, u);
    },
    [persistSession],
  );

  const signUp = useCallback(
    async (payload: {
      email: string;
      password: string;
      name: string;
      surname: string;
      birthDay: number;
      birthMonth: number;
      birthYear: number;
    }) => {
      const { token: t, user: u } = await api.register(payload);
      if (!t) {
        throw new Error("Sunucu oturum jetonu döndürmedi.");
      }
      await persistSession(t, u);
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const applyUser = useCallback((next: User) => {
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      applyUser,
    }),
    [user, token, loading, signIn, signUp, signOut, refreshUser, applyUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
