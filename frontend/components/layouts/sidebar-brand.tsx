"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";

interface SidebarBrandProps {
  href?: string;
}

/**
 * The top row of the sidebar: the wordmark, and the control that collapses
 * the rail beside it. On the collapsed rail only the mark is left, centred —
 * the trigger moves to the page header, which is the only place still wide
 * enough for it.
 */
export function SidebarBrand({ href = "/" }: SidebarBrandProps) {
  return (
    <div className="flex h-12 items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <Link
        href={href}
        aria-label="Dashboard"
        className="flex items-center rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <BrandLogo className="h-7 group-data-[collapsible=icon]:hidden" />
        <BrandLogo
          variant="mark"
          className="hidden h-8 group-data-[collapsible=icon]:block"
        />
      </Link>
      <SidebarTrigger
        className="shrink-0 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
        variant="secondary"
        size="icon-sm"
      />
    </div>
  );
}
