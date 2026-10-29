<?php

use App\Enums\DiscountType;
use App\Services\Invoices\InvoiceCalculator;

function calculate(array $items, ?DiscountType $type = null, $discount = 0, $tax = 0, bool $reverse = false): array
{
    return (new InvoiceCalculator)->calculate($items, $type, $discount, $tax, $reverse);
}

it('multiplies lines and adds them up', function () {
    $result = calculate([
        ['quantity' => '10', 'unit_price' => '120'],
        ['quantity' => '2.5', 'unit_price' => '80.40'],
    ]);

    expect($result['items'])->toBe(['1200.00', '201.00'])
        ->and($result['subtotal'])->toBe('1401.00')
        ->and($result['total'])->toBe('1401.00');
});

it('rounds each line half up to cents', function () {
    $result = calculate([
        ['quantity' => '1.5', 'unit_price' => '0.01'], // 0.015 -> 0.02
        ['quantity' => '3', 'unit_price' => '0.333'],   // 0.999 -> 1.00
    ]);

    expect($result['items'])->toBe(['0.02', '1.00'])->and($result['subtotal'])->toBe('1.02');
});

it('avoids floating point drift', function () {
    $result = calculate(array_fill(0, 10, ['quantity' => 1, 'unit_price' => 0.1]));

    expect($result['subtotal'])->toBe('1.00');
});

it('applies a percentage discount before tax', function () {
    $result = calculate([['quantity' => 1, 'unit_price' => '1000']], DiscountType::Percent, 10, 19);

    expect($result['discount_total'])->toBe('100.00')
        ->and($result['tax_total'])->toBe('171.00')
        ->and($result['total'])->toBe('1071.00');
});

it('applies a fixed discount and never goes below zero', function () {
    expect(calculate([['quantity' => 1, 'unit_price' => '50']], DiscountType::Amount, '20')['total'])->toBe('30.00')
        ->and(calculate([['quantity' => 1, 'unit_price' => '50']], DiscountType::Amount, '80')['total'])->toBe('0.00');
});

it('charges no tax under reverse charge', function () {
    $result = calculate([['quantity' => 1, 'unit_price' => '1000']], null, 0, 21, true);

    expect($result['tax_total'])->toBe('0.00')->and($result['total'])->toBe('1000.00');
});

it('rounds tax half up', function () {
    // 8.25% of 10.10 = 0.83325 -> 0.83
    // 8.25% of 10.30 = 0.84975 -> 0.85
    expect(calculate([['quantity' => 1, 'unit_price' => '10.10']], null, 0, '8.25')['tax_total'])->toBe('0.83')
        ->and(calculate([['quantity' => 1, 'unit_price' => '10.30']], null, 0, '8.25')['tax_total'])->toBe('0.85');
});
