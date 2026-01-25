// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { authKit } from "./auth";

// Manual connection: Connect WhatsApp Business with manually entered credentials
export const connectManually = action({
  args: {
    userId: v.id("users"), // User making the request
    organizationId: v.id("organizations"), // Organization to connect (required)
    accessToken: v.string(),
    phoneNumberId: v.string(),
    wabaId: v.string(),
    appId: v.string(),
    webhookVerifyToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this organization
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});
    if (!user || user.currentOrganizationId !== args.organizationId) {
      throw new Error("ليس لديك صلاحية للوصول إلى هذه المنظمة");
    }
    const organizationId = args.organizationId;
    // Validate credentials by making test API calls to Meta
    try {
      // 1. Validate WABA ID and access token
      const wabaResponse = await fetch(
        `https://graph.facebook.com/v21.0/${args.wabaId}?fields=id,name&access_token=${args.accessToken}`
      );

      if (!wabaResponse.ok) {
        const errorData = await wabaResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `Failed to validate WABA ID: ${wabaResponse.status} ${wabaResponse.statusText}`
        );
      }

      const wabaData = await wabaResponse.json();
      if (!wabaData.id || wabaData.id !== args.wabaId) {
        throw new Error("WABA ID validation failed");
      }

      // 2. Validate phone number ID exists and belongs to this WABA
      const phoneResponse = await fetch(
        `https://graph.facebook.com/v21.0/${args.wabaId}/phone_numbers?access_token=${args.accessToken}`
      );

      if (!phoneResponse.ok) {
        const errorData = await phoneResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `Failed to validate phone number: ${phoneResponse.status} ${phoneResponse.statusText}`
        );
      }

      const phoneData = await phoneResponse.json();
      const phoneExists = phoneData.data?.some((phone: any) => phone.id === args.phoneNumberId);
      
      if (!phoneExists) {
        throw new Error("Phone Number ID not found or doesn't belong to this WABA");
      }

      // 3. All validations passed - store credentials in encrypted storage
      // Use organization-level storage if organizationId is available
      if (organizationId) {
        await ctx.runMutation(api.vault.setOrganizationEnvVar, {
          organizationId,
          key: "META_ACCESS_TOKEN",
          value: args.accessToken,
          encrypted: true,
        });

        await ctx.runMutation(api.vault.setOrganizationEnvVar, {
          organizationId,
          key: "META_PHONE_NUMBER_ID",
          value: args.phoneNumberId,
          encrypted: false,
        });

        await ctx.runMutation(api.vault.setOrganizationEnvVar, {
          organizationId,
          key: "META_WABA_ID",
          value: args.wabaId,
          encrypted: false,
        });

        await ctx.runMutation(api.vault.setOrganizationEnvVar, {
          organizationId,
          key: "META_APP_ID",
          value: args.appId,
          encrypted: false,
        });

        await ctx.runMutation(api.vault.setOrganizationEnvVar, {
          organizationId,
          key: "META_WEBHOOK_VERIFY_TOKEN",
          value: args.webhookVerifyToken,
          encrypted: false,
        });

        // Update lookup table for webhook routing
        await ctx.runMutation(internal.meta.updatePhoneNumberLookup, {
          organizationId,
          phoneNumberId: args.phoneNumberId,
        });
      } else {
        // Fallback to user-level (backward compatibility)
        await ctx.runMutation(api.vault.setUserEnvVar, {
          userId: args.userId,
          key: "META_ACCESS_TOKEN",
          value: args.accessToken,
          encrypted: true,
        });

        await ctx.runMutation(api.vault.setUserEnvVar, {
          userId: args.userId,
          key: "META_PHONE_NUMBER_ID",
          value: args.phoneNumberId,
          encrypted: false,
        });

        await ctx.runMutation(api.vault.setUserEnvVar, {
          userId: args.userId,
          key: "META_WABA_ID",
          value: args.wabaId,
          encrypted: false,
        });

        await ctx.runMutation(api.vault.setUserEnvVar, {
          userId: args.userId,
          key: "META_APP_ID",
          value: args.appId,
          encrypted: false,
        });

        await ctx.runMutation(api.vault.setUserEnvVar, {
          userId: args.userId,
          key: "META_WEBHOOK_VERIFY_TOKEN",
          value: args.webhookVerifyToken,
          encrypted: false,
        });

        await ctx.runMutation(internal.meta.updatePhoneNumberLookup, {
          userId: args.userId,
          phoneNumberId: args.phoneNumberId,
        });
      }

      // 5. Create or update webhook configuration via internal mutation
      // The webhook page will handle creating/updating webhook configs directly
      // This connection just stores the credentials in Vault

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("[Meta Manual Connection] Validation failed:", errorMessage);
      throw new Error(`Connection failed: ${errorMessage}`);
    }
  },
});

