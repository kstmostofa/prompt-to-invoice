import { BrandLogo } from "@/components/shared/brand-logo";
import Link from "next/link";
import type { ReactNode } from "react";

interface GuestPageProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * The signed-out pages: the wordmark, a heading, one card, and a way to the
 * other signed-out page underneath.
 */
export function GuestPage({ title, description, children, footer }: GuestPageProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="text-center">
        <Link href="/" className="inline-flex" aria-label="PromptToInvoice">
          <BrandLogo className="h-9" />
        </Link>
        <h1 className="mt-8 font-heading text-4xl font-medium tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>

      <div className="mt-10">{children}</div>

      {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
    </div>
  );
}
