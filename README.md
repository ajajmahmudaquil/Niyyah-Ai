# Niyyah

**Discipline. Growth. Accountability.**

Islamic-inspired Personal Growth & Consistency System with AI Coach.

## Features

- Email/password authentication with email verification
- Prayer (Salah) tracker with streak system
- Problem-solving tracker with streaks, links, tags
- Daily notes with search and filtering
- Custom targets system with progress tracking
- Finance module (income/expense tracking, balance, charts)
- AI Coach with swappable provider (OpenAI / custom HTTP)
- Admin panel with user management and analytics
- Multi-language support (English + Bangla)
- Dark/Light mode
- Responsive design with Islamic-inspired emerald/gold theme

## Local Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your values in `.env.local` (see below for required keys).

3. Install dependencies:
   ```bash
   npm install
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

## Vercel Deployment

1. Import the repo from GitHub into Vercel.

2. Add the following environment variables in **Vercel Project Settings → Environment Variables**:

   | Key | Description |
   |-----|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `DATABASE_URL` | PostgreSQL connection string |
   | `MAIN_ADMIN_EMAIL` | Email for auto-admin on signup |
   | `AI_PROVIDER` | AI provider (`openai` or `custom_http`) |
   | `OPENAI_API_KEY` | OpenAI API key |
   | `OPENAI_MODEL` | OpenAI model (e.g. `gpt-4o`) |
   | `APP_URL` | Deployed app URL |

3. Deploy.

## Environment Variables

See `.env.example` for the full list with descriptions.

**Important:** `.env.local` must never be committed. It is already in `.gitignore`.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, wouter
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with session-based auth
- **AI**: Swappable provider architecture (OpenAI, custom HTTP)
