import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update user profile
// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    // Validate user exists
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("المستخدم غير موجود");

    // Check if user is trying to update their own profile or has admin rights
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Verify identity matches the user being updated
    if (user.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Unauthorized");
    }

    // Do not allow email updates via this mutation
    // Explicitly exclude email even if passed
    const { email, ...safeUpdates } = updates;

    await ctx.db.patch(userId, safeUpdates);
    return true;
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId))
    );

    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("agent"), v.literal("user"))
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    await ctx.db.patch(args.userId, { role: args.role });
    return true;
  },
});
