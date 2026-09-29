/**
 * Shared types for the mock content layer.
 * These describe every piece of catalog content shown in the UI
 * (hero, rows, search results) until a real backend exists.
 */

/** A film or show in the catalog. */
export interface ContentItem {
  /** Stable unique identifier, e.g. "the-last-lighthouse". */
  id: string
  title: string
  description: string
  /** One-line tagline, shown in the hero section. */
  logline?: string
  /** Portrait (2:3) card image. */
  thumbnailUrl: string
  /** Landscape backdrop used for the hero and wide cards. */
  backdropUrl: string
  /** Release year. */
  year: number
  /** Content age rating, e.g. "PG-13". */
  rating: string
  genres: string[]
  /** Runtime in minutes. */
  durationMinutes: number
  /** Star rating out of 5, used by the ratings filter page. */
  stars?: number
  /** Optional local video path under public/movies/, e.g. /movies/my-film.mp4. */
  videoUrl?: string
  /** Optional watch progress (0–100), set only for in-progress items. */
  progressPercent?: number
}

/** A horizontally scrollable row of content on the home page. */
export interface ContentRow {
  id: string
  title: string
  items: ContentItem[]
}

/** An entry in the ratings filter accordion. */
export interface RatingOption {
  /** Rating code, e.g. "PG-13". */
  value: string
  /** Display label, e.g. "PG-13 — Parents Strongly Cautioned". */
  label: string
  /** Short explanation of what the rating means. */
  description: string
}
