import { cn } from "@/lib/utils";

interface PlexFinLogoProps {
  className?: string;
}

/**
 * PlexFin brand mark: rounded dark tile with an amber play triangle and
 * an olive-green accent. Inlined from assets/plexfin-icon.svg.
 */
export default function PlexFinLogo({ className }: PlexFinLogoProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PlexFin logo"
      className={cn("h-7 w-7", className)}
    >
      <rect x="0" y="0" width="160" height="160" rx="32" fill="#1a1626" />
      <polygon points="50,40 130,80 50,120" fill="#e8a940" />
      <polygon points="130,80 160,60 160,100" fill="#4a5940" />
    </svg>
  );
}
