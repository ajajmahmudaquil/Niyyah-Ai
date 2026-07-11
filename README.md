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

2. Fill in your real values in `.env.local` (never commit this file).

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
   | `DATABASE_URL` | PostgreSQL connection string |
   | `MAIN_ADMIN_EMAIL` | Email for auto-admin on signup |
   | `SESSION_SECRET` | Session encryption key |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `AI_PROVIDER` | AI provider (`openai` or `custom_http`) |
   | `OPENAI_API_KEY` | OpenAI API key |
   | `OPENAI_MODEL` | OpenAI model (e.g. `gpt-4o-mini`) |
   | `APP_URL` | Your deployed Vercel URL |

3. Deploy.

> **Important:** Never put secrets in GitHub. Set them only in `.env.local` (local) or Vercel Dashboard (production).

## Environment Variables

See `.env.example` for the full list with placeholder values.

`.env.local` is in `.gitignore` and must never be committed.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, wouter
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with session-based auth
- **AI**: Swappable provider architecture (OpenAI, custom HTTP)

## 👤 Author & Contact

**Ajaj Mahmud Aquil**
- GitHub: [@ajajmahmudaquil](https://github.com/ajajmahmudaquil)
- Portfolio: [aquils-portfolio.vercel.app](https://aquils-portfolio.vercel.app/)

---

> ⭐ If you found this project helpful, please give it a star on GitHub!
