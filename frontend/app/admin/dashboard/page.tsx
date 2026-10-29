import { DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { auth } from "@/auth";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard } from "@/components/shared/detail-card";
import { StatCard } from "@/components/shared/stat-card";
import { getAdminDashboard } from "@/lib/admin";
import { pageTitle } from "@/lib/site";

export const metadata = { title: pageTitle("Admin dashboard") };

const PLAN_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** The platform at a glance: workspaces, people and plans. */
export default async function AdminDashboardPage() {
  const [session, { data }] = await Promise.all([auth(), getAdminDashboard()]);
  const newThisMonth = data.signups.at(-1)?.count ?? 0;

  return (
    <AppLayout
      breadcrumbs={[{ title: "Dashboard", href: "/admin/dashboard" }]}
      icon={DashboardSquare01Icon}
      title="Platform dashboard"
      description={`Welcome back${session?.user?.name ? `, ${session.user.name}` : ""}. Every workspace at a glance.`}
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Workspaces" value={String(data.workspaces)} href="/admin/workspaces" linkLabel="All workspaces" description={`+${newThisMonth} this month`} />
          <StatCard title="Active" value={String(data.active_workspaces)} description="Workspaces that can sign in and invoice" />
          <StatCard title="Suspended" value={String(data.suspended_workspaces)} href="/admin/workspaces?status=suspended" linkLabel="Review" description="Blocked by platform staff" />
          <StatCard title="Users" value={String(data.users)} href="/admin/users" linkLabel="All users" description="Customer accounts, staff excluded" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <DetailCard title="New workspaces, last 6 months" className="lg:col-span-2">
            <TrendChart
              data={data.signups}
              series={[{ key: "count", label: "Workspaces" }]}
              variant="bar"
              format="number"
              height={300}
              emptyLabel="No signups in the last 6 months"
            />
          </DetailCard>
          <DetailCard title="Workspaces by plan">
            <DonutChart
              data={data.plans.map((plan) => ({ name: plan.name, value: plan.count }))}
              colors={Object.fromEntries(data.plans.map((plan, index) => [plan.name, PLAN_COLORS[index % PLAN_COLORS.length]]))}
              centerLabel="workspaces"
            />
          </DetailCard>
        </div>
      </div>
    </AppLayout>
  );
}
