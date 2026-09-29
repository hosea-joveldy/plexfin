import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/data/types";

interface ContentCardProps {
  item: ContentItem;
  className?: string;
  /** Render the watch-progress bar for "Continue Watching" style rows. */
  showProgress?: boolean;
}

/**
 * Portrait (2:3) content card used inside ContentRow.
 * Thumbnail with a hover title overlay, persistent metadata below,
 * and an optional gold watch-progress bar along the bottom edge.
 */
export default function ContentCard({
  item,
  className,
  showProgress = false,
}: ContentCardProps) {
  const meta = [String(item.year), item.rating, item.genres[0]]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/content/${item.id}`}
      className={cn("group block w-[200px] flex-shrink-0 outline-none", className)}
      aria-label={`${item.title}, ${meta}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[4px] bg-gradient-card transition-transform duration-200 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
        <img
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => { event.currentTarget.src = "/posters/placeholder.svg" }}
        />

        {/* Hover overlay: scrim + title + metadata */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <p className="text-[15px] font-medium leading-tight text-white">
            {item.title}
          </p>
          <p className="mt-1 truncate text-xs text-white/75">{meta}</p>
        </div>

        {/* Play affordance */}
        <div
          aria-hidden="true"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 scale-50 items-center justify-center rounded-full bg-white/15 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* Watch progress — always visible when present */}
        {showProgress && item.progressPercent !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div
              className="h-full bg-brand"
              style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Metadata below the card — readable without hover */}
      <div className="pt-2">
        <h3 className="truncate text-sm font-medium text-white transition-colors group-hover:text-brand group-focus-visible:text-brand">
          {item.title}
        </h3>
        {showProgress && item.progressPercent !== undefined ? (
          <p className="mt-0.5 text-xs tabular-nums text-brand">
            {item.progressPercent}% watched
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
        )}
      </div>
    </Link>
  );
}