// Get user's Meta tokens from encrypted storage
export const getUserMetaTokens = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const envVars = await ctx.runQuery(api.vault.getUserEnvVars, { userId: args.userId });
    
    return {
      accessToken: envVars.META_ACCESS_TOKEN,
      phoneNumberId: envVars.META_PHONE_NUMBER_ID,
      wabaId: envVars.META_WABA_ID,
      appId: envVars.META_APP_ID,
      webhookVerifyToken: envVars.META_WEBHOOK_VERIFY_TOKEN,
    };
  },
});

// Get connection status (uses vault query; runAction in queries is invalid in Convex)
export const getConnection = query({
  args: { 
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
  },
  handler: async (ctx, args) => {
    try {
      // Prioritize organizationId, fallback to userId
      const envVars = await ctx.runQuery(api.vault.getEnvVars, {
        userId: args.userId,
        organizationId: args.organizationId,
      });
      return {
        connected: !!envVars.META_ACCESS_TOKEN,
        phoneNumberId: envVars.META_PHONE_NUMBER_ID,
        wabaId: envVars.META_WABA_ID,
      };
    } catch {
      return { connected: false };
    }
  },
});

// Disconnect Meta integration
export const disconnect = action({
  args: { 
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
  },
  handler: async (ctx, args) => {
    // Prioritize organizationId, fallback to userId
    if (args.organizationId) {
      // Remove organization-scoped tokens from Vault
      await ctx.runMutation(api.vault.deleteOrganizationEnvVar, {
        organizationId: args.organizationId,
        key: "META_ACCESS_TOKEN",
      });

      await ctx.runMutation(api.vault.deleteOrganizationEnvVar, {
        organizationId: args.organizationId,
        key: "META_PHONE_NUMBER_ID",
      });

      await ctx.runMutation(api.vault.deleteOrganizationEnvVar, {
        organizationId: args.organizationId,
        key: "META_WABA_ID",
      });

      await ctx.runMutation(api.vault.deleteOrganizationEnvVar, {
        organizationId: args.organizationId,
        key: "META_APP_ID",
      });

      await ctx.runMutation(api.vault.deleteOrganizationEnvVar, {
        organizationId: args.organizationId,
        key: "META_WEBHOOK_VERIFY_TOKEN",
      });

      // Remove from lookup table
      await ctx.runMutation(internal.meta.removePhoneNumberLookup, {
        organizationId: args.organizationId,
      });
    } else {
      // Fallback to user-scoped (backward compatibility)
      await ctx.runMutation(api.vault.deleteUserEnvVar, {
        userId: args.userId,
        key: "META_ACCESS_TOKEN",
      });

      await ctx.runMutation(api.vault.deleteUserEnvVar, {
        userId: args.userId,
        key: "META_PHONE_NUMBER_ID",
      });

      await ctx.runMutation(api.vault.deleteUserEnvVar, {
        userId: args.userId,
        key: "META_WABA_ID",
      });

      await ctx.runMutation(api.vault.deleteUserEnvVar, {
        userId: args.userId,
        key: "META_APP_ID",
      });

      await ctx.runMutation(api.vault.deleteUserEnvVar, {
        userId: args.userId,
        key: "META_WEBHOOK_VERIFY_TOKEN",
      });

      // Remove from lookup table
      await ctx.runMutation(internal.meta.removePhoneNumberLookup, {
        userId: args.userId,
      });
    }

    return { success: true };
  },
});

