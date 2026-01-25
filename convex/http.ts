import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { authKit } from "./auth";

const http = httpRouter();

// Register WorkOS AuthKit routes for OAuth callbacks
// WorkOS hosted pages will redirect here after authentication
// authKit.registerRoutes handles the OAuth code exchange and session setup
// It will redirect to the Next.js app URL configured in WorkOS dashboard
authKit.registerRoutes(http);

// Custom /callback route handler for WorkOS OAuth
// WorkOS hosted pages redirect here, then we redirect to Next.js
// Next.js middleware will handle the actual OAuth code exchange and session setup
http.route({
  path: "/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");
    
    console.log(`[AuthKit Callback] Received: ${request.url}`);
    
    // Parse state to get return path (default to /dashboard)
    let returnPath = "/dashboard";
    if (state && state.trim() !== "") {
      try {
        const decodedState = atob(state);
        const stateData = JSON.parse(decodedState);
        if (stateData && stateData.returnPathname) {
          returnPath = stateData.returnPathname;
          if (returnPath === "/") {
            returnPath = "/dashboard";
          }
        }
      } catch (e) {
        console.log("[AuthKit Callback] Could not parse state, using default path:", e);
      }
    }
    
    // Build redirect URL to Next.js app
    const nextJsUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    nextJsUrl.pathname = "/callback";
    
    // Preserve code and state parameters for Next.js middleware to process
    if (code) {
      nextJsUrl.searchParams.set("code", code);
    }
    if (state) {
      nextJsUrl.searchParams.set("state", state);
    }
    if (error) {
      nextJsUrl.searchParams.set("error", error);
    }
    
    // Add returnPath to state or as separate parameter for Next.js
    // Next.js middleware will handle the OAuth code exchange
    const redirectUrl = nextJsUrl.toString();
    console.log(`[AuthKit Callback] Redirecting to Next.js: ${redirectUrl}`);
    return Response.redirect(redirectUrl, 302);
  }),
});

// Webhook route handler - supports /whatsapp/webhook/{userId} and /whatsapp/webhook/{slug} (backward compatibility)
// Convex doesn't support path parameters, so we parse the path manually
http.route({
  pathPrefix: "/whatsapp/webhook/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Extract organization slug, webhook slug, or userId from path
    // Priority: organization slug > webhook slug (wh_) > userId (Convex ID)
    let webhookUserId: string | null = null;
    let webhookSlug: string | null = null;
    let organizationSlug: string | null = null;
    if (pathParts.length === 3 && pathParts[0] === "whatsapp" && pathParts[1] === "webhook") {
      const identifier = pathParts[2];
      // Check if it's a webhook slug (starts with wh_)
      if (identifier.startsWith("wh_")) {
        webhookSlug = identifier;
        console.log(`[HTTP] Webhook verification with webhook slug: ${webhookSlug}`);
      } else {
        // Check if it looks like a Convex ID (starts with m, j, etc. and is alphanumeric)
        // Convex IDs typically start with a letter followed by alphanumeric characters
        const convexIdPattern = /^[a-z][a-z0-9]+$/i;
        if (convexIdPattern.test(identifier) && identifier.length > 10) {
          // Likely a Convex userId
          webhookUserId = identifier;
          console.log(`[HTTP] Webhook verification with userId: ${webhookUserId}`);
        } else {
          // Treat as organization slug
          organizationSlug = identifier;
          console.log(`[HTTP] Webhook verification with organization slug: ${organizationSlug}`);
        }
      }
    }

    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log(`[HTTP] Webhook verification request:`, {
      path: url.pathname,
      mode,
      hasToken: !!token,
      hasChallenge: !!challenge,
      userId: webhookUserId || "none",
      webhookSlug: webhookSlug || "none",
      organizationSlug: organizationSlug || "none",
    });

    if (!mode || !token || !challenge) {
      console.error(`[HTTP] Missing required parameters:`, { mode, hasToken: !!token, hasChallenge: !!challenge });
      return new Response("BadRequest: Missing hub.mode, hub.verify_token, or hub.challenge", { status: 400 });
    }

    try {
      const result = await ctx.runAction(internal.whatsapp.verifyWebhook, {
        mode,
        verify_token: token,
        challenge,
        ...(organizationSlug != null && { organization_slug: organizationSlug }),
        ...(webhookSlug != null && { webhook_slug: webhookSlug }),
        ...(webhookUserId != null && { user_id: webhookUserId }),
      });

      if (result.success) {
        // Webhook verification succeeded - it's already marked as verified in verifyWebhook action
        const identifier = organizationSlug || webhookSlug || webhookUserId || "default";
        console.log(`[HTTP] ✓ Webhook verification successful for ${identifier}`);
        return new Response(result.challenge, { 
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      } else {
        const identifier = organizationSlug || webhookSlug || webhookUserId || "default";
        console.error(`[HTTP] ✗ Webhook verification failed for ${identifier}`);
        console.error(`[HTTP] Token received: ${token.substring(0, 10)}...`);
        return new Response("Forbidden: Verify token mismatch", { status: 403 });
      }
    } catch (error: any) {
      console.error(`[HTTP] Error during webhook verification:`, error);
      return new Response(`Internal Server Error: ${error.message || "Unknown error"}`, { status: 500 });
    }
  }),
});

