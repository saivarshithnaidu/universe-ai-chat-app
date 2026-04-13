# UniversalAI — Advanced Multilingual AI Platform

UniversalAI is a high-performance, production-grade AI communication platform that bridges linguistic diversity through real-time interaction, parallel model comparison, and intelligent tool orchestration. Built with modern web technologies, it offers a seamless interface for accessing multiple AI models (GPT-4o, Gemini, LLaMA) and specialized AI agents.

## 🚀 Key Features

- **Multilingual Chat Engine**: Real-time text translation and professional-grade linguistic assistance.
- **Parallel Model Execution**: Compare responses from up to 3 AI models simultaneously using a unique "Compare" view.
- **Intelligent AI Agent**: An elite full-stack AI engineer agent capable of generating production-ready project files and code.
- **Hybrid Tool Engine**: Seamless integration with Model Context Protocol (MCP) and customized AI tools for web scraping, database management, and more.
- **Document Intelligence (RAG)**: Retrieval Augmented Generation for summarizing and extracting insights from PDF documents.
- **Premium Features & Billing**: Integrated payment gateway (Razorpay/Stripe) and subscription management.
- **High-Fidelity UI**: Modern, glassmorphic design system built with Tailwind CSS, supporting dark mode and fluid animations.

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: Next.js API Routes, [PostgreSQL](https://www.postgresql.org/) (Neon/Supabase)
- **AI Integration**: [OpenRouter](https://openrouter.ai/), Google [Gemini](https://deepmind.google/technologies/gemini/), OpenAI
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **State Management**: React Context & Hooks
- **Styling & UI**: Framer Motion, Lucide Icons, Shadcn UI (Radix UI)

## 📁 Project Structure

```text
universe-ai/
├── app/                  # Next.js App Router (Pages & API)
│   ├── api/              # Backend API Endpoints
│   ├── chat/             # Chat-related page routes
│   └── globals.css       # Global design variables & styles
├── components/           # Reusable UI & Logical Components
│   ├── ui/               # Base design system components (shadcn)
│   ├── ChatInterface.tsx # Main chat container logic
│   ├── AgentWorkspace.tsx# AI Agent development panel
│   └── ...               # Modals, selectors, and views
├── lib/                  # Core Business Logic & Services
│   ├── db.ts             # PostgreSQL/Supabase integration
│   ├── gemini.ts         # Google Gemini model orchestration
│   ├── openrouter.ts     # OpenRouter multi-model aggregation
│   ├── mcp/              # Model Context Protocol implementation
│   └── tools/            # Specialized AI tool handlers
├── public/               # Static assets (logos, icons, images)
├── scripts/              # Migration and maintenance utilities
├── .env.local            # Local environment secrets (ignored)
├── package.json          # Project dependencies & scripts
└── tsconfig.json         # TypeScript configuration
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- API Keys (OpenRouter, Google Gemini, OpenAI)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/saivarshithnaidu/universe-ai-chat-app.git
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure environment variables:
   Copy `.env` to `.env.local` and add your keys:
   ```bash
   cp .env .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License

This project is private and intended for internal use.
