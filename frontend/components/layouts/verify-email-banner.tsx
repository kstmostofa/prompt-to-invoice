"use client";

import { Mail01Icon } from "@hugeicons/core-free-icons";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/account";
import { useState } from "react";
import { toast } from "sonner";

/** Shown until the address is verified: sending invoices waits for it. */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    const result = await resendVerification();
    setSending(false);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <span className="flex items-center gap-2">
        <Icon icon={Mail01Icon} className="size-4 shrink-0" />
        Verify {email} to email invoices to clients. Check your inbox for the link.
      </span>
      <Button size="sm" variant="outline" disabled={sending} onClick={resend}>
        {sending ? "Sending..." : "Resend link"}
      </Button>
    </div>
  );
}
