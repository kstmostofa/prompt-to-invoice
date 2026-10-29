<?php

namespace App\Services;

use App\Enums\WorkspaceRole;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Sign up: the user, their workspace on the free plan, and a default
     * business profile, in one transaction.
     *
     * @param  array{name: string, email: string, password: string, workspace_name: string, currency?: string|null}  $data
     */
    public function register(array $data): JsonResponse
    {
        $user = DB::transaction(function () use ($data): User {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            $workspace = $this->createWorkspace($user, $data['workspace_name']);

            $workspace->businessProfiles()->create([
                'name' => $data['workspace_name'],
                'email' => $data['email'],
                'currency' => $data['currency'] ?? 'USD',
                'is_default' => true,
            ]);

            return $user;
        });

        // A mail failure must not lose the signup; the banner offers a resend.
        rescue(fn () => $user->sendEmailVerificationNotification(), report: true);

        return $this->tokenResponse($user, 'Registration successful', Response::HTTP_CREATED);
    }

    /**
     * @param  array{email: string, password: string}  $credentials
     */
    public function login(array $credentials): JsonResponse
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Checked only once the password is right, so a wrong guess learns
        // nothing about the account.
        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated. Contact support to restore it.'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $this->tokenResponse($user, 'Login successful');
    }

    public function logout(User $user): JsonResponse
    {
        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }

    public function createWorkspace(User $owner, string $name): Workspace
    {
        $workspace = Workspace::query()->create([
            'name' => $name,
            'slug' => $this->uniqueSlug($name),
            'owner_id' => $owner->id,
            'plan_id' => Plan::query()->where('slug', 'starter')->value('id'),
        ]);

        $workspace->members()->attach($owner->id, ['role' => WorkspaceRole::Owner->value]);
        $owner->forceFill(['current_workspace_id' => $workspace->id])->save();

        return $workspace;
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'workspace';
        $slug = $base;

        while (Workspace::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.Str::lower(Str::random(5));
        }

        return $slug;
    }

    private function tokenResponse(User $user, string $message, int $status = Response::HTTP_OK): JsonResponse
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => $message,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user->load('workspaces')),
        ], $status);
    }
}
