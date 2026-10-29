import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** `full` is the wordmark with the mark; `mark` is the glyph alone. */
  variant?: "full" | "mark";
  className?: string;
}

/**
 * The platform logo, from `public/brand/`. Both files are drawn in indigo, so
 * one asset each serves light and dark surfaces alike.
 */
export function BrandLogo({ variant = "full", className }: BrandLogoProps) {
  const mark = variant === "mark";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mark ? "/brand/mark.svg" : "/brand/logo.svg"}
      alt="PromptToInvoice"
      width={mark ? 84 : 470}
      height={84}
      className={cn(mark ? "h-8 w-auto" : "h-6 w-auto", className)}
    />
  );
}
