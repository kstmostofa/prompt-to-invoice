<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\Support\CurrentWorkspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    public function show(CurrentWorkspace $current): JsonResponse
    {
        $workspace = $current->get()->load('plan')->loadCount(['members', 'clients']);

        return response()->json([
            'data' => [
                ...(new WorkspaceResource($workspace))->resolve(),
                'role' => $current->role()?->value,
            ],
        ]);
    }

    public function update(UpdateWorkspaceRequest $request, CurrentWorkspace $current): JsonResponse
    {
        $workspace = $current->get();
        $workspace->update($request->validated());

        return $this->successWithData(new WorkspaceResource($workspace), 'Workspace updated');
    }

    /**
     * Make another of the user's workspaces their current one.
     */
    public function switch(Request $request, Workspace $workspace): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->roleIn($workspace) !== null, 404);

        $user->forceFill(['current_workspace_id' => $workspace->id])->save();

        return $this->successWithData(new WorkspaceResource($workspace), 'Workspace switched');
    }
}
