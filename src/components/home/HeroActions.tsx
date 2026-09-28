import { Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroActionsProps {
  className?: string;
}

export default function HeroActions({ className }: HeroActionsProps) {
  return (
    <div className={cn("flex gap-4", className)}>
      <button className="btn-watch-now flex items-center gap-2 px-8 py-[18px] text-button font-medium transition-all hover:bg-white/30">
        Watch Now
      </button>
      <button className="flex items-center gap-2 px-6 py-[18px] bg-white/10 text-white text-button font-medium rounded-lg transition-all hover:bg-white/20">
        <Plus className="w-5 h-5" />
        My List
      </button>
      <button className="flex items-center gap-2 px-6 py-[18px] bg-white/10 text-white text-button font-medium rounded-lg transition-all hover:bg-white/20">
        <Star className="w-5 h-5" />
        Rate
      </button>
    </div>
  );
}