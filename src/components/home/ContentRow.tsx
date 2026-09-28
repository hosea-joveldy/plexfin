import { cn } from "@/lib/utils";
import ContentCard from "./ContentCard";
import type { ContentItem } from "@/data/types";

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  className?: string;
  showProgress?: boolean;
}

export default function ContentRow({
  title,
  items,
  className,
  showProgress = false,
}: ContentRowProps) {
  return (
    <section className={cn("py-8 px-[48px]", className)}>
      <h2 className="text-section-title mb-6">{title}</h2>
      <div
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        role="region"
        aria-label={`${title} content row`}
      >
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            showProgress={showProgress}
          />
        ))}
      </div>
    </section>
  );
}