"use client";

import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/account";
import { applyFieldErrors } from "@/lib/form-errors";
import { User } from "@/types/api";
import { ValidationError } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const response = await updateProfile(data);
      if ((response as ValidationError).errors) {
        const unmapped = applyFieldErrors((response as ValidationError).errors, ["name", "email"], setError);
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }
      toast.success("Profile updated");
      reset(data);
      router.refresh();
    } catch {
      toast.error("Failed to update your profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DetailCard title="Profile">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" autoComplete="name" {...register("name")} />
            <InputError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" autoComplete="email" {...register("email")} />
            <InputError message={errors.email?.message} />
          </div>
          <SubmitButton loading={loading} label="Save profile" className={isDirty ? "" : "opacity-60"} />
        </div>
      </DetailCard>
    </form>
  );
}
