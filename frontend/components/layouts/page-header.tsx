import Icon from "@/components/shared/icon";
import type { IconSvgElement } from "@hugeicons/react";
import ThemeSwitcher from "@/components/shared/theme-switcher";
import { cn } from "@/lib/utils";
import { BreadcrumbItem } from "@/types/global";
import { ReactNode } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import AppBreadcrumb from "./app-breadcrumb";

/** Where every trail starts. */
// "/" sends staff to the admin portal and everyone else to their workspace.
const PORTAL_ROOT: BreadcrumbItem = { title: "Home", href: "/" };

export interface PageHeaderProps {
  /** Optional: a page that titles itself lower down gets only the trail row. */
  title?: ReactNode;
  description?: ReactNode;
  /** Glyph shown in a chip beside the title. */
  icon?: IconSvgElement;
  /** Anything that identifies the record instead of a glyph: initials, a logo. */
  avatar?: ReactNode;
  /** Pills and short facts under the title: status, owner, dates. */
  meta?: ReactNode;
  /** Buttons for this page, aligned to the right. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The one header a page gets: the trail and the app's own controls on a quiet
 * top line, then what this page is and what you can do with it.
 *
 * Wears the same surface, hairline ring and lift as the sidebar, so the shell
 * and the page read as one system. Change one and change the other.
 */
export default function PageHeader({
  breadcrumbs,
  title,
  description,
  icon: glyph,
  avatar,
  meta,
  actions,
  className,
}: PageHeaderProps & { breadcrumbs?: BreadcrumbItem[] }) {
  const hasTitleRow = Boolean(title || description || meta || actions);

  const identity =
    avatar ??
    (glyph ? (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground ring-1 ring-sidebar-border">
        <Icon icon={glyph} className="size-5" />
      </span>
    ) : null);

  // Every page shows where it sits. Pages give their own trail from the
  // section down ("Tenants › Demo Store"); the portal root is prepended here
  // so no page has to repeat it, and so a section page reads as a trail
  // rather than a lone crumb echoing the title beneath it.
  const trail = breadcrumbs?.length
    ? breadcrumbs[0].href === PORTAL_ROOT.href
      ? breadcrumbs
      : [PORTAL_ROOT, ...breadcrumbs]
    : [PORTAL_ROOT];

  return (
    <header
      className={cn(
        "flex flex-col rounded-2xl bg-sidebar p-4 shadow-sm ring-1 ring-sidebar-border",
        className,
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* The brand row carries the collapse control while the sidebar is
              open; this one takes over on the rail and on mobile. */}
          <SidebarTrigger
            className="-ml-1 rounded-lg md:hidden md:group-has-data-[collapsible=icon]/sidebar-wrapper:inline-flex"
            variant="secondary"
            size="icon-sm"
          />
          <AppBreadcrumb breadcrumbs={trail} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitcher variant="outline" size="icon-sm" />
        </div>
      </div>

      {hasTitleRow && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            {/* {identity} */}
            <div className="min-w-0">
              {title && (
                <h1 className="truncate font-heading text-2xl font-medium tracking-wide">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
              {meta && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {meta}
                </div>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
