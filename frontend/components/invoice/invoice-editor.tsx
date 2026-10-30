"use client";

import { ClientForm } from "@/app/(portal)/clients/form";
import { DetailCard } from "@/components/shared/detail-card";
import Icon from "@/components/shared/icon";
import InputError from "@/components/shared/input-error";
import SelectInput from "@/components/shared/select-input";
import SubmitButton from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { applyFieldErrors } from "@/lib/form-errors";
import { formatMoney } from "@/lib/helper";
import { createInvoice, updateInvoice } from "@/lib/invoices";
import { canManageWorkspace } from "@/lib/utils";
import type { ClientOption, Invoice, InvoiceDefaults, InvoiceDraft, InvoicePayload } from "@/types/api";
import { ValidationError } from "@/types/global";
import { Alert02Icon, Delete02Icon, PlusSignIcon, SparklesIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { previewTotals } from "./invoice-math";

const number = (message: string) => z.string().trim().regex(/^\d+(\.\d{1,2})?$/, message);

const editorSchema = z
  .object({
    client_id: z.string().min(1, "Choose who this invoice is for"),
    issue_date: z.string().min(1, "Required"),
    due_date: z.string().min(1, "Required"),
    currency: z.enum(["USD", "EUR"]),
    discount_type: z.enum(["none", "percent", "amount"]),
    discount_value: z.string(),
    tax_rate: number("A percentage, like 19 or 8.25"),
    reverse_charge: z.boolean(),
    notes: z.string().max(2000),
    footer: z.string().max(2000),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Describe the work").max(500),
          quantity: number("A number, up to 2 decimals").refine((value) => Number(value) > 0, "More than zero"),
          unit: z.string().max(20),
          unit_price: number("An amount, like 120 or 99.50"),
        }),
      )
      .min(1, "Add at least one line"),
  })
  .refine((data) => data.due_date >= data.issue_date, { message: "Cannot be before the issue date", path: ["due_date"] })
  .refine((data) => data.discount_type === "none" || /^\d+(\.\d{1,2})?$/.test(data.discount_value.trim()), {
    message: "Enter a discount",
    path: ["discount_value"],
  })
  .refine((data) => data.discount_type !== "percent" || Number(data.discount_value) <= 100, {
    message: "No more than 100%",
    path: ["discount_value"],
  })
  .refine((data) => Number(data.tax_rate) <= 100, { message: "No more than 100%", path: ["tax_rate"] });

type EditorData = z.infer<typeof editorSchema>;

const FIELDS = [
  "client_id",
  "issue_date",
  "due_date",
  "currency",
  "discount_value",
  "tax_rate",
  "notes",
  "footer",
  "items",
] as const;

const emptyLine = { description: "", quantity: "1", unit: "", unit_price: "" };

