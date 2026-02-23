# LifeOS Tracker

## Overview
A full-stack web application for tracking daily life goals including prayers, problem-solving, notes, and targets with streak tracking and consistency scoring.

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui + Recharts + wouter
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with session-based auth (bcryptjs for password hashing)

## Architecture
- `shared/schema.ts` - Drizzle ORM schemas and Zod validation
- `server/` - Express backend with auth, routes, storage layer
- `client/src/` - React frontend with pages, components, hooks

## Key Features
- Email/password authentication with session management
- Login with email OR username (auto-detects via @ symbol)
- Forgot/reset password via token system (admin generates tokens)
- Username system (unique, case-insensitive)
- User status system (active/suspended/banned) - enforced on login and session
- Prayer tracker with 5-prayer checklist and streak system
- Problem-solving tracker with streaks, links, tags
- Daily notes with search and filtering
- Daily and weekly targets
- Consistency score (0-100) with color indicators
- AI Coach placeholder (swappable architecture)
- **Separate Admin layout** with dedicated sidebar and navigation
- Admin dashboard with user management (role/status changes)
- Admin user detail view (view all user data, content moderation)
- Admin analytics dashboard (pageviews, active users, signups, retention, charts)
- Client-side event tracking (page views, key actions)
- Dark/Light mode toggle
- Responsive design with sidebar (desktop) and bottom nav (mobile)

## Database Tables
- users (with status: active|suspended|banned)
- password_reset_tokens
- events (analytics tracking)
- prayer_logs, problem_logs, notes, targets_daily, targets_weekly

## Admin Features
- **User Management**: View all users, promote/demote roles, suspend/ban/activate
- **User Detail**: View user's prayer logs, problem logs, notes, targets, consistency score
- **Content Moderation**: Delete any user's prayer logs, problem logs, or notes
- **Password Reset**: Generate reset tokens for users
- **Analytics**: Pageviews (24h/7d/30d), active users, signups, retention, top pages, trend charts

## Auth Flow
- Login accepts email or username in the "identifier" field
- If identifier contains @, treated as email; otherwise as username
- Suspended/banned users are blocked at login and session deserialization
- Forgot password generates a token (shown in dev mode, otherwise admin distributes)
- Reset password accepts token + new password

## Environment Variables
- DATABASE_URL - PostgreSQL connection string
- SESSION_SECRET - Session encryption key
- MAIN_ADMIN_EMAIL - Email for auto-admin assignment on signup
- AI_ENABLED - Enable/disable AI coach
- AI_PROVIDER - AI provider (openai | custom_http)

## Running
- `npm run dev` - Development server on port 5000
- `npm run db:push` - Push schema to database

## Routes
- `/login`, `/signup`, `/forgot-password`, `/reset-password` - Public auth pages
- `/set-username` - Username setup (required after signup)
- `/dashboard`, `/prayers`, `/problems`, `/notes`, `/targets`, `/coach`, `/settings` - User pages
- `/admin` - Admin overview (separate layout)
- `/admin/users` - Admin user management
- `/admin/users/:userId` - Admin user detail
- `/admin/analytics` - Admin analytics dashboard
