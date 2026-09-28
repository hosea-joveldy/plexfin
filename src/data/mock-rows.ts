import type { ContentItem, ContentRow } from "./types"

/**
 * Placeholder images are generated with placehold.co so every card has a
 * stable, valid image URL without sourcing real media. Swap these out for
 * real thumbnails when content is provided.
 */
function placeholder(portrait: boolean, title: string): string {
  const encoded = encodeURIComponent(title)
  return portrait
    ? `https://placehold.co/400x600/333/666?text=${encoded}`
    : `https://placehold.co/1600x900/444/888?text=${encoded}`
}

interface MockItemInput {
  id: string
  title: string
  description: string
  year: number
  rating: string
  genres: string[]
  durationMinutes: number
  stars: number
  /** Watch progress for Continue Watching items (0–100). */
  progressPercent?: number
}

function makeItem(input: MockItemInput): ContentItem {
  const { progressPercent, ...rest } = input
  return {
    ...rest,
    thumbnailUrl: placeholder(true, input.title),
    backdropUrl: placeholder(false, input.title),
    ...(progressPercent !== undefined ? { progressPercent } : {}),
  }
}

/* ------------------------------------------------------------------ */
/* Continue Watching                                                    */
/* ------------------------------------------------------------------ */

const continueWatchingItems: ContentItem[] = [
  makeItem({
    id: "static-harbor",
    title: "Static Harbor",
    description:
      "A radio operator in a dying fishing town starts receiving broadcasts from a ship that sank fifty years ago.",
    year: 2024,
    rating: "TV-14",
    genres: ["Mystery", "Drama"],
    durationMinutes: 28,
    stars: 4,
    progressPercent: 65,
  }),
  makeItem({
    id: "paper-moons",
    title: "Paper Moons",
    description:
      "Two rival street performers must team up for one night to save the theater that made them.",
    year: 2023,
    rating: "PG",
    genres: ["Comedy", "Drama"],
    durationMinutes: 22,
    stars: 3,
    progressPercent: 40,
  }),
  makeItem({
    id: "the-salt-line",
    title: "The Salt Line",
    description:
      "After the shoreline moves inland, a surveyor discovers the new coast is drawing its own map.",
    year: 2025,
    rating: "R",
    genres: ["Sci-Fi", "Thriller"],
    durationMinutes: 36,
    stars: 5,
    progressPercent: 82,
  }),
  makeItem({
    id: "corner-office-ghosts",
    title: "Corner Office Ghosts",
    description:
      "The night-shift crew of an empty office tower realizes the building was never actually vacated.",
    year: 2024,
    rating: "TV-14",
    genres: ["Horror", "Comedy"],
    durationMinutes: 31,
    stars: 3,
    progressPercent: 15,
  }),
  makeItem({
    id: "nine-minutes-of-sun",
    title: "Nine Minutes of Sun",
    description:
      "A total eclipse gives a small town nine minutes where, supposedly, nothing that happens counts.",
    year: 2023,
    rating: "PG-13",
    genres: ["Comedy", "Sci-Fi"],
    durationMinutes: 19,
    stars: 4,
    progressPercent: 55,
  }),
]

/* ------------------------------------------------------------------ */
/* Trending Now                                                         */
/* ------------------------------------------------------------------ */

const trendingItems: ContentItem[] = [
  makeItem({
    id: "the-last-lighthouse",
    title: "The Last Lighthouse",
    description:
      "When a storm cuts off the only lighthouse on a remote island, its lone keeper must decode a series of mysterious signals before the sea claims what's left of the coast.",
    year: 2025,
    rating: "PG-13",
    genres: ["Drama", "Thriller"],
    durationMinutes: 42,
    stars: 4,
  }),
  makeItem({
    id: "velocity-hours",
    title: "Velocity Hours",
    description:
      "A courier with one delivery left discovers the package is a person who does not want to arrive.",
    year: 2025,
    rating: "R",
    genres: ["Action", "Thriller"],
    durationMinutes: 38,
    stars: 4,
  }),
  makeItem({
    id: "greenhouse-seven",
    title: "Greenhouse Seven",
    description:
      "Seven botanists locked in an arctic greenhouse argue over the only seed that still grows.",
    year: 2024,
    rating: "PG-13",
    genres: ["Sci-Fi", "Drama"],
    durationMinutes: 45,
    stars: 5,
  }),
  makeItem({
    id: "the-understudy",
    title: "The Understudy",
    description:
      "An understudy's shot at opening night goes wrong in ways the script never planned.",
    year: 2024,
    rating: "R",
    genres: ["Drama", "Thriller"],
    durationMinutes: 33,
    stars: 4,
  }),
  makeItem({
    id: "marginalia",
    title: "Marginalia",
    description:
      "A used-book clerk finds her own handwriting in a novel published before she was born.",
    year: 2025,
    rating: "PG-13",
    genres: ["Mystery", "Drama"],
    durationMinutes: 27,
    stars: 5,
  }),
  makeItem({
    id: "the-long-detour",
    title: "The Long Detour",
    description:
      "A road trip between estranged siblings becomes a scavenger hunt their father left behind.",
    year: 2023,
    rating: "PG",
    genres: ["Comedy", "Drama"],
    durationMinutes: 41,
    stars: 4,
  }),
]

