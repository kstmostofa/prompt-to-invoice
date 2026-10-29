import Icon from "@/components/shared/icon";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { DataTableSkeleton } from "@/components/datatable/data-table-skeleton";
import AppLayout from "@/components/layouts/app-layout";
import CardLayout from "@/components/layouts/card-layout";
import { Button } from "@/components/ui/button";
import { getPlans } from "@/lib/plans";
import { pageTitle } from "@/lib/site";
import { SearchParams } from "@/types/global";
import { Suspense } from "react";
import { PlanForm } from "./form";
import PlanTable from "./table";

const breadcrumbs = [{ title: "Plans", href: "/admin/plans" }];

export const metadata = {
  title: pageTitle("Plans"),
};

interface PlansPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams;
  const data = await getPlans(params);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <CardLayout
        title="Plans"
        description="What workspaces can subscribe to, and what each plan allows"
        cardAction={
          <PlanForm
            trigger={
              <Button>
                <Icon icon={PlusSignIcon} />
                Add Plan
              </Button>
            }
          />
        }
      >
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={8}
              filterCount={0}
              cellWidths={["12rem", "8rem", "8rem", "6rem", "6rem", "6rem", "6rem", "6rem"]}
              shrinkZero
            />
          }
        >
          <PlanTable data={data} />
        </Suspense>
      </CardLayout>
    </AppLayout>
  );
}
