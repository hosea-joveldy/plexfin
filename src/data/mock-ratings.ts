import type { RatingOption } from "./types"

/**
 * Rating filter options for the Ratings page accordion.
 * Ordered from most restrictive for kids to adults-only / TV equivalents,
 * covering both movie (MPA) and TV (TV Parental Guidelines) ratings.
 */
export const ratingFilterOptions: RatingOption[] = [
  {
    value: "G",
    label: "G — General Audiences",
    description: "All ages admitted. Nothing that would offend parents for viewing by children.",
  },
  {
    value: "PG",
    label: "PG — Parental Guidance Suggested",
    description: "Some material may not be suitable for young children.",
  },
  {
    value: "PG-13",
    label: "PG-13 — Parents Strongly Cautioned",
    description: "Some material may be inappropriate for children under 13.",
  },
  {
    value: "R",
    label: "R — Restricted",
    description: "Under 17 requires accompanying parent or adult guardian.",
  },
  {
    value: "NC-17",
    label: "NC-17 — Adults Only",
    description: "No one 17 and under admitted.",
  },
  {
    value: "TV-Y",
    label: "TV-Y — All Children",
    description: "Designed to be appropriate for all children.",
  },
  {
    value: "TV-G",
    label: "TV-G — General Audience",
    description: "Most parents would find this suitable for all ages.",
  },
  {
    value: "TV-PG",
    label: "TV-PG — Parental Guidance Suggested",
    description: "Contains material that parents may find unsuitable for younger children.",
  },
  {
    value: "TV-14",
    label: "TV-14 — Parents Strongly Cautioned",
    description: "Parents are strongly cautioned; may be unsuitable for children under 14.",
  },
  {
    value: "TV-MA",
    label: "TV-MA — Mature Audience Only",
    description: "Specifically designed to be viewed by adults and may be unsuitable for children.",
  },
]

/**
 * Star-rating filter groups for the Ratings page accordion
 * (5 stars, 4 stars, ... matching the reference layout).
 */
export const starFilterOptions: Array<{ stars: number; label: string }> = [
  { stars: 5, label: "5 stars" },
  { stars: 4, label: "4 stars" },
  { stars: 3, label: "3 stars" },
  { stars: 2, label: "2 stars" },
  { stars: 1, label: "1 star" },
]