/* ------------------------------------------------------------------ */
/* Action                                                               */
/* ------------------------------------------------------------------ */

const actionItems: ContentItem[] = [
  makeItem({
    id: "velocity-hours",
    title: "Velocity Hours",
    description:
      "A courier with one delivery left discovers the package is a person who does not want to arrive.",
    year: 2025,
    rating: "R",
    genres: ["Action", "Thriller"],
    durationMinutes: 38,
    stars: 4,
  }),
  makeItem({
    id: "dead-reckoning-run",
    title: "Dead Reckoning Run",
    description:
      "A disgraced rally driver re-enters the one race that ended her career, on roads that keep changing.",
    year: 2024,
    rating: "PG-13",
    genres: ["Action", "Drama"],
    durationMinutes: 47,
    stars: 4,
  }),
  makeItem({
    id: "the-extraction-pigeon",
    title: "The Extraction Pigeon",
    description:
      "An ex-courier's last job is simple: move one bird across the city before sunset. Nothing is simple.",
    year: 2025,
    rating: "R",
    genres: ["Action", "Comedy"],
    durationMinutes: 29,
    stars: 3,
  }),
  makeItem({
    id: "cold-open",
    title: "Cold Open",
    description:
      "A stunt performer realizes the heist being filmed around her is not being filmed at all.",
    year: 2023,
    rating: "R",
    genres: ["Action", "Thriller"],
    durationMinutes: 35,
    stars: 5,
  }),
  makeItem({
    id: "nightshift-ninety",
    title: "Nightshift Ninety",
    description:
      "A hospital security guard has ninety minutes to keep a witness alive during a citywide blackout.",
    year: 2024,
    rating: "TV-MA",
    genres: ["Action", "Crime"],
    durationMinutes: 52,
    stars: 4,
  }),
  makeItem({
    id: "gravity-debt",
    title: "Gravity Debt",
    description:
      "In a orbital labor colony, a salvage climber owes a debt measured in altitude, not money.",
    year: 2025,
    rating: "PG-13",
    genres: ["Action", "Sci-Fi"],
    durationMinutes: 44,
    stars: 4,
  }),
]

/* ------------------------------------------------------------------ */
/* Drama                                                                */
/* ------------------------------------------------------------------ */

const dramaItems: ContentItem[] = [
  makeItem({
    id: "the-understudy",
    title: "The Understudy",
    description:
      "An understudy's shot at opening night goes wrong in ways the script never planned.",
    year: 2024,
    rating: "R",
    genres: ["Drama", "Thriller"],
    durationMinutes: 33,
    stars: 4,
  }),
  makeItem({
    id: "the-salt-line",
    title: "The Salt Line",
    description:
      "After the shoreline moves inland, a surveyor discovers the new coast is drawing its own map.",
    year: 2025,
    rating: "R",
    genres: ["Sci-Fi", "Drama"],
    durationMinutes: 36,
    stars: 5,
  }),
  makeItem({
    id: "greenhouse-seven",
    title: "Greenhouse Seven",
    description:
      "Seven botanists locked in an arctic greenhouse argue over the only seed that still grows.",
    year: 2024,
    rating: "PG-13",
    genres: ["Sci-Fi", "Drama"],
    durationMinutes: 45,
    stars: 5,
  }),
  makeItem({
    id: "static-harbor",
    title: "Static Harbor",
    description:
      "A radio operator in a dying fishing town starts receiving broadcasts from a ship that sank fifty years ago.",
    year: 2024,
    rating: "TV-14",
    genres: ["Mystery", "Drama"],
    durationMinutes: 28,
    stars: 4,
  }),
  makeItem({
    id: "the-last-lighthouse",
    title: "The Last Lighthouse",
    description:
      "When a storm cuts off the only lighthouse on a remote island, its lone keeper must decode a series of mysterious signals before the sea claims what's left of the coast.",
    year: 2025,
    rating: "PG-13",
    genres: ["Drama", "Thriller"],
    durationMinutes: 42,
    stars: 4,
  }),
  makeItem({
    id: "inheritance-of-small-things",
    title: "Inheritance of Small Things",
    description:
      "Three siblings sort through their mother's apartment and find she kept a fourth person's things.",
    year: 2023,
    rating: "PG-13",
    genres: ["Drama"],
    durationMinutes: 39,
    stars: 5,
  }),
]

/* ------------------------------------------------------------------ */
/* Comedy                                                               */
/* ------------------------------------------------------------------ */

