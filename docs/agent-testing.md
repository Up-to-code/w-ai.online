# Agent Tool Testing Guide

This document provides test cases for evaluating the AI agent's tool usage. Use these prompts with the AI Settings test playground or through actual chat conversations.

---

## Test Framework

Each test case includes:
- **Input**: The message to send
- **Expected Tool**: Which tool should be called
- **Expected Args**: What arguments should be passed
- **Expected Behavior**: What the response should include
- **Language**: Expected response language

---

## Tool Test Cases

### 1. Create Booking

#### Test 1.1: Basic Booking (English)
```
Input: "I'd like to book an appointment for tomorrow at 3pm"
Expected Tool: create_booking
Expected Args: { title: "Appointment", date: "tomorrow 3pm" }
Expected: Confirmation message with date/time
```

#### Test 1.2: Booking (Arabic)
```
Input: "أريد حجز موعد غداً الساعة الثالثة مساءً"
Expected Tool: create_booking
Expected Args: { title: "موعد", date: "غداً 3pm" }
Expected: Arabic confirmation with ✅ emoji
```

#### Test 1.3: Consultation Booking
```
Input: "Book me a consultation call for next Monday at 10am"
Expected Tool: create_booking
Expected Args: { title: "Consultation Call", date: "next Monday 10am", duration: 30 }
Expected: Detailed booking confirmation
```

---

### 2. Search Products

#### Test 2.1: Simple Product Search
```
Input: "Show me phones under 2000 SAR"
Expected Tool: search_products
Expected Args: { query: "phones", maxPrice: 2000 }
Expected: List of products with prices
```

#### Test 2.2: Category Search
```
Input: "What laptops do you have?"
Expected Tool: search_products
Expected Args: { query: "laptops" }
Expected: Product list with 🛒 emoji
```

#### Test 2.3: Arabic Product Search
```
Input: "ابحث عن ساعات ذكية"
Expected Tool: search_products
Expected Args: { query: "ساعات ذكية" }
Expected: Arabic response with product list
```

---

### 3. Search Customers

#### Test 3.1: Phone Number Lookup
```
Input: "Find customer with phone +966512345678"
Expected Tool: search_customers
Expected Args: { query: "+966512345678" }
Expected: Customer details with tags
```

#### Test 3.2: Name Search
```
Input: "Look up Ahmed's contact info"
Expected Tool: search_customers
Expected Args: { query: "Ahmed" }
Expected: Customer info with 👥 emoji
```

---

### 4. Web Search

#### Test 4.1: Current Events
```
Input: "What's the weather in Riyadh today?"
Expected Tool: web_search
Expected Args: { query: "weather Riyadh today" }
Expected: Real-time weather data with 🌐 emoji
```

#### Test 4.2: External Info
```
Input: "What's the latest iPhone price in Saudi?"
Expected Tool: web_search
Expected Args: { query: "iPhone price Saudi Arabia 2024" }
Expected: Current pricing info with sources
```

---

### 5. Knowledge Base

#### Test 5.1: FAQ Query
```
Input: "What's your return policy?"
Expected Tool: query_knowledge
Expected Args: { query: "return policy" }
Expected: Policy information from knowledge base
```

---

## Multi-Step Test Cases

### Test M.1: Product + Booking
```
Input: "Je voudrais réserver une consultation pour discuter des iPhones"
Expected Flow:
1. Tool: search_products (iPhone)
2. Tool: create_booking (consultation)
Expected: French response combining product info + booking confirmation
```

### Test M.2: Customer + Product
```
Input: "What did Ahmed buy last time? Show me similar products"
Expected Flow:
1. Tool: search_customers (Ahmed)
2. Tool: search_products (based on history)
Expected: Customer history + product recommendations
```

---

## Language Detection Tests

| Input | Expected Language |
|-------|-------------------|
| "Hello, how are you?" | English |
| "مرحبا، كيف حالك؟" | Arabic |
| "Bonjour, comment ça va?" | French |
| "Hola, ¿cómo estás?" | Spanish |
| "Guten Tag, wie geht's?" | German |
| "Merhaba, nasılsınız?" | Turkish |

---

## Error Handling Tests

### Test E.1: Invalid Date
```
Input: "Book me for yesterday"
Expected: Graceful error message explaining invalid date
```

### Test E.2: No Results
```
Input: "Find products named xyzabc123"
Expected: "No products found" with helpful suggestions
```

### Test E.3: Tool Not Available
```
Input: "Send an email to customer"
Expected: Polite decline + offer alternative (e.g., WhatsApp template)
```

---

## Evaluation Criteria

For each test, score on a 1-5 scale:

| Criteria | Description |
|----------|-------------|
| **Tool Selection** | Did the agent choose the correct tool? |
| **Argument Parsing** | Were the arguments correctly extracted? |
| **Language Match** | Did the response match the input language? |
| **Helpfulness** | Was the response useful and complete? |
| **Tone** | Was the tone appropriate for the context? |

---

## Running Tests

### Via Test Playground
1. Go to `/ai-settings`
2. Use the "Test Lab" section
3. Enter test inputs and verify responses

### Via Chat
1. Start a conversation with a test phone number
2. Send test messages
3. Verify tool execution in Convex logs
4. Check credits deduction in dashboard

### Via LLM Evaluation
Use this prompt with another LLM to evaluate:

```
You are an AI agent evaluator. Given the following test case and agent response, score the response on a 1-5 scale for each criterion: Tool Selection, Argument Parsing, Language Match, Helpfulness, and Tone.

Test Case:
[Insert test case here]

Agent Response:
[Insert response here]

Provide your scores and brief justification for each.
```
