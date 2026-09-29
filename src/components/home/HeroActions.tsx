import { Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeroActionsProps {
  className?: string;
  contentId: string;
}

export default function HeroActions({ className, contentId }: HeroActionsProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      <Link to={`/content/${contentId}`} className="btn-watch-now flex items-center gap-2 px-8 py-[18px] text-button font-medium transition-all hover:bg-white/30">
        Watch Now
      </Link>
      <Link to="/my-list" className="flex items-center gap-2 px-6 py-[18px] bg-white/10 text-white text-button font-medium rounded-lg transition-all hover:bg-white/20">
        <Bookmark className="w-5 h-5" />
        My List
      </Link>

    </div>
  );
}