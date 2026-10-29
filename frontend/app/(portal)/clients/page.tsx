import Icon from "@/components/shared/icon";
import { PlusSignIcon, UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { DataTableSkeleton } from "@/components/datatable/data-table-skeleton";
import AppLayout from "@/components/layouts/app-layout";
import CardLayout from "@/components/layouts/card-layout";
import { Button } from "@/components/ui/button";
import { getClients } from "@/lib/clients";
import { pageTitle } from "@/lib/site";
import { SearchParams } from "@/types/global";
import { Suspense } from "react";
import { ClientForm } from "./form";
import ClientTable from "./table";

const breadcrumbs = [{ title: "Clients", href: "/clients" }];

export const metadata = {
  title: pageTitle("Clients"),
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getClients(params);

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      icon={UserMultiple02Icon}
      title="Clients"
      description="The people and companies you bill."
      actions={
        <ClientForm
          trigger={
            <Button>
              <Icon icon={PlusSignIcon} />
              New client
            </Button>
          }
        />
      }
    >
      <CardLayout>
        <Suspense
          fallback={<DataTableSkeleton columnCount={6} filterCount={1} cellWidths={["14rem", "12rem", "10rem", "6rem", "8rem", "6rem"]} shrinkZero />}
        >
          <ClientTable data={data} />
        </Suspense>
      </CardLayout>
    </AppLayout>
  );
}
