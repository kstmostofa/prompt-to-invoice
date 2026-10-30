# Deployment

How to run PromptToInvoice in production: the servers, every setting, the background processes and the launch checklist. Local setup is in the [README](../README.md); how the code fits together is in [architecture.md](architecture.md).

## Recommended setup

```
                 ┌──────────────────────── one server (Laravel Forge or any VPS) ────────────────────────┐
browser ──https──> nginx ──> Next.js (node, :3000) ──> nginx ──> PHP-FPM (Laravel API) ──> PostgreSQL     │
                 │  app.example.com                     api.example.com          │                       │
                 │                                                    queue worker + scheduler (cron)    │
                 └───────────────────────────────────────────────────────────────────────────────────────┘
Stripe ──https──> api.example.com/stripe/webhook          logos ──> local disk or S3 / Cloudflare R2
```

- **One server for both apps** keeps the request path simple: Next.js calls the API over the server's own nginx, so the API can trust exactly one address (`127.0.0.1`) to tell it who the visitor is. Laravel Forge provisions nginx, PHP, PostgreSQL, the queue worker, the scheduler and SSL from its dashboard.
- **Managed PostgreSQL** (DigitalOcean, AWS RDS, Neon, Supabase) is recommended over a database on the same server, for automatic backups and point-in-time recovery.
- **Vercel for the frontend** works, with one caveat: Vercel's outgoing IPs are not fixed, so the API cannot list them in `TRUSTED_PROXIES`. Either accept that sign-in rate limits apply per Vercel IP instead of per visitor, or put the API behind a proxy you control. The single-server setup avoids the question.

Minimum server: 2 vCPU, 4 GB RAM (PDF rendering and the Next.js server are the heaviest parts). PHP 8.4 with `bcmath`, `intl`, `gd`, `pdo_pgsql`; Node.js 22; pnpm.

## Backend (`backend/.env`)

Start from `backend/.env.example`. Production values:

| Setting | Value |
| --- | --- |
| `APP_ENV` / `APP_DEBUG` | `production` / `false`. Never `true` in production: errors would show code and settings. |
| `APP_KEY` | `php artisan key:generate` once; keep it safe (it signs email links). |
| `APP_URL` | `https://api.example.com` |
| `FRONTEND_URL` | `https://app.example.com` (links in emails: verify, reset, invoice view, Stripe return) |
| `DB_*` | The production database. `DB_SSLMODE=require` for managed databases. |
| `TRUSTED_PROXIES` | `127.0.0.1` on the single-server setup. List every hop between Next.js and Laravel; see `config/trustedproxy.php`. Never `*` unless the API is unreachable except through those hops. |
| `SANCTUM_EXPIRATION` | Sign-in lifetime in minutes; default 43200 (30 days). |
| `QUEUE_CONNECTION` | `database` (no extra service) or `redis`. Not `sync`: sending would block requests. |
| `CACHE_STORE` | `database`, or `redis` if you run Redis. Rate limits live here. |
| `MAIL_MAILER` and `MAIL_*` | A transactional email provider: Postmark, Resend, Amazon SES or Mailgun (`smtp` works with all of them). `MAIL_FROM_ADDRESS` on a domain with SPF, DKIM and DMARC set up, or invoices land in spam. |
| `LOGO_DISK` | `public` (run `php artisan storage:link`) or `s3` for S3 / Cloudflare R2, with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` (`auto` for R2), `AWS_BUCKET`, `AWS_ENDPOINT` (R2 only) and `AWS_URL` (the bucket's public URL). Use S3/R2 if the API runs on more than one server. |
| `STRIPE_KEY`, `STRIPE_SECRET` | Live keys from the Stripe dashboard. |
| `STRIPE_WEBHOOK_SECRET` | From the webhook endpoint (see Stripe below). Required: without it webhooks are not verified. |
| `STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_BUSINESS` | Monthly prices; also editable per plan in the admin portal. |
| `ANTHROPIC_API_KEY` and the other `*_API_KEY`s | The AI providers in use; choose the active one at `/admin/ai`. |
| `LOG_CHANNEL`, `LOG_STACK`, `LOG_LEVEL` | `stack`, `daily`, `warning`. Add `slack` to the stack with `LOG_SLACK_WEBHOOK_URL` for error alerts (see Error tracking). |

Deploy script (Forge runs this on every push):

```bash
cd backend
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
php artisan migrate --force
php artisan db:seed --class=PlanSeeder --force   # first deploy only, or when plan defaults change
php artisan optimize                             # caches config, routes, events, views
php artisan queue:restart                        # workers pick up the new code
```

`php artisan optimize` caches the config: after changing `.env`, run it again.

## Frontend (`frontend/.env.production`)

| Setting | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com/v1` |
| `AUTH_SECRET` | `openssl rand -base64 32`; changing it signs everyone out. |
| `AUTH_URL` | `https://app.example.com` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | The address shown on the site and legal pages. |

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm build
pnpm start            # port 3000; run under a process manager (Forge daemon, systemd or pm2)
```

`NEXT_PUBLIC_*` values are built into the app: rebuild after changing them.

nginx in front of Next.js must pass the visitor's address, which the frontend forwards to the API:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Background processes

| Process | Command | Why |
| --- | --- | --- |
| Queue worker | `php artisan queue:work --tries=3 --max-time=3600` (Forge: Queue tab; or supervisor) | Sends invoice emails. Without it, emails wait in the queue. |
| Scheduler | `* * * * * cd /path/backend && php artisan schedule:run` (Forge: Scheduler tab) | Prunes expired sign-ins, old password-reset tokens and month-old failed jobs. |

Failed jobs: `php artisan queue:failed` lists them, `php artisan queue:retry all` resends.

## Stripe

1. In the Stripe dashboard, create a product per paid plan with a monthly recurring price; put the price IDs in `.env` or the admin plan form.
2. Create the webhook endpoint `https://api.example.com/stripe/webhook`, or run `php artisan cashier:webhook --url=https://api.example.com/stripe/webhook`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Turn on the customer portal (Settings → Billing → Customer portal): allow updating payment methods, viewing invoices, switching between the paid plans, and cancelling at the end of the billing period.
4. Test the whole flow in test mode first: upgrade with card `4242 4242 4242 4242`, check the workspace moves to the plan, cancel in the portal, then fail a renewal with card `4000 0000 0000 0341`.

