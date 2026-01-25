import { query, mutation, action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { retrier, crons } from "./index";
import { categorizeWhatsAppError } from "./errorUtils";

// 1. Create a Campaign
export const create = mutation({
    args: {
        userId: v.id("users"), // User creating the campaign
        name: v.string(),
        templateId: v.id("templates"),
        templateName: v.string(), // Cached for recursion
        segmentId: v.optional(v.id("segments")),
        targetTags: v.optional(v.array(v.string())),
        targetContactIds: v.optional(v.array(v.id("contacts"))),
        scheduledAt: v.number(),
        recurrenceCronSpec: v.optional(v.string()),
        sendingConfig: v.optional(v.object({
            messagesPerSecond: v.number(),
            delayBetweenMessages: v.number(),
            maxRetries: v.number(),
            skipRecentlyContacted: v.boolean(),
            recentContactHours: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة لإنشاء حملة");
        }
        const organizationId = user.currentOrganizationId;

        // Verify template belongs to organization
        const template = await ctx.db.get(args.templateId);
        if (!template || template.organizationId !== organizationId) {
            throw new Error("Template not found or access denied");
        }

        const id = await ctx.db.insert("campaigns", {
            userId: args.userId, // Keep for backward compatibility
            organizationId: organizationId, // Organization-scoped
            name: args.name,
            templateId: args.templateId,
            templateName: args.templateName,
            segmentId: args.segmentId,
            targetTags: args.targetTags,
            targetContactIds: args.targetContactIds,
            status: "SCHEDULED",
            scheduledAt: args.scheduledAt,
            recurrenceCronSpec: args.recurrenceCronSpec,
            sendingConfig: args.sendingConfig,
            stats: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
            createdAt: Date.now(),
        });

        if (args.recurrenceCronSpec) {
            await crons.register(
                ctx,
                { kind: "cron", cronspec: args.recurrenceCronSpec },
                internal.campaigns.startProcessing,
                { campaignId: id },
                `campaign-${id}`
            );
        }

        // Schedule the starting job
        const delay = Math.max(0, args.scheduledAt - Date.now());
        if (delay > 0) {
            await ctx.scheduler.runAfter(delay, internal.campaigns.startProcessing, { campaignId: id });
        } else {
            await ctx.scheduler.runAfter(0, internal.campaigns.startProcessing, { campaignId: id });
        }

        return id;
    },
});

// 2. Start Processing (Internal) - Initial Setup
export const startProcessing = internalAction({
    args: { campaignId: v.id("campaigns") },
    handler: async (ctx, args) => {
        // Get campaign to find organizationId
        const campaign = await ctx.runQuery(internal.campaigns.getCampaignById, {
            organizationId: null as any, // Will get from campaign
            id: args.campaignId
        });
        if (!campaign || !campaign.organizationId) throw new Error("Campaign not found or missing organization");
        const organizationId = campaign.organizationId;

        // 1. Count target audience
        const contacts = await ctx.runQuery(internal.campaigns.getCampaignContacts, {
            organizationId, // Organization-scoped
            campaignId: args.campaignId,
            limit: 10000
        });

        // 2. Update status to PROCESSING and Total Count
        await ctx.runMutation(internal.campaigns.updateStatus, {
            organizationId, // Organization-scoped
            campaignId: args.campaignId,
            status: "PROCESSING",
            total: contacts.length
        });

        // 3. Kick off the first batch
        await ctx.runAction(internal.campaigns.processBatch, {
            organizationId, // Organization-scoped
            campaignId: args.campaignId,
            cursor: null // Start from beginning
        });
    },
});

// Default anti-spam sending configuration
const DEFAULT_SENDING_CONFIG = {
    messagesPerSecond: 10,        // Conservative: 10 msgs/sec (WhatsApp allows 80)
    delayBetweenMessages: 100,    // 100ms between each message
    maxRetries: 3,                // 3 retries per contact
    skipRecentlyContacted: true,  // Skip recently contacted
    recentContactHours: 24,       // Don't re-contact within 24h
};

// 3. Process Batch (Recursive)
export const processBatch = internalAction({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        campaignId: v.id("campaigns"),
        cursor: v.union(v.string(), v.null()),
    },
    handler: async (ctx, args) => {
        const BATCH_SIZE = 50;
        const BATCH_DELAY_MS = 5000; // 5 seconds between batches for anti-spam

        // 1. Fetch batch and campaign config
        const { contacts, nextCursor, templateName, sendingConfig } = await ctx.runQuery(internal.campaigns.getBatchForProcessing, {
            organizationId: args.organizationId, // Organization-scoped
            campaignId: args.campaignId,
            cursor: args.cursor,
            limit: BATCH_SIZE
        });

        // Merge with defaults
        const config = {
            ...DEFAULT_SENDING_CONFIG,
            ...sendingConfig
        };

        if (contacts.length === 0) {
            // Done!
            await ctx.runMutation(internal.campaigns.updateStatus, {
                organizationId: args.organizationId, // Organization-scoped
                campaignId: args.campaignId,
                status: "COMPLETED"
            });
            return;
        }

        console.log(`[Campaign] Processing batch of ${contacts.length} contacts with ${config.delayBetweenMessages}ms delay between messages`);

        // 2. Send Messages via Retrier with anti-spam delay
        for (const contact of contacts) {
            await retrier.run(
                ctx,
                internal.campaigns.sendToContact,
                { 
                    organizationId: args.organizationId, // Organization-scoped
                    campaignId: args.campaignId, 
                    contactId: contact._id 
                },
                { initialBackoffMs: 500, base: 2, maxFailures: config.maxRetries }
            );
            
            // Anti-spam delay between messages (default: 100ms = 10 msgs/sec)
            if (config.delayBetweenMessages > 0) {
                await new Promise(resolve => setTimeout(resolve, config.delayBetweenMessages));
            }
        }

        // 4. Recurse if there's more with increased delay
        if (nextCursor) {
            console.log(`[Campaign] Scheduling next batch in ${BATCH_DELAY_MS}ms`);
            await ctx.scheduler.runAfter(BATCH_DELAY_MS, internal.campaigns.processBatch, {
                organizationId: args.organizationId, // Organization-scoped
                campaignId: args.campaignId,
                cursor: nextCursor
            });
        } else {
            // Completion handled in sendToContact
        }
    },
});

/**
 * Sends a campaign template message to a single contact.
 * 
 * This function handles both standard and carousel template messages according to
 * the WhatsApp Cloud API specification.
 * 
 * ## Standard Templates
 * For standard templates, components are built from the template definition:
 * - HEADER: Can be TEXT, IMAGE, VIDEO, or DOCUMENT format
 * - BODY: Text content with optional {{variable}} placeholders
 * - FOOTER: Optional footer text
 * - BUTTONS: Quick reply, URL, phone number, or copy code buttons
 * 
 * ## Carousel Templates
 * Carousel templates require special handling per Meta's API documentation:
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates/media-card-carousel-templates/
 * 
 * The carousel structure is:
 * ```json
 * {
 *   "type": "carousel",
 *   "cards": [
 *     {
 *       "card_index": 0,
 *       "components": [
 *         { "type": "header", "parameters": [{ "type": "image", "image": { "link": "..." } }] },
 *         { "type": "body", "parameters": [...] },
 *         { "type": "button", "sub_type": "url", "index": 0, "parameters": [...] }
 *       ]
 *     }
 *   ]
 * }
 * ```
 * 
 * Key points for carousel templates:
 * 1. Headers with `example.header_handle` require the carousel component structure
 * 2. Each card must have a `card_index` (0-based)
 * 3. Static carousels (no variables, no header handles) send empty components array
 * 4. Media URLs from template creation (header_handle) are used as `link` parameters
 * 
 * ## Error Handling
 * Errors are categorized using `errorUtils.ts` for consistent handling:
 * - #131030: Phone not in allowed list (sandbox mode)
 * - #132012: Template parameter format mismatch
 * - #10: Permission denied
 * - #80005/#200: Rate limiting (retryable)
 */
export const sendToContact = internalAction({
    args: { 
        organizationId: v.id("organizations"), // Organization-scoped
        campaignId: v.id("campaigns"), 
        contactId: v.id("contacts") 
    },
    handler: async (ctx, args): Promise<{ success: boolean; messageId?: string } | null | void> => {
        const campaign = await ctx.runQuery(internal.campaigns.getCampaignById, { 
            organizationId: args.organizationId, // Organization-scoped
            id: args.campaignId 
        });
        const contact = await ctx.runQuery(internal.campaigns.getContactById, { 
            organizationId: args.organizationId, // Organization-scoped
            id: args.contactId 
        });
        if (!campaign || !contact) {
            console.error(`[Campaign] Campaign or contact not found: campaign=${args.campaignId}, contact=${args.contactId}`);
            throw new Error("Campaign or contact not found");
        }
        // Verify ownership
        if (campaign.organizationId !== args.organizationId || contact.organizationId !== args.organizationId) {
            throw new Error("Campaign or contact access denied");
        }

        // Anti-spam: Check if contact was recently messaged
        const config = {
            ...DEFAULT_SENDING_CONFIG,
            ...campaign.sendingConfig
        };
        
        if (config.skipRecentlyContacted && contact.lastMessagedAt) {
            const recentThreshold = Date.now() - (config.recentContactHours * 60 * 60 * 1000);
            
            if (contact.lastMessagedAt > recentThreshold) {
                const hoursAgo = Math.round((Date.now() - contact.lastMessagedAt) / 3600000);
                console.log(`[Campaign] Skipping contact ${args.contactId} - messaged ${hoursAgo}h ago (threshold: ${config.recentContactHours}h)`);
                
                // Log as skipped
                await ctx.runMutation(internal.campaigns.logBatchResults, {
                    campaignId: args.campaignId,
                    logs: [{ 
                        contactId: args.contactId, 
                        status: "skipped", 
                        skipReason: "recently_contacted" 
                    }]
                });
                
                return; // Skip this contact
            }
        }

        // Fetch template to construct components
        const template = await ctx.runQuery(api.templates.getById, { 
            organizationId: args.organizationId, // Organization-scoped
            id: campaign.templateId 
        });
        // Verify template ownership
        if (!template || template.organizationId !== args.organizationId) {
            throw new Error("Template not found or access denied");
        }
        
        // Validate template structure
        if (!template) {
            throw new Error(`Template not found: ${campaign.templateId}`);
        }

        if (template.status !== "APPROVED") {
            console.warn(`[Campaign] Template ${campaign.templateName} status is ${template.status}, may fail to send`);
        }
        
        const components: any[] = [];
        console.log(`[Campaign] Template structure:`, {
            hasComponents: !!template?.components,
            componentsLength: template?.components?.length || 0,
            components: JSON.stringify(template?.components || [], null, 2)
        });
        
        /**
         * Processes a header component for standard (non-carousel) templates.
         * 
         * Header formats supported:
         * - IMAGE: Uses header_handle URL or placeholder
         * - VIDEO: Uses video URL
         * - DOCUMENT: Uses document URL with filename
         * - TEXT: Static text or text with {{variables}}
         * 
         * Note: For static text headers (no variables), the header component
         * should be included WITHOUT parameters per WhatsApp API spec.
         */
        const processHeaderComponent = (comp: any) => {
            if (comp.format === "IMAGE") {
                const link = comp.example?.header_handle?.[0] || comp.example?.header_url?.[0] || "https://placehold.co/600x400.png";
                return {
                    type: "header",
                    parameters: [{ type: "image", image: { link } }]
                };
            } else if (comp.format === "VIDEO") {
                return {
                    type: "header",
                    parameters: [{ type: "video", video: { link: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" } }]
                };
            } else if (comp.format === "DOCUMENT") {
                return {
                    type: "header",
                    parameters: [{ type: "document", document: { link: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", filename: "document.pdf" } }]
                };
            } else if (comp.format === "TEXT") {
                // Check if header has variables by looking at the text content
                // If text contains {{variable}} patterns, it has variables
                const hasVariables = comp.text?.includes("{{") || 
                                    (comp.example?.header_text && comp.example.header_text.length > 0);
                
                if (hasVariables && comp.example?.header_text && comp.example.header_text.length > 0) {
                    // Header has variables - include parameters
                    return {
                        type: "header",
                        parameters: comp.example.header_text.map((text: string) => ({ type: "text", text }))
                    };
                } else {
                    // Static text header - include header WITHOUT parameters field
                    // WhatsApp API: if header has no variables, don't include parameters at all
                    return {
                        type: "header"
                        // No parameters field for static headers
                    };
                }
            }
            return null;
        };
        
        if (template && template.components) {
            // Check for PRODUCT_CAROUSEL template
            const productCarouselComp = template.components.find((c: any) => 
                c.type === "PRODUCT_CAROUSEL" || c.type === "product_carousel"
            );

            // Check for CATALOG template
            const catalogComp = template.components.find((c: any) => 
                c.type === "CATALOG" || c.type === "catalog"
            );

            // Check for CAROUSEL template
            const carouselComp = template.components.find((c: any) => 
                c.type === "CAROUSEL" || c.type === "carousel"
            );

            // Handle PRODUCT_CAROUSEL template
            if (productCarouselComp && productCarouselComp.catalog_id && productCarouselComp.products) {
                console.log(`[Campaign] Processing PRODUCT_CAROUSEL template with ${productCarouselComp.products.length} products`);
                
                const bodyComp: any = template.components.find((c: any) => c.type === "BODY");
                const footerComp: any = template.components.find((c: any) => c.type === "FOOTER");

                const interactiveContent: any = {
                    type: "product_list",
                    body: {
                        text: bodyComp?.text || "Our Products"
                    },
                    footer: footerComp ? { text: footerComp.text } : undefined,
                    action: {
                        catalog_id: productCarouselComp.catalog_id,
                        sections: [{
                            title: "Products",
                            product_items: productCarouselComp.products.map((p: any) => ({
                                product_retailer_id: p.product_retailer_id || p.productId
                            }))
                        }]
                    }
                };

                const result: any = await ctx.runAction(api.whatsapp.sendMessage, {
                    to: (contact as { phone?: string }).phone as string,
                    type: "interactive",
                    content: interactiveContent
                });

                await ctx.runMutation(internal.campaigns.logBatchResults, {
                    campaignId: args.campaignId,
                    logs: [{ contactId: args.contactId, status: "sent", metaId: result.messages?.[0]?.id }]
                });

                return { success: true, messageId: result.messages?.[0]?.id };
            }

            // Handle CATALOG template
            if (catalogComp && catalogComp.catalog_id) {
                console.log(`[Campaign] Processing CATALOG template`);
                
                const headerComp = template.components.find((c: any) => c.type === "HEADER");
                const bodyComp = template.components.find((c: any) => c.type === "BODY");
                const footerComp = template.components.find((c: any) => c.type === "FOOTER");

                const interactiveContent: any = {
                    type: "catalog_message",
                    body: {
                        text: bodyComp?.text || "View our catalog"
                    },
                    footer: footerComp ? { text: footerComp.text } : undefined,
                    action: {
                        name: "catalog",
                        parameters: {
                            thumbnail_product_retailer_id: catalogComp.thumbnail_product_id || undefined
                        }
                    }
                };

                // Add header if present
                if (headerComp && headerComp.example?.header_handle) {
                    interactiveContent.header = {
                        type: "image",
                        image: {
                            id: headerComp.example.header_handle[0] // Media ID
                        }
                    };
                }

                const result: any = await ctx.runAction(api.whatsapp.sendMessage, {
                    to: (contact as { phone?: string }).phone as string,
                    type: "interactive",
                    content: interactiveContent
                });

                await ctx.runMutation(internal.campaigns.logBatchResults, {
                    campaignId: args.campaignId,
                    logs: [{ contactId: args.contactId, status: "sent", metaId: result.messages?.[0]?.id }]
                });

                return { success: true, messageId: result.messages?.[0]?.id };
            }
            
            if (carouselComp && carouselComp.cards) {
                // CAROUSEL templates: headers are inside cards (template definition)
                // Headers with example.header_handle require carousel component structure
                console.log(`[Campaign] Processing CAROUSEL template with ${carouselComp.cards.length} cards`);
                console.log(`[Campaign] CAROUSEL template detected - headers are in cards, not top-level`);
                
                // Check if template body has variables
                const bodyComp = template.components.find((c: any) => 
                    c.type === "BODY" || c.type === "body"
                );
                const bodyHasVariables = bodyComp?.text?.includes("{{");
                
                // Check if any card components have variables or require parameters
                let cardsHaveHeaderHandles = false;
                let cardsHaveVariables = false;
                
                for (const card of carouselComp.cards) {
                    if (card.components) {
                        for (const cardComp of card.components) {
                            // Check for headers with example.header_handle
                            if (cardComp.type === "HEADER" && cardComp.example?.header_handle) {
                                cardsHaveHeaderHandles = true;
                            }
                            // Check body text for variables
                            if (cardComp.type === "BODY" && cardComp.text?.includes("{{")) {
                                cardsHaveVariables = true;
                            }
                            // Check button URLs for variables
                            if (cardComp.type === "BUTTONS" && cardComp.buttons) {
                                for (const btn of cardComp.buttons) {
                                    if (btn.url?.includes("{{") || btn.example) {
                                        cardsHaveVariables = true;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    // Early exit if we found both
                    if (cardsHaveHeaderHandles && cardsHaveVariables) break;
                }
                
                console.log(`[Campaign] CAROUSEL analysis:`, {
                    bodyHasVariables,
                    cardsHaveHeaderHandles,
                    cardsHaveVariables
                });
                
                // IMPORTANT: WhatsApp carousel templates REQUIRE header parameters for each card.
                // We cannot send empty components or skip headers.
                // 
                // The header_handle URLs stored in templates are temporary and expire (403 Forbidden).
                // We need to upload the media to WhatsApp and get fresh media IDs before sending.
                
                if (cardsHaveHeaderHandles) {
                    console.log(`[Campaign] CAROUSEL has ${carouselComp.cards.length} cards with media headers - uploading to get media IDs`);
                    
                    // Upload media for each card header and collect media IDs
                    const mediaIds: (string | null)[] = [];
                    
                    for (let i = 0; i < carouselComp.cards.length; i++) {
                        const card = carouselComp.cards[i];
                        const headerComp = card.components?.find((c: any) => 
                            c.type === "HEADER" || c.type === "header"
                        );
                        
                        if (headerComp?.example?.header_handle?.[0]) {
                            const headerUrl = headerComp.example.header_handle[0];
                            const headerFormat = (headerComp.format || "IMAGE").toLowerCase();
                            
                            console.log(`[Campaign] Card ${i}: Uploading ${headerFormat} from header_handle...`);
                            
                            try {
                                // Upload media to WhatsApp and get a media ID
                                const mediaId = await ctx.runAction(api.whatsapp.uploadMediaFromUrl, {
                                    organizationId: args.organizationId, // Organization-scoped
                                    url: headerUrl,
                                    type: headerFormat,
                                });
                                mediaIds.push(mediaId);
                                console.log(`[Campaign] Card ${i}: Got media ID: ${mediaId}`);
                            } catch (uploadError) {
                                console.error(`[Campaign] Card ${i}: Failed to upload media:`, uploadError);
                                // Store null - we'll handle this error below
                                mediaIds.push(null);
                            }
                        } else {
                            mediaIds.push(null);
                        }
                    }
                    
                    // Check if any uploads failed
                    const failedUploads = mediaIds.filter(id => id === null).length;
                    if (failedUploads > 0) {
                        console.error(`[Campaign] ${failedUploads}/${mediaIds.length} media uploads failed - header_handle URLs may be expired`);
                        throw new Error(`Failed to upload ${failedUploads} media items for carousel. The template media URLs may have expired. Please edit the template and re-upload the images.`);
                    }
                    
                    // Build carousel cards with media IDs
                    const carouselCards = carouselComp.cards.map((card: any, index: number) => {
                        const cardComponents: any[] = [];
                        const headerComp = card.components?.find((c: any) => 
                            c.type === "HEADER" || c.type === "header"
                        );
                        
                        // Add header with media ID
                        if (mediaIds[index]) {
                            const headerFormat = (headerComp?.format || "IMAGE").toLowerCase();
                            const headerParam: any = { type: headerFormat };
                            
                            if (headerFormat === "image") {
                                headerParam.image = { id: mediaIds[index] };
                            } else if (headerFormat === "video") {
                                headerParam.video = { id: mediaIds[index] };
                            } else {
                                // Fallback to image
                                headerParam.image = { id: mediaIds[index] };
                            }
                            
                            cardComponents.push({
                                type: "header",
                                parameters: [headerParam]
                            });
                        }
                        
                        // Process body if it has variables (TODO: implement variable substitution)
                        const cardBodyComp = card.components?.find((c: any) => 
                            c.type === "BODY" || c.type === "body"
                        );
                        if (cardBodyComp && cardBodyComp.text?.includes("{{")) {
                            console.log(`[Campaign] Card ${index} body has variables - needs implementation`);
                        }
                        
                        // Process buttons if they have variables (TODO: implement)
                        const buttonsComp = card.components?.find((c: any) => 
                            c.type === "BUTTONS" || c.type === "buttons"
                        );
                        if (buttonsComp?.buttons) {
                            const hasButtonVariables = buttonsComp.buttons.some((btn: any) => 
                                btn.url?.includes("{{") || btn.example
                            );
                            if (hasButtonVariables) {
                                console.log(`[Campaign] Card ${index} buttons have variables - needs implementation`);
                            }
                        }
                        
                        return {
                            card_index: index,
                            components: cardComponents
                        };
                    });
                    
                    // Add body component if main body has variables
                    if (bodyHasVariables) {
                        console.log(`[Campaign] CAROUSEL template body has variables - needs implementation`);
                    }
                    
                    // Add carousel component
                    components.push({
                        type: "carousel",
                        cards: carouselCards
                    });
                    
                    console.log(`[Campaign] Constructed carousel with ${carouselCards.length} cards using media IDs`);
                } else {
                    // Carousel without media headers - just handle variables if any
                    console.log(`[Campaign] CAROUSEL without media headers - processing variables only`);
                    
                    if (bodyHasVariables || cardsHaveVariables) {
                        const carouselCards = carouselComp.cards.map((card: any, index: number) => {
                            const cardComponents: any[] = [];
                            
                            // Process body if it has variables
                            const cardBodyComp = card.components?.find((c: any) => 
                                c.type === "BODY" || c.type === "body"
                            );
                            if (cardBodyComp && cardBodyComp.text?.includes("{{")) {
                                console.log(`[Campaign] Card ${index} body has variables - needs implementation`);
                            }
                            
                            return {
                                card_index: index,
                                components: cardComponents
                            };
                        });
                        
                        components.push({
                            type: "carousel",
                            cards: carouselCards
                        });
                    }
                    // If no headers and no variables, empty components array is OK
                }
            } else {
                // Standard template: process top-level components
                for (const comp of template.components) {
                    console.log(`[Campaign] Processing component:`, {
                        type: comp.type,
                        format: comp.format,
                        hasExample: !!comp.example,
                        example: comp.example
                    });
                    
                    // Check for HEADER (case-insensitive)
                    if (comp.type === "HEADER" || comp.type === "header") {
                        const headerComponent = processHeaderComponent(comp);
                        if (headerComponent) {
                            components.push(headerComponent);
                        }
                    }
                }
            }
        }
        
        // After constructing components array, check if we missed any HEADER components
        if (components.length === 0) {
            // Skip check for CAROUSEL templates (they don't have top-level headers)
            const isCarousel = template.components?.some((c: any) => 
                c.type === "CAROUSEL" || c.type === "carousel"
            );
            
            if (!isCarousel) {
                // Only check for headers in non-carousel templates
                let hasHeader = template.components?.some((c: any) => 
                    (c.type === "HEADER" || c.type === "header")
                );
                
                if (hasHeader) {
                    console.warn(`[Campaign] Template has HEADER but no header component was added. Template components:`, 
                        JSON.stringify(template.components, null, 2));
                    // Try to add a default header without parameters for static headers
                    components.push({
                        type: "header"
                        // No parameters field for static headers
                    });
                }
            } else {
                // CAROUSEL template with empty components - this is correct only if truly static
                // (no header handles, no variables) - already logged in CAROUSEL handling section
                console.log(`[Campaign] CAROUSEL template - empty components array is correct (truly static template)`);
            }
        }
        
        console.log(`[Campaign] Final components to send:`, JSON.stringify(components, null, 2));

        try {
            const res = await ctx.runAction(api.whatsapp.sendMessage, {
                organizationId: args.organizationId, // Organization-scoped
                to: (contact as { phone?: string }).phone as string,
                type: "template",
                content: {
                    name: campaign.templateName,
                    language: { code: "ar" },
                    components: components
                }
            });
            await ctx.runMutation(internal.campaigns.logBatchResults, {
                organizationId: args.organizationId, // Organization-scoped
                campaignId: args.campaignId,
                logs: [{ contactId: args.contactId, status: "sent", metaId: res.messages?.[0]?.id }]
            });
            
            // Update contact's lastMessagedAt for anti-spam tracking
            await ctx.runMutation(internal.campaigns.updateContactLastMessaged, {
                organizationId: args.organizationId, // Organization-scoped
                contactId: args.contactId,
                templateName: campaign.templateName
            });
        } catch (e: unknown) {
            // Try to extract error properties from various error formats
            // Convex action boundaries can strip custom error properties, so we need to parse them
            let err: Error & { code?: number; category?: string; retryable?: boolean };
            
            if (e instanceof Error) {
                err = e as Error & { code?: number; category?: string; retryable?: boolean };
                
                // Try to extract error code from message if properties are missing
                // Support multiple formats: (#123), error code 123, "code":123
                if (!err.code && err.message) {
                    // Format: (#123) - common in WhatsApp API errors
                    let codeMatch = err.message.match(/\(#(\d+)\)/);
                    if (!codeMatch) {
                        // Format: error code 123 or code: 123
                        codeMatch = err.message.match(/(?:error\s+)?code[:\s]+(\d+)/i);
                    }
                    if (!codeMatch) {
                        // Format: "code":123 - JSON embedded in message
                        codeMatch = err.message.match(/"code"\s*:\s*(\d+)/);
                    }
                    if (codeMatch) {
                        err.code = parseInt(codeMatch[1], 10);
                    }
                }
                
                // Try to extract category from message if it contains JSON
                if (!err.category && err.message) {
                    const categoryMatch = err.message.match(/"category"\s*:\s*"([^"]+)"/);
                    if (categoryMatch) {
                        err.category = categoryMatch[1];
                    }
                }
                
                // Use centralized error categorization if we have a code but no category
                if (err.code && !err.category) {
                    const errorInfo = categorizeWhatsAppError(err.code, err.message);
                    err.category = errorInfo.category;
                    err.retryable = errorInfo.retryable;
                }
                
                // Fall back to message-based detection if still no category
                if (!err.category && err.message) {
                    if (err.message.includes("not in allowed list")) {
                        err.category = "PHONE_NOT_ALLOWED";
                        err.retryable = false;
                    } else if (err.message.includes("Parameter format") || err.message.includes("parameter format")) {
                        err.category = "TEMPLATE_FORMAT";
                        err.retryable = false;
                    } else if (err.message.toLowerCase().includes("rate limit") || err.message.includes("throttl")) {
                        err.category = "RATE_LIMIT";
                        err.retryable = true;
                    } else if (err.message.toLowerCase().includes("permission") || err.message.includes("does not have permission")) {
                        err.category = "AUTH_ERROR";
                        err.retryable = false;
                    } else if (err.message.toLowerCase().includes("unauthorized") || err.message.includes("invalid token")) {
                        err.category = "AUTH_ERROR";
                        err.retryable = false;
                    }
                }
                
                // Ensure retryable is set based on category if not already set
                if (err.retryable === undefined && err.category) {
                    err.retryable = err.category === "RATE_LIMIT" || err.category === "NETWORK_ERROR";
                }
            } else {
                err = new Error(String(e)) as Error & { code?: number; category?: string; retryable?: boolean };
            }
            
            const errorMsg = err?.message || String(e);
            
            // Handle specific WhatsApp errors gracefully
            if (err.code === 131030) {
                // Phone number not in allowed list - non-retryable, log as failed
                // This typically happens in sandbox mode when phone isn't added to test list
                console.log(`[Campaign] Skipping contact ${args.contactId}: Phone number not in allowed list (sandbox mode)`);
            } else if (err.code === 10) {
                // Permission error - non-retryable, log as failed
                // This happens when the app doesn't have required WhatsApp Business API permissions
                console.error(`[Campaign] Permission error for contact ${args.contactId}:`, {
                    error: errorMsg,
                    suggestion: "Check WhatsApp Business API permissions in Meta Business Suite"
                });
            } else if (err.code === 132012) {
                // Template format error - non-retryable, log as failed
                console.error(`[Campaign] Template format error for contact ${args.contactId}:`, {
                    error: errorMsg,
                    templateName: campaign.templateName,
                    componentsSent: components.length,
                    templateComponents: template?.components?.length || 0
                });
            } else if (err.code === 80005 || err.code === 200) {
                // Rate limit error - these are retryable
                console.warn(`[Campaign] Retryable error (${err.code}) for contact ${args.contactId}: ${errorMsg}`);
                // Re-throw to let the retrier handle it
                throw err;
            } else {
                // Unknown error - log details for debugging
                console.error(`[Campaign] Unexpected error for contact ${args.contactId}:`, {
                    code: err.code,
                    category: err.category,
                    message: errorMsg,
                    retryable: err.retryable,
                });
            }
            
            // Log the failure
            await ctx.runMutation(internal.campaigns.logBatchResults, {
                organizationId: args.organizationId, // Organization-scoped
                campaignId: args.campaignId,
                logs: [{ 
                    contactId: args.contactId, 
                    status: "failed", 
                    error: `${err.code ? `[${err.code}] ` : ""}${errorMsg}` 
                }]
            });
        }

        const updated = await ctx.runQuery(internal.campaigns.getCampaignById, { 
            organizationId: args.organizationId, // Organization-scoped
            id: args.campaignId 
        });
        if (updated && (updated.stats.sent + updated.stats.failed) >= updated.stats.total) {
            await ctx.runMutation(internal.campaigns.updateStatus, {
                organizationId: args.organizationId, // Organization-scoped
                campaignId: args.campaignId,
                status: "COMPLETED"
            });
        }
    }
});

export const getCampaignById = internalQuery({
    args: { 
        organizationId: v.union(v.id("organizations"), v.null()), // Organization-scoped (null allowed for initial lookup)
        id: v.id("campaigns") 
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.id);
        if (args.organizationId !== null && (!campaign || campaign.organizationId !== args.organizationId)) {
            throw new Error("Campaign not found or access denied");
        }
        return campaign;
    }
});

export const getContactById = internalQuery({
    args: { 
        organizationId: v.id("organizations"), // Organization-scoped
        id: v.id("contacts") 
    },
    handler: async (ctx, args) => {
        const contact = await ctx.db.get(args.id);
        if (!contact || contact.organizationId !== args.organizationId) {
            throw new Error("Contact not found or access denied");
        }
        return contact;
    }
});
export const remove = mutation({
    args: { 
        userId: v.id("users"), // User performing the action
        id: v.id("campaigns") 
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const organizationId = user.currentOrganizationId;

        // Check if campaign exists and belongs to organization
        const campaign = await ctx.db.get(args.id);
        if (!campaign) {
            console.warn(`[Campaign] Attempt to delete non-existent campaign: ${args.id}`);
            return false;
        }
        // Verify ownership
        if (campaign.organizationId !== organizationId) {
            throw new Error("Campaign not found or access denied");
        }

        try {
            // Delete associated logs
            const logs = await ctx.db.query("campaign_logs")
                .withIndex("by_campaign", q => q.eq("campaignId", args.id))
                .collect();
            
            for (const log of logs) {
                try {
                    await ctx.db.delete(log._id);
                } catch (logError) {
                    console.warn(`[Campaign] Failed to delete log ${log._id}:`, logError);
                }
            }

            // Delete the campaign
            await ctx.db.delete(args.id);
            console.log(`[Campaign] Successfully deleted campaign ${args.id} and ${logs.length} associated logs`);
            return true;
        } catch (error) {
            // Handle case where campaign was deleted between check and delete
            const err = error as Error & { code?: string };
            if (err.code === "InvalidId" || err.message?.includes("nonexistent")) {
                console.warn(`[Campaign] Campaign ${args.id} was already deleted`);
                return false;
            }
            throw error;
        }
    }
});

export const recalculateStats = mutation({
    args: { campaignId: v.id("campaigns") },
    handler: async (ctx, args) => {
        const logs = await ctx.db
            .query("campaign_logs")
            .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
            .collect();

        const stats = {
            total: logs.length, // Or keep original total if it includes pending?
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0
        };

        for (const log of logs) {
            if (log.status === 'sent') stats.sent++;
            if (log.status === 'delivered') {
                stats.sent++;
                stats.delivered++;
            }
            if (log.status === 'read') {
                stats.sent++;
                stats.delivered++;
                stats.read++;
            }
            if (log.status === 'failed') stats.failed++;
        }

        // Preserve total from existing if it's larger (meaning pending messages)
        const campaign = await ctx.db.get(args.campaignId);
        if (campaign) {
            stats.total = Math.max(stats.total, campaign.stats.total);
            await ctx.db.patch(args.campaignId, { stats });
        }
        return stats;
    }
});

export const getCampaignContacts = internalQuery({
    args: { 
        organizationId: v.id("organizations"), // Organization-scoped
        campaignId: v.id("campaigns"), 
        limit: v.number() 
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.organizationId !== args.organizationId) return [];

        // 1. Direct Selection
        if (campaign.targetContactIds && campaign.targetContactIds.length > 0) {
            // Fetch specific contacts (filter by organizationId)
            const contacts = await Promise.all(
                campaign.targetContactIds.map(id => ctx.db.get(id))
            );
            return contacts.filter(c => c !== null && c.organizationId === args.organizationId);
        }

        // 2. Tag Filtering (filter by organizationId)
        const q = ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) => q.eq("organizationId", args.organizationId));
        let contacts = await q.take(args.limit);

        if (campaign.targetTags && campaign.targetTags.length > 0) {
            contacts = contacts.filter(c =>
                c.tags?.some(tag => campaign.targetTags?.includes(tag))
            );
        }

        return contacts;
    }
});

export const getBatchForProcessing = internalQuery({
    args: { 
        organizationId: v.id("organizations"), // Organization-scoped
        campaignId: v.id("campaigns"), 
        cursor: v.union(v.string(), v.null()), 
        limit: v.number() 
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.organizationId !== args.organizationId) {
            throw new Error("Campaign not found or access denied");
        }

        // Filter contacts by organizationId
        const q = ctx.db
            .query("contacts")
            .withIndex("by_org_phone", (q) => q.eq("organizationId", args.organizationId))
            .order("desc"); // Deterministic order

        // Use pagination
        const page = await q.paginate({ cursor: args.cursor, numItems: args.limit });

        return {
            contacts: page.page,
            nextCursor: page.continueCursor,
            templateName: campaign.templateName,
            sendingConfig: campaign.sendingConfig  // Anti-spam config
        };
    }
});

export const updateStatus = internalMutation({
    args: { 
        organizationId: v.id("organizations"), // Organization-scoped
        campaignId: v.id("campaigns"), 
        status: v.string(), 
        total: v.optional(v.number()) 
    },
    handler: async (ctx, args) => {
        // Verify ownership
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.organizationId !== args.organizationId) {
            throw new Error("Campaign not found or access denied");
        }
        const updates: { status: "DRAFT" | "SCHEDULED" | "PROCESSING" | "COMPLETED" | "FAILED" | "PAUSED"; stats?: { total: number; sent: number; delivered: number; read: number; failed: number; skipped?: number } } = { status: args.status as "DRAFT" | "SCHEDULED" | "PROCESSING" | "COMPLETED" | "FAILED" | "PAUSED" };
        if (args.total !== undefined) updates.stats = { total: args.total, sent: 0, delivered: 0, read: 0, failed: 0, skipped: 0 };

        // Proper merge - use existing campaign variable
        if (campaign && args.total !== undefined) {
            updates.stats = { ...campaign.stats, total: args.total, skipped: campaign.stats.skipped || 0 };
        }

        await ctx.db.patch(args.campaignId, updates);
    }
});

export const logBatchResults = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        campaignId: v.id("campaigns"),
        logs: v.array(v.object({
            contactId: v.id("contacts"),
            status: v.string(),
            metaId: v.optional(v.string()),
            error: v.optional(v.string()),
            skipReason: v.optional(v.string())  // "recently_contacted", "rate_limited", etc.
        }))
    },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.organizationId !== args.organizationId) {
            throw new Error("Campaign not found or access denied");
        }

        let sent = 0, failed = 0, skipped = 0;

        for (const log of args.logs) {
            // Verify contact belongs to organization
            const contact = await ctx.db.get(log.contactId);
            if (!contact || contact.organizationId !== args.organizationId) {
                console.warn(`[Campaign] Skipping log for contact ${log.contactId} - access denied`);
                continue;
            }

            await ctx.db.insert("campaign_logs", {
                userId: campaign.userId, // Keep for backward compatibility
                organizationId: args.organizationId, // Organization-scoped
                campaignId: args.campaignId,
                contactId: log.contactId,
                status: log.status as "sent" | "delivered" | "read" | "failed" | "skipped",
                metaMessageId: log.metaId,
                error: log.error,
                skipReason: log.skipReason
            });

            if (log.status === 'sent') sent++;
            if (log.status === 'failed') failed++;
            if (log.status === 'skipped') skipped++;
        }

        // Increment Stats
        await ctx.db.patch(args.campaignId, {
            stats: {
                ...campaign.stats,
                sent: campaign.stats.sent + sent,
                failed: campaign.stats.failed + failed,
                skipped: (campaign.stats.skipped || 0) + skipped
            }
        });
    }
});

// Update contact's last messaged timestamp for anti-spam tracking
export const updateContactLastMessaged = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        contactId: v.id("contacts"),
        templateName: v.string()
    },
    handler: async (ctx, args) => {
        const contact = await ctx.db.get(args.contactId);
        if (!contact || contact.organizationId !== args.organizationId) {
            throw new Error("Contact not found or access denied");
        }
        await ctx.db.patch(args.contactId, {
            lastMessagedAt: Date.now(),
            lastMessagedTemplate: args.templateName
        });
    }
});

