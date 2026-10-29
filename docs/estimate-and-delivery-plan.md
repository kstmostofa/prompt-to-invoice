# PromptToInvoice: Project Estimate & Delivery Plan

As of October 29, 2026. The client-facing version is [client/PromptToInvoice-Estimate.pdf](client/PromptToInvoice-Estimate.pdf).

## Overview

PromptToInvoice v1 can be delivered in **3–4 weeks** by one dedicated full-stack developer, rebuilt on a clean, production-ready foundation.

The previous codebase had the right idea but was not stable enough to build on: core pages were incomplete, business logic sat in a few very large components, and there was no PDF output, email delivery, subscription billing or automated testing. v1 is rebuilt from scratch.

v1 delivers the core promise of the product: a user describes their work in plain language and gets a correct, professional invoice they can download or email to their client.

## Scope of v1

v1 covers everything needed for the **Starter (free)** and **Professional ($15/month)** plans. Business and Enterprise plan features follow in later phases.

| Area | Included in v1 |
| --- | --- |
| Accounts | Sign up, log in, Google sign-in, email verification, password reset |
| Business profile | Company name, logo, address, tax / VAT ID, default currency and payment terms |
| Clients | Client list with contact and tax details, reused across invoices |
| AI invoice generation | Describe work in plain language; AI drafts client, line items, rates, due date and currency; user reviews and edits before saving |
| Invoice editor | Manual create and edit, line items, discounts, tax, notes, automatic invoice numbering |
| Taxes and currency | USD and EUR; percentage tax per invoice (US sales tax, EU VAT, VAT reverse-charge note) |
| Accurate totals | All totals and taxes calculated by the system, never by the AI |
| Invoice status | Draft, Sent, Paid, Overdue; mark as paid manually |
| PDF | Branded, professional PDF download |
| Email | Send the invoice to the client by email with the PDF attached |
| Dashboard | Total invoiced, paid, outstanding and overdue; recent invoices |
| Subscriptions | Stripe checkout for Professional plan, free plan limit of 5 invoices/month, upgrade and cancel |
| Launch | Landing page with pricing, privacy policy and terms pages, production deployment |

**Not in v1** (planned for later phases): team seats, multiple business profiles per account, online card payment of invoices by clients, recurring invoices, automatic payment reminders, advanced reports, multiple interface languages, EU structured e-invoicing formats, public API and accounting integrations.

## Technology stack options

Both options use **PostgreSQL** and a **Next.js** frontend and deliver the same v1 scope in the same 3–4 weeks; they differ only in the backend framework. **Option B (Laravel) was chosen.**

| | Option A: Express + PostgreSQL + Next.js | Option B: Laravel + PostgreSQL + Next.js |
| --- | --- | --- |
| Backend | Node.js, Express, TypeScript | PHP 8, Laravel |
| Database access | Prisma ORM with migrations | Eloquent ORM with migrations |
| Frontend | Next.js, React, TypeScript, Tailwind CSS | Next.js, React, TypeScript, Tailwind CSS |
| Authentication | JWT with secure cookies, Google sign-in via Passport | Laravel Sanctum, Google sign-in via Socialite |
| Subscriptions | Stripe SDK and webhooks | Laravel Cashier (Stripe) |
| PDF | Server-side PDF from HTML templates | Server-side PDF from Blade templates |
| Email and queues | Resend / Postmark, BullMQ with Redis | Laravel Mail and Queues |
| AI | LLM API with structured JSON output | LLM API with structured JSON output |
| Language | One language (TypeScript) across frontend and backend | Two languages (PHP backend, TypeScript frontend) |
| Built-in features | Lightweight; more pieces assembled by hand | Batteries included: auth, queues, mail, billing, admin tooling |
| Hosting | Vercel (frontend) + Railway / Render / AWS (API and database) | Vercel (frontend) + Laravel Forge / Cloud, or any VPS |
| Hiring pool | Large JavaScript / TypeScript talent pool | Large PHP / Laravel talent pool |

## Milestones and timeline

v1 is delivered in four weekly milestones, each ending with a working demo on a staging site.

| Week | Milestone | Deliverables | Gate |
| --- | --- | --- | --- |
| 1 | Foundation | Setup and database, sign up and log in, business profile, client management | Demo 1 |
| 2 | Invoicing core | Invoice editor, taxes and currency, numbering and statuses, PDF download | Demo 2 |
| 3 | AI and sending | AI invoice generation, review and edit flow, email to client, dashboard | Demo 3 |
| 4 | Billing and launch | Stripe subscriptions, free plan limits, testing and fixes, go live and handover | v1 live |

Week 4 includes the buffer for review feedback and launch checks. If reviews are quick and client inputs arrive in week 1, launch can move forward to the end of week 3.

## Effort estimate

About **140 hours** (range 130–160) of development.

| Work package | Hours |
| --- | --- |
| Project setup, architecture, database design, authentication | 20 |
| Invoice editor, taxes, currency, numbering, statuses | 24 |
| AI invoice generation and review flow | 20 |
| PDF generation and email sending | 16 |
| Stripe subscriptions and plan limits | 14 |
| Testing, bug fixing, handover | 14 |
| Business profile and client management | 12 |
| Dashboard | 10 |
| Landing page, legal pages, production deployment | 10 |
| **Total** | **140** |

## Pricing

v1 is offered at a **fixed price of $1,500 (USD)**, covering the full scope above and deployment to production.

| Payment | Due | Amount (USD) |
| --- | --- | --- |
| 30% | At kickoff | $450 |
| 40% | After Demo 2 (end of week 2) | $600 |
| 30% | At go-live and handover | $450 |
| **Total** | | **$1,500** |

The fixed price excludes third-party service costs (hosting, AI usage, email, Stripe fees), billed directly to the client's accounts. Changes to scope after kickoff are quoted separately before work begins.

## Assumptions and client inputs

**Assumptions**

- One dedicated full-stack developer; the client reviews each weekly demo within 2 business days.
- UI follows the existing designs; no separate design phase.
- No data needs to be migrated from the previous system.
- Tax handling is a percentage rate chosen per invoice; automatic tax-rate lookup by location is not included.
- Third-party service costs are paid by the client.

**Needed from the client**

- [x] Choice of stack (Laravel chosen)
- [ ] Brand assets: logo, colours, product domain name
- [ ] Accounts with admin access: Stripe, AI provider, email provider, hosting, Google (for sign-in)
- [ ] Final pricing and plan limits confirmed
- [ ] Privacy policy and terms of service text (or approval to use a standard template)
- [ ] One sample invoice the client considers "ideal", used as the PDF reference

## Future phases

| Phase | Unlocks | Main features | Estimate | Price (USD) |
| --- | --- | --- | --- | --- |
| Phase 2 | Business plan ($39) | Team seats and roles, multiple business profiles, online card payment of invoices, recurring invoices, automatic payment reminders, advanced reports and CSV export | 2–3 weeks | $800–1,000 |
| Phase 3 | Enterprise plan | Public API with API keys and webhooks, QuickBooks / Xero integration, single sign-on, audit logs | 3–4 weeks | $1,000–1,300 |
| Add-on | EU readiness | Structured e-invoice formats (Factur-X / ZUGFeRD, XRechnung, Peppol), being phased in as mandatory for B2B invoices in France and Germany from 2027 | 1–2 weeks | $400–600 |
| Add-on | Localisation | Interface and invoices in additional languages (e.g. German, French, Spanish) | 1 week | $200–300 |

Future phase prices are indicative ranges; each phase is confirmed as a fixed price once its scope is agreed.
