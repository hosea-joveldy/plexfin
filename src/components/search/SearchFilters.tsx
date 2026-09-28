import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  activeFilter: "all" | "movies" | "shows";
  onFilterChange: (filter: "all" | "movies" | "shows") => void;
  sortBy: "relevance" | "rating" | "date" | "az";
  onSortChange: (sort: "relevance" | "rating" | "date" | "az") => void;
  className?: string;
}

const filters = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "shows", label: "Shows" },
] as const;

const sortOptions = [
  { id: "relevance", label: "Relevance" },
  { id: "rating", label: "Rating" },
  { id: "date", label: "Release Date" },
  { id: "az", label: "A-Z" },
] as const;

export default function SearchFilters({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  className,
}: SearchFiltersProps) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="flex gap-2" role="tablist" aria-label="Content type filters">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            role="tab"
            aria-selected={activeFilter === filter.id}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              activeFilter === filter.id
                ? "bg-white/10 text-white"
                : "bg-white/5 text-[#ccc] hover:bg-white/10 hover:text-white"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-[#999]">
            Sort by:
          </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
          className={cn(
            "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
            "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.6rem_center] pr-8 bg-no-repeat",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          )}
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        </div>
      </div>
    </div>
  );
}
