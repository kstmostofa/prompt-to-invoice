"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useQueryParams(): Record<string, string | string[]> {
  const searchParams = useSearchParams();
  return useMemo(() => {
    const result: Record<string, string | string[]> = {};
    searchParams.forEach((value, key) => {
      if (key.endsWith("[]")) {
        const cleanKey = key.slice(0, -2); // remove []
        if (!result[cleanKey]) result[cleanKey] = [];
        (result[cleanKey] as string[]).push(value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }, [searchParams]);
}
