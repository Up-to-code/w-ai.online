import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()), // Job title
    bio: v.optional(v.string()),   // Short biography
    role: v.union(v.literal("admin"), v.literal("agent"), v.literal("user")),
    // Auth fields (if using custom auth or linking to provider)
    tokenIdentifier: v.optional(v.string()),
    password: v.optional(v.string()),
    // WorkOS integration
    authId: v.optional(v.string()), // WorkOS user ID
    // Profile and organization
    avatarUrl: v.optional(v.string()), // Profile picture URL (Convex Storage ID)
    currentOrganizationId: v.optional(v.id("organizations")), // Active organization
  }).index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_phone", ["phone"])
    .index("by_auth_id", ["authId"])
    .index("by_current_org", ["currentOrganizationId"]),

  // Organizations - workspace/tenant level
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // Unique identifier in English (required)
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    logo: v.optional(v.string()), // Storage ID for logo image
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    settings: v.optional(v.any()), // JSON for flexible org settings
    subscriptionPlan: v.optional(v.union(
      v.literal("free"),
      v.literal("startup"),
      v.literal("professional"),
      v.literal("enterprise")
    )), // Subscription plan tier
    subscriptionStatus: v.optional(v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    )), // Subscription status
    subscriptionExpiresAt: v.optional(v.number()), // Timestamp when subscription expires
    createdBy: v.id("users"), // User who created the organization (becomes owner)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"])
    .index("by_created_by", ["createdBy"])
    .index("by_slug", ["slug"]), // Unique index for slug lookup

  // Organization members - user-org relationship with permissions
  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),    // Full access, can manage org and members
      v.literal("admin"),    // Can manage most settings except billing/members
      v.literal("agent"),    // Can manage chats, campaigns, contacts
      v.literal("viewer")    // Read-only access
    ),
    permissions: v.optional(v.array(v.string())), // Granular permissions if needed
    joinedAt: v.number(),
    invitedBy: v.optional(v.id("users")),
  }).index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  otps: defineTable({
    phone: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
  }).index("by_phone", ["phone"]),

  chats: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility - will be removed after migration
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this chat
    contactId: v.string(), // WhatsApp Phone Number ID
    contactName: v.string(),
    contactPhone: v.string(),
    lastMessageTime: v.number(),
    unreadCount: v.number(),
    status: v.union(v.literal("active"), v.literal("expired")), // 24h window
    tags: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.id("users")), // Assigned agent
    aiMode: v.optional(v.boolean()), // AI Agent Mode
    aiSummary: v.optional(v.string()), // Compressed conversation history
  }).index("by_last_message", ["lastMessageTime"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_user_contact", ["userId", "contactPhone"])
    .index("by_org", ["organizationId"])
    .index("by_org_contact", ["organizationId", "contactPhone"]),

  ai_configs: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this config
    systemPrompt: v.string(),
    model: v.string(),
    temperature: v.optional(v.number()),
    tools: v.optional(v.array(v.string())), // e.g., ["salla", "handoff", "media"]
    languageRules: v.optional(v.string()), // User-editable language instructions for AI
    activePhoneNumbers: v.optional(v.array(v.string())), // Array of phoneNumberIds
    isActive: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  messages: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this message
    chatId: v.id("chats"),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    type: v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("document"), v.literal("template"), v.literal("interactive")),
    content: v.optional(v.string()), // Text body or Caption
    mediaId: v.optional(v.string()), // Meta Media ID
    storageId: v.optional(v.string()), // Convex Storage ID
    status: v.union(v.literal("sent"), v.literal("delivered"), v.literal("read"), v.literal("failed")),
    timestamp: v.number(),
    metaMessageId: v.optional(v.string()),
    replyTo: v.optional(v.id("messages")), // Reference to message being replied to
  }).index("by_chat", ["chatId"])
    .index("by_meta_message_id", ["metaMessageId"])
    .index("by_user_chat", ["userId", "chatId"])
    .index("by_org_chat", ["organizationId", "chatId"])
    .index("by_org_timestamp", ["organizationId", "timestamp"]),

  files: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this file
    storageId: v.string(),
    url: v.string(),
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    uploadedBy: v.id("users"),
    category: v.optional(v.string()), // e.g., "campaign", "chat"
    whatsappMediaId: v.optional(v.string()), // Added for mapped media
    createdAt: v.number(),
  }).index("by_category", ["category"])
    .index("by_whatsapp_media_id", ["whatsappMediaId"])
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  templates: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this template
    name: v.string(),
    language: v.string(),
    category: v.string(),
    content: v.optional(v.string()), // <--- Added content field
    components: v.any(), // JSON structure of components
    status: v.union(v.literal("APPROVED"), v.literal("REJECTED"), v.literal("PENDING")),
    metaTemplateId: v.optional(v.string()),
    lastSyncedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  products: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this product
    externalId: v.string(), // SOLO ID or Native SKU
    name: v.string(),
    price: v.number(),
    currency: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    inStock: v.boolean(),
    // Enhanced fields for Phase 33 - Native Product Management
    sku: v.string(),
    quantity: v.number(),
    images: v.optional(v.array(v.string())),
    variants: v.optional(v.any()), // JSON: {size, color, price_diffs}
    status: v.union(v.literal("active"), v.literal("draft")),
    source: v.union(v.literal("native"), v.literal("salla")), // Track data source
    sourceId: v.optional(v.string()), // Salla externalId or native ID reference
  }).index("by_external_id", ["externalId"])
    .index("by_user_external_id", ["userId", "externalId"])
    .index("by_org_external_id", ["organizationId", "externalId"])
    .index("by_org_status", ["organizationId", "status"])
    .index("by_org_sku", ["organizationId", "sku"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["inStock", "userId", "organizationId", "status"]
    }),

  knowledge_base: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this knowledge entry
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()), // Vector for RAG
    sourceType: v.union(v.literal("text"), v.literal("pdf")),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  // Salla OAuth Integration - stores tokens, fetches products on demand
  sallaIntegrations: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this integration
    merchantId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    storeName: v.optional(v.string()),
    storeUrl: v.optional(v.string()),
    connectedAt: v.number(),
  }).index("by_merchant", ["merchantId"])
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  // --- Scalable Campaigns Schema ---

  contacts: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this contact
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.any()), // JSON
    isSubscribed: v.boolean(),
    createdAt: v.number(),
    // Anti-spam tracking fields
    lastMessagedAt: v.optional(v.number()),        // Timestamp of last message sent
    lastMessagedTemplate: v.optional(v.string()),  // Last template name sent
  }).index("by_phone", ["phone"])
    .index("by_user_phone", ["userId", "phone"])
    .index("by_org_phone", ["organizationId", "phone"])
    .index("by_org_createdAt", ["organizationId", "createdAt"])
    .index("by_tag", ["tags"]), // Note: Convex doesn't support array indexing directly like this, but we'll filter

  segments: defineTable({
    name: v.string(),
    criteria: v.any(), // JSON criteria
    count: v.number(),
    lastCalculatedAt: v.number(),
  }),

  campaigns: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this campaign
    name: v.string(),
    templateId: v.id("templates"),
    templateName: v.string(),
    segmentId: v.optional(v.id("segments")), // Optional if sending to specific tags/list
    targetTags: v.optional(v.array(v.string())), // Alternative to segment
    targetContactIds: v.optional(v.array(v.id("contacts"))), // Specific list of contacts
    status: v.union(
      v.literal("DRAFT"),
      v.literal("SCHEDULED"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("PAUSED")
    ),
    scheduledAt: v.number(),
    recurrenceCronSpec: v.optional(v.string()),
    stats: v.object({
      total: v.number(),
      sent: v.number(),
      delivered: v.number(),
      read: v.number(),
      failed: v.number(),
      skipped: v.optional(v.number()),  // Contacts skipped due to rate limiting
    }),
    // Anti-spam sending configuration
    sendingConfig: v.optional(v.object({
      messagesPerSecond: v.number(),      // Target rate (default: 10)
      delayBetweenMessages: v.number(),   // ms delay between each message
      maxRetries: v.number(),             // Max retries per contact
      skipRecentlyContacted: v.boolean(), // Skip if contacted in last N hours
      recentContactHours: v.number(),     // Hours to consider "recent"
    })),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_org", ["organizationId"])
    .index("by_org_createdAt", ["organizationId", "createdAt"]),

  // Workflows (Automation)
  workflows: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this workflow
    name: v.string(),
    description: v.optional(v.string()), // Optional description
    trigger: v.string(), // new_message, keyword, etc.
    triggerConfig: v.any(), // { keyword: "hello" }
    steps: v.array(v.object({
      type: v.string(), // send_message, add_tag, delay, filter
      config: v.any()
    })),
    action: v.optional(v.string()), // Deprecated, keeping for migration
    actionConfig: v.optional(v.any()), // Deprecated, keeping for migration
    enabled: v.boolean(),
    stats: v.object({
      runs: v.number(),
      lastRun: v.optional(v.number())
    }),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  campaign_logs: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this log
    campaignId: v.id("campaigns"),
    contactId: v.id("contacts"),
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed"),
      v.literal("skipped")  // Skipped due to rate limiting or recently contacted
    ),
    metaMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
    skipReason: v.optional(v.string()),  // "recently_contacted", "rate_limited", etc.
  }).index("by_campaign", ["campaignId"])
    .index("by_message_id", ["metaMessageId"])
    .index("by_user_campaign", ["userId", "campaignId"])
    .index("by_org_campaign", ["organizationId", "campaignId"]),

  notifications: defineTable({
    organizationId: v.optional(v.id("organizations")), // Scoped to organization
    userId: v.optional(v.id("users")), // Optional: scoped to specific user in org
    type: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("success")),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
    link: v.optional(v.string()),
  }).index("by_read", ["read"])
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  invitations: defineTable({
    email: v.string(),
    organizationId: v.id("organizations"),
    role: v.union(
      v.literal("admin"),
      v.literal("agent"),
      v.literal("viewer")
    ),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired"), v.literal("cancelled")),
    invitedBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_email_org", ["email", "organizationId"])
    .index("by_org", ["organizationId"])
    .index("by_status", ["status"]),

  // User settings - notification preferences and general settings
  userSettings: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")), // Organization-scoped settings
    notificationsEnabled: v.optional(v.boolean()), // Enable/disable all notifications
    globalNotificationsEnabled: v.optional(v.boolean()), // Show notifications in dashboard
    soundEnabled: v.optional(v.boolean()), // Play sound for notifications
    emailEnabled: v.optional(v.boolean()), // Send email notifications
    aiAutoResponseEnabled: v.optional(v.boolean()), // AI auto response toggle (plan-based default)
    language: v.optional(v.string()), // User language preference
    timezone: v.optional(v.string()), // User timezone
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_org", ["organizationId"])
    .index("by_user_org", ["userId", "organizationId"]),

  webhook_events: defineTable({
    source: v.union(v.literal("whatsapp"), v.literal("salla")),
    body: v.any(),
    createdAt: v.number(),
  }).index("by_source_createdAt", ["source", "createdAt"]),

  orders: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this order
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("cancelled"), v.literal("refunded")),
    currency: v.string(),
    items: v.any(), // JSON array of items
    createdAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  userActiveChats: defineTable({
    userId: v.id("users"),
    chatId: v.id("chats"),
    lastActiveAt: v.number(), // Timestamp when user last viewed this chat
  }).index("by_user", ["userId"])
    .index("by_user_chat", ["userId", "chatId"]),

  // Lookup table for webhook routing performance
  phoneNumberIdToUserId: defineTable({
    phoneNumberId: v.string(),
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this phone number
    updatedAt: v.number(),
  }).index("by_phone_id", ["phoneNumberId"])
    .index("by_user", ["userId"])
    .index("by_org", ["organizationId"]),

  // Encrypted secrets storage (replaces WorkOS Vault for per-user variables)
  encryptedSecrets: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this secret
    key: v.string(), // e.g., "META_ACCESS_TOKEN"
    encryptedValue: v.string(), // Base64 encoded encrypted value
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_key", ["userId", "key"])
    .index("by_user", ["userId"])
    .index("by_org_key", ["organizationId", "key"])
    .index("by_org", ["organizationId"]),

  // Webhook configurations - multiple webhooks per organization
  webhookConfigs: defineTable({
    userId: v.optional(v.id("users")), // Backward compatibility
    organizationId: v.optional(v.id("organizations")), // Multi-tenant: organization that owns this webhook
    name: v.string(), // Custom name for the webhook
    webhookSlug: v.string(), // Unique identifier for URL routing (e.g., "wh_abc123xyz")
    webhookUrl: v.string(), // Custom webhook URL
    verifyToken: v.string(), // Webhook verify token
    phoneNumbers: v.array(v.object({
      phoneNumberId: v.string(),
      businessName: v.string(), // Business name
      wabaId: v.string(), // WhatsApp Business Account ID per phone
    })), // Array of phone numbers with metadata
    phoneNumberIds: v.array(v.string()), // Array of phone number IDs (backward compatibility)
    phoneNumberId: v.optional(v.string()), // Associated phone number ID (backward compatibility)
    wabaId: v.optional(v.string()), // Associated WABA ID
    appId: v.optional(v.string()), // App ID
    isActive: v.boolean(), // Enable/disable webhook
    isVerified: v.boolean(), // Whether webhook has been verified by Meta
    verifiedAt: v.optional(v.number()), // Timestamp when verification succeeded
    description: v.optional(v.string()), // Optional description
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_org", ["organizationId"])
    .index("by_org_active", ["organizationId", "isActive"])
    .index("by_slug", ["webhookSlug"]) // Fast lookup by unique slug
    .searchIndex("search_webhooks", {
      searchField: "name",
      filterFields: ["userId", "organizationId", "isActive"]
    }),

  // Booking Tool
  bookings: defineTable({
    organizationId: v.id("organizations"),
    contactId: v.optional(v.id("contacts")), // Linked contact
    contactPhone: v.string(), // Snapshot of phone details
    contactName: v.string(), // Snapshot of contact name
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(), // Timestamp
    duration: v.number(), // Minutes
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")), // Assigned team member
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"])
    .index("by_org_date", ["organizationId", "scheduledAt"])
    .index("by_org_status", ["organizationId", "status"])
    .index("by_contact", ["contactId"]),

  // Global Tool Registry (AI & UI Metadata)
  tools: defineTable({
    name: v.string(),
    slug: v.string(), // e.g. "campaigns", "chat"
    description: v.string(),
    aiPrompt: v.string(), // Instructions for the AI on how to use/navigate this tool
    path: v.string(), // UI Path
    icon: v.optional(v.string()), // Lucide icon name
  }).index("by_slug", ["slug"]),

  // Organization Tools - Activated features per org
  organizationTools: defineTable({
    organizationId: v.id("organizations"),
    toolId: v.string(), // "bookings", "products", "campaigns", etc.
    isActive: v.boolean(),
    aiEnabled: v.boolean(), // Can AI agent use this tool?
    config: v.optional(v.any()), // Tool-specific settings
    activatedAt: v.number(),
    activatedBy: v.id("users"),
  }).index("by_org", ["organizationId"])
    .index("by_org_tool", ["organizationId", "toolId"]),

  // Credits System
  credits: defineTable({
    organizationId: v.id("organizations"),
    balance: v.number(), // In USD cents (e.g., 1000 = $10.00)
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  credit_transactions: defineTable({
    organizationId: v.id("organizations"),
    type: v.union(v.literal("purchase"), v.literal("usage"), v.literal("refund")),
    amount: v.number(), // Positive for purchase, negative for usage
    description: v.string(),
    modelUsed: v.optional(v.string()),
    tokensInput: v.optional(v.number()),
    tokensOutput: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_org", ["organizationId"])
    .index("by_org_created", ["organizationId", "createdAt"]),

  // App Store / Integration Management - Phase 33
  installed_apps: defineTable({
    organizationId: v.id("organizations"),
    appId: v.string(), // e.g., "google_search", "salla", "knowledge_base"
    config: v.optional(v.any()), // API keys, webhooks, custom settings
    isActive: v.boolean(),
    category: v.union(v.literal("channels"), v.literal("intelligence"), v.literal("utilities"), v.literal("marketing")),
    installedAt: v.number(),
    installedBy: v.id("users"),
    aiEnabled: v.boolean(), // Can AI agent use this app?
  }).index("by_org", ["organizationId"])
    .index("by_org_app", ["organizationId", "appId"]),
});
