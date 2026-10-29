"use client";

import { MailSend01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { toast } from "sonner";
import { DetailCard } from "@/components/shared/detail-card";
import Icon from "@/components/shared/icon";
import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/password";
import { ValidationError } from "@/types/global";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const response = await requestPasswordReset(email.trim());
      if ((response as ValidationError).errors) {
        setError(Object.values((response as ValidationError).errors).flat()[0]);
        return;
      }
      setSentTo(email.trim());
    } catch {
      toast.error("Too many attempts, or the server could not be reached. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    // The same answer whether or not the address has an account.
    return (
      <DetailCard title="Check your inbox">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon icon={MailSend01Icon} className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            If <span className="font-medium text-foreground">{sentTo}</span> has an account, a link to reset the password is on its way. It works for 60 minutes.
          </p>
        </div>
      </DetailCard>
    );
  }

  return (
    <form onSubmit={submit}>
      <DetailCard title="Reset password">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <InputError message={error} />
          </div>
          <SubmitButton className="w-full" loading={loading} label="Send reset link" />
        </div>
      </DetailCard>
    </form>
  );
}
