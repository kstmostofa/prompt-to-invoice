<?php

namespace App\Http\Resources;

use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Workspace */
class WorkspaceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'status' => $this->status,
            'suspended_at' => $this->suspended_at,
            // The viewer's role, when loaded through their memberships.
            'role' => $this->whenPivotLoadedAs('membership', 'workspace_user', fn () => $this->membership?->role),
            'plan' => new PlanResource($this->whenLoaded('plan')),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ]),
            'members_count' => $this->whenCounted('members'),
            'clients_count' => $this->whenCounted('clients'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
