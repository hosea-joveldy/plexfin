import { Link } from "react-router-dom";
import { SearchX, Film } from "lucide-react";

interface SearchEmptyStateProps {
  query: string;
}

/**
 * Empty state for the search results page. Shown when a query matches
 * nothing: reassures the user it's the query (not the app) that failed,
 * and offers concrete next steps rather than a dead end.
 */
export default function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-24 text-center"
      role="status"
    >
      <div className="relative mb-8">
        <div
          className="absolute inset-0 rounded-full bg-brand/10 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <SearchX className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      <h2 className="text-heading text-white">No results for &ldquo;{query}&rdquo;</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#999]">
        Check your spelling, try a different title, or browse the catalog directly.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Browse Home
        </Link>
        <Link
          to="/ratings"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-[#ccc] transition-colors hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Film className="h-4 w-4" aria-hidden="true" />
          Filter by rating
        </Link>
      </div>
    </div>
  );
}
