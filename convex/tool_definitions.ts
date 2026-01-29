export const TOOL_DEFINITIONS = {
    dashboard: {
        name: "Dashboard",
        description: "Overview of system status and metrics",
        prompt: "Use the Dashboard to view high-level metrics (total messages, campaigns sent), recent activity, and system alerts. It is the landing page. If the user asks 'how is the system doing?', check the metrics here."
    },
    chat: {
        name: "Chat (WhatsApp)",
        description: "Real-time messaging interface",
        prompt: "The Chat tool is for 1:1 WhatsApp conversations. IMPORTANT: You are interacting via WhatsApp Cloud API. \n1. To start a NEW conversation after 24 hours of inactivity, you MUST use a 'Template'. \n2. You can send text, images, videos, and documents. \n3. Check 'Customer Profile' in the sidebar for context before replying. \n4. Use 'AI Assist' to generate draft responses."
    },
    campaigns: {
        name: "Campaigns",
        description: "Bulk marketing campaigns",
        prompt: "Use Campaigns for bulk messaging. \n1. You can target users by 'Segment' (dynamic) or 'Tags' (static). \n2. Campaigns support recurring schedules (Cron). \n3. Anti-spam is built-in (smart delays). \n4. You can track 'Sent', 'Delivered', 'Read' stats in real-time. \n5. Use this for announcements, offers, or newsletters."
    },
    customers: {
        name: "Customers (CRM)",
        description: "Contact management database",
        prompt: "The Customers tool is your CRM. \n1. You can search by name, phone, or email. \n2. Use 'Tags' to organize users (e.g., 'vip', 'lead'). \n3. You can view conversation history and past bookings for each contact. \n4. When a user asks about a specific person, search here first."
    },
    templates: {
        name: "Templates",
        description: "WhatsApp message templates",
        prompt: "Templates are REQUIRED for initiating WhatsApp conversations. \n1. Status must be 'APPROVED' by Meta to use. \n2. Templates can have variables ({{1}}, {{2}}). \n3. Types: Marketing, Utility, Authentication. \n4. You can create new templates here and submit them for review."
    },
    workflows: {
        name: "Workflows",
        description: "Automation engine",
        prompt: "Workflows allow you to build 'If This Then That' automation. \n1. Triggers: New Message, Tag Added, Campaign Status. \n2. Actions: Send Message, Add Tag, Notify Admin. \n3. Use this to automate follow-ups or lead qualification."
    },
    bookings: {
        name: "Bookings",
        description: "Appointment scheduling system",
        prompt: "Use Bookings to manage appointments. \n1. Statuses: Pending, Confirmed, Completed, Cancelled, No-Show. \n2. Checks availability against 'Business Hours' defined in Settings. \n3. Can be linked to a specific 'Contact' in the CRM. \n4. Use this when a user wants to schedule a meeting or call."
    },
    settings: {
        name: "Settings",
        description: "System configuration",
        prompt: "Global system settings. \n1. Configure 'Business Profile' (Address, Email). \n2. Connect 'WhatsApp' numbers. \n3. Manage 'Team Members' and permissions. \n4. Billing and Subscription details."
    }
} as const;


export type ToolSlug = keyof typeof TOOL_DEFINITIONS;

export const generateContextPrompt = (context: {
    customerName: string;
    tags: string[];
    channel: "whatsapp" | "web";
}) => {
    let prompt = `\n\n# Context & Style Guidelines:\n`;

    // Channel Context
    if (context.channel === "whatsapp") {
        prompt += `- **Channel**: WhatsApp (Mobile). \n  - Keep responses **concise** (under 3-4 sentences). \n  - Use **emojis** sparingly to be friendly. \n  - formatting: Use *bold* for emphasis, but avoid Markdown headers (#) as they don't render well. \n  - style: Conversational, helpful, and direct.\n`;
    }

    // Customer Context
    prompt += `- **Customer**: ${context.customerName}\n`;
    if (context.tags && context.tags.length > 0) {
        prompt += `- **Tags/Segment**: [${context.tags.join(", ")}]. \n  `;
        if (context.tags.includes("vip")) {
            prompt += `- **VIP Handling**: This is a premium customer. Prioritize their requests and be extra polite. Offer concierge-like assistance.\n`;
        } else if (context.tags.includes("lead")) {
            prompt += `- **Lead Handling**: Exploring customer. Focus on conversion and highlighting value propositions.\n`;
        }
    }

    return prompt;
};

