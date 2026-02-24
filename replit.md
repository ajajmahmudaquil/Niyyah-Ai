# Niyyah

## Overview
Islamic-inspired Personal Growth & Consistency System with AI Coach. A full-stack web application for tracking daily life goals including prayers, problem-solving, notes, targets, and finances with streak tracking and consistency scoring.

**Tagline**: Discipline. Growth. Accountability.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui + Recharts + wouter
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with session-based auth (bcryptjs for password hashing)
- **AI**: Swappable provider architecture (OpenAI, custom HTTP)
- **Fonts**: Plus Jakarta Sans (primary), Inter (fallback)

## Design System
- **Primary**: Deep emerald (#065f46) - HSL 163 88% 20%
- **Accent**: Soft gold (#facc15) - HSL 48 96% 53%
- **Dark background**: #0f172a - HSL 222 47% 11%
- **Style**: Calm, Islamic-inspired, minimal, modern
- **Icons**: Compass (prayers), Flame (streaks), CheckCircle2 (completed), Wallet (finance)
- **Patterns**: Subtle geometric Islamic pattern (very low opacity) on dashboard header and auth pages
- **Components**: Rounded corners (rounded-xl), smooth progress bars, salah-style prayer cards

## Architecture
- `shared/schema.ts` - Drizzle ORM schemas and Zod validation
- `server/` - Express backend with auth, routes, storage layer
- `server/ai/` - AI coach with swappable provider architecture
- `client/src/` - React frontend with pages, components, hooks

## Key Features
- Email/password authentication with session management
- Strong password requirements (8+ chars, uppercase, lowercase, number, special character)
- Password strength meter component on signup and settings
- Disposable email domain blocking (client + server)
- Email verification flow with token system
- Login with email OR username (auto-detects via @ symbol)
- Forgot/reset password via token system
- Username system (unique, case-insensitive)
- Full name and profile management (avatar upload, bio)
- User status system (active/suspended/banned) - enforced on login and session
- Prayer (Salah) tracker with 5-prayer checklist and streak system
- Problem-solving tracker with streaks, links, tags
- Daily notes with search and filtering
- Custom targets system (user-defined daily/weekly targets with progress tracking)
- Finance module (income/expense tracking, balance, monthly charts)
- Consistency score (0-100) with weighted components:
  - Prayer: 35%
  - Problems: 25%
  - Targets: 20%
  - Notes: 10%
  - Finance: 10%
- Color-coded consistency badges:
  - 0-49%: red (Behind)
  - 50-74%: amber (On Track)
  - 75-100%: green (Excellent)
- AI Coach with swappable provider (OpenAI / custom HTTP endpoint)
- **Separate Admin layout** with dedicated sidebar and navigation
- Admin dashboard with user management (role/status changes)
- Admin user detail view (view all user data, content moderation)
- Admin analytics dashboard (pageviews, active users, signups, retention, charts)
- Client-side event tracking (page views, key actions)
- Dark/Light mode toggle with emerald/slate color scheme
- Responsive design with sidebar (desktop) and bottom nav (mobile)

## Database Tables
- session (connect-pg-simple session store)
- users (with fullName, emailVerified, avatarUrl, currency, timezone, bio, status)
- email_verification_tokens
- password_reset_tokens
- events (analytics tracking)
- prayer_logs, problem_logs, notes
- targets (custom target definitions)
- target_logs_daily, target_logs_weekly
- targets_daily, targets_weekly (legacy, kept for backward compatibility)
- finance_settings, income_logs, expense_logs

## Admin Features
- **User Management**: View all users, promote/demote roles, suspend/ban/activate
- **User Detail**: View user's prayer logs, problem logs, notes, targets, consistency score, finance summary
- **Content Moderation**: Delete any user's prayer logs, problem logs, or notes
- **Password Reset**: Generate reset tokens for users
- **Analytics**: Pageviews (24h/7d/30d), active users, signups, retention, top pages, trend charts

## Auth Flow
- Signup requires full name, email, password (strong validation), disposable email check
- Email verification token generated on signup (shown in dev mode)
- Login accepts email or username in the "identifier" field
- If identifier contains @, treated as email; otherwise as username
- Suspended/banned users are blocked at login and session deserialization
- Forgot password generates a token (shown in dev mode, otherwise admin distributes)
- Reset password accepts token + new password (strong validation)
- Change password available in settings with password strength meter

## AI Coach Architecture
- `server/ai/config.ts` - Configuration for AI providers
- `server/ai/provider.ts` - Provider interface definition
- `server/ai/providers/openai.ts` - OpenAI provider implementation
- `server/ai/providers/custom_http.ts` - Custom HTTP endpoint provider
- `server/ai/index.ts` - Main AI handler with user context injection
- To switch providers: edit config.ts or set AI_PROVIDER env var

## Environment Variables
- DATABASE_URL - PostgreSQL connection string
- SESSION_SECRET - Session encryption key
- MAIN_ADMIN_EMAIL - Email for auto-admin assignment on signup
- AI_ENABLED - Enable/disable AI coach (true/false)
- AI_PROVIDER - AI provider (openai | custom_http)
- OPENAI_API_KEY - OpenAI API key (when using openai provider)
- OPENAI_MODEL - OpenAI model name (e.g. gpt-4o-mini)
- CUSTOM_AI_ENDPOINT - Custom AI endpoint URL (when using custom_http)
- CUSTOM_AI_API_KEY - Custom AI API key (optional)
- NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
- APP_URL - Deployed app URL (for links in emails, etc.)

## Deployment
- **Env files**: `.env.example` and `.env.local.example` in repo root (placeholders only, safe to commit)
- **Local**: Copy `.env.example` to `.env.local`, fill values, run `npm install && npm run db:push && npm run dev`
- **Vercel**: Import repo, set env vars in Vercel Dashboard, deploy
- **vercel.json**: Routes `/api/*` to Express serverless handler, everything else to static frontend
- **api/index.ts**: Vercel serverless entry point wrapping Express app

## Running
- `npm run dev` - Development server on port 5000
- `npm run build` - Build for production (client + server)
- `npm run db:push` - Push schema to database

## Routes
- `/login`, `/signup`, `/forgot-password`, `/reset-password` - Public auth pages
- `/verify-email` - Email verification page
- `/set-username` - Username setup (required after signup)
- `/dashboard`, `/prayers`, `/problems`, `/notes`, `/targets`, `/coach`, `/finance`, `/settings` - User pages
- `/admin` - Admin overview (separate layout)
- `/admin/users` - Admin user management
- `/admin/users/:userId` - Admin user detail
- `/admin/analytics` - Admin analytics dashboard
