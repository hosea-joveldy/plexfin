import type { FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import FilterAccordion from "./FilterAccordion";
import {
  mockDurationOptions,
  mockGenreOptions,
  mockLanguageOptions,
  mockYearRange,
  ratingsFilterBounds,
  defaultRatingsFilterState,
  isDefaultFilterState,
  type RatingsFilterState,
} from "@/data/mockRatings";

interface FilterSidebarProps {
  state: RatingsFilterState;
  onChange: (state: RatingsFilterState) => void;
  /** Render-apply mode: the page applies filters live; Apply just closes the drawer on mobile. */
  onApply: () => void;
  className?: string;
}

const chipClass = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active
      ? "bg-brand text-[#1a1626]"
      : "bg-white/5 text-[#ccc] hover:bg-white/10 hover:text-white"
  );

const checkClass = (checked: boolean) =>
  cn(
    "mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    checked ? "border-brand bg-brand" : "border-white/25 bg-transparent"
  );

const checkMarkClass = (checked: boolean) =>
  cn("flex h-4 w-4 items-center justify-center", checked ? "text-[#1a1626]" : "sr-only");

/** Track highlight for a double-thumb range slider (two overlapping native inputs). */
const rangeFill = (min: number, max: number, lo: number, hi: number) => ({
  background: `linear-gradient(to right, transparent ${(lo - min) / (max - min) * 100}%, #e8a940 ${(lo - min) / (max - min) * 100}%, #e8a940 ${(hi - min) / (max - min) * 100}%, transparent ${(hi - min) / (max - min) * 100}%)`,
});

/**
 * 280px filter rail for the ratings page. Sections are `FilterAccordion`s;
 * every control mutates the shared RatingsFilterState via onChange.
 *
 * Full-bleed column on desktop; slides over from the left as a drawer
 * below lg (driven by the open prop, backdrop rendered by the page).
 */
