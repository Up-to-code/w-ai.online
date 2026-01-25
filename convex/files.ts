import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});


export const saveFile = mutation({
  args: {
    userId: v.id("users"), // Multi-tenant: user who owns this file
    storageId: v.string(),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    category: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<{ fileId: Id<"files">; url: string | null }> => {
    return await ctx.runMutation((internal as any).filesInternal.saveFileRecord, {
      userId: args.userId, // Multi-tenant: pass userId
      storageId: args.storageId,
      name: args.name,
      mimeType: args.mimeType,
      size: args.size,
      category: args.category,
    });
  },
});

export const list = query({
  args: {
    userId: v.id("users"), // Multi-tenant: user who owns files
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    if (args.category) {
      return await baseQuery
        .filter((q: any) => q.eq(q.field("category"), args.category))
        .order("desc")
        .collect();
    }
    return await baseQuery.order("desc").collect();
  }
});

export const saveExternalImage = action({
  args: {
    userId: v.id("users"), // Multi-tenant: user who owns this file
    url: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<{ storageId: string; fileId: Id<"files">; mimeType: string }> => {
    // 1. Fetch the image
    const response = await fetch(args.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();

    // 2. Store in Convex Storage
    const storageId = await ctx.storage.store(blob);

    // 3. Save Metadata via Mutation
    const { fileId, url } = await ctx.runMutation((internal as any).filesInternal.saveFileRecord, {
      userId: args.userId, // Multi-tenant: pass userId
      storageId,
      name: args.name,
      mimeType: blob.type || "image/jpeg",
      size: blob.size,
      category: "product",
    });

    return { storageId, fileId, mimeType: blob.type || "image/jpeg" };
  },
});
