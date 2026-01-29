// LLM Pricing Configuration
// Prices per token (USD)

export const MODEL_PRICING: Record<string, { input: number; output: number; displayName: string }> = {
    // FREE Models (OpenRouter free tier)
    "qwen/qwen3-coder:free": { input: 0, output: 0, displayName: "Qwen3 Coder (Free)" },
    "google/gemini-2.0-flash-exp:free": { input: 0, output: 0, displayName: "Gemini 2.0 Flash (Free)" },
    "deepseek/deepseek-r1:free": { input: 0, output: 0, displayName: "DeepSeek R1 (Free)" },

    // Paid Models
    "deepseek/deepseek-r1": {
        input: 0.00000055,
        output: 0.00000219,
        displayName: "DeepSeek R1"
    },
    "moonshotai/kimi-k2": {
        input: 0.00000040,
        output: 0.00000175,
        displayName: "Kimi K2"
    },
    "openai/gpt-4o": {
        input: 0.0000025,
        output: 0.000010,
        displayName: "GPT-4o"
    },
    "openai/gpt-4o-mini": {
        input: 0.00000015,
        output: 0.0000006,
        displayName: "GPT-4o Mini"
    },
    "google/gemini-2.0-flash-lite-preview-02-05:free": {
        input: 0,
        output: 0,
        displayName: "Gemini 2.0 Flash Lite (Free)"
    },
    "arcee-ai/trinity-mini:free": {
        input: 0,
        output: 0,
        displayName: "Trinity Mini (Free)"
    }
};

const PROFIT_MARGIN = 1.20; // 20% profit

export interface CostCalculation {
    costUSD: number;      // Raw cost to us
    priceUSD: number;     // What we charge (with profit)
    priceCents: number;   // In cents for credits
    inputTokens: number;
    outputTokens: number;
}

export function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): CostCalculation {
    const pricing = MODEL_PRICING[model];

    // Default to free if model not found
    if (!pricing) {
        return {
            costUSD: 0,
            priceUSD: 0,
            priceCents: 0,
            inputTokens,
            outputTokens
        };
    }

    const costUSD = (inputTokens * pricing.input) + (outputTokens * pricing.output);
    const priceUSD = costUSD * PROFIT_MARGIN;
    const priceCents = Math.ceil(priceUSD * 100); // Round up to nearest cent

    return {
        costUSD,
        priceUSD,
        priceCents,
        inputTokens,
        outputTokens
    };
}

// Estimate tokens from text (rough: 1 token ≈ 4 chars)
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// Get model display name
export function getModelDisplayName(model: string): string {
    return MODEL_PRICING[model]?.displayName || model;
}

// Check if model is free
export function isModelFree(model: string): boolean {
    const pricing = MODEL_PRICING[model];
    return pricing ? (pricing.input === 0 && pricing.output === 0) : false;
}
