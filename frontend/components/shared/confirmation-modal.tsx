import Icon from "@/components/shared/icon";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "../ui/dialog";

interface ConfirmationModalProps {
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  confirmButtonType?: "default" | "destructive";
  children?: React.ReactNode;
}

export default function ConfirmationModal({
  loading,
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmation",
  description = "Are you sure you want to proceed?",
  confirmButtonText = "Yes, Confirm",
  confirmButtonType = "destructive",
  children,
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <p>{description}</p>
        {children}
        <DialogFooter className="gap-2">
          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
          <Button
            disabled={loading}
            onClick={onConfirm}
            variant={confirmButtonType}
            className="cursor-pointer"
          >
            {loading && <Icon icon={Loading03Icon} className="mr-2 h-4 w-4 animate-spin" />}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
