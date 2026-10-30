<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Trusted proxies
    |--------------------------------------------------------------------------
    |
    | Every API call comes from the Next.js server, which forwards the
    | visitor's address in X-Forwarded-For (frontend/lib/client-ip.ts). The
    | API only believes that header from the addresses listed here, so rate
    | limits and logs see the visitor instead of the Next.js server.
    |
    | List every hop between the Next.js server and Laravel, including the
    | Next.js server itself and any load balancer, comma-separated (CIDR
    | ranges allowed). "*" trusts whoever connects: use it only when the API
    | cannot be reached except through those proxies, or anyone could forge
    | their address and dodge the sign-in limits. Unset: trust no one (and
    | Laravel Cloud / Forge set their own).
    |
    */

    'proxies' => env('TRUSTED_PROXIES'),

];
