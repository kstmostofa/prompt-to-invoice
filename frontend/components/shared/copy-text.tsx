"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import Icon from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * A value that copies itself when clicked: a hostname, an id, a token.
 * The copy glyph shows on hover and focus, and turns into a tick once done.
 */
export default function CopyText({
  value,
  children,
  className,
}: {
  value: string;
  /** What to show, when it differs from what is copied. */
  children?: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await writeClipboard(value);
    } catch {
      toast.error("Couldn't copy to the clipboard");
      return;
    }

    toast.success(`Copied ${value}`);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Click to copy"
      className={cn(
        "group/copy inline-flex max-w-full items-center gap-1.5 rounded-sm text-left transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className,
      )}
    >
      <span className="truncate">{children ?? value}</span>
      <Icon
        icon={copied ? Tick02Icon : Copy01Icon}
        aria-hidden
        className={cn(
          "size-3.5 shrink-0 transition-opacity",
          copied
            ? "text-emerald-600 dark:text-emerald-400"
            : "opacity-0 group-hover/copy:opacity-70 group-focus-visible/copy:opacity-70",
        )}
      />
    </button>
  );
}

/**
 * The async Clipboard API only exists on secure origins; a portal opened
 * over plain http (a LAN address, a dev host) falls back to the old
 * select-and-copy.
 */
async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();

  const ok = document.execCommand("copy");
  field.remove();

  if (!ok) throw new Error("copy refused");
}
