"use client";
import Icon from "@/components/shared/icon";
import { Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons";
import ConfirmationModal from "@/components/shared/confirmation-modal";
import { Button } from "@/components/ui/button";
import { deletePlan } from "@/lib/plans";
import { ValidationError } from "@/types/global";
import { Plan } from "@/types/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PlanForm } from "./form";

export default function PlanAction({ plan }: { plan: Plan }) {
  const [deleting, setDeleting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deletePlan(plan.id);
      // The backend refuses to delete a plan that workspaces are on;
      // surface that message instead of a success toast.
      if (response && ((response as ValidationError).errors || (response as { success?: boolean }).success === false)) {
        const messages = Object.values((response as ValidationError).errors ?? {}).flat();
        toast.error(messages.join(" ") || (response as ValidationError).message);
      } else {
        toast.success("Plan deleted successfully");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to delete plan. Please try again.");
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-1">
        <PlanForm
          trigger={
            <Button size="icon-sm" variant="outline" title="Edit Plan">
              <Icon icon={Edit03Icon} />
            </Button>
          }
          plan={plan}
        />
        <Button
          size="icon-sm"
          variant="destructive"
          onClick={() => setDeleting((prev) => !prev)}
          title="Delete Plan"
        >
          <Icon icon={Delete02Icon} />
        </Button>
      </div>

      {deleting && (
        <ConfirmationModal
          loading={loading}
          open={deleting}
          onOpenChange={setDeleting}
          onConfirm={handleDelete}
          title="Delete Plan"
          description="Are you sure you want to delete this plan? Plans that still have workspaces on them cannot be deleted."
          confirmButtonText="Yes, Delete Plan"
          confirmButtonType="destructive"
        />
      )}
    </>
  );
}
