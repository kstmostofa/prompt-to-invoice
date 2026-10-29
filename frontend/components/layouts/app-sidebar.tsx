"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "./sidebar-brand";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { type Session } from "next-auth";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: Session["user"];
}

/**
 * The portal's rail: a panel lifted off the page, with the brand at the top,
 * the navigation in the middle and the signed-in user pinned to the bottom.
 * The variant comes from the layout so the rail and the page header stay one
 * shell.
 */
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader className="px-2 pt-3 pb-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent className="gap-2 px-1 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <NavMain user={user} />
      </SidebarContent>
      <SidebarFooter className="px-2 pt-2 pb-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        {user && <NavUser user={user} />}
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
