import { cn } from "@/lib/utils";
import type { ContentItem } from "@/data/types";

interface HeroMetaProps {
  className?: string;
  content: ContentItem;
}

/** Year / rating / genre / duration strip under the hero title. */
export default function HeroMeta({ className, content }: HeroMetaProps) {
  const metaItems = [
    String(content.year),
    content.rating,
    content.genres[0],
    content.durationMinutes ? `${content.durationMinutes} min` : null,
  ].filter(Boolean) as string[];

  return (
    <ul
      className={cn(
        "flex flex-wrap gap-x-6 gap-y-2 text-[#ccc] text-meta mb-8",
        className,
      )}
      aria-label="Content metadata"
    >
      {metaItems.map((item, index) => (
        <li key={index} className="flex items-center gap-6">
          {item}
          {index < metaItems.length - 1 && (
            <span aria-hidden="true" className="text-[#666]">
              ·
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
