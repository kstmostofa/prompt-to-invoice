<?php

namespace App\Enums;

enum WorkspaceRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Member = 'member';

    /**
     * Owners and admins manage the workspace's settings and team.
     */
    public function canManage(): bool
    {
        return $this !== self::Member;
    }
}
