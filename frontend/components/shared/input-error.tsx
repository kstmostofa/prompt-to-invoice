import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export default function InputError({
  message,
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string | { message?: string } }) {
  const displayMessage = typeof message === "string" ? message : message?.message;

  return displayMessage ? (
    <p {...props} className={cn("text-sm text-red-600 dark:text-red-400", className)}>
      {displayMessage}
    </p>
  ) : null;
}
