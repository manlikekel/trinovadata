# Trinovadata

i want to create a website or an app

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trinovadata.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5c5bf2a6-77e2-4d95-994f-a19a03094cba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## App features for developers

- **Installable app (PWA):** `public/manifest.webmanifest`, `public/sw.js` (offline cache, production only) and `public/icons/`. The install banner and the iPhone "Add to Home Screen" steps live in `src/components/app/InstallPrompt.tsx`.
- **First-use guide:** `src/components/app/Onboarding.tsx`, state in `src/lib/onboarding.ts`. Each user sees it once per device; it can be reopened from the Help / App guide button.

## Accounts and database (Supabase)

The app signs users in with Supabase (email + password, or Google) and stores each company's categories, vendors and jobs in Supabase. Row Level Security keeps every company's data private to its own members.

- Connection: `.env` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public by design; never put the `service_role` key in the app).
- Database: `supabase/migrations/20261024000000_init.sql` creates the tables, security rules and the sign-up trigger (new user → new company, owner role, default categories). Run it once in Supabase → SQL Editor.
- Code: `src/lib/supabase.ts` (client), `src/lib/auth.ts` (session, company), `src/lib/store.ts` (data + saving), `src/routes/auth.tsx` (sign in / sign up / Google / forgot password), `src/routes/reset-password.tsx`.
- Supabase settings: Authentication → URL Configuration → Site URL = your live URL, and add `<your URL>/**` to Redirect URLs. For Google: Authentication → Providers → Google.
- The first-use guide opens for each user on their first sign-in (`setGuideUser` in `src/lib/auth.ts`).
