<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait SortsQueries
{
    /**
     * Apply `sort_by` / `sort_order` from the datatable, limited to an allowlist.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  list<string>  $sortable
     * @return Builder<TModel>
     */
    protected function applySort(Builder $query, Request $request, array $sortable, string $default = 'created_at', string $defaultOrder = 'desc'): Builder
    {
        $column = in_array($request->string('sort_by')->toString(), $sortable, true) ? $request->string('sort_by')->toString() : $default;
        $order = $request->string('sort_order')->lower()->toString() === 'asc' ? 'asc' : ($request->filled('sort_by') ? 'desc' : $defaultOrder);

        return $query->orderBy($column, $order);
    }

    protected function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 10), 1), 100);
    }
}
