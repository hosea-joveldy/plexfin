import type { RatingsFilterState } from "@/data/mockRatings";
import { mockDurationOptions, mockYearRange, ratingsFilterBounds } from "@/data/mockRatings";

/**
 * One removable chip in the sticky FilterSummary. `key` is React-stable;
 * `kind` tells the page which slice of state to clear when the chip's ✕
 * is clicked.
 */
export interface FilterDescriptor {
  key: string;
  chip: string;
  kind: "genre" | "rating" | "year" | "duration" | "language";
  /** The exact value inside the state array this chip removes (ranges use index 0). */
  value: string;
}

/** Duration bucket id → human label, e.g. "60-90" → "60–90 min". */
function durationLabel(id: string): string {
  return mockDurationOptions.find((option) => option.id === id)?.label ?? id;
}

/**
 * Build the chip list from the current filter state, in rail order
 * (genre → rating → year → duration → language) so the summary mirrors
 * the sidebar the user just touched.
 */
export function buildFilterDescriptors(state: RatingsFilterState): FilterDescriptor[] {
  const descriptors: FilterDescriptor[] = [];

  state.genres.forEach((genre) => {
    descriptors.push({ key: `genre:${genre}`, chip: genre, kind: "genre", value: genre });
  });

  if (state.ratingMin > ratingsFilterBounds.min || state.ratingMax < ratingsFilterBounds.max) {
    descriptors.push({
      key: "rating:range",
      chip: `${state.ratingMin.toFixed(1)}–${state.ratingMax.toFixed(1)} stars`,
      kind: "rating",
      value: "range",
    });
  }

  if (state.yearMin !== mockYearRange.min || state.yearMax !== mockYearRange.max) {
    descriptors.push({
      key: "year:range",
      chip: state.yearMin === state.yearMax ? String(state.yearMin) : `${state.yearMin}–${state.yearMax}`,
      kind: "year",
      value: "range",
    });
  }

  state.durations.forEach((id) => {
    descriptors.push({ key: `duration:${id}`, chip: durationLabel(id), kind: "duration", value: id });
  });

  state.languages.forEach((language) => {
    descriptors.push({ key: `language:${language}`, chip: language, kind: "language", value: language });
  });

  return descriptors;
}
