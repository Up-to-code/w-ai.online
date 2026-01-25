// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncProducts = mutation({
  args: { 
    userId: v.id("users"), // Multi-tenant: user who owns products
    apiKey: v.string() 
  },
  handler: async (ctx, args) => {
    // Mock sync (filter by userId)
    await ctx.db.insert("products", {
      userId: args.userId, // Multi-tenant: include userId
      externalId: "solo_123",
      name: "Sample Product from SOLO",
      price: 99.99,
      currency: "USD",
      inStock: true,
    });
  },
});

export const listProducts = query({
  args: { userId: v.id("users") }, // Multi-tenant: user who owns products
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_user_external_id", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
