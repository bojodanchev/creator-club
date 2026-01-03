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

## Deployment & Testing
- **Production URL**: https://creator-club.vercel.app
- **Hosting**: Vercel (auto-deploys from main branch)
- **Testing**: Always use the production Vercel URL for Playwright/browser testing, NOT localhost

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
- **Shared components**: Reusable UI components in `src/shared/` (Avatar, Sidebar, etc.)

### Important Files
| File | Purpose |
|------|---------|
| `src/features/billing/stripeService.ts` | Client-side Stripe Checkout/Portal |
| `supabase/functions/_shared/stripe.ts` | Server-side Stripe client |
| `docs/plans/2025-12-29-billing-system-design.md` | Complete billing architecture |
| `src/shared/Avatar.tsx` | Shared avatar component with consistent defaults |

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
- `prod_ThBhGe4gwluiQ8` - Activation Fee (€2.90 one-time)
- `prod_ThBhoMU9mCS03d` - Pro Plan (€30/month)
- `prod_ThBhNjnTJAQEFi` - Scale Plan (€99/month)
- `prod_Tj1Bqj9IaP1DJC` - Student Plus (€9.90/month) - `price_1SlZ99FbO001Rr4nyLlAZ9lv`

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

### Routing & Role-Based Access
- **Role-aware routes**: Routes like `/dashboard` render different content based on user role via `AppLayout.renderContent()`
- **Don't over-restrict**: Avoid using `allowedRoles` on routes if `AppLayout` already handles role-based content - it causes "Access Denied" instead of showing appropriate content
- **Post-login redirect**: `getDefaultRedirectPath(role)` in App.tsx determines where users go after login (creators → `/dashboard`, students → `/courses`)
- **ProtectedRouteWrapper**: Handles auth check + optional role restriction. When role restriction fails, shows Access Denied page
- **Key files**:
  - `src/App.tsx` - Route definitions, `AppLayout`, `getDefaultRedirectPath()`
  - `src/public-pages/auth/ProtectedRoute.tsx` - Role-based access control component
  - `src/features/student/StudentHome.tsx` - Student landing page

### Profile ID vs User ID (CRITICAL)
- **The distinction**: `profile.id` is an auto-generated UUID in the `profiles` table. `profile.user_id` (and `user.id` from auth) is the `auth.users.id` FK. These are DIFFERENT values.
- **Database FK references**: ALL `creator_id` and `user_id` columns in tables (courses, communities, enrollments, memberships, tasks, etc.) reference `profiles.id`, NOT `auth.users.id`
- **Why bugs were hidden**: For some users (like the original developer), `profile.id` happened to equal `profile.user_id` by coincidence. Code using wrong ID worked. For other users (like Simeon), they differ, causing RLS failures.
- **useAuth() pattern**: The hook returns `{ user, profile, role }`. Always use `profile.id` for database operations, not `user.id`
- **Two service patterns**:
  1. **Internal lookup services** (communityService.ts, some pointsService functions): Accept auth `user.id`, do internal profile lookup
  2. **Direct profile.id services** (courseService.ts, dashboardService.ts, eventService.ts): Expect `profile.id` passed directly
- **Defense in depth**: Services that do internal profile lookup are more robust. When adding new services, prefer the internal lookup pattern.

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

### [2026-01-03] Profile ID vs User ID Mismatch Fix (CRITICAL BUG)
**Context**: User Simeon619619619619@gmail.com couldn't create courses - getting RLS policy violations and permission errors

**Root Cause Investigation**:
- Discovered that `profile.id` (auto-generated UUID) is DIFFERENT from `profile.user_id` (auth.users.id FK)
- ALL `creator_id` and `user_id` columns in database tables reference `profiles.id`, not `auth.users.id`
- Bug was hidden because for some users (bojodanchev), these IDs happened to be identical by coincidence
- For Simeon, they differed: `profile.id = 3ba15897-...` vs `profile.user_id = ce8ccc0a-...`
- Code was using `user.id` from `useAuth()` when it should use `profile.id`

