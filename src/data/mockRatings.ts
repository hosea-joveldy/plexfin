/**
 * Mock catalog + filter options for the Ratings filter page (/ratings).
 *
 * The ratings page's organizing axis is the 0–10 star score (matching the
 * reference wireframe's star-rating accordions). Each catalog entry extends
 * the shared ContentItem shape with a starRating and language so the filter
 * rail's range slider and language list have real data to slice against.
 */

export interface RatingsFilterDataItem {
  id: string;
  title: string;
  year: number;
  /** Content age rating, e.g. "PG-13". */
  rating: string;
  /** 0–10 star score used by the rating range slider. */
  starRating: number;
  genre: string;
  /** Runtime in minutes. */
  durationMinutes: number;
  language: string;
  thumbnail: string;
  type: "movie" | "show";
}

export interface GenreOption {
  id: string;
  label: string;
}

export interface LanguageOption {
  id: string;
  label: string;
}

export interface YearRange {
  min: number;
  max: number;
}

export interface DurationOption {
  id: string;
  label: string;
  /** Inclusive bounds in minutes; null = no bound in that direction. */
  min: number | null;
  max: number | null;
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

const thumb = (seed: string) => `https://picsum.photos/seed/${seed}/300/450`;

export const mockRatingsCatalog: RatingsFilterDataItem[] = [
  { id: "rt-1", title: "The Last Horizon", year: 2024, rating: "PG-13", starRating: 8.4, genre: "Sci-Fi", durationMinutes: 142, language: "English", thumbnail: thumb("rt-1"), type: "movie" },
  { id: "rt-2", title: "Beyond the Stars", year: 2024, rating: "TV-14", starRating: 7.9, genre: "Sci-Fi", durationMinutes: 55, language: "English", thumbnail: thumb("rt-2"), type: "show" },
  { id: "rt-3", title: "Midnight Runner", year: 2023, rating: "R", starRating: 9.1, genre: "Thriller", durationMinutes: 118, language: "English", thumbnail: thumb("rt-3"), type: "movie" },
  { id: "rt-4", title: "Shadows of the Past", year: 2022, rating: "TV-MA", starRating: 8.8, genre: "Drama", durationMinutes: 48, language: "English", thumbnail: thumb("rt-4"), type: "show" },
  { id: "rt-5", title: "Quantum Leap", year: 2024, rating: "PG-13", starRating: 6.2, genre: "Action", durationMinutes: 139, language: "English", thumbnail: thumb("rt-5"), type: "movie" },
  { id: "rt-6", title: "The Silent Witness", year: 2023, rating: "R", starRating: 7.5, genre: "Mystery", durationMinutes: 112, language: "French", thumbnail: thumb("rt-6"), type: "movie" },
  { id: "rt-7", title: "Golden Hour", year: 2022, rating: "PG", starRating: 5.8, genre: "Romance", durationMinutes: 98, language: "English", thumbnail: thumb("rt-7"), type: "movie" },
  { id: "rt-8", title: "Night Whispers", year: 2021, rating: "TV-14", starRating: 7.1, genre: "Horror", durationMinutes: 44, language: "Japanese", thumbnail: thumb("rt-8"), type: "show" },
  { id: "rt-9", title: "Steel Vengeance", year: 2024, rating: "R", starRating: 8.9, genre: "Action", durationMinutes: 127, language: "English", thumbnail: thumb("rt-9"), type: "movie" },
  { id: "rt-10", title: "Paper Lanterns", year: 2020, rating: "PG", starRating: 6.9, genre: "Drama", durationMinutes: 105, language: "Japanese", thumbnail: thumb("rt-10"), type: "movie" },
  { id: "rt-11", title: "Echoes of Tomorrow", year: 2023, rating: "TV-PG", starRating: 7.3, genre: "Sci-Fi", durationMinutes: 52, language: "English", thumbnail: thumb("rt-11"), type: "show" },
  { id: "rt-12", title: "The Final Verdict", year: 2019, rating: "R", starRating: 9.4, genre: "Thriller", durationMinutes: 134, language: "English", thumbnail: thumb("rt-12"), type: "movie" },
  { id: "rt-13", title: "Whispers in the Dark", year: 2021, rating: "TV-MA", starRating: 8.1, genre: "Horror", durationMinutes: 47, language: "Spanish", thumbnail: thumb("rt-13"), type: "show" },
  { id: "rt-14", title: "Chasing Daylight", year: 2022, rating: "PG-13", starRating: 6.5, genre: "Adventure", durationMinutes: 121, language: "English", thumbnail: thumb("rt-14"), type: "movie" },
  { id: "rt-15", title: "Crimson Tide Rising", year: 2020, rating: "R", starRating: 7.7, genre: "Action", durationMinutes: 116, language: "English", thumbnail: thumb("rt-15"), type: "movie" },
  { id: "rt-16", title: "The Forgotten Kingdom", year: 2018, rating: "PG-13", starRating: 8.6, genre: "Fantasy", durationMinutes: 148, language: "English", thumbnail: thumb("rt-16"), type: "movie" },
  { id: "rt-17", title: "Velvet Dreams", year: 2019, rating: "PG", starRating: 5.4, genre: "Romance", durationMinutes: 96, language: "French", thumbnail: thumb("rt-17"), type: "movie" },
  { id: "rt-18", title: "Silent Orbit", year: 2024, rating: "TV-G", starRating: 7.0, genre: "Documentary", durationMinutes: 41, language: "English", thumbnail: thumb("rt-18"), type: "show" },
  { id: "rt-19", title: "Broken Strings", year: 2021, rating: "TV-14", starRating: 6.8, genre: "Drama", durationMinutes: 108, language: "Spanish", thumbnail: thumb("rt-19"), type: "movie" },
  { id: "rt-20", title: "Last Train Home", year: 2023, rating: "R", starRating: 9.0, genre: "Thriller", durationMinutes: 103, language: "Korean", thumbnail: thumb("rt-20"), type: "movie" },
  { id: "rt-21", title: "City of Glass", year: 2017, rating: "PG-13", starRating: 8.2, genre: "Mystery", durationMinutes: 129, language: "English", thumbnail: thumb("rt-21"), type: "movie" },
  { id: "rt-22", title: "The Art of Falling", year: 2022, rating: "TV-14", starRating: 7.6, genre: "Comedy", durationMinutes: 32, language: "English", thumbnail: thumb("rt-22"), type: "show" },
  { id: "rt-23", title: "Frostbite", year: 2020, rating: "R", starRating: 6.1, genre: "Horror", durationMinutes: 94, language: "English", thumbnail: thumb("rt-23"), type: "movie" },
  { id: "rt-24", title: "Sunset Boulevard Nights", year: 2016, rating: "PG-13", starRating: 9.2, genre: "Drama", durationMinutes: 137, language: "English", thumbnail: thumb("rt-24"), type: "movie" },
];

/* ------------------------------------------------------------------ */
/* Filter rail options                                                 */
/* ------------------------------------------------------------------ */

export const mockGenreOptions: GenreOption[] = [
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "documentary", label: "Documentary" },
  { id: "drama", label: "Drama" },
  { id: "fantasy", label: "Fantasy" },
  { id: "horror", label: "Horror" },
  { id: "mystery", label: "Mystery" },
  { id: "romance", label: "Romance" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "thriller", label: "Thriller" },
];

