import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get user settings
export const getUserSettings = query({
  args: {
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const orgId = args.organizationId || user.currentOrganizationId;
    
    // Get user settings for this organization
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", args.userId).eq("organizationId", orgId)
      )
      .first();

    // Get organization to determine plan-based defaults
    let organization = null;
    if (orgId) {
      organization = await ctx.db.get(orgId);
    }

    // Determine AI Auto Response default based on plan
    const plan = organization?.subscriptionPlan || "free";
    const aiAutoResponseDefault = plan === "free" || plan === "startup" ? false : true;

    return {
      notificationsEnabled: settings?.notificationsEnabled ?? true,
      globalNotificationsEnabled: settings?.globalNotificationsEnabled ?? true,
      soundEnabled: settings?.soundEnabled ?? true,
      emailEnabled: settings?.emailEnabled ?? false,
      aiAutoResponseEnabled: settings?.aiAutoResponseEnabled ?? aiAutoResponseDefault,
      language: settings?.language || "ar",
      timezone: settings?.timezone || "Asia/Riyadh",
      currentPlan: plan,
    };
  },
});

// Update user settings
export const updateUserSettings = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    notificationsEnabled: v.optional(v.boolean()),
    globalNotificationsEnabled: v.optional(v.boolean()),
    soundEnabled: v.optional(v.boolean()),
    emailEnabled: v.optional(v.boolean()),
    aiAutoResponseEnabled: v.optional(v.boolean()),
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const orgId = args.organizationId || user.currentOrganizationId;
    if (!orgId) {
      throw new Error("Organization required");
    }

    // Get existing settings
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", args.userId).eq("organizationId", orgId)
      )
      .first();

    const now = Date.now();
    const updateData: any = {
      updatedAt: now,
    };

    if (args.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = args.notificationsEnabled;
    }
    if (args.globalNotificationsEnabled !== undefined) {
      updateData.globalNotificationsEnabled = args.globalNotificationsEnabled;
    }
    if (args.soundEnabled !== undefined) {
      updateData.soundEnabled = args.soundEnabled;
    }
    if (args.emailEnabled !== undefined) {
      updateData.emailEnabled = args.emailEnabled;
    }
    if (args.aiAutoResponseEnabled !== undefined) {
      updateData.aiAutoResponseEnabled = args.aiAutoResponseEnabled;
    }
    if (args.language !== undefined) {
      updateData.language = args.language;
    }
    if (args.timezone !== undefined) {
      updateData.timezone = args.timezone;
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("userSettings", {
        userId: args.userId,
        organizationId: orgId,
        ...updateData,
      });
    }

    // Sync AI Auto Response setting to ai_configs if changed
    if (args.aiAutoResponseEnabled !== undefined) {
      const aiConfig = await ctx.db
        .query("ai_configs")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .first();
      
      if (aiConfig) {
        await ctx.db.patch(aiConfig._id, {
          isActive: args.aiAutoResponseEnabled,
          updatedAt: Date.now(),
        });
      } else {
        // Create AI config if it doesn't exist
        await ctx.db.insert("ai_configs", {
          userId: args.userId,
          organizationId: orgId,
          systemPrompt: "You are a helpful sales assistant for a store. You can search for products and help customers find what they need. Answer concisely.",
          model: "arcee-ai/trinity-mini:free",
          isActive: args.aiAutoResponseEnabled,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

// Get organization settings
export const getOrganizationSettings = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    return {
      subscriptionPlan: organization.subscriptionPlan || "free",
      subscriptionStatus: organization.subscriptionStatus || "active",
      subscriptionExpiresAt: organization.subscriptionExpiresAt,
      timezone: organization.timezone,
      language: organization.language,
    };
  },
});