**Learnings**:
- `useAuth()` returns `{ user, profile, role }` - always use `profile.id` for DB operations
- Services have two patterns:
  1. Internal lookup (robust): Accept auth user.id, convert to profile.id internally (communityService.ts)
  2. Direct expectation: Expect profile.id passed in (courseService.ts, dashboardService.ts)
- Components must know which pattern each service uses
- RLS policies should use `get_my_profile_id()` function, not `auth.uid()`

**Files Fixed**:
- `src/features/courses/CourseLMS.tsx` - 6 `getCourseWithDetails` calls changed from `user?.id` to `profile?.id`
- `src/features/calendar/CalendarView.tsx` - All event service calls (loadEvents, createEvent, rsvp)
- `src/features/ai-manager/AiSuccessManager.tsx` - All dashboard/conversation service calls
- `src/features/dashboard/Dashboard.tsx` - Dashboard stats and at-risk student queries
- `src/features/dashboard/TasksPanel.tsx` - Task CRUD operations
- `src/features/community/pointsService.ts` - Added profile lookup to `getPointTransactions()`
- `src/features/billing/hooks/usePlanLimits.ts` - Plan tier and usage queries
- `src/features/settings/CreatorSettings.tsx` - Creator profile and Stripe Connect calls

**Gotchas Discovered**:
- When IDs happen to match by coincidence, bugs are invisible until a different user triggers them
- Comments like `// Use profile.id because X references profiles.id` were added throughout for future clarity
- Always verify ID types when debugging RLS errors - check both the code AND the database FK references

### [2026-01-03 17:30] Avatar Consistency Fix
**Context**: Profile images showing inconsistently across the app - sidebar, settings, and chat all used different defaults. Custom images rendered poorly in small circles.

