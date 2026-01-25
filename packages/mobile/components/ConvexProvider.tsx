import React, { ReactNode } from 'react';
import { ConvexProviderWithAuth } from 'convex/react';
import { convex, getConvexAuthToken } from '../lib/convex';
import { useAuth } from './AuthProvider';

function useAuthForConvex() {
  const { isAuthenticated, isLoading, getAccessToken } = useAuth();

  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken: async () => {
      if (!isAuthenticated) {
        return null;
      }
      return await getAccessToken();
    },
  };
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthForConvex}>
      {children}
    </ConvexProviderWithAuth>
  );
}
