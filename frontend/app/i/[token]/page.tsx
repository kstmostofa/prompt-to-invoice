import { Download04Icon } from "@hugeicons/core-free-icons";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { BrandLogo } from "@/components/shared/brand-logo";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/helper";
import { getPublicInvoice } from "@/lib/public-invoices";
import { PLATFORM_NAME } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invoice = await getPublicInvoice((await params).token);
  return {
    title: invoice ? `Invoice ${invoice.number} from ${invoice.from.name}` : "Invoice",
    // A private link: keep it out of search engines.
    robots: { index: false, follow: false },
  };
}

/**
 * The client's view of an invoice, from the link in the email. No sign-in:
 * the unguessable token is the access.
 */
export default async function PublicInvoicePage({ params }: Props) {
  const { token } = await params;
  const invoice = await getPublicInvoice(token);
  if (!invoice) notFound();

  const status = invoice.display_status;
  const summary =
    status === "paid"
      ? `Paid${invoice.paid_at ? ` on ${formatDate(invoice.paid_at)}` : ""}. Thank you!`
      : status === "void"
        ? "This invoice has been cancelled."
        : `${formatMoney(invoice.total, invoice.currency)} due ${formatDate(invoice.due_date)}`;

  return (
    <div className="min-h-svh bg-muted px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-4xl gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background p-4 shadow-sm ring-1 ring-border">
          <div>
            <div className="text-sm text-muted-foreground">Invoice {invoice.number} from</div>
            <div className="text-lg font-semibold">{invoice.from.name}</div>
            <div className={status === "overdue" ? "text-sm font-medium text-rose-500" : "text-sm text-muted-foreground"}>{summary}</div>
          </div>
          <Button render={<a href={`/i/${encodeURIComponent(token)}/pdf`} />}>
            <Icon icon={Download04Icon} />
            Download PDF
          </Button>
        </div>
        <InvoiceDocument invoice={invoice} />
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          Sent with <BrandLogo className="h-4" /> <span className="sr-only">{PLATFORM_NAME}</span>
        </p>
      </div>
    </div>
  );
}
