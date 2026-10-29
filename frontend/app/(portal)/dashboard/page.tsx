import { ArrowRight01Icon, DashboardSquare01Icon, Invoice01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { auth } from "@/auth";
import { TrendChart } from "@/components/charts/trend-chart";
import AppLayout from "@/components/layouts/app-layout";
import { CardEmpty } from "@/components/shared/card-empty";
import { DetailCard, StatusPill } from "@/components/shared/detail-card";
import Icon from "@/components/shared/icon";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import { getDashboard } from "@/lib/workspace";

const breadcrumbs = [{ title: "Dashboard", href: "/dashboard" }];

export const metadata = {
  title: pageTitle("Dashboard"),
};

/** The workspace at a glance, in the business profile's currency. */
export default async function DashboardPage() {
  const [session, { data }] = await Promise.all([auth(), getDashboard()]);
  const firstName = session?.user?.name?.split(" ")[0];
  const money = (amount: string | number) => formatMoney(amount, data.currency);
  const { used, limit } = data.usage;

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      icon={DashboardSquare01Icon}
      title="Dashboard"
      description={`Welcome back${firstName ? `, ${firstName}` : ""}. Here is ${session?.user?.workspaceName ?? "your workspace"} at a glance.`}
      actions={
        <Button render={<Link href="/invoices/new" />}>
          <Icon icon={PlusSignIcon} />
          New invoice
        </Button>
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Outstanding"
            value={money(data.outstanding)}
            href="/invoices?status=sent,overdue"
            linkLabel="Unpaid invoices"
            description="Sent and not yet paid"
          />
          <StatCard
            title="Overdue"
            value={money(data.overdue)}
            href="/invoices?status=overdue"
            linkLabel="Chase them"
            description={data.overdue_count ? `${data.overdue_count} invoice${data.overdue_count === 1 ? "" : "s"} past due` : "Nothing past due"}
          />
          <StatCard title="Paid this month" value={money(data.paid_this_month)} description={`${money(data.invoiced_this_month)} invoiced this month`} />
          <StatCard
            title={limit === null ? "Invoices this month" : "Monthly allowance"}
            value={limit === null ? String(used) : `${used} / ${limit}`}
            href={data.draft_count ? "/invoices?status=draft" : undefined}
            linkLabel="Drafts"
            description={`${data.plan?.name ?? "Your"} plan · ${data.draft_count} draft${data.draft_count === 1 ? "" : "s"}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DetailCard title={`Invoiced vs paid, last 6 months (${data.currency})`} className="lg:col-span-2">
            <TrendChart
              data={data.monthly}
              series={[
                { key: "invoiced", label: "Invoiced" },
                { key: "paid", label: "Paid" },
              ]}
              variant="bar"
              format="money"
              currency={data.currency}
              height={300}
              emptyLabel="Nothing invoiced in the last 6 months"
            />
          </DetailCard>

          <DetailCard title="Recent invoices" bodyClassName="flex flex-col">
            {data.recent_invoices.length ? (
              <ul className="divide-y">
                {data.recent_invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link href={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{invoice.to.company || invoice.to.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {invoice.number} · {formatDate(invoice.issue_date, { month: "short" })}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-medium tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
                        <StatusPill status={invoice.display_status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <CardEmpty
                icon={Invoice01Icon}
                title="No invoices yet"
                description="Create your first invoice in under a minute."
                action={
                  <Button size="sm" render={<Link href="/invoices/new" />}>
                    New invoice
                  </Button>
                }
              />
            )}
            {data.recent_invoices.length > 0 && (
              <Link href="/invoices" className="mt-auto inline-flex items-center gap-1 self-start pt-2 text-sm font-medium text-primary hover:underline">
                All invoices
                <Icon icon={ArrowRight01Icon} className="size-3.5" aria-hidden />
              </Link>
            )}
          </DetailCard>
        </div>
      </div>
    </AppLayout>
  );
}
