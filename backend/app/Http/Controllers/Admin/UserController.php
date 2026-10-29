<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\SortsQueries;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    use SortsQueries;

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->trim();

        $users = User::query()
            ->withCount('workspaces')
            ->when($search->isNotEmpty(), fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->whereLike('name', "%{$search}%")->orWhereLike('email', "%{$search}%");
            }))
            ->when($request->filled('type'), fn (Builder $query) => $query->where('is_admin', $request->string('type')->toString() === 'admin'))
            ->when($request->filled('status'), fn (Builder $query) => $query->where('is_active', $request->string('status')->toString() === 'active'));

        return UserResource::collection(
            $this->applySort($users, $request, ['name', 'email', 'last_login_at', 'created_at'])->paginate($this->perPage($request))
        );
    }

    public function activate(User $user): JsonResponse
    {
        $user->update(['is_active' => true]);

        return $this->successWithData(new UserResource($user), 'User activated');
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        abort_if($user->is($request->user()), 422, 'You cannot deactivate your own account.');

        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return $this->successWithData(new UserResource($user), 'User deactivated');
    }
}
