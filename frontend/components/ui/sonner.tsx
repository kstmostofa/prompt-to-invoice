"use client"
import Icon from "@/components/shared/icon";
import {
  Alert02Icon,
  CircleCheckIcon,
  InformationCircleIcon,
  Loading03Icon,
  OctagonXIcon,
} from "@hugeicons/core-free-icons";

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <Icon icon={CircleCheckIcon} className="size-4" />
        ),
        info: (
          <Icon icon={InformationCircleIcon} className="size-4" />
        ),
        warning: (
          <Icon icon={Alert02Icon} className="size-4" />
        ),
        error: (
          <Icon icon={OctagonXIcon} className="size-4" />
        ),
        loading: (
          <Icon icon={Loading03Icon} className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
