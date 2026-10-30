# Architecture

## Overview

```
Browser ──> Next.js (frontend/)  ──Bearer token──>  Laravel API (backend/)  ──>  PostgreSQL
            server components,                       /v1 JSON, Sanctum,          one database,
            server actions, next-auth                workspace-scoped models      workspace_id on rows
```

- **frontend/**: Next.js 16 (App Router), React 19, Tailwind 4, shadcn on Base UI, Hugeicons, TanStack Table, next-auth v5. The browser never calls the API directly: server components and server actions call it with the session's token.
- **backend/**: Laravel 13, PHP 8.4, Sanctum, Cashier (Stripe), dompdf, Anthropic PHP SDK, Pest, Larastan. A JSON API only; all screens live in the frontend.
- **Database**: one PostgreSQL database for every workspace (single-database SaaS).

## Multi-tenancy (single database)

- A **workspace** is a customer account (a business). Users belong to workspaces through `workspace_user` with a role: owner, admin or member.
- Tenant tables (`business_profiles`, `clients`, `invoices`) carry `workspace_id` and use the `BelongsToWorkspace` trait:
  - a global scope limits every query to the current workspace;
  - new rows are stamped with the current workspace (a `workspace_id` in the payload is ignored).
- The `workspace` middleware (`ResolveWorkspace`) picks the workspace from the `X-Workspace` header or the user's `current_workspace_id`, checks membership and that the workspace is active, and sets `CurrentWorkspace`.
- It runs **before route model binding** (`prependToPriorityList`), so `/clients/{id}` of another workspace answers 404.
- Platform admins (`users.is_admin`) use `/v1/admin/*`, where no workspace scope applies.
- The visitor's IP reaches the API as `X-Forwarded-For` from the Next.js server (`frontend/lib/client-ip.ts`), and is believed only from `TRUSTED_PROXIES` (`config/trustedproxy.php`). Rate limits and logs depend on it; see [deployment.md](deployment.md).

## Backend layout

| Path | Purpose |
| --- | --- |
| `routes/api.php` | All routes under `/v1`: public, `auth`, workspace, `admin` |
| `app/Http/Middleware` | `ResolveWorkspace`, `EnsureWorkspaceManager`, `EnsureAdmin`, `EnsureUserActive`, `SecurityHeaders` (global) |
| `app/Console/Commands` | `app:create-admin` |
| `app/Http/Controllers/{Auth,Workspace,Admin}` | Thin controllers; validation in `app/Http/Requests` |
| `app/Http/Resources` | API resources (stock Laravel pagination: `data`, `links`, `meta`) |
| `app/Services` | `AuthService`, `BillingService`; `Invoices/InvoiceService`, `InvoiceCalculator`, `InvoicePdf`; `Ai/InvoiceDraftService`, `Ai/ClaudeInvoiceDraftExtractor` |
| `app/Mail`, `resources/views/mail` | `InvoiceMail` and its template |
| `app/Listeners` | `SyncWorkspacePlan` (Stripe webhooks to `workspaces.plan_id`) |
| `app/Support` | `CurrentWorkspace`, `Money` |
| `app/Models/Concerns/BelongsToWorkspace.php` | The tenancy scope |
| `resources/views/pdf/invoice.blade.php` | The PDF template |
| `tests/Feature`, `tests/Unit` | Pest tests (PostgreSQL test database) |

### Invoices

- Totals are computed only by `InvoiceCalculator` (bcmath, half-up per line, then per total). Client-sent totals are ignored. The frontend's live preview (`components/invoice/invoice-math.ts`) mirrors the rounding for display.
- `from_details` / `to_details` are JSON snapshots taken when saved. Drafts follow the profile; a sent invoice keeps what the client received.
- Stored statuses: `draft`, `sent`, `paid`, `void`. "Overdue" is derived: sent and past due (`displayStatus()`, `withDisplayStatus` scope).
- Numbers: profile `invoice_prefix` + zero-padded `next_invoice_number`, claimed under a row lock.
- Plan limit: `plans.monthly_invoice_limit`, counted with deleted drafts included.

### AI drafts (multi-provider)

```
prompt ─> InvoiceGenerationController ─> InvoiceDraftService ─> AiRouter ─> active provider ──(down?)──> fallback provider
                                               │                                   │
                                               └── checks, clamps, matches client, calculator <── raw fields
                                                   └─> unsaved draft ─> frontend editor ─> owner saves
```

| Provider id | Driver | Connects to |
| --- | --- | --- |
| `anthropic` | `AnthropicExtractor` | Claude via the official PHP SDK: structured outputs, `effort`, server-side refusal fallback |
| `openai` | `OpenAiCompatibleExtractor` | OpenAI Chat Completions with a strict JSON schema |
| `gemini` | `GeminiExtractor` | Google Gemini `generateContent` with `responseJsonSchema` |
| `openrouter` | `OpenAiCompatibleExtractor` | OpenRouter: Llama, Mistral, DeepSeek, Qwen and more with one key |
| `custom` | `OpenAiCompatibleExtractor` | Any OpenAI-compatible API (Groq, Mistral, DeepSeek, xAI, Ollama); `AI_CUSTOM_JSON_MODE=object` for APIs without JSON schemas |

- All providers get the same instructions and schema (`DraftPrompt`). Whatever comes back is checked by `InvoiceDraftService`, so switching provider cannot change how totals are worked out.
- Keys and default models live in `config/ai.php` (from `.env`). Platform admins choose the active provider, model and fallback at `/admin/ai`; the choice is stored in `platform_settings`. Keys are never stored in the database or sent to the browser.
- `AiRouter` falls back when the active provider is not configured, rejects its key, is rate limited, down, or rejects the request (e.g. an unknown model). A refusal or a malformed draft is not retried elsewhere.
- Every call is logged in `ai_generations` with its provider, model, tokens, duration and outcome; the admin page shows 30-day usage per provider and can test-run any provider.

### Billing (Stripe via Laravel Cashier)

```
billing page ─> POST /billing/checkout ─> Stripe Checkout ─> back to /settings/billing?checkout=success
                POST /billing/portal   ─> Stripe customer portal (card, receipts, change plan, cancel)
Stripe ─> POST /stripe/webhook (Cashier) ─> subscriptions table ─> SyncWorkspacePlan ─> workspaces.plan_id
```

- The **workspace** is the Stripe customer (`Cashier::useCustomerModel`); `stripe_id` lives on `workspaces`, and `subscriptions.workspace_id` links subscriptions. Receipts go to the owner's email. One subscription per workspace, named `default`.
- Each plan has an optional `stripe_price_id` (set in the admin plan form, or from `STRIPE_PRICE_<SLUG>` when seeding). A plan is purchasable when it is active and has a price.
- `BillingService::syncPlan` runs after every subscription webhook: a valid subscription puts the workspace on the plan with that price; when it ends, a workspace on a self-serve plan falls back to Starter. Plans an admin assigned by hand (no Stripe price, e.g. Enterprise) are left alone. A price that matches no plan is logged and ignored.
- Failed renewals (`past_due`) keep the plan while Stripe retries (`keepPastDueSubscriptionsActive`); Stripe cancels after the last retry and the workspace returns to Starter.
- Plan changes and cancellations happen in Stripe's portal, so proration and confirmation are Stripe's. Cancel means "at period end": the plan stays until `ends_at`.
- Without `STRIPE_SECRET`, checkout and portal answer 503 and the billing page says online billing isn't available yet.
- Webhook signatures are verified when `STRIPE_WEBHOOK_SECRET` is set (always in production). Required events: `customer.subscription.created/updated/deleted`, `customer.updated`, `customer.deleted`, `invoice.payment_action_required`, `invoice.payment_succeeded` (`php artisan cashier:webhook` registers them).

### Email, public links, verification

- `POST /invoices/{id}/email` queues `InvoiceMail` (PDF attached, reply-to the business) and marks a draft as sent. Requires a verified sender.
- Each invoice has a `public_token`; `/i/{token}` in the frontend shows it without sign-in once sent, and records the first view.
- Sign-up sends a signed verification link to `/verify-email` in the frontend, which calls the signed API route.

## Frontend layout

| Path | Purpose |
| --- | --- |
| `auth.ts` | next-auth credentials provider: posts to `/v1/auth/login`, keeps token, workspace and role in the session |
| `proxy.ts` | Route guard (Next 16 middleware) |
| `lib/api-urls.ts` | Every backend path |
| `lib/api.ts` | Server-only fetch client; 422 returned, other errors thrown |
| `lib/*.ts` | `"use server"` data modules per area |
| `app/(marketing)` | Public site: landing page with live pricing, `/privacy`, `/terms` |
| `app/(auth)` | Sign in, register, password reset |
| `app/(portal)` | Workspace portal: dashboard, invoices, clients, settings, account |
| `app/admin` | Platform admin portal |
| `components/{layouts,shared,datatable,ui,charts,invoice}` | Shell and building blocks |

## API summary

| Area | Endpoints |
| --- | --- |
| Public | `GET /v1/plans` |
| Auth | `POST /v1/auth/{register,login,logout,forgot-password,reset-password}`, `GET/PUT /v1/auth/user`, `PUT /v1/auth/user/password`, `GET /v1/auth/verify-email/{id}/{hash}` (signed), `POST /v1/auth/email/verification-notification` |
| Workspace | `GET /v1/dashboard`, `GET/PUT /v1/workspace`, `POST /v1/workspaces/{id}/switch` |
| Business profile | `GET/PUT /v1/business-profile`, `POST/DELETE /v1/business-profile/logo` |
| Billing (owners, admins) | `GET /v1/billing`, `POST /v1/billing/checkout`, `POST /v1/billing/portal`; Stripe webhook `POST /stripe/webhook` |
| Clients | `GET /v1/clients/options`, `/v1/clients` (REST) |
| Invoices | `GET /v1/invoices/defaults`, `POST /v1/invoices/generate`, `/v1/invoices` (REST), `POST /v1/invoices/{id}/{send,email,mark-paid,mark-unpaid,void,duplicate}`, `GET /v1/invoices/{id}/pdf` |
| Public | `GET /v1/public/invoices/{token}`, `GET /v1/public/invoices/{token}/pdf` |
| Admin | `GET/PUT /v1/admin/ai`, `POST /v1/admin/ai/test`, `GET /v1/admin/dashboard`, `/v1/admin/workspaces` (+ `suspend`, `activate`, `plan`), `/v1/admin/users` (+ `activate`, `deactivate`), `/v1/admin/plans` (REST) |
