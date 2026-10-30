import { CreditCardIcon } from "@hugeicons/core-free-icons";
import AppLayout from "@/components/layouts/app-layout";
import { DetailCard, LabeledItem } from "@/components/shared/detail-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getBilling } from "@/lib/billing";
import { formatDate, planPrice } from "@/lib/helper";
import { pageTitle } from "@/lib/site";
import { SearchParams } from "@/types/global";
import { BillingSubscription } from "@/types/api";
import { ManageSubscriptionButton, PlanCards } from "./plans";

export const metadata = { title: pageTitle("Billing") };

function subscriptionStatus(subscription: BillingSubscription | null) {
  if (!subscription || !subscription.active) return null;
  if (subscription.past_due) return <Badge variant="destructive">Payment failed</Badge>;
  if (subscription.cancelled) return <Badge variant="secondary">Ends {formatDate(subscription.ends_at)}</Badge>;
  return <Badge>Active</Badge>;
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [{ checkout }, { data: billing }] = await Promise.all([searchParams, getBilling()]);
  const { plan, subscription, usage } = billing;
  const subscribed = !!subscription?.active;

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Settings", href: "/settings/business-profile" },
        { title: "Billing", href: "/settings/billing" },
      ]}
      icon={CreditCardIcon}
      title="Billing"
      description="Your plan, payment details and receipts."
      actions={billing.has_billing_account && billing.enabled ? <ManageSubscriptionButton /> : undefined}
    >
      <div className="flex flex-col gap-4">
        {checkout === "success" && (
          <Alert>
            <AlertTitle>{subscribed ? `You're on the ${plan?.name} plan` : "Payment received"}</AlertTitle>
            <AlertDescription>
              {subscribed
                ? "Thank you. Your receipt is on its way by email."
                : "We're confirming your subscription with Stripe. Refresh this page in a moment."}
            </AlertDescription>
          </Alert>
        )}
        {checkout === "cancelled" && (
          <Alert>
            <AlertTitle>Checkout cancelled</AlertTitle>
            <AlertDescription>Nothing was charged. You can upgrade whenever you’re ready.</AlertDescription>
          </Alert>
        )}
        {subscription?.past_due && (
          <Alert variant="destructive">
            <AlertTitle>Your last payment failed</AlertTitle>
            <AlertDescription>
              Stripe will retry the card. Update your payment method under “Manage subscription” to keep your plan.
            </AlertDescription>
          </Alert>
        )}
        {!billing.enabled && (
          <Alert>
            <AlertTitle>Online billing isn’t available yet</AlertTitle>
            <AlertDescription>Upgrades will open here soon. Contact support to change plan in the meantime.</AlertDescription>
          </Alert>
        )}

        <DetailCard title="Current plan" action={subscriptionStatus(subscription)}>
          <div className="grid gap-4 sm:grid-cols-3">
            <LabeledItem label="Plan" value={plan?.name ?? "—"} />
            <LabeledItem label="Price" value={plan ? planPrice(plan) : "—"} />
            <LabeledItem
              label="Invoices this month"
              value={usage.limit === null ? `${usage.used} (unlimited)` : `${usage.used} of ${usage.limit}`}
            />
          </div>
          {subscription?.cancelled && subscription.active && (
            <p className="text-sm text-muted-foreground">
              Your subscription won’t renew. You keep {plan?.name} until {formatDate(subscription.ends_at)}, then move to the free plan.
            </p>
          )}
        </DetailCard>

        <PlanCards plans={billing.plans} currentSlug={plan?.slug ?? null} subscribed={subscribed} enabled={billing.enabled} />
      </div>
    </AppLayout>
  );
}
