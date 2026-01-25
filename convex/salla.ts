// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { v } from "convex/values";
import { action, mutation, query, internalAction, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";

// Salla API endpoints
const SALLA_TOKEN_URL = "https://accounts.salla.sa/oauth2/token";
const SALLA_API_BASE = "https://api.salla.dev/admin/v2";

// Get connection status
export const getConnection = query({
    args: { 
        userId: v.optional(v.id("users")), // Backward compatibility
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
    },
    handler: async (ctx, args) => {
        // Prioritize organizationId, fallback to userId
        let integration;
        if (args.organizationId) {
            integration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .first();
        } else if (args.userId) {
            integration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .first();
        }

        if (!integration) {
            return null;
        }

        return {
            merchantId: integration.merchantId,
            storeName: integration.storeName,
            storeUrl: integration.storeUrl,
            connectedAt: integration.connectedAt,
            isExpired: integration.expiresAt < Date.now(),
        };
    },
});

// Save tokens after OAuth callback
export const saveTokens = mutation({
    args: {
        userId: v.id("users"), // Multi-tenant: user who owns this integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
        merchantId: v.string(),
        accessToken: v.string(),
        refreshToken: v.string(),
        expiresIn: v.number(), // seconds
        storeName: v.optional(v.string()),
        storeUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if integration already exists - prioritize organizationId, fallback to userId
        let existing;
        if (args.organizationId) {
            // First check for any existing integration for this organization (prevent duplicates)
            const orgIntegration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .first();
            
            // Then check for same merchantId
            existing = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .filter((q: any) => q.eq(q.field("merchantId"), args.merchantId))
                .first();
            
            // If organization has a different integration, update it instead of creating duplicate
            if (orgIntegration && !existing) {
                existing = orgIntegration;
            }
        } else {
            existing = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .filter((q: any) => q.eq(q.field("merchantId"), args.merchantId))
                .first();
        }

        const expiresAt = Date.now() + args.expiresIn * 1000;

        if (existing) {
            // Update existing integration
            await ctx.db.patch(existing._id, {
                accessToken: args.accessToken,
                refreshToken: args.refreshToken,
                expiresAt,
                storeName: args.storeName,
                storeUrl: args.storeUrl,
                merchantId: args.merchantId, // Update merchantId in case it changed
                ...(args.organizationId && { organizationId: args.organizationId }), // Update organizationId if provided
            });
            return existing._id;
        }

        return await ctx.db.insert("sallaIntegrations", {
            userId: args.userId, // Multi-tenant: include userId
            ...(args.organizationId && { organizationId: args.organizationId }), // Include organizationId if provided
            merchantId: args.merchantId,
            accessToken: args.accessToken,
            refreshToken: args.refreshToken,
            expiresAt,
            storeName: args.storeName,
            storeUrl: args.storeUrl,
            connectedAt: Date.now(),
        });
    },
});

// Disconnect Salla
export const disconnect = mutation({
    args: { 
        userId: v.id("users"), // Multi-tenant: user who owns integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
    },
    handler: async (ctx, args) => {
        // Prioritize organizationId, fallback to userId
        let integration;
        if (args.organizationId) {
            integration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .first();
        } else {
            integration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .first();
        }
        if (integration) {
            await ctx.db.delete(integration._id);
        }
    },
});

// Exchange authorization code for tokens (internal - called from http.ts)
export const exchangeCode = internalAction({
    args: {
        userId: v.id("users"), // Multi-tenant: user who owns this integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
        code: v.string(),
    },
    handler: async (ctx, args) => {
        const clientId = process.env.SALLA_CLIENT_ID;
        const clientSecret = process.env.SALLA_CLIENT_SECRET;
        const redirectUri = process.env.SALLA_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error("Missing Salla OAuth configuration");
        }

        // Exchange code for tokens
        const tokenResponse = await fetch(SALLA_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: clientId,
                client_secret: clientSecret,
                code: args.code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            throw new Error(`Failed to exchange code: ${error}`);
        }

        const tokens = await tokenResponse.json();

        // Get merchant info
        const merchantResponse = await fetch(`${SALLA_API_BASE}/store/info`, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        let merchantInfo = { id: "unknown", name: undefined, domain: undefined };
        if (merchantResponse.ok) {
            const data = await merchantResponse.json();
            merchantInfo = {
                id: data.data?.id?.toString() || "unknown",
                name: data.data?.name,
                domain: data.data?.domain,
            };
        }

        // Save tokens to database
        await ctx.runMutation(api.salla.saveTokens, {
            userId: args.userId, // Multi-tenant: pass userId
            organizationId: args.organizationId, // Multi-tenant: pass organizationId if provided
            merchantId: merchantInfo.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in || 1209600, // Default 14 days
            storeName: merchantInfo.name,
            storeUrl: merchantInfo.domain,
        });

        return { success: true, storeName: merchantInfo.name };
    },
});

// Refresh access token
export const refreshToken = action({
    args: { 
        userId: v.id("users"), // Multi-tenant: user who owns integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
    },
    handler: async (ctx, args) => {
        const integration = await ctx.runQuery(api.salla.getConnection, { 
          userId: args.userId,
          organizationId: args.organizationId,
        });

        if (!integration) {
            throw new Error("No Salla integration found");
        }

        const clientId = process.env.SALLA_CLIENT_ID;
        const clientSecret = process.env.SALLA_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error("Missing Salla OAuth configuration");
        }

        // Get current refresh token from DB
        const dbIntegration = await ctx.runQuery(api.salla.getConnection, { 
          userId: args.userId,
          organizationId: args.organizationId,
        });

        if (!dbIntegration) {
            throw new Error("No Salla integration found");
        }

        // Get the actual integration record to access refreshToken
        const integrationRecord = await ctx.runQuery(api.salla.getConnectionWithToken, {
            userId: args.userId,
            organizationId: args.organizationId,
        });

        if (!integrationRecord || !integrationRecord.refreshToken) {
            throw new Error("No refresh token found");
        }

        const tokenResponse = await fetch(SALLA_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: integrationRecord.refreshToken,
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error("Failed to refresh token");
        }

        const tokens = await tokenResponse.json();

        // Update tokens in database
        await ctx.runMutation(api.salla.saveTokens, {
            userId: args.userId, // Multi-tenant: pass userId
            organizationId: args.organizationId, // Multi-tenant: pass organizationId if provided
            merchantId: integration.merchantId,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in || 1209600,
        });

        return { success: true };
    },
});

