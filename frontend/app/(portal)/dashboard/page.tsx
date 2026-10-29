import { ArrowRight01Icon, DashboardSquare01Icon, PlusSignIcon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { auth } from "@/auth";
import AppLayout from "@/components/layouts/app-layout";
import { CardEmpty } from "@/components/shared/card-empty";
import { DetailCard } from "@/components/shared/detail-card";
import Icon from "@/components/shared/icon";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import { getDashboard } from "@/lib/workspace";
import { ClientForm } from "../clients/form";

const breadcrumbs = [{ title: "Dashboard", href: "/dashboard" }];

export const metadata = {
  title: pageTitle("Dashboard"),
};

/** The workspace at a glance. Invoice totals join this once invoicing ships. */
export default async function DashboardPage() {
  const [session, { data }] = await Promise.all([auth(), getDashboard()]);
  const firstName = session?.user?.name?.split(" ")[0];
  const limit = data.plan?.monthly_invoice_limit;

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      icon={DashboardSquare01Icon}
      title="Dashboard"
      description={`Welcome back${firstName ? `, ${firstName}` : ""}. Here is ${session?.user?.workspaceName ?? "your workspace"} at a glance.`}
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Clients" value={String(data.clients_count)} href="/clients" linkLabel="All clients" description={`+${data.clients_this_month} this month`} />
          <StatCard title="Plan" value={data.plan?.name ?? "—"} description={limit ? `Up to ${limit} invoices a month` : "Unlimited invoices"} />
          <StatCard title="Invoiced this month" value="—" description="Invoicing arrives in the next release" />
          <StatCard title="Outstanding" value="—" description="Unpaid and overdue totals will show here" />
        </div>

        <DetailCard
          title="Recent clients"
          action={
            <ClientForm
              trigger={
                <Button size="sm" variant="outline">
                  <Icon icon={PlusSignIcon} />
                  New client
                </Button>
              }
            />
          }
        >
          {data.recent_clients.length ? (
            <ul className="divide-y">
              {data.recent_clients.map((client) => (
                <li key={client.id}>
                  <Link href={`/clients/${client.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-primary">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{client.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{client.company ?? client.email ?? "No company"}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {formatDate(client.created_at, { month: "short" })}
                      <Icon icon={ArrowRight01Icon} className="size-3.5" aria-hidden />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <CardEmpty icon={UserMultiple02Icon} title="No clients yet" description="Add the people and companies you bill, and pick them on every invoice." />
          )}
        </DetailCard>
      </div>
    </AppLayout>
  );
}
