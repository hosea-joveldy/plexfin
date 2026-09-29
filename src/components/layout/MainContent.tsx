import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: ReactNode;
  /** When the sidebar rail is hover-expanded, shift right to keep clear of it. */
  sidebarExpanded?: boolean;
  className?: string;
}

/**
 * Scrollable content area to the right of the fixed sidebar rail.
 * Rendered as the scroll container so the sidebar stays put while
 * page content moves underneath it. Shifts right in sync with the
 * sidebar's hover-expansion.
 */
export default function MainContent({ children, sidebarExpanded = false, className }: MainContentProps) {
  return (
    <main
      id="main-content"
      className={cn(
        "min-h-screen flex-1 overflow-x-hidden bg-background",
        "transition-[margin] duration-200 ease-out",
        sidebarExpanded ? "ml-[240px]" : "ml-[80px]",
        className
      )}
    >
      {children}
    </main>
  );
}
