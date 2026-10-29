"use client";

import { DetailCard } from "@/components/shared/detail-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { switchWorkspace } from "@/lib/account";
import { Workspace } from "@/types/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/** Every workspace you belong to, and which one you are working in. */
export function WorkspaceSwitcher({ workspaces, currentId }: { workspaces: Workspace[]; currentId: number | null }) {
  const [pending, setPending] = useState<number | null>(null);
  const router = useRouter();

  const choose = async (workspace: Workspace) => {
    setPending(workspace.id);
    try {
      await switchWorkspace(workspace.id);
      toast.success(`Now working in ${workspace.name}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Could not switch workspace.");
    } finally {
      setPending(null);
    }
  };

  return (
    <DetailCard title="Workspaces" description="Invoices, clients and settings belong to one workspace.">
      <ul className="divide-y">
        {workspaces.map((workspace) => (
          <li key={workspace.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{workspace.name}</div>
              <div className="text-xs capitalize text-muted-foreground">{workspace.role}</div>
            </div>
            {workspace.id === currentId ? (
              <Badge variant="secondary">Current</Badge>
            ) : (
              <Button size="sm" variant="outline" disabled={pending !== null} onClick={() => choose(workspace)}>
                {pending === workspace.id ? "Switching..." : "Switch"}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </DetailCard>
  );
}