// Fetch products from Salla API (not stored in Convex)
export const fetchProducts = action({
    args: {
        userId: v.id("users"), // Multi-tenant: user who owns integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
        page: v.optional(v.number()),
        perPage: v.optional(v.number()),
        keyword: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get access token from DB - prioritize organizationId
        const integration = await ctx.runQuery(api.salla.getConnection, { 
          userId: args.userId,
          organizationId: args.organizationId,
        });

        if (!integration) {
            return { connected: false, products: [] };
        }

        // Get the actual integration record to access accessToken
        const integrationRecord = await ctx.runQuery(api.salla.getConnectionWithToken, {
            userId: args.userId,
            organizationId: args.organizationId,
        });

        if (!integrationRecord || !integrationRecord.accessToken) {
            return { connected: false, products: [] };
        }

        const page = args.page || 1;
        const perPage = args.perPage || 20;
        
        let url = `${SALLA_API_BASE}/products?page=${page}&per_page=${perPage}`;
        if (args.keyword) {
            url += `&keyword=${encodeURIComponent(args.keyword)}`;
        }

        const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${integrationRecord.accessToken}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to refresh
                await ctx.runAction(api.salla.refreshToken, { 
                    userId: args.userId,
                    organizationId: args.organizationId,
                });
                return ctx.runAction(api.salla.fetchProducts, { 
                  userId: args.userId,
                  organizationId: args.organizationId,
                  page, 
                  perPage,
                  keyword: args.keyword,
                });
            }
            throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        return {
            connected: true,
            products: data.data?.map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku || `SALLA-${p.id}`,
                price: p.price?.amount || 0,
                originalPrice: p.sale_price?.amount || p.price?.amount || 0,
                currency: p.price?.currency || "SAR",
                stock: p.quantity || 0,
                image: p.main_image || null,
                inStock: p.quantity > 0,
                description: p.description || "",
                url: p.urls?.customer || "",
                status: p.status || "active",
                options: p.options || [],
                images: p.images || [],
            })) || [],
            pagination: {
                currentPage: data.pagination?.current_page || 1,
                totalPages: data.pagination?.total_pages || 1,
                totalItems: data.pagination?.total || 0,
            },
        };
    },
});

// Fetch single product from Salla
export const getProduct = action({
    args: {
        userId: v.id("users"), // Multi-tenant: user who owns integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
        id: v.string(),
    },
    handler: async (ctx, args) => {
        const integration = await ctx.runQuery(api.salla.getConnectionWithToken, { 
          userId: args.userId,
          organizationId: args.organizationId,
        });

        if (!integration || !integration.accessToken) {
            throw new Error("Not connected to Salla");
        }

        const response = await fetch(
            `${SALLA_API_BASE}/products/${args.id}`,
            {
                headers: {
                    Authorization: `Bearer ${integration.accessToken}`,
                },
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                await ctx.runAction(api.salla.refreshToken, { 
                    userId: args.userId,
                    organizationId: args.organizationId,
                });
                return ctx.runAction(api.salla.getProduct, { 
                  userId: args.userId,
                  organizationId: args.organizationId,
                  id: args.id 
                });
            }
            throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        const p = data.data;

        return {
            id: p.id,
            name: p.name,
            sku: p.sku || `SALLA-${p.id}`,
            price: p.price?.amount || 0,
            originalPrice: p.sale_price?.amount || p.price?.amount || 0,
            currency: p.price?.currency || "SAR",
            stock: p.quantity || 0,
            image: p.main_image || null,
            images: p.images || [],
            inStock: p.quantity > 0,
            description: p.description || "",
            url: p.urls?.customer || "",
            status: p.status || "active",
            options: p.options || [],
        };
    },
});

// Internal query to get token (for actions)
export const getConnectionWithToken = query({
    args: { 
        userId: v.id("users"), // Multi-tenant: user who owns integration
        organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns integration
    },
    handler: async (ctx, args) => {
        // Prioritize organizationId, fallback to userId
        let integration;
        if (args.organizationId) {
            integration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .first();
        } else {
            integration = await ctx.db
                .query("sallaIntegrations")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .first();
        }
        return integration;
    },
});
