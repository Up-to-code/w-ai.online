// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { action, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import {
  categorizeWhatsAppError,
  validateAndCleanPhoneNumber,
  WhatsAppAPIError,
  createErrorReport,
} from "./errorUtils";
import { logger } from "./logger";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

// --- Actions (External API Calls) ---

export const sendMessage = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    to: v.string(),
    type: v.string(), // text, image, template, etc.
    content: v.any(), // Structure depends on type
    messageId: v.optional(v.id("messages")), // internal DB ID
  },
  handler: async (ctx, args) => {
    // Get Meta tokens - organization-scoped
    const envVars = await ctx.runQuery(api.vault.getEnvVars, {
      organizationId: args.organizationId,
    });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const phoneId = envVars.META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneId) {
      logger.error("[WhatsApp] Missing Meta tokens for organization", args.organizationId);
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    // Check if webhook is verified before allowing send
    const verificationStatus = await ctx.runQuery(api.webhooks.getWebhookVerificationStatus, {
      organizationId: args.organizationId,
    });

    if (!verificationStatus.isVerified) {
      logger.error("[WhatsApp] Webhook not verified for organization", args.organizationId);
      throw new Error("Webhook غير مُتحقق منه. يرجى التحقق من Webhook في Meta Developer Console أولاً. اذهب إلى الإعدادات > التكاملات > Webhook للتكوين.");
    }

    // Validate and clean phone number
    let recipient: string;
    try {
      recipient = validateAndCleanPhoneNumber(args.to);
    } catch (err) {
      const error = err as Error;
      logger.error("[WhatsApp] Phone number validation failed:", error.message);
      throw error;
    }

    logger.debug(`[WhatsApp] Preparing to send to cleaned recipient: ${recipient} (original was ${args.to})`);

    const payload: any = {
      messaging_product: "whatsapp",
      to: recipient,
      type: args.type,
      [args.type]: args.content,
    };

    logger.debug(`[WhatsApp] Sending payload to ${recipient} via ${WHATSAPP_API_URL}/${phoneId}/messages`);
    logger.debug(`[WhatsApp] Payload:`, JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      logger.debug(`[WhatsApp] Meta API Response Status: ${response.status} ${response.statusText}`);
      const data = await response.json();

      if (!response.ok) {
        const errorCode = data.error?.code || response.status;
        const errorMessage = data.error?.message || "Unknown error";
        const errorCategory = categorizeWhatsAppError(errorCode, errorMessage);

        logger.error(
          `[WhatsApp] API Error (${errorCategory.category}):`,
          JSON.stringify(data),
          `Retryable: ${errorCategory.retryable}`
        );

        // Create structured error report with proper error code and category
        const errorForReport = new Error(errorMessage) as Error & { code?: number; category?: string; retryable?: boolean };
        errorForReport.code = errorCode;
        errorForReport.category = errorCategory.category;
        errorForReport.retryable = errorCategory.retryable;
        const errorReport = createErrorReport(
          errorForReport,
          { contact: args.to, phone: recipient }
        );
        logger.debug("[WhatsApp] Error Report:", JSON.stringify(errorReport, null, 2));

        // Create user-friendly error message for specific error codes
        let userFriendlyMessage = errorMessage;
        if (errorCode === 131030) {
          // Phone number not in allowed list (test mode)
          userFriendlyMessage = `رقم الهاتف ${recipient} غير موجود في قائمة الأرقام المسموحة. يرجى إضافة هذا الرقم إلى قائمة الأرقام المسموحة في Meta Developer Console:\n\n1. افتح https://developers.facebook.com/apps\n2. اختر تطبيقك\n3. اذهب إلى WhatsApp > API Setup\n4. أضف الرقم إلى "To" field في قسم "Send and receive test messages"\n\nPhone number ${recipient} is not in the allowed list. Please add it to the allowed recipient list in Meta Developer Console.`;
        }

        // Create and throw a typed error
        // Ensure properties are enumerable so they survive serialization across action boundaries
        const error = new Error(userFriendlyMessage) as Error & { 
          code?: number; 
          category?: string; 
          retryable?: boolean;
        };
        
        // Set properties and make them enumerable
        Object.defineProperty(error, 'code', { 
          value: errorCode, 
          enumerable: true, 
          writable: true,
          configurable: true
        });
        Object.defineProperty(error, 'category', { 
          value: errorCategory.category, 
          enumerable: true, 
          writable: true,
          configurable: true
        });
        Object.defineProperty(error, 'retryable', { 
          value: errorCategory.retryable, 
          enumerable: true, 
          writable: true,
          configurable: true
        });

        throw error;
      }

      logger.info("[WhatsApp] Send Success:", JSON.stringify(data));

      // Link Meta ID to Internal Message
      if (args.messageId && data.messages?.[0]?.id) {
        const wamid = data.messages[0].id;
        await ctx.runMutation((internal as any).chat.updateMessageMetaId, {
          messageId: args.messageId,
          metaMessageId: wamid,
        });
        logger.debug(`[WhatsApp] Linked local msg ${args.messageId} to wamid ${wamid}`);
      }

      return data;
    } catch (error) {
      // Log structured error info
      const err = error as Error & { code?: number; category?: string; retryable?: boolean };
      logger.error("[WhatsApp] Exception during send:", {
        message: err.message,
        code: err.code,
        category: err.category,
        retryable: err.retryable,
        stack: err.stack,
      });
      throw error;
    }
  },
});

