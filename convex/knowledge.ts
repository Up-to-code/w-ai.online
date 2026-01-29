// @ts-nocheck
// Knowledge base queries for AI agent
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Search knowledge base - for agent tools
export const search = query({
    args: {
        organizationId: v.string(),
        query: v.string(),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args: any): Promise<any[]> => {
        const orgId = args.organizationId as any;
        const searchQuery = args.query.toLowerCase();

        try {
            // Get all knowledge entries for organization
            const entries = await ctx.db
                .query("knowledge_base")
                .withIndex("by_org", (q) => q.eq("organizationId", orgId))
                .take(50);

            // Filter by title or content
            const filtered = entries.filter(e =>
                e.title?.toLowerCase().includes(searchQuery) ||
                e.content?.toLowerCase().includes(searchQuery)
            ).slice(0, args.limit || 3);

            return filtered.map(e => ({
                title: e.title,
                content: e.content
            }));
        } catch (e) {
            // Fallback if table doesn't exist
            return [];
        }
    },
});
