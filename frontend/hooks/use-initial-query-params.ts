"use client";

import { type Filters } from "@/hooks/use-datatable-filters";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export function useInitialQueryParams(): Filters {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const initialParams: Filters = {};
    const arrayFilters: Record<string, string[]> = {};

    for (const [key, value] of searchParams.entries()) {
      const arrayMatch = key.match(/^([^[]+)\[/);

      if (arrayMatch) {
        const arrayKey = arrayMatch[1];
        if (!arrayFilters[arrayKey]) {
          arrayFilters[arrayKey] = [];
        }
        arrayFilters[arrayKey].push(value);
      } else {
        // Simple key (no brackets)
        initialParams[key] = value;
      }
    }
    Object.assign(initialParams, arrayFilters);
    return initialParams;
  }, [searchParams]);
}
