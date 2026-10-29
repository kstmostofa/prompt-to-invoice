<?php

namespace App\Support;

use App\Enums\WorkspaceRole;
use App\Models\Workspace;
use LogicException;

/**
 * The workspace the current request acts in.
 *
 * Set once per request by the `workspace` middleware. Every model that uses
 * BelongsToWorkspace reads it to scope queries and to stamp new rows, so a
 * request can never see or write another workspace's data.
 */
class CurrentWorkspace
{
    private ?Workspace $workspace = null;

    private ?WorkspaceRole $role = null;

    public function set(Workspace $workspace, WorkspaceRole $role): void
    {
        $this->workspace = $workspace;
        $this->role = $role;
    }

    public function forget(): void
    {
        $this->workspace = null;
        $this->role = null;
    }

    public function check(): bool
    {
        return $this->workspace !== null;
    }

    public function id(): ?int
    {
        return $this->workspace?->id;
    }

    public function get(): Workspace
    {
        return $this->workspace ?? throw new LogicException('No workspace has been resolved for this request.');
    }

    public function role(): ?WorkspaceRole
    {
        return $this->role;
    }
}
