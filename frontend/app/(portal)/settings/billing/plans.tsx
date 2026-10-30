"use client";

import Icon from "@/components/shared/icon";
import { CheckmarkCircle02Icon, LinkSquare02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { DetailCard } from "@/components/shared/detail-card";
import { Button } from "@/components/ui/button";
import { BillingRedirect, openBillingPortal, startCheckout } from "@/lib/billing";
import { planPrice } from "@/lib/helper";
import { SUPPORT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Plan } from "@/types/api";
import { useState } from "react";
import { toast } from "sonner";

/** Ask the API for a Stripe-hosted page and go there. */
function useStripeRedirect() {
  const [pending, setPending] = useState<string | null>(null);

  const go = async (key: string, request: () => Promise<BillingRedirect>) => {
    setPending(key);
    const response = await request();
    if ("data" in response) {
      // Keep the spinner: the browser is leaving for Stripe.
      window.location.assign(response.data.url);
      return;
    }
    setPending(null);
    toast.error("errors" in response ? (Object.values(response.errors).flat()[0] ?? response.message) : response.error);
  };

  return { pending, go };
}

export function ManageSubscriptionButton() {
  const { pending, go } = useStripeRedirect();

  return (
    <Button variant="outline" disabled={pending !== null} onClick={() => go("portal", openBillingPortal)}>
      <Icon icon={pending ? Loading03Icon : LinkSquare02Icon} className={cn(pending && "animate-spin")} />
      Manage subscription
    </Button>
  );
}

export function PlanCards({
  plans,
  currentSlug,
  subscribed,
  enabled,
}: {
  plans: Plan[];
  currentSlug: string | null;
  subscribed: boolean;
  enabled: boolean;
}) {
  const { pending, go } = useStripeRedirect();

  const action = (plan: Plan) => {
    if (plan.slug === currentSlug) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Current plan
        </Button>
      );
    }
    if (plan.monthly_price === null) {
      return (
        <Button variant="outline" className="w-full" render={<a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${plan.name} plan`)}`} />}>
          Contact us
        </Button>
      );
    }
    // A subscriber changes or cancels plan in Stripe's portal, where proration is shown.
    if (subscribed) {
      return (
        <Button variant="outline" className="w-full" disabled={!enabled || pending !== null} onClick={() => go(plan.slug, openBillingPortal)}>
          {pending === plan.slug && <Icon icon={Loading03Icon} className="animate-spin" />}
          {Number(plan.monthly_price) === 0 ? "Cancel subscription" : "Change plan"}
        </Button>
      );
    }
    if (!plan.is_purchasable) return null;
    return (
      <Button className="w-full" disabled={!enabled || pending !== null} onClick={() => go(plan.slug, () => startCheckout(plan.slug))}>
        {pending === plan.slug && <Icon icon={Loading03Icon} className="animate-spin" />}
        Upgrade to {plan.name}
      </Button>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => (
        <DetailCard
          key={plan.id}
          title={plan.name}
          description={plan.description ?? undefined}
          bodyClassName={cn("flex flex-col gap-4", plan.slug === currentSlug && "ring-2 ring-primary")}
        >
          <p className="text-2xl font-semibold tabular-nums">{planPrice(plan)}</p>
          <ul className="flex-1 space-y-2 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Icon icon={CheckmarkCircle02Icon} className="mt-0.5 size-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
          {action(plan)}
        </DetailCard>
      ))}
    </div>
  );
}
