import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get aggregated public statistics (anonymized, across all organizations)
// This is safe to expose publicly as it doesn't reveal any user-specific data
// @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
export const getPublicStats = query({
  args: {},
  // @ts-expect-error TS2589 - Type instantiation depth issue with Convex internal types
  handler: async (ctx) => {
    // Get all organizations count
    const organizations = await ctx.db
      .query("organizations")
      .collect();

    if (organizations.length === 0) {
      return {
        totalMessages: 0,
        totalCampaigns: 0,
        totalContacts: 0,
        averageDeliveryRate: 0,
        totalOrganizations: 0,
        activeOrganizations: 0,
      };
    }

    // Query all records directly (public stats, no privacy concerns)
    // This avoids complex nested Promise.all structures that cause type inference issues
    const allMessages = await ctx.db.query("messages").collect();
    const allCampaigns = await ctx.db.query("campaigns").collect();
    const allContacts = await ctx.db.query("contacts").collect();
    const campaignLogs = await ctx.db.query("campaign_logs").collect();

    // Calculate average delivery rate from campaign logs
    // campaign_logs have a status field: "sent", "delivered", "read", "failed", "skipped"
    let totalSent = 0;
    let totalDelivered = 0;
    
    // TypeScript can infer the type from the query result
    for (const log of campaignLogs) {
      // Count sent: includes "sent", "delivered", and "read" statuses
      if (log.status === "sent" || log.status === "delivered" || log.status === "read") {
        totalSent++;
      }
      // Count delivered: includes "delivered" and "read" statuses
      if (log.status === "delivered" || log.status === "read") {
        totalDelivered++;
      }
    }

    const averageDeliveryRate = totalSent > 0 
      ? Math.round((totalDelivered / totalSent) * 100) 
      : 0;

    // Count active organizations (those with at least one message or campaign)
    // organizationId is optional, so we filter out undefined values
    const activeOrgIds = new Set<Id<"organizations">>();
    
    for (const message of allMessages) {
      if (message.organizationId) {
        activeOrgIds.add(message.organizationId);
      }
    }
    
    for (const campaign of allCampaigns) {
      if (campaign.organizationId) {
        activeOrgIds.add(campaign.organizationId);
      }
    }

    return {
      totalMessages: allMessages.length,
      totalCampaigns: allCampaigns.length,
      totalContacts: allContacts.length,
      averageDeliveryRate,
      totalOrganizations: organizations.length,
      activeOrganizations: activeOrgIds.size,
    };
  },
});
