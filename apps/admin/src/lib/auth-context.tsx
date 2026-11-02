'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminMeDto } from '@jhatpat/shared';
import { apiFetch } from './api-client';

interface AuthContextValue {
  admin: AdminMeDto | null;
  isLoading: boolean;
  error: Error | null;
  refetchAdmin: () => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: admin,
    isLoading,
    error,
    refetch: refetchAdmin,
  } = useQuery<AdminMeDto | null>({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      try {
        return await apiFetch<AdminMeDto>('/api/v1/admin/auth/me');
      } catch (err: any) {
        if (err?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const logout = async () => {
    try {
      await apiFetch('/api/v1/admin/auth/logout', { method: 'POST' });
    } catch {
      // Continue cleanup regardless
    }
    queryClient.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        admin: admin ?? null,
        isLoading,
        error: error as Error | null,
        refetchAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAdmin() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AuthProvider');
  }
  return context;
}

