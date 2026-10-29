import { BreadcrumbItem } from "@/types/global";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import PageHeader, { type PageHeaderProps } from "./page-header";
import { auth } from "@/auth";
import { VerifyEmailBanner } from "./verify-email-banner";

interface AppLayoutProps extends PageHeaderProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

/**
 * Every portal page is the sidebar, one header panel and the page's own
 * content. The header is the layout's to render so a page cannot end up with
 * two of them, or none.
 */
export default async function AppLayout({
  children,
  breadcrumbs,
  ...header
}: AppLayoutProps) {
  const session = await auth();

  // A card shell: the sidebar and the page header are two panels of the same
  // surface, lifted off a tinted page. The collapsed rail holds size-10
  // buttons inside the content's px-2, so it needs more than the shadcn
  // default 3rem.
  return (
    <SidebarProvider
      className="bg-muted"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="floating" user={session?.user} />
      <SidebarInset className="gap-4 bg-transparent p-2 md:pl-0">
        {session?.user && !session.user.isAdmin && session.user.isVerified === false && <VerifyEmailBanner email={session.user.email} />}
        <PageHeader breadcrumbs={breadcrumbs} {...header} />
        {/* No padding of its own: the gutter is SidebarInset's, so the page
            content lines up with the header card's edges. */}
        <div className="flex flex-1 flex-col gap-2">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
