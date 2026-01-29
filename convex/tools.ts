import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tools").collect();
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("tools")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const register = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        description: v.string(),
        aiPrompt: v.string(),
        path: v.string(),
        icon: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("tools")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, args);
            return existing._id;
        } else {
            return await ctx.db.insert("tools", args);
        }
    },
});

// Seed default tools
export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const tools = [
            {
                name: "Dashboard",
                slug: "dashboard",
                description: "Overview of system status and metrics",
                aiPrompt: "Use the Dashboard to view high-level metrics, recent activity, and system status. It is the landing page.",
                path: "/dashboard",
                icon: "LayoutDashboard"
            },
            {
                name: "Chat",
                slug: "chat",
                description: "Messaging interface for WhatsApp",
                aiPrompt: "Use the Chat tool to interact with customers via WhatsApp. You can send text, media, and templates. Ensure you check the customer's history before responding.",
                path: "/chat",
                icon: "MessageSquare"
            },
            {
                name: "Campaigns",
                slug: "campaigns",
                description: "Marketing campaign management",
                aiPrompt: "Use the Campaigns tool to create, schedule, and monitor bulk messaging campaigns. You can segment users and track delivery stats.",
                path: "/campaigns",
                icon: "Megaphone"
            },
            {
                name: "Customers",
                slug: "customers",
                description: "Customer relationship management",
                aiPrompt: "Use the Customers tool to manage the contact database. You can search, filter by tags, and view individual customer profiles.",
                path: "/customers",
                icon: "Users"
            },
            {
                name: "Templates",
                slug: "templates",
                description: "WhatsApp message templates",
                aiPrompt: "Use the Templates tool to manage pre-approved WhatsApp message templates. These are required for initiating conversations.",
                path: "/templates",
                icon: "FileText"
            },
            {
                name: "Workflows",
                slug: "workflows",
                description: "Automation and rules",
                aiPrompt: "Use the Workflows tool to configure automated responses and actions based on triggers like new messages or keywords.",
                path: "/workflows",
                icon: "Zap"
            },
            {
                name: "Bookings",
                slug: "bookings",
                description: "Appointment scheduling",
                aiPrompt: "Use the Bookings tool to schedule and manage appointments. You can view availability and confirming bookings.",
                path: "/bookings",
                icon: "Calendar"
            },
            {
                name: "Settings",
                slug: "settings",
                description: "System configuration",
                aiPrompt: "Use the Settings tool to configure general system preferences, notifications, and billing information.",
                path: "/settings",
                icon: "Settings"
            }
        ];

        for (const tool of tools) {
            const existing = await ctx.db
                .query("tools")
                .withIndex("by_slug", (q) => q.eq("slug", tool.slug))
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, tool);
            } else {
                await ctx.db.insert("tools", tool);
            }
        }
    },
});
