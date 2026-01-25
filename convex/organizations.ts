import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

// Create organization - user becomes owner
export const createOrganization = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    slug: v.string(), // Required unique identifier in English
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate slug format: English characters, numbers, hyphens, underscores only
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slugRegex.test(args.slug)) {
      throw new Error("يجب أن يحتوي المعرف على أحرف إنجليزية وأرقام فقط");
    }

    // Normalize slug to lowercase for uniqueness check
    const normalizedSlug = args.slug.toLowerCase();

    // Check if slug already exists (case-insensitive)
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSlug))
      .first();

    if (existingOrg) {
      throw new Error("هذا المعرف مستخدم بالفعل");
    }

    // Check if user already has an organization (as owner)
    const existingMemberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Check if user is already an owner of any organization
    for (const membership of existingMemberships) {
      if (membership.role === "owner") {
        throw new Error("يمكن للمستخدم إنشاء منظمة واحدة فقط");
      }
    }

    const now = Date.now();
    
    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: normalizedSlug, // Store as lowercase for consistency
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
      ...(args.email && { email: args.email }),
      ...(args.phone && { phone: args.phone }),
      ...(args.website && { website: args.website }),
    });

    // Add creator as owner
    await ctx.db.insert("organizationMembers", {
      organizationId: orgId,
      userId: args.userId,
      role: "owner",
      joinedAt: now,
    });

    // Set as user's current organization
    await ctx.db.patch(args.userId, {
      currentOrganizationId: orgId,
    });

    return orgId;
  },
});

// Get organization by ID
export const getOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});

// Get organization by slug
export const getOrganizationBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug.toLowerCase()))
      .first();
  },
});

// List all organizations (for admin/internal use)
export const listAll = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .collect();
  },
});

// Get user's organizations
export const getUserOrganizations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        if (!org) return null;
        return {
          ...org,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return orgs.filter((org) => org !== null);
  },
});

// Get current organization for user
export const getCurrentOrganization = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // If user has a current organization, return it
    if (user.currentOrganizationId) {
      const org = await ctx.db.get(user.currentOrganizationId);
      if (!org) return null;

      // Get user's role in this org
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org_user", (q) =>
          q.eq("organizationId", org._id).eq("userId", args.userId)
        )
        .first();

      return {
        ...org,
        role: membership?.role || null,
      };
    }

    // If no current org, try to get first organization (read-only, don't update)
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (memberships) {
      const org = await ctx.db.get(memberships.organizationId);
      if (org) {
        return { ...org, role: memberships.role };
      }
    }
    
    return null;
  },
});

// Update organization (owner only)
export const updateOrganization = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    logo: v.optional(v.string()),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check permission - only owner can edit organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("فقط مالك المنظمة يمكنه تعديل هذه الإعدادات");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.website !== undefined) updates.website = args.website;
    if (args.logo !== undefined) updates.logo = args.logo;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.language !== undefined) updates.language = args.language;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.organizationId, updates);
    return true;
  },
});

// Switch user's current organization
export const switchOrganization = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Verify user is member of this org
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!membership) {
      throw new Error("أنت لست عضواً في هذه المنظمة");
    }

    await ctx.db.patch(args.userId, {
      currentOrganizationId: args.organizationId,
    });

    return true;
  },
});

// Add member to organization (owner/admin only)
export const addMember = mutation({
  args: {
    userId: v.id("users"), // User performing the action
    organizationId: v.id("organizations"),
    newUserId: v.id("users"), // User to add
    role: v.union(v.literal("admin"), v.literal("agent"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    // Check permission
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("ليس لديك صلاحية لإضافة أعضاء");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.newUserId)
      )
      .first();

    if (existing) {
      throw new Error("المستخدم عضو بالفعل في هذه المنظمة");
    }

    await ctx.db.insert("organizationMembers", {
      organizationId: args.organizationId,
      userId: args.newUserId,
      role: args.role,
      joinedAt: Date.now(),
      invitedBy: args.userId,
    });

    return true;
  },
});

// Remove member from organization (owner/admin only)
export const removeMember = mutation({
  args: {
    userId: v.id("users"), // User performing the action
    organizationId: v.id("organizations"),
    memberUserId: v.id("users"), // User to remove
  },
  handler: async (ctx, args) => {
    // Check permission
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("ليس لديك صلاحية لإزالة أعضاء");
    }

    // Cannot remove owner
    const memberToRemove = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.memberUserId)
      )
      .first();

    if (memberToRemove?.role === "owner") {
      throw new Error("لا يمكن إزالة مالك المنظمة");
    }

    if (memberToRemove) {
      await ctx.db.delete(memberToRemove._id);
    }

    // If removed user had this as current org, clear it
    const removedUser = await ctx.db.get(args.memberUserId);
    if (removedUser?.currentOrganizationId === args.organizationId) {
      await ctx.db.patch(args.memberUserId, {
        currentOrganizationId: undefined,
      });
    }

    return true;
  },
});

// Update member role (owner only)
export const updateMemberRole = mutation({
  args: {
    userId: v.id("users"), // User performing the action
    organizationId: v.id("organizations"),
    memberUserId: v.id("users"), // User whose role to update
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("agent"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    // Check permission - only owner can change roles
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId)
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("فقط مالك المنظمة يمكنه تغيير الأدوار");
    }

    const memberToUpdate = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.memberUserId)
      )
      .first();

    if (!memberToUpdate) {
      throw new Error("المستخدم غير موجود في هذه المنظمة");
    }

    await ctx.db.patch(memberToUpdate._id, {
      role: args.role,
    });

    return true;
  },
});

// Get organization members
export const getMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;
        return {
          ...user,
          role: membership.role,
          joinedAt: membership.joinedAt,
          invitedBy: membership.invitedBy,
        };
      })
    );

    return members.filter((member) => member !== null);
  },
});

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
