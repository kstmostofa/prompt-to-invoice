import "flag-icons/css/flag-icons.min.css";

import { cn } from "@/lib/utils";

/**
 * A country flag as a small rounded chip. Draws on the `flag-icons` SVG set
 * through its CSS classes, so only the flags actually shown are fetched.
 */
export function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "fi inline-block h-4 w-[1.333em] shrink-0 rounded-[3px] bg-muted ring-1 ring-black/10 dark:ring-white/10",
        `fi-${code.toLowerCase()}`,
        className,
      )}
    />
  );
}
