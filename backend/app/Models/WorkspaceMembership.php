<?php

namespace App\Models;

use App\Enums\WorkspaceRole;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * A user's membership of a workspace, exposed on both sides as `->membership`.
 *
 * @property WorkspaceRole $role
 */
class WorkspaceMembership extends Pivot
{
    protected $table = 'workspace_user';

    public $incrementing = true;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => WorkspaceRole::class,
        ];
    }
}
