<?php

namespace App\Enums;

/**
 * What is stored. "Overdue" is not a stored status: it is a sent invoice
 * past its due date, worked out when read (see Invoice::displayStatus()).
 */
enum InvoiceStatus: string
{
    case Draft = 'draft';
    case Sent = 'sent';
    case Paid = 'paid';
    case Void = 'void';

    /**
     * Paid and void invoices are final: their figures no longer change.
     */
    public function isEditable(): bool
    {
        return $this === self::Draft || $this === self::Sent;
    }
}
