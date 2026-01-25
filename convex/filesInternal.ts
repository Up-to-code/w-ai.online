// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const saveFileRecord = internalMutation({
    args: {
        userId: v.id("users"), // Multi-tenant: user who owns this file
        storageId: v.string(),
        name: v.string(),
        mimeType: v.string(),
        size: v.number(),
        category: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Get URL
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("Could not get URL for storage ID");

        // Verify user exists
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const fileId = await ctx.db.insert("files", {
            userId: args.userId, // Multi-tenant: include userId
            storageId: args.storageId,
            url,
            name: args.name,
            mimeType: args.mimeType,
            size: args.size,
            category: args.category || "general",
            uploadedBy: user._id,
            createdAt: Date.now()
        });

        return { fileId, url };
    }
});
