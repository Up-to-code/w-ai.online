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
            .eq("organizationId", organizationId)
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

// Search products - for agent tools (organization-scoped)
export const search = query({
  args: {
    organizationId: v.string(),
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const orgId = args.organizationId as any;

    try {
      // Use Full Text Search
      const results = await ctx.db
        .query("products")
        .withSearchIndex("search_products", (q) =>
          q.search("name", args.query)
            .eq("organizationId", orgId)
        )
        .take(args.limit || 5);

      return results.map((p: any) => ({
        name: p.name,
        price: p.price,
        currency: p.currency || "SAR",
        inStock: p.inStock !== false,
        description: p.description
      }));
    } catch (e) {
      // Fallback if search index doesn't work
      return [];
    }
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
