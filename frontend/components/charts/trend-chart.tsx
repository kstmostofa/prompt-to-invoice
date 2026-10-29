"use client";

import { PLATFORM_CURRENCY } from "@/lib/helper";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatValue, monthLabel, SERIES_COLORS, type ValueFormat } from "./format";

export type TrendSeries = { key: string; label: string; color?: string };

/**
 * A monthly trend, as bars or a soft area. Rows are keyed by `month`
 * ("2026-09"); each series names a numeric field on the row.
 */
export function TrendChart({
  data,
  series,
  variant = "area",
  format = "number",
  currency = PLATFORM_CURRENCY,
  height = 260,
  emptyLabel,
}: {
  data: Array<Record<string, string | number>>;
  series: TrendSeries[];
  variant?: "area" | "bar";
  format?: ValueFormat;
  currency?: string;
  height?: number;
  /** Said over the chart when every value is zero, e.g. "No payments collected yet". */
  emptyLabel?: string;
}) {
  // Amounts arrive as decimal strings from the API.
  const rows = data.map((row) => {
    const out: Record<string, string | number> = { month: row.month };
    for (const s of series) out[s.key] = Number(row[s.key] ?? 0);
    return out;
  });

  const axis = {
    stroke: "var(--muted-foreground)",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  } as const;
  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
      <XAxis dataKey="month" tickFormatter={(value: string) => monthLabel(value)} {...axis} dy={6} />
      <YAxis
        width={56}
        allowDecimals={false}
        tickFormatter={(value: number) => formatValue(value, format === "money" ? "compact-money" : format, currency)}
        {...axis}
      />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.5, stroke: "var(--border)" }}
        content={<ChartTooltip format={format} currency={currency} labelFormatter={(value) => monthLabel(value, true)} />}
      />
    </>
  );

  const empty = emptyLabel !== undefined && rows.every((row) => series.every((s) => Number(row[s.key]) === 0));

  return (
    <div style={{ height }} className="relative w-full">
      {empty && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pb-6">
          <span className="rounded-full border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
            {emptyLabel}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {variant === "bar" ? (
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
            {common}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? SERIES_COLORS[i]} radius={[6, 6, 0, 0]} maxBarSize={44} />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color ?? SERIES_COLORS[i]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color ?? SERIES_COLORS[i]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            {common}
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color ?? SERIES_COLORS[i]}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
