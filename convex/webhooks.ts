// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Generate unique webhook slug
function generateWebhookSlug(): string {
  // Generate: wh_ + 12 random alphanumeric characters
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "wh_";
  for (let i = 0; i < 12; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Create new webhook configuration
export const createWebhook = mutation({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.string(),
    webhookUrl: v.string(),
    verifyToken: v.string(),
    phoneNumbers: v.optional(v.array(v.object({
      phoneNumberId: v.string(),
      businessName: v.string(),
      wabaId: v.string(), // WhatsApp Business Account ID per phone
    }))), // NEW: Array of phone numbers with metadata
    phoneNumberIds: v.optional(v.array(v.string())), // Backward compatibility: Array of phone number IDs
    phoneNumberId: v.optional(v.string()), // Backward compatibility
    wabaId: v.optional(v.string()),
    appId: v.optional(v.string()), // NEW: App ID
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if webhook already exists for this organization (prevent duplicates)
    const existingWebhook = await ctx.db
      .query("webhookConfigs")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .first();
    
    if (existingWebhook) {
      throw new Error("يوجد Webhook موجود بالفعل لهذه المنظمة. يرجى تعديل الإعدادات الحالية بدلاً من إنشاء جديد.");
    }

    // Generate unique slug (retry if collision, very unlikely)
    let webhookSlug = generateWebhookSlug();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("webhookConfigs")
        .withIndex("by_slug", (q) => q.eq("webhookSlug", webhookSlug))
        .first();
      
      if (!existing) {
        break; // Slug is unique
      }
      webhookSlug = generateWebhookSlug(); // Regenerate
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error("Failed to generate unique webhook slug");
    }

    const now = Date.now();
    
    // Get organization to get slug for URL generation
    const organization = await ctx.db.get(args.organizationId);
    const orgSlug = organization?.slug || args.organizationId; // Fallback to ID if no slug
    
    // Generate unique webhook URL with organization slug (format: /whatsapp/webhook/{organizationSlug})
    let baseUrl = args.webhookUrl;
    if (baseUrl && !baseUrl.includes(orgSlug)) {
      // If URL provided but doesn't include org slug, append it
      baseUrl = baseUrl.endsWith("/") 
        ? `${baseUrl}${orgSlug}` 
        : `${baseUrl}/${orgSlug}`;
    } else if (!baseUrl) {
      // Generate URL with organization slug
      const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";
      if (convexUrl.includes("convex.cloud")) {
        const match = convexUrl.match(/https:\/\/([^.]+)\.convex\.cloud/);
        if (match && match[1]) {
          baseUrl = `https://${match[1]}.convex.site/whatsapp/webhook/${orgSlug}`;
        }
      }
      if (!baseUrl) {
        baseUrl = `https://your-deployment.convex.site/whatsapp/webhook/${orgSlug}`;
      }
    }
    
    // Handle phone numbers: prioritize phoneNumbers array with metadata, fallback to phoneNumberIds
    let phoneNumbers = args.phoneNumbers || [];
    let phoneNumberIds: string[] = [];
    
    if (phoneNumbers.length > 0) {
      // Extract phone number IDs from phoneNumbers array
      phoneNumberIds = phoneNumbers.map(p => p.phoneNumberId);
    } else if (args.phoneNumberIds && args.phoneNumberIds.length > 0) {
      // Fallback: convert phoneNumberIds to phoneNumbers structure
      phoneNumberIds = args.phoneNumberIds;
      phoneNumbers = args.phoneNumberIds.map(id => ({
        phoneNumberId: id,
        businessName: "", // Default empty business name
        wabaId: args.wabaId || "", // Use global WABA ID if provided
      }));
    } else if (args.phoneNumberId) {
      // Single phone number fallback
      phoneNumberIds = [args.phoneNumberId];
      phoneNumbers = [{
        phoneNumberId: args.phoneNumberId,
        businessName: "",
        wabaId: args.wabaId || "", // Use global WABA ID if provided
      }];
    }
    
    return await ctx.db.insert("webhookConfigs", {
      organizationId: args.organizationId, // Organization-scoped
      name: args.name,
      webhookSlug: webhookSlug,
      webhookUrl: baseUrl,
      verifyToken: args.verifyToken,
      phoneNumbers: phoneNumbers, // NEW: Array with metadata
      phoneNumberIds: phoneNumberIds, // Keep for backward compatibility
      phoneNumberId: phoneNumberIds[0], // Keep for backward compatibility
      wabaId: args.wabaId,
      appId: args.appId, // NEW: App ID
      isActive: true,
      isVerified: false, // NEW: Initialize as not verified
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update webhook configuration
export const updateWebhook = mutation({
  args: {
    webhookId: v.id("webhookConfigs"),
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    verifyToken: v.optional(v.string()),
    phoneNumbers: v.optional(v.array(v.object({
      phoneNumberId: v.string(),
      businessName: v.string(),
      wabaId: v.string(), // WhatsApp Business Account ID per phone
    }))), // NEW: Array of phone numbers with metadata
    phoneNumberIds: v.optional(v.array(v.string())), // Backward compatibility: Array of phone number IDs
    phoneNumberId: v.optional(v.string()), // Backward compatibility
    wabaId: v.optional(v.string()),
    appId: v.optional(v.string()), // NEW: App ID
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.organizationId !== args.organizationId) {
      throw new Error("Webhook not found or access denied");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.webhookUrl !== undefined) updates.webhookUrl = args.webhookUrl;
    if (args.verifyToken !== undefined) updates.verifyToken = args.verifyToken;
    if (args.wabaId !== undefined) updates.wabaId = args.wabaId;
    if (args.appId !== undefined) updates.appId = args.appId;
    if (args.description !== undefined) updates.description = args.description;

    // Handle phone numbers: prioritize phoneNumbers array with metadata
    if (args.phoneNumbers !== undefined) {
      updates.phoneNumbers = args.phoneNumbers;
      updates.phoneNumberIds = args.phoneNumbers.map(p => p.phoneNumberId);
      if (args.phoneNumbers.length > 0) {
        updates.phoneNumberId = args.phoneNumbers[0].phoneNumberId;
      }
    } else if (args.phoneNumberIds !== undefined) {
      // Fallback: convert phoneNumberIds to phoneNumbers structure
      updates.phoneNumberIds = args.phoneNumberIds;
      updates.phoneNumbers = args.phoneNumberIds.map(id => ({
        phoneNumberId: id,
        businessName: "",
        wabaId: args.wabaId || webhook.wabaId || "", // Use provided WABA ID or existing
      }));
      if (args.phoneNumberIds.length > 0) {
        updates.phoneNumberId = args.phoneNumberIds[0];
      }
    } else if (args.phoneNumberId !== undefined) {
      // Single phone number fallback
      updates.phoneNumberId = args.phoneNumberId;
      updates.phoneNumberIds = [args.phoneNumberId];
      updates.phoneNumbers = [{
        phoneNumberId: args.phoneNumberId,
        businessName: "",
        wabaId: args.wabaId || webhook.wabaId || "", // Use provided WABA ID or existing
      }];
    }

    await ctx.db.patch(args.webhookId, updates);
    return { success: true };
  },
});

// Mark webhook as verified
export const markWebhookVerified = mutation({
  args: {
    webhookId: v.id("webhookConfigs"),
    organizationId: v.optional(v.id("organizations")), // Organization-scoped (optional for backward compatibility)
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }
    // Verify access if organizationId provided
    if (args.organizationId && webhook.organizationId !== args.organizationId) {
      throw new Error("Webhook not found or access denied");
    }

    await ctx.db.patch(args.webhookId, {
      isVerified: true,
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get webhook verification status
export const getWebhookVerificationStatus = query({
  args: {
    organizationId: v.optional(v.id("organizations")), // Organization-scoped (preferred)
    userId: v.optional(v.id("users")), // Backward compatibility
  },
  handler: async (ctx, args) => {
    // Require at least one identifier
    if (!args.organizationId && !args.userId) {
      return { isVerified: false, verifiedAt: null };
    }

    // Prioritize organization, fallback to user for backward compatibility
    let webhooks;
    if (args.organizationId) {
      webhooks = await ctx.db
        .query("webhookConfigs")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    }
    
    if ((!webhooks || webhooks.length === 0) && args.userId) {
      // Fallback to user-based (backward compatibility)
      webhooks = await ctx.db
        .query("webhookConfigs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
    }

    // Return the first active webhook's verification status
    const activeWebhook = webhooks?.find((w) => w.isActive);
    if (!activeWebhook) {
      return { isVerified: false, verifiedAt: null };
    }

    return {
      isVerified: activeWebhook.isVerified || false,
      verifiedAt: activeWebhook.verifiedAt || null,
    };
  },
});

// Delete webhook configuration
export const deleteWebhook = mutation({
  args: {
    webhookId: v.id("webhookConfigs"),
    organizationId: v.id("organizations"), // Organization-scoped
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.organizationId !== args.organizationId) {
      throw new Error("Webhook not found or access denied");
    }

    await ctx.db.delete(args.webhookId);
    return { success: true };
  },
});

// List all webhooks for an organization
export const listWebhooks = query({
  args: {
    organizationId: v.optional(v.id("organizations")), // Organization-scoped (preferred)
    userId: v.optional(v.id("users")), // Backward compatibility
  },
  handler: async (ctx, args) => {
    // Require at least one identifier
    if (!args.organizationId && !args.userId) {
      return [];
    }

    // Prioritize organization, fallback to user for backward compatibility
    if (args.organizationId) {
      return await ctx.db
        .query("webhookConfigs")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .collect();
    }
    
    // Fallback to user-based (backward compatibility)
    if (args.userId) {
      return await ctx.db
        .query("webhookConfigs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }
    
    return [];
  },
});

// Get single webhook by ID
export const getWebhook = query({
  args: {
    webhookId: v.id("webhookConfigs"),
    organizationId: v.id("organizations"), // Organization-scoped
    userId: v.optional(v.id("users")), // Backward compatibility
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) {
      return null;
    }
    // Check organization first, fallback to user for backward compatibility
    if (args.organizationId && webhook.organizationId === args.organizationId) {
      return webhook;
    }
    if (args.userId && webhook.userId === args.userId) {
      return webhook;
    }
    return null;
  },
});

// Toggle webhook active/inactive
export const toggleWebhook = mutation({
  args: {
    webhookId: v.id("webhookConfigs"),
    organizationId: v.id("organizations"), // Organization-scoped
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook || webhook.organizationId !== args.organizationId) {
      throw new Error("Webhook not found or access denied");
    }

    await ctx.db.patch(args.webhookId, {
      isActive: !webhook.isActive,
      updatedAt: Date.now(),
    });

    return { success: true, isActive: !webhook.isActive };
  },
});

// Get webhook by slug (for fast lookup)
export const getWebhookBySlug = query({
  args: {
    webhookSlug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookConfigs")
      .withIndex("by_slug", (q) => q.eq("webhookSlug", args.webhookSlug))
      .first();
  },
});

// Get webhook by slug and verify token (for secure verification)
export const getWebhookBySlugAndToken = query({
  args: {
    webhookSlug: v.string(),
    verifyToken: v.string(),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db
      .query("webhookConfigs")
      .withIndex("by_slug", (q) => q.eq("webhookSlug", args.webhookSlug))
      .first();

    // Verify token matches (trimmed) and webhook is active
    const storedToken = webhook?.verifyToken?.trim() || "";
    const receivedToken = args.verifyToken?.trim() || "";
    if (webhook && storedToken === receivedToken && webhook.isActive) {
      return webhook;
    }
    return null;
  },
});

// Get webhook by userId and verify token (for userId-based URL routing)
export const getWebhookByUserIdAndToken = query({
  args: {
    userId: v.id("users"),
    verifyToken: v.string(),
  },
  handler: async (ctx, args) => {
    const webhooks = await ctx.db
      .query("webhookConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Trim tokens for comparison
    const receivedToken = args.verifyToken?.trim() || "";
    
    // Return the first active webhook with matching token (trimmed)
    return webhooks.find((w) => {
      const storedToken = w.verifyToken?.trim() || "";
      return storedToken === receivedToken && w.isActive;
    }) || webhooks.find((w) => {
      const storedToken = w.verifyToken?.trim() || "";
      return storedToken === receivedToken;
    }) || null;
  },
});

// Get webhook by organizationId and verify token (for organization-based URL routing)
export const getWebhookByOrganizationIdAndToken = query({
  args: {
    organizationId: v.id("organizations"),
    verifyToken: v.string(),
  },
  handler: async (ctx, args) => {
    const webhooks = await ctx.db
      .query("webhookConfigs")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Trim tokens for comparison
    const receivedToken = args.verifyToken?.trim() || "";
    
    // Return the first active webhook with matching token (trimmed)
    return webhooks.find((w) => {
      const storedToken = w.verifyToken?.trim() || "";
      return storedToken === receivedToken && w.isActive;
    }) || webhooks.find((w) => {
      const storedToken = w.verifyToken?.trim() || "";
      return storedToken === receivedToken;
    }) || null;
  },
});

// Get webhook by verify token (for backward compatibility)
export const getWebhookByToken = query({
  args: {
    verifyToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Search all webhooks for matching token (trimmed)
    const receivedToken = args.verifyToken?.trim() || "";
    const allWebhooks = await ctx.db
      .query("webhookConfigs")
      .collect();

    // Filter by trimmed token match
    const matchingWebhooks = allWebhooks.filter((w) => {
      const storedToken = w.verifyToken?.trim() || "";
      return storedToken === receivedToken;
    });

    // Return the first active webhook with matching token
    return matchingWebhooks.find((w) => w.isActive) || matchingWebhooks[0] || null;
  },
});
