"use client";

import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import InputPassword from "@/components/shared/input-password";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { register as registerAccount } from "@/lib/auth";
import { applyFieldErrors } from "@/lib/form-errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const registerSchema = z
  .object({
    name: z.string().min(1, "Your name is required").max(255),
    email: z.email("Invalid email address"),
    workspace_name: z.string().min(1, "Your business name is required").max(255),
    currency: z.enum(["USD", "EUR"]),
    password: z.string().min(8, "At least 8 characters"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "The passwords do not match",
    path: ["password_confirmation"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const FIELDS = ["name", "email", "workspace_name", "currency", "password", "password_confirmation"] as const;

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { currency: "USD" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const result = await registerAccount(data);
      if (!result.success) {
        const unmapped = result.errors
          ? applyFieldErrors(result.errors, FIELDS, setError)
          : [result.message];
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }
      toast.success("Welcome to PromptToInvoice");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DetailCard title="Create your account">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" autoComplete="name" placeholder="Jane Doe" {...register("name")} />
            <InputError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
            <InputError message={errors.email?.message} />
          </div>
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-2">
              <Label htmlFor="workspace_name">Business name</Label>
              <Input id="workspace_name" autoComplete="organization" placeholder="Doe Design Studio" {...register("workspace_name")} />
              <InputError message={errors.workspace_name?.message} />
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
              <InputError message={errors.currency?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <InputPassword id="password" autoComplete="new-password" placeholder="At least 8 characters" {...register("password")} />
            <InputError message={errors.password?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <InputPassword id="password_confirmation" autoComplete="new-password" {...register("password_confirmation")} />
            <InputError message={errors.password_confirmation?.message} />
          </div>
          <SubmitButton className="w-full" loading={loading} label="Create account" />
        </div>
      </DetailCard>
    </form>
  );
}
