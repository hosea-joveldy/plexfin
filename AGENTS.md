# PlexFin contributor instructions

PlexFin is a streaming catalog UI built with React, TypeScript, Tailwind CSS, and Supabase.

## Content rules

- The user supplies all film/show video files and metadata. Never source, download, scrape, or link to real film/show media.
- Until that material is supplied, use the existing mock catalog and placeholder images.
- Do not place Supabase service-role secrets in browser code or `VITE_` variables.

## Backend status

- The app must remain usable without Supabase credentials; in that case use mock catalog data.
- Browser credentials are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Supabase schema/setup scripts live in `supabase/`. Keep SQL function arguments, return types, table columns, RLS policies, and TypeScript RPC calls aligned.
- Current UI screens do not yet provide video playback, persistent settings, account UI, or catalog administration. Do not claim those features are complete.
- Apply SQL in the order listed in `README.md`.

## UI references

`references/` contains five HTML wireframes that define required layout structure, not pixel-exact styling.

## General

- Keep code simple and idiomatic.
- When changing user-facing behavior, update the README to match.
- Do not run tests unless the user asks. A production build may be run to verify type-checking and bundling.
