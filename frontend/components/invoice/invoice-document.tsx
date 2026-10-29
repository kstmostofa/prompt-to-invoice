import { StatusPill } from "@/components/shared/detail-card";
import { countryName } from "@/lib/countries";
import { formatDate, formatMoney } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceParty } from "@/types/api";

const NORTH_AMERICAN_STYLE = ["US", "CA", "AU", "GB", "IE"];

/** "San Francisco, CA 94105" in North America; "10115 Berlin" in most of Europe. Mirrors the PDF. */
function addressLines(party: InvoiceParty): string[] {
  const city = party.city ?? "";
  const state = party.state ?? "";
  const postal = party.postal_code ?? "";
  const locality = NORTH_AMERICAN_STYLE.includes(party.country ?? "")
    ? [city, `${state} ${postal}`.trim()].filter(Boolean).join(", ")
    : [`${postal} ${city}`.trim(), state].filter(Boolean).join(", ");

  return [party.address_line1, party.address_line2, locality, party.country ? countryName(party.country) : null].filter(
    (line): line is string => Boolean(line),
  );
}

const quantity = (value: string) => String(Number(value));

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</div>;
}

/**
 * The invoice as the client sees it, on screen. Kept in step with the PDF
 * template (backend resources/views/pdf/invoice.blade.php).
 */
export function InvoiceDocument({ invoice, className }: { invoice: Invoice; className?: string }) {
  const money = (amount: string | number) => formatMoney(amount, invoice.currency);
  const { from, to } = invoice;
  const status = invoice.display_status;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-white p-6 text-[13px] text-slate-800 shadow-sm ring-1 ring-black/5 sm:p-10 dark:bg-white", className)}>
      {status === "void" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 text-8xl font-bold tracking-widest text-rose-500/15">VOID</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-6">
        {from.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={from.logo_url} alt="" className="max-h-14 max-w-48 object-contain" />
        ) : (
          <div className="text-lg font-bold text-slate-900">{from.name}</div>
        )}
        <div className="text-right">
          <div className="text-3xl font-bold tracking-wide text-slate-900">INVOICE</div>
          <div className="mt-1 font-mono text-sm">{invoice.number}</div>
          <div className="mt-2">
            <StatusPill status={status} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <Label>From</Label>
          <div className="font-semibold text-slate-900">{from.name}</div>
          {addressLines(from).map((line) => (
            <div key={line}>{line}</div>
          ))}
          {from.email && <div>{from.email}</div>}
          {from.phone && <div>{from.phone}</div>}
          {from.tax_id && <div className="text-slate-500">Tax ID: {from.tax_id}</div>}
        </div>
        <div>
          <Label>Bill to</Label>
          <div className="font-semibold text-slate-900">{to.company || to.name}</div>
          {to.company && to.name && <div>Attn: {to.name}</div>}
          {addressLines(to).map((line) => (
            <div key={line}>{line}</div>
          ))}
          {to.email && <div>{to.email}</div>}
          {to.tax_id && <div className="text-slate-500">Tax ID: {to.tax_id}</div>}
        </div>
        <div className="sm:text-right">
          <Label>Issue date</Label>
          <div className="mb-2">{formatDate(invoice.issue_date)}</div>
          <Label>Due date</Label>
          <div className="mb-2">{formatDate(invoice.due_date)}</div>
          <Label>Amount due</Label>
          <div className="text-lg font-bold text-indigo-600">{money(status === "paid" ? 0 : invoice.total)}</div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-2 text-left font-semibold">Description</th>
              <th className="px-2 py-2 text-right font-semibold">Qty</th>
              <th className="px-2 py-2 text-right font-semibold">Unit price</th>
              <th className="py-2 pl-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => (
              <tr key={item.id ?? index} className="border-b border-slate-200 align-top">
                <td className="py-2.5 pr-2">{item.description}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {quantity(item.quantity)}
                  {item.unit ? ` ${item.unit}` : ""}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">{money(item.unit_price)}</td>
                <td className="py-2.5 pl-2 text-right tabular-nums">{money(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 ml-auto grid w-full max-w-xs gap-1.5 tabular-nums">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="text-slate-800">{money(invoice.subtotal)}</span>
        </div>
        {Number(invoice.discount_total) > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Discount{invoice.discount_type === "percent" ? ` (${Number(invoice.discount_value)}%)` : ""}</span>
            <span className="text-slate-800">-{money(invoice.discount_total)}</span>
          </div>
        )}
        {invoice.reverse_charge ? (
          <div className="flex justify-between text-slate-500">
            <span>VAT (reverse charge)</span>
            <span className="text-slate-800">{money(0)}</span>
          </div>
        ) : (
          Number(invoice.tax_rate) > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Tax ({Number(invoice.tax_rate)}%)</span>
              <span className="text-slate-800">{money(invoice.tax_total)}</span>
            </div>
          )
        )}
        <div className="mt-1 flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold text-slate-900">
          <span>Total {invoice.currency}</span>
          <span>{money(invoice.total)}</span>
        </div>
        {status === "paid" && invoice.paid_at && (
          <div className="flex justify-between text-emerald-600">
            <span>Paid {formatDate(invoice.paid_at, { month: "short" })}</span>
            <span>-{money(invoice.total)}</span>
          </div>
        )}
      </div>

      {invoice.reverse_charge && (
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-slate-600">
          Reverse charge: VAT to be accounted for by the recipient (Article 196, Council Directive 2006/112/EC).
        </div>
      )}
      {invoice.notes && (
        <div className="mt-6 rounded-lg bg-slate-50 p-3">
          <Label>Notes</Label>
          <p className="whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
      {invoice.footer && <p className="mt-5 whitespace-pre-line text-slate-500">{invoice.footer}</p>}
    </div>
  );
}
