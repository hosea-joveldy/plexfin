import { useEffect, useState, type FormEvent } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface SearchInputProps {
  /**
   * "overlay" — the large hero input inside the full-screen search overlay.
   * "inline"  — compact bordered bar rendered at the top of the results page.
   */
  variant?: "overlay" | "inline";
}

/**
 * Shared search input. Reads the current `?q=` param so the value survives
 * navigation (e.g. arriving on /search?q=... from the flyout or overlay),
 * and navigates to /search?q=... on submit.
 */
export default function SearchInput({ variant = "overlay" }: SearchInputProps) {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const navigate = useNavigate();

  // Keep the field in sync when the URL query changes (new search, clear).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  const handleClear = () => {
    setQuery("");
    navigate("/search");
  };

  if (variant === "inline") {
    return (
      <form
        onSubmit={handleSubmit}
        role="search"
        className="flex w-full max-w-2xl items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors focus-within:border-brand/70 focus-within:bg-white/10"
      >
        <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, shows..."
          aria-label="Search films and shows"
          className="w-full bg-transparent text-lg text-white placeholder-[#999] outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="shrink-0 rounded p-1 text-[#999] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="mx-auto flex w-full max-w-3xl items-center gap-4"
    >
      <SearchIcon className="h-8 w-8 shrink-0 text-[#999]" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies, shows..."
        aria-label="Search films and shows"
        autoFocus
        className="w-full bg-transparent text-[48px] text-white placeholder-[#999] outline-none"
      />
    </form>
  );
}
