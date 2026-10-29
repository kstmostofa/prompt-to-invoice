import { Building03Icon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem, StatusPill } from "@/components/shared/detail-card";
import { Flag } from "@/components/shared/flag";
import { getAdminWorkspace } from "@/lib/admin";
import { countryName } from "@/lib/countries";
import { formatDate } from "@/lib/helper";
import { getPlans } from "@/lib/plans";
import { pageTitle } from "@/lib/site";
import { notFound } from "next/navigation";
import { WorkspaceActions } from "./workspace-actions";

export const metadata = { title: pageTitle("Workspace") };

export default async function AdminWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workspace, plans] = await Promise.all([
    getAdminWorkspace(Number(id))
      .then((response) => response.data)
      .catch(() => notFound()),
    getPlans({ per_page: "100" }),
  ]);
  const profile = workspace.business_profile;

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Workspaces", href: "/admin/workspaces" },
        { title: workspace.name, href: `/admin/workspaces/${workspace.id}` },
      ]}
      icon={Building03Icon}
      title={workspace.name}
      description={workspace.slug}
      meta={<StatusPill status={workspace.status} />}
      actions={<WorkspaceActions workspace={workspace} plans={plans.data} />}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <DetailCard title="Overview">
          <div className="grid gap-4">
            <LabeledItem label="Owner" value={`${workspace.owner?.name} (${workspace.owner?.email})`} />
            <LabeledItem label="Plan" value={workspace.plan?.name ?? "—"} />
            <LabeledItem label="Clients" value={workspace.clients_count ?? 0} />
            <LabeledItem label="Created" value={formatDate(workspace.created_at)} />
            {workspace.suspended_at && <LabeledItem label="Suspended" value={formatDate(workspace.suspended_at)} />}
          </div>
        </DetailCard>
        <DetailCard title="Business profile" className="lg:col-span-2">
          {profile ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledItem label="Business name" value={profile.name} />
              <LabeledItem label="Billing email" value={profile.email ?? "—"} />
              <LabeledItem
                label="Country"
                value={
                  profile.country ? (
                    <span className="inline-flex items-center gap-2">
                      <Flag code={profile.country} />
                      {countryName(profile.country)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <LabeledItem label="Tax / VAT ID" value={profile.tax_id ?? "—"} />
              <LabeledItem label="Currency" value={profile.currency} />
              <LabeledItem label="Next invoice" value={`${profile.invoice_prefix}${String(profile.next_invoice_number).padStart(4, "0")}`} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No business profile yet.</p>
          )}
        </DetailCard>
        <DetailCard title={`Members (${workspace.members.length})`} className="lg:col-span-3">
          <ul className="divide-y">
            {workspace.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{member.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{member.role}</span>
                  {!member.is_active && <StatusPill status="deactivated" />}
                </div>
              </li>
            ))}
          </ul>
        </DetailCard>
      </div>
    </AppLayout>
  );
}
