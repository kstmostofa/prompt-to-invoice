<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Concerns\SortsQueries;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    use SortsQueries;

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->trim();

        $clients = Client::query()
            ->when($search->isNotEmpty(), fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->whereLike('name', "%{$search}%")
                    ->orWhereLike('company', "%{$search}%")
                    ->orWhereLike('email', "%{$search}%");
            }))
            ->when($request->filled('currency'), fn (Builder $query) => $query->where('currency', $request->string('currency')->toString()));

        return ClientResource::collection(
            $this->applySort($clients, $request, ['name', 'company', 'email', 'country', 'created_at'])->paginate($this->perPage($request))
        );
    }

    /**
     * Every client as id + name, for pickers.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => Client::query()->orderBy('name')->get(['id', 'name', 'company', 'email', 'currency']),
        ]);
    }

    public function store(ClientRequest $request): JsonResponse
    {
        $client = Client::query()->create($request->validated());

        return $this->successWithData(new ClientResource($client), 'Client created', 201);
    }

    public function show(Client $client): ClientResource
    {
        return new ClientResource($client);
    }

    public function update(ClientRequest $request, Client $client): JsonResponse
    {
        $client->update($request->validated());

        return $this->successWithData(new ClientResource($client), 'Client updated');
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return $this->success('Client deleted');
    }
}
