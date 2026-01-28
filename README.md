<div dir="rtl">

# W-AI.online 🤖

منصة واتساب ذكية مدعومة بالذكاء الاصطناعي لإدارة العملاء والحجوزات والمحادثات.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Convex](https://img.shields.io/badge/Convex-Backend-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

</div>

## ✨ Features

### 💬 WhatsApp Integration
- Real-time chat with AI-powered responses
- Template message support (including carousels)
- Media handling (images, videos, documents, audio)
- Push notifications for incoming messages

### 📅 Booking System
- Calendar view (Month/List)
- Booking configuration (availability, meeting defaults)
- Customer booking history
- Quick actions (reschedule, cancel, confirm)

### 👥 Customer Management
- Contact database with tags
- Linked data overview (chats, bookings, orders)
- Safe delete with dependency warnings
- Excel import/export

### 🛒 Orders & Campaigns
- Order tracking and status management
- Campaign builder with template selection
- Workflow automation triggers

### ⚙️ Settings & Configuration
- Organization-level settings
- Team permissions
- AI agent configuration
- WhatsApp business settings

---

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Run Convex backend
bunx convex dev

# Run Next.js frontend
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend | Convex (serverless) |
| Auth | Better Auth |
| AI | OpenAI GPT-4 |
| Messaging | WhatsApp Cloud API |
| UI | Shadcn/ui, Radix UI |

---

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (dashboard)/  # Dashboard routes (chat, bookings, customers, etc.)
│   │   └── (site)/       # Public site pages
│   ├── components/       # React components
│   │   ├── ui/           # Shadcn UI components
│   │   └── dashboard/    # Dashboard-specific components
│   └── hooks/            # Custom React hooks
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── chat.ts           # Chat queries/mutations
│   ├── bookings.ts       # Booking system
│   ├── contacts.ts       # Customer management
│   └── agent.ts          # AI agent logic
└── public/               # Static assets
```

---

## 🔧 Environment Variables

```env
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
OPENAI_API_KEY=
```

---

## 📄 License

MIT
