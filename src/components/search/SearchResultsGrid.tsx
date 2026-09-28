import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { SearchResultItem } from "@/data/mockSearchResults";

interface SearchResultsGridProps {
  items: SearchResultItem[];
  className?: string;
}

/**
 * Responsive poster grid for search results: 2 cols mobile → 4 tablet → 6
 * desktop, matching the reference wireframe's six-column desktop layout.
 * Card treatment mirrors ContentCard on Home (hover lift + gradient scrim).
 */
export default function SearchResultsGrid({ items, className }: SearchResultsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 xl:grid-cols-6",
        className
      )}
      role="list"
      aria-label="Search results"
    >
      {items.map((item) => {
        const meta = [String(item.year), item.rating, item.genre].join(" · ");
        return (
          <article key={item.id} className="group">
            <Link
              to={`/content/${item.id}`}
              className="block outline-none"
              aria-label={`${item.title}, ${meta}`}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-[4px] bg-gradient-card transition-transform duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
                <img
                  src={item.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />

                {/* Type badge (movie/show) */}
                <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                  {item.type === "movie" ? "Movie" : "Show"}
                </span>

                {/* Hover overlay: scrim + title + metadata */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <p className="text-[15px] font-medium leading-tight text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/75">{meta}</p>
                </div>
              </div>

              {/* Persistent metadata below the poster */}
              <h3 className="mt-2 text-sm font-medium text-white transition-colors group-hover:text-brand group-focus-visible:text-brand">
                {item.title}
              </h3>
              <p className="text-xs text-[#999]">{meta}</p>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
