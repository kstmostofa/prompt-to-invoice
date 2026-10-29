import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import AppLayout from "@/components/layouts/app-layout";
import { getClientOptions, getInvoiceDefaults } from "@/lib/invoices";
import { pageTitle } from "@/lib/site";

export const metadata = { title: pageTitle("New invoice") };

export default async function NewInvoicePage() {
  const [{ data: defaults }, { data: clients }] = await Promise.all([getInvoiceDefaults(), getClientOptions()]);

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
      <InvoiceEditor defaults={defaults} clients={clients} />
    </AppLayout>
  );
}