export function FilterSidebar({
  state,
  onChange,
  onApply,
  className,
}: FilterSidebarProps) {
  const isDefault = isDefaultFilterState(state);

  const toggle = <K extends "genres" | "durations" | "languages">(
    key: K,
    value: string
  ) => {
    const list = state[key];
    onChange({
      ...state,
      [key]: list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    });
  };

  const handleReset = () => onChange({ ...defaultRatingsFilterState });

  // The rail is one form so Enter applies rather than navigating.
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filter catalog"
      className={cn("flex h-full w-[280px] flex-col bg-[#0d0d0d]", className)}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4 pt-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
          <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden="true" />
          Filters
        </h2>

        {/* Genre — multi-select chips */}
        <FilterAccordion title="Genre" activeCount={state.genres.length}>
          <div className="flex flex-wrap gap-2">
            {mockGenreOptions.map((genre) => {
              const active = state.genres.includes(genre.label);
              return (
                <button
                  key={genre.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle("genres", genre.label)}
                  className={chipClass(active)}
                >
                  {genre.label}
                </button>
              );
            })}
          </div>
        </FilterAccordion>

        {/* Rating range — dual-thumb slider over 0–10 */}
        <FilterAccordion
          title="Rating Range"
          activeCount={state.ratingMin > 0 || state.ratingMax < 10 ? 1 : 0}
          defaultOpen
          hint="Filter by star score out of 10."
        >
          <div className="relative mb-1 h-1.5 rounded-full bg-white/10">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={rangeFill(ratingsFilterBounds.min, ratingsFilterBounds.max, state.ratingMin, state.ratingMax)}
            />
          </div>
          {/* Both thumbs share one track (visually hidden inputs stacked). */}
          <div className="relative h-0">
            <input
              type="range"
              min={ratingsFilterBounds.min}
              max={ratingsFilterBounds.max}
              step={0.5}
              value={state.ratingMin}
              onChange={(e) =>
                onChange({
                  ...state,
                  ratingMin: Math.min(Number(e.target.value), state.ratingMax),
                })
              }
              aria-label="Minimum rating"
              className="pointer-events-none absolute -top-[7px] left-0 w-full appearance-none bg-transparent focus-visible:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-background [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-background"
            />
            <input
              type="range"
              min={ratingsFilterBounds.min}
              max={ratingsFilterBounds.max}
              step={0.5}
              value={state.ratingMax}
              onChange={(e) =>
                onChange({
                  ...state,
                  ratingMax: Math.max(Number(e.target.value), state.ratingMin),
                })
              }
              aria-label="Maximum rating"
              className="pointer-events-none absolute -top-[7px] left-0 w-full appearance-none bg-transparent focus-visible:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-background [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-background"
            />
          </div>
          <p className="mt-4 text-center text-sm font-medium tabular-nums text-white">
            {state.ratingMin.toFixed(1)} – {state.ratingMax.toFixed(1)}
          </p>
        </FilterAccordion>

        {/* Release year — bounded numeric range */}
        <FilterAccordion
          title="Release Year"
          activeCount={state.yearMin !== mockYearRange.min || state.yearMax !== mockYearRange.max ? 1 : 0}
        >
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3 text-xs text-[#999]">
              From
              <input
                type="number"
                inputMode="numeric"
                min={mockYearRange.min}
                max={state.yearMax}
                value={state.yearMin}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isNaN(next)) {
                    onChange({ ...state, yearMin: Math.max(mockYearRange.min, Math.min(next, state.yearMax)) });
                  }
                }}
                className="w-20 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-center text-sm font-medium text-white outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-[#999]">
              To
              <input
                type="number"
                inputMode="numeric"
                min={state.yearMin}
                max={mockYearRange.max}
                value={state.yearMax}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (!Number.isNaN(next)) {
                    onChange({ ...state, yearMax: Math.min(mockYearRange.max, Math.max(next, state.yearMin)) });
                  }
                }}
                className="w-20 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-center text-sm font-medium text-white outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
          </div>
        </FilterAccordion>

        {/* Duration — single-choice buckets rendered as a radio group */}
        <FilterAccordion title="Duration" activeCount={state.durations.length > 0 ? 1 : 0}>
          <fieldset className="space-y-1">
            <legend className="sr-only">Duration</legend>
            <button
              key="duration-all"
              type="button"
              role="radio"
              aria-checked={state.durations.length === 0}
              onClick={() => onChange({ ...state, durations: [] })}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
            >
              <span className={checkMarkClass(state.durations.length === 0)} aria-hidden="true">●</span>
              <span className={cn("text-sm", state.durations.length === 0 ? "text-white" : "text-[#ccc]")}>Any duration</span>
            </button>
            {mockDurationOptions.map((option) => {
              const checked = state.durations.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onChange({ ...state, durations: [option.id] })}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                >
                  <span className={checkMarkClass(checked)} aria-hidden="true">●</span>
                  <span className={cn("text-sm", checked ? "text-white" : "text-[#ccc]")}>{option.label}</span>
                </button>
              );
            })}
          </fieldset>
        </FilterAccordion>

        {/* Language — multi-select checkbox list */}
        <FilterAccordion title="Language" activeCount={state.languages.length}>
          <div className="space-y-1">
            {mockLanguageOptions.map((language) => {
              const checked = state.languages.includes(language.label);
              return (
                <label
                  key={language.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 outline-none hover:bg-white/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-brand"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle("languages", language.label)}
                    className="sr-only"
                  />
                  <span className={checkClass(checked)} aria-hidden="true">
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 p-[3px]">
                      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className={cn("text-sm", checked ? "text-white" : "text-[#ccc]")}>{language.label}</span>
                </label>
              );
            })}
          </div>
        </FilterAccordion>
      </div>

      {/* Pinned action bar — Reset clears everything, Apply closes the mobile drawer. */}
      <div className="flex gap-3 border-t border-white/10 px-5 py-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={isDefault}
          className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Reset
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-[#1a1626] outline-none transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Apply
        </button>
      </div>
    </form>
  );
}

export default FilterSidebar;
