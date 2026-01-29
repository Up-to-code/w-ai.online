// Tool Registry - Modular tool definitions for the AI agent
// Add new tools here, and the agent will automatically pick them up

import { api, internal } from "./_generated/api";

export interface ToolParameter {
    type: "string" | "number" | "boolean" | "array";
    description: string;
    required?: boolean;
    enum?: string[];
}

export interface ToolDefinition {
    name: string;
    slug: string;
    description: string; // For LLM to understand when to use
    category: "booking" | "search" | "communication" | "web" | "knowledge";
    parameters: {
        type: "object";
        properties: Record<string, ToolParameter>;
        required: string[];
    };
    // Execute returns a string result for the LLM
    execute: (ctx: any, args: Record<string, any>, context: ToolContext) => Promise<string>;
}

export interface ToolContext {
    organizationId: string;
    chatId?: string;
    contactName?: string;
    contactPhone?: string;
    userId?: string;
}

// === TOOL IMPLEMENTATIONS ===

async function createBookingTool(ctx: any, args: Record<string, any>, context: ToolContext): Promise<string> {
    try {
        if (!context.userId) {
            return "❌ Cannot create booking: missing user context.";
        }

        const scheduledAt = new Date(args.date).getTime();
        if (isNaN(scheduledAt)) {
            return "❌ Could not parse the date. Please try a clearer format like 'tomorrow at 3pm' or '2024-01-30 15:00'.";
        }

        const booking = await ctx.runMutation(api.bookings.create, {
            userId: context.userId, // Required by bookings.create
            contactName: context.contactName || args.customerName || "Customer",
            contactPhone: context.contactPhone || "",
            title: args.title,
            duration: args.duration || 30,
            scheduledAt,
            notes: args.notes || "",
            status: "pending"
        });

        const dateStr = new Date(scheduledAt).toLocaleString("en-US", {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `✅ Booking created!\n📅 ${args.title}\n🕐 ${dateStr}\n⏱️ ${args.duration || 30} minutes`;
    } catch (error: any) {
        return `❌ Failed to create booking: ${error.message}`;
    }
}

async function searchProductsTool(ctx: any, args: Record<string, any>, context: ToolContext): Promise<string> {
    try {
        const products = await ctx.runQuery(api.products.search, {
            organizationId: context.organizationId,
            query: args.query,
            limit: 5
        });

        if (!products || products.length === 0) {
            return `🔍 No products found for "${args.query}". Try different keywords.`;
        }

        // Format in compact style
        const formatted = products.slice(0, 5).map((p: any) =>
            `• ${p.name} - ${p.price} SAR${p.inStock ? "" : " (Out of stock)"}`
        ).join("\n");

        return `🛒 Products found:\n${formatted}`;
    } catch (error: any) {
        return `❌ Product search failed: ${error.message}`;
    }
}

async function searchCustomersTool(ctx: any, args: Record<string, any>, context: ToolContext): Promise<string> {
    try {
        const contacts = await ctx.runQuery(api.contacts.search, {
            organizationId: context.organizationId,
            query: args.query,
            limit: 5
        });

        if (!contacts || contacts.length === 0) {
            return `🔍 No customers found for "${args.query}".`;
        }

        const formatted = contacts.slice(0, 5).map((c: any) =>
            `• ${c.name || "Unknown"} - ${c.phone}${c.tags?.length ? ` [${c.tags.join(", ")}]` : ""}`
        ).join("\n");

        return `👥 Customers found:\n${formatted}`;
    } catch (error: any) {
        return `❌ Customer search failed: ${error.message}`;
    }
}

async function webSearchTool(ctx: any, args: Record<string, any>, context: ToolContext): Promise<string> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        return `🌐 Web search is not configured. Ask your admin to add TAVILY_API_KEY.`;
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: args.query,
                search_depth: "basic",
                max_results: 3,
                include_answer: true
            })
        });

        const data = await response.json();

        if (data.answer) {
            return `🌐 ${data.answer}`;
        }

        if (data.results?.length > 0) {
            const formatted = data.results.slice(0, 3).map((r: any) =>
                `• ${r.title}: ${r.content?.slice(0, 100)}...`
            ).join("\n");
            return `🌐 Web results:\n${formatted}`;
        }

        return "🌐 No relevant results found.";
    } catch (error: any) {
        return `❌ Web search failed: ${error.message}`;
    }
}

