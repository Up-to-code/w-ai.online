// Unified AI Agent with ReAct Loop, Tool Calling, Credits, and Multi-Language
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { TOOL_REGISTRY, getOpenRouterTools, executeTool, ToolContext } from "./tool_registry";
import { calculateCost, estimateTokens } from "./pricing";
import { toToon } from "./toon_utils";
import { generateContextPrompt } from "./tool_definitions";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_REACT_ITERATIONS = 3;

// ============ LANGUAGE DETECTION ============

interface DetectedLanguage {
    code: string;
    name: string;
}

function detectLanguage(message: string): DetectedLanguage {
    const patterns: Array<{ code: string; name: string; pattern: RegExp }> = [
        { code: "ar", name: "Arabic", pattern: /[\u0600-\u06FF]/ },
        { code: "fr", name: "French", pattern: /[àâäéèêëïîôùûüÿçœæ]/i },
        { code: "es", name: "Spanish", pattern: /[áéíóúñ¿¡]/i },
        { code: "de", name: "German", pattern: /[äöüß]/i },
        { code: "tr", name: "Turkish", pattern: /[çğıöşüİĞŞ]/ },
        { code: "pt", name: "Portuguese", pattern: /[ãõáéíóúâêô]/i },
    ];

    for (const lang of patterns) {
        if (lang.pattern.test(message)) {
            return { code: lang.code, name: lang.name };
        }
    }

    return { code: "en", name: "English" };
}

// ============ SYSTEM PROMPT BUILDER ============

function buildSystemPrompt(
    config: any,
    chat: any,
    detectedLang: DetectedLanguage
): string {
    // Base prompt from config or default
    let prompt = config?.systemPrompt ||
        "You are a helpful AI sales assistant. You help customers find products, answer questions, and book appointments. Be concise and helpful.";

    // Language rules from config (user editable from dashboard)
    const defaultLanguageRules = `
# Language Rules
- Respond in the user's language (detected: ${detectedLang.name})
- Keep responses concise and helpful
- Use appropriate cultural greetings
`;
    const languageRules = config?.languageRules || defaultLanguageRules;
    prompt += "\n\n" + languageRules;

    // Context-aware formatting (channel, customer info)
    if (chat) {
        const contextPrompt = generateContextPrompt({
            customerName: chat.contactName || "Customer",
            tags: chat.tags || [],
            channel: "whatsapp"
        });
        prompt += contextPrompt;
    }

    // Tool instructions
    if (TOOL_REGISTRY.length > 0) {
        prompt += `\n\n# Available Tools
You have access to the following tools. Use them when the user's request requires them:
${TOOL_REGISTRY.map(t => `- **${t.name}** (${t.slug}): ${t.description}`).join("\n")}

When you need information or to take action, use the appropriate tool.
Only use tools when clearly needed - don't over-use them for simple greetings.
`;
    }

    return prompt;
}

// ============ MAIN AGENT ============

