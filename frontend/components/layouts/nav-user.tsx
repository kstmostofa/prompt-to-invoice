"use client";

import Icon from "@/components/shared/icon";
import {
  Logout01Icon,
  UnfoldMoreIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { getInitials } from "@/lib/helper";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

export function NavUser({ user }: { user: Session["user"] }) {
  const { isMobile, state } = useSidebar();

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-auto rounded-2xl border border-sidebar-border bg-background p-2.5 shadow-sm hover:bg-background data-open:bg-background group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:shadow-none"
              />
            }
          >
            <Avatar className="size-9 rounded-xl group-data-[collapsible=icon]:size-8">
              <AvatarImage src="" alt={user.name} />
              <AvatarFallback className="rounded-xl">
                {getInitials(user.name || "")}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.isAdmin ? "Platform admin" : user.workspaceName || user.email}
              </span>
            </div>
            <Icon
              icon={UnfoldMoreIcon}
              className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-2xl"
            side={isMobile ? "bottom" : state === "collapsed" ? "right" : "top"}
            align="end"
            sideOffset={4}
          >
            {/* Base UI ties a GroupLabel to a Group and throws without one, so
                the user card and the action it heads live in the same group —
                which is also what lets a screen reader announce "Log out" as
                belonging to this account. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                    {(user.isAdmin || user.role) && (
                      <span className="truncate text-xs capitalize text-muted-foreground">
                        {user.isAdmin ? "Platform admin" : `${user.role} · ${user.workspaceName ?? ""}`}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/account" />}>
                <Icon icon={UserCircleIcon} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ redirectTo: "/login" })}
                variant="destructive"
              >
                <Icon icon={Logout01Icon} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
