import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
    args: {
        userId: v.id("users"), // User making the request
        search: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        let q = ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) => q.eq("organizationId", user.currentOrganizationId));

        // Note: Simple filtering for now. For scale, we'd use search capabilities or more indexes.
        if (args.limit) {
            return await q.take(args.limit);
        }
        return await q.collect();
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"), // User creating the contact
        name: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        customFields: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const organizationId = user.currentOrganizationId;

        const id = await ctx.db.insert("contacts", {
            userId: args.userId, // Keep for backward compatibility
            organizationId: organizationId, // Organization-scoped
            name: args.name,
            phone: args.phone,
            email: args.email,
            tags: args.tags || [],
            customFields: args.customFields || {},
            isSubscribed: true,
            createdAt: Date.now(),
        });

        // Trigger Workflows for new contact
        await ctx.scheduler.runAfter(0, internal.workflows.checkContactWorkflows, {
            organizationId: organizationId, // Organization-scoped
            contactId: id,
            contactPhone: args.phone,
            isNew: true
        });

        // Trigger Workflows for added tags
        if (args.tags && args.tags.length > 0) {
            for (const tag of args.tags) {
                await ctx.scheduler.runAfter(0, internal.workflows.checkTagWorkflows, {
                    organizationId: organizationId, // Organization-scoped
                    contactId: id,
                    contactPhone: args.phone,
                    addedTag: tag
                });
            }
        }

        return id;
    },
});

export const update = mutation({
    args: {
        userId: v.id("users"), // User making the request
        id: v.id("contacts"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const organizationId = user.currentOrganizationId;

        const contact = await ctx.db.get(args.id);
        if (!contact) throw new Error("Contact not found");
        // Verify ownership
        if (contact.organizationId !== organizationId) {
            throw new Error("Contact not found or access denied");
        }

        // Calculate added tags
        if (args.tags) {
            const oldTags = contact.tags || [];
            const addedTags = args.tags.filter(t => !oldTags.includes(t));

            for (const tag of addedTags) {
                await ctx.scheduler.runAfter(0, internal.workflows.checkTagWorkflows, {
                    organizationId: organizationId, // Organization-scoped
                    contactId: args.id,
                    contactPhone: contact.phone,
                    addedTag: tag
                });
            }
        }

        await ctx.db.patch(args.id, {
            name: args.name,
            email: args.email,
            tags: args.tags,
        });
    },
});

export const bulkCreate = mutation({
    args: {
        userId: v.id("users"), // User making the request
        contacts: v.array(v.object({
            name: v.string(),
            phone: v.string(),
            email: v.optional(v.string()),
            tags: v.optional(v.array(v.string())),
        }))
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const organizationId = user.currentOrganizationId;

        const promises = args.contacts.map(c =>
            ctx.db.insert("contacts", {
                userId: args.userId, // Keep for backward compatibility
                organizationId: organizationId, // Organization-scoped
                name: c.name,
                phone: c.phone,
                email: c.email,
                tags: c.tags || [],
                isSubscribed: true,
                createdAt: Date.now(),
            })
        );
        await Promise.all(promises);
        return args.contacts.length;
    },
});

export const getById = query({
    args: {
        userId: v.id("users"), // User making the request
        id: v.id("contacts")
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const contact = await ctx.db.get(args.id);
        if (!contact || contact.organizationId !== user.currentOrganizationId) {
            throw new Error("Contact not found or access denied");
        }
        return contact;
    },
});

export const deleteContact = mutation({
    args: {
        userId: v.id("users"),
        id: v.id("contacts")
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("Unauthorized");
        }
        const contact = await ctx.db.get(args.id);
        if (!contact || contact.organizationId !== user.currentOrganizationId) {
            throw new Error("Contact not found");
        }

        // Note: In a real production app, we might want to cascade delete or soft delete
        // For now, we just delete the contact record.
        // Linked chats, bookings, etc. will effectively be orphaned or handled by UI checks.

        await ctx.db.delete(args.id);
    },
});
