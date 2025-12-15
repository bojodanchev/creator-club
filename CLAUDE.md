# Creator Club™ - Project Context

## Overview
Creator Club™ is an all-in-one platform/OS for mentors, coaches, and course creators. It replaces 4-5 separate tools (Discord, Kajabi, Calendly, Skool, Zapier, Whop) and adds an AI Success Manager that tracks student progress.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Gemini API (via `services/geminiService.ts`)
- **Entry Point**: `index.tsx` → `App.tsx`

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
