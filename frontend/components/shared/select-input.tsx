"use client";

import Icon from "@/components/shared/icon";
import { CheckIcon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
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
import { Button } from "../ui/button";

interface SelectInputProps {
  options: SelectOption[];
  title: string;
  value?: string | null;
  onValueChange: (values: string) => void;
  disabled?: boolean;
}

export default function SelectInput({
  options,
  title,
  value,
  onValueChange,
  disabled = false,
}: SelectInputProps) {
  const [open, setOpen] = useState<boolean>(false);
  const id = useId();

  const selectedOption = options.find((opt) => opt.value === value);
  const handleClear = () => {
    onValueChange("");
    setOpen(false);
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
              disabled={disabled}
              className="w-full justify-between hover:bg-transparent"
            />
          }
        >
          {selectedOption ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{title}</span>
          )}
          <Icon
            icon={UnfoldMoreIcon}
            className="size-4 text-muted-foreground"
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-full min-w-(--anchor-width) p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder={title} />
            <CommandList>
              <CommandEmpty>No data found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    keywords={option.keywords}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {value === option.value && (
                      <Icon
                        icon={CheckIcon}
                        className="ml-auto size-4 shrink-0"
                      />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {value && (
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
