"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";

export function useUserContext() {
  const auth = useAuth();
  const workOSUser = auth.user;
  const authLoading = auth.loading ?? false;
  
  // Get our app's user record based on WorkOS authId
  const appUser = useQuery(
    api.auth.getCurrentUser,
    {},
    { enabled: !!workOSUser && !authLoading }
  );

  const isLoading = authLoading || (!!workOSUser && appUser === undefined);
  const isAuthenticated = !!workOSUser && !!appUser;

  return {
    userId: appUser?._id,
    user: appUser,
    workOSUser,
    isLoading,
    isAuthenticated,
  };
}
