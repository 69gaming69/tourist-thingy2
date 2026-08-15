"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getStoredToken } from "@/lib/api";
import {
  continueAsGuest as continueAsGuestRequest,
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutClient,
  register as registerRequest,
  type AuthUser,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setReady(true);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        logoutClient();
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginRequest(username, password);
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const data = await registerRequest(username, password);
    setUser(data.user);
  }, []);

  const continueAsGuest = useCallback(async () => {
    const data = await continueAsGuestRequest();
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    logoutClient();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, continueAsGuest, logout }),
    [user, ready, login, register, continueAsGuest, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