export const updateMessageStatus = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        metaMessageId: v.string(),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        console.log(`[Campaigns] updateMessageStatus called for ${args.metaMessageId} with status ${args.status}`);
        // Filter by organizationId to ensure ownership
        const log = await ctx.db
            .query("campaign_logs")
            .withIndex("by_org_campaign", (q) => q.eq("organizationId", args.organizationId))
            .filter((q: any) => q.eq(q.field("metaMessageId"), args.metaMessageId))
            .first();
        
        if (!log || log.organizationId !== args.organizationId) {
            console.log(`[Campaigns] Log not found or access denied for metaMessageId: ${args.metaMessageId}`);
            return false;
        }

        if (!log) {
            console.log(`[Campaigns] Log not found for metaMessageId: ${args.metaMessageId}`);
            return false;
        }

        // Ignore if status is same
        if (log.status === args.status) {
             console.log(`[Campaigns] Status already ${args.status}, skipping.`);
             return true;
        }

        const oldStatus = log.status;
        const newStatus = args.status;

        console.log(`[Campaigns] Updating status from ${oldStatus} to ${newStatus}`);

        // Valid statuses from Meta: sent, delivered, read, failed
        // Map to our schema types
        const mappedStatus = newStatus;
        if (!["sent", "delivered", "read", "failed"].includes(newStatus)) {
            // Meta might send 'deleted' or others, ignore or map
            return true;
        }

        await ctx.db.patch(log._id, { status: mappedStatus as "sent" | "delivered" | "read" | "failed" });

        // Update Campaign Stats
        const campaign = await ctx.db.get(log.campaignId);
        if (campaign) {
            const stats = { ...campaign.stats };
            
            if (mappedStatus === 'delivered' && oldStatus !== 'delivered' && oldStatus !== 'read') {
                stats.delivered++;
            } else if (mappedStatus === 'read' && oldStatus !== 'read') {
                stats.read++;
                // If it jumped from sent to read, it implies delivered too
                if (oldStatus === 'sent') {
                    stats.delivered++; // implied
                }
            } else if (mappedStatus === 'failed' && oldStatus !== 'failed') {
                stats.failed++;
            }

            await ctx.db.patch(campaign._id, { stats });
            console.log(`[Campaigns] Stats updated:`, stats);
        } else {
             console.error(`[Campaigns] Campaign not found for log ${log._id}`);
        }
        
        return true;
    }
});

