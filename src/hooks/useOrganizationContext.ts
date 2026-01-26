"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUserContext } from "./useUserContext";
import { useCallback } from "react";

export function useOrganizationContext() {
  const { userId, user } = useUserContext();
  
  // Get user's organizations
  const organizations = useQuery(
    api.organizations.getUserOrganizations,
    userId ? { userId } : "skip"
  );

  // Get current organization
  const currentOrganization = useQuery(
    api.organizations.getCurrentOrganization,
    userId ? { userId } : "skip"
  );

  // Switch organization mutation
  const switchOrganization = useMutation(api.organizations.switchOrganization);

  // Get user's role in current organization
  const userRole = currentOrganization?.role || null;

  // Switch to a different organization
  const switchToOrganization = useCallback(
    async (organizationId: string) => {
      if (!userId) return;
      await switchOrganization({ userId, organizationId });
      // Reload to update context
      window.location.reload();
    },
    [userId, switchOrganization]
  );

  // Check if user has a specific permission/role
  const hasPermission = useCallback(
    (requiredRole: "owner" | "admin" | "agent" | "viewer") => {
      if (!userRole) return false;
      
      const roleHierarchy: Record<string, number> = {
        owner: 4,
        admin: 3,
        agent: 2,
        viewer: 1,
      };
      
      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      return userRoleLevel >= requiredRoleLevel;
    },
    [userRole]
  );

  // Check if user has an organization
  // Distinguish between:
  // - undefined: still loading (don't show modal)
  // - null: no organization (show modal)
  // - object: has organization (don't show modal)
  const hasOrganization = currentOrganization !== null && 
    (currentOrganization !== undefined || (userId && organizations !== undefined && organizations.length > 0));

  // Fix isLoading to account for userId being undefined
  // Should be loading if:
  // - userId is undefined (user context still loading)
  // - OR userId exists but queries are still loading
  const isLoading = !userId || (!!userId && (organizations === undefined || currentOrganization === undefined));

  // Add logging for debugging
  if (typeof window !== 'undefined') {
    console.log("[useOrganizationContext] State:", {
      userId,
      organizations: organizations?.length || 0,
      currentOrganization: currentOrganization ? "exists" : currentOrganization === null ? "null" : "undefined",
      hasOrganization,
      isLoading,
    });
  }

  return {
    organizations: organizations || [],
    currentOrganization,
    userRole,
    switchToOrganization,
    hasPermission,
    hasOrganization,
    isLoading,
  };
}
