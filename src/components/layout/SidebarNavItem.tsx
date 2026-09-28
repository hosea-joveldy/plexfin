import { forwardRef, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  /** Icon component from lucide-react. */
  icon: ComponentType<{ className?: string }>;
  /** Accessible name; also shown as a tooltip on hover/focus. */
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
  className?: string;
}

/**
 * A single 48px square navigation item for the PlexFin sidebar.
 *
 * Renders an active indicator bar on the left edge, a tooltip on
 * hover/keyboard-focus, and visible focus rings. When `to` is omitted
 * it renders as a plain button (used by the search flyout trigger).
 */
const SidebarNavItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, SidebarNavItemProps>(
  function SidebarNavItem({ icon: Icon, label, to, active, expanded, onClick, className, children }, ref) {
    const location = useLocation();
    const isActive = active ?? (to ? location.pathname === to : false);

    const sharedClasses = cn(
      // 48px square hit target, centered icon.
      "relative flex h-12 w-12 items-center justify-center rounded-md",
      "transition-colors duration-200 outline-none",
      "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
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
        <Icon className="h-6 w-6" aria-hidden="true" />
        {/* Tooltip: appears on hover and keyboard focus. */}
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5",
            "text-xs font-medium text-popover-foreground shadow-lg border border-border",
            "opacity-0 -translate-x-1 transition-all duration-150",
            "group-hover:opacity-100 group-hover:translate-x-0",
            "group-focus-within:opacity-100 group-focus-within:translate-x-0"
          )}
        >
          {label}
        </span>
      </>
    );

    return (
      <li className="group relative flex items-center">
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
