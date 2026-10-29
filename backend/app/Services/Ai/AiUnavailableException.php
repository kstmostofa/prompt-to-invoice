<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * The model could not produce a draft: not configured, unreachable,
 * rate limited, or it declined. The message is safe to show to the user.
 */
class AiUnavailableException extends RuntimeException
{
    public function __construct(string $message, public readonly string $reason = 'failed')
    {
        parent::__construct($message);
    }
}
