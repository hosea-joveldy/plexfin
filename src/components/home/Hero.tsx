import { cn } from "@/lib/utils";
import HeroMeta from "./HeroMeta";
import HeroActions from "./HeroActions";
import { heroContent } from "@/data/mock-hero";
import type { ContentItem } from "@/data/types";

interface HeroProps {
  className?: string;
  content?: ContentItem;
}

/**
 * Full-width hero at the top of the home page.
 * Matches the reference wireframe: min-height 780px, gradient backdrop,
 * info panel anchored bottom-left with 40px/48px padding on desktop.
 */
export default function Hero({ className, content = heroContent[0] }: HeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[780px] w-full items-end overflow-hidden bg-gradient-hero",
        className,
      )}
      aria-label="Featured content"
    >
      {/* Backdrop image, layered under the gradient so it reads as texture
          rather than a plain color fill. Falls back to the pure gradient. */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={content.backdropUrl}
          alt=""
          className="h-full w-full object-cover opacity-40"
          loading="eager"
          onError={(event) => { event.currentTarget.src = "/posters/placeholder.svg" }}
        />
        {/* Vertical scrim so the bottom-left info panel stays legible over
            the imagery, mirroring the reference gradient direction. */}
        <div className="absolute inset-0 bg-gradient-hero-scrim" />
      </div>

      {/* Info panel — anchored bottom-left, matching reference (40px 48px). */}
      <div className="relative z-10 w-full max-w-3xl px-6 py-10 sm:px-12 lg:p-[40px_48px]">
        <h1 className="text-hero-title mb-4 text-[clamp(2.25rem,6vw,4rem)]">
          {content.title}
        </h1>
        <HeroMeta content={content} />
        <HeroActions contentId={content.id} />
      </div>
    </section>
  );
}
