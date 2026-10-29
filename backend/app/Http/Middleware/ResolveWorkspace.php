<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\Workspace;
use App\Support\CurrentWorkspace;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the workspace a request acts in and scopes every query to it.
 *
 * An `X-Workspace` header (workspace id) picks one explicitly; otherwise the
 * user's current workspace is used. The user must be a member, and the
 * workspace must not be suspended.
 */
class ResolveWorkspace
{
    public function __construct(private CurrentWorkspace $current) {}

    public function handle(Request $request, Closure $next): Response
    {
        /** @var User $user */
        $user = $request->user();

        $workspaceId = $request->header('X-Workspace') ?: $user->current_workspace_id;
        $workspace = $workspaceId ? Workspace::query()->find($workspaceId) : null;
        $role = $workspace ? $user->roleIn($workspace) : null;

        if (! $workspace || ! $role) {
            return response()->json([
                'success' => false,
                'code' => 'no_workspace',
                'message' => 'You are not a member of this workspace.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (! $workspace->isActive()) {
            return response()->json([
                'success' => false,
                'code' => 'workspace_suspended',
                'message' => 'This workspace has been suspended. Contact support to restore it.',
            ], Response::HTTP_FORBIDDEN);
        }

        $this->current->set($workspace, $role);

        return $next($request);
    }
}
