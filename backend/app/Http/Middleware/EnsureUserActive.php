<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A deactivated account loses access on its next request, not only at login.
 */
class EnsureUserActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->is_active) {
            $request->user()->tokens()->delete();

            return response()->json([
                'success' => false,
                'code' => 'deactivated',
                'message' => 'This account has been deactivated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
