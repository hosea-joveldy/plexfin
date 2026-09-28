import type { FilterDescriptor } from "./filterSummary";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSummaryProps {
  descriptors: FilterDescriptor[];
  resultCount: number;
  totalCount: number;
  onRemove: (descriptor: FilterDescriptor) => void;
  onReset: () => void;
  /** Below lg the rail is a drawer; this button re-opens it. */
  onOpenFilters: () => void;
  className?: string;
}

/**
 * Sticky summary strip between the filter rail and the results grid:
 * removable chips for every active filter, a live result count, and
 * always-visible Reset/Apply actions so the controls never scroll away.
 */
export function FilterSummary({
  descriptors,
  resultCount,
  totalCount,
  onRemove,
  onReset,
  onOpenFilters,
  className,
}: FilterSummaryProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b border-white/10 bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 lg:px-8">
        {/* Count doubles as the mobile drawer trigger. */}
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Open filters"
          className="shrink-0 text-sm font-medium tabular-nums text-white underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:cursor-default lg:pointer-events-none lg:no-underline"
        >
          {resultCount} of {totalCount} titles
        </button>

        {descriptors.length > 0 ? (
          <>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="sr-only">Active filters:</span>
              {descriptors.map((descriptor) => (
                <button
                  key={descriptor.key}
                  type="button"
                  onClick={() => onRemove(descriptor)}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/8 py-1 pl-3 pr-1.5 text-xs font-medium text-white outline-none transition-colors",
                    "hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  aria-label={`Remove filter: ${descriptor.chip}`}
                >
                  <span className="truncate">{descriptor.chip}</span>
                  <X className="h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onReset}
              className="ml-auto shrink-0 text-sm font-medium text-[#999] outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Reset all
            </button>
          </>
        ) : (
          <p className="min-w-0 flex-1 truncate text-xs text-[#999]">
            No filters applied — showing everything.
          </p>
        )}
      </div>
    </div>
  );
}

export default FilterSummary;
