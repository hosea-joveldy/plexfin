import { forwardRef, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  /** Icon component from lucide-react. */
  icon: ComponentType<{ className?: string }>;
  /** Accessible name; also rendered as the inline text label when the rail is expanded. */
  label: string;
  /** Destination path. When omitted, the item renders as a plain button (e.g. the search flyout trigger). */
  to?: string;
  /** Highlights the item as the current page. */
  active?: boolean;
  /** Rendered inside the item instead of a router link (e.g. the flyout trigger button). */
  children?: ReactNode;
  onClick?: () => void;
  /** For button-only items (the search trigger): whether its flyout is open. */
  expanded?: boolean;
  /** Whether the rail itself is hover-expanded; reveals the inline label. */
  railExpanded?: boolean;
  className?: string;
}

/**
 * A single navigation item for the PlexFin sidebar rail.
 *
 * The icon stays anchored at the rail's collapsed position; when the
 * rail expands to 240px the text label is revealed beside it. The
 * label brightens on item hover/focus and renders only when expanded
 * (screen-reader users get the accessible name regardless).
 */
const SidebarNavItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, SidebarNavItemProps>(
  function SidebarNavItem({ icon: Icon, label, to, active, expanded, railExpanded, onClick, className, children }, ref) {
    const location = useLocation();
    const isActive = active ?? (to ? location.pathname === to : false);
    const sharedClasses = cn(
      "group/item relative flex h-12 items-center rounded-md",
      "transition-[width] duration-200 ease-out outline-none",
      "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
      railExpanded ? "w-[200px]" : "w-12",
      isActive ? "text-white" : "text-[#ccc] hover:text-white",
      className
    );
    const inner = (
      <>
        {/* Active indicator bar on the left edge of the item. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute -left-[14px] top-1/2 -translate-y-1/2 rounded-full bg-brand transition-all duration-200",
            isActive ? "h-7 w-[3px] opacity-100" : "h-0 w-[3px] opacity-0"
          )}
        />
        {/* Icon pinned at the collapsed 48px position so it does not move when the rail expands. */}
        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        {/* Inline text label, revealed when the rail expands (or on item hover/focus while collapsed). */}
        <span
          className={cn(
            "pointer-events-none absolute left-[52px] whitespace-nowrap text-sm font-medium",
            "transition-opacity duration-150",
            railExpanded
              ? "opacity-100"
              : "opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100",
            isActive ? "text-white" : "text-[#ccc] group-hover/item:text-white"
          )}
          aria-hidden="true"
        >
          {label}
        </span>
      </>
    );

    return (
      <li className={cn("relative flex items-center", !to && "group/nav")}>
        {to ? (
          <Link
            ref={ref as React.Ref<HTMLAnchorElement>}
            to={to}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={sharedClasses}
            onClick={onClick}
          >
            {children ?? inner}
          </Link>
        ) : (
          <button
            ref={ref as React.Ref<HTMLButtonElement>}
            type="button"
            aria-label={label}
            aria-expanded={expanded}
            className={sharedClasses}
            onClick={onClick}
          >
            {children ?? inner}
          </button>
        )}
      </li>
    );
  }
);

export default SidebarNavItem;
