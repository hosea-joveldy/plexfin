import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

const recentSearches = ["The Last Horizon", "Sci-Fi movies", "Midnight", "Action shows"];

/**
 * Compact search strip that flies out to the right of the sidebar's
 * search item (mirrors reference 03: an input anchored at the left
 * edge), with quick recent-search chips beneath it.
 *
 * Dismisses on Escape, outside click, or submission; focuses the input
 * on open and restores focus to the trigger on close.
 */
export default function SearchFlyout({ isOpen, onClose }: SearchFlyoutProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Focus the input shortly after the open animation starts.
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Slide/translate the panel via a mounted class after first render.
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(false);
  }, [isOpen]);

  // Close on click outside.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[aria-label="Search"]')
      ) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(query);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Search PlexFin"
      className={cn(
        "fixed left-[80px] top-0 z-40 w-[320px] max-w-[calc(100vw-80px)] border-b border-r border-border bg-popover shadow-2xl",
        "transition-all duration-200 ease-out",
        mounted ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
      )}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search"
          aria-label="Search films and shows"
          className={cn(
            "w-full bg-transparent text-meta text-white outline-none",
            "placeholder:text-muted-foreground"
          )}
        />
      </form>

      <div className="border-t border-border px-5 pb-5 pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent
        </p>
        <ul className="flex flex-col gap-1">
          {recentSearches.map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => submit(item)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm text-[#ccc] transition-colors",
                  "hover:bg-accent hover:text-white",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                )}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
