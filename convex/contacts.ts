import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

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

import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
    args: {
        userId: v.id("users"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return { page: [], isDone: true, continueCursor: "" };
        }

        return await ctx.db
            .query("contacts")
            .withIndex("by_org_createdAt", (q) => q.eq("organizationId", user.currentOrganizationId!))
            .order("desc") // Newest first
            .paginate(args.paginationOpts);
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

        // Check permissions
        const hasPermission = await ctx.runQuery(api.permissions.checkPermission, {
            userId: args.userId,
            organizationId: user.currentOrganizationId,
            permission: "manage_contacts"
        });

        if (!hasPermission) {
            throw new Error("Unauthorized: Missing MANAGE_CONTACTS permission");
        }
        // For now, we just delete the contact record.
        // Linked chats, bookings, etc. will effectively be orphaned or handled by UI checks.

        await ctx.db.delete(args.id);
    },
});

// Search contacts - for agent tools (organization-scoped)
export const search = query({
    args: {
        organizationId: v.string(),
        query: v.string(),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const orgId = args.organizationId as any;
        const searchQuery = args.query.toLowerCase();

        // Get all contacts for organization and filter
        const contacts = await ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) => q.eq("organizationId", orgId))
            .take(100); // Limit scan

        // Filter by name or phone
        const filtered = contacts.filter(c =>
            c.name?.toLowerCase().includes(searchQuery) ||
            c.phone?.includes(args.query)
        ).slice(0, args.limit || 5);

        return filtered.map(c => ({
            name: c.name,
            phone: c.phone,
            email: c.email,
            tags: c.tags
        }));
    },
});
