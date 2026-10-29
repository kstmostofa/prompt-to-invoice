<?php

namespace App\Support;

use NumberFormatter;

class Money
{
    /**
     * $1,250.00 / €1,250.00, in English number style.
     */
    public static function format(string|int|float|null $amount, string $currency): string
    {
        $formatter = new NumberFormatter('en_US', NumberFormatter::CURRENCY);

        return $formatter->formatCurrency((float) ($amount ?? 0), $currency) ?: "{$currency} {$amount}";
    }
}
