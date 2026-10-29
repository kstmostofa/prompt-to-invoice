<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\SortsQueries;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PlanRequest;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlanController extends Controller
{
    use SortsQueries;

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->trim();

        $plans = Plan::query()
            ->withCount('workspaces')
            ->when($search->isNotEmpty(), fn ($query) => $query->whereLike('name', "%{$search}%"));

        return PlanResource::collection(
            $this->applySort($plans, $request, ['name', 'monthly_price', 'sort_order'], 'sort_order', 'asc')->paginate($this->perPage($request))
        );
    }

    public function store(PlanRequest $request): JsonResponse
    {
        $plan = Plan::query()->create($request->validated());

        return $this->successWithData(new PlanResource($plan), 'Plan created', 201);
    }

    public function update(PlanRequest $request, Plan $plan): JsonResponse
    {
        $plan->update($request->validated());

        return $this->successWithData(new PlanResource($plan), 'Plan updated');
    }

    public function destroy(Plan $plan): JsonResponse
    {
        abort_if($plan->workspaces()->exists(), 422, 'This plan still has workspaces on it.');

        $plan->delete();

        return $this->success('Plan deleted');
    }
}
