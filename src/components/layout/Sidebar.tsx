import { useState } from "react";
import { Home, Search, ThumbsUp, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SidebarNavItem from "./SidebarNavItem";
import PlexFinLogo from "@/components/ui/PlexFinLogo";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  /** Whether the search flyout is open (controlled by Layout). */
  isSearchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  /** Notifies the layout when the rail's hover-expanded state changes, so main content can shift in sync. */
  onHoverChange?: (hovered: boolean) => void;
}

/**
 * Persistent navigation rail, fixed to the left edge at full height.
 * Collapsed it is an 80px icon rail; hovering expands it to 240px and
 * reveals text labels next to each icon. While the search flyout is
 * open the rail is pinned collapsed so the flyout stays flush against
 * its right edge. Icons keep the same position in both states — the
 * extra width only reveals labels to their right.
 */
export default function Sidebar({
  className,
  isSearchOpen = false,
  onSearchOpenChange,
  onHoverChange,
}: SidebarProps) {
  const location = useLocation();
  const isSearchPage = location.pathname === "/search";
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = isHovered && !isSearchOpen;

  const handleHoverChange = (hovered: boolean) => {
    setIsHovered(hovered);
    onHoverChange?.(hovered);
  };

  return (
    <nav
      aria-label="Primary"
      onMouseEnter={() => handleHoverChange(true)}
      onMouseLeave={() => handleHoverChange(false)}
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col items-start bg-sidebar pl-4",
        "transition-[width] duration-200 ease-out",
        isExpanded ? "w-[240px]" : "w-[80px]",
        className
      )}
    >
      {/* Brand mark links back home. */}
      <Link
        to="/"
        aria-label="PlexFin home"
        className="mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar hover:text-white"
      >
        <PlexFinLogo className="h-7 w-7 text-brand" aria-hidden="true" />
        <span className="sr-only">PlexFin</span>
      </Link>
      {/* Nav block anchored below the brand mark. */}
      <ul className="mt-12 flex w-full flex-col items-start gap-12">
        <SidebarNavItem icon={Home} label="Home" to="/" active={location.pathname === "/"} railExpanded={isExpanded} />
        <SidebarNavItem
          icon={Search}
          label="Search"
          active={isSearchPage || isSearchOpen}
          expanded={isSearchOpen}
          railExpanded={isExpanded}
          onClick={() => onSearchOpenChange?.(!isSearchOpen)}
        />
        <SidebarNavItem icon={ThumbsUp} label="Ratings" to="/ratings" railExpanded={isExpanded} />
        <SidebarNavItem icon={Settings} label="Settings" to="/settings" railExpanded={isExpanded} />
      </ul>
    </nav>
  );
}
