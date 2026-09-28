import type { ContentItem } from "./types"

/**
 * The featured item shown in the home page hero section.
 * A single entry for now — swap the contents for real media later.
 */
export const heroContent: ContentItem[] = [
  {
    id: "the-last-lighthouse",
    title: "The Last Lighthouse",
    description:
      "When a storm cuts off the only lighthouse on a remote island, its lone keeper must decode a series of mysterious signals before the sea claims what's left of the coast.",
    logline: "One keeper. One storm. One last signal.",
    thumbnailUrl: "https://placehold.co/400x600/333/666?text=The+Last+Lighthouse",
    backdropUrl: "https://placehold.co/1600x900/444/888?text=The+Last+Lighthouse",
    year: 2025,
    rating: "PG-13",
    genres: ["Drama", "Thriller"],
    durationMinutes: 42,
    stars: 4,
  },
]
