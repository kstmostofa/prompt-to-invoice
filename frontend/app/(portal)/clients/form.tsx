"use client";
import { CountryPicker } from "@/components/shared/country-picker";
import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient, updateClient } from "@/lib/clients";
import { applyFieldErrors } from "@/lib/form-errors";
import { Client, ClientPayload } from "@/types/api";
import { ValidationError } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const optional = (max: number) => z.string().max(max, `At most ${max} characters`);

const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  company: optional(255),
  email: z.union([z.literal(""), z.email("Invalid email address")]),
  phone: optional(50),
  address_line1: optional(255),
  address_line2: optional(255),
  city: optional(255),
  state: optional(255),
  postal_code: optional(20),
  country: z.string(),
  tax_id: optional(50),
  currency: z.enum(["", "USD", "EUR"]),
  notes: optional(2000),
});

type ClientFormData = z.infer<typeof clientSchema>;

const FIELDS = Object.keys(clientSchema.shape) as (keyof ClientFormData)[];

/** Empty strings go to the API as null, so cleared fields are cleared. */
function toPayload(data: ClientFormData): ClientPayload {
  const blank = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    name: data.name.trim(),
    company: blank(data.company),
    email: blank(data.email),
    phone: blank(data.phone),
    address_line1: blank(data.address_line1),
    address_line2: blank(data.address_line2),
    city: blank(data.city),
    state: blank(data.state),
    postal_code: blank(data.postal_code),
    country: blank(data.country),
    tax_id: blank(data.tax_id),
    currency: data.currency === "" ? null : data.currency,
    notes: blank(data.notes),
  };
}

function toFormData(client?: Client | null, initial?: Partial<ClientPayload>): ClientFormData {
  return {
    name: client?.name ?? initial?.name ?? "",
    company: client?.company ?? initial?.company ?? "",
    email: client?.email ?? initial?.email ?? "",
    phone: client?.phone ?? "",
    address_line1: client?.address_line1 ?? "",
    address_line2: client?.address_line2 ?? "",
    city: client?.city ?? "",
    state: client?.state ?? "",
    postal_code: client?.postal_code ?? "",
    country: client?.country ?? "",
    tax_id: client?.tax_id ?? "",
    currency: client?.currency ?? "",
    notes: client?.notes ?? "",
  };
}

// The drawer portal needs the DOM, so keep rendering just the trigger until
// hydration finishes (setState-free, mirrors theme-switcher).
const noopSubscribe = () => () => {};

interface ClientFormProps {
  trigger: ReactElement;
  client?: Client | null;
  /** Called with the saved client, e.g. to select a client just added from the invoice editor. */
  onSaved?: (client: Client) => void;
  /** Prefill for a new client, e.g. the one an AI draft suggests. */
  initial?: Partial<ClientPayload>;
}

export function ClientForm({ trigger, client, onSaved, initial }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: toFormData(client, initial),
  });

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    try {
      const payload = toPayload(data);
      const response = client ? await updateClient(client.id, payload) : await createClient(payload);

      if ((response as ValidationError).errors) {
        const unmapped = applyFieldErrors((response as ValidationError).errors, FIELDS, setError);
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }

      toast.success(`Client ${client ? "updated" : "created"}`);
      onSaved?.((response as { data: Client }).data);
      setOpen(false);
      if (!client) reset(toFormData(null, initial));
      router.refresh();
    } catch {
      toast.error("Failed to save the client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return trigger;
  }

  return (
    <Drawer
      swipeDirection="right"
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset(toFormData(client, initial));
      }}
    >
      <DrawerTrigger render={trigger} />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>{client ? "Edit client" : "New client"}</DrawerTitle>
            <DrawerDescription>Who you bill. Saved once, picked on every invoice.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className="grid space-y-2">
              <Label htmlFor="name">Contact name</Label>
              <Input id="name" placeholder="Jane Doe" {...register("name")} />
              <InputError message={errors.name?.message} />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" {...register("company")} />
              <InputError message={errors.company?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="billing@acme.com" {...register("email")} />
                <InputError message={errors.email?.message} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+1 555 0100" {...register("phone")} />
                <InputError message={errors.phone?.message} />
              </div>
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="address_line1">Address</Label>
              <Input id="address_line1" placeholder="Street and number" {...register("address_line1")} />
              <Input id="address_line2" placeholder="Suite, floor (optional)" {...register("address_line2")} />
              <InputError message={errors.address_line1?.message ?? errors.address_line2?.message} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="state">State / region</Label>
                <Input id="state" {...register("state")} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="postal_code">Postal code</Label>
                <Input id="postal_code" {...register("postal_code")} />
                <InputError message={errors.postal_code?.message} />
              </div>
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="country">Country</Label>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <CountryPicker id="country" value={field.value || null} onValueChange={field.onChange} pinned={["US", "GB", "DE", "FR", "NL"]} />
                )}
              />
              <InputError message={errors.country?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid space-y-2">
                <Label htmlFor="tax_id">Tax / VAT ID</Label>
                <Input id="tax_id" placeholder="DE123456789" {...register("tax_id")} />
                <InputError message={errors.tax_id?.message} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="currency">Billing currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value || "default"} onValueChange={(value) => field.onChange(value === "default" ? "" : value)}>
                      <SelectTrigger id="currency" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Business default</SelectItem>
                        <SelectItem value="USD">USD $</SelectItem>
                        <SelectItem value="EUR">EUR €</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Only you see these." {...register("notes")} />
              <InputError message={errors.notes?.message} />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
            <SubmitButton loading={loading} label={client ? "Save changes" : "Create client"} />
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
