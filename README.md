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

### When you add login

Call `setGuideUser(user.id, user.name)` right after a successful sign-in, and `setGuideUser(GUEST)` on sign-out. Every user then gets the welcome guide (greeted by name) the first time they log in, and never again after they finish or skip it.
