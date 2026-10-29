<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Ai\AiRouter;
use App\Services\Ai\InvoiceDraftExtractor;
use App\Support\CurrentWorkspace;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Scoped, not singleton: reset between requests under Octane and queue jobs.
        $this->app->scoped(CurrentWorkspace::class);

        // The active provider, with fallback; chosen in the admin portal.
        $this->app->bind(InvoiceDraftExtractor::class, AiRouter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Date::use(CarbonImmutable::class);
        Model::shouldBeStrict(! $this->app->isProduction());

        // The reset form lives in the Next.js app, not on this API.
        ResetPassword::createUrlUsing(fn (User $user, string $token): string => config('app.frontend_url').'/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ]));

        // The verify page lives in the frontend too; it calls the signed API
        // URL rebuilt from these parameters.
        VerifyEmail::createUrlUsing(function (User $user): string {
            $signed = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]);
            parse_str((string) parse_url($signed, PHP_URL_QUERY), $query);

            return config('app.frontend_url').'/verify-email?'.http_build_query([
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
                ...$query,
            ]);
        });

        // AI drafts cost money per call: 10 a minute and 200 a day per workspace.
        RateLimiter::for('ai', function (Request $request): array {
            $key = (string) ($request->user()->current_workspace_id ?? $request->ip());

            return [
                Limit::perMinute(10)->by('ai-minute:'.$key),
                Limit::perDay(200)->by('ai-day:'.$key),
            ];
        });
    }
}
