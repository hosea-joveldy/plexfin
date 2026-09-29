# PlexFin

PlexFin is a Supabase-backed streaming catalog for user-provided movies and shows. It includes account access, browsing/search, title playback, watch progress, ratings/reviews, My List, and an admin upload page.

## Run locally

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Restart Vite after changing the file. Never put a service-role key in browser code or a `VITE_` variable.

The app remains usable without credentials with its local mock catalog. Supabase accounts, catalog data, uploads, watch history, ratings, reviews, and My List require the SQL setup and a connected Supabase project.

## Supabase setup

Run **`supabase/setup.sql`** in the Supabase SQL Editor. It combines the schema, auth bootstrap, catalog RPCs, My List, ratings/reviews, watch history, RLS, and Storage buckets/policies. It can be rerun and preserves existing rows.

After you create an account, promote the intended administrator in the Supabase SQL Editor:

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

The app shows the Admin page only to that role. Database RLS and Storage policies enforce the same restriction, so hiding the UI is not the security boundary. Regular signed-in users can browse and play published titles, save them to My List, record progress, rate, and review.

## Add movies

Sign in as an admin and open **Admin** in the sidebar. Enter the title metadata, poster, and movie file, then choose **Upload and publish movie**. Posters go to the public `thumbnails` bucket; video files go to the private `videos` bucket. Playback uses a short-lived signed URL. Confirm the Supabase project’s Storage file-size limit and plan allow your video size. MP4/H.264 is recommended for browser support.

For local development without Storage, put files in `public/movies/<slug>.mp4` and `public/posters/<slug>.jpg`; the title detail page can also preview a selected local file for the current session. Movie files under `public/movies` are ignored by Git.

## Current limits

- The Ratings filter and Settings screens still use mock data/placeholders.
- Content administration currently supports adding and publishing titles; editing and deleting titles are not in the UI.
- Browser playback depends on a supported codec. This app does not transcode or create adaptive HLS/DASH streams.
- The SQL files other than `setup.sql` remain as readable component scripts; use the combined file for normal setup.

## Commands

- `npm run build` — type-check and create the production bundle.
- `npm run test` — run the Vitest suite.
- `npm run preview` — preview a production bundle.

The `references/` directory contains layout wireframes, not pixel-perfect styling specs.
