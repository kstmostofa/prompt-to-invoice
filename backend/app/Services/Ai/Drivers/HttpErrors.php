<?php

namespace App\Services\Ai\Drivers;

use App\Services\Ai\AiUnavailableException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;

final class HttpErrors
{
    /**
     * Map a provider's HTTP failure onto what we tell the owner.
     */
    public static function throwFor(string $provider, Response $response): void
    {
        if ($response->successful()) {
            return;
        }

        Log::warning("{$provider} request failed", ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 500)]);

        throw match (true) {
            in_array($response->status(), [401, 403], true) => AiUnavailableException::auth(),
            $response->status() === 429 => AiUnavailableException::rateLimited(),
            in_array($response->status(), [400, 404, 422], true) => AiUnavailableException::badRequest(),
            default => AiUnavailableException::unavailable(),
        };
    }
}
