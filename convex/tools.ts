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

// Seed default tools with Real Platform Logic
export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const tools = [
            {
                name: "Dashboard",
                slug: "dashboard",
                description: "Overview of system status and metrics",
                aiPrompt: "Use the Dashboard to view high-level metrics (total messages, campaigns sent), recent activity, and system alerts. It is the landing page. If the user asks 'how is the system doing?', check the metrics here.",
                path: "/dashboard",
                icon: "LayoutDashboard"
            },
            {
                name: "Chat (WhatsApp)",
                slug: "chat",
                description: "Real-time messaging interface",
                aiPrompt: "The Chat tool is for 1:1 WhatsApp conversations. IMPORTANT: You are interacting via WhatsApp Cloud API. \n1. To start a NEW conversation after 24 hours of inactivity, you MUST use a 'Template'. \n2. You can send text, images, videos, and documents. \n3. Check 'Customer Profile' in the sidebar for context before replying. \n4. Use 'AI Assist' to generate draft responses.",
                path: "/chat",
                icon: "MessageSquare"
            },
            {
                name: "Campaigns",
                slug: "campaigns",
                description: "Bulk marketing campaigns",
                aiPrompt: "Use Campaigns for bulk messaging. \n1. You can target users by 'Segment' (dynamic) or 'Tags' (static). \n2. Campaigns support recurring schedules (Cron). \n3. Anti-spam is built-in (smart delays). \n4. You can track 'Sent', 'Delivered', 'Read' stats in real-time. \n5. Use this for announcements, offers, or newsletters.",
                path: "/campaigns",
                icon: "Megaphone"
            },
            {
                name: "Customers (CRM)",
                slug: "customers",
                description: "Contact management database",
                aiPrompt: "The Customers tool is your CRM. \n1. You can search by name, phone, or email. \n2. Use 'Tags' to organize users (e.g., 'vip', 'lead'). \n3. You can view conversation history and past bookings for each contact. \n4. When a user asks about a specific person, search here first.",
                path: "/customers",
                icon: "Users"
            },
            {
                name: "Templates",
                slug: "templates",
                description: "WhatsApp message templates",
                aiPrompt: "Templates are REQUIRED for initiating WhatsApp conversations. \n1. Status must be 'APPROVED' by Meta to use. \n2. Templates can have variables ({{1}}, {{2}}). \n3. Types: Marketing, Utility, Authentication. \n4. You can create new templates here and submit them for review.",
                path: "/templates",
                icon: "FileText"
            },
            {
                name: "Workflows",
                slug: "workflows",
                description: "Automation engine",
                aiPrompt: "Workflows allow you to build 'If This Then That' automation. \n1. Triggers: New Message, Tag Added, Campaign Status. \n2. Actions: Send Message, Add Tag, Notify Admin. \n3. Use this to automate follow-ups or lead qualification.",
                path: "/workflows",
                icon: "Zap"
            },
            {
                name: "Bookings",
                slug: "bookings",
                description: "Appointment scheduling system",
                aiPrompt: "Use Bookings to manage appointments. \n1. Statuses: Pending, Confirmed, Completed, Cancelled, No-Show. \n2. Checks availability against 'Business Hours' defined in Settings. \n3. Can be linked to a specific 'Contact' in the CRM. \n4. Use this when a user wants to schedule a meeting or call.",
                path: "/bookings",
                icon: "Calendar"
            },
            {
                name: "Settings",
                slug: "settings",
                description: "System configuration",
                aiPrompt: "Global system settings. \n1. Configure 'Business Profile' (Address, Email). \n2. Connect 'WhatsApp' numbers. \n3. Manage 'Team Members' and permissions. \n4. Billing and Subscription details.",
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

export const updateTool = mutation({
    args: {
        id: v.id("tools"),
        aiPrompt: v.optional(v.string()),
        description: v.optional(v.string()),
        isActive: v.optional(v.boolean()), // For UI toggling if needed
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});
