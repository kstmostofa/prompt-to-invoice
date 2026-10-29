<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\InvoiceDraftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceGenerationController extends Controller
{
    /**
     * A draft from a description of the work. Nothing is saved.
     */
    public function __invoke(Request $request, InvoiceDraftService $drafts): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        try {
            $draft = $drafts->generate(trim($validated['prompt']), $request->user());
        } catch (AiUnavailableException $e) {
            return response()->json([
                'success' => false,
                'code' => 'ai_unavailable',
                'reason' => $e->reason,
                'message' => $e->getMessage(),
            ], 503);
        }

        return response()->json(['data' => $draft]);
    }
}
