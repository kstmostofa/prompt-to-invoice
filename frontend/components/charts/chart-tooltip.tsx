"use client";

import { formatValue, type ValueFormat } from "./format";

type Entry = { name?: string | number; value?: number | string; color?: string; payload?: Record<string, unknown> };

/** The tooltip every chart shares: a small card in the portal's style. */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
  currency,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  format: ValueFormat;
  currency?: string;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const title = label !== undefined ? (labelFormatter ? labelFormatter(String(label)) : String(label)) : null;

  return (
    <div className="min-w-36 rounded-xl border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {title && <p className="mb-1.5 font-medium">{title}</p>}
      <div className="grid gap-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums">{formatValue(Number(entry.value ?? 0), format, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
