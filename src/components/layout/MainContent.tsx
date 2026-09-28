import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scrollable content area to the right of the fixed 80px sidebar.
 * Rendered as the scroll container so the sidebar stays put while
 * page content moves underneath it.
 */
export default function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      id="main-content"
      className={cn("ml-[80px] min-h-screen flex-1 overflow-x-hidden bg-background", className)}
    >
      {children}
    </main>
  );
}
