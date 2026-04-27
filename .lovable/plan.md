## Goal

When a visitor opens the site, they should land directly on the main marketing/content pages (Home, About) without ever seeing or being redirected to the sign in / sign up page. Auth still exists in the background so personalized pages (Dashboard, Messages, Find Buddies, AI Assistant, Settings) keep working — but it stops being shoved in the visitor's face.

## What changes

### 1. Navbar (`src/components/Navbar.tsx`)
- Remove the "Sign In" and "Get Started" buttons (desktop + mobile menu) shown to logged-out visitors.
- Logged-in users keep their avatar dropdown, friend requests, news popup, etc. — no change.

### 2. Home page (`src/pages/Index.tsx`)
- Replace the bottom "Get Started Free" CTA (which links to `/auth?mode=signup`) with a "Start Finding Buddies" CTA that links to `/find-buddies` (matching the hero CTA). This removes the last visible push toward the auth page.

### 3. Auth page route
- Keep the `/auth` route registered in `App.tsx` so personalized pages can still redirect there when a feature genuinely needs a logged-in user (e.g. opening Messages while signed out). It just won't be linked from any public surface anymore.

## What is NOT changing

- The `/auth` page itself stays intact (login + signup forms still work).
- Dashboard, Messages, Find Buddies, AI Assistant, Settings still require sign-in — they need a user ID to load and save data, and removing that would break them.
- No database, RLS, or Supabase changes.

## Result

Opening `/` shows the full landing page immediately. The only way to reach `/auth` is by directly visiting the URL or by clicking into a feature that needs an account.