// Front-end queries
export const list = query({
    args: { userId: v.id("users") }, // User making the request
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        return await ctx.db
            .query("campaigns")
            .withIndex("by_org", (q) => q.eq("organizationId", user.currentOrganizationId))
            .order("desc")
            .take(20);
    }
});

export const getCampaignLogs = query({
    args: { 
        userId: v.id("users"), // User making the request
        campaignId: v.id("campaigns"),
        startDate: v.optional(v.number()), // Optional timestamp filter
        endDate: v.optional(v.number()) // Optional timestamp filter
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const organizationId = user.currentOrganizationId;

        // Verify campaign belongs to organization
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.organizationId !== organizationId) {
            throw new Error("Campaign not found or access denied");
        }

        // Get all logs for the campaign
        let logs = await ctx.db
            .query("campaign_logs")
            .withIndex("by_org_campaign", (q) => 
                q.eq("organizationId", organizationId).eq("campaignId", args.campaignId)
            )
            .collect();

        // Filter by time range if provided (using campaign's scheduledAt as reference)
        // Note: campaign_logs don't have individual timestamps, so we filter based on campaign timeline
        if (args.startDate && args.endDate) {
            // If campaign was scheduled/processed within the time range, include its logs
            const campaignInRange = campaign.scheduledAt >= args.startDate && campaign.scheduledAt <= args.endDate;
            if (!campaignInRange) {
                logs = []; // No logs if campaign is outside time range
            }
        }

        // Enrich with contact details
        const enrichedLogs = await Promise.all(
            logs.map(async (log) => {
                const contact = await ctx.db.get(log.contactId);
                return {
                    ...log,
                    contactName: contact?.name || "Unknown",
                    contactPhone: contact?.phone || "N/A",
                };
            })
        );

        return enrichedLogs;
    },
});

