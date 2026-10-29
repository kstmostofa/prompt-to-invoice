"use client";

import Icon from "@/components/shared/icon";
import { UnfoldMoreIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
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
import { SelectOption } from "@/types/global";
import { useId, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

interface MultiSelectProps {
  options: SelectOption[];
  title?: string;
  values: string[] | undefined | null;
  onValueChange: (values: string[]) => void;
  maxVisible?: number;
}

export default function MultiSelect({
  options,
  title = "Select Values",
  values,
  onValueChange,
  maxVisible = 2,
}: MultiSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [showAll, setShowAll] = useState<boolean>(false);
  const id = useId();

  const selectedSet = new Set(values || []);

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedSet);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    onValueChange(Array.from(newSelectedValues));
  };

  const handleClear = () => {
    onValueChange([]);
  };

  const handleShowMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAll(true);
  };

  // Base UI's Popover.Root renders no element of its own, so without this
  // wrapper the trigger sits directly in the field's container and feeds its
  // own line box into the parent's height — which then shifts by a pixel or
  // two as Base UI toggles trigger state on open, visibly growing the card
  // around it. The wrapper gives the popover subtree its own block box so
  // opening it cannot change the layout outside. Same fix as the storefront.
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-auto min-h-9 w-full justify-between whitespace-normal px-1.5 py-0 hover:bg-transparent"
            />
          }
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 min-w-0 pr-2.5">
            {values && values.length > 0 ? (
              (showAll ? values : values.slice(0, maxVisible)).map((val) => {
                const option = options.find((c) => c.value === val);

                return option ? (
                  <Badge
                    key={val}
                    variant="outline"
                    className="rounded-full h-6 ps-2 pe-1"
                  >
                    {option.label}
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(val);
                      }}
                    >
                      <Icon icon={Cancel01Icon} className="size-3.5" />
                    </span>
                  </Badge>
                ) : null;
              })
            ) : (
              <span className="text-muted-foreground">{title}</span>
            )}
            {!showAll && values && values.length > maxVisible && (
              <Badge
                variant="outline"
                className="rounded-sm shrink-0 cursor-pointer"
                onClick={handleShowMore}
              >
                +{values.length - maxVisible} more
              </Badge>
            )}
            {showAll && values && values.length > maxVisible && (
              <Badge
                variant="outline"
                className="rounded-sm shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAll(false);
                }}
              >
                Show less
              </Badge>
            )}
          </div>
          <Icon
            icon={UnfoldMoreIcon}
            className="size-4 text-muted-foreground/80 shrink-0"
            aria-hidden="true"
          />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0">
          <Command>
            <CommandInput placeholder={title} />
            <CommandList>
              <CommandEmpty>No data found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Checkbox
                      checked={values?.includes(option.value) ?? false}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {values && values.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleClear}
                      className="justify-center text-center"
                    >
                      Clear
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
