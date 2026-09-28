import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import SearchFlyout from "./SearchFlyout";

/**
 * App shell: fixed 80px sidebar at the left, scrollable content to
 * the right of it. The search flyout mounts at the layout level so it
 * overlays page content without being clipped by any parent's
 * overflow rules.
 */
export default function Layout() {
  const location = useLocation();
  const [isSearchOpen, setSearchOpen] = useState(false);

  // Close the flyout whenever navigation happens.
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to main content
      </a>

      <Sidebar isSearchOpen={isSearchOpen} onSearchOpenChange={setSearchOpen} />

      <SearchFlyout isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />

      <MainContent>
        <Outlet />
      </MainContent>
    </div>
  );
}
