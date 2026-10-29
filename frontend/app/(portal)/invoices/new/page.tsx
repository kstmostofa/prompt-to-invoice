import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { NewInvoice } from "@/components/invoice/new-invoice";
import AppLayout from "@/components/layouts/app-layout";
import { getClientOptions, getInvoiceDefaults } from "@/lib/invoices";
import { pageTitle } from "@/lib/site";

export const metadata = { title: pageTitle("New invoice") };

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ prompt?: string | string[] }> }) {
  const [{ prompt }, { data: defaults }, { data: clients }] = await Promise.all([searchParams, getInvoiceDefaults(), getClientOptions()]);

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Invoices", href: "/invoices" },
        { title: "New", href: "/invoices/new" },
      ]}
      icon={Invoice01Icon}
      title="New invoice"
      description="Saved as a draft. Nothing is sent until you say so."
    >
      <NewInvoice defaults={defaults} clients={clients} initialPrompt={typeof prompt === "string" ? prompt.slice(0, 2000) : undefined} />
    </AppLayout>
  );
}
