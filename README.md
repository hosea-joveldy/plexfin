# PlexFin

PlexFin is a responsive streaming catalog UI for short films and TV shows. The current screens use placeholder titles and images; no real media is included.

## Current state

- Home, search, ratings filters, and settings screens are present.
- Search and ratings filtering run against local mock data.
- The home page uses mock catalog rows by default and can load trending and new releases from Supabase when configured. Failed or missing Supabase configuration gracefully falls back to mock rows.
- Authentication, ratings/reviews, watch-history, and Storage SQL foundations are supplied, but playback, account screens, preferences persistence, and admin upload UI are not implemented.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, React Router, and Supabase JS.

## Run locally

```sh
npm install
npm run dev
```

The app runs without Supabase credentials using placeholder data. To configure a Supabase project, copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (the project publishable key or legacy anon key). Restart Vite after changing the environment file. Never put a service-role key in browser environment variables.

## Supabase setup

Apply these SQL files in order using the Supabase SQL editor or a migration workflow:

1. `supabase/schema.sql`
2. `supabase/auth-setup.sql`
3. `supabase/rpc.sql`
4. `supabase/rpc-ratings-reviews.sql`
5. `supabase/rpc-watch-history.sql`
6. `supabase/rls.sql`
7. `supabase/storage-setup.sql`

The scripts define tables, row-level security, catalog RPCs, account bootstrap, and storage bucket policies. Add catalog records only when project content and metadata are supplied. Create admin users by setting `public.users.role = 'admin'` through a trusted database/admin workflow. Public video playback and the admin upload flow are not yet wired into the UI.

## Commands

- `npm run build` — type-check and create the production bundle.
- `npm run test` — run the Vitest suite.
- `npm run preview` — preview the built bundle.

## UI references

`references/` has five wireframes that specify layout structure rather than exact styling.