export const generateResponse = internalAction({
    args: {
        organizationId: v.id("organizations"),
        chatId: v.id("chats"),
        contactPhone: v.string(),
        userMessage: v.string(),
    },
    handler: async (ctx, args) => {
        console.log(`[Agent] Starting for chat ${args.chatId}`);

        // 1. Verify chat and get details
        const chat = await ctx.runQuery(internal.chat.get, { id: args.chatId });
        if (!chat || chat.organizationId !== args.organizationId) {
            throw new Error("Chat not found or access denied");
        }

        const apiKey = process.env.OPENROUTER_KEY;
        if (!apiKey) {
            console.error("[Agent] Missing OPENROUTER_KEY");
            return "⚠️ AI service not configured.";
        }

        // 2. Check credits balance
        let hasCredits = true;
        try {
            const balance = await ctx.runQuery(internal.credits.getBalanceInternal, {
                organizationId: args.organizationId
            });
            if (balance <= 0) {
                hasCredits = false;
                console.log("[Agent] Insufficient credits, but will try with free model");
            }
        } catch (e) {
            // Credits table might not exist yet - continue anyway
            console.log("[Agent] Credits check skipped");
        }

        // 3. Get AI Config
        const config = await ctx.runQuery(api.ai_config.getInternalConfig, {
            organizationId: args.organizationId
        });

        // Use free model if no credits
        let model = config?.model || "google/gemini-2.0-flash-lite-preview-02-05:free";
        if (!hasCredits && !model.includes(":free")) {
            model = "google/gemini-2.0-flash-lite-preview-02-05:free";
            console.log("[Agent] Switched to free model due to no credits");
        }

        // 4. Detect language
        const detectedLang = detectLanguage(args.userMessage);
        console.log(`[Agent] Language detected: ${detectedLang.name}`);

        // 5. Build system prompt
        const systemPrompt = buildSystemPrompt(config, chat, detectedLang);

        // 6. Get chat history (last 5 messages for efficiency)
        const userId = chat.userId;
        const history = await ctx.runQuery(api.messages.list, {
            userId,
            chatId: args.chatId
        });

        const recentHistory = history.slice(0, 5).reverse().map((msg: any) => ({
            role: msg.direction === "inbound" ? "user" : "assistant",
            content: msg.content || (msg.type === "image" ? "[Image sent]" : "")
        }));

        // Add conversation summary if available
        let summaryContext = "";
        if (chat?.aiSummary) {
            summaryContext = `\n\n[Previous conversation summary: ${chat.aiSummary}]`;
        }

        // 7. Prepare messages for LLM
        const messages: any[] = [
            { role: "system", content: systemPrompt + summaryContext },
            ...recentHistory,
            { role: "user", content: args.userMessage }
        ];

        // 8. Tool context for execution
        const toolContext: ToolContext = {
            organizationId: args.organizationId as string,
            chatId: args.chatId as string,
            contactName: chat.contactName || undefined,
            contactPhone: args.contactPhone,
            userId: userId as string || undefined
        };

        // 9. ReAct Loop - Think → Act → Observe
        let finalResponse = "";
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (let iteration = 0; iteration < MAX_REACT_ITERATIONS; iteration++) {
            console.log(`[Agent] ReAct iteration ${iteration + 1}/${MAX_REACT_ITERATIONS}`);

            try {
                const response = await fetch(OPENROUTER_API_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://w-ai.online",
                        "X-Title": "W-AI Agent"
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        tools: getOpenRouterTools(),
                        tool_choice: "auto"
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error("[Agent] OpenRouter error:", errText);
                    finalResponse = "⚠️ I encountered an error. Please try again.";
                    break;
                }

                const data = await response.json();

                // Track token usage
                totalInputTokens += data.usage?.prompt_tokens || estimateTokens(JSON.stringify(messages));
                totalOutputTokens += data.usage?.completion_tokens || 0;

                const message = data.choices?.[0]?.message;

                if (!message) {
                    finalResponse = "⚠️ No response received.";
                    break;
                }

                // Check if LLM wants to call a tool
                if (message.tool_calls && message.tool_calls.length > 0) {
                    const toolCall = message.tool_calls[0];
                    const toolName = toolCall.function.name;
                    let toolArgs: Record<string, any> = {};

                    try {
                        toolArgs = JSON.parse(toolCall.function.arguments || "{}");
                    } catch {
                        console.warn("[Agent] Failed to parse tool args:", toolCall.function.arguments);
                    }

                    console.log(`[Agent] Tool call: ${toolName}`, toolArgs);

                    // Execute the tool
                    const observation = await executeTool(ctx, toolName, toolArgs, toolContext);

                    // Use TOON format for compact observation if large
                    const formattedObservation = observation.length > 500
                        ? toToon({ result: observation })
                        : observation;

                    // Add tool call and result to conversation
                    messages.push({
                        role: "assistant",
                        content: null,
                        tool_calls: message.tool_calls
                    });
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: formattedObservation
                    });

                    // Continue loop - LLM will process the observation
                } else {
                    // LLM is ready to respond (no tool call)
                    finalResponse = message.content || "I couldn't generate a response.";
                    break;
                }
            } catch (error: any) {
                console.error("[Agent] Error in ReAct loop:", error);
                finalResponse = "⚠️ An error occurred while processing your request.";
                break;
            }
        }

        // If max iterations reached without response
        if (!finalResponse) {
            finalResponse = "I'm having trouble processing this request. Please try again.";
        }

        // 10. Calculate and deduct credits
        const { priceCents } = calculateCost(model, totalInputTokens, totalOutputTokens);

        if (priceCents > 0) {
            try {
                await ctx.runMutation(internal.credits.deductUsage, {
                    organizationId: args.organizationId,
                    amount: priceCents,
                    model,
                    tokensInput: totalInputTokens,
                    tokensOutput: totalOutputTokens,
                    description: `Chat response (${totalInputTokens + totalOutputTokens} tokens)`
                });
            } catch (e) {
                console.log("[Agent] Credit deduction skipped - table may not exist");
            }
        }

        console.log(`[Agent] Complete. Tokens: ${totalInputTokens}+${totalOutputTokens}, Cost: $${(priceCents / 100).toFixed(4)}`);

        return finalResponse;
    }
});

// ============ TEST ENDPOINT ============

export const testResponse = internalAction({
    args: {
        message: v.string(),
        systemPrompt: v.string(),
        model: v.string(),
        languageRules: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OPENROUTER_KEY;
        if (!apiKey) throw new Error("Missing OPENROUTER_KEY");

        const detectedLang = detectLanguage(args.message);

        let fullPrompt = args.systemPrompt;
        if (args.languageRules) {
            fullPrompt += "\n\n" + args.languageRules;
        }

        const messages = [
            { role: "system", content: fullPrompt },
            { role: "user", content: args.message }
        ];

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://w-ai.online",
                    "X-Title": "W-AI Agent Test"
                },
                body: JSON.stringify({
                    model: args.model,
                    messages,
                    tools: getOpenRouterTools(),
                    tool_choice: "auto"
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenRouter Error: ${err}`);
            }

            const data = await response.json();
            const message = data.choices?.[0]?.message;

            if (message?.tool_calls) {
                const toolCall = message.tool_calls[0];
                return `🔧 Would call tool: ${toolCall.function.name}\nArgs: ${toolCall.function.arguments}`;
            }

            return message?.content || "No response generated.";
        } catch (error: any) {
            console.error("[Agent Test] Failed:", error);
            throw new Error(error.message);
        }
    }
});
