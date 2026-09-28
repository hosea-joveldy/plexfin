import { Home, Search, ThumbsUp, Settings, Film } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SidebarNavItem from "./SidebarNavItem";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  /** Whether the search flyout is open (controlled by Layout). */
  isSearchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
}

/**
 * Persistent 80px navigation rail, fixed to the left edge at full height.
 * Matches the reference wireframes: #0d0d0d surface, icon-only items with
 * #ccc default / #fff active color, 48px vertical gap between items.
 */
export default function Sidebar({
  className,
  isSearchOpen = false,
  onSearchOpenChange,
}: SidebarProps) {
  const location = useLocation();
  const isSearchPage = location.pathname === "/search";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen w-[80px] flex-col items-center bg-sidebar",
        className
      )}
    >
      {/* Brand mark links back home. */}
      <Link
        to="/"
        aria-label="PlexFin home"
        className="mt-5 flex h-12 w-12 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar hover:text-white"
      >
        <Film className="h-7 w-7 text-brand" aria-hidden="true" />
        <span className="sr-only">PlexFin</span>
      </Link>

      {/* Nav block anchored below the brand mark. */}
      <ul className="mt-12 flex w-full flex-col items-center gap-12">
        <SidebarNavItem icon={Home} label="Home" to="/" active={location.pathname === "/"} />
        <SidebarNavItem
          icon={Search}
          label="Search"
          active={isSearchPage || isSearchOpen}
          expanded={isSearchOpen}
          onClick={() => onSearchOpenChange?.(!isSearchOpen)}
        />
        <SidebarNavItem icon={ThumbsUp} label="Ratings" to="/ratings" />
        <SidebarNavItem icon={Settings} label="Settings" to="/settings" />
      </ul>
    </nav>
  );
}
