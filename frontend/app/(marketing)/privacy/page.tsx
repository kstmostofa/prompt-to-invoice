import { LegalPage } from "@/components/marketing/legal-page";
import { PLATFORM_NAME, SUPPORT_EMAIL, pageTitle } from "@/lib/site";

export const metadata = { title: pageTitle("Privacy policy") };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="30 October 2026">
      <p>
        This policy explains what personal data {PLATFORM_NAME} (“we”, “us”) collects when you use our invoicing service, why, and the
        choices you have. Questions go to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and password (stored only as a secure hash).</li>
        <li>Business details you enter: business name, address, tax numbers, logo and invoice settings.</li>
        <li>Your clients and invoices: client names and contact details, line items, amounts and notes.</li>
        <li>The descriptions you type to have invoices drafted.</li>
        <li>Billing details for paid plans. Card details are collected and stored by Stripe, never by us.</li>
        <li>Technical data: IP address, browser, sign-in times, and when a client opens an invoice link.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To provide the service: create, store, send and track your invoices (performance of our contract with you).</li>
        <li>To take payment for paid plans and keep billing records (contract and legal obligation).</li>
        <li>To keep the service secure, prevent abuse and fix problems (legitimate interest).</li>
        <li>To send service emails such as verification, password resets and receipts. We don’t send marketing without your consent.</li>
      </ul>

      <h2>Your clients’ data</h2>
      <p>
        For the client information you put on invoices, you are the controller and we process it on your behalf, only to provide the
        service to you.
      </p>

      <h2>Who we share it with</h2>
      <p>We don’t sell personal data. We use a small number of providers who process data for us under contract:</p>
      <ul>
        <li>Hosting and database providers, to run the service.</li>
        <li>Stripe, for subscription payments.</li>
        <li>An email delivery provider, to send invoices and account emails.</li>
        <li>
          AI model providers, to turn your description into a draft invoice. The description and your client list are sent for that one
          request.
        </li>
      </ul>
      <p>Some providers are outside the European Economic Area; transfers are covered by appropriate safeguards such as standard contractual clauses.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account is open. Invoices may need to be kept for the period tax law requires. When you close your
        account we delete or anonymise your data, apart from what we must keep by law.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live, you can ask to access, correct, export or delete your personal data, object to or restrict how we use
        it, and complain to your local data protection authority. Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we
        will reply within one month.
      </p>

      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in and secure. We don’t use advertising or tracking cookies.</p>

      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way, we will tell you by email or in the app before the change takes effect.</p>
    </LegalPage>
  );
}
