# Creator Club™ - Project Context

## Overview
Creator Club™ is an all-in-one platform/OS for mentors, coaches, and course creators. It replaces 4-5 separate tools (Discord, Kajabi, Calendly, Skool, Zapier, Whop) and adds an AI Success Manager that tracks student progress.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe (Checkout, Billing, Connect)
- **AI**: Gemini API (via `services/geminiService.ts`)
- **Entry Point**: `index.tsx` → `App.tsx`

## Quick Start
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run preview    # Preview production build
```

## MCP Configuration

### Available Servers
From `.mcp.json`:
- **supabase**: HTTP MCP server for database operations
  - Project: `znqesarsluytxhuiwfkt`
  - URL: `https://mcp.supabase.com/mcp?project_ref=znqesarsluytxhuiwfkt`
- **stripe**: HTTP MCP server for payment operations
  - URL: `https://mcp.stripe.com/`

### Key Tools & Their Uses
| Server | Tool | Purpose |
|--------|------|---------|
| supabase | `list_tables`, `execute_sql` | Database queries |
| supabase | `apply_migration` | Schema changes |
| supabase | `list_edge_functions`, `deploy_edge_function` | Serverless functions |
| stripe | `list_products`, `list_prices` | View Stripe catalog |
| stripe | `list_customers`, `list_subscriptions` | Customer data |
| stripe | `search_stripe_documentation` | API reference |

## Key Components
- `Dashboard.tsx` - Main admin dashboard
- `CommunityHub.tsx` - Forum-style community with channels/posts
- `CourseLMS.tsx` - Learning management system
- `CalendarView.tsx` - Events and scheduling
- `AiSuccessManager.tsx` - AI-powered student tracking
- `Sidebar.tsx` - Navigation

## Core Features (MVP v1.0)
1. **Community Hub** - Forums, channels, posts, basic chat
2. **Course LMS** - Courses → Modules → Lessons with progress tracking
3. **AI Success Manager** - Risk scoring, student health monitoring
4. **Calendar & Events** - Group events, 1:1 booking
5. **Payments & Plans** - Stripe integration, subscriptions

## Data Models (from spec)
- User, CreatorProfile, Community, Course, Module, Lesson
- Enrollment, Membership, Event, Subscription/Plan
- Progress, Engagement, Task, AIConversation

## Architecture

### Directory Structure
```
src/
├── core/                    # Core utilities and types
│   ├── types.ts             # TypeScript type definitions
│   └── supabase/            # Supabase client
├── features/                # Feature modules
│   ├── billing/             # Stripe billing system
│   │   ├── components/      # PlanCard, UpgradeModal, etc.
│   │   ├── hooks/           # usePlanLimits, useLimitCheck
│   │   ├── pages/           # BillingSettingsPage, OnboardingPage
│   │   ├── stripeService.ts # Client-side Stripe operations
│   │   └── stripeTypes.ts   # Billing type definitions
│   ├── courses/             # Course LMS feature
│   └── ...
├── services/                # External API integrations
│   └── geminiService.ts     # AI integration
└── App.tsx
```

### Key Patterns & Conventions
- **Feature modules**: Each feature in `src/features/` has components/, hooks/, pages/
- **Service layer**: External APIs accessed via services in `src/services/`
- **Edge Functions**: Supabase functions in `supabase/functions/` with shared code in `_shared/`
- **Types**: Centralized in `src/core/types.ts` and feature-specific type files

### Important Files
| File | Purpose |
|------|---------|
| `src/features/billing/stripeService.ts` | Client-side Stripe Checkout/Portal |
| `supabase/functions/_shared/stripe.ts` | Server-side Stripe client |
| `docs/plans/2025-12-29-billing-system-design.md` | Complete billing architecture |

## Billing System

### Architecture
The billing system uses a hybrid pricing model with:
- **Fixed monthly fee** (starts after first sale for Pro/Scale)
- **Percentage-based platform fee** on all sales
- **One-time activation fee** (€2.9) on registration

### Creator Plans
| Plan | Monthly Fee | Platform Fee | Features |
|------|-------------|--------------|----------|
| Starter | €0 | 6.9% | 50 students, 2 courses, 1 community |
| Pro | €30 | 3.9% | 500 students, 10 courses, 3 communities |
| Scale | €99 | 1.9% | Unlimited, white-label, API access |

### Stripe Products (Live)
- `prod_ThBhGe4gwluiQ8` - Starter Plan
- `prod_ThBhoMU9mCS03d` - Pro Plan
- `prod_ThBhNjnTJAQEFi` - Scale Plan

### Database Tables
- `billing_plans` - Plan configurations
- `creator_billing` - Creator billing state
- `billing_transactions` - Transaction ledger
- `creator_sales` - Sales with platform fees
- `webhook_events` - Idempotent webhook log

### Edge Functions
Located in `supabase/functions/`:
- `stripe-checkout` - Create Checkout sessions
- `stripe-subscription` - Manage subscriptions
- `stripe-connect` - Creator payout onboarding
- `stripe-webhook` - Handle Stripe webhooks
- `student-plus-checkout` - Student subscription checkout
- `student-plus-portal` - Student billing portal

## Environment

### Dependencies
Key packages from `package.json`:
- `@stripe/react-stripe-js` + `@stripe/stripe-js` - Stripe integration
- `@supabase/supabase-js` - Database client
- `@google/genai` - Gemini AI
- `react-router-dom` - Routing
- `recharts` - Charts/analytics
- `lucide-react` - Icons

