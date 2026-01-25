import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const list = query({
  args: { userId: v.id("users") }, // User making the request
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      return [];
    }
    return await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", user.currentOrganizationId))
      .order("desc")
      .collect();
  },
});

export const getByName = query({
  args: { 
    userId: v.id("users"), // User making the request
    name: v.string() 
  },
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      return null;
    }
    return await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", user.currentOrganizationId))
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();
  },
});

export const getById = query({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    id: v.id("templates") 
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);
    if (!template || template.organizationId !== args.organizationId) {
      throw new Error("Template not found or access denied");
    }
    return template;
  },
});

export const getTemplateByName = internalQuery({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.string() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();
  },
});

export const upsert = internalMutation({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    userId: v.id("users"), // Keep for backward compatibility
    name: v.string(),
    language: v.string(),
    category: v.string(),
    status: v.string(),
    components: v.any(),
    metaTemplateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status as any,
        components: args.components,
        lastSyncedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("templates", {
        userId: args.userId, // Keep for backward compatibility
        organizationId: args.organizationId, // Organization-scoped
        name: args.name,
        language: args.language,
        category: args.category,
        status: args.status as any,
        components: args.components,
        metaTemplateId: args.metaTemplateId,
        lastSyncedAt: Date.now(),
      });
    }
  },
});

export const updateStatus = mutation({
  args: {
    userId: v.id("users"), // User making the request
    name: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const organizationId = user.currentOrganizationId;

    const template = await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();

    if (template && template.organizationId === organizationId) {
      await ctx.db.patch(template._id, {
        status: args.status as any,
        lastSyncedAt: Date.now(),
      });
    } else {
      throw new Error("Template not found or access denied");
    }
  },
});

export const deleteInternal = internalMutation({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.string() 
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();

    if (template) {
      await ctx.db.delete(template._id);
    }
  },
});

export const deleteTemplate = action({
  args: { 
    userId: v.id("users"), // User making the request
    name: v.string() 
  },
  handler: async (ctx, args): Promise<void> => {
    // Get user's current organization
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const organizationId = user.currentOrganizationId;

    // 1. Delete from Meta
    try {
      await ctx.runAction(api.whatsapp.deleteTemplate, { organizationId, name: args.name });
    } catch (e: any) {
      const errorMessage = e.message || String(e);
      console.error("Failed to delete from Meta:", errorMessage);

      // If it's a permission error, we MUST fail and tell the user
      if (errorMessage.includes("permission") || errorMessage.includes("OAuthException") || errorMessage.includes("(#100)")) {
        throw new Error("Meta Permission Error: Check WhatsApp Manager permissions. " + errorMessage);
      }

      // If it's "does not exist" or other non-critical errors, we might want to proceed.
      // But since we can't be sure if it's "not found" vs "other error", 
      // and we want strict sync, it's better to throw unless we are sure.
      // For now, we will throw for everything to ensure the user sees the issue.
      // The only exception is if we KNEW it was "not found".

      // Attempting to detect "Not Found" - this is a guess at the error string, 
      // if we can't confirm, we throw.
      if (!errorMessage.toLowerCase().includes("not found") && !errorMessage.toLowerCase().includes("does not exist")) {
        throw e;
      }

      console.log("Template might already be deleted from Meta, proceeding to sync local DB.");
    }

    // 2. Delete locally
    await ctx.runMutation(internal.templates.deleteInternal, { organizationId, name: args.name });
  },
});

export const createTemplate = action({
  args: {
    userId: v.id("users"), // User making the request
    name: v.string(),
    language: v.string(),
    category: v.string(),
    components: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get user's current organization
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const organizationId = user.currentOrganizationId;

    // 1. Create in Meta
    const res = await ctx.runAction(api.whatsapp.createTemplate, {
      organizationId, // Organization-scoped
      name: args.name,
      language: args.language,
      category: args.category,
      components: args.components,
    });

    // 2. Upsert in DB (handled by whatsapp.createTemplate calling internal.templates.upsert, 
    // but we can ensure it here if needed. 
    // Actually whatsapp.createTemplate already calls upsert. 
    // So we just return the result.)
    return res;
  }
});

export const syncFromMeta = action({
  args: {
    userId: v.id("users"), // User making the request
  },
  handler: async (ctx, args): Promise<number> => {
    // Get user's current organization
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const organizationId = user.currentOrganizationId;

    // 1. Fetch templates from Meta API
    const metaTemplates: any[] = await ctx.runAction(api.whatsapp.fetchTemplates, {
      organizationId, // Organization-scoped
    });
    const metaTemplateNames = metaTemplates.map((t: any) => t.name);

    // 2. Upsert each template into local DB
    for (const t of metaTemplates) {
      await ctx.runMutation(internal.templates.upsert, {
        organizationId, // Organization-scoped
        userId: args.userId, // Keep for backward compatibility
        name: t.name,
        language: t.language,
        category: t.category,
        status: t.status,
        components: t.components || [],
        metaTemplateId: t.id,
      });
    }

    // 3. Remove local templates that are not in Meta (scoped to organization)
    await ctx.runMutation(internal.templates.pruneLocal, { organizationId, metaTemplateNames });

    return metaTemplates.length;
  },
});

export const pruneLocal = internalMutation({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    metaTemplateNames: v.array(v.string()) 
  },
  handler: async (ctx, args) => {
    const localTemplates = await ctx.db
      .query("templates")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const local of localTemplates) {
      if (!args.metaTemplateNames.includes(local.name)) {
        await ctx.db.delete(local._id);
      }
    }
  },
});