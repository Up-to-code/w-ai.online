import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

// Get all users for migration
// @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
export const getAllUsers = internalQuery({
  args: {},
  // @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

// Migrate user's data to organization
// @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
export const migrateUserData = internalMutation({
  args: {
    // @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
    userId: v.id("users"),
    // @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
    organizationId: v.id("organizations"),
  },
  // @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
  handler: async (ctx, args): Promise<void> => {
    // Migrate chats
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_contact", (q) => q.eq("userId", args.userId))
      .collect();
    for (const chat of chats) {
      await ctx.db.patch(chat._id, { organizationId: args.organizationId });
    }

    // Migrate messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_chat", (q) => q.eq("userId", args.userId))
      .collect();
    for (const message of messages) {
      await ctx.db.patch(message._id, { organizationId: args.organizationId });
    }

    // Migrate contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user_phone", (q) => q.eq("userId", args.userId))
      .collect();
    for (const contact of contacts) {
      await ctx.db.patch(contact._id, { organizationId: args.organizationId });
    }

    // Migrate campaigns
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const campaign of campaigns) {
      await ctx.db.patch(campaign._id, { organizationId: args.organizationId });
    }

    // Migrate templates
    const templates = await ctx.db
      .query("templates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const template of templates) {
      await ctx.db.patch(template._id, { organizationId: args.organizationId });
    }

    // Migrate workflows
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const workflow of workflows) {
      await ctx.db.patch(workflow._id, { organizationId: args.organizationId });
    }

    // Migrate products
    const products = await ctx.db
      .query("products")
      .withIndex("by_user_external_id", (q) => q.eq("userId", args.userId))
      .collect();
    for (const product of products) {
      await ctx.db.patch(product._id, { organizationId: args.organizationId });
    }

    // Migrate files
    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const file of files) {
      await ctx.db.patch(file._id, { organizationId: args.organizationId });
    }

    // Migrate ai_configs
    const aiConfigs = await ctx.db
      .query("ai_configs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const config of aiConfigs) {
      await ctx.db.patch(config._id, { organizationId: args.organizationId });
    }

    // Migrate knowledge_base
    const knowledge = await ctx.db
      .query("knowledge_base")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const kb of knowledge) {
      await ctx.db.patch(kb._id, { organizationId: args.organizationId });
    }

    // Migrate sallaIntegrations
    const sallaIntegrations = await ctx.db
      .query("sallaIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const integration of sallaIntegrations) {
      await ctx.db.patch(integration._id, { organizationId: args.organizationId });
    }

    // Migrate webhookConfigs
    const webhooks = await ctx.db
      .query("webhookConfigs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const webhook of webhooks) {
      await ctx.db.patch(webhook._id, { organizationId: args.organizationId });
    }

    // Migrate encryptedSecrets (credentials)
    const secrets = await ctx.db
      .query("encryptedSecrets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const secret of secrets) {
      await ctx.db.patch(secret._id, { organizationId: args.organizationId });
    }

    // Migrate phoneNumberIdToUserId
    const phoneLookups = await ctx.db
      .query("phoneNumberIdToUserId")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const lookup of phoneLookups) {
      await ctx.db.patch(lookup._id, { organizationId: args.organizationId });
    }

    // Migrate campaign_logs
    const campaignLogs = await ctx.db
      .query("campaign_logs")
      .withIndex("by_user_campaign", (q) => q.eq("userId", args.userId))
      .collect();
    for (const log of campaignLogs) {
      await ctx.db.patch(log._id, { organizationId: args.organizationId });
    }

    // Migrate orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const order of orders) {
      await ctx.db.patch(order._id, { organizationId: args.organizationId });
    }

    console.log(`[Migration] Migrated data for user ${args.userId} to organization ${args.organizationId}`);
  },
});

/**
 * Migration: Create organizations for existing users and migrate data
 * 
 * This migration:
 * 1. Creates an organization for each existing user
 * 2. Adds user as owner of their organization
 * 3. Migrates all userId-based data to organizationId
 * 
 * Run this once after deploying the organization schema changes.
 */
// @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
export const migrateToOrganizations = internalAction({
  args: {},
  // @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
  handler: async (ctx): Promise<{ migrated: number; errors: number; total: number }> => {
    console.log("[Migration] Starting organization migration...");

    // Get all users
    const users = await ctx.runQuery(internal.migrations.getAllUsers, {});
    console.log(`[Migration] Found ${users.length} users to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Check if user already has an organization
        const existingOrgs = await ctx.runQuery(api.organizations.getUserOrganizations, {
          userId: user._id,
        });

        if (existingOrgs && existingOrgs.length > 0) {
          console.log(`[Migration] User ${user._id} already has organization, skipping`);
          continue;
        }

        // Create organization for user
        const orgName = user.name || `منظمة ${user.email || user._id}`;
        const orgId = await ctx.runMutation(api.organizations.createOrganization, {
          userId: user._id,
          name: orgName,
          email: user.email,
          phone: user.phone,
        });

        console.log(`[Migration] Created organization ${orgId} for user ${user._id}`);

        // Migrate data
        await ctx.runMutation(internal.migrations.migrateUserData, {
          userId: user._id,
          organizationId: orgId,
        });

        migrated++;
      } catch (error: any) {
        console.error(`[Migration] Error migrating user ${user._id}:`, error);
        errors++;
      }
    }

    console.log(`[Migration] Complete! Migrated ${migrated} users, ${errors} errors`);
    return { migrated, errors, total: users.length };
  },
});
