import { Edit03Icon, UserIcon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem } from "@/components/shared/detail-card";
import { Flag } from "@/components/shared/flag";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { getClient } from "@/lib/clients";
import { countryName } from "@/lib/countries";
import { formatDate } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import { notFound } from "next/navigation";
import { ClientForm } from "../form";

export const metadata = { title: pageTitle("Client") };

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(Number(id))
    .then((response) => response.data)
    .catch(() => notFound());

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
        {client.notes && (
          <DetailCard title="Notes" className="lg:col-span-3">
            <p className="whitespace-pre-line text-sm">{client.notes}</p>
          </DetailCard>
        )}
      </div>
    </AppLayout>
  );
}
