"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import InputPassword from "@/components/shared/input-password";
import SubmitButton from "@/components/shared/submit-button";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/password";
import { ValidationError } from "@/types/global";

const EMPTY = { current_password: "", password: "", password_confirmation: "" };

export function ChangePasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (values.password !== values.password_confirmation) {
      setErrors({ password: ["The two new passwords do not match."] });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await changePassword(values);
      if ((response as ValidationError).errors) {
        setErrors((response as ValidationError).errors);
        return;
      }
      toast.success(response.message);
      setValues(EMPTY);
    } catch {
      toast.error("Could not change the password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <DetailCard
        title="Password"
        description="Changing it signs you out on every other device."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current password</Label>
            <InputPassword
              id="current_password"
              autoComplete="current-password"
              required
              value={values.current_password}
              onChange={set("current_password")}
            />
            <InputError message={errors.current_password?.join(" ")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_password">New password</Label>
              <InputPassword
                id="new_password"
                autoComplete="new-password"
                required
                value={values.password}
                onChange={set("password")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password_confirmation">Confirm new password</Label>
              <InputPassword
                id="new_password_confirmation"
                autoComplete="new-password"
                required
                value={values.password_confirmation}
                onChange={set("password_confirmation")}
              />
            </div>
          </div>
          <InputError message={errors.password?.join(" ")} />
          <div className="flex justify-end">
            <SubmitButton loading={loading} label="Change password" className="w-fit" />
          </div>
        </div>
      </DetailCard>
    </form>
  );
}
