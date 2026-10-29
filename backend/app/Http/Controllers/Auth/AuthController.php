<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService) {}

    /**
     * @unauthenticated
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        /** @var array{name: string, email: string, password: string, workspace_name: string, currency?: string|null} $data */
        $data = $request->validated();

        return $this->authService->register($data);
    }

    /**
     * @unauthenticated
     */
    public function login(LoginRequest $request): JsonResponse
    {
        /** @var array{email: string, password: string} $credentials */
        $credentials = $request->validated();

        return $this->authService->login($credentials);
    }

    public function user(Request $request): UserResource
    {
        return new UserResource($request->user()->load('workspaces'));
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());

        return $this->successWithData(new UserResource($request->user()), 'Profile updated');
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->authService->logout($request->user());
    }
}
