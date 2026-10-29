import Icon from "@/components/shared/icon";
import type { IconSvgElement } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function SubmitButton({
  label = "Submit",
  loading = false,
  className,
  icon: glyph = Loading03Icon,
  ...props
}: React.ComponentProps<typeof Button> & {
  label?: string;
  loading?: boolean;
  className?: string;
  icon?: IconSvgElement;
}) {
  return (
    <Button
      type="submit"
      disabled={loading}
      {...props}
      className={cn("flex items-center gap-2", className)}
    >
      {loading && <Icon icon={glyph} className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
