import { formatMoney, PLATFORM_CURRENCY } from "@/lib/helper";

/** How a chart writes its numbers. A name, not a function: charts are client
 * components, and a server page cannot hand them a function. */
export type ValueFormat = "money" | "compact-money" | "number";

export function formatValue(value: number, format: ValueFormat, currency: string = PLATFORM_CURRENCY): string {
  if (format === "number") return new Intl.NumberFormat("en-US").format(value);
  if (format === "compact-money") {
    // ৳1.2K, $3.4M, ¥12K: the currency's own sign, from Intl, for any currency.
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        notation: "compact",
        maximumFractionDigits: Math.abs(value) < 1000 ? 0 : 1,
      }).format(value);
    } catch {
      return `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
    }
  }
  return formatMoney(value, currency);
}

/** "2026-09" → "Sep" (or "Sep 2026" with the year). */
export function monthLabel(key: string, withYear = false): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", ...(withYear ? { year: "numeric" } : {}) }).format(
    new Date(`${key}-01T00:00:00`),
  );
}

export const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
