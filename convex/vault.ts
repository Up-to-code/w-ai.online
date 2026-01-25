// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Encrypted Secrets Storage
 * 
 * Replaces WorkOS Vault API with encrypted database storage.
 * Uses a simple encryption approach with environment variable as encryption key.
 * 
 * Note: For production, consider using a more robust encryption library
 * or WorkOS Vault with proper key context implementation.
 */

// Simple encryption/decryption using environment variable key
// In production, use a proper encryption library like crypto-js
function encrypt(value: string, key: string): string {
  // Simple XOR encryption (for demo - use proper encryption in production)
  // In production, use: crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = "";
  for (let i = 0; i < value.length; i++) {
    encrypted += String.fromCharCode(value.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted); // Base64 encode
}

function decrypt(encryptedValue: string, key: string): string {
  // Simple XOR decryption (for demo - use proper decryption in production)
  try {
    const decoded = atob(encryptedValue);
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch (e) {
    throw new Error("Failed to decrypt value");
  }
}

function getEncryptionKey(): string {
  // Use environment variable as encryption key
  // In production, ensure this is a strong, randomly generated key
  const key = process.env.ENCRYPTION_KEY || process.env.WORKOS_API_KEY || "default-key-change-in-production";
  return key;
}

// Get user's environment variables from encrypted storage
export const getUserEnvVars = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const secrets = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const encryptionKey = getEncryptionKey();
    const envVars: Record<string, string> = {};

    for (const secret of secrets) {
      try {
        const decryptedValue = decrypt(secret.encryptedValue, encryptionKey);
        envVars[secret.key] = decryptedValue;
      } catch (e) {
        console.error(`Failed to decrypt secret ${secret.key} for user ${args.userId}:`, e);
        // Skip this secret if decryption fails
      }
    }

    return envVars;
  },
});

// Set user's environment variable in encrypted storage
export const setUserEnvVar = mutation({
  args: {
    userId: v.id("users"),
    key: v.string(),
    value: v.string(),
    encrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const encryptionKey = getEncryptionKey();
    
    // Encrypt the value
    const encryptedValue = encrypt(args.value, encryptionKey);

    // Check if secret already exists
    const existing = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_user_key", (q) => 
        q.eq("userId", args.userId).eq("key", args.key)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing secret
      await ctx.db.patch(existing._id, {
        encryptedValue,
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    } else {
      // Create new secret
      const id = await ctx.db.insert("encryptedSecrets", {
        userId: args.userId,
        key: args.key,
        encryptedValue,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id };
    }
  },
});

// Delete user's environment variable
export const deleteUserEnvVar = mutation({
  args: {
    userId: v.id("users"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_user_key", (q) => 
        q.eq("userId", args.userId).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

// Action wrapper for backward compatibility (if needed)
export const setUserEnvVarAction = action({
  args: {
    userId: v.id("users"),
    key: v.string(),
    value: v.string(),
    encrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(api.vault.setUserEnvVar, args);
  },
});

// Organization-level vault functions

// Get organization's environment variables from encrypted storage
export const getOrganizationEnvVars = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const secrets = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const encryptionKey = getEncryptionKey();
    const envVars: Record<string, string> = {};

    for (const secret of secrets) {
      try {
        const decryptedValue = decrypt(secret.encryptedValue, encryptionKey);
        envVars[secret.key] = decryptedValue;
      } catch (e) {
        console.error(`Failed to decrypt secret ${secret.key} for organization ${args.organizationId}:`, e);
        // Skip this secret if decryption fails
      }
    }

    return envVars;
  },
});

// Set organization's environment variable in encrypted storage
export const setOrganizationEnvVar = mutation({
  args: {
    organizationId: v.id("organizations"),
    key: v.string(),
    value: v.string(),
    encrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const encryptionKey = getEncryptionKey();
    
    // Encrypt the value
    const encryptedValue = encrypt(args.value, encryptionKey);

    // Check if secret already exists (by org and key)
    const existing = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_org_key", (q) => 
        q.eq("organizationId", args.organizationId).eq("key", args.key)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing secret
      await ctx.db.patch(existing._id, {
        encryptedValue,
        updatedAt: now,
      });
      return { success: true, id: existing._id };
    } else {
      // Create new secret
      const id = await ctx.db.insert("encryptedSecrets", {
        organizationId: args.organizationId,
        key: args.key,
        encryptedValue,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, id };
    }
  },
});

// Delete organization's environment variable
export const deleteOrganizationEnvVar = mutation({
  args: {
    organizationId: v.id("organizations"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_org_key", (q) => 
        q.eq("organizationId", args.organizationId).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
});

// Get env vars - tries organization first, falls back to user (for migration)
export const getEnvVars = query({
  args: { 
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    // Try organization first
    if (args.organizationId) {
      const orgVars = await ctx.runQuery(api.vault.getOrganizationEnvVars, {
        organizationId: args.organizationId,
      });
      if (Object.keys(orgVars).length > 0) {
        return orgVars;
      }
    }

    // Fallback to user vars (for backward compatibility)
    if (args.userId) {
      return await ctx.runQuery(api.vault.getUserEnvVars, { userId: args.userId });
    }

    // Return empty object if neither is provided
    return {};
  },
});