**Root Cause Investigation**:
- **Issue 1 - Inconsistent defaults**: Three different fallback strategies existed:
  - Sidebar: `picsum.photos/seed/creator/40/40` (random photo)
  - ProfileSettings: `picsum.photos/seed/profile/100/100` (different random photo)
  - Community/Chat: `ui-avatars.com` with initials (consistent with user's name)
- **Issue 2 - Poor rendering**: Missing `object-cover` CSS on small circular avatars caused custom images to stretch/squeeze instead of cropping properly

**Learnings**:
- Use `ui-avatars.com` for default avatars - generates initials-based images that are personalized and consistent
- Format: `https://ui-avatars.com/api/?name={name}&background=6366f1&color=fff&size={px}&bold=true`
- Always add `object-cover` class to avatar `<img>` elements for proper cropping in circles
- Created shared `Avatar` component at `src/shared/Avatar.tsx` with:
  - Consistent ui-avatars.com fallback
  - Built-in `object-cover` styling
  - Size variants: xs (24px), sm (32px), md (40px), lg (64px), xl (96px)
  - Error handling with fallback to initials

**Files Touched**:
- `src/shared/Avatar.tsx` - **New** shared component
- `src/shared/Sidebar.tsx` - Now uses Avatar component
- `src/features/settings/ProfileSettings.tsx` - Updated fallback URL to ui-avatars.com
- `src/features/community/CommunityHub.tsx` - Added `object-cover` to 5 avatar instances (lines 737, 863, 1022, 1049, 1258)

**Gotchas Discovered**:
- No shared Avatar component existed - each file implemented avatar rendering independently
- `picsum.photos` returns different images for different seeds, so "creator" vs "profile" showed different photos
- ProfileSettings has custom upload overlay, so it keeps the `<img>` tag but uses consistent fallback URL

### [2026-01-03 16:15] Student Dashboard Route Fix
**Context**: Students logging in were redirected to `/dashboard` and shown "Access Denied" error instead of their student home page

**Root Cause Investigation**:
- `/dashboard` route had `allowedRoles={['creator', 'superadmin']}` restriction
- `AppLayout.renderContent()` already had logic to show `StudentHome` for students, `Dashboard` for creators
- But students were blocked by `ProtectedRouteWrapper` before ever reaching `AppLayout`
- Result: Students saw "Access Denied" with message "Required role: creator or superadmin, Your role: student"

**Learnings**:
- When `AppLayout` handles role-based content rendering, don't add `allowedRoles` to the route
- The pattern is: routes define what's protected (auth required), `AppLayout.renderContent()` decides what content to show
- `getDefaultRedirectPath(role)` correctly sent students to `/courses`, but direct navigation to `/dashboard` was broken

**Fix Applied**:
- Removed `allowedRoles={['creator', 'superadmin']}` from `/dashboard` route in App.tsx (line 320)
- Now students navigating to `/dashboard` see `StudentHome`, creators see `Dashboard`

**Files Touched**:
- `src/App.tsx` - Removed role restriction from `/dashboard` route

**Gotchas Discovered**:
- Same URL can show different content based on role - this is intentional and handled by `AppLayout`
- Don't confuse "route protection" (requires auth) with "content switching" (same route, different component)

### [2026-01-03] Edge Function 401 Authentication Fix (RESOLVED)
**Context**: Payment E2E testing revealed all Edge Functions return 401 "Invalid or missing authentication token" while REST API calls succeed with the same authenticated session

**Root Cause**:
The `getUserFromToken()` function in `supabase/functions/_shared/supabase.ts` was calling `client.auth.getUser()` WITHOUT passing the JWT token explicitly. Per [Supabase Edge Function auth docs](https://supabase.com/docs/guides/functions/auth), you MUST extract the token from the Authorization header and pass it to `getUser(token)`.

**Original broken code**:
```typescript
const { data: { user }, error } = await client.auth.getUser(); // ❌ Wrong
```

**Fixed code**:
```typescript
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await client.auth.getUser(token); // ✅ Correct
```

**Files Fixed**:
- `supabase/functions/_shared/supabase.ts:57-87` - `getUserFromToken()` now extracts and passes token explicitly

**Edge Functions Redeployed**:
- `stripe-connect` (v3)
- `stripe-checkout` (v3)

**Gotchas Discovered**:
- Supabase Edge Functions don't auto-populate user from session like the browser client does
- Must explicitly extract JWT from `Authorization: Bearer <token>` header
- Must pass token to `getUser(token)` - the no-argument `getUser()` returns null in Edge Functions

### [2026-01-03] Stripe Connect Setup Required for Payouts
**Context**: After fixing 401, Edge Functions returned 500 with error "You can only create new accounts if you've signed up for Connect"

**Root Cause**:
Stripe Connect must be enabled in the Stripe Dashboard before creating Express accounts for creators.

**Setup Steps**:
1. Go to: https://dashboard.stripe.com/connect/accounts
2. Click "Get started with Connect"
3. Select "Onboarding hosted by Stripe" (Express accounts)
4. Complete platform profile
5. **Verify identity** (required for live mode)
6. Confirm final details

**Business Model Reference**:
| Party | Pays | Amount | When |
|-------|------|--------|------|
| Creator | Activation fee | €2.90 | Once, at registration |
| Creator | Monthly fee | €0/€30/€99 | After first sale (Starter/Pro/Scale) |
| Student | Product price | Varies | On purchase |
| Platform | Takes fee | 6.9%/3.9%/1.9% | From each sale |

**Money Flow** (student buys €100 course from Pro creator):
```
Student pays €100
├── Stripe processing: ~€3
├── Platform fee (3.9%): €3.90
└── Creator receives: €93.10 (via Connect payout)
```

**Why Connect is Required**:
- Enables split payments (automatic platform fee deduction)
- Each creator gets their own Stripe Express account for payouts
- Handles tax reporting (1099s) for creators
- Without Connect, you'd manually transfer money to each creator

**Key Files**:
- `supabase/functions/stripe-connect/index.ts` - Creates Express accounts, generates onboarding links
- `supabase/functions/_shared/stripe.ts:42-68` - STRIPE_CONFIG with product/price IDs
- `docs/plans/2025-12-29-billing-system-design.md` - Complete billing architecture

**Test vs Live Mode**:
- Current config uses LIVE mode product IDs (`prod_ThBh...`, `price_1Sjn...`)
- Products, prices, webhooks, and Connect accounts are separate between modes
- To use test mode: switch keys, recreate products, update database

### [2026-01-03] Community Monetization Implementation
**Context**: Implementing paid community access - creators can set pricing (free/one-time/monthly), students purchase access on landing page, payments split via Stripe Connect

**Architecture**:
- **Database**: Added pricing columns to `communities` table, payment tracking to `memberships`, new `community_purchases` table
- **Edge Functions**: `community-checkout` creates Stripe Checkout sessions, `stripe-webhook` handles payment completion
- **Frontend**: `CommunityPricingSettings` for creators, updated `JoinButton` and `CommunityLandingPage` for students

**Database Schema Changes** (migration `013_community_monetization.sql`):
```sql
-- Communities table additions
ALTER TABLE public.communities
ADD COLUMN pricing_type community_pricing_type DEFAULT 'free' NOT NULL,
ADD COLUMN price_cents INTEGER DEFAULT 0,
ADD COLUMN currency TEXT DEFAULT 'EUR',
ADD COLUMN stripe_product_id TEXT,
ADD COLUMN stripe_price_id TEXT;

-- Memberships payment tracking
ALTER TABLE public.memberships
ADD COLUMN payment_status TEXT DEFAULT 'none',
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN stripe_payment_intent_id TEXT,
ADD COLUMN paid_at TIMESTAMPTZ,
ADD COLUMN expires_at TIMESTAMPTZ;
```

**Payment Flow**:
1. Student clicks "Join" on paid community landing page
2. `JoinButton` calls `communityPaymentService.createCommunityCheckout()`
3. Edge Function creates pending membership + Stripe Checkout session
4. Student completes payment on Stripe-hosted checkout
5. Webhook `checkout.session.completed` updates membership to `paid`, records sale

**Key Files Created/Modified**:
- `supabase/functions/community-checkout/index.ts` - Creates Checkout sessions with Connect application fees
- `supabase/functions/stripe-webhook/index.ts` - Added `handleCommunityCheckoutComplete()`, subscription handlers
- `src/features/community/communityTypes.ts` - TypeScript types for community monetization
- `src/features/community/communityPaymentService.ts` - Client-side payment operations
- `src/features/community/components/CommunityPricingSettings.tsx` - Creator pricing UI
- `src/public-pages/communities/JoinButton.tsx` - Payment flow integration
- `src/public-pages/communities/CommunityLandingPage.tsx` - Pricing display cards
- `src/core/types.ts` - Added pricing fields to `CommunityPublicData`

**Platform Fee Calculation**:
```typescript
// Fee based on creator's plan tier
const feePercent = creatorBilling?.plan?.platform_fee_percent || 6.9;
const platformFee = Math.round(community.price_cents * (feePercent / 100));

// Stripe Connect application_fee_amount for split
application_fee_amount: platformFee,
transfer_data: { destination: creatorStripeAccountId }
```

**Webhook Handlers Added**:
- `handleCommunityCheckoutComplete()` - Updates membership to paid, creates `creator_sales` record
- `handleCommunitySubscriptionUpdated()` - Renews access on subscription renewal
- `handleCommunitySubscriptionDeleted()` - Marks membership as canceled

**Gotchas Discovered**:
- Stripe products/prices created dynamically per community (no pre-configured products)
- Pending membership created BEFORE checkout - allows tracking even if checkout is abandoned
- MCP Edge Function deployment requires inlining all `../_shared/` imports
- `CommunityPublicData` type needed updating to include `pricing_type`, `price_cents`, `currency`
- Both `community-checkout` and `stripe-webhook` need `verify_jwt: false` (Stripe calls don't have JWT)
