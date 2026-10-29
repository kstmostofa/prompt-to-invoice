"use client";

import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  Edit03Icon,
  MoreHorizontalIcon,
  SentIcon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import ConfirmationModal from "@/components/shared/confirmation-modal";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteInvoice,
  duplicateInvoice,
  markInvoicePaid,
  markInvoiceSent,
  markInvoiceUnpaid,
  voidInvoice,
} from "@/lib/invoices";
import { Invoice } from "@/types/api";
import { ValidationError } from "@/types/global";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Pending = "void" | "delete" | "paid" | null;

const today = () => new Date().toISOString().slice(0, 10);

export function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const [pending, setPending] = useState<Pending>(null);
  const [loading, setLoading] = useState(false);
  const [paidOn, setPaidOn] = useState(today);
  const router = useRouter();

  const editable = invoice.status === "draft" || invoice.status === "sent";

  /**
   * Run an action. A 422 comes back as a body ({errors} from validation, or
   * just {success: false, message} from a refusal); anything else throws.
   */
  const run = async (action: () => Promise<unknown>, success: string, then?: (result: unknown) => void) => {
    setLoading(true);
    try {
      const result = (await action()) as Partial<ValidationError> & { success?: boolean } | null;
      if (result && (result.errors || result.success === false)) {
        toast.error(Object.values(result.errors ?? {}).flat()[0] ?? result.message ?? "That could not be done.");
        return;
      }
      toast.success(success);
      if (then) then(result);
      else router.refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setPending(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {invoice.status === "draft" && (
        <Button disabled={loading} onClick={() => run(() => markInvoiceSent(invoice.id), "Marked as sent")}>
          <Icon icon={SentIcon} />
          Mark as sent
        </Button>
      )}
      {editable && invoice.status !== "draft" && (
        <Button disabled={loading} onClick={() => setPending("paid")}>
          <Icon icon={CheckmarkCircle02Icon} />
          Record payment
        </Button>
      )}
      <Button variant="outline" render={<a href={`/invoices/${invoice.id}/pdf`} />}>
        <Icon icon={Download04Icon} />
        PDF
      </Button>
      {editable && (
        <Button variant="outline" render={<Link href={`/invoices/${invoice.id}/edit`} />}>
          <Icon icon={Edit03Icon} />
          Edit
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="More actions" />}>
          <Icon icon={MoreHorizontalIcon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            {invoice.status === "draft" && (
              <DropdownMenuItem onClick={() => setPending("paid")}>
                <Icon icon={CheckmarkCircle02Icon} />
                Record payment
              </DropdownMenuItem>
            )}
            {invoice.status === "paid" && (
              <DropdownMenuItem onClick={() => run(() => markInvoiceUnpaid(invoice.id), "Payment removed")}>
                <Icon icon={Undo02Icon} />
                Mark as unpaid
              </DropdownMenuItem>
            )}
            <DropdownMenuItem render={<a href={`/invoices/${invoice.id}/pdf?inline=1`} target="_blank" rel="noopener" />}>
              <Icon icon={Download04Icon} />
              Open PDF in new tab
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(
                  () => duplicateInvoice(invoice.id),
                  "Duplicated as a new draft",
                  (result) => {
                    const copy = (result as { data: Invoice }).data;
                    router.push(`/invoices/${copy.id}/edit`);
                  },
                )
              }
            >
              <Icon icon={Copy01Icon} />
              Duplicate
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {(editable || invoice.status === "draft") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {invoice.status === "draft" ? (
                  <DropdownMenuItem variant="destructive" onClick={() => setPending("delete")}>
                    <Icon icon={Delete02Icon} />
                    Delete draft
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem variant="destructive" onClick={() => setPending("void")}>
                    <Icon icon={Cancel01Icon} />
                    Void invoice
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {pending === "paid" && (
        <ConfirmationModal
          loading={loading}
          open
          onOpenChange={(open) => !open && setPending(null)}
          onConfirm={() => run(() => markInvoicePaid(invoice.id, paidOn), "Payment recorded")}
          title="Record payment"
          description={`Mark ${invoice.number} as paid in full (${invoice.total} ${invoice.currency}).`}
          confirmButtonText="Mark as paid"
        >
          <div className="space-y-2">
            <Label htmlFor="paid_on">Paid on</Label>
            <Input id="paid_on" type="date" max={today()} value={paidOn} onChange={(event) => setPaidOn(event.target.value)} />
          </div>
        </ConfirmationModal>
      )}
      {pending === "void" && (
        <ConfirmationModal
          loading={loading}
          open
          onOpenChange={(open) => !open && setPending(null)}
          onConfirm={() => run(() => voidInvoice(invoice.id), "Invoice voided")}
          title="Void invoice"
          description={`${invoice.number} stays on record, marked void, and can no longer be paid or edited.`}
          confirmButtonText="Yes, void it"
          confirmButtonType="destructive"
        />
      )}
      {pending === "delete" && (
        <ConfirmationModal
          loading={loading}
          open
          onOpenChange={(open) => !open && setPending(null)}
          onConfirm={() => run(() => deleteInvoice(invoice.id), "Draft deleted", () => router.push("/invoices"))}
          title="Delete draft"
          description={`Delete ${invoice.number}? This cannot be undone.`}
          confirmButtonText="Yes, delete"
          confirmButtonType="destructive"
        />
      )}
    </div>
  );
}