// Update lookup table when user/organization connects Meta
// Supports multiple phone numbers - each phone number gets its own entry
export const updatePhoneNumberLookup = internalMutation({
  args: {
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Organization that owns the phone
    phoneNumberId: v.string(),
    phoneNumberIds: v.optional(v.array(v.string())), // Support multiple phone numbers
  },
  handler: async (ctx, args) => {
    // Get all phone numbers to update (array or single)
    const phoneNumbers = args.phoneNumberIds && args.phoneNumberIds.length > 0
      ? args.phoneNumberIds
      : [args.phoneNumberId];

    // Remove old entries
    if (args.organizationId) {
      const existing = await ctx.db
        .query("phoneNumberIdToUserId")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      
      for (const entry of existing) {
        await ctx.db.delete(entry._id);
      }
    } else if (args.userId) {
      // Backward compatibility
      const existing = await ctx.db
        .query("phoneNumberIdToUserId")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      for (const entry of existing) {
        await ctx.db.delete(entry._id);
      }
    }
    
    // Add entries for all phone numbers
    for (const phoneId of phoneNumbers) {
      // Check if phone number is already used
      const existingByPhone = await ctx.db
        .query("phoneNumberIdToUserId")
        .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", phoneId))
        .first();
      
      if (existingByPhone) {
        // Update existing entry
        await ctx.db.patch(existingByPhone._id, {
          organizationId: args.organizationId,
          userId: args.userId,
          updatedAt: Date.now(),
        });
      } else {
        // Add new entry
        await ctx.db.insert("phoneNumberIdToUserId", {
          phoneNumberId: phoneId,
          organizationId: args.organizationId,
          userId: args.userId,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Remove from lookup table when user/organization disconnects Meta
export const removePhoneNumberLookup = internalMutation({
  args: {
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    if (args.organizationId) {
      const existing = await ctx.db
        .query("phoneNumberIdToUserId")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      
      for (const entry of existing) {
        await ctx.db.delete(entry._id);
      }
    } else if (args.userId) {
      // Backward compatibility
      const existing = await ctx.db
        .query("phoneNumberIdToUserId")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      
      for (const entry of existing) {
        await ctx.db.delete(entry._id);
      }
    }
  },
});

// Refresh Meta access token
export const refreshToken = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tokens = await ctx.runAction(api.meta.getUserMetaTokens, { userId: args.userId });
    
    if (!tokens.accessToken) {
      throw new Error("No access token found");
    }

    // Meta tokens typically don't expire, but if they do, refresh logic would go here
    // For now, we'll just return the existing token
    // In production, implement actual refresh logic based on Meta's token refresh API
    
    return { accessToken: tokens.accessToken };
  },
});

// Action to update lookup table for multiple phone numbers (called from webhook page)
export const updatePhoneNumberLookupForAll = action({
  args: {
    userId: v.id("users"),
    phoneNumberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.meta.updatePhoneNumberLookup, {
      userId: args.userId,
      phoneNumberId: args.phoneNumberIds[0] || "", // Required for backward compatibility
      phoneNumberIds: args.phoneNumberIds,
    });
  },
});

// Get userId/organizationId by phoneNumberId (for webhook routing)
export const getUserIdByPhoneNumberId = query({
  args: { phoneNumberId: v.string() },
  handler: async (ctx, args) => {
    const lookup = await ctx.db
      .query("phoneNumberIdToUserId")
      .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", args.phoneNumberId))
      .first();
    
    if (!lookup) return null;
    
    // Prefer organizationId, fallback to userId
    return {
      userId: lookup.userId,
      organizationId: lookup.organizationId,
    };
  },
});
