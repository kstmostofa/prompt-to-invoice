import Icon from "@/components/shared/icon";
import { Invoice01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { DataTableSkeleton } from "@/components/datatable/data-table-skeleton";
import AppLayout from "@/components/layouts/app-layout";
import CardLayout from "@/components/layouts/card-layout";
import { Button } from "@/components/ui/button";
import { getInvoices } from "@/lib/invoices";
import { pageTitle } from "@/lib/site";
import { SearchParams } from "@/types/global";
import Link from "next/link";
import { Suspense } from "react";
import InvoiceTable from "./table";

export const metadata = { title: pageTitle("Invoices") };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const data = await getInvoices(params);

  return (
    <AppLayout
      breadcrumbs={[{ title: "Invoices", href: "/invoices" }]}
      icon={Invoice01Icon}
      title="Invoices"
      description="Everything you have billed, and what is still owed."
      actions={
        <Button render={<Link href="/invoices/new" />}>
          <Icon icon={PlusSignIcon} />
          New invoice
        </Button>
      }
    >
      <CardLayout>
        <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={1} shrinkZero />}>
          <InvoiceTable data={data} />
        </Suspense>
      </CardLayout>
    </AppLayout>
  );
}
