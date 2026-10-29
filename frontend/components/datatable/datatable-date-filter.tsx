"use client";
import Icon from "@/components/shared/icon";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "../ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { formatDate } from "@/lib/helper";

interface DatatableDateFilterProps {
  title?: string;
  value: string | null;
  onValueChange: (value: string) => void;
}

export function DatatableDateFilter({ title, value, onValueChange }: DatatableDateFilterProps) {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);

  const handleClear = () => {
    setDate(undefined);
    onValueChange("");
  };

  return (
    <Popover>
      <PopoverTrigger
        className="w-full sm:w-auto"
        render={<Button variant="outline" size="sm" className="h-8 border-dashed" />}
      >
        <Icon icon={Calendar01Icon} className="h-4 w-4" />
        {title}
        {value && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="flex space-x-1">
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {formatDate(value, { month: "short" })}
              </Badge>
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          captionLayout="dropdown"
          mode="single"
          selected={date}
          onSelect={(date) => {
            setDate(date);
            onValueChange(date ? format(date, "yyyy-MM-dd") : "");
          }}
        />
        {value && (
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
