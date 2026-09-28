# PlexFin - Design Notes

## Color Tokens (from reference HTML)
- **Background (main)**: `#141414`
- **Sidebar background**: `#0d0d0d`
- **Hero gradient**: `linear-gradient(to bottom, #666, #333)`
- **Nav item default**: `#ccc`
- **Nav item active**: `#fff`
- **Search flyout bg**: `#222`
- **Search input placeholder**: `#999`
- **Hero meta text**: `#ccc`
- **Watch Now button bg**: `rgba(255,255,255,0.15)`
- **Card hover overlay**: `rgba(0,0,0,0.6)`

## Typography Scale
- **Hero title**: 64px, font-weight 500
- **Section titles (rows)**: 24px, font-weight 500
- **Hero meta items**: 18px, color #ccc
- **Nav icons**: 24px
- **Search input**: 48px
- **Button text**: 16px
- **Card titles**: ~16px

## Spacing System
- **Sidebar width**: 80px fixed
- **Sidebar padding-top**: 400px (positions nav in vertical center)
- **Nav item gap**: 48px
- **Hero min-height**: 780px
- **Hero info padding**: 40px 48px
- **Hero meta gap**: 24px
- **Hero meta margin-bottom**: 32px
- **Button padding**: 18px 32px
- **Content row padding**: 0 48px
- **Content row gap**: 16px
- **Card aspect ratio**: 2:3 (portrait)

## Component Hierarchy
```
App
├── Layout
│   ├── Sidebar (persistent, 80px)
│   │   ├── NavItem (Home, Search, Ratings, Settings)
│   │   └── SearchFlyout (quick search from sidebar)
│   └── MainContent (flex: 1)
│       ├── Home Page (/)
│       │   ├── Hero Section
│       │   │   ├── HeroInfo
│       │   │   ├── HeroMeta
│       │   │   └── HeroActions (Watch Now, My List, Rate)
│       │   └── ContentRow[] (Continue Watching, Trending, By Genre...)
│       │       └── ContentCard[]
│       ├── Search Overlay (modal, triggered from sidebar)
│       │   ├── SearchInput
│       │   └── RecentSearches
│       ├── Search Results Page (/search)
│       │   ├── SearchHeader (query + count)
│       │   ├── SearchFilters (tabs + sort)
│       │   └── SearchResultsGrid
│       │       └── ContentCard[]
│       └── Ratings Filter Page (/ratings)
│           ├── FilterSidebar (280px)
│           │   ├── FilterAccordion (Genre, Rating, Year, Duration, Language)
│           │   └── FilterChips (active filters)
│           └── ResultsGrid
│               └── ContentCard[]
```

## Responsive Breakpoints
- **Mobile**: < 640px - sidebar collapses/drawer, hero ~500px, 2-col grids
- **Tablet**: 640-1024px - sidebar 80px, hero ~600px, 3-4 col grids
- **Desktop**: > 1024px - full reference layout

## Key Interactions (UI-only, non-functional)
- Sidebar nav items: clickable, route change, active state
- Search icon: opens flyout → clicking input opens full overlay
- Search overlay: Escape to close, click outside to close
- Content cards: hover scale 1.02, show title overlay
- Hero buttons: hover state only
- Filter accordions: expand/collapse
- Filter chips: removable
- Route transitions: fade

## Mock Data Structure
```typescript
// Hero
{ id, title, year, rating, genre, duration, description, thumbnail, background }

// Content Cards
{ id, title, year, rating, genre, duration, thumbnail, progress? }

// Search Results
{ id, title, year, type: 'movie'|'show', rating, thumbnail }

// Ratings Filters
genres: string[]
ratingRange: [0, 10]
yearRange: [1900, 2026]
durationRange: [0, 300] // minutes
languages: string[]
```

## shadcn/ui Components to Use
- Sidebar (custom, not shadcn)
- Button (Watch Now, My List, Rate, Apply/Reset filters)
- Input (Search)
- Select (Sort dropdown)
- Slider (Rating range)
- Checkbox (Genre multi-select)
- Separator
- ScrollArea (for horizontal rows)
- Dialog/Sheet (Search overlay, mobile filters)
- Tooltip (nav item labels on hover)
- Skeleton (loading states)

## Non-Goals (Explicit)
- No backend/API calls
- No authentication
- No real video playback
- No persistence (localStorage, cookies)
- No working search/filtering logic
- No user accounts/profiles
- No payment/subscription flows
