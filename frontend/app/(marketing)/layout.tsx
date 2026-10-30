import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { PLATFORM_NAME, SUPPORT_EMAIL } from "@/lib/site";
import { auth } from "@/auth";
import Link from "next/link";

/** The public site: landing page, pricing and legal pages. */
export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label={PLATFORM_NAME}>
            <BrandLogo className="h-6" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" render={<Link href="/#how-it-works" />}>
              How it works
            </Button>
            <Button variant="ghost" className="hidden sm:inline-flex" render={<Link href="/#pricing" />}>
              Pricing
            </Button>
            {session ? (
              <Button render={<Link href="/dashboard" />}>Open app</Button>
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button render={<Link href="/register" />}>Start free</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-6" />
            <span>
              © {new Date().getFullYear()} {PLATFORM_NAME}
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/#pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">
              {SUPPORT_EMAIL}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
