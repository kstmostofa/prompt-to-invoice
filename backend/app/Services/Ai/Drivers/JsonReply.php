<?php

namespace App\Services\Ai\Drivers;

use App\Services\Ai\AiUnavailableException;

final class JsonReply
{
    /**
     * The model's reply as an array. Tolerates a ```json fence, which models
     * in plain JSON mode sometimes add.
     *
     * @return array<string, mixed>
     */
    public static function decode(?string $text): array
    {
        $text = trim((string) $text);

        if (preg_match('/^```(?:json)?\s*(.*?)\s*```$/s', $text, $fenced)) {
            $text = $fenced[1];
        }

        $data = json_decode($text, true);

        if (! is_array($data)) {
            throw AiUnavailableException::invalidOutput();
        }

        return $data;
    }
}
