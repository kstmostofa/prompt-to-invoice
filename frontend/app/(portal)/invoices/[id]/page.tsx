import { Invoice01Icon } from "@hugeicons/core-free-icons";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem, StatusPill } from "@/components/shared/detail-card";
import { formatDate, formatMoney } from "@/lib/helper";
import { getInvoice } from "@/lib/invoices";
import { pageTitle } from "@/lib/site";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceActions } from "./invoice-actions";

export const metadata = { title: pageTitle("Invoice") };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(Number(id))
    .then((response) => response.data)
    .catch(() => notFound());

  const client = invoice.to.company || invoice.to.name;

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Invoices", href: "/invoices" },
        { title: invoice.number, href: `/invoices/${invoice.id}` },
      ]}
      icon={Invoice01Icon}
      title={invoice.number}
      description={`${formatMoney(invoice.total, invoice.currency)} to ${client}`}
      meta={<StatusPill status={invoice.display_status} />}
      actions={<InvoiceActions invoice={invoice} />}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_18rem]">
        <InvoiceDocument invoice={invoice} />
        <div className="grid content-start gap-4">
          <DetailCard title="Activity">
            <div className="grid gap-4">
              <LabeledItem label="Created" value={formatDate(invoice.created_at)} />
              <LabeledItem label="Sent" value={invoice.sent_at ? formatDate(invoice.sent_at) : "Not yet"} />
              {invoice.emailed_at && (
                <LabeledItem label="Last emailed" value={`${formatDate(invoice.emailed_at)} to ${invoice.last_emailed_to}`} />
              )}
              {invoice.status !== "draft" && (
                <LabeledItem label="Viewed by client" value={invoice.viewed_at ? formatDate(invoice.viewed_at) : "Not yet"} />
              )}
              {invoice.paid_at && <LabeledItem label="Paid" value={formatDate(invoice.paid_at)} />}
              {invoice.voided_at && <LabeledItem label="Voided" value={formatDate(invoice.voided_at)} />}
            </div>
          </DetailCard>
          {invoice.source_prompt && (
            <DetailCard title="Drafted from">
              <p className="text-sm italic text-muted-foreground">&ldquo;{invoice.source_prompt}&rdquo;</p>
            </DetailCard>
          )}
          {invoice.client && (
            <DetailCard title="Client">
              <Link href={`/clients/${invoice.client.id}`} className="block hover:text-primary">
                <div className="font-medium">{invoice.client.name}</div>
                <div className="text-xs text-muted-foreground">{invoice.client.company ?? invoice.client.email}</div>
              </Link>
            </DetailCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
