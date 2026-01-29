// @ts-nocheck
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get organization credit balance
export const getBalance = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args: any) => {
        const credits = await ctx.db
            .query("credits")
            .withIndex("by_org", q => q.eq("organizationId", args.organizationId))
            .first();

        return {
            balance: credits?.balance || 0,
            balanceUSD: (credits?.balance || 0) / 100, // Convert cents to dollars
        };
    }
});

// Internal query for agent to check balance
export const getBalanceInternal = internalQuery({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args: any) => {
        const credits = await ctx.db
            .query("credits")
            .withIndex("by_org", q => q.eq("organizationId", args.organizationId))
            .first();

        return credits?.balance || 0;
    }
});

// Get transaction history
export const getTransactions = query({
    args: {
        organizationId: v.id("organizations"),
        limit: v.optional(v.number())
    },
    handler: async (ctx, args: any) => {
        const transactions = await ctx.db
            .query("credit_transactions")
            .withIndex("by_org_created", q => q.eq("organizationId", args.organizationId))
            .order("desc")
            .take(args.limit || 50);

        return transactions;
    }
});

// Deduct credits after LLM usage (internal - called by agent)
export const deductUsage = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(), // In cents
        model: v.string(),
        tokensInput: v.number(),
        tokensOutput: v.number(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args: any) => {
        // Skip if amount is 0 (free model)
        if (args.amount <= 0) return { success: true, newBalance: 0 };

        const credits = await ctx.db
            .query("credits")
            .withIndex("by_org", q => q.eq("organizationId", args.organizationId))
            .first();

        // If no credits record exists, create one with 0 balance
        if (!credits) {
            const newCreditsId = await ctx.db.insert("credits", {
                organizationId: args.organizationId,
                balance: 0,
                updatedAt: Date.now()
            });

            // Log the failed deduction attempt
            await ctx.db.insert("credit_transactions", {
                organizationId: args.organizationId,
                type: "usage",
                amount: 0,
                description: `⚠️ Insufficient credits for: ${args.description || "AI Response"}`,
                modelUsed: args.model,
                tokensInput: args.tokensInput,
                tokensOutput: args.tokensOutput,
                createdAt: Date.now()
            });

            return { success: false, newBalance: 0, error: "No credits available" };
        }

        // Check if sufficient balance
        if (credits.balance < args.amount) {
            return {
                success: false,
                newBalance: credits.balance,
                error: "Insufficient credits"
            };
        }

        // Deduct
        const newBalance = credits.balance - args.amount;
        await ctx.db.patch(credits._id, {
            balance: newBalance,
            updatedAt: Date.now()
        });

        // Log transaction
        await ctx.db.insert("credit_transactions", {
            organizationId: args.organizationId,
            type: "usage",
            amount: -args.amount,
            description: args.description || `AI Response (${args.model})`,
            modelUsed: args.model,
            tokensInput: args.tokensInput,
            tokensOutput: args.tokensOutput,
            createdAt: Date.now()
        });

        return { success: true, newBalance };
    }
});

// Add credits (purchase or refund)
export const addCredits = mutation({
    args: {
        organizationId: v.id("organizations"),
        amount: v.number(), // In cents
        type: v.union(v.literal("purchase"), v.literal("refund")),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args: any) => {
        const credits = await ctx.db
            .query("credits")
            .withIndex("by_org", q => q.eq("organizationId", args.organizationId))
            .first();

        if (credits) {
            await ctx.db.patch(credits._id, {
                balance: credits.balance + args.amount,
                updatedAt: Date.now()
            });
        } else {
            await ctx.db.insert("credits", {
                organizationId: args.organizationId,
                balance: args.amount,
                updatedAt: Date.now()
            });
        }

        // Log transaction
        await ctx.db.insert("credit_transactions", {
            organizationId: args.organizationId,
            type: args.type,
            amount: args.amount,
            description: args.description || `Credit ${args.type}`,
            createdAt: Date.now()
        });

        return { success: true };
    }
});

// Initialize credits for new organization (called during org creation)
export const initializeCredits = internalMutation({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args: any) => {
        const existing = await ctx.db
            .query("credits")
            .withIndex("by_org", q => q.eq("organizationId", args.organizationId))
            .first();

        if (existing) return;

        // Give new orgs $1.00 free credits (100 cents)
        await ctx.db.insert("credits", {
            organizationId: args.organizationId,
            balance: 100, // $1.00 in cents
            updatedAt: Date.now()
        });

        await ctx.db.insert("credit_transactions", {
            organizationId: args.organizationId,
            type: "purchase",
            amount: 100,
            description: "🎁 Welcome bonus credits",
            createdAt: Date.now()
        });
    }
});
