"use client";
import Icon from "@/components/shared/icon";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "../ui/button";

interface ThemeSwitcherProps {
  className?: string;
  size?: "icon" | "icon-sm" | "icon-lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

// next-themes seeds its state from localStorage during the first client render,
// so `resolvedTheme` is undefined on the server and set on the client — drawing
// the "current" icon straight away would be a hydration mismatch. This is the
// setState-free way to hold off until hydration finishes.
const noopSubscribe = () => () => {};

/**
 * One button that flips between light and dark. The two glyphs sit on top of
 * each other and rotate/fade past one another on change, so the control
 * reads as a toggle rather than a menu.
 */
export default function ThemeSwitcher({
  className,
  size = "icon-sm",
  variant = "ghost",
}: ThemeSwitcherProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const dark = hydrated && resolvedTheme === "dark";
  const next = dark ? "light" : "dark";

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("relative overflow-hidden rounded-xl", className)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
    >
      <Icon
        icon={Sun03Icon}
        aria-hidden
        className={cn(
          "absolute transition-all duration-300",
          dark ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
        )}
      />
      <Icon
        icon={Moon02Icon}
        aria-hidden
        className={cn(
          "absolute transition-all duration-300",
          dark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0",
        )}
      />
    </Button>
  );
}