## Backups

- **Database:** use the managed provider's daily backups with point-in-time recovery, kept at least 14 days. On a self-managed database, run a nightly `pg_dump` to off-server storage (for example the R2/S3 bucket) and keep 14 copies.
- **Logos:** on the `public` disk, include `backend/storage/app/public` in the server backup; S3/R2 buckets can enable versioning.
- **Restore test:** restore the latest backup into a scratch database once before launch, and after any change to the backup setup.
- **Secrets:** keep both `.env` files in a password manager; `APP_KEY` and `AUTH_SECRET` cannot be recovered.

## Error tracking

- **Now, no extra services:** Laravel's `slack` log channel posts errors to a Slack channel. Set `LOG_STACK=daily,slack`, `LOG_SLACK_WEBHOOK_URL` and `LOG_LEVEL=error`.
- **Recommended once there is an account:** Sentry for both apps (`sentry/sentry-laravel`, `@sentry/nextjs`), which groups errors and shows the request that caused them. This adds a package to each app and needs the client's Sentry project keys.
- **Uptime:** an external check (UptimeRobot, Better Stack) on `https://api.example.com/up` and the landing page.

## Security notes

- The API answers only server-to-server calls from Next.js: it sends no CORS headers, so browsers on other sites cannot call it.
- Both apps send hardening headers (no framing, no MIME sniffing, HSTS, a restrictive CSP on API JSON).
- Rate limits: 300 requests a minute per user across the API, plus tighter limits on sign-in (10/min), registration (5/min), password reset, AI drafts (10/min, 200/day per workspace), email sending and public invoice links.
- Sign-in tokens expire after `SANCTUM_EXPIRATION`; the frontend sends people to sign in again.
- Logos accept PNG, JPG and WebP only (SVG can carry scripts).
- Dependency audits: `composer audit` and `pnpm audit --prod` before each release.

## Launch checklist

- [ ] DNS and SSL for the app and API domains
- [ ] Both `.env` files filled in; `APP_DEBUG=false`
- [ ] Migrations and `PlanSeeder` run; platform admin created with `php artisan app:create-admin you@example.com` (asks for a password; promotes the account if it already exists)
- [ ] Queue worker and scheduler running
- [ ] Email domain verified (SPF, DKIM, DMARC); a test invoice email arrives in an inbox, not spam
- [ ] Stripe live keys, prices, webhook and customer portal configured; one real upgrade and cancel tested
- [ ] AI provider key set and a test run from `/admin/ai` succeeds
- [ ] Backups on and one restore tested
- [ ] Error alerts and uptime check on
- [ ] Privacy policy and terms approved by the client
