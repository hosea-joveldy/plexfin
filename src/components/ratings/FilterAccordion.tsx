import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterAccordionProps {
  title: string;
  /** Optional one-line hint shown under the title while open. */
  hint?: string;
  /** Active-filter count shown as a gold badge; hidden when 0. */
  activeCount?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Collapsible section of the filter rail. Stays mounted while collapsed
 * (via the hidden attribute) so partial selections survive toggling.
 */
export function FilterAccordion({
  title,
  hint,
  activeCount = 0,
  defaultOpen = false,
  children,
}: FilterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-white/10">
      <h3>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="group flex w-full items-center justify-between gap-3 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{title}</span>
            {activeCount > 0 && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold leading-none text-brand">
                {activeCount}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-[#999] transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </h3>

      <div hidden={!isOpen}>
        <div className="pb-5">
          {hint && <p className="mb-3 text-xs leading-relaxed text-[#999]">{hint}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export default FilterAccordion;
