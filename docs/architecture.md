# Architecture

## Overview

```
Browser ──> Next.js (frontend/)  ──Bearer token──>  Laravel API (backend/)  ──>  PostgreSQL
            server components,                       /v1 JSON, Sanctum,          one database,
            server actions, next-auth                workspace-scoped models      workspace_id on rows
```

- **frontend/**: Next.js 16 (App Router), React 19, Tailwind 4, shadcn on Base UI, Hugeicons, TanStack Table, next-auth v5. The browser never calls the API directly: server components and server actions call it with the session's token.
- **backend/**: Laravel 13, PHP 8.4, Sanctum, dompdf, Anthropic PHP SDK, Pest, Larastan. A JSON API only; all screens live in the frontend.
- **Database**: one PostgreSQL database for every workspace (single-database SaaS).

## Multi-tenancy (single database)

- A **workspace** is a customer account (a business). Users belong to workspaces through `workspace_user` with a role: owner, admin or member.
- Tenant tables (`business_profiles`, `clients`, `invoices`) carry `workspace_id` and use the `BelongsToWorkspace` trait:
  - a global scope limits every query to the current workspace;
  - new rows are stamped with the current workspace (a `workspace_id` in the payload is ignored).
- The `workspace` middleware (`ResolveWorkspace`) picks the workspace from the `X-Workspace` header or the user's `current_workspace_id`, checks membership and that the workspace is active, and sets `CurrentWorkspace`.
- It runs **before route model binding** (`prependToPriorityList`), so `/clients/{id}` of another workspace answers 404.
- Platform admins (`users.is_admin`) use `/v1/admin/*`, where no workspace scope applies.

## Backend layout

| Path | Purpose |
| --- | --- |
| `routes/api.php` | All routes under `/v1`: public, `auth`, workspace, `admin` |
| `app/Http/Middleware` | `ResolveWorkspace`, `EnsureWorkspaceManager`, `EnsureAdmin`, `EnsureUserActive` |
| `app/Http/Controllers/{Auth,Workspace,Admin}` | Thin controllers; validation in `app/Http/Requests` |
| `app/Http/Resources` | API resources (stock Laravel pagination: `data`, `links`, `meta`) |
| `app/Services` | `AuthService`; `Invoices/InvoiceService`, `InvoiceCalculator`, `InvoicePdf`; `Ai/InvoiceDraftService`, `Ai/ClaudeInvoiceDraftExtractor` |
| `app/Mail`, `resources/views/mail` | `InvoiceMail` and its template |
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

### AI drafts

```
prompt ─> InvoiceGenerationController ─> InvoiceDraftService ─> InvoiceDraftExtractor (Claude) ─> raw fields
                                               │                                                    │
                                               └── checks, clamps, matches client, calculator <─────┘
                                                   └─> unsaved draft ─> frontend editor ─> owner saves
```

- `ClaudeInvoiceDraftExtractor` calls `claude-opus-5-5` through the official PHP SDK (`anthropic-ai/sdk`), with a closed JSON schema (`output_config.format`) so the reply always parses, `effort: low`, and `fallbacks: "default"` for refusals.
- The system prompt is fixed; the business defaults and client list go in the user message as data, the owner's words inside `<description>`.
- Config: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_EFFORT` (`config/services.php`). Without a key the endpoint answers 503 and the editor still works by hand.
- Every call is logged in `ai_generations` (tokens, duration, outcome). Rate limit `ai`: 10/min, 200/day per workspace.

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
| Clients | `GET /v1/clients/options`, `/v1/clients` (REST) |
| Invoices | `GET /v1/invoices/defaults`, `POST /v1/invoices/generate`, `/v1/invoices` (REST), `POST /v1/invoices/{id}/{send,email,mark-paid,mark-unpaid,void,duplicate}`, `GET /v1/invoices/{id}/pdf` |
| Public | `GET /v1/public/invoices/{token}`, `GET /v1/public/invoices/{token}/pdf` |
| Admin | `GET /v1/admin/dashboard`, `/v1/admin/workspaces` (+ `suspend`, `activate`, `plan`), `/v1/admin/users` (+ `activate`, `deactivate`), `/v1/admin/plans` (REST) |
