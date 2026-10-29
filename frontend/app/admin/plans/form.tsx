"use client";
import Icon from "@/components/shared/icon";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { applyFieldErrors } from "@/lib/form-errors";
import { slugify } from "@/lib/helper";
import { createPlan, updatePlan } from "@/lib/plans";
import { Plan, PlanPayload } from "@/types/api";
import { ValidationError } from "@/types/global";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactElement } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface PlanFormProps {
  trigger: ReactElement;
  plan?: Plan | null;
  description?: string;
}

/** Empty = unlimited (or, for the price, custom). */
const limit = z.string().regex(/^(\d+)?$/, "A whole number, or empty for unlimited");

const planSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  // The plan's permanent handle (the seeder and signup find plans by it).
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(64, "At most 64 characters")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().max(255, "Description is too long"),
  monthly_price: z.string().regex(/^(\d+(\.\d{1,2})?)?$/, "Enter a valid amount (e.g. 15 or 15.99)"),
  monthly_invoice_limit: limit,
  business_profile_limit: limit,
  seat_limit: limit,
  has_ai_generation: z.boolean(),
  sort_order: z.string().regex(/^\d+$/, "Enter a whole number"),
  is_active: z.boolean(),
  features: z.array(z.object({ value: z.string().max(255) })),
});

export type PlanFormData = z.infer<typeof planSchema>;

const FIELDS = Object.keys(planSchema.shape) as (keyof PlanFormData)[];

const orNull = (value: string) => (value === "" ? null : Number(value));
const asText = (value: number | string | null | undefined) => (value === null || value === undefined ? "" : String(value));

function defaults(plan?: Plan | null): PlanFormData {
  return {
    name: plan?.name ?? "",
    slug: plan?.slug ?? "",
    description: plan?.description ?? "",
    monthly_price: plan ? asText(plan.monthly_price === null ? null : Number(plan.monthly_price)) : "",
    monthly_invoice_limit: asText(plan?.monthly_invoice_limit),
    business_profile_limit: asText(plan?.business_profile_limit),
    seat_limit: asText(plan?.seat_limit),
    has_ai_generation: plan?.has_ai_generation ?? true,
    sort_order: plan ? String(plan.sort_order) : "0",
    is_active: plan?.is_active ?? true,
    features: (plan?.features ?? []).map((value) => ({ value })),
  };
}

// The drawer portal needs the DOM, so keep rendering just the trigger until
// hydration finishes (setState-free, mirrors theme-switcher).
const noopSubscribe = () => () => {};

export function PlanForm({ trigger, plan, description }: PlanFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();
  // A new plan's slug follows its name until the slug is edited by hand; an
  // existing plan's never follows (renaming must not change its handle).
  const [slugTouched, setSlugTouched] = useState<boolean>(!!plan);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
    reset,
    setError,
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: defaults(plan),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "features" });

  const onSubmit = async (data: PlanFormData) => {
    setLoading(true);
    const payload: PlanPayload = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      monthly_price: data.monthly_price === "" ? null : Number(data.monthly_price),
      monthly_invoice_limit: orNull(data.monthly_invoice_limit),
      business_profile_limit: orNull(data.business_profile_limit),
      seat_limit: orNull(data.seat_limit),
      has_ai_generation: data.has_ai_generation,
      sort_order: Number(data.sort_order),
      is_active: data.is_active,
      features: data.features.map((feature) => feature.value.trim()).filter(Boolean),
    };
    try {
      const response = plan ? await updatePlan(plan.id, payload) : await createPlan(payload);

      if ((response as ValidationError).errors) {
        // "features.2" lands on the list as a whole.
        const errors = Object.fromEntries(
          Object.entries((response as ValidationError).errors).map(([field, messages]) => [field.split(".")[0], messages])
        );
        const unmapped = applyFieldErrors(errors, FIELDS, setError);
        if (unmapped.length) toast.error(unmapped[0]);
        return;
      }

      toast.success(`Plan ${plan ? "updated" : "created"} successfully`);
      setOpen(false);
      if (!plan) {
        reset(defaults());
        setSlugTouched(false);
      }
      router.refresh();
    } catch {
      toast.error("Failed to save plan. Please try again.");
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
        if (!value && !plan) {
          reset(defaults());
          setSlugTouched(false);
        }
      }}
    >
      <DrawerTrigger render={trigger} />
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
          <DrawerHeader>
            <DrawerTitle>{plan ? "Edit Plan" : "Create Plan"}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className="grid space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Professional"
                {...register("name", {
                  onChange: (event) => {
                    if (!slugTouched) {
                      setValue("slug", slugify(event.target.value).slice(0, 64), { shouldValidate: isSubmitted });
                    }
                  },
                })}
              />
              <InputError message={errors.name?.message} />
            </div>

            <div className="grid space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="professional" {...register("slug", { onChange: () => setSlugTouched(true) })} />
              <InputError message={errors.slug?.message} />
              <p className="text-xs text-muted-foreground">
                {plan
                  ? "The plan's permanent handle. New signups join the plan with the slug \"starter\"."
                  : "Follows the name until you edit it. Lowercase letters, numbers and hyphens."}
              </p>
            </div>

            <div className="grid space-y-2">
              <Label htmlFor="description">Who it is for</Label>
              <Textarea id="description" placeholder="Growing small businesses" {...register("description")} />
              <InputError message={errors.description?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid space-y-2">
                <Label htmlFor="monthly_price">Monthly price (USD)</Label>
                <Input id="monthly_price" inputMode="decimal" placeholder="Custom" {...register("monthly_price")} />
                <InputError message={errors.monthly_price?.message} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input id="sort_order" inputMode="numeric" placeholder="0" {...register("sort_order")} />
                <InputError message={errors.sort_order?.message} />
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">0 is free. Leave the price empty for custom pricing.</p>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid space-y-2">
                <Label htmlFor="monthly_invoice_limit">Invoices / month</Label>
                <Input id="monthly_invoice_limit" inputMode="numeric" placeholder="Unlimited" {...register("monthly_invoice_limit")} />
                <InputError message={errors.monthly_invoice_limit?.message} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="business_profile_limit">Profiles</Label>
                <Input id="business_profile_limit" inputMode="numeric" placeholder="Unlimited" {...register("business_profile_limit")} />
                <InputError message={errors.business_profile_limit?.message} />
              </div>
              <div className="grid space-y-2">
                <Label htmlFor="seat_limit">Seats</Label>
                <Input id="seat_limit" inputMode="numeric" placeholder="Unlimited" {...register("seat_limit")} />
                <InputError message={errors.seat_limit?.message} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>AI invoice generation</Label>
                <p className="text-xs text-muted-foreground">Create invoices from a plain-language description.</p>
              </div>
              <Controller
                control={control}
                name="has_ai_generation"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Inactive plans are hidden from the public pricing page.</p>
              </div>
              <Controller
                control={control}
                name="is_active"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Highlights</Label>
                  <p className="text-xs text-muted-foreground">The bullet points on the pricing page.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                  <Icon icon={PlusSignIcon} />
                  Add
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input placeholder="Unlimited invoices" {...register(`features.${index}.value`)} />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} title="Remove">
                    <Icon icon={Delete02Icon} />
                  </Button>
                </div>
              ))}
              <InputError message={errors.features?.message} />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
            <SubmitButton loading={loading} label={plan ? "Save changes" : "Create plan"} />
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
