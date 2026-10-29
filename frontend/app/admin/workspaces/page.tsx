import { Building03Icon } from "@hugeicons/core-free-icons";
import { DataTableSkeleton } from "@/components/datatable/data-table-skeleton";
import AppLayout from "@/components/layouts/app-layout";
import CardLayout from "@/components/layouts/card-layout";
import { getAdminWorkspaces } from "@/lib/admin";
import { pageTitle } from "@/lib/site";
import { SearchParams } from "@/types/global";
import { Suspense } from "react";
import WorkspaceTable from "./table";

export const metadata = { title: pageTitle("Workspaces") };

export default async function AdminWorkspacesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getAdminWorkspaces(params);

  return (
    <AppLayout
      breadcrumbs={[{ title: "Workspaces", href: "/admin/workspaces" }]}
      icon={Building03Icon}
      title="Workspaces"
      description="Every business on the platform. One database; each row is fenced to its workspace."
    >
      <CardLayout>
        <Suspense fallback={<DataTableSkeleton columnCount={7} filterCount={2} shrinkZero />}>
          <WorkspaceTable data={data} />
        </Suspense>
      </CardLayout>
    </AppLayout>
  );
}
