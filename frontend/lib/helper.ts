import { SearchParams } from "@/types/global";

export function getInitials(name: string): string {
  const namesArray = name.trim().split(" ");
  if (namesArray.length === 0) return "";

  return namesArray
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export function parseQueryParam(searchParams: SearchParams): string | null {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((val) => {
        params.append(`${key}[]`, val);
      });
    } else {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : null;
}

export function formatDate(
  date: Date | string | number | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date));
  } catch {
    return "";
  }
}

/**
 * The currency a screen falls back to when it has no currency of its own.
 */
export const PLATFORM_CURRENCY = process.env.NEXT_PUBLIC_BILLING_CURRENCY || "USD";

/**
 * An amount with its currency's own sign and decimals: $1,250.00, €1,250.00.
 * The narrow sign, so dollars read $ rather than "US$".
 */
export function formatMoney(amount: string | number | null | undefined, currency: string = PLATFORM_CURRENCY): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return String(amount);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(value);
  } catch {
    // Unknown currency codes fall back to a plain prefix.
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function slugify(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
