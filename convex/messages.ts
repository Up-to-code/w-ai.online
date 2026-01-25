import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "./_generated/api";

const pushNotifications = new PushNotifications<any>(components.pushNotifications);

export const saveMessage = internalMutation({
    args: {
        userId: v.optional(v.id("users")), // Backward compatibility
        organizationId: v.id("organizations"), // Organization-scoped (required)
        contactId: v.string(),
        contactName: v.string(),
        contactPhone: v.string(),
        direction: v.union(v.literal("inbound"), v.literal("outbound")),
        type: v.string(),
        content: v.string(),
        metaMessageId: v.string(),
        timestamp: v.number(),
        status: v.string(),
        mediaId: v.optional(v.string()),
        storageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // 0. Idempotency: avoid double-inserting the same Meta message
        try {
            const existing = await ctx.db
                .query("messages")
                .withIndex("by_meta_message_id", (q) => q.eq("metaMessageId", args.metaMessageId))
                .first();
            if (existing) {
                return existing._id;
            }
        } catch (e) {
            // If index isn't available yet (during dev), continue and insert
        }

        // 0. Auto-Capture Logic (Middleware) (Robust Version)
        let contactId = args.contactId;

        try {
            const existingContact = await ctx.db
                .query("contacts")
                .withIndex("by_org_phone", (q) => 
                    q.eq("organizationId", args.organizationId).eq("phone", args.contactPhone)
                )
                .first();

            if (!existingContact && args.direction === "inbound") {
                console.log(`[Messages] Creating new contact for ${args.contactPhone}`);
                const newContactId = await ctx.db.insert("contacts", {
                    userId: args.userId, // Keep for backward compatibility
                    organizationId: args.organizationId, // Organization-scoped
                    name: args.contactName || "Unknown",
                    phone: args.contactPhone,
                    isSubscribed: true,
                    tags: ["inbound"],
                    createdAt: Date.now(),
                });
                // In a real app we might update contactId to match the DB ID, but here contactId is External
            } else if (existingContact) {
                console.log(`[Messages] Existing contact found: ${existingContact._id}`);
                // Match name if it was unknown?
                if (existingContact.name === "Unknown" && args.contactName && args.contactName !== args.contactPhone) {
                    await ctx.db.patch(existingContact._id, { name: args.contactName });
                }
            }
        } catch (e) {
            console.error("[Messages] Contact Sync Error:", e);
            // Continue saving message even if contact sync fails
        }

        // 1. Find or Create Chat
        let finalChatId;
        try {
            // ... logic same as before, simplified for diff
            let chat = await ctx.db
                .query("chats")
                .withIndex("by_org_contact", (q) => 
                    q.eq("organizationId", args.organizationId).eq("contactPhone", args.contactPhone)
                )
                .first();

            if (chat) {
                finalChatId = chat._id;
                await ctx.db.patch(chat._id, {
                    lastMessageTime: args.timestamp,
                    unreadCount: args.direction === "inbound" ? (chat.unreadCount || 0) + 1 : chat.unreadCount
                });
            } else {
                console.log(`[Messages] Creating new chat for ${args.contactPhone}`);
                finalChatId = await ctx.db.insert("chats", {
                    userId: args.userId, // Keep for backward compatibility
                    organizationId: args.organizationId, // Organization-scoped
                    contactId: args.contactId,
                    contactName: args.contactName,
                    contactPhone: args.contactPhone,
                    lastMessageTime: args.timestamp,
                    unreadCount: 1,
                    status: "active",
                    aiMode: true, // Default to true
                });
            }
        } catch (e) {
            console.error("[Messages] Chat Creation Error:", e);
            throw e; // Fail message save if chat fails
        }

        // 2. Insert Message
        const msgId = await ctx.db.insert("messages", {
            userId: args.userId, // Keep for backward compatibility
            organizationId: args.organizationId, // Organization-scoped
            chatId: finalChatId,
            direction: args.direction as "inbound" | "outbound",
            type: args.type as any,
            content: args.content,
            status: args.status as any,
            timestamp: args.timestamp,
            metaMessageId: args.metaMessageId,
            mediaId: args.mediaId,
            storageId: args.storageId,
        });
        console.log(`[Messages] Message saved: ${msgId} (${args.direction})`);

        // 3. Trigger Workflows (Async)
        if (args.direction === "inbound") {
            await ctx.scheduler.runAfter(0, internal.workflows.checkAndExecuteWorkflows, {
                organizationId: args.organizationId, // Organization-scoped
                messageId: msgId,
                content: args.content,
                contactPhone: args.contactPhone
            });
        }

        // 4. Send Push Notifications to Admins (only if not viewing the conversation)
        if (args.direction === "inbound") {
            try {
                const admins = await ctx.db.query("users")
                    .filter((q: any) => q.eq(q.field("role"), "admin"))
                    .collect();

                if (admins.length > 0) {
                    const chat = await ctx.db.get(finalChatId);
                    const notifTitle = chat?.contactName || args.contactPhone;
                    const notifBody = args.type === "text" ? args.content : `Sent a ${args.type}`;

                    for (const admin of admins) {
                        // Check if admin is viewing this chat
                        const isViewing = await ctx.runQuery(internal.chat.isUserViewingChat, {
                            userId: admin._id,
                            chatId: finalChatId,
                        });

                        // Only send notification if admin is NOT viewing the conversation
                        if (!isViewing) {
                            await pushNotifications.sendPushNotification(ctx, {
                                userId: admin._id,
                                notification: {
                                    title: notifTitle,
                                    body: notifBody,
                                    data: { chatId: finalChatId },
                                },
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("[Messages] Failed to send push notifications:", e);
            }
        }

        return msgId;
    }
});

export const updateMessageStatus = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        metaMessageId: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        // Filter by organizationId to ensure ownership
        const message = await ctx.db
            .query("messages")
            .withIndex("by_org_chat", (q) => q.eq("organizationId", args.organizationId))
            .filter((q: any) => q.eq(q.field("metaMessageId"), args.metaMessageId))
            .first();

        if (message && message.organizationId === args.organizationId) {
            await ctx.db.patch(message._id, {
                status: args.status as any
            });
            return true; // Found and updated
        }
        return false; // Not found
    }
});

export const updateMessageMetaId = internalMutation({
    args: {
        messageId: v.id("messages"),
        metaMessageId: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (message) {
            await ctx.db.patch(args.messageId, {
                metaMessageId: args.metaMessageId,
                status: "sent" // Confirm it's sent
            });
            console.log(`[Messages] Updated message ${args.messageId} with Meta ID: ${args.metaMessageId}`);
        } else {
            console.error(`[Messages] Failed to update Meta ID. Message ${args.messageId} not found.`);
        }
    }
});

export const updateMessageStorageId = internalMutation({
    args: {
        messageId: v.id("messages"),
        storageId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, { storageId: args.storageId });
    }
});

export const sendAndSave = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        chatId: v.id("chats"),
        contactPhone: v.string(),
        content: v.string(),
        type: v.string(),
        mediaId: v.optional(v.string()), // Add support for passing mediaId
        storageId: v.optional(v.string()), // Add support for passing storageId
        mediaUrl: v.optional(v.string()), // Add support for passing mediaUrl directly
    },
    handler: async (ctx, args) => {
        // Verify chat belongs to organization
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.organizationId !== args.organizationId) {
            throw new Error("Chat not found or access denied");
        }

        // 1. Save to DB
        const messageId = await ctx.db.insert("messages", {
            userId: chat.userId, // Keep for backward compatibility
            organizationId: args.organizationId, // Organization-scoped
            chatId: args.chatId,
            direction: "outbound",
            type: args.type as any,
            content: args.content,
            status: "sent",
            timestamp: Date.now(),
            mediaId: args.mediaId,
            storageId: args.storageId,
        });

        // 2. Send via WhatsApp
        // Format content based on type (WhatsApp API expects objects for text/image etc)
        let payloadContent: any;

        if (args.type === "text") {
            payloadContent = { body: args.content };
        } else if (args.type === "image") {
            if (args.mediaId) {
                payloadContent = { id: args.mediaId, caption: args.content };
            } else if (args.mediaUrl) {
                payloadContent = { link: args.mediaUrl, caption: args.content };
            } else {
                payloadContent = args.content;
            }
        } else if (args.type === "audio") {
            if (args.mediaId) {
                payloadContent = { id: args.mediaId };
            } else if (args.mediaUrl) {
                payloadContent = { link: args.mediaUrl };
            } else {
                payloadContent = args.content;
            }
        } else if (args.type === "video") {
            if (args.mediaId) {
                payloadContent = { id: args.mediaId, caption: args.content };
            } else if (args.mediaUrl) {
                payloadContent = { link: args.mediaUrl, caption: args.content };
            } else {
                payloadContent = args.content;
            }
        } else {
            payloadContent = args.content;
        }

        await ctx.scheduler.runAfter(0, api.whatsapp.sendMessage, {
            organizationId: args.organizationId, // Organization-scoped
            to: args.contactPhone,
            type: args.type,
            content: payloadContent,
            messageId: messageId,
        });

        // 3. Update Chat
        await ctx.db.patch(args.chatId, {
            lastMessageTime: Date.now(),
        });
    }
});

export const getMessageById = internalQuery({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.messageId);
    },
});

export const list = query({
    args: { 
        userId: v.id("users"), // User making the request
        chatId: v.id("chats") 
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        // Verify chat belongs to organization
        const chat = await ctx.db.get(args.chatId);
        if (!chat || chat.organizationId !== user.currentOrganizationId) {
            throw new Error("Chat not found or access denied");
        }

        return await ctx.db
            .query("messages")
            .withIndex("by_org_chat", (q) => 
                q.eq("organizationId", user.currentOrganizationId).eq("chatId", args.chatId)
            )
            .order("desc")
            .take(50);
    },
});
