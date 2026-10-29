"use client";
import Icon from "@/components/shared/icon";
import { Image01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DatatableCellImageProps {
  imageUrl?: string | null;
  altText?: string;
  className?: string;
  aspect?: "square" | "rectangle" | "video";
  sizes?: string;
}

export default function DatatableCellImage({
  imageUrl,
  altText = "Image",
  className,
  aspect = "square",
  sizes,
}: DatatableCellImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerClasses = cn(
    "relative overflow-hidden rounded-lg border bg-muted/30 shadow-xs",
    aspect === "square" && "size-10",
    aspect === "rectangle" && "h-10 w-16",
    aspect === "video" && "h-10 w-20",
    className
  );

  if (!imageUrl || error) {
    return (
      <div
        className={cn(containerClasses, "flex items-center justify-center text-muted-foreground/30")}
      >
        <Icon icon={Image01Icon} className="h-1/2 w-1/2" />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes={sizes || (aspect === "square" ? "40px" : "80px")}
        className={cn(
          "transition-all duration-500",
          loading ? "scale-105 blur-sm grayscale" : "scale-100 blur-0 grayscale-0",
          aspect === "square" ? "object-contain" : "object-cover"
        )}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
      {loading && <div className="absolute inset-0 animate-pulse bg-muted/10" />}
    </div>
  );
}
