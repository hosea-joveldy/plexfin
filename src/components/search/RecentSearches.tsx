import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface RecentSearchesProps {
  onClose: () => void;
}

const recentSearches = [
  "The Last Horizon",
  "Sci-Fi movies",
  "Midnight",
  "Action shows",
  "2024 releases",
];

export default function RecentSearches({ onClose }: RecentSearchesProps) {
  const navigate = useNavigate();

  const handleSearch = (search: string) => {
    navigate(`/search?q=${encodeURIComponent(search)}`);
    onClose();
  };

  return (
    <div className="mt-16 w-full max-w-2xl">
      <h3 className="text-[#999] text-sm font-medium mb-4 uppercase tracking-wider">
        Recent Searches
      </h3>
      <ul className="space-y-3">
        {recentSearches.map((search) => (
          <li key={search}>
            <button
              onClick={() => handleSearch(search)}
              className={cn(
                "w-full text-left px-4 py-3 bg-white/5 rounded-lg",
                "text-white text-lg hover:bg-white/10 transition-colors"
              )}
            >
              {search}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}