"use client";

import { CountryPicker } from "@/components/shared/country-picker";
import { DetailCard } from "@/components/shared/detail-card";
import InputError from "@/components/shared/input-error";
import SubmitButton from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyFieldErrors } from "@/lib/form-errors";
import { updateBusinessProfile } from "@/lib/workspace";
import { BusinessProfile } from "@/types/api";
import { ValidationError } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const text = (max: number) => z.string().max(max, `At most ${max} characters`);

const profileSchema = z.object({
  name: z.string().min(1, "Business name is required").max(255),
  email: z.union([z.literal(""), z.email("Invalid email address")]),
  phone: text(50),
  website: z.union([z.literal(""), z.url("Enter a full URL, like https://example.com")]),
  address_line1: text(255),
  address_line2: text(255),
  city: text(255),
  state: text(255),
  postal_code: text(20),
  country: z.string(),
  tax_id: text(50),
  currency: z.enum(["USD", "EUR"]),
  default_tax_rate: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, "A percentage, like 19 or 8.25"),
  payment_terms_days: z.string().regex(/^\d{1,3}$/, "Whole days, 0 to 365"),
  invoice_prefix: z.string().min(1, "Prefix is required").max(20),
  next_invoice_number: z.string().regex(/^[1-9]\d*$/, "A whole number from 1"),
  invoice_footer: text(2000),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const FIELDS = Object.keys(profileSchema.shape) as (keyof ProfileFormData)[];

export function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      website: profile.website ?? "",
      address_line1: profile.address_line1 ?? "",
      address_line2: profile.address_line2 ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      postal_code: profile.postal_code ?? "",
      country: profile.country ?? "",
      tax_id: profile.tax_id ?? "",
      currency: profile.currency,
      default_tax_rate: String(Number(profile.default_tax_rate)),
      payment_terms_days: String(profile.payment_terms_days),
      invoice_prefix: profile.invoice_prefix,
      next_invoice_number: String(profile.next_invoice_number),
      invoice_footer: profile.invoice_footer ?? "",
    },
  });

  const prefix = watch("invoice_prefix");
  const nextNumber = watch("next_invoice_number");

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    const blank = (value: string) => (value.trim() === "" ? null : value.trim());
    try {
      const response = await updateBusinessProfile({
        name: data.name.trim(),
        email: blank(data.email),
        phone: blank(data.phone),
        website: blank(data.website),
        address_line1: blank(data.address_line1),
        address_line2: blank(data.address_line2),
        city: blank(data.city),
        state: blank(data.state),
        postal_code: blank(data.postal_code),
        country: blank(data.country),
        tax_id: blank(data.tax_id),
        currency: data.currency,
        default_tax_rate: Number(data.default_tax_rate),
        payment_terms_days: Number(data.payment_terms_days),
        invoice_prefix: data.invoice_prefix,
        next_invoice_number: Number(data.next_invoice_number),
        invoice_footer: blank(data.invoice_footer),
      });

      if ((response as ValidationError).errors) {
        const unmapped = applyFieldErrors((response as ValidationError).errors, FIELDS, setError);
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }

      toast.success("Business profile saved");
      router.refresh();
    } catch {
      toast.error("Failed to save the business profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <DetailCard title="Business details">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" {...register("name")} />
              <InputError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Billing email</Label>
              <Input id="email" type="email" {...register("email")} />
              <InputError message={errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              <InputError message={errors.phone?.message} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://" {...register("website")} />
              <InputError message={errors.website?.message} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address_line1">Address</Label>
            <Input id="address_line1" placeholder="Street and number" {...register("address_line1")} />
            <Input id="address_line2" placeholder="Suite, floor (optional)" {...register("address_line2")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / region</Label>
              <Input id="state" {...register("state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal code</Label>
              <Input id="postal_code" {...register("postal_code")} />
              <InputError message={errors.postal_code?.message} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <CountryPicker id="country" value={field.value || null} onValueChange={field.onChange} pinned={["US", "GB", "DE", "FR", "NL"]} />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax / VAT ID</Label>
              <Input id="tax_id" placeholder="EIN or VAT number" {...register("tax_id")} />
              <InputError message={errors.tax_id?.message} />
            </div>
          </div>
        </div>
      </DetailCard>

      <DetailCard title="Invoice defaults" description="Used for every new invoice. You can change them on each invoice too.">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD $</SelectItem>
                      <SelectItem value="EUR">EUR €</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_tax_rate">Tax rate (%)</Label>
              <Input id="default_tax_rate" inputMode="decimal" {...register("default_tax_rate")} />
              <InputError message={errors.default_tax_rate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms_days">Payment terms (days)</Label>
              <Input id="payment_terms_days" inputMode="numeric" {...register("payment_terms_days")} />
              <InputError message={errors.payment_terms_days?.message} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="invoice_prefix">Number prefix</Label>
              <Input id="invoice_prefix" {...register("invoice_prefix")} />
              <InputError message={errors.invoice_prefix?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_invoice_number">Next number</Label>
              <Input id="next_invoice_number" inputMode="numeric" {...register("next_invoice_number")} />
              <InputError message={errors.next_invoice_number?.message} />
            </div>
            <div className="space-y-2">
              <Label>Next invoice</Label>
              <div className="flex h-9 items-center rounded-lg border bg-muted/50 px-3 font-mono text-sm">
                {prefix}
                {String(nextNumber || "1").padStart(4, "0")}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice_footer">Invoice footer</Label>
            <Textarea id="invoice_footer" placeholder="Bank details, a thank-you note, late payment terms..." {...register("invoice_footer")} />
            <InputError message={errors.invoice_footer?.message} />
          </div>
          <div className="flex justify-end">
            <SubmitButton loading={loading} label="Save business profile" />
          </div>
        </div>
      </DetailCard>
    </form>
  );
}
