<?php

namespace App\Services\Invoices;

use App\Enums\DiscountType;

/**
 * Invoice arithmetic in exact decimals (bcmath), rounded half-up to cents at
 * each line and at each total. The one place totals are worked out: the
 * frontend and the AI only ever display what this returns.
 */
class InvoiceCalculator
{
    private const SCALE = 6;

    /**
     * @param  list<array{quantity: string|int|float, unit_price: string|int|float}>  $items
     * @return array{items: list<string>, subtotal: string, discount_total: string, tax_total: string, total: string}
     */
    public function calculate(array $items, ?DiscountType $discountType, string|int|float $discountValue, string|int|float $taxRate, bool $reverseCharge): array
    {
        $amounts = [];
        $subtotal = '0';

        foreach ($items as $item) {
            $amount = $this->round(bcmul($this->decimal($item['quantity']), $this->decimal($item['unit_price']), self::SCALE));
            $amounts[] = $amount;
            $subtotal = bcadd($subtotal, $amount, 2);
        }

        $discount = match ($discountType) {
            DiscountType::Percent => $this->round(bcdiv(bcmul($subtotal, $this->decimal($discountValue), self::SCALE), '100', self::SCALE)),
            DiscountType::Amount => $this->round($this->decimal($discountValue)),
            null => '0.00',
        };

        // A discount never takes the invoice below zero.
        if (bccomp($discount, $subtotal, 2) > 0) {
            $discount = $subtotal;
        }

        $taxable = bcsub($subtotal, $discount, 2);
        $tax = $reverseCharge
            ? '0.00'
            : $this->round(bcdiv(bcmul($taxable, $this->decimal($taxRate), self::SCALE), '100', self::SCALE));

        return [
            'items' => $amounts,
            'subtotal' => bcadd($subtotal, '0', 2),
            'discount_total' => $discount,
            'tax_total' => $tax,
            'total' => bcadd($taxable, $tax, 2),
        ];
    }

    /**
     * Half-up rounding to cents (bcmath truncates).
     */
    private function round(string $value): string
    {
        $offset = bccomp($value, '0', self::SCALE) < 0 ? '-0.005' : '0.005';

        return bcadd($value, $offset, 2);
    }

    private function decimal(string|int|float $value): string
    {
        return is_float($value) ? number_format($value, self::SCALE, '.', '') : (string) $value;
    }
}
