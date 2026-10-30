<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\BusinessProfileRequest;
use App\Http\Resources\BusinessProfileResource;
use App\Models\BusinessProfile;
use App\Support\CurrentWorkspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The workspace's default business profile: what every invoice is issued from.
 */
class BusinessProfileController extends Controller
{
    public function show(CurrentWorkspace $current): BusinessProfileResource
    {
        return new BusinessProfileResource($this->profile($current));
    }

    public function update(BusinessProfileRequest $request, CurrentWorkspace $current): JsonResponse
    {
        $profile = $this->profile($current);
        $profile->update($request->validated());

        return $this->successWithData(new BusinessProfileResource($profile), 'Business profile updated');
    }

    public function uploadLogo(Request $request, CurrentWorkspace $current): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $profile = $this->profile($current);
        $previous = $profile->logo_path;

        $profile->update([
            'logo_path' => $request->file('logo')->store("workspaces/{$current->id()}/logos", config('filesystems.logo_disk')),
        ]);

        if ($previous) {
            BusinessProfile::logoDisk()->delete($previous);
        }

        return $this->successWithData(new BusinessProfileResource($profile), 'Logo uploaded');
    }

    public function deleteLogo(CurrentWorkspace $current): JsonResponse
    {
        $profile = $this->profile($current);

        if ($profile->logo_path) {
            BusinessProfile::logoDisk()->delete($profile->logo_path);
            $profile->update(['logo_path' => null]);
        }

        return $this->successWithData(new BusinessProfileResource($profile), 'Logo removed');
    }

    private function profile(CurrentWorkspace $current): BusinessProfile
    {
        return BusinessProfile::query()->where('is_default', true)->first()
            ?? BusinessProfile::query()->create([
                'name' => $current->get()->name,
                'is_default' => true,
            ])->fresh();
    }
}
