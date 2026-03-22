"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { LoginData } from './auth.types';

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

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('accessToken');
    const storedUser = sessionStorage.getItem('user');
    const loginTime = sessionStorage.getItem('loginTime');

    if (storedToken && storedUser) {
      // Check session expiration
      if (loginTime && Date.now() - Number(loginTime) > SESSION_TIMEOUT) {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('loginTime');
      } else {
        setToken(storedToken);
        try { setUser(JSON.parse(storedUser)); } catch { /* skip */ }
      }
    }
    setHydrated(true);
  }, []);

  const setAuth = useCallback((data: LoginData) => {
    const authUser: AuthUser = {
      ...data.user,
      fullName: (data.user as AuthUser).fullName,
      avatarUrl: (data.user as AuthUser).avatarUrl,
    };
    setUser(authUser);
    setToken(data.accessToken);
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('user', JSON.stringify(authUser));
    sessionStorage.setItem('loginTime', String(Date.now()));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('loginTime');
  }, []);

  const checkSession = useCallback(() => {
    const loginTime = sessionStorage.getItem('loginTime');
    if (!token || !loginTime) return false;
    if (Date.now() - Number(loginTime) > SESSION_TIMEOUT) {
      logout();
      return false;
    }
    return true;
  }, [token, logout]);

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