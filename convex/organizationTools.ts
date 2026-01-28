// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Available tools that can be activated per organization
export const AVAILABLE_TOOLS = [
    { id: "bookings", name: "نظام الحجوزات", description: "إدارة المواعيد والحجوزات" },
    { id: "products", name: "المنتجات والخدمات", description: "إدارة المنتجات والأسعار" },
    { id: "campaigns", name: "الحملات التسويقية", description: "إدارة الحملات الجماعية" },
] as const;

// List all tools for the organization (active and inactive)
export const list = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        const organizationId = user.currentOrganizationId;

        return await ctx.db
            .query("organizationTools")
            .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
            .collect();
    },
});

// Get only active tools (for sidebar visibility)
export const getActiveTools = query({
    args: {
        userId: v.id("users"), // Required - no more optional
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        const organizationId = user.currentOrganizationId;

        const tools = await ctx.db
            .query("organizationTools")
            .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
            .collect();

        return tools.filter(t => t.isActive);
    },
});

// Toggle tool activation (owner/admin only)
export const toggle = mutation({
    args: {
        userId: v.id("users"),
        toolId: v.string(),
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }
        const organizationId = user.currentOrganizationId;

        // Permission check: only owner/admin can toggle tools
        const membership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_org_user", (q) =>
                q.eq("organizationId", organizationId).eq("userId", args.userId)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("غير مصرح لك بتفعيل الأدوات");
        }

        const existing = await ctx.db
            .query("organizationTools")
            .withIndex("by_org_tool", (q) =>
                q.eq("organizationId", organizationId).eq("toolId", args.toolId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                isActive: args.isActive,
                activatedAt: args.isActive ? Date.now() : existing.activatedAt,
                activatedBy: args.userId,
            });
        } else {
            await ctx.db.insert("organizationTools", {
                organizationId,
                toolId: args.toolId,
                isActive: args.isActive,
                aiEnabled: false,
                activatedAt: Date.now(),
                activatedBy: args.userId,
            });
        }
    },
});

// Toggle AI access for a tool (owner/admin only)
export const toggleAi = mutation({
    args: {
        userId: v.id("users"),
        toolId: v.string(),
        aiEnabled: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }
        const organizationId = user.currentOrganizationId;

        // Permission check: only owner/admin can toggle AI
        const membership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_org_user", (q) =>
                q.eq("organizationId", organizationId).eq("userId", args.userId)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("غير مصرح لك بتعديل إعدادات الذكاء الاصطناعي");
        }

        const existing = await ctx.db
            .query("organizationTools")
            .withIndex("by_org_tool", (q) =>
                q.eq("organizationId", organizationId).eq("toolId", args.toolId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                aiEnabled: args.aiEnabled,
            });
        } else {
            await ctx.db.insert("organizationTools", {
                organizationId,
                toolId: args.toolId,
                isActive: true,
                aiEnabled: args.aiEnabled,
                activatedAt: Date.now(),
                activatedBy: args.userId,
            });
        }
    },
});

// Check if user can manage tools (for UI)
export const canManageTools = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return false;
        }

        const membership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_org_user", (q) =>
                q.eq("organizationId", user.currentOrganizationId).eq("userId", args.userId)
            )
            .first();

        return membership && ["owner", "admin"].includes(membership.role);
    },
});
