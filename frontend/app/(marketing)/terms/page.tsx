import { LegalPage } from "@/components/marketing/legal-page";
import { PLATFORM_NAME, SUPPORT_EMAIL, pageTitle } from "@/lib/site";
import Link from "next/link";

export const metadata = { title: pageTitle("Terms of service") };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="30 October 2026">
      <p>
        These terms govern your use of {PLATFORM_NAME} (“the service”). By creating an account you agree to them. If you use the service for
        a business, you agree on its behalf.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details and keep your password safe. You are responsible for activity under your account.</li>
        <li>You must be old enough to form a binding contract where you live.</li>
        <li>Tell us straight away at {SUPPORT_EMAIL} if you think your account has been misused.</li>
      </ul>

      <h2>Your content and invoices</h2>
      <p>
        You own the business details, clients and invoices you put into the service, and you give us permission to store and process them
        to provide it. You are responsible for your invoices: their accuracy, the taxes on them, and meeting the invoicing rules that apply
        to your business. AI-drafted invoices are suggestions — check every draft before you send it.
      </p>

      <h2>Acceptable use</h2>
      <p>Don’t use the service to send fraudulent or misleading invoices, spam, or unlawful content, or try to disrupt or gain unauthorised access to it.</p>

      <h2>Plans and payment</h2>
      <ul>
        <li>The free plan has the limits shown on our pricing page. Paid plans are billed monthly in advance through Stripe.</li>
        <li>Paid plans renew automatically until cancelled. You can cancel at any time from Settings → Billing; your plan continues to the end of the period you paid for, and we don’t refund partial periods unless the law requires it.</li>
        <li>If a payment fails and can’t be collected, your workspace returns to the free plan. Your data stays.</li>
        <li>We may change prices with at least 30 days’ notice; changes apply from your next billing period.</li>
      </ul>

      <h2>Availability</h2>
      <p>
        We work to keep the service running and your data safe, but we provide it “as is” and can’t promise it will always be available or
        error-free. Keep your own copies of invoices you need to retain.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, we are not liable for indirect or consequential losses, lost profits or lost data, and our total
        liability is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits liability that
        cannot be limited by law.
      </p>

      <h2>Ending the agreement</h2>
      <p>
        You can stop using the service and ask us to close your account at any time. We may suspend or close accounts that break these
        terms. See our <Link href="/privacy">privacy policy</Link> for what happens to your data.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. For meaningful changes we will tell you in advance; continuing to use the service means you accept them.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
