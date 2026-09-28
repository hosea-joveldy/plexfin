import { cn } from "@/lib/utils";
import { mockHero } from "@/data/mockHero";

interface HeroMetaProps {
  className?: string;
}

/** Year / rating / genre / duration strip under the hero title. */
export default function HeroMeta({ className }: HeroMetaProps) {
  const metaItems = [
    mockHero.year.toString(),
    mockHero.rating,
    mockHero.genre,
    mockHero.duration,
  ];

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
