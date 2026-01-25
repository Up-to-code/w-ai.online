// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logWhatsappWebhook = internalMutation({
  args: { 
    userId: v.optional(v.id("users")), // Multi-tenant: optional (may not be identified yet)
    body: v.any() 
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("webhook_events", {
      source: "whatsapp",
      body: args.body,
      createdAt: Date.now(),
      // Note: webhook_events table doesn't have userId in schema, but we can add it if needed
    });
  },
});

export const latestWhatsappWebhook = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("webhook_events")
      .withIndex("by_source_createdAt", (q) => q.eq("source", "whatsapp"))
      .order("desc")
      .first();
  },
});

