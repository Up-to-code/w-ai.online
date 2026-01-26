import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

// Helper function: Get messages in time range efficiently
const getMessagesInRange = async (
    ctx: QueryCtx,
    orgId: Id<"organizations">,
    startTime: number,
    endTime: number
) => {
    return await ctx.db
        .query("messages")
        .withIndex("by_org_timestamp", (q) =>
            q.eq("organizationId", orgId)
                .gte("timestamp", startTime)
                .lt("timestamp", endTime)
        )
        .collect();
};

// Helper function: Get messages for a specific day
const getMessagesForDay = async (
    ctx: QueryCtx,
    orgId: Id<"organizations">,
    date: Date
) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return getMessagesInRange(ctx, orgId, dayStart.getTime(), dayEnd.getTime());
};

// Helper function: Get contacts in time range
const getContactsInRange = async (
    ctx: QueryCtx,
    orgId: Id<"organizations">,
    startTime: number,
    endTime: number
) => {
    return await ctx.db
        .query("contacts")
        .withIndex("by_org_createdAt", (q) =>
            q.eq("organizationId", orgId)
                .gte("createdAt", startTime)
                .lt("createdAt", endTime)
        )
        .collect();
};

// Helper function: Get campaigns in time range
const getCampaignsInRange = async (
    ctx: QueryCtx,
    orgId: Id<"organizations">,
    startTime: number,
    endTime: number
) => {
    return await ctx.db
        .query("campaigns")
        .withIndex("by_org_createdAt", (q) =>
            q.eq("organizationId", orgId)
                .gte("createdAt", startTime)
                .lt("createdAt", endTime)
        )
        .collect();
};

// Helper function: Calculate date range from period
const calculateDateRange = (period?: string, startDate?: number, endDate?: number) => {
    const now = Date.now();

    if (startDate && endDate) {
        return { start: startDate, end: endDate };
    }

    switch (period) {
        case "7d":
            return { start: now - (7 * 24 * 60 * 60 * 1000), end: now };
        case "30d":
            return { start: now - (30 * 24 * 60 * 60 * 1000), end: now };
        case "90d":
            return { start: now - (90 * 24 * 60 * 60 * 1000), end: now };
        case "all":
        default:
            return { start: 0, end: now };
    }
};

