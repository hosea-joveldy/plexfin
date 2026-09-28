import { allContent } from "./mock-rows"
import { heroContent } from "./mock-hero"
import type { ContentItem } from "./types"

/**
 * The searchable pool of titles for the search flyout and search results page.
 * Built from the catalog so search stays consistent with what's on the home
 * page; includes the hero item, which is not part of any row.
 *
 * During the UI-only phase this is filtered client-side with a simple
 * case-insensitive title/genre match — no real search backend.
 */
export const searchResults: ContentItem[] = [
  ...heroContent,
  ...allContent,
]

/**
 * Naive client-side filter used by the search UI.
 * Matches titles case-insensitively, falling back to genre matches.
 */
export function searchMockContent(query: string): ContentItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return searchResults.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.genres.some((genre) => genre.toLowerCase().includes(q)),
  )
}