export const createTemplate = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.string(),
    language: v.string(),
    category: v.string(),
    components: v.any(), // Array of components
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const wabaId = envVars.META_WABA_ID;

    if (!accessToken || !wabaId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    const payload = {
      name: args.name,
      category: args.category,
      allow_category_change: true,
      language: args.language,
      components: args.components,
    };

    logger.debug("Creating Template Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${WHATSAPP_API_URL}/${wabaId}/message_templates`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("WhatsApp Template Creation Error:", data);
      throw new Error(`WhatsApp API Error: ${data.error?.message || "Unknown error"}`);
    }

    // Get user for backward compatibility
    const user = await ctx.runQuery(api.auth.getCurrentUser, {});

    // Upsert into local DB
    await ctx.runMutation((internal as any).templates.upsert, {
      organizationId: args.organizationId,
      userId: user?._id, // Keep for backward compatibility
      name: args.name,
      language: args.language,
      category: args.category,
      status: "PENDING", // Initial status from Meta is usually PENDING or APPROVED depending on cat
      components: args.components,
      metaTemplateId: data.id,
    });

    return data;
  },
});

export const fetchTemplates = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const wabaId = envVars.META_WABA_ID;

    if (!accessToken || !wabaId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${wabaId}/message_templates?limit=100`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("WhatsApp Fetch Templates Error:", data);
      throw new Error(`WhatsApp API Error: ${data.error?.message || "Unknown error"}`);
    }

    return data.data || [];
  },
});

export const markAsRead = action({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    messageId: v.string() 
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const phoneId = envVars.META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneId) {
      logger.error("Missing Meta tokens for organization", args.organizationId);
      return;
    }

    try {
      await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: args.messageId,
        }),
      });
    } catch (error) {
      logger.error("Failed to mark message as read:", error);
    }
  },
});

export const getTemplate = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const wabaId = envVars.META_WABA_ID;

    if (!accessToken || !wabaId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${wabaId}/message_templates?name=${args.name}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("WhatsApp Get Template Error:", data);
      throw new Error(`WhatsApp API Error: ${data.error?.message || "Unknown error"}`);
    }

    return data.data?.[0] || null;
  },
});

export const deleteTemplate = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const wabaId = envVars.META_WABA_ID;

    if (!accessToken || !wabaId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${wabaId}/message_templates?name=${args.name}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("WhatsApp Delete Template Error:", data);
      throw new Error(`WhatsApp API Error: ${data.error?.message || "Unknown error"}`);
    }

    return data;
  },
});


export const uploadMedia = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    storageId: v.string(),
    type: v.string(), // image/jpeg, etc.
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const phoneId = envVars.META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    // 1. Get File URL from Convex
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("File not found");

    // 2. Fetch the file content
    const fileRes = await fetch(fileUrl);
    const blob = await fileRes.blob();

    // 3. Prepare Form Data
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("type", args.type);
    formData.append("messaging_product", "whatsapp");

    // 4. Upload to Meta
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/media`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}` },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error("Media Upload Error:", data);
      
      // Handle specific error codes
      const errorCode = data.error?.code;
      const errorMessage = data.error?.message || "Upload failed";
      
      if (errorCode === 190) {
        // Authentication Error (OAuthException)
        const error = new Error("WhatsApp API Authentication Error: Invalid or expired access token. Please check your WHATSAPP_ACCESS_TOKEN environment variable.") as Error & { code?: number; category?: string };
        error.code = 190;
        error.category = "AUTH_ERROR";
        logger.error("[WhatsApp] Authentication failed - check access token validity");
        throw error;
      } else if (errorCode === 131047) {
        // Media type not supported
        const error = new Error(`Media type not supported: ${args.type}`) as Error & { code?: number; category?: string };
        error.code = 131047;
        error.category = "MEDIA_TYPE_ERROR";
        throw error;
      } else if (errorCode === 131026) {
        // File too large
        const error = new Error("File size exceeds WhatsApp limits (16MB for images, 16MB for videos)") as Error & { code?: number; category?: string };
        error.code = 131026;
        error.category = "FILE_SIZE_ERROR";
        throw error;
      }
      
      // Generic error with code
      const error = new Error(errorMessage) as Error & { code?: number; category?: string };
      if (errorCode) {
        error.code = errorCode;
        error.category = "UPLOAD_ERROR";
      }
      throw error;
    }

    return data.id; // Meta Media ID
  }
});

/**
 * Upload media from an external URL and get a WhatsApp Media ID.
 * This is used for sending carousel templates where we need fresh media IDs.
 * The returned media ID is valid for 30 days and can be used in send requests.
 */
export const uploadMediaFromUrl = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    url: v.string(),      // External URL to the image/video
    type: v.string(),     // "image" or "video"
    mimeType: v.optional(v.string()), // Optional: specific mime type like "image/jpeg"
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const phoneId = envVars.META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    logger.debug(`[uploadMediaFromUrl] Fetching media from: ${args.url.substring(0, 80)}...`);

    // 1. Fetch the file from external URL
    const fileRes = await fetch(args.url);
    if (!fileRes.ok) {
      logger.error(`[uploadMediaFromUrl] Failed to fetch: ${fileRes.status} ${fileRes.statusText}`);
      throw new Error(`Failed to fetch media from URL: ${fileRes.status} ${fileRes.statusText}`);
    }

    const blob = await fileRes.blob();
    const contentType = args.mimeType || 
                        fileRes.headers.get("content-type") || 
                        (args.type === "video" ? "video/mp4" : "image/jpeg");

    logger.debug(`[uploadMediaFromUrl] Uploading ${contentType}, size: ${blob.size} bytes`);

    // 2. Prepare Form Data for WhatsApp Media API
    const formData = new FormData();
    formData.append("file", blob, `media.${args.type === "video" ? "mp4" : "jpg"}`);
    formData.append("type", contentType);
    formData.append("messaging_product", "whatsapp");

    // 3. Upload to WhatsApp Media API
    const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/media`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}` },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error("[uploadMediaFromUrl] Upload Error:", data);
      throw new Error(data.error?.message || "Failed to upload media to WhatsApp");
    }

    logger.debug(`[uploadMediaFromUrl] Success! Media ID: ${data.id}`);
    return data.id; // WhatsApp Media ID to use in send requests
  }
});

export const uploadTemplateMedia = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    storageId: v.string(),
    type: v.string(), // image/jpeg, video/mp4, etc.
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const appId = envVars.META_APP_ID;

    if (!accessToken || !appId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    // 1. Get File URL and Content
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) throw new Error("File not found");

    const fileRes = await fetch(fileUrl);
    const blob = await fileRes.blob();
    const fileLength = blob.size;

    logger.debug(`[UploadTemplateMedia] Starting upload for ${args.type}, size: ${fileLength}`);

    // 2. Start Upload Session
    const sessionUrl = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${fileLength}&file_type=${args.type}`;

    const sessionRes = await fetch(sessionUrl, {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}` // Note: OAuth prefix sometimes required for this specific endpoint, or Bearer
      }
    });

    const sessionData = await sessionRes.json();

    if (!sessionRes.ok) {
      logger.error("Failed to create upload session:", sessionData);
      throw new Error(sessionData.error?.message || "Failed to create upload session");
    }

    const uploadId = sessionData.id;
    logger.debug(`[UploadTemplateMedia] Session created: ${uploadId}`);

    // 3. Upload File Content
    const uploadUrl = `https://graph.facebook.com/v21.0/${uploadId}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}`,
        "file_offset": "0"
      },
      body: blob
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      logger.error("Failed to upload file content:", uploadData);
      throw new Error(uploadData.error?.message || "Failed to upload file content");
    }

    logger.debug(`[UploadTemplateMedia] Upload complete, handle: ${uploadData.h}`);

    // Return the handle
    return uploadData.h;
  }
});

