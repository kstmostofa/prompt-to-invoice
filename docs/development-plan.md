# Development Plan

The build plan for v1, phase by phase, with what is done and what is next. Scope and pricing are in [estimate-and-delivery-plan.md](estimate-and-delivery-plan.md); how the code fits together is in [architecture.md](architecture.md).

## Status

| Phase | Milestone | Status |
| --- | --- | --- |
| 1 | Foundation: accounts, workspaces, business profile, clients, admin portal | Done |
| 2 | Invoicing core: invoices, totals, numbering, statuses, PDF, dashboard | Done |
| 3 | AI generation and sending: prompt to invoice, email delivery | Done (Google sign-in waits for credentials) |
| 4 | Billing and launch: Stripe subscriptions, landing page, deployment | In progress (billing built; needs Stripe keys to test end to end) |

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

## Phase 3: AI generation and sending (done)

Backend
- [x] `POST /v1/invoices/generate`: prompt in, unsaved draft out (matched or suggested client, line items, currency, dates, discount, tax, notes, warnings)
- [x] Claude (`claude-opus-5-5`, effort `low`) via the official PHP SDK with JSON-schema structured outputs and server-side refusal fallback; model, effort and key in config
- [x] The model only extracts: every value is checked, clamped or dropped; clients must belong to the workspace; totals come from the calculator
- [x] Extractor behind an interface; tests use a fake (no API calls in CI)
- [x] Guardrails: plan switch (`has_ai_generation`), 10/min and 200/day per workspace, 2,000-character prompts, usage log (`ai_generations`: tokens, duration, outcome)
- [x] Email delivery: queued mailable with the PDF attached, the owner's message, reply-to the business; draft becomes sent; last emailed recorded
- [x] Public link per invoice (`/i/{token}`), PDF by token, first view recorded; drafts not public
- [x] Email verification on sign-up (signed link to the frontend), resend; sending invoices requires a verified address
- [x] Each throttled endpoint has its own rate-limit bucket
- [x] Multiple AI providers: Claude, OpenAI, Gemini, OpenRouter and any OpenAI-compatible API, one shared prompt and schema, automatic fallback, admin page to choose provider/model/fallback, per-provider usage and test runs
- [ ] Google sign-in: needs the client's Google OAuth credentials (moved to Phase 4)

Frontend
- [x] "Describe the work" prompt on the dashboard and the new-invoice page; the draft opens in the editor with warnings and a prefilled "new client" for unknown clients
- [x] Email dialog (to, cc, subject, message) with a sensible default message; copy client link
- [x] Activity shows last emailed and viewed by client; invoices remember the prompt they were drafted from
- [x] Public invoice page and PDF download without sign-in
- [x] Verify-email page and "verify your email" banner with resend
- [x] Expired or revoked tokens sign out to the login page instead of failing

## Phase 4: Billing and launch (in progress)

Backend
- [ ] Google sign-in (Socialite) once the client provides OAuth credentials
- [x] Laravel Cashier (Stripe), workspace as the customer: Checkout for any plan with a Stripe price, customer portal (card, receipts, change plan, cancel at period end), webhooks keep `workspaces.plan_id` in sync, failed renewals keep the plan while Stripe retries, admin-assigned plans are never downgraded
- [x] Plan features enforced from the plan record (AI generation, invoice limit)
- [ ] End-to-end check against Stripe test mode once the client's Stripe account is connected (keys, prices, webhook endpoint, portal settings)
- [x] Production config: database queue worker, scheduled pruning (expired tokens, reset tokens, failed jobs), logos on a configurable disk (local or S3/R2), `app:create-admin` for the first platform admin
- [x] Security pass: trusted proxies so rate limits see the visitor, a 300/min API ceiling, security headers on both apps, 30-day token expiry, no SVG logos, no CORS, Next.js upgraded past the critical advisories (16.4.3), `composer audit` and `pnpm audit --prod` clean
- [ ] Choose the mail provider, error tracking (Slack alerts now, Sentry with the client's account) and backup setup with the client; see [deployment.md](deployment.md)

Frontend
- [x] Billing page (`/settings/billing`): current plan and usage, plan cards with upgrade, manage subscription, checkout return notices, failed-payment warning
- [x] Admin plan form: Stripe price ID; "Change plan" on workspace settings; "Upgrade" link under the invoice allowance
- [x] Landing page at `/` (hero, how it works, features, live pricing from `/v1/plans`, FAQ); signed-in visitors go to their dashboard
- [x] Privacy policy (`/privacy`) and terms (`/terms`) from a standard template
- [ ] Client to approve the legal text: legal entity name and address, governing law, response times, refund wording
- [x] Environment and deployment docs ([deployment.md](deployment.md))
- [ ] Production build and deployment (frontend and API) on the client's hosting

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
