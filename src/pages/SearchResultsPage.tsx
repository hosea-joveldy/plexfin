import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchInput from "@/components/search/SearchInput";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import SearchFilters from "@/components/search/SearchFilters";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import { mockSearchResults } from "@/data/mockSearchResults";

type TypeFilter = "all" | "movies" | "shows";
type SortOption = "relevance" | "rating" | "date" | "az";

/**
 * Search results page (/search?q=...).
 *
 * Structure follows the reference wireframe: the query is the page's
 * anchor — an h1 sitting above the grid — with the inline search bar in
 * a sticky bar on top so it stays reachable while scrolling. The result
 * count appears exactly once (next to the title) and is aria-live so
 * filter/sort changes are announced.
 *
 * Results derive from the URL query param, so the flyout, overlay, and
 * direct links all land on the same page. With no `?q=` the page doubles
 * as a browsable catalog view.
 */
export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [activeFilter, setActiveFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    // Mock filtering: match title, genre, or year. Replace with a real
    // search API call once the backend phase begins.
    const matched = normalized
      ? mockSearchResults.filter((item) =>
          [item.title, item.genre, String(item.year)]
            .join(" ")
            .toLowerCase()
            .includes(normalized)
        )
      : mockSearchResults;

    const byType = matched.filter((item) => {
      if (activeFilter === "movies") return item.type === "movie";
      if (activeFilter === "shows") return item.type === "show";
      return true;
    });

    const sorted = [...byType];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => a.rating.localeCompare(b.rating));
        break;
      case "date":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "az":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break; // relevance: keep mock order
    }
    return sorted;
  }, [query, activeFilter, sortBy]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky search bar — the only element in the header; the query
          lives below as the page title, per the reference wireframe. */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/95 px-6 py-5 backdrop-blur md:px-12">
        <div className="max-w-2xl">
          <SearchInput variant="inline" />
        </div>
      </header>

      <div className="flex-1 px-6 py-10 md:px-12">
        {hasQuery && !hasResults ? (
          <SearchEmptyState query={query.trim()} />
        ) : (
          <>
            {/* Page anchor: query + the single, live result count. */}
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h1 className="min-w-0 text-[28px] font-normal leading-tight text-white">
                {hasQuery ? (
                  <>
                    Results for &ldquo;
                    <span className="break-words">{query.trim()}</span>
                    &rdquo;
                  </>
                ) : (
                  "Browse the catalog"
                )}
              </h1>
              <p className="text-sm text-[#999]" aria-live="polite">
                {results.length} {results.length === 1 ? "title" : "titles"}
              </p>
            </div>

            <SearchFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              className="mb-6"
            />

            <SearchResultsGrid items={results} />
          </>
        )}
      </div>
    </div>
  );
}