export const mockLanguageOptions: LanguageOption[] = [
  { id: "english", label: "English" },
  { id: "french", label: "French" },
  { id: "japanese", label: "Japanese" },
  { id: "korean", label: "Korean" },
  { id: "spanish", label: "Spanish" },
];

/** Bounded by the catalog's actual year span (2016–2024). */
export const mockYearRange: YearRange = { min: 2016, max: 2024 };

export const mockDurationOptions: DurationOption[] = [
  { id: "under-60", label: "Under 60 min", min: null, max: 59 },
  { id: "60-90", label: "60–90 min", min: 60, max: 90 },
  { id: "90-120", label: "90–120 min", min: 91, max: 120 },
  { id: "over-120", label: "Over 2 hours", min: 121, max: null },
];

/* ------------------------------------------------------------------ */
/* Helpers used by the page + components                              */
/* ------------------------------------------------------------------ */

export const ratingsFilterBounds = { min: 0, max: 10 } as const;

export interface RatingsFilterState {
  genres: string[];
  ratingMin: number;
  ratingMax: number;
  yearMin: number;
  yearMax: number;
  durations: string[];
  languages: string[];
}

export const defaultRatingsFilterState: RatingsFilterState = {
  genres: [],
  ratingMin: 0,
  ratingMax: 10,
  yearMin: mockYearRange.min,
  yearMax: mockYearRange.max,
  durations: [],
  languages: [],
};

/** True when nothing has been changed from the defaults. */
export function isDefaultFilterState(state: RatingsFilterState): boolean {
  return (
    state.genres.length === 0 &&
    state.ratingMin === defaultRatingsFilterState.ratingMin &&
    state.ratingMax === defaultRatingsFilterState.ratingMax &&
    state.yearMin === defaultRatingsFilterState.yearMin &&
    state.yearMax === defaultRatingsFilterState.yearMax &&
    state.durations.length === 0 &&
    state.languages.length === 0
  );
}

/**
 * Slice the catalog against the filter state. Order mirrors the sidebar so
 * the accordion count badges and the result count always agree.
 */
export function applyRatingsFilters(
  items: RatingsFilterDataItem[],
  state: RatingsFilterState
): RatingsFilterDataItem[] {
  return items.filter((item) => {
    if (state.genres.length > 0 && !state.genres.includes(item.genre)) return false;
    if (item.starRating < state.ratingMin || item.starRating > state.ratingMax) return false;
    if (item.year < state.yearMin || item.year > state.yearMax) return false;
    if (
      state.durations.length > 0 &&
      !state.durations.some((id) => {
        const option = mockDurationOptions.find((o) => o.id === id);
        if (!option) return false;
        const minOk = option.min === null || item.durationMinutes >= option.min;
        const maxOk = option.max === null || item.durationMinutes <= option.max;
        return minOk && maxOk;
      })
    ) {
      return false;
    }
    if (state.languages.length > 0 && !state.languages.includes(item.language)) return false;
    return true;
  });
}

/** Number of catalog items each sidebar section would keep, for count badges. */
export function countMatchingGenre(items: RatingsFilterDataItem[], state: RatingsFilterState, genre: string): number {
  return items.filter(
    (item) =>
      item.genre === genre &&
      item.starRating >= state.ratingMin &&
      item.starRating <= state.ratingMax &&
      item.year >= state.yearMin &&
      item.year <= state.yearMax
  ).length;
}
