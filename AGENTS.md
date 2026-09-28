# PlexFin

A free streaming website for short films and TV shows across genres.

## Tech Stack

- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL

You have flexibility in how you structure and run these — use your judgment.

## Content

- I will provide all film/show video files and metadata myself. Do not source, download, scrape, or link to real media/content on your own.
- Until real content is provided, keep using mock/placeholder data (hardcoded arrays, dummy titles, placeholder thumbnails).

## UI Reference

- `references/` contains 5 HTML wireframes (converted from Figma) that define required layout *structure*, not styling. Reconcile Stitch's output against these for structure — don't treat them as pixel-exact specs.

## Current Phase: UI-Only (No Backend)

- Build a navigable UI only — no real data, no auth, no API calls, no database wiring.
- Buttons, links, and nav must be clickable/navigable between screens, but nothing needs to be functional (no working search, no real playback, no persistence).
- Do not build FastAPI endpoints or touch PostgreSQL during this phase.

## General

- Keep things simple. Prefer clear, idiomatic code over cleverness.
- Make reasonable implementation decisions where this doc doesn't specify — ask only when genuinely blocked.
