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
- Username system (unique, case-insensitive)
- Prayer tracker with 5-prayer checklist and streak system
- Problem-solving tracker with streaks, links, tags
- Daily notes with search and filtering
- Daily and weekly targets
- Consistency score (0-100) with color indicators
- AI Coach placeholder (swappable architecture)
- Admin dashboard with user management
- Dark/Light mode toggle
- Responsive design with sidebar (desktop) and bottom nav (mobile)

## Database Tables
- users, prayer_logs, problem_logs, notes, targets_daily, targets_weekly

## Environment Variables
- DATABASE_URL - PostgreSQL connection string
- SESSION_SECRET - Session encryption key
- MAIN_ADMIN_EMAIL - Email for auto-admin assignment
- AI_ENABLED - Enable/disable AI coach
- AI_PROVIDER - AI provider (openai | custom_http)

## Running
- `npm run dev` - Development server on port 5000
- `npm run db:push` - Push schema to database
