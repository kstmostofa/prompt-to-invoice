"use client";

import { Delete02Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { DetailCard } from "@/components/shared/detail-card";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { deleteLogo, uploadLogo } from "@/lib/workspace";
import { ValidationError } from "@/types/global";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_BYTES = 2 * 1024 * 1024;

export function LogoCard({ logoUrl }: { logoUrl: string | null }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const upload = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("The logo must be 2 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("logo", file);
      const response = await uploadLogo(body);
      if ((response as ValidationError).errors) {
        toast.error(Object.values((response as ValidationError).errors).flat()[0]);
        return;
      }
      toast.success("Logo uploaded");
      router.refresh();
    } catch {
      toast.error("Failed to upload the logo.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteLogo();
      toast.success("Logo removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove the logo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DetailCard title="Logo" description="Shown on your invoices. PNG, JPG, WebP or SVG, up to 2 MB.">
      <div className="grid gap-4">
        <div className="flex aspect-[3/2] items-center justify-center rounded-xl border border-dashed bg-muted/40 p-6">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Business logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-sm text-muted-foreground">No logo yet</span>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => input.current?.click()}>
            <Icon icon={ImageUploadIcon} />
            {logoUrl ? "Replace" : "Upload logo"}
          </Button>
          {logoUrl && (
            <Button type="button" variant="destructive" size="icon" disabled={busy} onClick={remove} title="Remove logo">
              <Icon icon={Delete02Icon} />
            </Button>
          )}
        </div>
      </div>
    </DetailCard>
  );
}
