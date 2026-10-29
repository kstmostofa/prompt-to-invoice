"use client";

import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyFieldErrors } from "@/lib/form-errors";
import { updateWorkspace } from "@/lib/workspace";
import { ValidationError } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const schema = z.object({ name: z.string().min(1, "Name is required").max(255) });

export function WorkspaceNameForm({ name }: { name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name } });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    try {
      const response = await updateWorkspace(data);
      if ((response as ValidationError).errors) {
        const unmapped = applyFieldErrors((response as ValidationError).errors, ["name"], setError);
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }
      toast.success("Workspace renamed");
      router.refresh();
    } catch {
      toast.error("Failed to rename the workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DetailCard title="Name" description="Only your team sees this. Invoices show your business profile.">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input id="workspace-name" {...register("name")} />
            <InputError message={errors.name?.message} />
          </div>
          <SubmitButton loading={loading} label="Save" />
        </div>
      </DetailCard>
    </form>
  );
}
