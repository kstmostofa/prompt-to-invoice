<?php

/*
|--------------------------------------------------------------------------
| AI providers for invoice drafts
|--------------------------------------------------------------------------
|
| Keys live here (from the environment), never in the database. Platform
| admins pick the active provider, its model and a fallback in the admin
| portal (stored in platform_settings); these are the defaults until then.
|
| Drivers: "anthropic" (official SDK), "gemini" (generateContent REST),
| "openai" (Chat Completions, also any OpenAI-compatible API).
|
*/

return [

    'provider' => env('AI_PROVIDER', 'anthropic'),

    // Tried when the active provider is down, rate limited or misconfigured.
    'fallback' => env('AI_FALLBACK_PROVIDER'),

    // Under the usual 30s gateway limit, so a stuck provider fails cleanly
    // (and the fallback can answer) instead of the request being cut off.
    'timeout' => (float) env('AI_TIMEOUT', 25),

    'providers' => [

        'anthropic' => [
            'label' => 'Anthropic Claude',
            'driver' => 'anthropic',
            'key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-opus-5-5'),
            // "low" suits short extraction; raise it if drafts miss details.
            'effort' => env('ANTHROPIC_EFFORT', 'low'),
            'models' => ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'],
        ],

        'openai' => [
            'label' => 'OpenAI ChatGPT',
            'driver' => 'openai',
            'key' => env('OPENAI_API_KEY'),
            'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
            'model' => env('OPENAI_MODEL', 'gpt-6-astra'),
            'json_mode' => 'schema',
            'models' => ['gpt-6-astra', 'gpt-4o-mini'],
        ],

        'gemini' => [
            'label' => 'Google Gemini',
            'driver' => 'gemini',
            'key' => env('GEMINI_API_KEY'),
            'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
            'model' => env('GEMINI_MODEL', 'gemini-3.5-flash'),
            'models' => ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon'],
        ],

        // One key, many models (Llama, Mistral, DeepSeek, Qwen, ...).
        'openrouter' => [
            'label' => 'OpenRouter',
            'driver' => 'openai',
            'key' => env('OPENROUTER_API_KEY'),
            'base_url' => env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
            'model' => env('OPENROUTER_MODEL', 'meta-llama/llama-4-maverick'),
            'json_mode' => 'schema',
            'models' => [],
        ],

        // Any other OpenAI-compatible API: Groq, Mistral, DeepSeek, xAI, a
        // local Ollama, ... Set AI_CUSTOM_JSON_MODE=object for APIs that
        // only support plain JSON mode, not JSON schemas.
        'custom' => [
            'label' => env('AI_CUSTOM_LABEL', 'Custom (OpenAI-compatible)'),
            'driver' => 'openai',
            'key' => env('AI_CUSTOM_API_KEY'),
            'base_url' => env('AI_CUSTOM_BASE_URL'),
            'model' => env('AI_CUSTOM_MODEL'),
            'json_mode' => env('AI_CUSTOM_JSON_MODE', 'schema'),
            'models' => [],
        ],

    ],

];
