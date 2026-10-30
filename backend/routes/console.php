<?php

use Illuminate\Support\Facades\Schedule;

/*
| Housekeeping. Production runs `php artisan schedule:run` every minute
| (cron) next to a queue worker; see docs/deployment.md.
*/

Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('auth:clear-resets')->everyFifteenMinutes();
Schedule::command('queue:prune-failed --hours=720')->daily();
Schedule::command('cache:prune-stale-tags')->hourly()->when(fn (): bool => config('cache.default') === 'redis');
