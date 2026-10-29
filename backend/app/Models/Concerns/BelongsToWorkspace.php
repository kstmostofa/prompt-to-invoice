<?php

namespace App\Models\Concerns;

use App\Models\Workspace;
use App\Support\CurrentWorkspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Single-database tenancy: rows carry a workspace_id.
 *
 * While a workspace is resolved, every query is limited to it (so route model
 * binding answers 404 for another workspace's id) and new rows are stamped
 * with it. Outside a workspace (admin portal, console, seeders) no scope is
 * applied.
 */
trait BelongsToWorkspace
{
    public static function bootBelongsToWorkspace(): void
    {
        static::addGlobalScope('workspace', function (Builder $builder): void {
            $current = app(CurrentWorkspace::class);

            if ($current->check()) {
                $builder->where($builder->getModel()->qualifyColumn('workspace_id'), $current->id());
            }
        });

        static::creating(function ($model): void {
            $current = app(CurrentWorkspace::class);

            if ($current->check() && $model->workspace_id === null) {
                $model->workspace_id = $current->id();
            }
        });
    }

    /**
     * @return BelongsTo<Workspace, $this>
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
