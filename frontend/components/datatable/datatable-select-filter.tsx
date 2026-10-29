"use client";
import type { IconSvgElement } from "@hugeicons/react";
import Icon from "@/components/shared/icon";
import {
  CancelCircleIcon,
  CheckIcon,
  PlusSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DatatableSelectFilterProps {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: IconSvgElement;
  }[];
  value: string | null;
  onValueChange: (value: string) => void;
}

export function DatatableSelectFilter({
  title,
  options,
  value,
  onValueChange,
}: DatatableSelectFilterProps) {
  const selectedOption = options.find((option) => option.value === value);
  const handleSelect = (value: string) => {
    onValueChange(value);
  };

  const handleClear = () => {
    onValueChange("");
  };

  return (
    <Popover>
      <PopoverTrigger
        className="w-full sm:w-auto"
        render={
          <Button variant="outline" size="sm" className="h-8 border-dashed" />
        }
      >
        <Icon
          icon={value ? CancelCircleIcon : PlusSignCircleIcon}
          className="h-4 w-4"
        />
        {title}
        {selectedOption && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge
              variant="secondary"
              className="rounded-sm px-1 font-normal lg:hidden"
            >
              {selectedOption.label}
            </Badge>
            <div className="hidden space-x-1 lg:flex">
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {selectedOption.label}
              </Badge>
            </div>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value;
                const OptionIcon = option.icon;
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Icon icon={CheckIcon} className="h-4 w-4" />
                    </div>
                    {OptionIcon && (
                      <Icon
                        icon={OptionIcon}
                        className="mr-2 h-4 w-4 text-muted-foreground"
                      />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value && (
              <>
                <CommandSeparator />
                <CommandGroup className="p-0">
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
