import { useEffect } from "react";
import { X } from "lucide-react";
import SearchInput from "./SearchInput";
import RecentSearches from "./RecentSearches";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] bg-[#141414]/90 backdrop-blur-sm",
        "flex flex-col items-center justify-center p-8"
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="absolute top-8 right-8">
        <button
          onClick={onClose}
          className="p-2 text-[#999] hover:text-white transition-colors"
          aria-label="Close search"
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      <div className="w-full max-w-4xl">
        <SearchInput />
        <RecentSearches onClose={onClose} />
      </div>
    </div>
  );
}