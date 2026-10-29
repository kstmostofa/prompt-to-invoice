import { Edit03Icon, UserIcon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem, StatusPill } from "@/components/shared/detail-card";
import { Flag } from "@/components/shared/flag";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { getClient } from "@/lib/clients";
import { getInvoices } from "@/lib/invoices";
import { countryName } from "@/lib/countries";
import { formatDate, formatMoney } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "../form";

export const metadata = { title: pageTitle("Client") };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, invoices] = await Promise.all([
    getClient(Number(id))
      .then((response) => response.data)
      .catch(() => notFound()),
    getInvoices({ client_id: id, per_page: "20" }),
  ]);

  const address = [client.address_line1, client.address_line2, [client.postal_code, client.city].filter(Boolean).join(" "), client.state]
    .filter(Boolean)
    .join(", ");

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Clients", href: "/clients" },
        { title: client.name, href: `/clients/${client.id}` },
      ]}
      icon={UserIcon}
      title={client.name}
      description={client.company ?? undefined}
      actions={
        <ClientForm
          client={client}
          trigger={
            <Button variant="outline">
              <Icon icon={Edit03Icon} />
              Edit
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <DetailCard title="Contact" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledItem label="Email" value={client.email ?? "—"} />
            <LabeledItem label="Phone" value={client.phone ?? "—"} />
            <LabeledItem label="Address" value={address || "—"} />
            <LabeledItem
              label="Country"
              value={
                client.country ? (
                  <span className="inline-flex items-center gap-2">
                    <Flag code={client.country} />
                    {countryName(client.country)}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>
        </DetailCard>
        <DetailCard title="Billing">
          <div className="grid gap-4">
            <LabeledItem label="Tax / VAT ID" value={client.tax_id ?? "—"} />
            <LabeledItem label="Currency" value={client.currency ?? "Business default"} />
            <LabeledItem label="Client since" value={formatDate(client.created_at)} />
          </div>
        </DetailCard>
        <DetailCard
          title={`Invoices (${invoices.meta.total})`}
          className="lg:col-span-3"
          action={
            <Button size="sm" variant="outline" render={<Link href="/invoices/new" />}>
              New invoice
            </Button>
          }
        >
          {invoices.data.length ? (
            <ul className="divide-y">
              {invoices.data.map((invoice) => (
                <li key={invoice.id}>
                  <Link href={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-4 py-2.5 hover:text-primary">
                    <span className="font-mono text-sm">{invoice.number}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(invoice.issue_date, { month: "short" })}</span>
                    <span className="ml-auto text-sm font-medium tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
                    <StatusPill status={invoice.display_status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices for this client yet.</p>
          )}
        </DetailCard>
        {client.notes && (
          <DetailCard title="Notes" className="lg:col-span-3">
            <p className="whitespace-pre-line text-sm">{client.notes}</p>
          </DetailCard>
        )}
      </div>
    </AppLayout>
  );
}
