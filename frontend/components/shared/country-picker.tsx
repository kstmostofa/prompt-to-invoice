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
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Flag } from "@/components/shared/flag";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { useId, useMemo, useState } from "react";
import { Button } from "../ui/button";

interface CountryPickerProps {
  /** ISO 3166-1 alpha-2 code, or empty for none. */
  value?: string | null;
  onValueChange: (code: string) => void;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  /** BCP 47 tag the names are rendered in. */
  locale?: string;
  /** Codes to list first, before the alphabetical rest. */
  pinned?: string[];
  className?: string;
}

/**
 * A searchable country field: flag and name in the button, a filterable list
 * in the popover, ISO codes as hidden search terms so "BD" finds Bangladesh.
 * Pinned countries sit at the top of the list so the likely answer is one
 * click away without scrolling.
 */
export function CountryPicker({
  value,
  onValueChange,
  id: idProp,
  placeholder = "Choose a country",
  searchPlaceholder = "Search countries…",
  locale = "en",
  pinned = ["BD"],
  className,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const list = useMemo(() => {
    const all = countries(locale);
    const top = pinned.map((code) => all.find((c) => c.code === code)).filter(Boolean) as typeof all;
    const rest = all.filter((c) => !pinned.includes(c.code));
    return { top, rest };
  }, [locale, pinned]);

  const selected = useMemo(
    () => (value ? [...list.top, ...list.rest].find((c) => c.code === value) : undefined),
    [value, list],
  );

  const pick = (code: string) => {
    onValueChange(code);
    setOpen(false);
  };

  const row = (country: { code: string; name: string }) => (
    <CommandItem
      key={country.code}
      value={country.name}
      keywords={[country.code]}
      onSelect={() => pick(country.code)}
      className="gap-2.5"
    >
      <Flag code={country.code} />
      <span className="flex-1 truncate">{country.name}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">{country.code}</span>
      {value === country.code && <Icon icon={CheckIcon} className="size-4 shrink-0 text-brand" />}
    </CommandItem>
  );

  // The popover subtree gets its own block box so opening it cannot change
  // the layout around the field (Base UI toggles trigger state on open).
  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between hover:bg-transparent"
            />
          }
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2.5">
              <Flag code={selected.code} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Icon icon={UnfoldMoreIcon} className="size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-(--anchor-width) p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className={cn("max-h-72")}>
              <CommandEmpty>No country matches.</CommandEmpty>
              {list.top.length > 0 && <CommandGroup>{list.top.map(row)}</CommandGroup>}
              <CommandGroup>{list.rest.map(row)}</CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