async function queryKnowledgeTool(ctx: any, args: Record<string, any>, context: ToolContext): Promise<string> {
    try {
        const entries = await ctx.runQuery(api.knowledge.search, {
            organizationId: context.organizationId,
            query: args.query,
            limit: 3
        });

        if (!entries || entries.length === 0) {
            return `📚 No knowledge base entries found for "${args.query}".`;
        }

        const formatted = entries.map((e: any) =>
            `📄 ${e.title}:\n${e.content.slice(0, 200)}...`
        ).join("\n\n");

        return formatted;
    } catch (error: any) {
        // Fallback if knowledge table doesn't exist yet
        return `📚 Knowledge base not available.`;
    }
}

// === TOOL REGISTRY ===

export const TOOL_REGISTRY: ToolDefinition[] = [
    {
        name: "Create Booking",
        slug: "create_booking",
        description: "Schedule an appointment, meeting, or consultation for the customer. Use when user wants to book something.",
        category: "booking",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "Booking title (e.g., 'Consultation', 'Product Demo')" },
                date: { type: "string", description: "Date and time (e.g., 'tomorrow 3pm', '2024-01-30 15:00')" },
                duration: { type: "number", description: "Duration in minutes (default: 30)" },
                notes: { type: "string", description: "Optional notes" }
            },
            required: ["title", "date"]
        },
        execute: createBookingTool
    },
    {
        name: "Search Products",
        slug: "search_products",
        description: "Search the product catalog. Use when user asks about products, prices, availability, or wants to buy something.",
        category: "search",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search keywords (product name, category, brand)" },
                maxPrice: { type: "number", description: "Optional maximum price filter" },
                category: { type: "string", description: "Optional category filter" }
            },
            required: ["query"]
        },
        execute: searchProductsTool
    },
    {
        name: "Search Customers",
        slug: "search_customers",
        description: "Look up customer information. Use when checking customer history or finding contact details.",
        category: "search",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Name, phone number, or email to search" }
            },
            required: ["query"]
        },
        execute: searchCustomersTool
    },
    {
        name: "Web Search",
        slug: "web_search",
        description: "Search the web for real-time information. Use for current events, weather, external facts, or anything not in the local database.",
        category: "web",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query" }
            },
            required: ["query"]
        },
        execute: webSearchTool
    },
    {
        name: "Query Knowledge Base",
        slug: "query_knowledge",
        description: "Search the organization's knowledge base for FAQs, policies, and internal documents.",
        category: "knowledge",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Question or topic to search for" }
            },
            required: ["query"]
        },
        execute: queryKnowledgeTool
    }
];

// === HELPER FUNCTIONS ===

// Get tool by slug
export function getToolBySlug(slug: string): ToolDefinition | undefined {
    return TOOL_REGISTRY.find(t => t.slug === slug);
}

// Get OpenRouter-compatible tools array
export function getOpenRouterTools(enabledSlugs?: string[]) {
    const tools = enabledSlugs
        ? TOOL_REGISTRY.filter(t => enabledSlugs.includes(t.slug))
        : TOOL_REGISTRY;

    return tools.map(tool => ({
        type: "function" as const,
        function: {
            name: tool.slug,
            description: tool.description,
            parameters: {
                type: "object",
                properties: Object.fromEntries(
                    Object.entries(tool.parameters.properties).map(([key, val]) => [
                        key,
                        { type: val.type, description: val.description }
                    ])
                ),
                required: tool.parameters.required
            }
        }
    }));
}

// Execute a tool by slug
export async function executeTool(
    ctx: any,
    slug: string,
    args: Record<string, any>,
    context: ToolContext
): Promise<string> {
    const tool = getToolBySlug(slug);

    if (!tool) {
        return `❌ Unknown tool: ${slug}`;
    }

    try {
        return await tool.execute(ctx, args, context);
    } catch (error: any) {
        console.error(`[Tool Error] ${slug}:`, error);
        return `❌ Tool error: ${error.message}`;
    }
}
