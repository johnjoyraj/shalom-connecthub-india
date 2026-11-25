import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { platformStore, type RegisterPayload } from '../services/platformStore';
import type { UserWithRoles } from '../types/domain';

interface AuthContextValue {
  user: UserWithRoles | null;
  loading: boolean;
  isLiveSupabase: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserWithRoles>;
  quickDemoLogin: (userId: string) => Promise<UserWithRoles>;
  register: (payload: RegisterPayload) => Promise<UserWithRoles>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const current = await platformStore.getCurrentSessionUser();
      setUser(current);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await platformStore.loginWithPassword(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const quickDemoLogin = useCallback(async (userId: string) => {
    const loggedIn = await platformStore.quickDemoLogin(userId);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const created = await platformStore.registerUser(payload);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await platformStore.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLiveSupabase: platformStore.isLiveSupabase(),
        refreshUser,
        login,
        quickDemoLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
