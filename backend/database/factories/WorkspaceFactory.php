<?php

namespace Database\Factories;

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceStatus;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Workspace>
 */
class WorkspaceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(6)),
            'owner_id' => User::factory(),
            'plan_id' => null,
            'status' => WorkspaceStatus::Active,
        ];
    }

    /**
     * Attach the owner as a member and make it their current workspace.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Workspace $workspace): void {
            $workspace->members()->syncWithoutDetaching([$workspace->owner_id => ['role' => WorkspaceRole::Owner->value]]);
            $workspace->owner()->whereNull('current_workspace_id')->update(['current_workspace_id' => $workspace->id]);
        });
    }

    public function suspended(): static
    {
        return $this->state(fn () => [
            'status' => WorkspaceStatus::Suspended,
            'suspended_at' => now(),
        ]);
    }
}
