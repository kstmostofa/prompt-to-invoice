import { Pricing } from "@/components/marketing/pricing";
import Icon from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { getPublicPlans } from "@/lib/public-plans";
import { PLATFORM_NAME } from "@/lib/site";
import {
  AiMagicIcon,
  ArrowRight01Icon,
  ChartLineData01Icon,
  FileDownloadIcon,
  Globe02Icon,
  MailSend01Icon,
  PercentSquareIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `${PLATFORM_NAME}: describe the work, get the invoice`,
  description:
    "Type what you did in plain words and get a correct, professional invoice: line items, tax and due date filled in. Download the PDF or email it to your client.",
  openGraph: {
    title: `${PLATFORM_NAME}: describe the work, get the invoice`,
    description: "Turn a sentence into a ready-to-send invoice. Free for up to 5 invoices a month.",
    type: "website",
  },
};

const STEPS = [
  {
    title: "Describe the work",
    body: "“10 hours of consulting for Acme at $120/h, due in 30 days.” Write it the way you'd say it.",
  },
  {
    title: "Check the draft",
    body: "The client, line items, tax and dates are filled in. Totals are calculated exactly. Change anything you like.",
  },
  {
    title: "Send it",
    body: "Email the invoice with the PDF attached, or share a link. Mark it paid when the money arrives.",
  },
];

const FEATURES = [
  { icon: AiMagicIcon, title: "Invoices from a sentence", body: "Matches your existing clients and flags anything it isn't sure about." },
  { icon: FileDownloadIcon, title: "Professional PDFs", body: "Your logo, business details and payment terms on every invoice." },
  { icon: MailSend01Icon, title: "Email and client links", body: "Send from the app and see when your client opens the invoice." },
  { icon: ChartLineData01Icon, title: "Know who owes what", body: "Outstanding, overdue and paid at a glance, with a six-month trend." },
  { icon: PercentSquareIcon, title: "Tax and discounts", body: "Tax rates, percentage or fixed discounts, and EU reverse charge wording." },
  { icon: Globe02Icon, title: "USD and EUR", body: "Built for freelancers and small businesses in the US and Europe." },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. The Starter plan includes 5 invoices a month, AI drafts included, with no card needed. Upgrade when you need more.",
  },
  {
    q: "Can I trust the numbers?",
    a: "The AI only reads your description. Every total is calculated by the app with exact decimal arithmetic, and you review the draft before anything is sent.",
  },
  {
    q: "Can I edit an invoice the AI drafted?",
    a: "Always. The draft opens in a normal invoice editor, and nothing is saved until you choose to save it.",
  },
  {
    q: "How do I cancel a paid plan?",
    a: "From Settings → Billing, any time. You keep your plan until the end of the period you paid for.",
  },
];

/** A static picture of the product: the prompt and the invoice it becomes. */
function HeroPreview() {
  const rows = [
    ["Brand strategy workshop", "1", "$1,800.00"],
    ["Consulting", "10 h", "$1,200.00"],
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Icon icon={SparklesIcon} className="size-4" />
          Describe the work
        </div>
        <p className="mt-2 text-sm">
          Strategy workshop for Northwind, $1,800, plus 10 hours of consulting at $120. Add 8% tax, due in 14 days.
        </p>
      </div>
      <div className="mx-auto h-6 w-px bg-border" />
      <div className="rounded-2xl border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-heading text-2xl font-medium">Invoice</div>
            <div className="text-xs text-muted-foreground">INV-0042 · Due in 14 days</div>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Draft</span>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">Bill to</div>
        <div className="text-sm font-medium">Northwind Traders</div>
        <div className="mt-4 divide-y text-sm">
          {rows.map(([description, quantity, amount]) => (
            <div key={description} className="grid grid-cols-[1fr_auto_auto] gap-4 py-2">
              <span>{description}</span>
              <span className="text-muted-foreground tabular-nums">{quantity}</span>
              <span className="tabular-nums">{amount}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 space-y-1 border-t pt-3 text-sm tabular-nums">
          <div className="flex justify-between text-muted-foreground">
            <span>Tax 8%</span>
            <span>$240.00</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>$3,240.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const plans = await getPublicPlans();

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="font-heading text-5xl font-medium tracking-tight sm:text-6xl">
            Describe the work.
            <br />
            <span className="text-primary">Get the invoice.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
            Type what you did in plain words and {PLATFORM_NAME} turns it into a correct, professional invoice, ready to download or
            email to your client.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" render={<Link href="/register" />}>
              Create your first invoice free
              <Icon icon={ArrowRight01Icon} />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/#how-it-works" />}>
              See how it works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Free for 5 invoices a month. No card needed.</p>
        </div>
        <HeroPreview />
      </section>

      <section id="how-it-works" className="scroll-mt-16 border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="text-center font-heading text-4xl font-medium tracking-tight">From sentence to sent in under a minute</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-2xl border bg-background p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-heading text-2xl font-medium">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <h2 className="text-center font-heading text-4xl font-medium tracking-tight">Everything a small business needs to get paid</h2>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon icon={feature.icon} className="size-5" />
              </span>
              <div>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="scroll-mt-16 border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="text-center">
            <h2 className="font-heading text-4xl font-medium tracking-tight">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you outgrow it, cancel any time.</p>
          </div>
          <div className="mt-12">
            <Pricing plans={plans} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="text-center font-heading text-4xl font-medium tracking-tight">Questions</h2>
        <div className="mt-10 divide-y rounded-2xl border">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <Icon icon={ArrowRight01Icon} className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="font-heading text-4xl font-medium tracking-tight">Your next invoice is one sentence away</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Sign up in a minute and send your first invoice today.</p>
          <Button size="lg" variant="secondary" className="mt-8" render={<Link href="/register" />}>
            Start free
            <Icon icon={ArrowRight01Icon} />
          </Button>
        </div>
      </section>
    </>
  );
}
