<?php

namespace App\Http\Middleware;

use App\Support\CurrentWorkspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Settings and team routes: owners and admins only.
 */
class EnsureWorkspaceManager
{
    public function __construct(private CurrentWorkspace $current) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($this->current->role()?->canManage(), Response::HTTP_FORBIDDEN, 'Only workspace owners and admins can do this.');

        return $next($request);
    }
}
