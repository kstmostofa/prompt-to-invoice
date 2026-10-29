"use client";

import { Layers01Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import ConfirmationModal from "@/components/shared/confirmation-modal";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activateWorkspace, changeWorkspacePlan, suspendWorkspace } from "@/lib/admin";
import { Plan, Workspace } from "@/types/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function WorkspaceActions({ workspace, plans }: { workspace: Workspace; plans: Plan[] }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const suspended = workspace.status === "suspended";

  const toggle = async () => {
    setLoading(true);
    try {
      if (suspended) {
        await activateWorkspace(workspace.id);
        toast.success("Workspace reactivated");
      } else {
        await suspendWorkspace(workspace.id);
        toast.success("Workspace suspended");
      }
      router.refresh();
    } catch {
      toast.error("Could not change the workspace status.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const changePlan = async (planId: number) => {
    try {
      await changeWorkspacePlan(workspace.id, planId);
      toast.success("Plan changed");
      router.refresh();
    } catch {
      toast.error("Could not change the plan.");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={workspace.plan ? String(workspace.plan.id) : undefined} onValueChange={(value) => changePlan(Number(value))}>
        <SelectTrigger className="w-44" aria-label="Plan">
          <Icon icon={Layers01Icon} />
          <SelectValue placeholder="Choose plan" />
        </SelectTrigger>
        <SelectContent>
          {plans.map((plan) => (
            <SelectItem key={plan.id} value={String(plan.id)}>
              {plan.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant={suspended ? "default" : "destructive"} onClick={() => setConfirming(true)}>
        <Icon icon={suspended ? PlayIcon : PauseIcon} />
        {suspended ? "Reactivate" : "Suspend"}
      </Button>

      {confirming && (
        <ConfirmationModal
          loading={loading}
          open={confirming}
          onOpenChange={setConfirming}
          onConfirm={toggle}
          title={suspended ? "Reactivate workspace" : "Suspend workspace"}
          description={
            suspended
              ? `${workspace.name} will be able to sign in and invoice again.`
              : `Everyone in ${workspace.name} loses access until it is reactivated. Their data is kept.`
          }
          confirmButtonText={suspended ? "Yes, reactivate" : "Yes, suspend"}
          confirmButtonType={suspended ? "default" : "destructive"}
        />
      )}
    </div>
  );
}
