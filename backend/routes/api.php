<?php

use App\Http\Controllers\Admin\AiSettingsController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\PlanController as AdminPlanController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\WorkspaceController as AdminWorkspaceController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\VerificationController;
use App\Http\Controllers\PublicInvoiceController;
use App\Http\Controllers\Workspace\BillingController;
use App\Http\Controllers\Workspace\BusinessProfileController;
use App\Http\Controllers\Workspace\ClientController;
use App\Http\Controllers\Workspace\DashboardController;
use App\Http\Controllers\Workspace\InvoiceController;
use App\Http\Controllers\Workspace\InvoiceGenerationController;
use App\Http\Controllers\Workspace\WorkspaceController;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| One database. Workspace routes run behind the `workspace` middleware, which
| scopes every BelongsToWorkspace query to the caller's workspace. Admin
| routes are for platform staff and see across workspaces. The Stripe
| webhook is Cashier's own route: POST /stripe/webhook.
|
*/

Route::get('/', fn () => ['message' => 'PromptToInvoice API']);

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    // Public: plan catalogue for the pricing and signup pages.
    Route::get('/plans', fn () => PlanResource::collection(
        Plan::query()->where('is_active', true)->orderBy('sort_order')->get(),
    ));

    // Public: the client's view of a sent invoice, by its token.
    Route::prefix('public/invoices/{token}')->controller(PublicInvoiceController::class)->middleware('throttle:60,1,public-invoice')->group(function (): void {
        Route::get('/', 'show');
        Route::get('/pdf', 'pdf');
    });

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1,register');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1,login');
        Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:5,1,forgot-password');
        Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:10,1,reset-password');
        Route::get('/verify-email/{id}/{hash}', [VerificationController::class, 'verify'])
            ->middleware(['signed', 'throttle:6,1,verify-email'])
            ->name('verification.verify');

        Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
            Route::get('/user', [AuthController::class, 'user']);
            Route::put('/user', [AuthController::class, 'update']);
            Route::put('/user/password', [PasswordController::class, 'change'])->middleware('throttle:10,1,change-password');
            Route::post('/email/verification-notification', [VerificationController::class, 'resend'])->middleware('throttle:3,1,resend-verification');
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::post('/workspaces/{workspace}/switch', [WorkspaceController::class, 'switch']);

        Route::middleware('workspace')->group(function (): void {
            Route::get('/dashboard', DashboardController::class);
            Route::get('/workspace', [WorkspaceController::class, 'show']);

            Route::get('/clients/options', [ClientController::class, 'options']);
            Route::apiResource('clients', ClientController::class);

            Route::get('/invoices/defaults', [InvoiceController::class, 'defaults']);
            Route::post('/invoices/generate', InvoiceGenerationController::class)->middleware('throttle:ai');
            Route::apiResource('invoices', InvoiceController::class);
            Route::prefix('/invoices/{invoice}')->controller(InvoiceController::class)->group(function (): void {
                Route::post('/send', 'markSent');
                Route::post('/email', 'email')->middleware('throttle:20,1,email-invoice');
                Route::post('/mark-paid', 'markPaid');
                Route::post('/mark-unpaid', 'markUnpaid');
                Route::post('/void', 'void');
                Route::post('/duplicate', 'duplicate');
                Route::get('/pdf', 'pdf');
            });

            Route::get('/business-profile', [BusinessProfileController::class, 'show']);

            Route::middleware('workspace.manager')->group(function (): void {
                Route::put('/workspace', [WorkspaceController::class, 'update']);
                Route::put('/business-profile', [BusinessProfileController::class, 'update']);
                Route::post('/business-profile/logo', [BusinessProfileController::class, 'uploadLogo']);
                Route::delete('/business-profile/logo', [BusinessProfileController::class, 'deleteLogo']);

                Route::get('/billing', [BillingController::class, 'show']);
                Route::post('/billing/checkout', [BillingController::class, 'checkout'])->middleware('throttle:10,1,billing');
                Route::post('/billing/portal', [BillingController::class, 'portal'])->middleware('throttle:10,1,billing');
            });
        });

        Route::prefix('admin')->middleware('admin')->group(function (): void {
            Route::get('/dashboard', AdminDashboardController::class);

            Route::get('/workspaces', [AdminWorkspaceController::class, 'index']);
            Route::get('/workspaces/{workspace}', [AdminWorkspaceController::class, 'show']);
            Route::post('/workspaces/{workspace}/suspend', [AdminWorkspaceController::class, 'suspend']);
            Route::post('/workspaces/{workspace}/activate', [AdminWorkspaceController::class, 'activate']);
            Route::put('/workspaces/{workspace}/plan', [AdminWorkspaceController::class, 'changePlan']);

            Route::get('/users', [AdminUserController::class, 'index']);
            Route::post('/users/{user}/activate', [AdminUserController::class, 'activate']);
            Route::post('/users/{user}/deactivate', [AdminUserController::class, 'deactivate']);

            Route::get('/ai', [AiSettingsController::class, 'show']);
            Route::put('/ai', [AiSettingsController::class, 'update']);
            Route::post('/ai/test', [AiSettingsController::class, 'test'])->middleware('throttle:10,1,ai-test');

            Route::apiResource('plans', AdminPlanController::class)->except('show')->names('admin.plans');
        });
    });
});
