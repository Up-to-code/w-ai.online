// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {
        userId: v.id("users"),
        rangeStart: v.optional(v.number()),
        rangeEnd: v.optional(v.number()),
        status: v.optional(v.string()), // Optional filter
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        const organizationId = user.currentOrganizationId;

        let q = ctx.db
            .query("bookings")
            .withIndex("by_org_date", (q) => q.eq("organizationId", organizationId));

        // Note: Convex doesn't support complex range limits effectively with `withIndex` combined with other filters purely in one go without loading.
        // For now, we fetch by org and date range if provided, or just org.

        let results = await q.collect();

        // In-memory filtering (acceptable for typical scale of bookings per org)
        if (args.rangeStart) {
            results = results.filter(b => b.scheduledAt >= args.rangeStart!);
        }
        if (args.rangeEnd) {
            results = results.filter(b => b.scheduledAt <= args.rangeEnd!);
        }
        if (args.status) {
            results = results.filter(b => b.status === args.status);
        }

        // Sort by date ascending
        return results.sort((a, b) => a.scheduledAt - b.scheduledAt);
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"),
        contactId: v.optional(v.id("contacts")),
        contactPhone: v.string(),
        contactName: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        scheduledAt: v.number(),
        duration: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("no_show")
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }
        const organizationId = user.currentOrganizationId;

        const bookingId = await ctx.db.insert("bookings", {
            organizationId,
            contactId: args.contactId,
            contactPhone: args.contactPhone,
            contactName: args.contactName,
            title: args.title,
            description: args.description,
            scheduledAt: args.scheduledAt,
            duration: args.duration,
            status: args.status,
            notes: args.notes,
            assignedTo: args.userId, // Auto-assign creator for now
            createdBy: args.userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return bookingId;
    },
});

export const update = mutation({
    args: {
        userId: v.id("users"),
        bookingId: v.id("bookings"),
        status: v.optional(v.union(
            v.literal("pending"),
            v.literal("confirmed"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("no_show")
        )),
        scheduledAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.organizationId !== user.currentOrganizationId) {
            throw new Error("Booking not found or access denied");
        }

        await ctx.db.patch(args.bookingId, {
            ...(args.status && { status: args.status }),
            ...(args.scheduledAt && { scheduledAt: args.scheduledAt }),
            ...(args.duration && { duration: args.duration }),
            ...(args.notes && { notes: args.notes }),
            updatedAt: Date.now(),
        });
    },
});

export const deleteBooking = mutation({
    args: {
        userId: v.id("users"),
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.organizationId !== user.currentOrganizationId) {
            throw new Error("Booking not found or access denied");
        }

        await ctx.db.delete(args.bookingId);
    },
});

// Get single booking with contact details
export const getById = query({
    args: {
        userId: v.id("users"),
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return null;
        }

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.organizationId !== user.currentOrganizationId) {
            return null;
        }

        // Fetch linked contact if exists
        let contact = null;
        if (booking.contactId) {
            contact = await ctx.db.get(booking.contactId);
        }

        return {
            ...booking,
            contact, // Full contact object or null
        };
    },
});

// Quick reschedule (for drag-drop or quick move)
export const reschedule = mutation({
    args: {
        userId: v.id("users"),
        bookingId: v.id("bookings"),
        newDate: v.number(), // New scheduledAt timestamp
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.organizationId !== user.currentOrganizationId) {
            throw new Error("Booking not found or access denied");
        }

        await ctx.db.patch(args.bookingId, {
            scheduledAt: args.newDate,
            updatedAt: Date.now(),
        });
    },
});

// List contacts for booking dialog (search/select)
export const searchContacts = query({
    args: {
        userId: v.id("users"),
        search: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        const organizationId = user.currentOrganizationId;

        let contacts = await ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) => q.eq("organizationId", organizationId))
            .take(args.limit || 20);

        // Simple in-memory search filter
        if (args.search && args.search.trim()) {
            const term = args.search.toLowerCase();
            contacts = contacts.filter(
                (c) =>
                    c.name.toLowerCase().includes(term) ||
                    c.phone.includes(term)
            );
        }

        return contacts;
    },
});

// List bookings by contact ID
export const listByContact = query({
    args: {
        userId: v.id("users"),
        contactId: v.id("contacts"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }

        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
            .collect();

        // Sort by date descending (newest first)
        return bookings.sort((a, b) => b.scheduledAt - a.scheduledAt);
    },
});

// Get booking configuration from organizationTools
export const getBookingConfig = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return null;
        }
        const organizationId = user.currentOrganizationId;

        const toolRecord = await ctx.db
            .query("organizationTools")
            .withIndex("by_org_tool", (q) =>
                q.eq("organizationId", organizationId).eq("toolId", "bookings")
            )
            .first();

        // Return config or default values
        return toolRecord?.config || {
            availability: {
                businessHours: { start: "09:00", end: "17:00" },
                workingDays: [0, 1, 2, 3, 4], // Sun-Thu
                timezone: "Asia/Riyadh",
                slotDuration: 30,
                bufferTime: 10,
            },
            meeting: {
                defaultLocation: "phone",
                zoomLink: "",
                meetLink: "",
                customLocation: "",
            },
            permissions: {
                allowAgentsToEdit: true,
                allowAgentsToDelete: false,
                requireApproval: false,
            },
            notifications: {
                sendReminders: true,
                reminderHours: 24,
            },
        };
    },
});

// Update booking configuration
export const updateBookingConfig = mutation({
    args: {
        userId: v.id("users"),
        config: v.any(), // Flexible config object
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("No organization found");
        }
        const organizationId = user.currentOrganizationId;

        // Check permission (owner/admin only)
        const membership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_org_user", (q) =>
                q.eq("organizationId", organizationId).eq("userId", args.userId)
            )
            .first();

        if (!membership || !["owner", "admin"].includes(membership.role)) {
            throw new Error("غير مصرح لك بتعديل إعدادات الحجوزات");
        }

        const existing = await ctx.db
            .query("organizationTools")
            .withIndex("by_org_tool", (q) =>
                q.eq("organizationId", organizationId).eq("toolId", "bookings")
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                config: args.config,
            });
        } else {
            // Create tool record if doesn't exist
            await ctx.db.insert("organizationTools", {
                organizationId,
                toolId: "bookings",
                isActive: true,
                aiEnabled: false,
                config: args.config,
                activatedAt: Date.now(),
                activatedBy: args.userId,
            });
        }

        return { success: true };
    },
});
