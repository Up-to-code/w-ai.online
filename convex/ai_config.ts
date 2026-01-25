import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getConfig = query({
  args: { userId: v.id("users") }, // User making the request
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      return {
        systemPrompt: "You are a helpful sales assistant for a store. You can search for products and help customers find what they need. Answer concisely.",
        model: "arcee-ai/trinity-mini:free",
        isActive: false, // Default off for free plan
      };
    }
    
    const organizationId = user.currentOrganizationId;
    const organization = await ctx.db.get(organizationId);
    
    // Get AI config
    const config = await ctx.db
      .query("ai_configs")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .first();
    
    // Get user settings for AI auto response preference
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", args.userId).eq("organizationId", organizationId)
      )
      .first();
    
    // Determine plan-based default
    const plan = organization?.subscriptionPlan || "free";
    const planBasedDefault = plan === "free" || plan === "startup" ? false : true;
    
    // Use user setting if exists, otherwise use plan-based default
    const isActive = userSettings?.aiAutoResponseEnabled ?? 
                     (config?.isActive ?? planBasedDefault);
    
    return {
      systemPrompt: config?.systemPrompt || "You are a helpful sales assistant for a store. You can search for products and help customers find what they need. Answer concisely.",
      model: config?.model || "arcee-ai/trinity-mini:free",
      isActive: isActive,
    };
  },
});

export const updateConfig = mutation({
  args: {
    userId: v.id("users"), // User making the request
    systemPrompt: v.string(),
    model: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const organizationId = user.currentOrganizationId;

    const existing = await ctx.db
      .query("ai_configs")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        systemPrompt: args.systemPrompt,
        model: args.model,
        isActive: args.isActive,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("ai_configs", {
        userId: args.userId, // Keep for backward compatibility
        organizationId: organizationId, // Organization-scoped
        systemPrompt: args.systemPrompt,
        model: args.model,
        isActive: args.isActive,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getInternalConfig = query({
    args: { organizationId: v.id("organizations") }, // Organization-scoped
    handler: async (ctx, args) => {
        return await ctx.db
          .query("ai_configs")
          .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
          .first();
    }
});
