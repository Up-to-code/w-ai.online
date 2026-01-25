import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Permission constants
export const PERMISSIONS = {
  MANAGE_ORG: "manage_org",
  MANAGE_MEMBERS: "manage_members",
  MANAGE_INTEGRATIONS: "manage_integrations",
  MANAGE_CAMPAIGNS: "manage_campaigns",
  SEND_MESSAGES: "send_messages",
  VIEW_REPORTS: "view_reports",
  MANAGE_CONTACTS: "manage_contacts",
  MANAGE_TEMPLATES: "manage_templates",
  MANAGE_WORKFLOWS: "manage_workflows",
} as const;

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    PERMISSIONS.MANAGE_ORG,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.MANAGE_WORKFLOWS,
  ],
  admin: [
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.MANAGE_WORKFLOWS,
  ],
  agent: [
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CONTACTS,
  ],
  viewer: [
    PERMISSIONS.VIEW_REPORTS,
  ],
};

// Get user's role in organization
export const getUserRole = query({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    return membership?.role || null;
  },
});

// Check if user has permission
export const checkPermission = query({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    permission: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const role: string | null = await ctx.runQuery(api.permissions.getUserRole, {
      userId: args.userId,
      organizationId: args.organizationId,
    });

    if (!role) return false;

    const permissions: string[] = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(args.permission);
  },
});

// Helper function to get permissions for a role
export function getPermissionsForRole(role: string | null): string[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

// Helper function to check if role has permission
export function roleHasPermission(role: string | null, permission: string): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}