const comedyItems: ContentItem[] = [
  makeItem({
    id: "paper-moons",
    title: "Paper Moons",
    description:
      "Two rival street performers must team up for one night to save the theater that made them.",
    year: 2023,
    rating: "PG",
    genres: ["Comedy", "Drama"],
    durationMinutes: 22,
    stars: 3,
  }),
  makeItem({
    id: "corner-office-ghosts",
    title: "Corner Office Ghosts",
    description:
      "The night-shift crew of an empty office tower realizes the building was never actually vacated.",
    year: 2024,
    rating: "TV-14",
    genres: ["Horror", "Comedy"],
    durationMinutes: 31,
    stars: 3,
  }),
  makeItem({
    id: "nine-minutes-of-sun",
    title: "Nine Minutes of Sun",
    description:
      "A total eclipse gives a small town nine minutes where, supposedly, nothing that happens counts.",
    year: 2023,
    rating: "PG-13",
    genres: ["Comedy", "Sci-Fi"],
    durationMinutes: 19,
    stars: 4,
  }),
  makeItem({
    id: "the-extraction-pigeon",
    title: "The Extraction Pigeon",
    description:
      "An ex-courier's last job is simple: move one bird across the city before sunset. Nothing is simple.",
    year: 2025,
    rating: "R",
    genres: ["Action", "Comedy"],
    durationMinutes: 29,
    stars: 3,
  }),
  makeItem({
    id: "the-long-detour",
    title: "The Long Detour",
    description:
      "A road trip between estranged siblings becomes a scavenger hunt their father left behind.",
    year: 2023,
    rating: "PG",
    genres: ["Comedy", "Drama"],
    durationMinutes: 41,
    stars: 4,
  }),
  makeItem({
    id: "committee-of-one",
    title: "Committee of One",
    description:
      "The only remaining member of a neighborhood association accidentally gains zoning power over the city.",
    year: 2024,
    rating: "TV-PG",
    genres: ["Comedy"],
    durationMinutes: 25,
    stars: 4,
  }),
]

/* ------------------------------------------------------------------ */
/* Sci-Fi                                                               */
/* ------------------------------------------------------------------ */

const sciFiItems: ContentItem[] = [
  makeItem({
    id: "greenhouse-seven",
    title: "Greenhouse Seven",
    description:
      "Seven botanists locked in an arctic greenhouse argue over the only seed that still grows.",
    year: 2024,
    rating: "PG-13",
    genres: ["Sci-Fi", "Drama"],
    durationMinutes: 45,
    stars: 5,
  }),
  makeItem({
    id: "the-salt-line",
    title: "The Salt Line",
    description:
      "After the shoreline moves inland, a surveyor discovers the new coast is drawing its own map.",
    year: 2025,
    rating: "R",
    genres: ["Sci-Fi", "Thriller"],
    durationMinutes: 36,
    stars: 5,
  }),
  makeItem({
    id: "gravity-debt",
    title: "Gravity Debt",
    description:
      "In a orbital labor colony, a salvage climber owes a debt measured in altitude, not money.",
    year: 2025,
    rating: "PG-13",
    genres: ["Action", "Sci-Fi"],
    durationMinutes: 44,
    stars: 4,
  }),
  makeItem({
    id: "nine-minutes-of-sun",
    title: "Nine Minutes of Sun",
    description:
      "A total eclipse gives a small town nine minutes where, supposedly, nothing that happens counts.",
    year: 2023,
    rating: "PG-13",
    genres: ["Comedy", "Sci-Fi"],
    durationMinutes: 19,
    stars: 4,
  }),
  makeItem({
    id: "the-orbit-of-houses",
    title: "The Orbit of Houses",
    description:
      "Every home in a suburban cul-de-sac wakes up in a slowly decaying orbit around Earth.",
    year: 2025,
    rating: "TV-14",
    genres: ["Sci-Fi", "Comedy"],
    durationMinutes: 34,
    stars: 4,
  }),
  makeItem({
    id: "signal-garden",
    title: "Signal Garden",
    description:
      "A retired astronomer grows plants from seeds that arrived on a signal she decoded herself.",
    year: 2024,
    rating: "TV-G",
    genres: ["Sci-Fi", "Drama"],
    durationMinutes: 26,
    stars: 5,
  }),
]

/* ------------------------------------------------------------------ */
/* Rows                                                                 */
/* ------------------------------------------------------------------ */

export const continueWatchingRow: ContentRow = {
  id: "continue-watching",
  title: "Continue Watching",
  items: continueWatchingItems,
}

export const trendingRow: ContentRow = {
  id: "trending-now",
  title: "Trending Now",
  items: trendingItems,
}

export const actionRow: ContentRow = {
  id: "action",
  title: "Action",
  items: actionItems,
}

export const dramaRow: ContentRow = {
  id: "drama",
  title: "Drama",
  items: dramaItems,
}

export const comedyRow: ContentRow = {
  id: "comedy",
  title: "Comedy",
  items: comedyItems,
}

export const sciFiRow: ContentRow = {
  id: "sci-fi",
  title: "Sci-Fi",
  items: sciFiItems,
}

/** All home page rows, in display order. */
export const contentRows: ContentRow[] = [
  continueWatchingRow,
  trendingRow,
  actionRow,
  dramaRow,
  comedyRow,
  sciFiRow,
]

/** Flat list of every unique item in the catalog (rows deduplicated by id). */
export const allContent: ContentItem[] = Array.from(
  new Map(
    contentRows
      .flatMap((row) => row.items)
      .map((item) => [item.id, item]),
  ).values(),
)
