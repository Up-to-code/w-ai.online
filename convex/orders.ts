// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) return [];

        return await ctx.db
            .query("orders")
            .withIndex("by_org", (q) => q.eq("organizationId", user.currentOrganizationId))
            .order("desc")
            .collect();
    },
});

export const create = mutation({
    args: {
        orderNumber: v.string(),
        customerName: v.string(),
        customerPhone: v.optional(v.string()),
        amount: v.number(),
        currency: v.string(),
        items: v.any(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("orders", {
            ...args,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const updateStatus = mutation({
    args: {
        id: v.id("orders"),
        status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled"), v.literal("refunded")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { status: args.status });
    },
});
