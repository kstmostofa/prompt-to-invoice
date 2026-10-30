<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureUserActive;
use App\Http\Middleware\EnsureWorkspaceManager;
use App\Http\Middleware\ResolveWorkspace;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: '',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'active' => EnsureUserActive::class,
            'workspace' => ResolveWorkspace::class,
            'workspace.manager' => EnsureWorkspaceManager::class,
            'admin' => EnsureAdmin::class,
        ]);

        $middleware->append(SecurityHeaders::class);

        // A JSON API: the sign-in screens live in the Next.js frontend, so an
        // unauthenticated request gets a 401, never a redirect to a `login` route.
        $middleware->redirectGuestsTo(fn () => null);

        // The workspace must be resolved BEFORE route model binding, or
        // `{client}` would be looked up unscoped and leak across workspaces.
        $middleware->prependToPriorityList(SubstituteBindings::class, ResolveWorkspace::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('v1/*') || $request->expectsJson(),
        );

        // Uniform JSON error envelope: {success, message, errors?}.
        $exceptions->renderable(function (Throwable $e, Request $request) {
            if (! $request->is('v1/*') && ! $request->expectsJson()) {
                return null;
            }

            if ($e instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                ], 422);
            }

            $status = match (true) {
                $e instanceof AuthenticationException => 401,
                $e instanceof AuthorizationException => 403,
                $e instanceof ModelNotFoundException => 404,
                $e instanceof HttpExceptionInterface => $e->getStatusCode(),
                default => 500,
            };

            $message = $status === 500 && ! config('app.debug') ? 'Server Error' : ($e->getMessage() ?: 'Server Error');

            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status);
        });
    })->create();
