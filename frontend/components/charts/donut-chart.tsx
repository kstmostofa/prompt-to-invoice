"use client";

import { PLATFORM_CURRENCY } from "@/lib/helper";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";
import { formatValue, SERIES_COLORS, type ValueFormat } from "./format";

/**
 * Parts of a whole, with the total in the middle and the legend beneath.
 * Slices beyond the palette reuse its colours.
 */
export function DonutChart({
  data,
  centerLabel,
  format = "number",
  currency = PLATFORM_CURRENCY,
  colors,
}: {
  data: { name: string; value: number }[];
  centerLabel: string;
  format?: ValueFormat;
  currency?: string;
  /** A colour per slice, by name; the palette otherwise. */
  colors?: Record<string, string>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const shown = data.filter((item) => item.value > 0);
  const colorOf = (name: string, index: number) => colors?.[name] ?? SERIES_COLORS[index % SERIES_COLORS.length];

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {/* Grows with its card, up to a size where the ring stays readable. */}
      <div className="relative aspect-square w-full max-w-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip format={format} currency={currency} />} />
            <Pie
              data={shown.length > 0 ? shown : [{ name: "None", value: 1 }]}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={shown.length > 1 ? 2 : 0}
              cornerRadius={shown.length > 1 ? 4 : 0}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {(shown.length > 0 ? shown : [{ name: "None", value: 1 }]).map((item) => (
                <Cell
                  key={item.name}
                  fill={shown.length > 0 ? colorOf(item.name, data.findIndex((d) => d.name === item.name)) : "var(--muted)"}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-medium tabular-nums">{formatValue(total, format === "money" ? "compact-money" : format, currency)}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className={cn("grid w-full gap-x-5 gap-y-2 text-sm", data.length > 3 && "sm:grid-cols-2")}>
        {data.map((item, index) => (
          <li key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf(item.name, index) }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatValue(item.value, format, currency)}
              {total > 0 && <span className="ml-1.5 text-xs">({Math.round((item.value / total) * 100)}%)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
