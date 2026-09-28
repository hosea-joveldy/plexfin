import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import FilterSidebar from "@/components/ratings/FilterSidebar";
import FilterSummary from "@/components/ratings/FilterSummary";
import {
  buildFilterDescriptors,
  type FilterDescriptor,
} from "@/components/ratings/filterSummary";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import {
  applyRatingsFilters,
  defaultRatingsFilterState,
  mockRatingsCatalog,
  type RatingsFilterState,
} from "@/data/mockRatings";

/**
 * Ratings filter page (/ratings).
 *
 * Two-column layout: a 280px filter rail on the left (accordion sections
 * for genre, rating range, release year, duration, language) and a results
 * grid on the right mirroring the search results page. A sticky summary
 * strip carries removable chips for every active filter plus a live count.
 *
 * Filters apply live as they change; on mobile the rail becomes a drawer
 * and the Apply button simply closes it.
 */
export default function RatingsFilter() {
  const [filters, setFilters] = useState<RatingsFilterState>(defaultRatingsFilterState);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const results = useMemo(() => applyRatingsFilters(mockRatingsCatalog, filters), [filters]);
  const descriptors = useMemo(() => buildFilterDescriptors(filters), [filters]);

  const handleRemove = (descriptor: FilterDescriptor) => {
    setFilters((current) => {
      switch (descriptor.kind) {
        case "genre":
          return { ...current, genres: current.genres.filter((g) => g !== descriptor.value) };
        case "rating":
          return { ...current, ratingMin: defaultRatingsFilterState.ratingMin, ratingMax: defaultRatingsFilterState.ratingMax };
        case "year":
          return { ...current, yearMin: defaultRatingsFilterState.yearMin, yearMax: defaultRatingsFilterState.yearMax };
        case "duration":
          return { ...current, durations: current.durations.filter((d) => d !== descriptor.value) };
        case "language":
          return { ...current, languages: current.languages.filter((l) => l !== descriptor.value) };
      }
    });
  };

  const handleReset = () => setFilters({ ...defaultRatingsFilterState });

  return (
    <div className="flex min-h-screen">
      {/* Desktop rail — full-height column next to the grid. */}
      <aside
        className={cn(
          "hidden lg:block shrink-0 border-r border-white/10",
          drawerOpen && "pointer-events-none opacity-0"
        )}
      >
        <div className="sticky top-0 flex h-screen flex-col">
          <FilterSidebar
            state={filters}
            onChange={setFilters}
            onApply={() => {}}
          />
        </div>
      </aside>

      {/* Mobile drawer + backdrop */}
      <div
        hidden={!drawerOpen}
        className="fixed inset-0 z-40 lg:hidden"
      >
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl"
        >
          <FilterSidebar
            state={filters}
            onChange={setFilters}
            onApply={() => setDrawerOpen(false)}
          />
        </div>
      </div>

      {/* Results column */}
      <div className="min-w-0 flex-1">
        <FilterSummary
          descriptors={descriptors}
          resultCount={results.length}
          totalCount={mockRatingsCatalog.length}
          onRemove={handleRemove}
          onReset={handleReset}
          onOpenFilters={() => setDrawerOpen(true)}
        />

        <section className="px-5 py-8 lg:px-8" aria-label="Filtered results">
          <header className="mb-8">
            <h1 className="text-2xl font-medium text-white">Browse by rating</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#999]">
              Slice the catalog by star score, then narrow it down with genre,
              year, duration, and language.
            </p>
          </header>

          {results.length > 0 ? (
            <SearchResultsGrid
              items={results.map((item) => ({
                id: item.id,
                title: item.title,
                year: item.year,
                rating: item.rating,
                genre: item.genre,
                duration: item.type === "show" ? "Series" : `${item.durationMinutes} min`,
                thumbnail: item.thumbnail,
                type: item.type,
              }))}
            />
          ) : (
            <div className="mt-4">
              <SearchEmptyState query="this filter combination" />
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      </div>
  );
}
