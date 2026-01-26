"use client";
import { ReactNode, useCallback, useRef } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { AuthKitProvider, useAuth, useAccessToken } from "@workos-inc/authkit-nextjs/components";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromAuthKit}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth();
  const { accessToken, loading: tokenLoading, error: tokenError } = useAccessToken();

  // Combine loading states
  const loading = (isLoading ?? false) || (tokenLoading ?? false);

  // We are authenticated if we have both a user and an access token
  const authenticated = !!user && !!accessToken && !loading;

  // Debug authentication state
  if (typeof window !== 'undefined') {
    console.log("[ConvexClientProvider] Auth State:", {
      hasUser: !!user,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
      userLoading: isLoading,
      tokenLoading,
      tokenError,
      loading,
      authenticated
    });
  }

  // Use a ref to keep the access token stable and avoid re-creating fetchAccessToken
  const stableAccessToken = useRef<string | null>(null);

  // Update ref whenever we get a valid token
  if (accessToken) {
    stableAccessToken.current = accessToken;
  }

  const fetchAccessToken = useCallback(async () => {
    // If we have a token in the ref, return it
    if (stableAccessToken.current) {
      console.log("[ConvexClientProvider] fetchAccessToken returning cached token");
      return stableAccessToken.current;
    }
    // If we have the token directly (race condition safety), return it
    if (accessToken) {
      console.log("[ConvexClientProvider] fetchAccessToken returning direct token");
      return accessToken;
    }
    console.log("[ConvexClientProvider] fetchAccessToken returning NULL");
    return null;
  }, [accessToken]); // Added accessToken to dependency to be safe, though ref handles most cases

  return {
    isLoading: loading,
    isAuthenticated: authenticated,
    fetchAccessToken,
  };
}