export const getDashboardStats = query({
    args: {
        userId: v.optional(v.id("users")), // Backward compatibility
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns stats
        startDate: v.optional(v.number()), // Timestamp
        endDate: v.optional(v.number()), // Timestamp
        period: v.optional(v.union(
            v.literal("7d"),
            v.literal("30d"),
            v.literal("90d"),
            v.literal("all"),
            v.literal("custom")
        ))
    },
    handler: async (ctx, args) => {
        // Get organizationId - prioritize direct arg, then from user
        let orgId = args.organizationId;
        if (!orgId && args.userId) {
            const user = await ctx.db.get(args.userId);
            orgId = user?.currentOrganizationId;
        }

        if (!orgId) {
            // Return empty stats if no organization
            return {
                totalContacts: 0,
                totalMessages: 0,
                totalCampaigns: 0,
                deliveryRate: 0,
                readRate: 0,
                totalMessagesTrend: 0,
                totalContactsTrend: 0,
                deliveryRateTrend: 0,
                readRateTrend: 0,
                totalInboundMessages: 0,
                totalOutboundMessages: 0,
                totalDeliveredMessages: 0,
                totalReadMessages: 0,
                totalFailedMessages: 0,
                responseRate: 0,
                activeConversations: 0,
                messageStatusData: { sent: 0, delivered: 0, read: 0, failed: 0 },
                messageTypeData: { text: 0, image: 0, video: 0, audio: 0, document: 0, template: 0 },
                recentActivity: [],
                chartData: []
            };
        }

        // Calculate date range from period or custom dates
        const dateRange = calculateDateRange(args.period, args.startDate, args.endDate);
        const now = Date.now();

        // For trends, we need 14 days of data (7 current + 7 previous)
        const trendPeriodStart = Math.max(dateRange.start, now - (14 * 24 * 60 * 60 * 1000));

        // Parallel Fetching for Best Performance (using time-range queries)
        const [
            contactsCount,
            messagesCount,
            campaignsCount,
            recentMessages,
            periodMessages,
            periodContacts,
            periodCampaigns
        ] = await Promise.all([
            // Total counts (all time)
            ctx.db
                .query("contacts")
                .withIndex("by_org_phone", (q) => q.eq("organizationId", orgId))
                .collect()
                .then(res => res.length),
            ctx.db
                .query("messages")
                .withIndex("by_org_chat", (q) => q.eq("organizationId", orgId))
                .collect()
                .then(res => res.length),
            ctx.db
                .query("campaigns")
                .withIndex("by_org", (q) => q.eq("organizationId", orgId))
                .collect()
                .then(res => res.length),
            // Recent messages for activity
            ctx.db
                .query("messages")
                .withIndex("by_org_chat", (q) => q.eq("organizationId", orgId))
                .order("desc")
                .take(5),
            // Messages in selected period (for stats)
            getMessagesInRange(ctx, orgId, dateRange.start, dateRange.end),
            // Contacts in selected period (for trends)
            getContactsInRange(ctx, orgId, trendPeriodStart, now),
            // Campaigns in selected period
            getCampaignsInRange(ctx, orgId, dateRange.start, dateRange.end)
        ]);

        // Format Recent Activity from Messages
        const recentActivity = await Promise.all(recentMessages.map(async (msg) => {
            let name = "مستخدم";
            // Try to resolve contact name ??
            // Ideally messages should have sender info denormalized or we join.
            // For now, simple "New Message" activity
            const chat = await ctx.db.get(msg.chatId);
            return {
                id: msg._id,
                type: "message",
                user: chat?.contactName || "Unknown",
                action: msg.direction === "inbound" ? "أرسل رسالة جديدة" : "تم إرسال رسالة",
                time: msg._creationTime, // Timestamp
                icon: "MessageSquare",
                color: "primary"
            };
        }));

        const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        // Generate chart data based on period
        let chartDays = args.period === "30d" ? 30 : args.period === "90d" ? 90 : 7;

        if (args.startDate && args.endDate) {
            const diffTime = Math.abs(args.endDate - args.startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            chartDays = Math.min(diffDays, 120); // Cap at 120 days for chart performance
        }

        const today = new Date();
        const chartDates = Array.from({ length: chartDays }, (_, i) => {
            const d = new Date(args.endDate || today);
            d.setDate(d.getDate() - (chartDays - 1 - i));
            return d;
        });

        // Query each day separately for efficiency
        const chartData = await Promise.all(
            chartDates.map(async (date) => {
                const dayMessages = await getMessagesForDay(ctx, orgId, date);
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                const dayCampaigns = periodCampaigns.filter(c =>
                    c.createdAt >= dayStart.getTime() && c.createdAt <= dayEnd.getTime()
                );

                const inbound = dayMessages.filter(m => m.direction === "inbound").length;
                const outbound = dayMessages.filter(m => m.direction === "outbound").length;
                const delivered = dayMessages.filter(m =>
                    m.direction === "outbound" && (m.status === "delivered" || m.status === "read")
                ).length;
                const read = dayMessages.filter(m =>
                    m.direction === "outbound" && m.status === "read"
                ).length;
                const failed = dayMessages.filter(m =>
                    m.direction === "outbound" && m.status === "failed"
                ).length;
                const deliveryRate = outbound > 0 ? (delivered / outbound) * 100 : 0;
                const readRate = delivered > 0 ? (read / delivered) * 100 : 0;

                // Use original date for day name
                const originalDate = new Date(date);
                return {
                    date: originalDate.toISOString().split('T')[0],
                    day: dayNames[originalDate.getDay()],
                    messages: dayMessages.length,
                    inbound,
                    outbound,
                    delivered,
                    read,
                    failed,
                    campaigns: dayCampaigns.length,
                    deliveryRate,
                    readRate
                };
            })
        );


        // Calculate Rates (using periodMessages)
        const totalOutbound = periodMessages.filter(m => m.direction === "outbound").length;
        const totalInbound = periodMessages.filter(m => m.direction === "inbound").length;
        const deliveredMessages = periodMessages.filter(m =>
            m.direction === "outbound" && (m.status === "delivered" || m.status === "read")
        ).length;
        const readMessages = periodMessages.filter(m =>
            m.direction === "outbound" && m.status === "read"
        ).length;
        const failedMessages = periodMessages.filter(m =>
            m.direction === "outbound" && m.status === "failed"
        ).length;

        const deliveryRate = totalOutbound > 0 ? (deliveredMessages / totalOutbound) * 100 : 0;
        const readRate = deliveredMessages > 0 ? (readMessages / deliveredMessages) * 100 : 0;
        const responseRate = totalOutbound > 0 ? (totalInbound / totalOutbound) * 100 : 0;

        // Calculate Trends (compare current period vs previous period)
        const periodLength = dateRange.end - dateRange.start;
        const currentPeriodStart = dateRange.start;
        const previousPeriodStart = currentPeriodStart - periodLength;
        const previousPeriodEnd = currentPeriodStart;

        // Get messages for trend comparison
        const [currentPeriodMessages, previousPeriodMessages] = await Promise.all([
            getMessagesInRange(ctx, orgId, currentPeriodStart, dateRange.end),
            getMessagesInRange(ctx, orgId, previousPeriodStart, previousPeriodEnd)
        ]);

        // Messages trend
        const currentMessagesCount = currentPeriodMessages.length;
        const previousMessagesCount = previousPeriodMessages.length;
        const totalMessagesTrend = previousMessagesCount > 0
            ? ((currentMessagesCount - previousMessagesCount) / previousMessagesCount) * 100
            : (currentMessagesCount > 0 ? 100 : 0);

        // Contacts trend
        const currentContactsCount = periodContacts.filter(c =>
            (c.createdAt || 0) >= currentPeriodStart
        ).length;
        const previousContactsCount = periodContacts.filter(c => {
            const contactTime = c.createdAt || 0;
            return contactTime >= previousPeriodStart && contactTime < previousPeriodEnd;
        }).length;
        const totalContactsTrend = previousContactsCount > 0
            ? ((currentContactsCount - previousContactsCount) / previousContactsCount) * 100
            : (currentContactsCount > 0 ? 100 : 0);

        // Delivery rate trend
        const currentOutboundCount = currentPeriodMessages.filter(m => m.direction === "outbound").length;
        const currentDeliveredCount = currentPeriodMessages.filter(m =>
            m.direction === "outbound" && (m.status === "delivered" || m.status === "read")
        ).length;
        const currentDeliveryRate = currentOutboundCount > 0 ? (currentDeliveredCount / currentOutboundCount) * 100 : 0;

        const previousOutboundCount = previousPeriodMessages.filter(m => m.direction === "outbound").length;
        const previousDeliveredCount = previousPeriodMessages.filter(m =>
            m.direction === "outbound" && (m.status === "delivered" || m.status === "read")
        ).length;
        const previousDeliveryRate = previousOutboundCount > 0 ? (previousDeliveredCount / previousOutboundCount) * 100 : 0;
        const deliveryRateTrend = previousDeliveryRate > 0
            ? currentDeliveryRate - previousDeliveryRate
            : (currentDeliveryRate > 0 ? currentDeliveryRate : 0);

        // Read rate trend
        const currentReadCount = currentPeriodMessages.filter(m =>
            m.direction === "outbound" && m.status === "read"
        ).length;
        const currentReadRate = currentDeliveredCount > 0 ? (currentReadCount / currentDeliveredCount) * 100 : 0;

        const previousReadCount = previousPeriodMessages.filter(m =>
            m.direction === "outbound" && m.status === "read"
        ).length;
        const previousReadRate = previousDeliveredCount > 0 ? (previousReadCount / previousDeliveredCount) * 100 : 0;
        const readRateTrend = previousReadRate > 0
            ? currentReadRate - previousReadRate
            : (currentReadRate > 0 ? currentReadRate : 0);

        // Message status breakdown
        const messageStatusData = {
            sent: periodMessages.filter(m => m.direction === "outbound" && m.status === "sent").length,
            delivered: periodMessages.filter(m => m.direction === "outbound" && m.status === "delivered").length,
            read: periodMessages.filter(m => m.direction === "outbound" && m.status === "read").length,
            failed: periodMessages.filter(m => m.direction === "outbound" && m.status === "failed").length
        };

        // Message type breakdown
        const messageTypeData = {
            text: periodMessages.filter(m => m.type === "text").length,
            image: periodMessages.filter(m => m.type === "image").length,
            video: periodMessages.filter(m => m.type === "video").length,
            audio: periodMessages.filter(m => m.type === "audio").length,
            document: periodMessages.filter(m => m.type === "document").length,
            template: periodMessages.filter(m => m.type === "template").length
        };

        // Active conversations (chats with messages in last 7 days)
        const activeChatsStart = now - (7 * 24 * 60 * 60 * 1000);
        const activeChatIds = new Set(
            periodMessages
                .filter(m => m.timestamp >= activeChatsStart)
                .map(m => m.chatId)
        );
        const activeConversations = activeChatIds.size;

        return {
            totalContacts: contactsCount,
            totalMessages: messagesCount,
            totalCampaigns: campaignsCount,
            deliveryRate,
            readRate,
            totalMessagesTrend,
            totalContactsTrend,
            deliveryRateTrend,
            readRateTrend,
            totalInboundMessages: totalInbound,
            totalOutboundMessages: totalOutbound,
            totalDeliveredMessages: deliveredMessages,
            totalReadMessages: readMessages,
            totalFailedMessages: failedMessages,
            responseRate,
            activeConversations,
            messageStatusData,
            messageTypeData,
            recentActivity,
            chartData
        };
    },
});
