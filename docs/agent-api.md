# Agent Tool API Documentation

This document explains how to add new tools to the AI agent and how the tool system works.

---

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Message  │───▶│   ReAct Agent   │───▶│  Tool Registry  │
└─────────────────┘    └────────┬────────┘    └────────┬────────┘
                                │                      │
                                ▼                      ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   OpenRouter    │    │  Tool Executor  │
                       │   (LLM API)     │    │  (Runs Tools)   │
                       └─────────────────┘    └─────────────────┘
```

---

## Tool Registry

All tools are defined in `convex/tool_registry.ts`.

### Tool Definition Structure

```typescript
interface ToolDefinition {
  name: string;          // Human-readable name
  slug: string;          // Unique identifier (snake_case)
  description: string;   // For LLM to understand when to use
  category: "booking" | "search" | "communication" | "web" | "knowledge";
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
  execute: (ctx, args, context) => Promise<string>;
}
```

### Tool Context

Every tool receives a context object:

```typescript
interface ToolContext {
  organizationId: string;
  chatId?: string;
  contactName?: string;
  contactPhone?: string;
  userId?: string;
}
```

---

## Adding a New Tool

### Step 1: Define the Tool Function

Add your tool implementation to `convex/tool_registry.ts`:

```typescript
async function myNewTool(
  ctx: any,
  args: Record<string, any>,
  context: ToolContext
): Promise<string> {
  try {
    // Your logic here
    const result = await ctx.runQuery(api.myModule.myQuery, {
      organizationId: context.organizationId,
      param: args.param
    });

    if (!result) {
      return "❌ No results found.";
    }

    return `✅ Success: ${result.message}`;
  } catch (error: any) {
    return `❌ Error: ${error.message}`;
  }
}
```

### Step 2: Register the Tool

Add to the `TOOL_REGISTRY` array:

```typescript
{
  name: "My New Tool",
  slug: "my_new_tool",
  description: "Description for the LLM to know when to use this tool. Be specific!",
  category: "search", // or "booking", "communication", "web", "knowledge"
  parameters: {
    type: "object",
    properties: {
      param: {
        type: "string",
        description: "What this parameter is for"
      },
      optionalParam: {
        type: "number",
        description: "Optional parameter"
      }
    },
    required: ["param"] // Only required params listed here
  },
  execute: myNewTool
}
```

### Step 3: Test Your Tool

1. Run `npx convex dev` to deploy
2. Go to `/ai-settings` and use the Test Lab
3. Send a message that should trigger your tool
4. Check Convex logs for tool execution

---

## Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text input | `"Hello world"` |
| `number` | Numeric value | `42`, `3.14` |
| `boolean` | True/false | `true` |
| `array` | List of values | `["a", "b", "c"]` |

### Enum Parameters

For limited options, use enum:

```typescript
{
  status: {
    type: "string",
    description: "Order status",
    enum: ["pending", "confirmed", "cancelled"]
  }
}
```

---

## Best Practices

### 1. Clear Descriptions

The LLM relies on descriptions to choose tools. Be specific:

```typescript
// ❌ Vague
description: "Handle products"

// ✅ Clear
description: "Search the product catalog by name, category, or price range. Use when user asks about products, availability, or pricing."
```

### 2. Return Human-Readable Messages

```typescript
// ❌ Raw data
return JSON.stringify(data);

// ✅ Formatted message
return `📦 Found ${data.length} products:\n${data.map(p => `• ${p.name} - ${p.price}`).join('\n')}`;
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await riskyOperation();
  return `✅ Success: ${result}`;
} catch (error) {
  console.error("[MyTool] Error:", error);
  return `⚠️ Something went wrong. Please try again.`;
}
```

### 4. Use Emojis for Visual Clarity

| Emoji | Meaning |
|-------|---------|
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| 🔍 | Search |
| 📅 | Date/Time |
| 👥 | Customers |
| 🛒 | Products |
| 🌐 | Web |
| 📄 | Document |

### 5. Keep Responses Concise

The LLM will format your result into a natural response. Keep tool outputs short and factual.

---

## Convex API Access

Tools can access any Convex API:

```typescript
// Run a query
const data = await ctx.runQuery(api.module.query, { args });

// Run a mutation
const result = await ctx.runMutation(api.module.mutation, { args });

// Run an internal action
const result = await ctx.runAction(internal.module.action, { args });
```

---

## Token Efficiency with TOON

For large data results, use TOON format:

```typescript
import { toToon } from "./toon_utils";

// Large product list
const products = await ctx.runQuery(api.products.list, { ... });

// Convert to TOON (saves ~40% tokens)
if (products.length > 5) {
  return toToon({ products: products.slice(0, 10) });
}
```

---

## Pricing and Credits

Every tool execution is tracked. The agent automatically:

1. Estimates token usage
2. Calculates cost (with 20% margin)
3. Deducts from organization credits
4. Logs the transaction

See `convex/pricing.ts` for cost configuration.

---

## Example: Send Promo Code Tool

Here's a complete example of adding a new tool:

```typescript
// 1. Tool function
async function sendPromoCodeTool(
  ctx: any,
  args: Record<string, any>,
  context: ToolContext
): Promise<string> {
  try {
    const code = `PROMO${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const discount = args.discountPercent || 10;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (args.expiryDays || 7));

    // Save to database
    await ctx.runMutation(api.promos.create, {
      organizationId: context.organizationId,
      code,
      discount,
      expiresAt: expiry.getTime(),
      contactPhone: context.contactPhone
    });

    return `🎉 Promo code created: **${code}**\n💰 ${discount}% off\n⏰ Valid until ${expiry.toLocaleDateString()}`;
  } catch (error: any) {
    return `❌ Failed to create promo: ${error.message}`;
  }
}

// 2. Register in TOOL_REGISTRY
{
  name: "Send Promo Code",
  slug: "send_promo_code",
  description: "Generate and send a promotional discount code to the customer. Use when offering discounts or special deals.",
  category: "communication",
  parameters: {
    type: "object",
    properties: {
      discountPercent: {
        type: "number",
        description: "Discount percentage (5-50)"
      },
      expiryDays: {
        type: "number",
        description: "Days until code expires (default: 7)"
      }
    },
    required: ["discountPercent"]
  },
  execute: sendPromoCodeTool
}
```

---

## Troubleshooting

### Tool Not Being Called

1. Check description is clear and specific
2. Ensure slug matches in registry
3. Look at Convex logs for LLM reasoning
4. Try more explicit user prompts

### Tool Returns Error

1. Check Convex logs for stack trace
2. Verify API endpoints exist
3. Test query/mutation independently
4. Check organizationId is passed correctly

### Credits Not Deducting

1. Verify model is in `pricing.ts`
2. Check free models return 0 cost
3. Look at `credit_transactions` table