export const uploadExternalTemplateMedia = action({
  args: {
    organizationId: v.id("organizations"), // Organization-scoped
    url: v.string(),
    type: v.string(), // image/jpeg, video/mp4, etc.
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    const appId = envVars.META_APP_ID;

    if (!accessToken || !appId) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    // 1. Fetch File Content from External URL
    logger.debug(`[UploadExternal] Fetching from ${args.url}`);
    const fileRes = await fetch(args.url);
    if (!fileRes.ok) throw new Error(`Failed to fetch external media: ${fileRes.statusText}`);

    const blob = await fileRes.blob();
    const fileLength = blob.size;
    const fileType = args.type || fileRes.headers.get("content-type") || "image/jpeg";

    logger.debug(`[UploadExternal] Starting upload for ${fileType}, size: ${fileLength}`);

    // 2. Start Upload Session
    const sessionUrl = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${fileLength}&file_type=${fileType}`;

    const sessionRes = await fetch(sessionUrl, {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}`
      }
    });

    const sessionData = await sessionRes.json();

    if (!sessionRes.ok) {
      logger.error("Failed to create upload session:", sessionData);
      throw new Error(sessionData.error?.message || "Failed to create upload session");
    }

    const uploadId = sessionData.id;

    // 3. Upload File Content
    const uploadUrl = `https://graph.facebook.com/v21.0/${uploadId}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}`,
        "file_offset": "0"
      },
      body: blob
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      logger.error("Failed to upload file content:", uploadData);
      throw new Error(uploadData.error?.message || "Failed to upload file content");
    }

    logger.debug(`[UploadExternal] Upload complete, handle: ${uploadData.h}`);

    return uploadData.h;
  }
});