http.route({
  pathPrefix: "/whatsapp/webhook/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Extract organization slug, webhook slug, or userId from path
    // Priority: organization slug > webhook slug (wh_) > userId (Convex ID)
    let webhookUserId: string | null = null;
    let webhookSlug: string | null = null;
    let organizationSlug: string | null = null;
    if (pathParts.length === 3 && pathParts[0] === "whatsapp" && pathParts[1] === "webhook") {
      const identifier = pathParts[2];
      // Check if it's a webhook slug (starts with wh_)
      if (identifier.startsWith("wh_")) {
        webhookSlug = identifier;
        console.log(`[HTTP] Webhook POST with webhook slug: ${webhookSlug}`);
      } else {
        // Check if it looks like a Convex ID (starts with m, j, etc. and is alphanumeric)
        const convexIdPattern = /^[a-z][a-z0-9]+$/i;
        if (convexIdPattern.test(identifier) && identifier.length > 10) {
          // Likely a Convex userId
          webhookUserId = identifier;
          console.log(`[HTTP] Webhook POST with userId: ${webhookUserId}`);
        } else {
          // Treat as organization slug
          organizationSlug = identifier;
          console.log(`[HTTP] Webhook POST with organization slug: ${organizationSlug}`);
        }
      }
    }

    const identifier = organizationSlug || webhookSlug || webhookUserId || "";
    console.log(`[HTTP] Webhook received: ${request.method} ${request.url}${identifier ? ` (${identifier})` : ""}`);

    let body;
    try {
      body = await request.json();
      console.log("[HTTP] Webhook Body:", JSON.stringify(body, null, 2));
    } catch (e) {
      console.error("[HTTP] Failed to parse JSON:", e);
      return new Response("Bad Request: Invalid JSON", { status: 400 });
    }

    await ctx.runMutation(internal.webhookEvents.logWhatsappWebhook, { body });

    // Dispatch to internal mutation to handle async scheduling
    try {
      await ctx.runMutation(internal.whatsapp.dispatchWebhook, { body });
      console.log("[HTTP] Webhook Dispatched Successfully");
    } catch (e) {
      console.error("[HTTP] Dispatch Error:", e);
      return new Response("Internal Server Error", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  }),
});

// GET /salla/callback: OAuth Callback from Salla
http.route({
  path: "/salla/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    console.log(`[Salla Callback] Received request: ${request.url}`);

    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const state = url.searchParams.get("state");

    console.log(`[Salla Callback] Params - Code: ${code ? "Present" : "Missing"}, Error: ${error}, State: ${state}`);

    // Handle errors from Salla
    if (error) {
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/integrations?error=${error}`;
      return Response.redirect(redirectUrl, 302);
    }

    // No code provided
    if (!code) {
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/integrations?error=no_code`;
      return Response.redirect(redirectUrl, 302);
    }

    try {
      // Get current authenticated user
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/login`;
        return Response.redirect(redirectUrl, 302);
      }

      // Get our app's user record
      const user = await ctx.runQuery(api.auth.getByAuthId, { 
        authId: identity.subject 
      });
      if (!user) {
        throw new Error("User not found");
      }

      // Get user's current organization (if available)
      const organizationId = user.currentOrganizationId || undefined;

      // Exchange code for tokens
      await ctx.runAction(internal.salla.exchangeCode, { 
        userId: user._id, // Multi-tenant: pass userId
        organizationId: organizationId, // Multi-tenant: pass organizationId if available
        code 
      });

      // Redirect to integrations page with success
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/integrations?success=true`;
      return Response.redirect(redirectUrl, 302);
    } catch (err) {
      console.error("Salla OAuth error:", err);
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/integrations?error=token_exchange_failed`;
      return Response.redirect(redirectUrl, 302);
    }
  }),
});

export default http;
