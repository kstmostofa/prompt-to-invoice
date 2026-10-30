import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { planPrice } from "@/lib/helper";
import { SUPPORT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Plan } from "@/types/api";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

/** The plan most people should pick; highlighted when present. */
const FEATURED = "professional";

/**
 * Pricing cards from the live plan catalogue. Everyone starts free and
 * upgrades from Settings → Billing, so paid plans also lead to sign-up.
 */
export function Pricing({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Pricing is loading. Start free and see every plan inside the app.
      </p>
    );
  }

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", plans.length >= 4 && "xl:grid-cols-4", plans.length === 3 && "lg:grid-cols-3")}>
      {plans.map((plan) => {
        const featured = plan.slug === FEATURED;
        const custom = plan.monthly_price === null;
        const free = !custom && Number(plan.monthly_price) === 0;
        const [amount, period] = planPrice(plan).split(" / ");

        return (
          <div
            key={plan.id}
            className={cn("flex flex-col gap-5 rounded-2xl border bg-card p-6", featured && "border-primary shadow-lg ring-1 ring-primary")}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-heading text-2xl font-medium">{plan.name}</h3>
                {featured && <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Most popular</span>}
              </div>
              {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
            </div>
            <p>
              <span className="text-4xl font-semibold tabular-nums">{amount}</span>
              {period && <span className="text-muted-foreground"> / {period}</span>}
            </p>
            <ul className="flex-1 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Icon icon={CheckmarkCircle02Icon} className="mt-0.5 size-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            {custom ? (
              <Button variant="outline" size="lg" render={<a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${plan.name} plan`)}`} />}>
                Talk to us
              </Button>
            ) : (
              <Button variant={featured ? "default" : "outline"} size="lg" render={<Link href="/register" />}>
                {free ? "Start free" : `Start free, upgrade to ${plan.name}`}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
