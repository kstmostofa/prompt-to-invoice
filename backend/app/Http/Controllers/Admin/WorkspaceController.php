<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WorkspaceStatus;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Http\Controllers\Controller;
use App\Http\Resources\BusinessProfileResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class WorkspaceController extends Controller
{
    use SortsQueries;

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->trim();

        $workspaces = Workspace::query()
            ->with(['plan', 'owner'])
            ->withCount(['members', 'clients'])
            ->when($search->isNotEmpty(), fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->whereLike('name', "%{$search}%")
                    ->orWhereLike('slug', "%{$search}%")
                    ->orWhereHas('owner', fn (Builder $owner) => $owner->whereLike('email', "%{$search}%"));
            }))
            ->when($request->filled('status'), fn (Builder $query) => $query->whereIn('status', explode(',', $request->string('status')->toString())))
            ->when($request->filled('plan'), fn (Builder $query) => $query->whereHas('plan', fn (Builder $plan) => $plan->whereIn('slug', explode(',', $request->string('plan')->toString()))));

        return WorkspaceResource::collection(
            $this->applySort($workspaces, $request, ['name', 'status', 'created_at'])->paginate($this->perPage($request))
        );
    }

    public function show(Workspace $workspace): JsonResponse
    {
        $workspace->load(['plan', 'owner', 'members', 'defaultBusinessProfile'])->loadCount(['members', 'clients']);

        return response()->json([
            'data' => [
                ...(new WorkspaceResource($workspace))->resolve(),
                'members' => $workspace->members->map(fn ($member) => [
                    ...(new UserResource($member))->resolve(),
                    'role' => $member->membership?->role,
                ]),
                'business_profile' => $workspace->defaultBusinessProfile
                    ? (new BusinessProfileResource($workspace->defaultBusinessProfile))->resolve()
                    : null,
            ],
        ]);
    }

    public function suspend(Workspace $workspace): JsonResponse
    {
        $workspace->update(['status' => WorkspaceStatus::Suspended, 'suspended_at' => now()]);

        return $this->successWithData(new WorkspaceResource($workspace), 'Workspace suspended');
    }

    public function activate(Workspace $workspace): JsonResponse
    {
        $workspace->update(['status' => WorkspaceStatus::Active, 'suspended_at' => null]);

        return $this->successWithData(new WorkspaceResource($workspace), 'Workspace activated');
    }

    public function changePlan(Request $request, Workspace $workspace): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => ['required', Rule::exists('plans', 'id')],
        ]);

        $workspace->update($validated);

        return $this->successWithData(new WorkspaceResource($workspace->load('plan')), 'Plan changed');
    }
}