export const getMediaUrl = action({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    mediaId: v.string() 
  },
  handler: async (ctx, args) => {
    // Get organization's Meta tokens
    const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
    const accessToken = envVars.META_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Meta WhatsApp not connected. Please connect your Meta account in Settings.");
    }

    const response = await fetch(`${WHATSAPP_API_URL}/${args.mediaId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Failed to get media URL");

    return data.url; // The temporary download URL
  }
});

export const hydrateIncomingMedia = internalAction({
  args: { 
    organizationId: v.id("organizations"), // Organization-scoped
    messageId: v.id("messages"), 
    mediaId: v.string() 
  },
  handler: async (ctx, args) => {
    try {
      // Get organization's Meta tokens
      const envVars = await ctx.runQuery(api.vault.getEnvVars, { organizationId: args.organizationId });
      const accessToken = envVars.META_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("Meta WhatsApp not connected for organization");
      }
      const downloadUrl = await ctx.runAction(api.whatsapp.getMediaUrl, { 
        organizationId: args.organizationId,
        mediaId: args.mediaId 
      });
      const response = await fetch(downloadUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.status}`);
      }
      const blob = await response.blob();
      const storageId = await ctx.storage.store(blob);
      await ctx.runMutation((internal as any).messages.updateMessageStorageId, {
        messageId: args.messageId,
        storageId,
      });
    } catch (error) {
      logger.error("[WhatsApp] hydrateIncomingMedia failed:", error);
    }
  },
});

// --- Webhook Verification ---

