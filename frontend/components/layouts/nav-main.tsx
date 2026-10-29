"use client";

import Icon from "@/components/shared/icon";
import {
  Building03Icon,
  ChevronRightIcon,
  DashboardSquare01Icon,
  Invoice01Icon,
  Layers01Icon,
  Settings01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  WorkflowSquare01Icon,
} from "@hugeicons/core-free-icons";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavGroup, NavItem } from "@/types/global";
import { AccessUser, canManageWorkspace, cn, isPlatformAdmin } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** The workspace portal: what a business owner and their team see. */
function workspaceNav(pathname: string, user?: AccessUser | null): NavGroup[] {
  return [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: DashboardSquare01Icon,
          isActive: pathname === "/dashboard",
        },
      ],
    },
    {
      label: "Billing",
      items: [
        {
          title: "Invoices",
          url: "/invoices",
          icon: Invoice01Icon,
          isActive: pathname.startsWith("/invoices"),
        },
        {
          title: "Clients",
          url: "/clients",
          icon: UserMultiple02Icon,
          isActive: pathname.startsWith("/clients"),
        },
      ],
    },
    {
      label: "Configuration",
      items: [
        {
          title: "Settings",
          url: "#",
          icon: Settings01Icon,
          isActive: pathname.startsWith("/settings"),
          show: canManageWorkspace(user),
          subItems: [
            {
              title: "Business profile",
              url: "/settings/business-profile",
              icon: Building03Icon,
              isActive: pathname.startsWith("/settings/business-profile"),
            },
            {
              title: "Workspace",
              url: "/settings/workspace",
              icon: WorkflowSquare01Icon,
              isActive: pathname.startsWith("/settings/workspace"),
            },
          ],
        },
      ],
    },
  ];
}

/** The platform admin portal: staff looking across every workspace. */
function adminNav(pathname: string): NavGroup[] {
  return [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/admin/dashboard",
          icon: DashboardSquare01Icon,
          isActive: pathname === "/admin/dashboard",
        },
      ],
    },
    {
      label: "Platform",
      items: [
        {
          title: "Workspaces",
          url: "/admin/workspaces",
          icon: Building03Icon,
          isActive: pathname.startsWith("/admin/workspaces"),
        },
        {
          title: "Users",
          url: "/admin/users",
          icon: UserGroupIcon,
          isActive: pathname.startsWith("/admin/users"),
        },
        {
          title: "Plans",
          url: "/admin/plans",
          icon: Layers01Icon,
          isActive: pathname.startsWith("/admin/plans"),
        },
      ],
    },
  ];
}

export function NavMain({ user }: { user?: AccessUser | null }) {
  const pathname = usePathname();
  const navGroups = isPlatformAdmin(user) ? adminNav(pathname) : workspaceNav(pathname, user);

  // A group whose every item is permission-gated away must not leave an orphan
  // header behind, so drop the group once it has nothing left to show; the
  // same for a parent row whose every child is gated away.
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => item.show !== false)
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter((subItem) => subItem.show !== false),
        }))
        .filter(
          (item) => item.subItems === undefined || item.subItems.length > 0,
        ),
    }))
    .filter((group) => group.items.length > 0);

  // Nav rows in the reference shell: the current page is a filled brand pill,
  // the rest quiet. Size, gap and icon are the primitive's own — only the
  // colours and the active state are ours. The fill is --primary rather than
  // --brand because the two are the same indigo in light mode while dark mode
  // keeps --primary a step deeper, which is what white label text needs. The
  // active row holds its fill on hover; dropping back to the page surface
  // would leave a white label on white.
  const itemClass = cn(
    "text-sidebar-foreground/75 rounded-lg h-8",
    "hover:bg-sidebar-accent hover:text-sidebar-foreground",
    "[&_svg]:text-sidebar-foreground/55",
    "data-active:bg-primary data-active:font-medium data-active:text-primary-foreground data-active:shadow-sm data-active:shadow-primary/25 data-active:ring-1 data-active:ring-primary",
    "data-active:hover:bg-primary data-active:hover:text-primary-foreground data-active:[&_svg]:text-primary-foreground",
    // On the rail the row is a square button holding a slightly larger glyph.
    "group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
    "group-data-[collapsible=icon]:[&_svg]:size-5 group-data-[collapsible=icon]:[&>span]:hidden",
  );

  // A child row is the same row as a top-level one, indented, with its icon
  // at the parent's size and tone. The parent above it stays quiet: the
  // child carries the fill, and two loud rows in one group is a mess.
  const subItemClass = cn(
    "h-8 rounded-lg text-sidebar-foreground/75",
    "hover:bg-sidebar-accent hover:text-sidebar-foreground",
    // [&>svg], not [&_svg]: the primitive colours its icon with [&>svg], and
    // only the same variant lets cn replace it rather than lose to it.
    "[&>svg]:size-4 [&>svg]:text-sidebar-foreground/55",
    "data-active:bg-primary data-active:font-medium data-active:text-primary-foreground data-active:shadow-sm data-active:shadow-primary/25 data-active:ring-1 data-active:ring-primary",
    "data-active:hover:bg-primary data-active:hover:text-primary-foreground data-active:[&>svg]:text-primary-foreground",
  );

  const renderItem = (item: NavItem) => {
    const ItemIcon = item.icon;

    if (item.subItems?.length) {
      return (
        <Collapsible
          key={item.title}
          defaultOpen={item.isActive}
          className="group/collapsible"
          render={<SidebarMenuItem />}
        >
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                tooltip={item.title}
                className={cn(
                  "h-8 cursor-pointer rounded-lg text-sidebar-foreground/75",
                  "hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  "[&_svg]:text-sidebar-foreground/55",
                  "data-[panel-open]:bg-sidebar-accent data-[panel-open]:text-sidebar-foreground",
                  item.isActive &&
                    "font-medium text-sidebar-foreground [&_svg]:text-brand",
                  "group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
                  "group-data-[collapsible=icon]:[&_svg]:size-5 group-data-[collapsible=icon]:[&>span]:hidden",
                )}
              />
            }
          >
            {ItemIcon && <Icon icon={ItemIcon} />}
            <span>{item.title}</span>
            <Icon
              icon={ChevronRightIcon}
              // Open state is data-panel-open on the trigger, which is the
              // primitive's own group/menu-button.
              className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[panel-open]/menu-button:rotate-90"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="mx-0 gap-1 border-l-0 px-0 ps-4 py-1">
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    isActive={subItem.isActive}
                    size="md"
                    className={subItemClass}
                    render={<Link href={subItem.url} prefetch={false} />}
                  >
                    {subItem.icon && <Icon icon={subItem.icon} />}
                    <span>{subItem.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={item.isActive}
          className={itemClass}
          render={<Link href={item.url} prefetch={false} />}
        >
          {ItemIcon && <Icon icon={ItemIcon} />}
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {visibleGroups.map((group) => (
        <SidebarGroup key={group.label} className="py-0">
          {/* px-3 is the menu button's own padding, so the label starts on
              the icon column rather than hanging to its left. */}
          <SidebarGroupLabel className="h-auto px-1 pb-1 group-data-[collapsible=icon]:hidden">
            {group.label}
          </SidebarGroupLabel>
          <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
