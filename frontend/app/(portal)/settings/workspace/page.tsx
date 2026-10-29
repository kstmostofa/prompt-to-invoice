import { WorkflowSquare01Icon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem } from "@/components/shared/detail-card";
import { formatDate, formatMoney } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import { getWorkspace } from "@/lib/workspace";
import { WorkspaceNameForm } from "./form";

export const metadata = { title: pageTitle("Workspace") };

export default async function WorkspaceSettingsPage() {
  const { data: workspace } = await getWorkspace();
  const plan = workspace.plan;

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Settings", href: "/settings/business-profile" },
        { title: "Workspace", href: "/settings/workspace" },
      ]}
      icon={WorkflowSquare01Icon}
      title="Workspace"
      description="Your workspace holds your clients, invoices and team."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspaceNameForm name={workspace.name} />
        <DetailCard title="Plan">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledItem label="Current plan" value={plan?.name ?? "—"} />
            <LabeledItem
              label="Price"
              value={plan ? (plan.monthly_price === null ? "Custom" : Number(plan.monthly_price) === 0 ? "Free" : `${formatMoney(plan.monthly_price, plan.currency)} / month`) : "—"}
            />
            <LabeledItem label="Invoices a month" value={plan?.monthly_invoice_limit ?? "Unlimited"} />
            <LabeledItem label="Team members" value={`${workspace.members_count ?? 1} of ${plan?.seat_limit ?? "unlimited"}`} />
            <LabeledItem label="Clients" value={workspace.clients_count ?? 0} />
            <LabeledItem label="Created" value={formatDate(workspace.created_at)} />
          </div>
        </DetailCard>
      </div>
    </AppLayout>
  );
}
