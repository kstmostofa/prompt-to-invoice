# PromptToInvoice

AI-powered invoicing for freelancers and small businesses: describe the work, get a ready-to-send invoice.

| Directory | What |
| --- | --- |
| [`backend/`](backend) | Laravel 13 JSON API, PostgreSQL |
| [`frontend/`](frontend) | Next.js 16 app: workspace portal and platform admin portal |
| [`docs/`](docs) | Product brief, estimate, development plan, architecture |

## Docs

- [Project overview](docs/project-overview.md): the product brief
- [Estimate & delivery plan](docs/estimate-and-delivery-plan.md): scope, stack, milestones, effort, pricing
- [Development plan](docs/development-plan.md): phases and progress
- [Architecture](docs/architecture.md): how the code fits together

## Requirements

PHP 8.3+ (with `bcmath`, `intl`, `gd`), Composer, PostgreSQL 15+, Node.js 22, pnpm. On macOS, [Laravel Herd](https://herd.laravel.com) provides all of them.

## Backend setup

```bash
cd backend
composer install
cp .env.example .env            # set DB_* and FRONTEND_URL
php artisan key:generate
createdb prompt_to_invoice      # and prompt_to_invoice_test for the tests
php artisan migrate --seed
php artisan storage:link
```

With Herd: `herd link prompt-to-invoice-api && herd secure prompt-to-invoice-api` serves it at `https://prompt-to-invoice-api.test`. Otherwise `php artisan serve`.

Checks:

```bash
php artisan test --compact
vendor/bin/phpstan analyse
vendor/bin/pint
```

## Frontend setup

```bash
cd frontend
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL and AUTH_SECRET (openssl rand -base64 32)
pnpm dev                        # http://localhost:3000
```

With Herd's self-signed certificate, run `NODE_EXTRA_CA_CERTS="$HOME/Library/Application Support/Herd/config/valet/CA/LaravelValetCASelfSigned.pem" pnpm dev`.

## Demo accounts (seeded outside production)

| Role | Email | Password |
| --- | --- | --- |
| Workspace owner | `demo@prompttoinvoice.test` | `password` |
| Platform admin | `admin@prompttoinvoice.test` | `password` |
