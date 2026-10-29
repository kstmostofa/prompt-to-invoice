<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * The model could not produce a draft. The message is safe to show the
 * owner; the reason says whether another provider is worth trying.
 */
class AiUnavailableException extends RuntimeException
{
    /** Reasons where the fallback provider may succeed. */
    private const RETRYABLE = ['not_configured', 'auth', 'rate_limited', 'unavailable', 'bad_request'];

    public function __construct(string $message, public readonly string $reason = 'unavailable')
    {
        parent::__construct($message);
    }

    public function worthFallingBack(): bool
    {
        return in_array($this->reason, self::RETRYABLE, true);
    }

    public static function notConfigured(): self
    {
        return new self('AI generation is not set up yet. Create the invoice by hand, or ask your administrator to add an AI provider key.', 'not_configured');
    }

    public static function auth(): self
    {
        return new self('AI generation is not available right now. Please create the invoice by hand.', 'auth');
    }

    public static function rateLimited(): self
    {
        return new self('AI generation is busy. Try again in a minute.', 'rate_limited');
    }

    public static function unavailable(): self
    {
        return new self('AI generation is not available right now. Try again, or create the invoice by hand.', 'unavailable');
    }

    /** The provider rejected the request itself: usually a wrong model name. */
    public static function badRequest(): self
    {
        return new self('AI generation is not available right now. Try again, or create the invoice by hand.', 'bad_request');
    }

    public static function refused(): self
    {
        return new self('That description could not be turned into an invoice. Try rewording it.', 'refused');
    }

    public static function invalidOutput(): self
    {
        return new self('The draft came back incomplete. Try a shorter description.', 'invalid_output');
    }
}
