"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import InputPassword from "@/components/shared/input-password";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/password";
import { ValidationError } from "@/types/global";

export function ResetPasswordForm({
  token,
  email,
  invite,
}: {
  token: string;
  email: string;
  invite: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      setErrors({ password: ["The two passwords do not match."] });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      });
      if ((response as ValidationError).errors) {
        setErrors((response as ValidationError).errors);
        return;
      }
      toast.success(invite ? "Welcome aboard. Sign in with your new password." : response.message);
      router.push("/login");
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // A token that is used, expired or made up comes back as an email error.
  const linkError = errors.email?.[0];

  return (
    <form onSubmit={submit}>
      <DetailCard
        title={invite ? "Accept invitation" : "New password"}
      >
        <div className="space-y-5">
          {linkError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {linkError}{" "}
              <Link href="/forgot-password" className="font-medium underline">
                Send a new link
              </Link>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <InputPassword
              id="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <InputError message={errors.password?.join(" ")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <InputPassword
              id="password_confirmation"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <SubmitButton
            className="w-full"
            loading={loading}
            label={invite ? "Set password and join" : "Save new password"}
          />
        </div>
      </DetailCard>
    </form>
  );
}
