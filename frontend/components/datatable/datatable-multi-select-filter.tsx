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

interface DatatableMultiSelectFilterProps {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: IconSvgElement;
  }[];
  selectedValues: string[] | undefined;
  setSelectedValues: (values: string[]) => void;
}

export function DatatableMultiSelectFilter({
  title,
  options,
  selectedValues,
  setSelectedValues,
}: DatatableMultiSelectFilterProps) {
  const selectedSet = new Set(selectedValues);

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedSet);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    setSelectedValues(Array.from(newSelectedValues));
  };

  const handleClear = () => {
    setSelectedValues([]);
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
          icon={
            selectedValues && selectedValues.length > 0
              ? CancelCircleIcon
              : PlusSignCircleIcon
          }
          className="h-4 w-4"
        />
        {title}
        {selectedValues && selectedValues.length > 0 && (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div className="flex space-x-1">
              {selectedValues.length > 2 ? (
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {selectedValues.length} selected
                </Badge>
              ) : (
                options
                  .filter((option) => selectedSet.has(option.value))
                  .map((option) => (
                    <Badge
                      variant="secondary"
                      key={option.value}
                      className="rounded-sm px-1 font-normal"
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
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
                const isSelected = selectedSet.has(option.value);
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
            {selectedValues && selectedValues.length > 0 && (
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
