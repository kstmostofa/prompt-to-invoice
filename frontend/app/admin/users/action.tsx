"use client";

import ConfirmationModal from "@/components/shared/confirmation-modal";
import { Button } from "@/components/ui/button";
import { activateUser, deactivateUser } from "@/lib/admin";
import { User } from "@/types/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function UserAction({ user }: { user: User }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Nobody switches off their own account.
  if (session?.user?.id === String(user.id)) {
    return <div className="text-right text-xs text-muted-foreground">You</div>;
  }

  const toggle = async () => {
    setLoading(true);
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
        toast.success(`${user.name} deactivated`);
      } else {
        await activateUser(user.id);
        toast.success(`${user.name} reactivated`);
      }
      router.refresh();
    } catch {
      toast.error("Could not change this account.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Button size="sm" variant={user.is_active ? "outline" : "default"} onClick={() => setConfirming(true)}>
        {user.is_active ? "Deactivate" : "Reactivate"}
      </Button>
      {confirming && (
        <ConfirmationModal
          loading={loading}
          open={confirming}
          onOpenChange={setConfirming}
          onConfirm={toggle}
          title={user.is_active ? "Deactivate account" : "Reactivate account"}
          description={
            user.is_active
              ? `${user.name} is signed out everywhere and cannot sign in until reactivated.`
              : `${user.name} will be able to sign in again.`
          }
          confirmButtonText={user.is_active ? "Yes, deactivate" : "Yes, reactivate"}
          confirmButtonType={user.is_active ? "destructive" : "default"}
        />
      )}
    </div>
  );
}
