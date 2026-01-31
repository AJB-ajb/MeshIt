# Mesh

> AI-powered project collaboration matching platform

Mesh helps developers and creators find the perfect collaborators for their projects using AI-powered matching based on skills, interests, availability, and collaboration style.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Runtime** | React 19 |
| **Language** | TypeScript 5.x (strict mode) |
| **Styling** | Tailwind CSS 4.x |
| **Components** | shadcn/ui |
| **Database** | Supabase PostgreSQL + pgvector |
| **Auth** | Supabase Auth (Google, GitHub, LinkedIn, Slack, Discord) |
| **AI** | Gemini 2.0 Flash, OpenAI Embeddings, LangChain.js |
| **Voice** | OpenAI Whisper (STT), ElevenLabs (TTS) |
| **Email** | Resend |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Deployment** | Vercel |

## Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 8.x or later (required - npm/yarn not supported)

### Installing pnpm

```bash
# Using corepack (recommended, comes with Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# Or using npm
npm install -g pnpm

# Or using Homebrew (macOS)
brew install pnpm
```

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/your-team/meshit.git
cd meshit
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys. See [Environment Variables](#environment-variables) for details.

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests in watch mode |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:coverage` | Run unit tests with coverage report |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | Run E2E tests with Playwright UI |
| `pnpm test:e2e:debug` | Run E2E tests in debug mode |

## Project Structure

```
meshit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, callback)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── ai/                # AI services (LangChain, Gemini, OpenAI)
│   │   ├── email/             # Email templates (Resend)
│   │   ├── github/            # GitHub integration
│   │   ├── supabase/          # Supabase client/server
│   │   ├── voice/             # Voice services (Whisper, ElevenLabs)
│   │   └── utils.ts           # Utility functions (cn, etc.)
│   └── test/
│       └── setup.ts           # Vitest setup
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   └── fixtures/              # Test fixtures
├── public/                    # Static assets
├── _bmad-output/              # Planning & implementation docs
├── docs/                      # Project documentation
└── spec/                      # Specifications
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GOOGLE_AI_API_KEY` | Google AI API key (Gemini) |
| `OPENAI_API_KEY` | OpenAI API key (Whisper, Embeddings) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (TTS) |
| `RESEND_API_KEY` | Resend API key (email) |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL |
| `SENTRY_DSN` | Sentry error tracking DSN |

## Adding UI Components

This project uses [shadcn/ui](https://ui.shadcn.com). To add new components:

```bash
pnpm dlx shadcn@latest add [component-name]

# Examples
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add toast
```

## Documentation

- [Architecture](./_bmad-output/planning-artifacts/architecture.md)
- [PRD](./_bmad-output/planning-artifacts/prd.md)
- [Epics & Stories](./_bmad-output/planning-artifacts/epics.md)

## License

Private - All rights reserved
