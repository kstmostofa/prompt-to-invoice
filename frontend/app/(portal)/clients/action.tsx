"use client";
import Icon from "@/components/shared/icon";
import { Delete02Icon, Edit03Icon, ViewIcon } from "@hugeicons/core-free-icons";
import ConfirmationModal from "@/components/shared/confirmation-modal";
import { Button } from "@/components/ui/button";
import { deleteClient } from "@/lib/clients";
import { Client } from "@/types/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ClientForm } from "./form";

export default function ClientAction({ client }: { client: Client }) {
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteClient(client.id);
      toast.success("Client deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete the client. Please try again.");
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button size="icon-sm" variant="outline" title="View client" render={<Link href={`/clients/${client.id}`} />}>
          <Icon icon={ViewIcon} />
        </Button>
        <ClientForm
          trigger={
            <Button size="icon-sm" variant="outline" title="Edit client">
              <Icon icon={Edit03Icon} />
            </Button>
          }
          client={client}
        />
        <Button size="icon-sm" variant="destructive" onClick={() => setDeleting(true)} title="Delete client">
          <Icon icon={Delete02Icon} />
        </Button>
      </div>

      {deleting && (
        <ConfirmationModal
          loading={loading}
          open={deleting}
          onOpenChange={setDeleting}
          onConfirm={handleDelete}
          title="Delete client"
          description={`Delete ${client.name}? Invoices already sent to them keep their details.`}
          confirmButtonText="Yes, delete client"
          confirmButtonType="destructive"
        />
      )}
    </>
  );
}
