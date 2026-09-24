# PlexFin

A free streaming website for short films and TV shows across genres.

## Tech Stack

- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL

You have flexibility in how you structure and run these — use your judgment.

## Environment Variables

- **Never** create, read, or modify `.env`. It's managed by the human.
- Always keep `.env.example` up to date when new environment variables are introduced.

## UI & Design Workflow

- This project has a **Stitch MCP server** connected. Use it for all UI-related work.
- Treat Stitch's output as a **reference, not a source of truth**. Always review and adjust — don't copy results blindly.
- Follow the **frontend-design** skill when reviewing and fixing Stitch output — it governs visual taste, typography, and distinctiveness decisions.
- Use the **playwright** skill for UI inspection and review — rendering screens and checking them visually/structurally as part of the workflow, not just eyeballing code.
- The `references/` folder contains **5 HTML files** — these are the original wireframe layouts (converted from Figma) and define required layout *structure*, not styling. Stitch output must be reconciled against these layouts, not the other way around. Follow them for structure, but don't treat them as a pixel-exact spec.

## General

- Keep things simple. Prefer clear, idiomatic code over cleverness.
- Brainstorm and make reasonable implementation decisions yourself where this doc doesn't specify — ask only when genuinely blocked.