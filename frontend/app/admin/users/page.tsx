import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { DataTableSkeleton } from "@/components/datatable/data-table-skeleton";
import AppLayout from "@/components/layouts/app-layout";
import CardLayout from "@/components/layouts/card-layout";
import { getAdminUsers } from "@/lib/admin";
import { pageTitle } from "@/lib/site";
import { SearchParams } from "@/types/global";
import { Suspense } from "react";
import UserTable from "./table";

export const metadata = { title: pageTitle("Users") };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getAdminUsers(params);

  return (
    <AppLayout
      breadcrumbs={[{ title: "Users", href: "/admin/users" }]}
      icon={UserGroupIcon}
      title="Users"
      description="Every account on the platform, customers and staff."
    >
      <CardLayout>
        <Suspense fallback={<DataTableSkeleton columnCount={7} filterCount={2} shrinkZero />}>
          <UserTable data={data} />
        </Suspense>
      </CardLayout>
    </AppLayout>
  );
}