function initialValues(defaults: InvoiceDefaults, invoice?: Invoice | null, draft?: InvoiceDraft | null): EditorData {
  if (draft) {
    return {
      client_id: draft.client_id ? String(draft.client_id) : "",
      issue_date: draft.issue_date,
      due_date: draft.due_date,
      currency: draft.currency,
      discount_type: draft.discount_type ?? "none",
      discount_value: draft.discount_value !== null ? String(draft.discount_value) : "",
      tax_rate: String(draft.tax_rate),
      reverse_charge: draft.reverse_charge,
      notes: draft.notes ?? "",
      footer: draft.footer ?? defaults.footer ?? "",
      items: draft.items.map((item) => ({
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit ?? "",
        unit_price: String(item.unit_price),
      })),
    };
  }

  if (invoice) {
    return {
      client_id: invoice.client_id ? String(invoice.client_id) : "",
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      currency: invoice.currency,
      discount_type: invoice.discount_type ?? "none",
      discount_value: invoice.discount_type ? String(Number(invoice.discount_value)) : "",
      tax_rate: String(Number(invoice.tax_rate)),
      reverse_charge: invoice.reverse_charge,
      notes: invoice.notes ?? "",
      footer: invoice.footer ?? "",
      items: (invoice.items ?? []).map((item) => ({
        description: item.description,
        quantity: String(Number(item.quantity)),
        unit: item.unit ?? "",
        unit_price: String(Number(item.unit_price)),
      })),
    };
  }

  return {
    client_id: "",
    issue_date: defaults.issue_date,
    due_date: defaults.due_date,
    currency: defaults.currency,
    discount_type: "none",
    discount_value: "",
    tax_rate: String(Number(defaults.tax_rate)),
    reverse_charge: false,
    notes: "",
    footer: defaults.footer ?? "",
    items: [emptyLine],
  };
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

interface InvoiceEditorProps {
  defaults: InvoiceDefaults;
  clients: ClientOption[];
  invoice?: Invoice | null;
  /** An unsaved AI draft to start from. */
  draft?: InvoiceDraft | null;
}

/**
 * Create or edit an invoice. Totals update as you type, using the same
 * rounding as the API; the API recalculates on save and its numbers count.
 */
export function InvoiceEditor({ defaults, clients: initialClients, invoice, draft }: InvoiceEditorProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState(initialClients);
  const router = useRouter();
  const { data: session } = useSession();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<EditorData>({
    resolver: zodResolver(editorSchema),
    defaultValues: initialValues(defaults, invoice, draft),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const [items, currency, discountType, discountValue, taxRate, reverseCharge] = useWatch({
    control,
    name: ["items", "currency", "discount_type", "discount_value", "tax_rate", "reverse_charge"],
  });
  const totals = previewTotals(items, discountType === "none" ? null : discountType, discountValue || 0, taxRate || 0, reverseCharge);
  const money = (cents: number) => formatMoney(cents / 100, currency);

  const clientOptions = clients.map((client) => ({
    value: String(client.id),
    label: client.company ? `${client.name} · ${client.company}` : client.name,
    keywords: [client.email ?? "", client.company ?? ""],
  }));

  const chooseClient = (id: string) => {
    setValue("client_id", id, { shouldValidate: true });
    // A client with their own currency gets invoiced in it.
    const client = clients.find((option) => String(option.id) === id);
    if (client?.currency) setValue("currency", client.currency);
  };

  const onSubmit = async (data: EditorData) => {
    setLoading(true);
    const payload: InvoicePayload = {
      client_id: Number(data.client_id),
      issue_date: data.issue_date,
      due_date: data.due_date,
      currency: data.currency,
      discount_type: data.discount_type === "none" ? null : data.discount_type,
      discount_value: data.discount_type === "none" ? 0 : Number(data.discount_value),
      tax_rate: Number(data.tax_rate),
      reverse_charge: data.reverse_charge,
      notes: data.notes.trim() || null,
      footer: data.footer.trim() || null,
      source_prompt: draft?.source_prompt ?? invoice?.source_prompt ?? null,
      items: data.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unit: item.unit.trim() || null,
        unit_price: Number(item.unit_price),
      })),
    };

    try {
      const response = invoice ? await updateInvoice(invoice.id, payload) : await createInvoice(payload);

      if ((response as ValidationError).errors) {
        // "items.0.quantity" is shown on the line; anything else by field.
        const lineErrors: Record<string, string[]> = {};
        for (const [field, messages] of Object.entries((response as ValidationError).errors)) {
          const line = field.match(/^items\.(\d+)\.(description|quantity|unit|unit_price)$/);
          if (line) {
            setError(`items.${Number(line[1])}.${line[2] as "description"}`, { type: "server", message: messages[0] });
          } else {
            lineErrors[field] = messages;
          }
        }
        const unmapped = applyFieldErrors(lineErrors, FIELDS, setError);
        toast.error(unmapped[0] ?? "Check the highlighted fields.");
        return;
      }

      const saved = (response as { data: Invoice }).data;
      toast.success(invoice ? "Invoice saved" : `Invoice ${saved.number} created`);
      router.push(`/invoices/${saved.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to save the invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <div className="grid min-w-0 gap-4">
        {draft && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Icon icon={SparklesIcon} className="size-4 text-primary" />
              Drafted from your description. Check it, then save.
            </div>
            <p className="mt-1 line-clamp-2 text-muted-foreground">&ldquo;{draft.source_prompt}&rdquo;</p>
            {draft.warnings.length > 0 && (
              <ul className="mt-3 grid gap-1.5">
                {draft.warnings.map((warning) => (
                  <li key={warning} className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                    <Icon icon={Alert02Icon} className="mt-0.5 size-4 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <DetailCard title="Bill to">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-2">
              <Controller
                control={control}
                name="client_id"
                render={({ field }) => <SelectInput title="Search clients..." options={clientOptions} value={field.value} onValueChange={chooseClient} />}
              />
              <InputError message={errors.client_id?.message} />
              {draft?.suggested_client && !clients.some((client) => client.name === draft.suggested_client?.name) && (
                <p className="text-sm text-muted-foreground">
                  New client in the description:{" "}
                  <span className="font-medium text-foreground">
                    {[draft.suggested_client.name, draft.suggested_client.company].filter(Boolean).join(", ")}
                  </span>
                  . Use <span className="font-medium">New client</span> to add them, already filled in.
                </p>
              )}
            </div>
            <ClientForm
              trigger={
                <Button type="button" variant="outline">
                  <Icon icon={UserAdd01Icon} />
                  New client
                </Button>
              }
              initial={
                draft?.suggested_client
                  ? {
                      name: draft.suggested_client.name ?? undefined,
                      company: draft.suggested_client.company,
                      email: draft.suggested_client.email,
                    }
                  : undefined
              }
              onSaved={(client) => {
                setClients((current) => [...current, { id: client.id, name: client.name, company: client.company, email: client.email, currency: client.currency }]);
                chooseClient(String(client.id));
              }}
            />
          </div>
        </DetailCard>

        <DetailCard title="Line items">
          <div className="grid gap-3">
            <div className="hidden grid-cols-[1fr_5.5rem_5rem_7.5rem_7rem_2.25rem] gap-2 text-xs font-medium text-muted-foreground md:grid">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Unit price</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            {fields.map((field, index) => {
              const lineErrors = errors.items?.[index];
              return (
                <div key={field.id} className="grid grid-cols-2 gap-2 rounded-xl border p-3 md:grid-cols-[1fr_5.5rem_5rem_7.5rem_7rem_2.25rem] md:items-start md:rounded-none md:border-0 md:p-0">
                  <div className="col-span-2 md:col-span-1">
                    <Input aria-label="Description" placeholder="What you did" {...register(`items.${index}.description`)} />
                    <InputError message={lineErrors?.description?.message} />
                  </div>
                  <div>
                    <Input aria-label="Quantity" inputMode="decimal" {...register(`items.${index}.quantity`)} />
                    <InputError message={lineErrors?.quantity?.message} />
                  </div>
                  <div>
                    <Input aria-label="Unit" placeholder="h, day" {...register(`items.${index}.unit`)} />
                  </div>
                  <div>
                    <Input aria-label="Unit price" inputMode="decimal" placeholder="0.00" {...register(`items.${index}.unit_price`)} />
                    <InputError message={lineErrors?.unit_price?.message} />
                  </div>
                  <div className="flex h-9 items-center justify-end tabular-nums">{money(totals.lines[index] ?? 0)}</div>
                  <Button type="button" variant="ghost" size="icon" title="Remove line" disabled={fields.length === 1} onClick={() => remove(index)}>
                    <Icon icon={Delete02Icon} />
                  </Button>
                </div>
              );
            })}
            <InputError message={errors.items?.message ?? errors.items?.root?.message} />
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine)} disabled={fields.length >= 100}>
                <Icon icon={PlusSignIcon} />
                Add line
              </Button>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Notes">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Note to the client</Label>
              <Textarea id="notes" rows={4} placeholder="Thanks for the project!" {...register("notes")} />
              <InputError message={errors.notes?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer">Footer</Label>
              <Textarea id="footer" rows={4} placeholder="Payment details, terms..." {...register("footer")} />
              <InputError message={errors.footer?.message} />
            </div>
          </div>
        </DetailCard>
      </div>

      <div className="grid content-start gap-4 xl:sticky xl:top-2">
        <DetailCard title="Details" description={invoice ? invoice.number : `Will be ${defaults.next_number}`}>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  {...register("issue_date", {
                    // Moving the issue date keeps the payment terms.
                    onChange: (event) => {
                      if (!invoice && event.target.value) setValue("due_date", addDays(event.target.value, defaults.payment_terms_days));
                    },
                  })}
                />
                <InputError message={errors.issue_date?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" type="date" {...register("due_date")} />
                <InputError message={errors.due_date?.message} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 14, 30, 60].map((days) => (
                <Button key={days} type="button" size="xs" variant="outline" onClick={() => setValue("due_date", addDays(getValues("issue_date"), days), { shouldValidate: true })}>
                  {days === 0 ? "On receipt" : `Net ${days}`}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD $</SelectItem>
                      <SelectItem value="EUR">EUR €</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Totals">
          <div className="grid gap-4">
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount</Label>
                <Controller
                  control={control}
                  name="discount_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                      <SelectTrigger id="discount_type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No discount</SelectItem>
                        <SelectItem value="percent">Percent</SelectItem>
                        <SelectItem value="amount">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">{discountType === "percent" ? "%" : "Amount"}</Label>
                <Input id="discount_value" inputMode="decimal" disabled={discountType === "none"} {...register("discount_value")} />
              </div>
            </div>
            <InputError message={errors.discount_value?.message} />
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax rate (%)</Label>
              <Input id="tax_rate" inputMode="decimal" disabled={reverseCharge} {...register("tax_rate")} />
              <InputError message={errors.tax_rate?.message} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>EU reverse charge</Label>
                <p className="text-xs text-muted-foreground">B2B in another EU country: no VAT charged.</p>
              </div>
              <Controller control={control} name="reverse_charge" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            </div>

            <div className="grid gap-1.5 border-t pt-4 text-sm tabular-nums">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{money(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-foreground">-{money(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{reverseCharge ? "VAT (reverse charge)" : "Tax"}</span>
                <span className="text-foreground">{money(totals.tax)}</span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{money(totals.total)}</span>
              </div>
            </div>

            <SubmitButton className="w-full" loading={loading} label={invoice ? "Save invoice" : "Create draft"} />
            {!invoice && defaults.usage.limit !== null && (
              <p className="text-center text-xs text-muted-foreground">
                {defaults.usage.used} of {defaults.usage.limit} invoices used this month
                {canManageWorkspace(session?.user) && (
                  <>
                    {" · "}
                    <Link href="/settings/billing" className="text-primary underline-offset-4 hover:underline">
                      Upgrade
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>
        </DetailCard>
      </div>
    </form>
  );
}
