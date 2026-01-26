import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveKnowledge = mutation({
  args: {
    userId: v.id("users"), // User creating the knowledge
    title: v.string(),
    content: v.string()
  },
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const organizationId = user.currentOrganizationId;

    // In real app, call action to generate embeddings
    await ctx.db.insert("knowledge_base", {
      userId: args.userId, // Keep for backward compatibility
      organizationId: organizationId, // Organization-scoped
      title: args.title,
      content: args.content,
      embedding: [], // Placeholder
      sourceType: "text",
      createdAt: Date.now(),
    });
  },
});

export const listKnowledge = query({
  args: { userId: v.id("users") }, // User making the request
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      return [];
    }
    return await ctx.db
      .query("knowledge_base")
      .withIndex("by_org", (q) => q.eq("organizationId", user.currentOrganizationId))
      .order("desc")
      .collect();
  },
});

export const deleteKnowledge = mutation({
  args: {
    userId: v.id("users"),
    id: v.id("knowledge_base")
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const knowledge = await ctx.db.get(args.id);
    if (!knowledge || knowledge.organizationId !== user.currentOrganizationId) {
      throw new Error("لم يتم العثور على المدخل أو غير مصرح لك بحذفه");
    }
    await ctx.db.delete(args.id);
  },
});
