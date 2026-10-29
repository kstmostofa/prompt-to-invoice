import type { DiscountType } from "@/types/api";

/**
 * A live preview of the totals while editing, in integer cents with the
 * API's rounding (half up, per line, then per total). The API recalculates on
 * save and its figures are the ones that count; this only has to agree.
 */

/** "12.345" -> 1235 hundredths, half up. Bad input counts as zero. */
function hundredths(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/** a / b rounded half up, for non-negative integers. */
function divideRounded(a: number, b: number): number {
  return Math.floor((2 * a + b) / (2 * b));
}

export interface PreviewTotals {
  lines: number[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function previewTotals(
  items: { quantity: string | number; unit_price: string | number }[],
  discountType: DiscountType | null,
  discountValue: string | number,
  taxRate: string | number,
  reverseCharge: boolean,
): PreviewTotals {
  // Results are in cents; divide by 100 to display.
  const lines = items.map((item) => divideRounded(hundredths(item.quantity) * hundredths(item.unit_price), 100));
  const subtotal = lines.reduce((sum, line) => sum + line, 0);

  let discount = 0;
  if (discountType === "percent") discount = divideRounded(subtotal * hundredths(discountValue), 10000);
  if (discountType === "amount") discount = hundredths(discountValue);
  discount = Math.min(discount, subtotal);

  const taxable = subtotal - discount;
  const tax = reverseCharge ? 0 : divideRounded(taxable * hundredths(taxRate), 10000);

  return { lines, subtotal, discount, tax, total: taxable + tax };
}
