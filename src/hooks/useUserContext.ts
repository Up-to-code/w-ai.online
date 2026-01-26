"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useEffect, useState } from "react";

export function useUserContext() {
  const auth = useAuth();
  const workOSUser = auth.user;
  const authLoading = auth.loading ?? false;

  const [isSyncing, setIsSyncing] = useState(false);
  const ensureUserExists = useMutation(api.auth.ensureUserExists);

  // Get our app's user record based on WorkOS authId
  const appUser = useQuery(
    api.auth.getCurrentUser,
    {},
    { enabled: !!workOSUser && !authLoading }
  );

  // Sync user if missing in DB but exists in WorkOS
  useEffect(() => {
    async function syncUser() {
      if (workOSUser && appUser === null && !isSyncing) {
        setIsSyncing(true);
        try {
          await ensureUserExists({
            authId: workOSUser.id,
            email: workOSUser.email,
            firstName: workOSUser.firstName || undefined,
            lastName: workOSUser.lastName || undefined,
            // WorkOS user object handles image, but we need phone from raw data if available usually
            // For now simple sync
          });
        } catch (error) {
          console.error("Failed to sync user:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    }

    if (!authLoading && workOSUser && appUser === null) {
      syncUser();
    }
  }, [workOSUser, appUser, authLoading, ensureUserExists]); // Removed isSyncing to prevent loop

  const isLoading = authLoading || isSyncing || (!!workOSUser && appUser === undefined);
  const isAuthenticated = !!workOSUser && !!appUser;

  return {
    userId: appUser?._id,
    user: appUser,
    workOSUser,
    isLoading,
    isAuthenticated,
  };
}
