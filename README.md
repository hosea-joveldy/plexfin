<div align="center">
  <img src="assets/plexfin-icon.svg" alt="PlexFin logo" width="120" />

  # PlexFin

  A free streaming website for short films and TV shows across genres.

  ![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
  ![shadcn/ui](https://img.shields.io/badge/UI-shadcn%2Fui-000000?logo=shadcnui&logoColor=white)
  ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

</div>

---

## Project Overview

PlexFin is a free streaming website for short films and TV shows across genres. The goal is a clean, navigable browsing experience: discover titles on the home page, search for content, and filter by ratings — all wrapped in a lightweight, responsive UI.

**What works today (UI-only phase):**

- **Home** — hero spotlight plus horizontally scrolling content rows of titles
- **Search** — a flyout/overlay search with recent searches, filters, and a results page
- **Ratings filter** — a sidebar-driven ratings filter with an accordion and filter summary
- **Settings** — a placeholder settings screen
- Global layout with a sidebar navigation shared across all screens

All content is mock/placeholder data. Navigation between screens works, but nothing is functional yet — no playback, no persistence, no real search. See [Current Phase](#current-phase-ui-only) below.

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| UI framework | **React 19** | Built with `@vitejs/plugin-react`; routing via **React Router 7** |
| Styling | **Tailwind CSS 3** | Utility-first styling, `tailwindcss-animate` for transitions |
| Components | **shadcn/ui** patterns | `class-variance-authority` + `tailwind-merge` + `clsx` for composable component styling |
| Icons | **lucide-react** | Icon set used across the UI |
| Build tool | **Vite 8** | Dev server, bundling, and the `@` → `src/` path alias |
| Language | **TypeScript** | Strict typing across all frontend code |
| Testing | **Vitest + Testing Library** | `jsdom` environment for component and unit tests |
| Backend (planned) | **Supabase** | Not implemented in the current phase |

## Project Structure

```
plexfin/
├── assets/                  # Static assets (logo, icon)
├── references/              # 5 HTML wireframes defining layout structure
├── src/
│   ├── components/
│   │   ├── home/            # Hero, content rows, content cards
│   │   ├── layout/          # App shell: sidebar, main content, search flyout
│   │   ├── ratings/         # Filter sidebar, accordion, summary
│   │   └── search/          # Search input, overlay, filters, results grid
│   ├── data/                # Types + mock content (hero, rows, ratings, search)
│   ├── lib/                 # Shared utilities (cn(), etc.)
│   ├── pages/               # Route-level screens
│   ├── test/                # Test setup and config-level tests
│   ├── App.tsx              # Route definitions
│   ├── index.css            # Tailwind entry and global styles
│   └── main.tsx             # App bootstrap
├── index.html               # Vite HTML entry
├── vite.config.ts           # Vite config (React plugin, @ alias)
├── vitest.config.ts         # Vitest config (jsdom, globals, setup file)
├── package.json
└── AGENTS.md                # Project conventions and phase rules
```

**Routes** (all rendered inside the shared `Layout` shell):

| Path | Screen | Wireframe reference |
| --- | --- | --- |
| `/` | `Home` — hero + content rows | `01-home-hero.html`, `02-home-rows.html` |
| `/search` | `SearchResultsPage` | `04-search-results.html` |
| `/ratings` | `RatingsFilter` | `05-ratings-filter.html` |
| `/settings` | `Settings` (placeholder) | — |

The search overlay itself (flyout from the layout) maps to `03-home-search-overlay.html`.

## Getting Started

### Prerequisites

- **Node.js** (LTS recommended) with npm

### Install

```bash
git clone https://github.com/hosea-joveldy/plexfin.git
cd plexfin
npm install
```

If an `.env.example` is present, copy it to `.env` and fill in the required values. (During the UI-only phase, no environment variables are required.)

### Develop

```bash
npm run dev
```

Starts the Vite dev server with hot module replacement. Open the printed local URL in your browser.

### Build

```bash
npm run build
```

Type-checks the project (`tsc -b`) and produces an optimized production bundle in `dist/`.

### Preview production build

```bash
npm run preview
```

Serves the `dist/` build locally so you can verify the production output.

### Test

```bash
npm run test         # run all tests once (vitest run)
npm run test:watch   # run tests in watch mode
```

Tests run in a `jsdom` environment with Testing Library. Test files live alongside the code they cover (e.g. `src/App.test.tsx`, `src/data/data.test.ts`, `src/lib/utils.test.ts`).

## Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `vite` | Start the Vite dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check and build for production to `dist/` |
| `preview` | `vite preview` | Serve the production build locally |
| `test` | `vitest run` | Run the test suite once |
| `test:watch` | `vitest` | Run the test suite in watch mode |

## UI Reference

`references/` contains 5 HTML wireframes (converted from Figma) that define the required **layout structure** for each screen:

1. `01-home-hero.html` — Home hero section
2. `02-home-rows.html` — Home content rows
3. `03-home-search-overlay.html` — Search overlay/flyout
4. `04-search-results.html` — Search results page
5. `05-ratings-filter.html` — Ratings filter screen

These are structural references, not pixel-exact specs. The UI reconciles against them for layout structure (element placement, hierarchy, sections) while styling follows the project's own design decisions.

## Current Phase: UI-Only (No Backend)

The project is currently in a **UI-only phase**:

- ✅ Navigable UI — all screens reachable via sidebar navigation and internal links
- ✅ Mock/placeholder data (hardcoded arrays, dummy titles, placeholder thumbnails)
- ❌ No real data, no auth, no API calls, no database wiring
- ❌ No working search, playback, or persistence — buttons and inputs are clickable but not functional
- ❌ No backend


## License

MIT — see the badge above. The `LICENSE` in the repository governs usage.
