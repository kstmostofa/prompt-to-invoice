<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * The first platform admin on a fresh install (the seeder only creates the
 * demo admin outside production). Promotes an existing account if the email
 * is already registered.
 */
class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {email : The admin\'s email address} {--name= : Display name for a new account}';

    protected $description = 'Create a platform admin, or promote an existing user';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));

        if (Validator::make(['email' => $email], ['email' => ['required', 'email']])->fails()) {
            $this->components->error('That is not a valid email address.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();

        if ($user !== null) {
            $user->forceFill(['is_admin' => true, 'is_active' => true])->save();
            $this->components->info("{$email} is now a platform admin.");

            return self::SUCCESS;
        }

        $name = $this->option('name') ?: text('Name', default: 'Platform Admin', required: true);
        $secret = password('Password', required: true, validate: fn (string $value): ?string => Validator::make(
            ['password' => $value],
            ['password' => [Password::defaults()]],
        )->errors()->first('password') ?: null);

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $secret,
        ])->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();

        $this->components->info("Platform admin {$email} created. Sign in at the app's /login.");

        return self::SUCCESS;
    }
}
