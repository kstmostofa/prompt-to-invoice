"use client";

import Icon from "@/components/shared/icon";
import { ViewIcon, EyeOffIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Input } from "../ui/input";

export default function InputPassword({
  className,
  ref,
  ...props
}: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={`pr-10 ${className || ""}`}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <Icon icon={EyeOffIcon} className="w-4 h-4" />
        ) : (
          <Icon icon={ViewIcon} className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
