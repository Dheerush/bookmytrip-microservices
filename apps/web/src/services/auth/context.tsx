"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { LoginData } from './auth.types';
import {
  clearAccessToken,
  clearSessionActivity,
  getAccessToken,
  getLastSessionActivity,
  refreshAccessToken,
  setAccessToken,
  touchSessionActivity,
} from '@/lib/auth-session';
import { showToast } from '@/lib/toast';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setAuth: (data: LoginData) => void;
  logout: () => void;
  /** Check if session is still valid (token exists & not expired) */
  checkSession: () => boolean;
}

const ACTIVE_WINDOW_MS = 15 * 60 * 1000; // refresh only when user was active recently
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;
const AUTH_USER_KEY = 'user';
const FORCE_LOGOUT_GUARD_KEY = 'bmt_force_logout_dispatched';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredAuth = (): { user: AuthUser | null; token: string | null } => {
  if (typeof window === 'undefined') return { user: null, token: null };

  const storedToken = getAccessToken();
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  if (!storedToken || !storedUser) return { user: null, token: null };

  try {
    const parsedUser = JSON.parse(storedUser) as AuthUser;
    touchSessionActivity();
    return { user: parsedUser, token: storedToken };
  } catch {
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialAuth = readStoredAuth();
  const [user, setUser] = useState<AuthUser | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrapAuth = async () => {
      const storedUserRaw = localStorage.getItem(AUTH_USER_KEY);
      const storedToken = getAccessToken();

      if (!storedUserRaw) {
        if (active) setHydrated(true);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUserRaw) as AuthUser;
        if (active) {
          setUser(parsedUser);
        }

        const refreshedToken = await refreshAccessToken().catch(() => null);
        if (active && refreshedToken) {
          setToken(refreshedToken);
        } else if (active && !storedToken) {
          // No usable token and refresh also failed: clear stale user shell.
          setUser(null);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      } catch {
        if (active) {
          setUser(null);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      } finally {
        if (active) setHydrated(true);
      }
    };

    void bootstrapAuth();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const activityHandler = () => touchSessionActivity();
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('click', activityHandler);
    window.addEventListener('scroll', activityHandler, { passive: true });

    const intervalId = window.setInterval(() => {
      const lastActiveAt = getLastSessionActivity();
      const isRecentlyActive = lastActiveAt > 0 && Date.now() - lastActiveAt <= ACTIVE_WINDOW_MS;
      if (!isRecentlyActive) return;
      void refreshAccessToken().then((nextToken) => {
        if (nextToken) {
          setToken(nextToken);
        }
      });
    }, KEEP_ALIVE_INTERVAL_MS);

    return () => {
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('scroll', activityHandler);
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_USER_KEY && event.key !== 'accessToken') return;

      const next = readStoredAuth();
      setUser(next.user);
      setToken(next.token);
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setAuth = useCallback((data: LoginData) => {
    const authUser: AuthUser = {
      ...data.user,
      fullName: (data.user as AuthUser).fullName,
      avatarUrl: (data.user as AuthUser).avatarUrl,
    };
    setUser(authUser);
    setToken(data.accessToken);
    setAccessToken(data.accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    sessionStorage.removeItem(FORCE_LOGOUT_GUARD_KEY);
    touchSessionActivity();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAccessToken();
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(FORCE_LOGOUT_GUARD_KEY);
    clearSessionActivity();
  }, []);

  // Listen for forced logout events dispatched by the axios interceptor on token refresh failure
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
      clearAccessToken();
      localStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(FORCE_LOGOUT_GUARD_KEY);
      clearSessionActivity();
      showToast.error('Your session has expired. Please sign in again.');
      // Hard redirect so all stale state is cleared
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:force-logout', handleForceLogout);
    return () => window.removeEventListener('auth:force-logout', handleForceLogout);
  }, []);

  const checkSession = useCallback(() => {
    if (!token) return false;
    touchSessionActivity();
    return true;
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, hydrated, setAuth, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};