import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import AppLayout from "@/components/layouts/app-layout";
import { getClientOptions, getInvoice, getInvoiceDefaults } from "@/lib/invoices";
import { pageTitle } from "@/lib/site";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: pageTitle("Edit invoice") };

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, { data: defaults }, { data: clients }] = await Promise.all([
    getInvoice(Number(id))
      .then((response) => response.data)
      .catch(() => notFound()),
    getInvoiceDefaults(),
    getClientOptions(),
  ]);

  // Paid and void invoices are final.
  if (invoice.status === "paid" || invoice.status === "void") {
    redirect(`/invoices/${invoice.id}`);
  }

  // A client deleted since stays selectable on their own invoice.
  const withCurrentClient =
    invoice.client && !clients.some((client) => client.id === invoice.client?.id)
      ? [...clients, { ...invoice.client, currency: null }]
      : clients;

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Invoices", href: "/invoices" },
        { title: invoice.number, href: `/invoices/${invoice.id}` },
        { title: "Edit", href: `/invoices/${invoice.id}/edit` },
      ]}
      icon={Invoice01Icon}
      title={`Edit ${invoice.number}`}
      description={invoice.status === "sent" ? "Already sent: the client keeps the copy they received until you send it again." : undefined}
    >
      <InvoiceEditor defaults={defaults} clients={withCurrentClient} invoice={invoice} />
    </AppLayout>
  );
}
