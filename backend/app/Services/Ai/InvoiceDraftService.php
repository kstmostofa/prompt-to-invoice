<?php

namespace App\Services\Ai;

use App\Enums\DiscountType;
use App\Models\AiGeneration;
use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\User;
use App\Services\Invoices\InvoiceCalculator;
use App\Support\CurrentWorkspace;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Prompt in, reviewable draft out. Nothing is saved: the draft goes to the
 * editor, and the owner saves it like any other invoice.
 *
 * The model's output is treated as untrusted input: every value is checked,
 * clamped or dropped here, and totals come from the calculator.
 */
class InvoiceDraftService
{
    private const MAX_CLIENTS_IN_CONTEXT = 300;

    public function __construct(
        private InvoiceDraftExtractor $extractor,
        private InvoiceCalculator $calculator,
        private CurrentWorkspace $current,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function generate(string $prompt, User $user): array
    {
        $workspace = $this->current->get()->loadMissing('plan');

        if ($workspace->plan && ! $workspace->plan->has_ai_generation) {
            throw ValidationException::withMessages([
                'prompt' => ["AI invoice generation isn't included in the {$workspace->plan->name} plan. Upgrade to use it."],
            ]);
        }

        $profile = BusinessProfile::query()->where('is_default', true)->first();
        $currency = $profile !== null ? $profile->currency : 'USD';
        $terms = $profile !== null ? $profile->payment_terms_days : 30;
        $clients = Client::query()->orderByDesc('updated_at')->limit(self::MAX_CLIENTS_IN_CONTEXT)->get(['id', 'name', 'company', 'email', 'currency']);

        $started = hrtime(true);
        $log = [
            'user_id' => $user->id,
            'prompt' => $prompt,
            'model' => (string) config('services.anthropic.model'),
        ];

        try {
            $result = $this->extractor->extract($prompt, [
                'today' => today()->toDateString(),
                'currency' => $currency,
                'payment_terms_days' => $terms,
                'clients' => $clients->map(fn (Client $client) => $client->only(['id', 'name', 'company', 'email']))->values()->all(),
            ]);
        } catch (AiUnavailableException $e) {
            AiGeneration::query()->create([
                ...$log,
                'status' => $e->reason === 'refused' ? AiGeneration::STATUS_REFUSED : AiGeneration::STATUS_FAILED,
                'duration_ms' => $this->elapsed($started),
                'error' => $e->reason,
            ]);

            throw $e;
        }

        AiGeneration::query()->create([
            ...$log,
            'model' => $result->model,
            'status' => AiGeneration::STATUS_SUCCEEDED,
            'input_tokens' => $result->inputTokens,
            'output_tokens' => $result->outputTokens,
            'duration_ms' => $this->elapsed($started),
        ]);

        return $this->normalise($result->data, $clients, $profile, $prompt);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  Collection<int, Client>  $clients
     * @return array<string, mixed>
     */
    private function normalise(array $data, $clients, ?BusinessProfile $profile, string $prompt): array
    {
        $warnings = array_values(array_filter(array_map(
            fn ($warning) => is_string($warning) ? Str::limit(trim($warning), 300) : null,
            (array) ($data['warnings'] ?? []),
        )));

        // Client: a match must be one of this workspace's clients.
        $clientData = is_array($data['client'] ?? null) ? $data['client'] : [];
        $matched = isset($clientData['match_id']) && is_int($clientData['match_id'])
            ? $clients->firstWhere('id', $clientData['match_id'])
            : null;

        $suggested = null;
        if (! $matched) {
            $name = $this->text($clientData['name'] ?? null, 255);
            $company = $this->text($clientData['company'] ?? null, 255);
            $email = $this->text($clientData['email'] ?? null, 255);
            $email = $email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;

            if ($name !== null || $company !== null) {
                $suggested = ['name' => $name ?? $company, 'company' => $name !== null ? $company : null, 'email' => $email];
            } else {
                $warnings[] = 'No client was named. Choose who this invoice is for.';
            }
        }

        // Lines: drop anything unusable rather than failing the whole draft.
        $items = [];
        foreach ((array) ($data['items'] ?? []) as $item) {
            if (! is_array($item)) {
                continue;
            }
            $description = $this->text($item['description'] ?? null, 500);
            $quantity = $this->number($item['quantity'] ?? null, 0, 9_999_999);
            $price = $this->number($item['unit_price'] ?? null, 0, 99_999_999);

            if ($description === null || $quantity === null || $quantity <= 0) {
                continue;
            }

            $items[] = [
                'description' => $description,
                'quantity' => round($quantity, 2),
                'unit' => $this->text($item['unit'] ?? null, 20),
                'unit_price' => round($price ?? 0, 2),
            ];
        }

        if ($items === []) {
            throw ValidationException::withMessages([
                'prompt' => ['No billable work was found in that description. Say what you did and what it costs, e.g. "10 hours of consulting for Acme at $120/hour".'],
            ]);
        }

        // Currency: stated, else the client's, else the business default.
        $currency = match (true) {
            in_array($data['currency'] ?? null, ['USD', 'EUR'], true) => $data['currency'],
            $matched !== null && $matched->currency !== null => $matched->currency,
            $profile !== null => $profile->currency,
            default => 'USD',
        };

        $terms = $profile !== null ? $profile->payment_terms_days : 30;
        $issue = $this->date($data['issue_date'] ?? null) ?? today();
        $due = $this->date($data['due_date'] ?? null);
        if ($due === null || $due->lt($issue)) {
            $due = $issue->addDays($terms);
        }

        $taxRate = $this->number($data['tax_rate'] ?? null, 0, 100) ?? (float) ($profile !== null ? $profile->default_tax_rate : 0);

        $discountType = DiscountType::tryFrom((string) ($data['discount_type'] ?? ''));
        $discountValue = $discountType ? $this->number($data['discount_value'] ?? null, 0, $discountType === DiscountType::Percent ? 100 : 99_999_999) : null;
        if ($discountType && $discountValue === null) {
            $discountType = null;
        }

        $totals = $this->calculator->calculate($items, $discountType, $discountValue ?? 0, $taxRate, false);

        return [
            'client_id' => $matched?->id,
            'suggested_client' => $suggested,
            'currency' => $currency,
            'issue_date' => $issue->toDateString(),
            'due_date' => $due->toDateString(),
            'discount_type' => $discountType?->value,
            'discount_value' => $discountValue,
            'tax_rate' => $taxRate,
            'reverse_charge' => false,
            'notes' => $this->text($data['notes'] ?? null, 2000),
            'footer' => $profile?->invoice_footer,
            'items' => $items,
            'totals' => [
                'subtotal' => $totals['subtotal'],
                'discount_total' => $totals['discount_total'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],
            ],
            'warnings' => array_values(array_unique($warnings)),
            'source_prompt' => $prompt,
        ];
    }

    private function text(mixed $value, int $max): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $value = trim($value);

        return $value === '' ? null : Str::limit($value, $max, '');
    }

    private function number(mixed $value, float $min, float $max): ?float
    {
        if (! is_int($value) && ! is_float($value)) {
            return null;
        }

        return max($min, min($max, (float) $value));
    }

    private function date(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }

        try {
            $date = CarbonImmutable::createFromFormat('Y-m-d', $value)?->startOfDay();
        } catch (Throwable) {
            return null;
        }

        // A date years away is a misreading, not an invoice date.
        return $date && $date->between(today()->subYear(), today()->addYears(2)) ? $date : null;
    }

    private function elapsed(int|float $started): int
    {
        return (int) ((hrtime(true) - $started) / 1_000_000);
    }
}