export const verifyWebhook = internalAction({
  args: {
    mode: v.optional(v.string()),
    verify_token: v.optional(v.string()),
    challenge: v.optional(v.string()),
    user_id: v.optional(v.string()), // Backward compatibility: UserId from URL path
    organization_slug: v.optional(v.string()), // Organization slug from URL path
    webhook_slug: v.optional(v.string()), // Backward compatibility: Unique webhook identifier for fast lookup
  },
  handler: async (ctx, args) => {
    logger.debug("[VerifyWebhook] Received:", { 
      mode: args.mode, 
      token: args.verify_token ? `${args.verify_token.substring(0, 10)}...` : "missing", 
      userId: args.user_id,
      organizationSlug: args.organization_slug,
      slug: args.webhook_slug 
    });

    if (args.mode !== "subscribe" || !args.verify_token) {
      logger.error("[VerifyWebhook] Invalid mode or missing token", { 
        mode: args.mode, 
        hasToken: !!args.verify_token 
      });
      return { success: false };
    }

    let verifiedWebhookConfig = null;

    // Priority 1: If organization_slug is provided, lookup organization and verify by organizationId + token
    if (args.organization_slug) {
      logger.debug(`[VerifyWebhook] Attempting lookup by organization slug: ${args.organization_slug}`);
      try {
        // Get organization by slug
        const organization = await ctx.runQuery(api.organizations.getOrganizationBySlug, {
          slug: args.organization_slug,
        });

        if (organization) {
          const webhookConfig = await ctx.runQuery(api.webhooks.getWebhookByOrganizationIdAndToken, {
            organizationId: organization._id,
            verifyToken: args.verify_token,
          });

          if (webhookConfig) {
            const storedToken = webhookConfig.verifyToken?.trim() || "";
            const receivedToken = args.verify_token?.trim() || "";
            logger.debug(`[VerifyWebhook] ✓ OrganizationSlug+Token matched: ${webhookConfig.name} (org: ${webhookConfig.organizationId})`);
            logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), stored="${storedToken.substring(0, 15)}..." (length: ${storedToken.length})`);
            verifiedWebhookConfig = webhookConfig;
          } else {
            const receivedToken = args.verify_token?.trim() || "";
            logger.error(`[VerifyWebhook] ✗ OrganizationSlug+Token verification failed for slug: ${args.organization_slug}, token: "${receivedToken.substring(0, 15)}..."`);
          }
        } else {
          logger.error(`[VerifyWebhook] ✗ Organization not found for slug: ${args.organization_slug}`);
        }
      } catch (err) {
        logger.error(`[VerifyWebhook] Error looking up by organization slug: ${err}`);
      }
    }

    // Priority 2: If userId is provided and no org match, use fast lookup by userId + token (backward compatibility)
    if (!verifiedWebhookConfig && args.user_id) {
      logger.debug(`[VerifyWebhook] Attempting lookup by userId: ${args.user_id}`);
      try {
        const webhookConfig = await ctx.runQuery(api.webhooks.getWebhookByUserIdAndToken, {
          userId: args.user_id as any, // Cast to Id<"users">
          verifyToken: args.verify_token,
        });

        if (webhookConfig) {
          const storedToken = webhookConfig.verifyToken?.trim() || "";
          const receivedToken = args.verify_token?.trim() || "";
          logger.debug(`[VerifyWebhook] ✓ UserId+Token matched: ${webhookConfig.name} (user: ${webhookConfig.userId})`);
          logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), stored="${storedToken.substring(0, 15)}..." (length: ${storedToken.length})`);
          verifiedWebhookConfig = webhookConfig;
        } else {
          const receivedToken = args.verify_token?.trim() || "";
          logger.error(`[VerifyWebhook] ✗ UserId+Token verification failed for userId: ${args.user_id}, token: "${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length})`);
          // Try to see if webhook exists but token doesn't match
          const userWebhooks = await ctx.runQuery(api.webhooks.listWebhooks, {
            userId: args.user_id as any,
          });
          if (userWebhooks && userWebhooks.length > 0) {
            logger.debug(`[VerifyWebhook] Found ${userWebhooks.length} webhook(s) for user, but token mismatch:`);
            userWebhooks.forEach((w, idx) => {
              const storedToken = w.verifyToken?.trim() || "";
              logger.debug(`[VerifyWebhook]   Webhook ${idx + 1}: stored="${storedToken.substring(0, 20)}..." (length: ${storedToken.length}), received="${receivedToken.substring(0, 20)}..." (length: ${receivedToken.length}), match: ${storedToken === receivedToken}`);
            });
          } else {
            logger.debug(`[VerifyWebhook] No webhooks found for userId: ${args.user_id}`);
          }
        }
      } catch (err) {
        logger.error(`[VerifyWebhook] Error looking up by userId: ${err}`);
      }
    }

    // Priority 3: If webhook_slug is provided and no match yet, use fast lookup by slug + token (backward compatibility)
    if (!verifiedWebhookConfig && args.webhook_slug) {
      logger.debug(`[VerifyWebhook] Attempting lookup by slug: ${args.webhook_slug}`);
      const webhookConfig = await ctx.runQuery(api.webhooks.getWebhookBySlugAndToken, {
        webhookSlug: args.webhook_slug,
        verifyToken: args.verify_token,
      });

      if (webhookConfig) {
        const storedToken = webhookConfig.verifyToken?.trim() || "";
        const receivedToken = args.verify_token?.trim() || "";
        logger.debug(`[VerifyWebhook] ✓ Slug+Token matched: ${webhookConfig.name} (user: ${webhookConfig.userId}, slug: ${webhookConfig.webhookSlug})`);
        logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), stored="${storedToken.substring(0, 15)}..." (length: ${storedToken.length})`);
        verifiedWebhookConfig = webhookConfig;
      } else {
        const receivedToken = args.verify_token?.trim() || "";
        logger.error(`[VerifyWebhook] ✗ Slug+Token verification failed for slug: ${args.webhook_slug}, token: "${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length})`);
      }
    }

    // Fallback: Try to find webhook by token only (backward compatibility)
    if (!verifiedWebhookConfig) {
      logger.debug("[VerifyWebhook] Attempting lookup by token only (fallback)");
      const webhookConfig = await ctx.runQuery(api.webhooks.getWebhookByToken, {
        verifyToken: args.verify_token,
      });

      if (webhookConfig) {
        const storedToken = webhookConfig.verifyToken?.trim() || "";
        const receivedToken = args.verify_token?.trim() || "";
        logger.debug(`[VerifyWebhook] ✓ Token matched in webhook config: ${webhookConfig.name} (user: ${webhookConfig.userId})`);
        logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), stored="${storedToken.substring(0, 15)}..." (length: ${storedToken.length})`);
        verifiedWebhookConfig = webhookConfig;
      } else {
        const receivedToken = args.verify_token?.trim() || "";
        logger.error(`[VerifyWebhook] ✗ Token-only lookup failed for token: "${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length})`);
      }
    }

    // If webhook config found, mark it as verified
    if (verifiedWebhookConfig) {
      await ctx.runMutation(api.webhooks.markWebhookVerified, {
        webhookId: verifiedWebhookConfig._id,
        organizationId: verifiedWebhookConfig.organizationId,
      });
      logger.info(`[VerifyWebhook] Webhook marked as verified: ${verifiedWebhookConfig.name}`);
      return { success: true, challenge: args.challenge };
    }

    // Fallback: Try to find an organization with matching webhook verify token from Vault
    let matchedOrganizationId: string | null = null;
    let matchedUserId: string | null = null;
    
    if (!verifiedWebhookConfig) {
      logger.debug("[VerifyWebhook] Trying Organization Vault fallback lookup...");
      const allOrganizations = await ctx.runQuery(api.organizations.listAll, {});
      logger.debug(`[VerifyWebhook] Checking ${allOrganizations.length} organizations for matching token`);
      
      for (const org of allOrganizations) {
        try {
          const envVars = await ctx.runQuery(api.vault.getOrganizationEnvVars, { organizationId: org._id });
          const orgVerifyToken = envVars.META_WEBHOOK_VERIFY_TOKEN;
          
          // Trim tokens for comparison
          const storedToken = orgVerifyToken?.trim() || "";
          const receivedToken = args.verify_token?.trim() || "";
          
          if (orgVerifyToken && storedToken === receivedToken) {
            logger.debug(`[VerifyWebhook] ✓ Token matched for organization: ${org._id} via Vault`);
            logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), stored="${storedToken.substring(0, 15)}..." (length: ${storedToken.length})`);
            matchedOrganizationId = org._id;
            break;
          } else if (orgVerifyToken) {
            logger.debug(`[VerifyWebhook] ✗ Token mismatch for organization ${org._id}:`);
            logger.debug(`[VerifyWebhook]   Received: "${receivedToken.substring(0, 20)}..." (length: ${receivedToken.length})`);
            logger.debug(`[VerifyWebhook]   Stored:   "${storedToken.substring(0, 20)}..." (length: ${storedToken.length})`);
            logger.debug(`[VerifyWebhook]   Exact match: ${storedToken === receivedToken}`);
          }
        } catch (err) {
          // Skip organizations without vault variables
          logger.debug(`[VerifyWebhook] Error checking vault for organization ${org._id}: ${err}`);
          continue;
        }
      }

      // Fallback to user vault (backward compatibility)
      if (!matchedOrganizationId) {
        logger.debug("[VerifyWebhook] Trying User Vault fallback lookup...");
        const allUsers = await ctx.runQuery(api.users.list, {});
        logger.debug(`[VerifyWebhook] Checking ${allUsers.length} users for matching token`);
        
        for (const user of allUsers) {
          try {
            const envVars = await ctx.runQuery(api.vault.getUserEnvVars, { userId: user._id });
            const userVerifyToken = envVars.META_WEBHOOK_VERIFY_TOKEN;
            
            // Trim tokens for comparison
            const storedToken = userVerifyToken?.trim() || "";
            const receivedToken = args.verify_token?.trim() || "";
            
            if (userVerifyToken && storedToken === receivedToken) {
              logger.debug(`[VerifyWebhook] ✓ Token matched for user: ${user._id} via Vault`);
              logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), stored="${storedToken.substring(0, 15)}..." (length: ${storedToken.length})`);
              matchedUserId = user._id;
              break;
            }
          } catch (err) {
            // Skip users without vault variables
            logger.debug(`[VerifyWebhook] Error checking vault for user ${user._id}: ${err}`);
            continue;
          }
        }
      }

      // Final fallback to environment variable for backward compatibility
      if (!matchedOrganizationId && !matchedUserId) {
        const envVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        const storedEnvToken = envVerifyToken?.trim() || "";
        const receivedToken = args.verify_token?.trim() || "";
        if (envVerifyToken && storedEnvToken === receivedToken) {
          logger.debug("[VerifyWebhook] ✓ Token matched from environment variable");
          logger.debug(`[VerifyWebhook] Token details: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), env="${storedEnvToken.substring(0, 15)}..." (length: ${storedEnvToken.length})`);
          // For env variable, we can't identify specific org/user, so skip marking as verified
          // This is backward compatibility only
          return { success: true, challenge: args.challenge };
        } else if (envVerifyToken) {
          logger.debug(`[VerifyWebhook] ✗ Environment variable token mismatch: received="${receivedToken.substring(0, 15)}..." (length: ${receivedToken.length}), env="${storedEnvToken.substring(0, 15)}..." (length: ${storedEnvToken.length})`);
        }
      }

      // If we found an organization via Vault token, try to find and mark their webhook as verified
      if (matchedOrganizationId && !verifiedWebhookConfig) {
        logger.debug(`[VerifyWebhook] Found organization via Vault token, looking up webhook for organization: ${matchedOrganizationId}`);
        const orgWebhooks = await ctx.runQuery(api.webhooks.listWebhooks, {
          organizationId: matchedOrganizationId,
        });
        const activeWebhook = orgWebhooks?.find((w: any) => w.isActive);
        if (activeWebhook) {
          await ctx.runMutation(api.webhooks.markWebhookVerified, {
            webhookId: activeWebhook._id,
            organizationId: matchedOrganizationId,
          });
          logger.info(`[VerifyWebhook] ✓ Webhook marked as verified via Vault token for organization: ${matchedOrganizationId}`);
          return { success: true, challenge: args.challenge };
        } else {
          logger.error(`[VerifyWebhook] ✗ No active webhook found for organization ${matchedOrganizationId} even though token matched in Vault`);
        }
      }

      // If we found a user via Vault token (backward compatibility), try to find and mark their webhook as verified
      if (matchedUserId && !verifiedWebhookConfig) {
        logger.debug(`[VerifyWebhook] Found user via Vault token, looking up webhook for user: ${matchedUserId}`);
        const userWebhooks = await ctx.runQuery(api.webhooks.listWebhooks, {
          userId: matchedUserId,
        });
        const activeWebhook = userWebhooks?.find((w: any) => w.isActive);
        if (activeWebhook) {
          await ctx.runMutation(api.webhooks.markWebhookVerified, {
            webhookId: activeWebhook._id,
            organizationId: activeWebhook.organizationId,
          });
          logger.info(`[VerifyWebhook] ✓ Webhook marked as verified via Vault token for user: ${matchedUserId}`);
          return { success: true, challenge: args.challenge };
        } else {
          logger.error(`[VerifyWebhook] ✗ No active webhook found for user ${matchedUserId} even though token matched in Vault`);
        }
      }
    }

    if (verifiedWebhookConfig || matchedOrganizationId || matchedUserId) {
      logger.info("[VerifyWebhook] ✓ Webhook Verified Successfully!");
      return { success: true, challenge: args.challenge };
    } else {
      logger.error("[VerifyWebhook] ✗ Webhook Verification Failed - No matching token found");
      logger.debug("[VerifyWebhook] Summary:", {
        receivedToken: args.verify_token ? `${args.verify_token.substring(0, 10)}...` : "missing",
        userId: args.user_id || "none",
        organizationSlug: args.organization_slug || "none",
        slug: args.webhook_slug || "none",
        checkedWebhookConfigs: true,
        checkedVault: true,
        checkedEnvVar: true,
      });
      return { success: false };
    }
  }
});

