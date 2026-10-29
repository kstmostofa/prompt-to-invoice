"use client";

import Icon from "@/components/shared/icon";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InternetIcon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

interface StoreAddressFieldProps extends Omit<
  ComponentProps<"input">,
  "value" | "onChange"
> {
  value: string;
  onValueChange: (value: string) => void;
  /** The platform domain the label is a subdomain of. */
  domain: string;
  /** Whether the current value passes the format rule. */
  valid: boolean;
  /** A server-side error (taken, reserved) shown in place of the format hint. */
  error?: string;
}

/**
 * The subdomain a store will answer on, as one joined field: the label you
 * type, the platform domain fixed after it. Under it, the full address with
 * a live verdict — format only; whether it is free comes back from the API on
 * submit as `error`.
 */
export function StoreAddressField({
  value,
  onValueChange,
  domain,
  valid,
  error,
  className,
  ...props
}: StoreAddressFieldProps) {
  const state = error ? "error" : !value ? "empty" : valid ? "ok" : "invalid";

  return (
    <div className={cn("space-y-2", className)}>
      <InputGroup
        className={cn(
          "h-9 overflow-hidden bg-background ring-1 ring-border transition-[box-shadow,ring-color]",
          state === "ok" && "ring-emerald-500/50",
          (state === "invalid" || state === "error") && "ring-destructive/50",
        )}
      >
        <InputGroupAddon
          align="inline-start"
          className="pl-3 text-muted-foreground"
        >
          <Icon icon={InternetIcon} className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          {...props}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="font-medium"
        />
        <InputGroupAddon
          align="inline-end"
          className="h-full self-stretch py-0 pr-0"
        >
          <InputGroupText className="flex h-full items-center border-l bg-muted px-3.5 text-sm font-normal text-muted-foreground select-none">
            .{domain}
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
          state === "empty" && "bg-muted/60 text-muted-foreground",
          state === "ok" &&
            "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
          state === "invalid" &&
            "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
          state === "error" && "bg-destructive/10 text-destructive",
        )}
        aria-live="polite"
      >
        {state === "empty" && (
          <>
            <Icon icon={LockIcon} className="size-3.5 shrink-0" />
            <span>
              Your store will live at{" "}
              <span className="font-medium text-foreground">
                yourname.{domain}
              </span>{" "}
              — reserved the moment you submit.
            </span>
          </>
        )}
        {state === "ok" && (
          <>
            <Icon icon={CheckmarkCircle02Icon} className="size-3.5 shrink-0" />
            <span className="truncate">
              <span className="font-medium">
                {value}.{domain}
              </span>{" "}
              looks good — we&rsquo;ll check it&rsquo;s free when you submit.
            </span>
          </>
        )}
        {state === "invalid" && (
          <>
            <Icon icon={Alert02Icon} className="size-3.5 shrink-0" />
            <span>
              Lowercase letters, numbers and hyphens only; 3–63 characters, no
              hyphen at the ends.
            </span>
          </>
        )}
        {state === "error" && (
          <>
            <Icon icon={Alert02Icon} className="size-3.5 shrink-0" />
            <span>{error}</span>
          </>
        )}
      </div>
    </div>
  );
}
