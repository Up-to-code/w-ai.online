import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { 
    userId: v.id("users"), // User making the request
    search: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      return [];
    }
    const organizationId = user.currentOrganizationId;

    if (args.search) {
      // Use Full Text Search (filter by organizationId)
      return await ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) => 
            q.search("name", args.search!)
             .eq("organizationId", organizationId) // Organization-scoped
        )
        .take(10);
    }
    
    // Default list (filter by organizationId)
    return await ctx.db
      .query("products")
      .withIndex("by_org_external_id", (q) => q.eq("organizationId", organizationId))
      .take(50);
  },
});

export const getById = query({
  args: { 
    userId: v.id("users"), // User making the request
    id: v.id("products") 
  },
  handler: async (ctx, args) => {
    // Get user's current organization
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentOrganizationId) {
      throw new Error("يجب أن يكون لديك منظمة نشطة");
    }
    const product = await ctx.db.get(args.id);
    if (!product || product.organizationId !== user.currentOrganizationId) {
      throw new Error("Product not found or access denied");
    }
    return product;
  },
});
