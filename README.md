# PlexFin

PlexFin is a local-first streaming catalog UI for short films and TV shows. It uses placeholder catalog metadata until you add your own titles and media.

## Run locally

```sh
npm install
npm run dev
```

The app works without Supabase credentials. To connect the optional catalog backend, copy `.env.example` to `.env`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then restart Vite. Never put a service-role key in browser code or a `VITE_` variable.

## Local movies and posters

Put files on this machine in these folders, named with the title's content ID/slug:

- Movies: `public/movies/<id>.mp4` (for example `public/movies/the-last-lighthouse.mp4`).
- Posters: `public/posters/<id>.jpg` (for example `public/posters/the-last-lighthouse.jpg`).
- Optional wide backdrop: `public/posters/<id>-backdrop.jpg`.

Home and search cards use local poster paths, and clicking a title opens its detail/player page. If the movie file is not in the expected folder, use **Choose movie file** on that page to play a file directly from your computer for the current browser session. A selected file is not uploaded or copied by the app. The placeholder poster is shown until you provide the poster. Local movie files are ignored by Git; do not commit private or large film files.

Use MP4/H.264 for broad browser playback support. Browser playback depends on the codec as well as the file extension.

## Supabase setup

For a fresh database or an existing database using this project schema, run **`supabase/setup.sql` once** in the Supabase SQL Editor. It combines schema, auth bootstrap, catalog/rating/watch-history RPCs, RLS, and Storage setup in dependency order. It is designed to be rerun without dropping existing rows. The original files remain in `supabase/` as readable sections.

The Supabase Storage buckets are optional and are not used for local playback. Local files stay under `public/` on your machine. Auth UI, settings persistence, and catalog administration are not implemented yet.

## Commands

- `npm run build` — type-check and create the production bundle.
- `npm run test` — run the Vitest suite.
- `npm run preview` — preview a production bundle.

The `references/` directory contains layout wireframes, not pixel-perfect styling specs.
