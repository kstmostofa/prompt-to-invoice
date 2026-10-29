"use client";
import Icon from "@/components/shared/icon";
import { CalendarRangeIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/helper";
import { format } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "../ui/calendar";

interface DatatableDateRangeFilterProps {
  title?: string;
  startKey?: string;
  endKey?: string;
  startValue?: string | null;
  endValue?: string | null;
  onRangeChange: (values: Record<string, string>) => void;
}

export function DatatableDateRangeFilter({
  title,
  startKey = "start",
  endKey = "end",
  startValue,
  endValue,
  onRangeChange,
}: DatatableDateRangeFilterProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startValue ? new Date(startValue) : undefined,
    to: endValue ? new Date(endValue) : undefined,
  });

  // Track the previous values to detect external changes (like Reset)
  const [prevStart, setPrevStart] = useState(startValue);
  const [prevEnd, setPrevEnd] = useState(endValue);

  if (startValue !== prevStart || endValue !== prevEnd) {
    setPrevStart(startValue);
    setPrevEnd(endValue);
    setDate({
      from: startValue ? new Date(startValue) : undefined,
      to: endValue ? new Date(endValue) : undefined,
    });
  }

  const handleClear = () => {
    onRangeChange({
      [startKey]: "",
      [endKey]: "",
    });
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onRangeChange({
        [startKey]: format(range.from, "yyyy-MM-dd"),
        [endKey]: format(range.to, "yyyy-MM-dd"),
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        className="w-full sm:w-auto"
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <Icon icon={CalendarRangeIcon} className="h-4 w-4" />
        {title}
        {startValue && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="flex space-x-1">
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {formatDate(startValue, { month: "short" })}
                {endValue ? ` - ${formatDate(endValue, { month: "short" })}` : ""}
              </Badge>
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={handleRangeSelect}
          numberOfMonths={2}
        />
        {(startValue || endValue) && (
          <div className="border-t p-1">
            <Button
              variant="ghost"
              className="w-full justify-center text-center text-sm font-normal"
              onClick={handleClear}
            >
              Clear filters
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
