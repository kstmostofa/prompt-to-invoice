"use client";

import { DetailCard } from "@/components/shared/detail-card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import InputError from "../shared/input-error";
import InputPassword from "../shared/input-password";
import SubmitButton from "../shared/submit-button";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login } from "@/lib/auth";
import Link from "next/link";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);

    try {
      const result = await login(data);

      if (!result?.success) {
        toast.error(result?.message || "Invalid credentials");
        return;
      }

      toast.success("Login successful");
      // Only follow same-origin path callbacks; otherwise "/" sends staff to
      // the admin portal and everyone else to their workspace.
      const callbackUrl = searchParams.get("callbackUrl");
      router.push(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/");
      router.refresh();
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DetailCard title="Sign in">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register("email")}
            />
            <InputError message={errors.email?.message} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <InputPassword
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            <InputError message={errors.password?.message} />
          </div>
          <SubmitButton className="w-full" loading={loading} label="Sign in" />
        </div>
      </DetailCard>
    </form>
  );
}