### Required Environment Variables
```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Stripe (client-side)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe (server-side - Supabase secrets)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### External Services
- **Supabase**: Database, Auth, Edge Functions
- **Stripe**: Payments, Subscriptions, Connect
- **Gemini**: AI-powered student success analysis
- **Vercel**: Analytics (`@vercel/analytics`)

## Agent Coordination
This project uses the multi-agent chatroom system. Agents communicate via `chatroom.md`.

### Agent Definitions
Located in `.claude/agents/`:
- **coordinator.md** - Orchestrate complex multi-agent tasks, break down work, assign to agents
- **explorer.md** - Research and understand the codebase, find patterns and gather context
- **architect.md** - Make design decisions, define structure, create implementation plans
- **implementer.md** - Write production code following the Architect's design
- **reviewer.md** - Review code for quality, security, and correctness
- **debugger.md** - Investigate issues, find root causes, fix bugs
- **tester.md** - Write tests and verify implementations work correctly

### Chatroom Structure
The chatroom uses this format (template in `.claude/templates/chatroom-template.md`):
- **Mission** - Current task description
- **Agents Table** - Role, Status, Last Active, Current Focus
- **Active Context** - Project, Stack, Key Paths
- **Task Queue** - Checklist of tasks (completed, remaining, deferred)
- **Thread** - Chronological agent updates with `### [Date] [Agent]` format
- **Decisions Log** - Table of decisions with rationale
- **Artifacts** - Files created/modified
- **Blocked Items** - Current blockers

### Commands
- `/coordinate [task]` - Start coordinated multi-agent work
- `/reset-chatroom` - Clear chatroom for new task (use template)
- `/learn` - Update this CLAUDE.md with conversation learnings

## Skills
Custom skills in `.claude/skills/`:
- `billing-integration.md` - Billing system implementation guide
- `stripe-integration.md` - Stripe API patterns
- `stripe-webhooks.md` - Webhook handling best practices
- `stripe-best-practices.md` - Security and PCI compliance

## Gotchas & Lessons Learned

### Stripe Integration
- **Webhook idempotency**: Always store `stripe_event_id` and check before processing
- **Currency in cents**: All amounts in database stored as integer cents (€30 = 3000)
- **RLS for billing**: `webhook_events` uses service_role only policy
- **Live mode webhook**: Must configure separately from test mode in Stripe Dashboard

### Supabase Edge Functions
- **Shared code**: Import from `../_shared/` for common utilities
- **CORS**: Headers must be set for browser requests
- **Secrets**: Use `supabase secrets set` for API keys

### TypeScript
- **Strict mode**: Project uses strict TypeScript
- **Type imports**: Use `import type` for type-only imports

### RLS Policies for Public Data
- **Anon vs Authenticated gap**: When adding RLS policies for public data, remember to add policies for BOTH `anon` AND `authenticated` roles. A policy targeting only `anon` won't apply to logged-in users.
- **Community member counts**: The `memberships` table requires policies for both roles to display counts correctly on public community pages
- **Key files for community RLS**:
  - `supabase/migrations/008_public_community_access.sql` - anon policies
  - `supabase/migrations/fix_membership_count_rls.sql` - authenticated policy fix

## Discovery Log

### [2025-12-30 17:00] Billing System Complete Implementation
**Context**: Full Stripe billing infrastructure deployment

**Learnings**:
- Complete billing system with 3-tier pricing (Starter/Pro/Scale)
- Stripe Products created in live mode
- 6 Edge Functions deployed for payment flows
- Webhook configured and active (we_1Sk4MdFbO001Rr4nPMqOLW9x)
- Student Plus subscription system added for student-facing subscriptions

**Files Touched**:
- `supabase/migrations/011_billing_system.sql` - Core billing schema
- `supabase/migrations/012_billing_security.sql` - RLS policies
- `src/features/billing/*` - Complete billing UI
- `supabase/functions/stripe-*` - All Stripe Edge Functions

**Gotchas Discovered**:
- `@stripe/stripe-js` must be added as direct dependency (not just react-stripe-js)
- Edge Functions need explicit CORS headers for Stripe Elements
- Billing plans seeded via migration, not application code

### [2026-01-03 15:45] Community Member Count RLS Fix
**Context**: Community landing pages showing 0 members despite having active members posting

**Learnings**:
- RLS policies for `anon` role don't apply to `authenticated` users - need separate policies
- The `getCommunityMemberCount()` function in `communityService.ts` queries the `memberships` table
- Public community pages use `getCommunityPublicData()` which fetches member count, channels, and recent posts in parallel
- Existing policy `"Anon can view membership counts in public communities"` only worked for anonymous visitors

**Files Touched**:
- `supabase/migrations/fix_membership_count_rls.sql` - New migration adding authenticated policy
- `src/features/community/communityService.ts` - Member count query functions (lines 665-702)
- `src/public-pages/communities/CommunityLandingPage.tsx` - Displays member count in Community Stats

**Gotchas Discovered**:
- When debugging RLS issues, check `pg_policy` table directly: `SELECT polname, polroles::regrole[] FROM pg_policy WHERE polrelid = 'table_name'::regclass`
- Roles `{-}` in pg_policy means default (usually authenticated), `{anon}` or `{authenticated}` are specific roles
- Database had correct data (13 members), issue was purely RLS visibility
