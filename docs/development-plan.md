# Development Plan

The build plan for v1, phase by phase, with what is done and what is next. Scope and pricing are in [estimate-and-delivery-plan.md](estimate-and-delivery-plan.md); how the code fits together is in [architecture.md](architecture.md).

## Status

| Phase | Milestone | Status |
| --- | --- | --- |
| 1 | Foundation: accounts, workspaces, business profile, clients, admin portal | Done |
| 2 | Invoicing core: invoices, totals, numbering, statuses, PDF, dashboard | Done |
| 3 | AI generation and sending: prompt to invoice, email delivery | Next |
| 4 | Billing and launch: Stripe subscriptions, landing page, deployment | Planned |

## Phase 1: Foundation (done)

Backend
- [x] Laravel API on PostgreSQL, versioned under `/v1`, uniform JSON errors
- [x] Single-database tenancy: `workspace_id` on every tenant row, resolved per request, enforced by a global scope and route binding
- [x] Sanctum token auth: register (creates workspace on Starter + default business profile), login, logout, profile, change password, forgot/reset password (link to the frontend)
- [x] Workspace roles: owner, admin, member; owners and admins manage settings
- [x] Business profile with logo upload, invoice defaults and numbering
- [x] Clients CRUD with search, sort, filter and soft delete
- [x] Platform admin API: dashboard, workspaces (suspend, activate, change plan), users (activate, deactivate), plans CRUD
- [x] Seeded plans (Starter, Professional, Business, Enterprise) and demo accounts
- [x] Pest feature tests including cross-workspace isolation; Larastan clean

Frontend
- [x] Next.js app built on the ecommerze-project admin shell (shadcn on Base UI, Hugeicons, TanStack datatable, next-auth v5)
- [x] Sign in, register, forgot and reset password
- [x] Workspace portal: dashboard, clients (list, drawer form, detail), settings (business profile with logo, workspace), account (profile, password, workspace switcher)
- [x] Admin portal: dashboard (charts), workspaces (list, detail, actions), users, plans
- [x] Route guard (`proxy.ts`): staff to `/admin`, members out of settings, guests to login

## Phase 2: Invoicing core (done)

Backend
- [x] Invoices and line items; sender and client snapshots so issued invoices never change
- [x] Exact-decimal calculator (bcmath, half-up rounding per line and total); discount (percent or amount), tax, EU reverse charge
- [x] Numbering from the profile prefix and counter, skipping numbers already used
- [x] Status lifecycle: draft, sent, paid, void; overdue derived from the due date
- [x] Mark sent, record payment (with date), mark unpaid, void, duplicate, delete drafts only
- [x] Starter plan limit of 5 invoices a month (deleted drafts count)
- [x] PDF via dompdf (logo, status, reverse-charge wording, VOID watermark, locale-aware addresses)
- [x] Dashboard figures in the business currency: outstanding, overdue, paid, 6-month trend
- [x] Unit tests for the calculator; feature tests for the lifecycle, limits, isolation and PDF

Frontend
- [x] Invoice list with search, status filter (including overdue) and sorting
- [x] Invoice editor: client picker with inline "new client", line items, live totals matching the API's rounding, dates with Net 14/30/60, currency, discount, tax, reverse charge, notes, footer
- [x] Invoice page: on-screen document, actions menu, payment date, PDF download and inline view
- [x] Dashboard with invoice stats and chart; client page lists the client's invoices

## Phase 3: AI generation and sending (next)

Backend
- [ ] `POST /v1/invoices/generate`: prompt in, structured draft out (client match or new client, line items, quantities, rates, currency, due date, notes). The model extracts fields only; the calculator does the maths.
- [ ] LLM client behind an interface (provider and model in config), JSON-schema structured output, timeouts and retries
- [ ] Match an existing client by name, company or email; propose a new one otherwise
- [ ] Guardrails: Professional plan feature, per-workspace rate limit, prompt length cap, log usage for cost tracking
- [ ] Email delivery: queued mailable with the PDF attached, sent to the client's address with a custom message; "Send" marks the invoice sent; resend
- [ ] Public, signed link to view and download an invoice without signing in
- [ ] Email verification on sign-up; Google sign-in (Socialite)
- [ ] Evaluation set of sample prompts with expected drafts, run in tests against a fake model

Frontend
- [ ] "Describe the work" prompt box (dashboard and new invoice): generates a draft into the editor for review before saving
- [ ] Send dialog: recipient, subject, message, attach PDF; sent/viewed indicators
- [ ] Public invoice page (no sign-in)
- [ ] Verify-email screen; Google sign-in button

## Phase 4: Billing and launch (planned)

Backend
- [ ] Laravel Cashier (Stripe): Professional checkout, customer portal, webhooks keep `workspaces.plan_id` in sync, cancel at period end
- [ ] Plan features enforced from the plan record (AI generation, invoice limit)
- [ ] Production config: queues (Redis + Horizon or database queue), mail provider, S3/R2 storage for logos, scheduled jobs, backups, error tracking
- [ ] Security pass: rate limits, CORS, headers, dependency audit

Frontend
- [ ] Billing page: current plan, upgrade, manage subscription
- [ ] Landing page with pricing (from `/v1/plans`), privacy policy and terms
- [ ] Production build and deployment (frontend and API), environment docs

Handover
- [ ] Staging demo, client acceptance, production go-live
- [ ] Admin account for the client, runbook and credentials handed over

## Later phases (not in v1)

- **Phase 2 of the product (Business plan):** team seats and invitations, multiple business profiles, online card payment of invoices, recurring invoices, automatic reminders, advanced reports and CSV export.
- **Phase 3 of the product (Enterprise):** public API with keys and webhooks, QuickBooks/Xero, SSO, audit logs.
- **Add-ons:** EU structured e-invoicing (Factur-X/ZUGFeRD, XRechnung, Peppol), localisation.

## Working conventions

- Commit phase by phase, backend and frontend in separate commits.
- Backend: `vendor/bin/pint`, `vendor/bin/phpstan analyse`, `php artisan test --compact` must be clean before a commit.
- Frontend: `npx tsc --noEmit`, `pnpm lint` (no errors) and `pnpm build` must pass before a commit.
- Every backend path lives in `frontend/lib/api-urls.ts`; data access goes through server-only `lib/*.ts` modules.