// --- Webhook Processing ---

// --- Async Webhook Processing ---

export const dispatchWebhook = internalMutation({
  args: { body: v.any() },
  handler: async (ctx, args) => {
    // Fire and forget via scheduler
    await ctx.scheduler.runAfter(0, internal.whatsapp.processWebhookAction, {
      body: args.body,
      attempt: 1
    });
  }
});

export const processWebhookAction = internalAction({
  args: {
    body: v.any(),
    attempt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const change = args.body.entry?.[0]?.changes?.[0];
    const value = change?.value;
    const field = change?.field;

    logger.info(`[Webhook Action] Processing field: ${field}`);

    if (!value) {
      logger.warn("[Webhook Action] No value found in change object:", JSON.stringify(change));
      return;
    }

    // CRITICAL: Identify user from phone_number_id
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
      logger.error("[Webhook Action] No phone_number_id found in webhook payload");
      return;
    }

    // Lookup userId/organizationId from phoneNumberId
    const lookup = await ctx.runQuery(internal.meta.getUserIdByPhoneNumberId, {
      phoneNumberId,
    });

    if (!lookup || (!lookup.userId && !lookup.organizationId)) {
      logger.error(`[Webhook Action] No user/organization found for phone_number_id: ${phoneNumberId}`);
      return; // Don't process webhook if not found
    }

    let userId = lookup.userId;
    let organizationId = lookup.organizationId;
    
    // If organizationId is missing but userId exists, get it from user's currentOrganizationId
    if (!organizationId && userId) {
      try {
        const user = await ctx.runQuery(api.auth.getUser, { userId });
        if (user?.currentOrganizationId) {
          organizationId = user.currentOrganizationId;
          logger.debug(`[Webhook Action] Retrieved organizationId ${organizationId} from user ${userId}`);
        }
      } catch (error) {
        logger.error(`[Webhook Action] Failed to get user for userId ${userId}:`, error);
      }
    }
    
    // Final check: organizationId is required for processing
    if (!organizationId) {
      logger.error(`[Webhook Action] No organizationId found for phone_number_id: ${phoneNumberId}, userId: ${userId}. Skipping webhook processing.`);
      return; // Don't process without organization
    }
    
    logger.info(`[Webhook Action] Identified user: ${userId}, organization: ${organizationId} for phone_number_id: ${phoneNumberId}`);

    // Handle Messages
    if (value.messages) {
      logger.info(`[Webhook Action] Processing ${value.messages.length} messages`);
      for (const message of value.messages) {
        let content = message.text?.body || "";
        let mediaId = undefined;

        if (["image", "video", "audio", "document", "voice"].includes(message.type)) {
          const mediaData = message[message.type];
          mediaId = mediaData.id;
          content = mediaData.caption || "";
          logger.debug(`[Webhook Action] Found media: ${message.type}, ID: ${mediaId}`);
        } else {
          logger.debug(`[Webhook Action] Message type: ${message.type}, Content: "${content.substring(0, 50)}..."`);
        }

        const contactPhone = message.from;
        const contactName = value.contacts?.[0]?.profile?.name || contactPhone;
        const businessPhoneId = value.metadata?.phone_number_id || "unknown";

        const messageId = await ctx.runMutation(internal.messages.saveMessage, {
          userId, // Backward compatibility
          organizationId, // Prefer organization
          contactId: businessPhoneId,
          contactName,
          contactPhone,
          direction: "inbound",
          type: message.type,
          content,
          metaMessageId: message.id,
          timestamp: parseInt(message.timestamp) * 1000,
          status: "delivered",
          mediaId,
        });

        if (mediaId && organizationId) {
          await ctx.scheduler.runAfter(0, internal.whatsapp.hydrateIncomingMedia, {
            organizationId, // Organization-scoped
            messageId,
            mediaId,
          });
        }

        // --- AI Agent Hook ---
        // Check if chat is in AI Mode
        if (organizationId) {
          const chat = await ctx.runQuery(internal.chat.getChatByPhone, { 
            organizationId, // Organization-scoped
            phone: contactPhone 
          });
          if (chat && chat.aiMode) {
            await ctx.scheduler.runAfter(0, internal.agent.generateResponse, {
              organizationId, // Organization-scoped
              chatId: chat._id,
              contactPhone: contactPhone,
              userMessage: content,
            });
          }
        }
      }
    }

    // Handle Status Updates (Sent, Delivered, Read)
    if (value.statuses) {
      logger.info(`[Webhook Action] Processing ${value.statuses.length} status updates`);
      for (const status of value.statuses) {
        logger.debug(`[Webhook Action] Status update for ${status.id}: ${status.status}`);

        // 1. Try updating standard chat messages
        const msgSuccess = organizationId ? await ctx.runMutation(internal.messages.updateMessageStatus, {
          organizationId, // Organization-scoped
          metaMessageId: status.id,
          status: status.status,
        }) : false;

        // 2. Try updating campaign logs (if it was a campaign message)
        const campaignSuccess = organizationId ? await ctx.runMutation(internal.campaigns.updateMessageStatus, {
          organizationId, // Organization-scoped
          metaMessageId: status.id,
          status: status.status,
        }) : false;

        if (!msgSuccess && !campaignSuccess) {
          const attempt = args.attempt || 1;
          
          // Check if this is likely a test message (sent recently but no DB record)
          const statusTimestamp = status.timestamp ? parseInt(status.timestamp) * 1000 : Date.now();
          const timeSinceStatus = Date.now() - statusTimestamp;
          const isRecentTestMessage = timeSinceStatus < 120000; // Within 2 minutes
          
          if (isRecentTestMessage && attempt === 1) {
            // Likely a test message - skip retries and log once
            logger.debug(`[Webhook] Status update for test message ${status.id} (no DB record), skipping retries`);
          } else if (attempt < 3) {
            logger.info(`[Webhook] Message ${status.id} not found in messages or campaigns, scheduling retry #${attempt + 1}`);
            // Retry in 2 seconds
            await ctx.scheduler.runAfter(2000, internal.whatsapp.processWebhookAction, {
              body: args.body,
              attempt: attempt + 1
            });
            // Stop processing this batch to avoid duplicate scheduling if there are multiple statuses
            return;
          } else {
            logger.warn(`[Webhook] Message ${status.id} not found after 3 attempts. Giving up.`);
          }
        } else {
          if (campaignSuccess) {
            logger.info(`[Webhook] Updated campaign log for ${status.id}`);
          }
          if (msgSuccess) {
            logger.info(`[Webhook] Updated chat message for ${status.id}`);
          }
        }
      }
    }

    // Handle Template Status Updates
    if (field === "message_template_status_update") {
      // ... (Same as before)
      const templateUpdate = value;
      if (templateUpdate?.message_template_name && templateUpdate?.event) {
        await ctx.runMutation((internal as any).templates.updateStatus, {
          name: templateUpdate.message_template_name,
          status: templateUpdate.event.toUpperCase(),
        });
      }
    }
  }
});