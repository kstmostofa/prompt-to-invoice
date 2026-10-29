"use client";

import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyFieldErrors } from "@/lib/form-errors";
import { formatDate, formatMoney } from "@/lib/helper";
import { emailInvoice } from "@/lib/invoices";
import { Invoice } from "@/types/api";
import { ValidationError } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const schema = z.object({
  to: z.email("Enter the client's email address"),
  cc: z.string().refine(
    (value) => value.split(",").map((part) => part.trim()).filter(Boolean).every((part) => z.email().safeParse(part).success),
    "Separate addresses with commas",
  ),
  subject: z.string().min(1, "Required").max(200),
  message: z.string().min(1, "Required").max(5000),
});

type EmailFormData = z.infer<typeof schema>;

function defaultMessage(invoice: Invoice): string {
  const greeting = invoice.to.name ? `Hi ${invoice.to.name.split(" ")[0]},` : "Hello,";
  const amount = formatMoney(invoice.total, invoice.currency);
  const body =
    invoice.status === "paid"
      ? `Thank you for your payment of ${amount} for invoice ${invoice.number}. A copy is attached for your records.`
      : `Please find attached invoice ${invoice.number} for ${amount}, due ${formatDate(invoice.due_date)}.`;
  return `${greeting}\n\n${body}\n\nThank you,\n${invoice.from.name ?? ""}`;
}

interface EmailDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDialog({ invoice, open, onOpenChange }: EmailDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      to: invoice.last_emailed_to ?? invoice.to.email ?? "",
      cc: "",
      subject: `Invoice ${invoice.number} from ${invoice.from.name ?? ""}`.trim(),
      message: defaultMessage(invoice),
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const response = await emailInvoice(invoice.id, {
        to: data.to.trim(),
        cc: data.cc.split(",").map((part) => part.trim()).filter(Boolean),
        subject: data.subject,
        message: data.message,
      });
      if ((response as ValidationError).errors) {
        const errors = Object.fromEntries(
          Object.entries((response as ValidationError).errors).map(([field, messages]) => [field.split(".")[0], messages]),
        );
        const unmapped = applyFieldErrors(errors, ["to", "cc", "subject", "message"], setError);
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }
      toast.success(`Invoice emailed to ${data.to}`);
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Could not send the email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Email {invoice.number}</DialogTitle>
            <DialogDescription>The PDF is attached, with a link to view the invoice online.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="email-to">To</Label>
            <Input id="email-to" type="email" {...register("to")} />
            <InputError message={errors.to?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-cc">Cc</Label>
            <Input id="email-cc" placeholder="Optional, comma separated" {...register("cc")} />
            <InputError message={errors.cc?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" {...register("subject")} />
            <InputError message={errors.subject?.message} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-message">Message</Label>
            <Textarea id="email-message" rows={7} {...register("message")} />
            <InputError message={errors.message?.message} />
          </div>
          <DialogFooter className="gap-2">
            <DialogClose render={<Button type="button" variant="secondary" />}>Cancel</DialogClose>
            <SubmitButton loading={loading} label={invoice.status === "draft" ? "Send invoice" : "Send again"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