// Get campaign analytics with time filtering
export const getCampaignAnalytics = query({
    args: {
        userId: v.id("users"),
        campaignId: v.id("campaigns"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const organizationId = user.currentOrganizationId;

        // Verify campaign belongs to organization
        const campaign = await ctx.db.get(args.campaignId);
        if (!campaign || campaign.organizationId !== organizationId) {
            throw new Error("Campaign not found or access denied");
        }

        // Get all campaign logs
        const logs = await ctx.db
            .query("campaign_logs")
            .withIndex("by_org_campaign", (q) => 
                q.eq("organizationId", organizationId).eq("campaignId", args.campaignId)
            )
            .collect();

        // Calculate date range (use campaign timeline if no dates provided)
        const now = Date.now();
        const startTime = args.startDate || campaign.scheduledAt || campaign.createdAt;
        const endTime = args.endDate || now;

        // Calculate metrics
        const total = logs.length;
        const sent = logs.filter((log) => log.status === "sent" || log.status === "delivered" || log.status === "read").length;
        const delivered = logs.filter((log) => log.status === "delivered" || log.status === "read").length;
        const read = logs.filter((log) => log.status === "read").length;
        const failed = logs.filter((log) => log.status === "failed").length;
        const skipped = logs.filter((log) => log.status === "skipped").length;

        // Calculate rates
        const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
        const readRate = delivered > 0 ? (read / delivered) * 100 : 0;

        // Status breakdown
        const statusData = {
            sent: logs.filter((log) => log.status === "sent").length,
            delivered: logs.filter((log) => log.status === "delivered").length,
            read: logs.filter((log) => log.status === "read").length,
            failed: failed,
            skipped: skipped,
        };

        // Generate chart data (daily breakdown)
        // Since logs don't have timestamps, we'll create a single data point for the campaign
        // In a real scenario, you'd want to add createdAt to campaign_logs
        const daysDiff = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000));
        const chartData = [];
        
        if (daysDiff > 0 && daysDiff <= 90) {
            // Generate daily data points
            for (let i = 0; i < daysDiff; i++) {
                const date = new Date(startTime + i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                // For now, distribute logs evenly across days or use campaign date
                // In production, you'd want actual timestamps on logs
                const isCampaignDay = i === 0; // Assume campaign happened on first day
                const daySent = isCampaignDay ? sent : 0;
                const dayDelivered = isCampaignDay ? delivered : 0;
                const dayRead = isCampaignDay ? read : 0;
                const dayFailed = isCampaignDay ? failed : 0;
                
                chartData.push({
                    date: dayStart.toISOString(),
                    day: date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
                    messages: daySent + dayDelivered + dayRead,
                    sent: daySent,
                    delivered: dayDelivered,
                    read: dayRead,
                    failed: dayFailed,
                    deliveryRate: daySent > 0 ? (dayDelivered / daySent) * 100 : 0,
                    readRate: dayDelivered > 0 ? (dayRead / dayDelivered) * 100 : 0,
                });
            }
        } else {
            // For longer periods or all time, create a single aggregated point
            chartData.push({
                date: new Date(startTime).toISOString(),
                day: "المجموع",
                messages: sent + delivered + read,
                sent: sent,
                delivered: delivered,
                read: read,
                failed: failed,
                deliveryRate: deliveryRate,
                readRate: readRate,
            });
        }

        return {
            total,
            sent,
            delivered,
            read,
            failed,
            skipped,
            deliveryRate,
            readRate,
            statusData,
            chartData,
        };
    },
});